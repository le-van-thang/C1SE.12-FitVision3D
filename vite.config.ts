import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { resolve } from 'node:path'

// Serve the standalone landing page (landing.html) when visiting "/landing" or "/welcome".
// Root "/" and all SPA routes (/dashboard, /tailor, /shop, /size-charts ...) always load index.html (React Router).
function landingFirst(): Plugin {
  const rewrite = (req: { url?: string }, _res: unknown, next: () => void) => {
    const path = (req.url ?? '').split('?')[0]
    if (path === '/landing' || path === '/welcome') req.url = '/landing.html'
    next()
  }
  return {
    name: 'landing-first',
    configureServer(server) {
      server.middlewares.use(rewrite)
    },
    configurePreviewServer(server) {
      server.middlewares.use(rewrite)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), landingFirst()],
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, 'src'),
      '@shared': resolve(import.meta.dirname, 'shared'),
    },
  },
  server: {
    proxy: {
      '/api/v1/measure': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/api/v1/avatar': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/api/v1/info': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        landing: resolve(import.meta.dirname, 'landing.html'),
      },
    },
  },
})
