import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import "./index.css";
import App from "./App";
import { notifyUpdateAvailable } from "./lib/swUpdate";
const savedTheme = localStorage.getItem("theme") || "clean-blue";
document.documentElement.setAttribute("data-theme", savedTheme);

// "prompt" registerType: a new deploy's service worker installs in the
// background but never takes over on its own — that used to reload the
// page out from under whoever had it open, which looked like the app
// randomly refreshing itself. Instead we surface a banner (App.tsx) and only
// apply + reload when the user taps it.
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    notifyUpdateAvailable(() => updateSW(true));
  },
});



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
