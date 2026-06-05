import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  root: 'public',
  base: './',
  esbuild: {
    drop: ['console'],
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'public/index.html'),
        admin: resolve(__dirname, 'public/admin.html'),
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/client'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
