/**
 * Environment configuration loaded from Vite's import.meta.env
 *
 * Values are injected from .env.local during build.
 * See: scripts/deploy/generate-env.ps1
 *
 * Usage:
 * ```typescript
 * import { env } from '@/config/env';
 *
 * const url = env.supabaseUrl;
 * const version = env.appVersion;
 * ```
 */

interface EnvConfig {
  /** Application version from master-config.json */
  appVersion: string;
  /** Application display name */
  appName: string;
  /** Supabase project URL */
  supabaseUrl: string;
  /** Supabase anonymous key (safe for client-side) */
  supabaseAnonKey: string;
  /** Enable offline mode features */
  enableOfflineMode: boolean;
  /** Analytics tracking ID (optional) */
  analyticsId: string | null;
  /** Gemini API key for AI features (optional) */
  geminiApiKey: string | null;
  /** Current environment mode */
  mode: 'development' | 'production';
  /** Whether running in production */
  isProduction: boolean;
  /** Whether running in development */
  isDevelopment: boolean;
}

/**
 * Get an environment variable with optional required check.
 *
 * @param key - The VITE_ prefixed environment variable key
 * @param required - Whether to throw if the variable is missing
 * @returns The environment variable value or empty string
 */
function getEnvVar(key: string, required = true): string {
  const value = import.meta.env[key];
  if (required && !value) {
    console.error(`Missing required environment variable: ${key}`);
    // In development, show a warning but don't crash
    if (import.meta.env.DEV) {
      console.warn(`Continuing with empty value for ${key} in development mode`);
      return '';
    }
    throw new Error(`Missing required environment variable: ${key}`);
  }
  // Convert to string since index signature can return boolean
  return typeof value === 'string' ? value : '';
}

/**
 * Environment configuration object.
 * All values are loaded at module initialization time.
 */
export const env: EnvConfig = {
  appVersion: getEnvVar('VITE_APP_VERSION', false) || '0.0.0',
  appName: getEnvVar('VITE_APP_NAME', false) || 'Questerix Admin',
  supabaseUrl: getEnvVar('VITE_SUPABASE_URL'),
  supabaseAnonKey: getEnvVar('VITE_SUPABASE_ANON_KEY'),
  enableOfflineMode: getEnvVar('VITE_ENABLE_OFFLINE_MODE', false) === 'true',
  analyticsId: getEnvVar('VITE_ANALYTICS_ID', false) || null,
  geminiApiKey: getEnvVar('VITE_GEMINI_API_KEY', false) || null,
  mode: import.meta.env.MODE as 'development' | 'production',
  isProduction: import.meta.env.PROD,
  isDevelopment: import.meta.env.DEV,
};

/**
 * Validate that all required environment variables are set.
 * Call this at app startup to fail fast.
 *
 * @throws Error if required variables are missing
 */
export function validateEnv(): void {
  const missing: string[] = [];

  if (!env.supabaseUrl) missing.push('VITE_SUPABASE_URL');
  if (!env.supabaseAnonKey) missing.push('VITE_SUPABASE_ANON_KEY');

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
        'Ensure .env.local is properly configured.\n' +
        'Run: ./scripts/deploy/generate-env.ps1 to generate from master-config.json'
    );
  }
}

// Log configuration in development (with sensitive values redacted)
if (import.meta.env.DEV) {
  console.log('[ENV] Loaded configuration:', {
    appVersion: env.appVersion,
    appName: env.appName,
    mode: env.mode,
    supabaseUrl: env.supabaseUrl ? '***configured***' : 'NOT SET',
    supabaseAnonKey: env.supabaseAnonKey ? '***configured***' : 'NOT SET',
    enableOfflineMode: env.enableOfflineMode,
    analyticsId: env.analyticsId ? '***configured***' : null,
    geminiApiKey: env.geminiApiKey ? '***configured***' : null,
  });
}
