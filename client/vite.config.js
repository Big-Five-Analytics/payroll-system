import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon.ico', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Big Five Investments — Payroll',
        short_name: 'BFI Payroll',
        description: 'Payroll management system for Big Five Investments',
        theme_color: '#172253',
        background_color: '#172253',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      // The default generateSW strategy only precaches the built app shell
      // (JS/CSS/HTML/icons) - it does not intercept or cache /api/* calls unless a
      // runtimeCaching rule is added for them, which is intentional here: this app
      // shouldn't serve stale/offline payroll data, only load the shell fast/offline.
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
