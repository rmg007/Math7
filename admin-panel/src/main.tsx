import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import { validateEnv } from './config/env';
import './index.css';
import { initErrorTracking } from './lib/error-tracker';

// Initialize error tracking (Supabase-native, zero cost)
initErrorTracking();

// Validate environment before rendering [P2]
validateEnv();

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
}
