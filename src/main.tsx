import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import "./index.css";
import App from "./App";
const savedTheme = localStorage.getItem("theme") || "clean-blue";
document.documentElement.setAttribute("data-theme", savedTheme);

// autoUpdate registerType: as soon as a new deploy's service worker takes
// over, reload so an already-open tab (or installed PWA) never keeps
// running stale JS silently.
registerSW({ immediate: true });



// Initialize Kakao SDK (Replace with real JavaScript Key)
const KAKAO_JS_KEY = import.meta.env.VITE_KAKAO_JS_KEY || "e4352e1b92ec838dccb0263212cbd915"; // Dummy key for now
if (window.Kakao && !window.Kakao.isInitialized()) {
  try {
    window.Kakao.init(KAKAO_JS_KEY);
  } catch(e) {
    console.error("Kakao init failed", e);
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
