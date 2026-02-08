import * as fs from 'fs';
import * as path from 'path';
import { IDEAdapter, IDEContext, SearchResult, SearchOptions } from '../types.js';
import { UniversalKnowledgeClient } from '../client.js';

export class CursorAdapter implements IDEAdapter {
  name = 'Cursor';
  private knowledgeClient: UniversalKnowledgeClient;
  private workspacePath: string;

  constructor(workspacePath: string) {
    this.workspacePath = workspacePath;
    this.knowledgeClient = UniversalKnowledgeClient.getInstance();
  }

  detect(): boolean {
    // Check if we're running in Cursor environment
    return process.env.CURSOR_ENV === 'true' ||
      process.env.VSCODE_PID !== undefined ||
      this.checkForCursorAppSync();
  }

  private checkForCursorAppSync(): boolean {
    try {
      if (process.platform === 'darwin') {
        fs.accessSync('/Applications/Cursor.app');
        return true;
      } else if (process.platform === 'win32') {
        // Check Windows registry or common installation paths
        const cursorPaths = [
          'C:\\Program Files\\Cursor\\Cursor.exe',
          'C:\\Program Files (x86)\\Cursor\\Cursor.exe',
          path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Cursor', 'Cursor.exe')
        ];

        for (const cursorPath of cursorPaths) {
          try {
            fs.accessSync(cursorPath);
            return true;
          } catch {
            continue;
          }
        }
      }
      return false;
    } catch {
      return false;
    }
  }

  async initialize(): Promise<void> {
    console.log('Initializing Cursor adapter...');

    // Load .cursorrules and AI_CODING_INSTRUCTIONS.md
    await this.loadKnowledgeBase();

    // Set up Cursor-specific configurations
    await this.setupCursorConfig();
  }

  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    console.log(`Searching via Cursor adapter: "${query}"`);

    // Use the universal knowledge client
    return await this.knowledgeClient.search(query, {
      ...options,
      filter_by_file: [
        ... (options.filter_by_file || []),
        '.cursorrules',
        'AI_CODING_INSTRUCTIONS.md',
        'docs/',
        'student-app/',
        'admin-panel/'
      ]
    });
  }

  async getContext(): Promise<IDEContext> {
    return {
      name: this.name,
      version: await this.getCursorVersion(),
      platform: process.platform,
      workspace_path: this.workspacePath,
      config_files: [
        '.cursorrules',
        'AI_CODING_INSTRUCTIONS.md',
        '.cursorrules'
      ],
      capabilities: [
        'semantic_search',
        'code_completion',
        'inline_chat',
        'command_palette'
      ]
    };
  }

  private async loadKnowledgeBase(): Promise<void> {
    try {
      // Load .cursorrules
      const cursorrulesPath = path.join(this.workspacePath, '.cursorrules');
      try {
        fs.accessSync(cursorrulesPath);
        console.log('Found .cursorrules file');
      } catch {
        console.log('.cursorrules file not found');
      }

      // Load AI_CODING_INSTRUCTIONS.md
      const instructionsPath = path.join(this.workspacePath, 'AI_CODING_INSTRUCTIONS.md');
      try {
        fs.accessSync(instructionsPath);
        console.log('Found AI_CODING_INSTRUCTIONS.md file');
      } catch {
        console.log('AI_CODING_INSTRUCTIONS.md file not found');
      }
    } catch (error) {
      console.error('Error loading knowledge base:', error);
    }
  }

  private async setupCursorConfig(): Promise<void> {
    // Set up Cursor-specific configurations
    const config = {
      'cursor.semanticSearch.enabled': true,
      'cursor.knowledgeBase.universal': true,
      'cursor.fallback.enabled': true
    };

    console.log('Cursor configuration set up:', config);
  }

  private async getCursorVersion(): Promise<string> {
    try {
      // Try to get Cursor version from various sources
      if (process.platform === 'darwin') {
        // Try to read from app bundle
        const plistPath = '/Applications/Cursor.app/Contents/Info.plist';
        try {
          const plistContent = fs.readFileSync(plistPath, 'utf-8');
          const versionMatch = plistContent.match(/<key>CFBundleShortVersionString<\/key>\s*<string>([^<]+)<\/string>/);
          if (versionMatch) {
            return versionMatch[1];
          }
        } catch {
          // Fall through to default
        }
      }

      // Default version if we can't determine it
      return 'unknown';
    } catch {
      return 'unknown';
    }
  }

  async cleanup(): Promise<void> {
    console.log('Cleaning up Cursor adapter...');
    // Clean up any resources
  }
}
