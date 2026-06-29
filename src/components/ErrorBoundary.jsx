import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Application error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const errStr = this.state.error
        ? (this.state.error.stack || this.state.error.message || String(this.state.error))
        : 'No error details available';
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="text-center max-w-2xl w-full">
            <h2 className="text-lg font-semibold text-foreground">Something went wrong</h2>
            <p className="text-sm text-muted-foreground mt-2">
              An unexpected error occurred while loading the page.
            </p>
            <pre className="mt-4 p-3 rounded-md bg-secondary text-xs text-left overflow-auto max-h-64 text-destructive-foreground whitespace-pre-wrap break-all">
              {errStr}
            </pre>
            {this.state.errorInfo && this.state.errorInfo.componentStack && (
              <pre className="mt-2 p-3 rounded-md bg-secondary text-xs text-left overflow-auto max-h-32 text-muted-foreground whitespace-pre-wrap break-all">
                {this.state.errorInfo.componentStack}
              </pre>
            )}
            <button
              onClick={this.handleReload}
              className="mt-4 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium"
            >
              Back to Home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}