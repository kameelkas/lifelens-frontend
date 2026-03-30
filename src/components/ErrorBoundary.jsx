/**
 * Catches render/lifecycle errors in child trees so one bad screen does not blank the whole app.
 * (Event handlers and async errors are not caught — use try/catch there.)
 */
import { Component } from "react";
import { Link } from "react-router-dom";

export default class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error(error);
    if (info?.componentStack) {
      console.error(info.componentStack);
    }
  }

  render() {
    if (this.state.hasError) {
      const { error } = this.state;
      return (
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 pb-24">
          <div className="w-full max-w-md rounded-lg border border-muted/25 bg-surface/85 p-6 shadow-lg">
            <h1 className="text-ink text-lg font-semibold">Something went wrong</h1>
            <p className="text-muted mt-2 text-sm">
              This part of the app hit an unexpected error. You can reload or go back to the home
              screen.
            </p>
            {import.meta.env.DEV && error?.message && (
              <pre className="mt-4 max-h-40 overflow-auto rounded border border-red-500/30 bg-app-bg/80 p-3 text-left text-xs text-red-300 whitespace-pre-wrap">
                {error.message}
              </pre>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded bg-brand-gold px-4 py-2 text-sm font-semibold text-ink hover:opacity-90"
              >
                Reload page
              </button>
              <Link
                to="/"
                className="inline-flex items-center rounded border border-muted/30 px-4 py-2 text-sm text-ink hover:border-brand-gold/50"
              >
                Go home
              </Link>
            </div>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
