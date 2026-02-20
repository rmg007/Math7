import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import { validateEnv } from './config/env';
import './index.css';
import { initErrorTracking } from './lib/error-tracker';

// ─── Startup Failure UI ─────────────────────────────────────────────────────
// If env validation or root mounting fails before React is up,
// we render a plain DOM fallback so the user sees something actionable
// rather than a blank white page.
function renderStartupError(message: string, detail?: string): void {
  const container = document.getElementById('root') ?? document.body;
  container.innerHTML = `
    <div style="
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f8fafc;
      font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
      padding: 2rem;
    ">
      <div style="
        max-width: 480px;
        width: 100%;
        background: white;
        border-radius: 1.5rem;
        padding: 2.5rem;
        box-shadow: 0 20px 60px -10px rgba(0,0,0,0.12);
        border: 1px solid #fee2e2;
        text-align: center;
      ">
        <div style="
          width: 56px;
          height: 56px;
          background: #fef2f2;
          border-radius: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
          font-size: 1.75rem;
        ">⚙️</div>
        <h1 style="font-size: 1.25rem; font-weight: 800; color: #111827; margin: 0 0 0.5rem;">
          Configuration Error
        </h1>
        <p style="color: #6b7280; font-size: 0.875rem; margin: 0 0 1.5rem; line-height: 1.6;">
          ${message}
        </p>
        ${
          detail
            ? `
          <details style="text-align: left; margin-bottom: 1.5rem;">
            <summary style="font-size: 0.75rem; font-weight: 700; color: #9ca3af; cursor: pointer; text-transform: uppercase; letter-spacing: 0.05em;">
              Technical detail
            </summary>
            <pre style="
              margin-top: 0.75rem;
              padding: 0.75rem 1rem;
              background: #f9fafb;
              border-radius: 0.75rem;
              font-size: 0.75rem;
              color: #ef4444;
              white-space: pre-wrap;
              word-break: break-word;
              border: 1px solid #fca5a5;
              font-family: ui-monospace, monospace;
            ">${detail}</pre>
          </details>
        `
            : ''
        }
        <button
          onclick="window.location.reload()"
          style="
            width: 100%;
            padding: 0.75rem 1.5rem;
            background: #1e1b4b;
            color: white;
            border: none;
            border-radius: 0.75rem;
            font-size: 0.8125rem;
            font-weight: 800;
            cursor: pointer;
            letter-spacing: 0.05em;
            text-transform: uppercase;
          "
        >
          Retry
        </button>
      </div>
    </div>
  `;
}

// ─── Boot Sequence ───────────────────────────────────────────────────────────
// Strict ordering:
//   1. Validate env (no side effects) — fail early with a visible UI
//   2. Init error tracking (uses env) — non-fatal if it fails
//   3. Mount React

// Step 1: Env validation — catches blank Supabase URL / anon key
try {
  validateEnv();
} catch (err) {
  const message = err instanceof Error ? err.message : 'Unknown configuration error.';
  renderStartupError(
    'The application is missing required configuration. Please contact your administrator or re-run the environment setup script.',
    message
  );
  // Don't proceed — stop execution here
  throw err;
}

// Step 2: Init error tracking — non-fatal (best-effort)
try {
  initErrorTracking();
} catch {
  console.warn('[Startup] Error tracking failed to initialize — continuing without it.');
}

// Step 3: Mount React
const rootElement = document.getElementById('root');
if (!rootElement) {
  renderStartupError(
    'The application mount point (#root) was not found in the HTML. This is a deployment issue.'
  );
} else {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
}
