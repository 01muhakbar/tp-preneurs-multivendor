import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";


export default defineConfig(({ mode }) => {
  const analyze = mode === "analyze";
  const proxyApiHost = process.env.VITE_PROXY_API_HOST || "127.0.0.1";
  const proxyApiPort = Number(process.env.VITE_PROXY_API_PORT || 3001);

  return {
    plugins: [
      react(),
      analyze
        ? visualizer({
            filename: "dist/stats.html",
            template: "treemap",
            gzipSize: true,
            brotliSize: true,
            open: false,
          })
        : null,
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    server: {
      port: 5173,
      strictPort: false,
      proxy: {
        // Proxy semua request /api ke server dev
        "/api": {
          target: `http://${proxyApiHost}:${proxyApiPort}`,
          changeOrigin: true,
          secure: false,
        },
        // Proxy uploaded assets too
        "/uploads": {
          target: `http://${proxyApiHost}:${proxyApiPort}`,
          changeOrigin: true,
        },
      },
    },
    build: {},
  };
});
