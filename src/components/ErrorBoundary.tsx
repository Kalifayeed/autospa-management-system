import React from "react";

interface State {
  hasError: boolean;
  error?: Error;
}

const RELOAD_KEY = "cc_chunk_reload_attempt";

function isChunkLoadError(err: unknown): boolean {
  if (!err) return false;
  const msg = (err as any)?.message || String(err);
  const name = (err as any)?.name || "";
  return (
    name === "ChunkLoadError" ||
    /Loading chunk [\d]+ failed/i.test(msg) ||
    /Failed to fetch dynamically imported module/i.test(msg) ||
    /Importing a module script failed/i.test(msg) ||
    /dynamically imported module/i.test(msg)
  );
}

export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("App error boundary:", error, info);
    if (isChunkLoadError(error)) {
      const attempt = Number(sessionStorage.getItem(RELOAD_KEY) || "0");
      if (attempt < 1) {
        sessionStorage.setItem(RELOAD_KEY, String(attempt + 1));
        window.location.reload();
      }
    }
  }

  handleReload = () => {
    sessionStorage.removeItem(RELOAD_KEY);
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          background: "#0f172a",
          color: "#e2e8f0",
        }}>
          <div style={{ maxWidth: 480, textAlign: "center" }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>
              Something went wrong
            </h1>
            <p style={{ fontSize: 14, opacity: 0.8, marginBottom: 20 }}>
              The app hit an unexpected error. Reloading usually fixes it.
            </p>
            <button
              onClick={this.handleReload}
              style={{
                background: "#0d9488",
                color: "white",
                border: 0,
                borderRadius: 8,
                padding: "10px 18px",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Reload app
            </button>
            {this.state.error?.message ? (
              <pre style={{
                marginTop: 20,
                textAlign: "left",
                fontSize: 11,
                opacity: 0.5,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}>{this.state.error.message}</pre>
            ) : null}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
