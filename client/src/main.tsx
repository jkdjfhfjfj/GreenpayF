import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App";
import "./index.css";

// Check if we need to clear state due to version mismatch or white screen issues
const APP_VERSION = "1.0.3"; // Incremented version
const storedVersion = localStorage.getItem("app_version");

// Detect if we're in a crash loop (more than 3 reloads in 10 seconds)
const reloadCount = parseInt(sessionStorage.getItem("reload_count") || "0");
const lastReload = parseInt(sessionStorage.getItem("last_reload") || "0");
const now = Date.now();

if (now - lastReload < 10000 && reloadCount > 3) {
  console.error("Crash loop detected. Stopping automatic reloads.");
  // Don't reload anymore, just log the error
} else {
  if (now - lastReload > 10000) {
    sessionStorage.setItem("reload_count", "1");
  } else {
    sessionStorage.setItem("reload_count", (reloadCount + 1).toString());
  }
  sessionStorage.setItem("last_reload", now.toString());
}

if (storedVersion && storedVersion !== APP_VERSION) {
  // Only clear and reload once per version update
  localStorage.setItem("app_version", APP_VERSION);
  localStorage.clear();
  sessionStorage.clear();
  window.location.reload();
} else if (!storedVersion) {
  localStorage.setItem("app_version", APP_VERSION);
}

// Error boundary for the whole app to prevent white screen
window.addEventListener('error', (event) => {
  if (event.message.includes('Loading chunk') || 
      event.message.includes('CSS_CHUNK_LOAD_FAILED') ||
      event.message.includes('Unexpected token') ||
      event.message.includes('is not a function')) {
    const lastCriticalError = parseInt(sessionStorage.getItem("last_critical_error") || "0");
    // Only auto-reset once per minute for critical errors to avoid loops
    if (Date.now() - lastCriticalError > 60000) {
      sessionStorage.setItem("last_critical_error", Date.now().toString());
      console.warn('Critical error detected, forcing full reset and reload...');
      window.location.href = window.location.origin + "/?clear_cache=1&s=1";
    }
  }
});

// Polyfill for global if needed
if (typeof global === 'undefined') {
  (window as any).global = window;
}

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
