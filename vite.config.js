import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  build: {
    // s48 — split vendor chunks for better caching + parallel download.
    // recharts is heaviest non-react dep (~150KB); only used on admin/analytics surfaces.
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'charts': ['recharts'],
          'monitoring': ['@sentry/react'],
          'ui': ['lucide-react', 'react-hot-toast', 'react-joyride'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
