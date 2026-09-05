import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
const savedTheme = localStorage.getItem("theme") || "clean-blue";
document.documentElement.setAttribute("data-theme", savedTheme);



// Initialize Kakao SDK (Replace with real JavaScript Key)
const KAKAO_JS_KEY = import.meta.env.VITE_KAKAO_JS_KEY || "00000000000000000000000000000000"; // Dummy key for now
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
