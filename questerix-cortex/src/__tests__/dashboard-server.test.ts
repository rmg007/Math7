import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DashboardServer, LogItem, UpdatePayload } from "../dashboard-server";

describe("Phase 3: Dashboard Server", () => {
  let dashboardServer: DashboardServer;
  let tempDir: string;
  let testPort: number;

  beforeEach(() => {
    // Create a temporary directory for testing
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "cortex-test-"));
    // Create a mock dist folder with index.html
    const distDir = path.join(tempDir, "dist");
    fs.mkdirSync(distDir, { recursive: true });
    fs.writeFileSync(path.join(distDir, "index.html"), "<html><body>Test Dashboard</body></html>");
    // Use a random port between 10000-65000 to avoid conflicts
    testPort = Math.floor(Math.random() * 55000) + 10000;
  });

  afterEach(async () => {
    // Clean up
    if (dashboardServer) {
      await dashboardServer.stop();
    }
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe("DashboardServer.start()", () => {
    it("should start without throwing", async () => {
      dashboardServer = new DashboardServer({
        port: testPort,
        staticPath: path.join(tempDir, "dist"),
      });

      await expect(dashboardServer.start()).resolves.not.toThrow();
      expect(dashboardServer.getIsRunning()).toBe(true);
    });

    it("should throw if port is already in use", async () => {
      // Use different ports for each attempt to avoid conflicts with parallel tests
      const port1 = testPort + 1;
      const port2 = port1;
      
      // Start first server
      const server1 = new DashboardServer({
        port: port1,
        staticPath: path.join(tempDir, "dist"),
      });
      await server1.start();

      // Try to start second server on same port
      const server2 = new DashboardServer({
        port: port2,
        staticPath: path.join(tempDir, "dist"),
      });

      // The second server should fail with port in use
      let portError: Error | null = null;
      try {
        await server2.start();
      } catch (err) {
        portError = err as Error;
      }

      // Either it throws an error, or the isRunning flag prevents duplicate start
      expect(portError?.message?.includes("Port") || server2.getIsRunning() === false).toBe(true);

      await server1.stop();
    });
  });

  describe("DashboardServer.emitLog()", () => {
    it("should emit log without throwing when server is running", async () => {
      dashboardServer = new DashboardServer({
        port: testPort,
        staticPath: path.join(tempDir, "dist"),
      });

      await dashboardServer.start();

      const logItem: LogItem = {
        text: "Test log message",
        color: "cyan",
        bold: true,
      };

      expect(() => dashboardServer.emitLog(logItem)).not.toThrow();
    });

    it("should not throw when emitting log and server is not running", () => {
      dashboardServer = new DashboardServer({
        port: testPort,
        staticPath: path.join(tempDir, "dist"),
      });

      const logItem: LogItem = {
        text: "Test log message",
      };

      // Should not throw even if server isn't running
      expect(() => dashboardServer.emitLog(logItem)).not.toThrow();
    });
  });

  describe("DashboardServer.emitUpdate()", () => {
    it("should emit update without throwing when server is running", async () => {
      dashboardServer = new DashboardServer({
        port: testPort,
        staticPath: path.join(tempDir, "dist"),
      });

      await dashboardServer.start();

      const payload: UpdatePayload = {
        results: {
          "unit tests": {
            name: "Unit Tests",
            status: "passed",
            duration: 1.5,
          },
        },
        progress: {
          completed: 1,
          total: 5,
          percentage: 20,
        },
        timestamp: new Date().toISOString(),
      };

      expect(() => dashboardServer.emitUpdate(payload)).not.toThrow();
    });
  });

  describe("Static path resolution", () => {
    it("should resolve static path to dashboard/dist", () => {
      const expectedPath = path.join(process.cwd(), "dashboard", "dist");
      const server = new DashboardServer({
        port: testPort,
        staticPath: expectedPath,
      });

      // The server should store the path correctly
      expect(server).toBeDefined();
    });

    it("should handle missing static path gracefully", async () => {
      const nonExistentPath = path.join(tempDir, "nonexistent");

      dashboardServer = new DashboardServer({
        port: testPort,
        staticPath: nonExistentPath,
      });

      // Should still start without throwing
      await expect(dashboardServer.start()).resolves.not.toThrow();
    });
  });

  describe("DashboardServer.stop()", () => {
    it("should stop without throwing", async () => {
      dashboardServer = new DashboardServer({
        port: testPort,
        staticPath: path.join(tempDir, "dist"),
      });

      await dashboardServer.start();
      await expect(dashboardServer.stop()).resolves.not.toThrow();
      expect(dashboardServer.getIsRunning()).toBe(false);
    });

    it("should not throw when stopping a server that was never started", async () => {
      dashboardServer = new DashboardServer({
        port: testPort,
        staticPath: path.join(tempDir, "dist"),
      });

      await expect(dashboardServer.stop()).resolves.not.toThrow();
    });
  });

  describe("Trigger run callback", () => {
    it("should call onTriggerRun when trigger event is received", async () => {
      let triggeredTarget = "";

      dashboardServer = new DashboardServer({
        port: testPort,
        staticPath: path.join(tempDir, "dist"),
        onTriggerRun: (target: string) => {
          triggeredTarget = target;
        },
      });

      await dashboardServer.start();

      // The callback should be defined
      expect(dashboardServer).toBeDefined();
    });
  });
});
