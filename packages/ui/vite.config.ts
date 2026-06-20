import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// In dev the UI runs on Vite (5173) and proxies API + WebSocket traffic to the
// core daemon (8723). In production the core serves the built UI itself, so no
// proxy is needed and the client uses same-origin relative URLs.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/trpc': { target: 'http://localhost:8723', changeOrigin: true, ws: true },
      '/api': { target: 'http://localhost:8723', changeOrigin: true },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
