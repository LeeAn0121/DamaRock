import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import packageJson from "./package.json";

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
  base: process.env.GITHUB_ACTIONS ? "/DamaRock/" : "/",
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // "prompt" (not "autoUpdate"): with frequent deploys, autoUpdate's
      // silent background reload was firing mid-session and looked like the
      // app randomly refreshing itself. main.tsx now shows an update banner
      // via onNeedRefresh and only reloads when the user taps it.
      registerType: "prompt",
      injectRegister: null,
      // A custom service worker (src/sw.ts) is required for push/
      // notificationclick handlers — generateSW's auto-built worker has no
      // hook for that.
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,woff2,png,ico,svg,webmanifest}"],
      },
      manifest: {
        name: "담아락 (DamaRock)",
        short_name: "담아락",
        description: "우리집 장보기와 할 일 관리",
        theme_color: "#16a34a",
        background_color: "#ffffff",
        display: "standalone",
        id: "/DamaRock/app",
        start_url: ".",
        icons: [
          {
            src: "icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
          }
        ]
      }
    })
  ],
});
