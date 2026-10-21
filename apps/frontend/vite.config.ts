/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    ...(process.env.VITEST
      ? []
      : [
          VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icons/*.png'],
            manifest: {
              name: 'KiranaSathi - Smart Kirana Assistant',
              short_name: 'KiranaSathi',
              description: 'Offline-first inventory and reorder assistant for Indian kirana shops',
              theme_color: '#15803D',
              background_color: '#F8FAF7',
              display: 'standalone',
              orientation: 'portrait',
              icons: [
                {
                  src: '/icons/icon-192.png',
                  sizes: '192x192',
                  type: 'image/png',
                },
                {
                  src: '/icons/icon-512.png',
                  sizes: '512x512',
                  type: 'image/png',
                },
              ],
            },
            workbox: {
              globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
            },
          }),
        ]),
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
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
