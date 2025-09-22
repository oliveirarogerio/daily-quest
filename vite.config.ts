import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    vueDevTools(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true,
      },
      includeAssets: ['favicon.ico', 'favicon.svg', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Missão Diária',
        short_name: 'MissãoDiária',
        description: 'Evolua sua vida, uma missão por vez',
        theme_color: '#6a5acd',
        background_color: '#0a0a14',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        orientation: 'portrait',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallbackDenylist: [
          /^\/__/,
          /chrome-extension:/,
          /moz-extension:/,
          /safari-extension:/,
        ],
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => {
              return (
                url.protocol === 'chrome-extension:' ||
                url.protocol === 'moz-extension:' ||
                url.protocol === 'safari-extension:' ||
                url.href.includes('chrome-extension://') ||
                url.href.includes('moz-extension://') ||
                url.href.includes('safari-extension://')
              )
            },
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // <== 365 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firestore-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      injectRegister: 'auto',
      strategies: 'generateSW',
      includeManifestIcons: true,
      manifestTransforms: [
        (manifest) => {
          manifest.screenshots = []
          // Add both mobile-web-app-capable and apple-mobile-web-app-capable
          manifest.mobile_web_app_capable = 'yes'
          manifest.apple_mobile_web_app_capable = 'yes'
          return { manifest }
        },
      ],
    }),
  ],

  server: {
    port: 3000,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 3000,
    },
  },
  build: {
    rollupOptions: {
      external: ['workbox-window'],
    },
    target: 'esnext',
  },
})
