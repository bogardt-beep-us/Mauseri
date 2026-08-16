import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'es2022',
    // Phaser is large; splitting it keeps the app chunk small enough to parse
    // quickly on mid-range phones while the engine loads in parallel.
    // Rolldown (ab Vite 8) erwartet manualChunks als Funktion - die
    // Objektschreibweise aus aelteren Vite-Versionen wird nicht mehr akzeptiert.
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/phaser')) return 'phaser';
          return undefined;
        },
      },
    },
    chunkSizeWarningLimit: 1600,
  },
  server: {
    host: true,
  },
});
