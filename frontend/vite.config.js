import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:4002",
        changeOrigin: true,
      },
    },
  },
  // --- Penambahan Opsi 2 & Opsi 3 ---
  build: {
    // Opsi 3: Menaikkan batas warning dari 500 kB menjadi 1000 kB (1 MB)
    chunkSizeWarningLimit: 1000,
    // Opsi 2: Memisahkan library pihak ketiga (node_modules) ke file chunk terpisah
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            return "vendor";
          }
        },
      },
    },
  },
});