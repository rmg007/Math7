import { IDEAdapter } from './types.js';
import { CursorAdapter } from './adapters/cursor.js';
import { QodoAdapter } from './adapters/qodo.js';
import { CodespacesAdapter, AntigravityAdapter } from './adapters/codespaces.js';

export class IDEAdapterFactory {
  static create(workspacePath: string = process.cwd()): IDEAdapter {
    // Priority order of detection
    const adapters = [
      new CursorAdapter(workspacePath),
      new QodoAdapter(workspacePath),
      new CodespacesAdapter(workspacePath),
      new AntigravityAdapter(workspacePath),
    ];

    for (const adapter of adapters) {
      if (adapter.detect()) {
        console.log(`Detected IDE: ${adapter.name}`);
        return adapter;
      }
    }

    // Fallback to generic adapter
    console.log('No specific IDE detected, using generic adapter');
    return new GenericAdapter(workspacePath);
  }
}

export class GenericAdapter implements IDEAdapter {
  name = 'Generic';
  private workspacePath: string;

  constructor(workspacePath: string) {
    this.workspacePath = workspacePath;
  }

  detect(): boolean {
    return true; // Always matches as fallback
  }

  async initialize(): Promise<void> {
    console.log('Initializing generic IDE adapter...');
  }

  async search(query: string): Promise<any[]> {
    console.log(`Searching via generic adapter: "${query}"`);
    // Basic implementation - would need to be filled out
    return [];
  }

  async getContext(): Promise<any> {
    return {
      name: this.name,
      platform: process.platform,
      workspace_path: this.workspacePath,
      config_files: [],
      capabilities: ['basic_search']
    };
  }

  async cleanup(): Promise<void> {
    console.log('Cleaning up generic adapter...');
  }
}
