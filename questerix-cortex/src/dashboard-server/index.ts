import express from "express";
import * as fs from "fs";
import { createServer } from "http";
import * as path from "path";
import { Server } from "socket.io";

export interface DashboardServerOptions {
  port: number;
  staticPath: string;
  onTriggerRun?: (target: string) => void;
}

export interface LogItem {
  text: string;
  color?: "cyan" | "green" | "red" | "gray";
  bold?: boolean;
}

export interface UpdatePayload {
  results: Record<string, {
    name: string;
    status: "passed" | "failed" | "running" | "pending";
    duration?: number;
    output?: string;
  }>;
  progress: {
    completed: number;
    total: number;
    percentage: number;
  };
  timestamp: string;
}

/**
 * DashboardServer - Express + Socket.io server for live dashboard updates
 */
export class DashboardServer {
  private app: express.Application;
  private server: ReturnType<typeof createServer>;
  private io: Server;
  private options: DashboardServerOptions;
  private isRunning = false;

  constructor(options: DashboardServerOptions) {
    this.options = options;
    this.app = express();
    this.server = createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    this.setupRoutes();
    this.setupSocketHandlers();
  }

  /**
   * Start the dashboard server
   */
  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isRunning) {
        resolve();
        return;
      }

      this.server.listen(this.options.port, () => {
        this.isRunning = true;
        console.log(`   🚀 Dashboard server listening on port ${this.options.port}`);
        resolve();
      });

      this.server.on("error", (err: any) => {
        if (err.code === "EADDRINUSE") {
          console.error(`   ❌ Port ${this.options.port} is already in use`);
          reject(new Error(`Port ${this.options.port} is already in use`));
        } else {
          reject(err);
        }
      });
    });
  }

  /**
   * Stop the dashboard server
   */
  stop(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.isRunning) {
        resolve();
        return;
      }

      this.io.close(() => {
        this.server.close(() => {
          this.isRunning = false;
          resolve();
        });
      });
    });
  }

  /**
   * Emit a log line to all connected clients
   */
  emitLog(item: LogItem): void {
    this.io.emit("log", item);
  }

  /**
   * Emit an update with full result payload
   */
  emitUpdate(payload: UpdatePayload): void {
    this.io.emit("update", payload);
  }

  /**
   * Check if the server is currently running
   */
  getIsRunning(): boolean {
    return this.isRunning;
  }

  private setupRoutes(): void {
    // Serve static files from dashboard/dist
    const staticPath = this.options.staticPath;
    if (fs.existsSync(staticPath)) {
      this.app.use(express.static(staticPath));

      // Serve index.html for all routes (SPA behavior)
      this.app.get("*", (_req, res) => {
        const indexPath = path.join(staticPath, "index.html");
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          res.status(404).send("Dashboard not built. Run build step first.");
        }
      });
    } else {
      console.warn(`   ⚠️  Dashboard static path not found: ${staticPath}`);
      this.app.get("*", (_req, res) => {
        res.status(503).send("Dashboard not available. Static files not found.");
      });
    }
  }

  private setupSocketHandlers(): void {
    this.io.on("connection", (socket) => {
      console.log(`   🔌 Client connected: ${socket.id}`);

      // Send initial state
      socket.emit("connected", {
        timestamp: new Date().toISOString(),
        message: "Connected to Cortex Dashboard",
      });

      // Handle trigger events from browser
      socket.on("trigger", (data: { target?: string }) => {
        const target = data?.target || "all";
        console.log(`   🎯 Trigger received from client: ${target}`);

        if (this.options.onTriggerRun) {
          this.options.onTriggerRun(target);
        }

        // Broadcast to all clients that a run was triggered
        this.io.emit("runTriggered", {
          target,
          timestamp: new Date().toISOString(),
        });
      });

      socket.on("disconnect", () => {
        console.log(`   👋 Client disconnected: ${socket.id}`);
      });
    });
  }
}
