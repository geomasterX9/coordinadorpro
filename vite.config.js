import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.png", "apple-touch-icon.png"],
      manifest: {
        name: "CoordinadorPro",
        short_name: "CoordinadorPro",
        description: "Coordinación académica: visitas, observación de clase, planeaciones, incidencias y CTE.",
        lang: "es-MX",
        start_url: "/",
        display: "standalone",
        background_color: "#F4F5F9",
        theme_color: "#2F5CF6",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ],
});
