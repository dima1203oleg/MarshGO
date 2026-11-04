import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
  fallback?: (error: Error) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.clear();
        sessionStorage.clear();
      }
    } catch {
      // ignore
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error!);
      }
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F5F8FD] dark:bg-[#08121f] p-4 text-center">
          <div className="max-w-md w-full bg-white dark:bg-[#101E38] rounded-3xl shadow-xl p-8 border border-slate-100 dark:border-slate-800">
            <div className="mb-6 mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/></svg>
            </div>
            <h1 className="text-2xl font-black text-[#14243B] dark:text-white mb-2">Ой, щось пішло не так</h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-8">
              Виникла непередбачена помилка. Ми вже зафіксували проблему.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full rounded-2xl bg-[#1769F4] py-3.5 text-base font-black text-white shadow-lg transition-transform hover:scale-[0.98] hover:bg-[#1056D1]"
              >
                Перезавантажити
              </button>
              <button
                onClick={this.handleReset}
                className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 text-base font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-[#101E38] dark:text-slate-300 dark:hover:bg-slate-800/60"
              >
                Скинути налаштування
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-8 max-w-full overflow-auto rounded-xl bg-slate-900 p-4 text-left text-xs text-red-400">
                <code>{this.state.error.toString()}</code>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
