import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  esbuild: {
    jsx: 'automatic',
  },
  resolve: {
    alias: {
      '@xerox/customer-web/css': path.resolve(__dirname, 'apps/customer-web/src/index.css'),
      '@xerox/customer-web': path.resolve(__dirname, 'apps/customer-web/src/App.tsx'),
    },
  },
  base: '/',
  server: {
    port: 5173,
    host: true,
  },
  preview: {
    port: 4173,
    host: true,
  },
});

