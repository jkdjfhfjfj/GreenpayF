import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App";
import "./index.css";

// Check if we need to clear state due to version mismatch or white screen issues
const APP_VERSION = "1.0.1";
const storedVersion = localStorage.getItem("app_version");

if (storedVersion && storedVersion !== APP_VERSION) {
  localStorage.clear();
  sessionStorage.clear();
  // We can't easily clear IndexedDB here but clearing localStorage/sessionStorage helps
  localStorage.setItem("app_version", APP_VERSION);
  window.location.reload();
} else if (!storedVersion) {
  localStorage.setItem("app_version", APP_VERSION);
}

// Error boundary for the whole app to prevent white screen
window.addEventListener('error', (event) => {
  if (event.message.includes('Loading chunk') || event.message.includes('CSS_CHUNK_LOAD_FAILED')) {
    console.warn('Assets failed to load, attempting reload...');
    window.location.reload();
  }
});

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
