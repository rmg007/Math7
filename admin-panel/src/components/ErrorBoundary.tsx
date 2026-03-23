import { isDevMode } from '@/config/env';
import { captureException } from '@/lib/error-tracker';
import type { OracleResult } from '@/services/OracleService';
import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  oracleResults: OracleResult[];
  searching: boolean;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Error Boundary with Project Oracle Self-Healing Integration.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      oracleResults: [],
      searching: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log to Supabase for diagnostic tracing
    captureException(error, {
      componentStack: errorInfo.componentStack || undefined,
      componentName: 'ErrorBoundary',
      tags: { severity: 'critical', layer: 'ui' },
      extra: {
        type: 'react_error_boundary',
      },
    });
  }

  handleOracleSearch = async () => {
    const { error } = this.state;
    if (!error) return;

    this.setState({ searching: true });
    try {
      // Dynamic import to avoid circular dependencies
      const { OracleService } = await import('@/services/OracleService');
      const results = await OracleService.findSolutionForError(error);
      this.setState({ oracleResults: results });
    } catch (err) {
      captureException(err as Error, {
        tags: { component: 'ErrorBoundary', method: 'handleOracleSearch' },
      });
    } finally {
      this.setState({ searching: false });
    }
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
          <div className="max-w-2xl w-full p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-red-50 dark:bg-red-900/10 rounded-3xl flex items-center justify-center rotate-3 hover:rotate-0 transition-transform">
              <svg
                className="w-10 h-10 text-red-600 dark:text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">
              System Interruption
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm max-w-sm mx-auto">
              An unexpected error occurred. Consult the Project Oracle for recovery patterns.
            </p>

            {this.state.oracleResults.length > 0 ? (
              <div className="mb-8 text-left animate-in fade-in zoom-in duration-500">
                <h3 className="text-2xs font-black text-indigo-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                  Oracle Intel Matches
                </h3>
                <div className="space-y-4">
                  {this.state.oracleResults.slice(0, 3).map((res, i) => (
                    <div
                      key={i}
                      className="p-4 bg-indigo-50/50 backdrop-blur-sm rounded-xl border border-indigo-100 group hover:border-indigo-300 transition-all"
                    >
                      <div className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        {res.file_path.split('\\').pop()}
                      </div>
                      <div className="text-xs text-indigo-900 font-medium leading-relaxed italic line-clamp-4">
                        \"{res.content.slice(0, 400)}\"
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 mb-8">
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-black transition-all font-black text-xs uppercase tracking-widest shadow-lg shadow-gray-200"
                >
                  Reload App
                </button>
                <button
                  onClick={this.handleOracleSearch}
                  disabled={this.state.searching}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 group shadow-lg shadow-indigo-100"
                >
                  {this.state.searching ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <svg
                      className="w-4 h-4 group-hover:rotate-12 transition-transform"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  )}
                  Consult Oracle
                </button>
              </div>
            )}

            <button
              onClick={() => this.setState({ hasError: false, error: null, oracleResults: [] })}
              className="text-2xs font-black text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-widest underline decoration-2 underline-offset-4"
            >
              Dismiss
            </button>

            {isDevMode() && this.state.error && (
              <details className="mt-12 text-left opacity-30 hover:opacity-100 transition-opacity">
                <summary className="text-[9px] font-black text-gray-400 uppercase tracking-widest cursor-pointer list-none flex items-center gap-2">
                  <div className="w-1 h-1 bg-gray-300 rounded-full" />
                  Technical Trace
                </summary>
                <pre className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl text-2xs overflow-auto max-h-40 font-mono text-red-500 border border-red-50">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
