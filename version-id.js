// Cache-busting build ID — single source of truth.
//
// Used by:
//   - vite.config.js : baked into the client bundle as the `__APP_VERSION__`
//     global (the version a running tab booted with).
//   - gen-version.js : written to dist/version.json (the version the CDN is
//     currently serving), polled at runtime by src/hooks/useVersionCheck.js.
//
// Vercel sets VERCEL_GIT_COMMIT_SHA on every deploy, so the value is unique and
// deterministic per deploy with no extra env config. Locally it is unset, so it
// falls back to 'dev' and the runtime check no-ops (see useVersionCheck).
export const BUILD_ID = process.env.VERCEL_GIT_COMMIT_SHA || 'dev';
