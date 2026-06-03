import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// Phase 106 - Sentry source maps for production debugging
import { sentryVitePlugin } from '@sentry/vite-plugin';
// Cache-busting P2 - bake the deploy's build ID into the client bundle as the
// __APP_VERSION__ global so a running tab knows the version it booted with.
// Compared at runtime against dist/version.json (see src/hooks/useVersionCheck).
import { BUILD_ID } from './version-id.js';

export default defineConfig({
  // __APP_VERSION__ is the version this bundle was built at. version-id.js reads
  // VERCEL_GIT_COMMIT_SHA (set per-deploy) and gen-version.js writes the same
  // value into dist/version.json, so client-baked and CDN-served IDs always match.
  define: {
    __APP_VERSION__: JSON.stringify(BUILD_ID),
  },
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
