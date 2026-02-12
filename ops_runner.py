#!/usr/bin/env python3
"""
Local DevOps pipeline runner for Questerix project.
Executes commands from JSON manifest files without user interaction.

USAGE:
  python ops_runner.py <tasks.json>     # Execute a specific manifest
  python ops_runner.py --watch [dir]    # Watch directory for tasks.json files

The AI agent writes tasks.json, this script executes them automatically.
"""

import json
import shlex
import subprocess
import sys
import time
import datetime
from pathlib import Path

# Fix Windows console encoding for Unicode
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

try:
    from watchdog.observers import Observer
    from watchdog.events import FileSystemEventHandler
except ImportError:
    print("Warning: watchdog not installed. Watch mode will not work.")
    print("Install with: pip install watchdog")
    Observer = None
    FileSystemEventHandler = object  # Fallback for class inheritance


def execute_manifest(manifest_path: str) -> bool:
    """
    Execute commands from a JSON manifest file.
    
    Args:
        manifest_path: Path to the JSON file containing commands
        
    Returns:
        True if all commands executed successfully, False otherwise
    """
    path_obj = Path(manifest_path)
    status_path = path_obj.parent / 'tasks.status.json'
    
    try:
        with open(manifest_path, 'r', encoding='utf-8') as f:
            manifest = json.load(f)
    except FileNotFoundError:
        print(f"Error: Manifest file not found: {manifest_path}")
        return False
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in manifest file: {e}")
        return False
    
    if not isinstance(manifest, list):
        print("Error: Manifest must be a JSON array of command objects")
        return False
    
    execution_results = []
    overall_success = True
    start_time_global = time.time()
    
    print(f"\n🚀 Executing {len(manifest)} tasks from {path_obj.name}...")

    for idx, task in enumerate(manifest, 1):
        if not isinstance(task, dict):
            print(f"Warning: Task {idx} is not a dictionary, skipping")
            continue
        
        command = task.get('command')
        cwd = task.get('cwd')
        description = task.get('description', f'Task {idx}')
        
        if not command:
            print(f"Warning: Task {idx} missing 'command' field, skipping")
            continue
        
        print(f"\n[{idx}/{len(manifest)}] {description}")
        print(f"  Executing: {command}")
        if cwd:
            print(f"  Working directory: {cwd}")
        
        task_start = time.time()
        result_entry = {
            'index': idx,
            'description': description,
            'command': command,
            'cwd': cwd,
            'timestamp': datetime.datetime.now().isoformat(),
            'status': 'pending'
        }

        try:
            # SECURITY: Use shell=False to prevent shell injection attacks
            if isinstance(command, str):
                if sys.platform == 'win32':
                    cmd_args = ['powershell.exe', '-NoProfile', '-Command', command]
                else:
                    cmd_args = shlex.split(command)
            elif isinstance(command, list):
                cmd_args = command
            else:
                print(f"  ✗ Invalid command type: {type(command)}")
                result_entry['status'] = 'error'
                result_entry['error'] = 'Invalid command type'
                overall_success = False
                execution_results.append(result_entry)
                continue
            
            # Use subprocess.run to capture output for the log
            proc = subprocess.run(
                cmd_args,
                shell=False,
                cwd=cwd if cwd else None,
                capture_output=True,
                text=True,
                encoding='utf-8', # Ensure encoding is handled
                timeout=300  # 5 minute timeout
            )
            
            # Print output to console for the user to see in real-time (if watching)
            if proc.stdout:
                print(f"  > {proc.stdout.strip()[:200]}..." if len(proc.stdout) > 200 else f"  > {proc.stdout.strip()}")
            if proc.stderr:
                print(f"  ! {proc.stderr.strip()[:200]}..." if len(proc.stderr) > 200 else f"  ! {proc.stderr.strip()}")

            result_entry['exit_code'] = proc.returncode
            result_entry['stdout'] = proc.stdout
            result_entry['stderr'] = proc.stderr
            result_entry['duration_ms'] = int((time.time() - task_start) * 1000)

            if proc.returncode == 0:
                print("  ✓ Completed successfully")
                result_entry['status'] = 'success'
            else:
                print(f"  ✗ Failed with exit code {proc.returncode}")
                result_entry['status'] = 'failed'
                overall_success = False

        except subprocess.TimeoutExpired as e:
            print(f"  ✗ Command timed out after 5 minutes: {e}")
            result_entry['status'] = 'timeout'
            result_entry['error'] = f'Command timed out after 5 minutes'
            entry_duration = int((time.time() - task_start) * 1000)
            result_entry['duration_ms'] = entry_duration
            overall_success = False
        
        except Exception as e:
            print(f"  ✗ Error executing command: {e}")
            result_entry['status'] = 'error'
            result_entry['error'] = str(e)
            entry_duration = int((time.time() - task_start) * 1000)
            result_entry['duration_ms'] = entry_duration
            overall_success = False
        
        execution_results.append(result_entry)

    # Write status file
    status_report = {
        'manifest_path': str(manifest_path),
        'timestamp': datetime.datetime.now().isoformat(),
        'total_duration_ms': int((time.time() - start_time_global) * 1000),
        'overall_success': overall_success,
        'results': execution_results
    }
    
    try:
        with open(status_path, 'w', encoding='utf-8') as f:
            json.dump(status_report, f, indent=2)
        print(f"\n📝 Status written to: {status_path.name}")
    except Exception as e:
        print(f"\n⚠️ Failed to write status file: {e}")

    return overall_success


class TaskFileHandler(FileSystemEventHandler):
    """Handler for detecting new tasks.json files."""
    
    def __init__(self, watch_dir: Path):
        self.watch_dir = watch_dir
        self.processed_files = {}  # Track file path -> last modified time
    
    def on_created(self, event):
        """Handle file creation events."""
        if event.is_directory:
            return
        
        file_path = Path(event.src_path)
        if file_path.name == 'tasks.json':
            time.sleep(0.5)  # Ensure file is fully written
            self.process_file(file_path)
    
    def on_modified(self, event):
        """Handle file modification events."""
        if event.is_directory:
            return
        
        file_path = Path(event.src_path)
        if file_path.name == 'tasks.json':
            time.sleep(0.5)
            self.process_file(file_path)
    
    def process_file(self, file_path: Path):
        """Process a tasks.json file if it's new or modified."""
        abs_path = file_path.resolve()
        
        try:
            current_mtime = abs_path.stat().st_mtime
        except FileNotFoundError:
            return
        
        # Skip if already processed with same modification time
        if abs_path in self.processed_files:
            if self.processed_files[abs_path] == current_mtime:
                return
        
        print(f"\n{'='*60}")
        print(f"🚀 Detected tasks.json: {abs_path}")
        print(f"{'='*60}")
        
        success = execute_manifest(str(abs_path))
        
        if success:
            print("\n✅ All tasks completed successfully")
        else:
            print("\n❌ Some tasks failed")
        
        # Mark as processed with current modification time
        self.processed_files[abs_path] = current_mtime
        print(f"{'='*60}\n")


def watch_mode(watch_dir: str = '.'):
    """
    Watch a directory for new tasks.json files and execute them automatically.
    
    Args:
        watch_dir: Directory to watch for tasks.json files
    """
    if Observer is None:
        print("Error: Watch mode requires the 'watchdog' library.")
        print("Install it with: pip install watchdog")
        sys.exit(1)
    
    watch_path = Path(watch_dir).resolve()
    
    if not watch_path.exists():
        print(f"Error: Watch directory does not exist: {watch_path}")
        sys.exit(1)
    
    if not watch_path.is_dir():
        print(f"Error: Watch path is not a directory: {watch_path}")
        sys.exit(1)
    
    print(f"👁️  Watching directory: {watch_path}")
    print("⏳ Waiting for tasks.json files... (Press Ctrl+C to stop)\n")
    
    event_handler = TaskFileHandler(watch_path)
    observer = Observer()
    observer.schedule(event_handler, str(watch_path), recursive=True)
    observer.start()
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n\n🛑 Stopping watcher...")
        observer.stop()
    
    observer.join()
    print("Watcher stopped.")


def main():
    """Main entry point."""
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python ops_runner.py <tasks.json>     # Execute a specific manifest")
        print("  python ops_runner.py --watch [dir]    # Watch directory for tasks.json files")
        sys.exit(1)
    
    if sys.argv[1] == '--watch':
        watch_dir = sys.argv[2] if len(sys.argv) > 2 else '.'
        watch_mode(watch_dir)
    else:
        manifest_path = sys.argv[1]
        success = execute_manifest(manifest_path)
        sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
