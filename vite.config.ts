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
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        landing: resolve(__dirname, 'landing.html'),
      },
    },
  },
})
