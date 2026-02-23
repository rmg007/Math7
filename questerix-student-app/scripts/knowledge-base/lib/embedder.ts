/**
 * OpenAI Embedder
 * Generates embeddings using OpenAI's text-embedding-3-small model
 */

import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface EmbeddingResult {
  embedding: number[];
  tokens: number;
}

/**
 * Generate embedding for a single text chunk
 */
export async function generateEmbedding(text: string): Promise<EmbeddingResult> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
    encoding_format: 'float',
  });

  return {
    embedding: response.data[0].embedding,
    tokens: response.usage.total_tokens,
  };
}

/**
 * Generate embeddings for multiple chunks with rate limiting
 */
export async function generateEmbeddings(
  texts: string[],
  concurrency: number = 10
): Promise<EmbeddingResult[]> {
  const pLimit = (await import('p-limit')).default;
  const limit = pLimit(concurrency);

  const promises = texts.map((text) =>
    limit(() => generateEmbedding(text))
  );

  return Promise.all(promises);
}
