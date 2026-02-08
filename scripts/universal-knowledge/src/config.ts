import { z } from 'zod';

export const KnowledgeConfigSchema = z.object({
  supabase: z.object({
    url: z.string().url(),
    service_key: z.string().min(1),
    anon_key: z.string().min(1),
  }),
  openai: z.object({
    api_key: z.string().min(1),
    model: z.string().default('text-embedding-3-small'),
  }),
  cache: z.object({
    ttl: z.number().default(300000),
    max_size: z.number().default(1000),
  }),
  sync: z.object({
    interval: z.number().default(300000),
    auto_sync: z.boolean().default(true),
  }),
  ide_specific: z.object({
    cursor: z.object({
      config_path: z.string().default('.cursorrules'),
      knowledge_files: z.array(z.string()).default(['AI_CODING_INSTRUCTIONS.md']),
    }),
    qodo: z.object({
      config_path: z.string().default('QODO_GUIDE.md'),
      knowledge_files: z.array(z.string()).default(['QODO_GUIDE.md']),
    }),
    codespaces: z.object({
      config_path: z.string().default('.devcontainer/devcontainer.json'),
      knowledge_files: z.array(z.string()).default(['.devcontainer/devcontainer.json']),
    }),
  }),
  monitoring: z.object({
    enabled: z.boolean().default(true),
    log_level: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  }),
  performance: z.object({
    embedding_batch_size: z.number().default(10),
    max_retry_attempts: z.number().default(3),
    retry_delay_base: z.number().default(1000),
  }),
});

export type KnowledgeConfig = z.infer<typeof KnowledgeConfigSchema>;

export class ConfigManager {
  private static instance: ConfigManager;
  private config: KnowledgeConfig;

  private constructor() {
    this.config = this.loadConfig();
  }

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  private loadConfig(): KnowledgeConfig {
    // Load from environment variables
    const envConfig = {
      supabase: {
        url: process.env.SUPABASE_URL || '',
        service_key: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
        anon_key: process.env.SUPABASE_ANON_KEY || '',
      },
      openai: {
        api_key: process.env.OPENAI_API_KEY || '',
        model: process.env.OPENAI_MODEL || 'text-embedding-3-small',
      },
      cache: {
        ttl: parseInt(process.env.CACHE_TTL || '300000'),
        max_size: parseInt(process.env.CACHE_MAX_SIZE || '1000'),
      },
      sync: {
        interval: parseInt(process.env.SYNC_INTERVAL || '300000'),
        auto_sync: process.env.AUTO_SYNC === 'true',
      },
      ide_specific: {
        cursor: {
          config_path: process.env.CURSOR_CONFIG_PATH || '.cursorrules',
          knowledge_files: (process.env.CURSOR_KNOWLEDGE_FILES || 'AI_CODING_INSTRUCTIONS.md').split(','),
        },
        qodo: {
          config_path: process.env.QODO_CONFIG_PATH || 'QODO_GUIDE.md',
          knowledge_files: (process.env.QODO_KNOWLEDGE_FILES || 'QODO_GUIDE.md').split(','),
        },
        codespaces: {
          config_path: process.env.CODESPACES_CONFIG_PATH || '.devcontainer/devcontainer.json',
          knowledge_files: (process.env.CODESPACES_KNOWLEDGE_FILES || '.devcontainer/devcontainer.json').split(','),
        },
      },
      monitoring: {
        enabled: process.env.ENABLE_MONITORING !== 'false',
        log_level: (process.env.LOG_LEVEL as any) || 'info',
      },
      performance: {
        embedding_batch_size: parseInt(process.env.EMBEDDING_BATCH_SIZE || '10'),
        max_retry_attempts: parseInt(process.env.MAX_RETRY_ATTEMPTS || '3'),
        retry_delay_base: parseInt(process.env.RETRY_DELAY_BASE || '1000'),
      },
    };

    const result = KnowledgeConfigSchema.safeParse(envConfig);
    if (!result.success) {
      throw new Error(`Invalid configuration: ${result.error.message}`);
    }

    return result.data;
  }

  getConfig(): KnowledgeConfig {
    return this.config;
  }

  updateConfig(updates: Partial<KnowledgeConfig>): void {
    this.config = { ...this.config, ...updates };
  }
}
