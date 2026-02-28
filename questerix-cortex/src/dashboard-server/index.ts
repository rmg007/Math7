import express from "express";
import * as fs from "fs";
import { createServer } from "http";
import * as path from "path";
import { Server } from "socket.io";
import type { SmokeCheckResult, VerifyDeployHistory, VerifyDeployResult } from "../verify-deploy";

export interface DashboardServerOptions {
  port: number;
  staticPath: string;
  onTriggerRun?: (target: string) => void;
  onVerifyDeploy?: (targetUrl: string) => void;
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

export interface VerifyDeployProgressPayload {
  targetUrl: string;
  status: "running" | "passed" | "failed";
  checks: SmokeCheckResult[];
  latestCheck?: SmokeCheckResult;
  message?: string;
  startTime: string;
}

export interface VerifyDeployCompletePayload {
  result: VerifyDeployResult;
  history: VerifyDeployHistory[];
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
  private verifyDeployHistory: VerifyDeployHistory[] = [];
  private historyPath: string;
  private logs: LogItem[] = [];

  constructor(options: DashboardServerOptions, historyDir?: string) {
    this.options = options;
    this.app = express();
    this.server = createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    // Persist history to disk so it survives server restarts
    this.historyPath = path.join(historyDir ?? __dirname, "verify-deploy-history.json");
    this.loadHistory();

    this.setupRoutes();
    this.setupSocketHandlers();
  }

  // ── Public API ──────────────────────────────────────────────────────────────

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
    this.logs.push(item);
    if (this.logs.length > 200) this.logs = this.logs.slice(-200);
    this.io.emit("log", item);
  }

  /**
   * Emit an update with full result payload
   */
  emitUpdate(payload: UpdatePayload): void {
    this.io.emit("update", payload);
  }

  /**
   * Emit a live verify-deploy progress update (streaming)
   */
  emitVerifyDeployProgress(payload: VerifyDeployProgressPayload): void {
    this.io.emit("verifyDeployProgress", payload);
  }

  /**
   * Emit the final verify-deploy result and persist to history
   */
  emitVerifyDeployComplete(result: VerifyDeployResult): void {
    const record: VerifyDeployHistory = {
      id: `vd-${Date.now()}`,
      targetUrl: result.targetUrl,
      timestamp: result.startTime,
      passed: result.passed,
      passedChecks: result.passedChecks,
      totalChecks: result.totalChecks,
      durationMs: result.durationMs,
    };

    this.verifyDeployHistory.unshift(record);
    // Keep last 50 records
    if (this.verifyDeployHistory.length > 50) {
      this.verifyDeployHistory = this.verifyDeployHistory.slice(0, 50);
    }
    this.saveHistory();

    const payload: VerifyDeployCompletePayload = {
      result,
      history: this.verifyDeployHistory,
    };
    this.io.emit("verifyDeployComplete", payload);
  }

  /**
   * Get verify-deploy history
   */
  getVerifyHistory(): VerifyDeployHistory[] {
    return this.verifyDeployHistory;
  }

  /**
   * Check if the server is currently running
   */
  getIsRunning(): boolean {
    return this.isRunning;
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  private loadHistory(): void {
    try {
      if (fs.existsSync(this.historyPath)) {
        const raw = fs.readFileSync(this.historyPath, "utf-8");
        this.verifyDeployHistory = JSON.parse(raw);
      }
    } catch {
      this.verifyDeployHistory = [];
    }
  }

  private saveHistory(): void {
    try {
      const dir = path.dirname(this.historyPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(this.historyPath, JSON.stringify(this.verifyDeployHistory, null, 2), "utf-8");
    } catch {
      // Best-effort — non-fatal
    }
  }

  private setupRoutes(): void {
    // REST endpoint to query history
    this.app.get("/api/verify-deploy/history", (_req, res) => {
      res.json(this.verifyDeployHistory);
    });

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

      // Replay recent logs for the newly connected client
      if (this.logs.length > 0) {
        socket.emit("logs", this.logs);
      }

      // Send verify-deploy history on connect
      if (this.verifyDeployHistory.length > 0) {
        socket.emit("verifyDeployHistory", this.verifyDeployHistory);
      }

      // Handle trigger events from browser
      socket.on("trigger", (data: { target?: string } | string) => {
        // Accept both legacy string format and new object format
        const target = typeof data === "string" ? data : (data?.target ?? "all");
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

      // Handle verify-deploy event from browser
      socket.on("verifyDeploy", (data: { targetUrl?: string }) => {
        const targetUrl = data?.targetUrl ?? "https://admin.questerix.com";
        console.log(`   🔍 Verify Deploy triggered: ${targetUrl}`);

        if (this.options.onVerifyDeploy) {
          this.options.onVerifyDeploy(targetUrl);
        }
      });

      socket.on("disconnect", () => {
        console.log(`   👋 Client disconnected: ${socket.id}`);
      });
    });
  }
}
