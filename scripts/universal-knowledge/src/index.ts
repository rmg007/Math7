// Main entry point for Universal Knowledge Sharing System
import { config } from 'dotenv';
import { UniversalKnowledgeClient } from './client.js';
import { IDEAdapterFactory } from './adapter-factory.js';
import { ConfigManager } from './config.js';

// Load environment variables
config();

export class UniversalKnowledgeSystem {
  private client: UniversalKnowledgeClient;
  private adapter: any;

  constructor() {
    this.client = UniversalKnowledgeClient.getInstance();
    this.adapter = IDEAdapterFactory.create();
  }

  async initialize(): Promise<void> {
    console.log('🚀 Initializing Universal Knowledge Sharing System...');
    
    try {
      // Initialize IDE-specific adapter
      await this.adapter.initialize();
      
      // Test system health
      const health = await this.client.getHealthStatus();
      console.log('📊 System Health:', health);
      
      console.log('✅ Universal Knowledge Sharing System initialized successfully');
      console.log(`🔧 Active IDE: ${this.adapter.name}`);
    } catch (error) {
      console.error('❌ Failed to initialize Universal Knowledge Sharing System:', error);
      throw error;
    }
  }

  async search(query: string, options?: any): Promise<any[]> {
    try {
      return await this.adapter.search(query, options);
    } catch (error) {
      console.error('Search failed:', error);
      throw error;
    }
  }

  async getStatus(): Promise<{
    ide: any;
    health: any;
    performance: any;
  }> {
    const [ideContext, health, performance] = await Promise.all([
      this.adapter.getContext(),
      this.client.getHealthStatus(),
      this.client.getPerformanceStats()
    ]);

    return {
      ide: ideContext,
      health,
      performance
    };
  }

  async cleanup(): Promise<void> {
    await this.adapter.cleanup();
    console.log('🧹 Universal Knowledge Sharing System cleaned up');
  }
}

// CLI interface
export async function main() {
  const system = new UniversalKnowledgeSystem();
  
  try {
    await system.initialize();
    
    // If command line arguments provided, perform search
    const query = process.argv.slice(2).join(' ');
    if (query) {
      console.log(`🔍 Searching for: "${query}"`);
      const results = await system.search(query);
      
      console.log(`\n✅ Found ${results.length} results:\n`);
      results.forEach((result, index) => {
        console.log(`${index + 1}. ${result.file_path}`);
        console.log(`   ${result.breadcrumb}`);
        console.log(`   Similarity: ${(result.similarity * 100).toFixed(1)}%`);
        console.log(`   Preview: ${result.content.substring(0, 200)}...\n`);
      });
    } else {
      // Show system status
      const status = await system.getStatus();
      console.log('📊 System Status:', JSON.stringify(status, null, 2));
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await system.cleanup();
  }
}

// Run CLI if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
