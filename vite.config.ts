import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { resolve } from 'node:path'

// Serve the standalone landing page (landing.html) when visiting "/".
// Every other URL (/dashboard, /tailor, /size-charts ...) still loads the original app (index.html).
function landingFirst(): Plugin {
  const rewrite = (req: { url?: string }, _res: unknown, next: () => void) => {
    const path = (req.url ?? '').split('?')[0]
    if (path === '/' || path === '/index.html') req.url = '/landing.html'
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
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        landing: resolve(import.meta.dirname, 'landing.html'),
      },
    },
  },
})
