import { Component, type ReactNode } from "react";

interface State { error: Error | null }

/**
 * App-wide error boundary. Catches render-phase errors so a single broken
 * screen never blanks the entire app in production.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) { return { error }; }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    // Log to console; real telemetry can be wired later.
    console.error("[ErrorBoundary]", error, info?.componentStack);
  }

  reset = () => { this.setState({ error: null }); window.location.reload(); };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background px-6">
        <div className="max-w-sm rounded-3xl border border-border bg-card p-6 text-center shadow-soft">
          <p className="font-display text-xl font-bold">Something went wrong</p>
          <p className="mt-2 text-sm text-muted-foreground">
            We hit an unexpected error. Reload the page to keep exploring.
          </p>
          <button
            onClick={this.reset}
            className="mt-4 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
          >
            Reload app
          </button>
        </div>
      </div>
    );
  }
}
