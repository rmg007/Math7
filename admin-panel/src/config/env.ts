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

  /** Current environment mode */
  mode: 'development' | 'production';
  /** Whether running in production */
  isProduction: boolean;
  /** Whether running in development */
  isDevelopment: boolean;
  /** API timeout in milliseconds */
  apiTimeout: number;
  /** Workers AI URL */
  workersUrl: string;
}

// Type for the fallback env object when import.meta.env is unavailable
type EnvRecord = Record<string, string | boolean | undefined>;

// Cached reference to import.meta.env for module-level access
// Falls back to empty record in non-Vite contexts (e.g., Playwright Node.js)
const _metaEnv: EnvRecord =
  typeof import.meta !== 'undefined' && import.meta.env ? (import.meta.env as EnvRecord) : {};

/**
 * Safely get a raw value from import.meta.env.
 * Use this for accessing env vars outside the standard EnvConfig.
 * Returns undefined if the key doesn't exist or import.meta.env is unavailable.
 */
export function getMetaEnv(key: string): string | boolean | undefined {
  return _metaEnv[key];
}

/**
 * Check if we're in development mode (Vite DEV server).
 */
export function isDevMode(): boolean {
  return Boolean(_metaEnv.DEV);
}

/**
 * Get an environment variable with optional required check.
 *
 * @param key - The VITE_ prefixed environment variable key
 * @param required - Whether to throw if the variable is missing
 * @returns The environment variable value or empty string
 */
function getEnvVar(key: string, required = true): string {
  // Check for TEST_ prefixed version first (e.g. TEST_VITE_SUPABASE_URL)
  const testValue = _metaEnv[`TEST_${key}`];
  if (testValue) return typeof testValue === 'string' ? testValue : '';

  const value = _metaEnv[key];
  if (required && !value) {
    console.error(`Missing required environment variable: ${key}`);
    // In development or test contexts, show a warning but don't crash
    if (_metaEnv.DEV || typeof process !== 'undefined') {
      console.warn(`Continuing with empty value for ${key} in development/test mode`);
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

  mode: (_metaEnv.MODE as 'development' | 'production') || 'development',
  isProduction: Boolean(_metaEnv.PROD),
  isDevelopment: Boolean(_metaEnv.DEV) || !_metaEnv.PROD,
  apiTimeout: Number(getEnvVar('VITE_API_TIMEOUT', false)) || 15000,
  workersUrl: getEnvVar('VITE_WORKERS_URL', false),
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
if (_metaEnv.DEV) {
  console.log('[ENV] Loaded configuration:', {
    appVersion: env.appVersion,
    appName: env.appName,
    mode: env.mode,
    supabaseUrl: env.supabaseUrl ? '***configured***' : 'NOT SET',
    supabaseAnonKey: env.supabaseAnonKey ? '***configured***' : 'NOT SET',
    enableOfflineMode: env.enableOfflineMode,
    analyticsId: env.analyticsId ? '***configured***' : null,
    workersUrl: env.workersUrl ? '***configured***' : 'NOT SET',
  });
}
