import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron-renderer';

export default defineConfig({
  plugins: [react(), electron()],
  root: '.',
  build: {
    outDir: 'dist/renderer',
    sourcemap: true
  },
  server: {
    port: 5173
  }
});
