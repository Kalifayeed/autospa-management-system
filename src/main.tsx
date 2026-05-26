import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import ErrorBoundary from "./components/ErrorBoundary";
import "./index.css";

// Auto-reload once if a lazily-imported chunk fails (common after deploys
// when a user's tab still references an old hashed bundle).
const CHUNK_RELOAD_KEY = "cc_chunk_reload_attempt";
function handleChunkError(err: unknown) {
  const msg = (err as any)?.message || String(err || "");
  const name = (err as any)?.name || "";
  const isChunk =
    name === "ChunkLoadError" ||
    /Loading chunk [\d]+ failed/i.test(msg) ||
    /Failed to fetch dynamically imported module/i.test(msg) ||
    /Importing a module script failed/i.test(msg);
  if (!isChunk) return;
  const attempt = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) || "0");
  if (attempt < 1) {
    sessionStorage.setItem(CHUNK_RELOAD_KEY, String(attempt + 1));
    window.location.reload();
  }
}
window.addEventListener("error", (e) => handleChunkError(e.error || e.message));
window.addEventListener("unhandledrejection", (e) => handleChunkError(e.reason));

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
