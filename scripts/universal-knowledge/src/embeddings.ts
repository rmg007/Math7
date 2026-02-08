import OpenAI from 'openai';
import { ConfigManager, KnowledgeConfig } from './config.js';

export class EmbeddingManager {
  private static instance: EmbeddingManager;
  private openai: OpenAI;
  private config: KnowledgeConfig;

  private constructor() {
    this.config = ConfigManager.getInstance().getConfig();
    this.openai = new OpenAI({
      apiKey: this.config.openai.api_key,
    });
  }

  static getInstance(): EmbeddingManager {
    if (!EmbeddingManager.instance) {
      EmbeddingManager.instance = new EmbeddingManager();
    }
    return EmbeddingManager.instance;
  }

  async generateEmbedding(text: string): Promise<{ embedding: number[]; tokens: number }> {
    try {
      const response = await this.openai.embeddings.create({
        model: this.config.openai.model,
        input: text,
      });

      const embedding = response.data[0].embedding;
      const tokens = response.usage?.total_tokens || 0;

      return { embedding, tokens };
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw new Error(`Embedding generation failed: ${error}`);
    }
  }

  async generateBatchEmbeddings(texts: string[]): Promise<Array<{ embedding: number[]; tokens: number }>> {
    const batchSize = this.config.performance.embedding_batch_size;
    const results: Array<{ embedding: number[]; tokens: number }> = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      
      try {
        const response = await this.openai.embeddings.create({
          model: this.config.openai.model,
          input: batch,
        });

        const batchResults = response.data.map((item, index) => ({
          embedding: item.embedding,
          tokens: response.usage?.total_tokens || 0,
        }));

        results.push(...batchResults);

        // Add delay to respect rate limits
        if (i + batchSize < texts.length) {
          await this.delay(100);
        }
      } catch (error) {
        console.error(`Error generating batch embeddings for batch ${i / batchSize + 1}:`, error);
        throw error;
      }
    }

    return results;
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.generateEmbedding('test');
      return true;
    } catch {
      return false;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
