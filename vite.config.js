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
    // Cosmetic: main bundle sits ~1.5 MB even after manualChunks above
    // (Phase 67 added @xyflow/react ~200 KB, Phase 68 added a couple of
    // small plan-visibility components). Real fix would be route-level
    // React.lazy(); deferred until a real perf complaint.
    chunkSizeWarningLimit: 1600,
  },
});
