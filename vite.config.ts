import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  esbuild: {
    jsx: 'automatic',
  },
  base: './',
  server: {
    port: 5173,
    host: true,
    watch: {
      ignored: [
        '**/src-tauri/target/**',
        '**/.tools/**',
        '**/dist/**',
        '**/.next/**',
        '**/.git/**',
        '**/node_modules/**',
        '**/fixtures/**',
      ],
    },
  },
  preview: {
    port: 4173,
    host: true,
  },
});
