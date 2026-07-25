"use client";

import { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { IconAlertCircle, IconRefresh } from "@tabler/icons-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Check if it's a Convex authentication error
      const isAuthError = this.state.error?.message?.includes("CONVEX") ||
                          this.state.error?.message?.includes("Server Error");

      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4 max-w-md text-center p-6">
            <div className="w-12 h-12 bg-destructive/10 flex items-center justify-center rounded-full">
              <IconAlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <h2 className="text-lg font-semibold">
              {isAuthError ? "Authentication Error" : "Something went wrong"}
            </h2>
            <p className="text-muted-foreground text-sm">
              {isAuthError
                ? "There was a problem connecting to the database. Please try refreshing the page or contact support if the issue persists."
                : this.state.error?.message || "An unexpected error occurred."}
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                variant="outline"
                className="gap-2"
              >
                <IconRefresh size={16} />
                Refresh Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
