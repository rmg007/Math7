import chalk from 'chalk';
import { execSync } from 'child_process';

/**
 * ZombieHunter: Ensures the workspace is clean before starting heavy analysis.
 * Prevents deadlocks, port conflicts, and memory leaks from orphaned processes.
 */
export class ZombieHunter {
  /**
   * Cleans up the environment. Returns true if successful.
   */
  static clean(port: number): boolean {
    console.log(chalk.gray('  🛡️  ZombieHunter: Sterilizing workspace...'));
    
    try {
      this.killPort(port);
      this.killOrphanedAnalyzers();
      return true;
    } catch (err: any) {
      console.warn(chalk.yellow(`  ⚠️  ZombieHunter warning: ${err.message}`));
      return false;
    }
  }

  /**
   * Force-kills any process occupying the dashboard port.
   */
  private static killPort(port: number) {
    try {
      if (process.platform === 'win32') {
        // Find PID on port
        const cmd = `Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }`;
        execSync(`powershell -NoProfile -Command "${cmd}"`);
      } else {
        execSync(`lsof -t -i:${port} | xargs kill -9 2>/dev/null || true`);
      }
    } catch {
      // Ignore if port is already free
    }
  }

  /**
   * Kills any other Cortex processes (run.ts via tsx/node) to prevent db locks.
   */
  private static killOrphanedAnalyzers() {
    try {
      if (process.platform === 'win32') {
        const currentPid = process.pid;
        // 1. Kill any leftover Dart/Flutter (never needed)
        execSync(`powershell -NoProfile -Command "Get-Process dart, flutter -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue"`);
        
        // 2. Kill other Cortex node processes
        // We look for node processes that HAVE 'questerix-cortex' in the path/cmdline but are NOT this PID
        const cmd = `Get-CimInstance Win32_Process -Filter \\"Name = 'node.exe'\\" | ForEach-Object { if ($_.CommandLine -like '*questerix-cortex*' -and $_.ProcessId -ne ${currentPid}) { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue } }`;
        execSync(`powershell -NoProfile -Command "${cmd}"`);
      } else {
        execSync(`pgrep -f "questerix-cortex|dart|flutter" | grep -v ${process.pid} | xargs kill -9 2>/dev/null || true`);
      }
    } catch { /* skip */ }
  }
}
