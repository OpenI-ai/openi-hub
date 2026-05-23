import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// Phase 106 - Sentry source maps for production debugging
import { sentryVitePlugin } from '@sentry/vite-plugin';

export default defineConfig({
  plugins: [
    react(),
    // Phase 106 - upload sourcemaps to Sentry on every prod build.
    // Auth token + org + project must be set on Vercel as env vars.
    // Skips silently in dev mode (VITE_SENTRY_AUTH_TOKEN unset locally).
    sentryVitePlugin({
      authToken: process.env.SENTRY_AUTH_TOKEN,
      org: process.env.SENTRY_ORG_SLUG,
      project: process.env.SENTRY_PROJECT_SLUG || 'openi-hub-frontend',
      // Tag uploads with the same release the runtime SDK reports
      release: { name: process.env.VITE_SENTRY_RELEASE },
      // Delete sourcemaps from the dist/ output after upload so they
      // never reach public CDN (source code stays private; Sentry has them).
      sourcemaps: {
        filesToDeleteAfterUpload: ['./dist/**/*.map'],
      },
      // Silent skip if no auth token (dev/preview without Sentry setup)
      disable: !process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
  server: {
    port: 3000,
  },
  build: {
    // Phase 106 - generate sourcemaps so the plugin can upload them.
    // They get deleted from dist/ after upload (see sourcemaps.filesToDeleteAfterUpload).
    sourcemap: true,
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
