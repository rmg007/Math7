/// <reference types="vite/client" />

/**
 * Custom environment variables for the Questerix Admin Panel.
 * These are loaded from .env.local and injected by Vite at build time.
 *
 * See: scripts/deploy/generate-env.ps1
 * See: master-config.json
 */
interface ImportMetaEnv {
  // Built-in Vite properties
  readonly MODE: string;
  readonly BASE_URL: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly SSR: boolean;
  
  /** Application version from master-config.json */
  readonly VITE_APP_VERSION: string;
  /** Application display name */
  readonly VITE_APP_NAME: string;
  /** Supabase project URL */
  readonly VITE_SUPABASE_URL: string;
  /** Supabase anonymous key (safe for client-side) */
  readonly VITE_SUPABASE_ANON_KEY: string;
  /** Enable offline mode features */
  readonly VITE_ENABLE_OFFLINE_MODE: string;
  /** Analytics tracking ID (optional) */
  readonly VITE_ANALYTICS_ID?: string;
  /** Gemini API key for AI features (optional) */
  readonly VITE_GEMINI_API_KEY?: string;
  /** Sentry DSN for error tracking (optional) */
  readonly VITE_SENTRY_DSN?: string;
  
  // Index signature for dynamic access
  readonly [key: string]: string | boolean | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

