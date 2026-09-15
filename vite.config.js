import { defineConfig } from 'vite';

// base relativa: funciona no GitHub Pages (/Auris-Oasis/) e localmente
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1000,
  },
});
