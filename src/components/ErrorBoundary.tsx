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

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error!);
      }
      return (
        <div className="min-h-screen flex items-center justify-center bg-rose-50 p-4">
          <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl p-6 text-slate-800">
            <h1 className="text-xl font-extrabold text-rose-600 mb-2">Сталася помилка (App Crash)</h1>
            <p className="text-sm mb-4 text-slate-600">На жаль, програма зупинилася через помилку в коді. Будь ласка, скопіюйте текст нижче та надішліть його розробнику.</p>
            <pre className="bg-slate-100 p-4 rounded-xl text-xs overflow-x-auto whitespace-pre-wrap font-mono text-slate-700">
              {this.state.error?.stack || this.state.error?.message || String(this.state.error)}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 bg-rose-600 text-white font-bold py-2 px-4 rounded-xl hover:bg-rose-700 transition"
            >
              Перезавантажити сторінку
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
