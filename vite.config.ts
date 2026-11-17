/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// L'app sta su Cloudflare Workers, alla radice del dominio (pycoil.<account>.workers.dev).
// PYCOIL_BASE serve solo per la vecchia copia su GitHub Pages (https://aileorb.github.io/pycoil/).
const base = process.env.PYCOIL_BASE ?? '/';

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['icons/*.png', 'icons/*.svg'],
      manifest: {
        // Il nome proposto da «Aggiungi alla schermata Home»: iOS usa `name`, quindi solo «PyCoil».
        name: 'PyCoil',
        id: base,
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
          { src: 'icons/pycoil-v2-180.png', sizes: '180x180', type: 'image/png', purpose: 'any' },
          { src: 'icons/pycoil-v2-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/pycoil-v2-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/pycoil-v2-1024.png', sizes: '1024x1024', type: 'image/png', purpose: 'any' },
          { src: 'icons/pycoil-v2-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      // Service worker scritto a mano come in Di&T (src/sw.js), con le notifiche gestite nel file stesso.
      // In build si inietta solo l'elenco dei file della shell: i contenuti didattici restano fuori dalla cache.
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,webmanifest}', 'icons/pycoil-v2-180.png', 'icons/pycoil-v2-192.png'],
        globIgnores: ['content/**', 'sw.js']
      }
    })
  ],
  worker: { format: 'es' },
  // cssTarget esplicito: con il solo es2022 il minificatore toglieva backdrop-filter senza prefisso (niente vetro su Chrome)
  build: { target: 'es2022', cssTarget: ['chrome111', 'edge111', 'firefox115', 'safari16'], sourcemap: false, assetsInlineLimit: 0 },
  test: { environment: 'node', include: ['tests/**/*.test.ts'] }
});
