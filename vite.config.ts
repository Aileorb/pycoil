/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Il sito viene pubblicato su GitHub Pages come project site: https://<utente>.github.io/pycoil/
const base = process.env.PYCOIL_BASE ?? '/pycoil/';

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['icons/*.png', 'icons/*.svg'],
      manifest: {
        name: 'PyCoil — Python per ingegneri',
        short_name: 'PyCoil',
        description: 'Python per ingegneri, una spira al giorno: 3 micro-task da 10 minuti dal telefono.',
        lang: 'it',
        start_url: base,
        scope: base,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#F2F2F7',
        theme_color: '#F2F2F7',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        // Requisito vincolante: solo la shell dell'app in cache. I contenuti didattici
        // restano su GitHub e si leggono a runtime, senza essere salvati.
        globPatterns: ['**/*.{js,css,html,webmanifest}', 'icons/icon-192.png', 'icons/apple-touch-icon.png'],
        globIgnores: ['content/**'],
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/\/content\//],
        // Il motore Python (Pyodide e le sue librerie) e i pacchetti presi da PyPI finiscono in una
        // cache dell'app, così le Impostazioni possono misurarli e liberare le librerie non più usate.
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/pyodide\//,
            handler: 'CacheFirst',
            options: { cacheName: 'pycoil-python', cacheableResponse: { statuses: [200] } }
          },
          {
            urlPattern: /^https:\/\/files\.pythonhosted\.org\//,
            handler: 'CacheFirst',
            options: { cacheName: 'pycoil-python', cacheableResponse: { statuses: [200] } }
          },
          {
            urlPattern: /^https:\/\/pypi\.org\/(simple|pypi)\//,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'pycoil-python', cacheableResponse: { statuses: [200] } }
          }
        ]
      }
    })
  ],
  worker: { format: 'es' },
  build: { target: 'es2022', sourcemap: false, assetsInlineLimit: 0 },
  test: { environment: 'node', include: ['tests/**/*.test.ts'] }
});
