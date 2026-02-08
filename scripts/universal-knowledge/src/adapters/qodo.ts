import * as fs from 'fs';
import * as path from 'path';
import { IDEAdapter, IDEContext, SearchResult, SearchOptions } from '../types.js';
import { UniversalKnowledgeClient } from '../client.js';

export class QodoAdapter implements IDEAdapter {
  name = 'Qodo';
  private knowledgeClient: UniversalKnowledgeClient;
  private workspacePath: string;

  constructor(workspacePath: string) {
    this.workspacePath = workspacePath;
    this.knowledgeClient = UniversalKnowledgeClient.getInstance();
  }

  detect(): boolean {
    return process.env.QODO_ENV === 'true' ||
      process.env.QODO_VERSION !== undefined ||
      this.checkForQodoConfigSync();
  }

  private checkForQodoConfigSync(): boolean {
    try {
      const qodoConfigPath = path.join(this.workspacePath, 'QODO_GUIDE.md');
      fs.accessSync(qodoConfigPath);
      return true;
    } catch {
      return false;
    }
  }

  async initialize(): Promise<void> {
    console.log('Initializing Qodo adapter...');

    // Load QODO_GUIDE.md and related knowledge
    await this.loadKnowledgeBase();

    // Set up Qodo-specific configurations
    await this.setupQodoConfig();
  }

  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    console.log(`Searching via Qodo adapter: "${query}"`);

    return await this.knowledgeClient.search(query, {
      ...options,
      filter_by_file: [
        ... (options.filter_by_file || []),
        'QODO_GUIDE.md',
        'docs/',
        'student-app/',
        'admin-panel/',
        'content-engine/'
      ]
    });
  }

  async getContext(): Promise<IDEContext> {
    return {
      name: this.name,
      version: await this.getQodoVersion(),
      platform: process.platform,
      workspace_path: this.workspacePath,
      config_files: [
        'QODO_GUIDE.md',
        '.qodo/',
        'package.json'
      ],
      capabilities: [
        'semantic_search',
        'code_review',
        'test_generation',
        'documentation_generation'
      ]
    };
  }

  private async loadKnowledgeBase(): Promise<void> {
    try {
      // Load QODO_GUIDE.md
      const qodoGuidePath = path.join(this.workspacePath, 'QODO_GUIDE.md');
      try {
        fs.accessSync(qodoGuidePath);
        console.log('Found QODO_GUIDE.md file');
      } catch {
        console.log('QODO_GUIDE.md file not found');
      }

      // Load .qodo directory if it exists
      const qodoDir = path.join(this.workspacePath, '.qodo');
      try {
        const qodoFiles = fs.readdirSync(qodoDir);
        console.log(`Found .qodo directory with files: ${qodoFiles.join(', ')}`);
      } catch {
        console.log('.qodo directory not found');
      }
    } catch (error) {
      console.error('Error loading Qodo knowledge base:', error);
    }
  }

  private async setupQodoConfig(): Promise<void> {
    const config = {
      'qodo.semanticSearch.enabled': true,
      'qodo.knowledgeBase.universal': true,
      'qodo.codeReview.enhanced': true
    };

    console.log('Qodo configuration set up:', config);
  }

  private async getQodoVersion(): Promise<string> {
    return process.env.QODO_VERSION || 'unknown';
  }

  async cleanup(): Promise<void> {
    console.log('Cleaning up Qodo adapter...');
  }
}
