import { execSync } from "child_process";

/**
 * ZombieHunter - Cleans up orphaned processes to ensure clean dashboard server startup
 */
export class ZombieHunter {
  /**
   * Kill any processes using the specified port
   */
  static clean(port: number): void {
    try {
      // Platform-specific port cleanup
      if (process.platform === "win32") {
        // Windows: Find and kill processes using the port
        try {
          const output = execSync(`netstat -ano | findstr :${port}`, {
            encoding: "utf-8",
          });
          const lines = output.split("\n").filter((line) => line.trim());

          for (const line of lines) {
            const parts = line.trim().split(/\s+/);
            const pid = parts[parts.length - 1];
            if (pid && !isNaN(parseInt(pid))) {
              try {
                execSync(`taskkill /F /PID ${pid}`, { stdio: "ignore" });
                console.log(`   🧹 Killed zombie process ${pid} on port ${port}`);
              } catch {
                // Process may have already exited
              }
            }
          }
        } catch {
          // No processes found using the port
        }
      } else {
        // macOS/Linux: Use lsof to find and kill processes
        try {
          const output = execSync(`lsof -ti:${port}`, {
            encoding: "utf-8",
          });
          const pids = output.split("\n").filter((line) => line.trim());

          for (const pid of pids) {
            if (pid) {
              try {
                execSync(`kill -9 ${pid}`, { stdio: "ignore" });
                console.log(`   🧹 Killed zombie process ${pid} on port ${port}`);
              } catch {
                // Process may have already exited
              }
            }
          }
        } catch {
          // No processes found using the port
        }
      }
    } catch (error) {
      // Non-fatal: if cleanup fails, the server start will report the real error
      console.warn(`   ⚠️  ZombieHunter cleanup warning: ${error}`);
    }
  }
}
