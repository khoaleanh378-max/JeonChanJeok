import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/JeonChanJeok/',

  // ── Dev proxy: /api → backend on port 8080 ──────────────
  // This lets the React dev server forward API calls to the
  // Express backend without CORS issues during development.
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        // Strip the /api prefix before forwarding to Express,
        // because Express mounts routes at /api/... itself.
        // So /api/books -> http://localhost:8080/api/books
        // (no rewrite needed — Express already has /api prefix)
      }
    }
  }
})
