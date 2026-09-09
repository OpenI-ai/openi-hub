/**
 * s116 (9 Sep 2026) — the frontend's first test config.
 *
 * This repo had ZERO test files against ~70.8K lines of app code; ESLint and
 * `vite build` were the entire contract (see .github/workflows/ci.yml, which
 * says so in its own header). This is layer 2 of the three-layer plan Rajeev
 * agreed on 8 Sep: pure-JS units first, no coverage-% target, protect the
 * logic that actually breaks rather than the line count.
 *
 * environment: 'node' by default, NOT jsdom. Every spec here tests a pure
 * function, and a spec that needs a browser global says so per-file with a
 * `@vitest-environment` docblock. Defaulting the whole suite to jsdom would
 * make every future spec pay for a DOM it does not use, and would hide the
 * fact that these utils genuinely have no DOM dependency — safeStorage's
 * entire reason for existing is that `localStorage` may be absent or hostile.
 *
 * `include` is scoped to tests/ so vitest never tries to collect the .jsx
 * pages. Layer 3 (React Testing Library on Register / StartupEvaluation /
 * Marketplace) will need jsdom and a setup file; add them then, not now.
 *
 * ── s116k — LAYER 3 IS HERE, AND THE DEFAULT DID NOT CHANGE ────────────────
 * The three page specs live in tests/pages/ and each opts into jsdom with its
 * own `@vitest-environment jsdom` docblock — exactly the per-file convention
 * this header already described. `environment` stays 'node' on purpose: the
 * argument above still holds, and after adding 3 DOM specs there are still 6
 * pure-JS ones that would otherwise pay for a document they never touch.
 *
 * Rejected: flipping the global environment (contradicts the paragraph above),
 * and `environmentMatchGlobs` (deprecated in vitest 3, and this repo tracks
 * vitest 2.x — a directory rule would have to be rewritten at the next major
 * for no benefit the docblock does not already give).
 *
 * `setupFiles` runs for EVERY spec including the node ones, so tests/setup-dom.js
 * checks for a document before importing anything DOM-shaped. See its header.
 */
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // s116k — REQUIRED once any spec renders JSX. A vitest.config.js REPLACES
  // vite.config.js rather than merging with it, so the react() plugin
  // configured over there does not reach the test pipeline. Without it, JSX
  // compiles against the classic runtime and every render dies on
  // "ReferenceError: React is not defined" — which reads like a missing import
  // in the spec and is not. Layers 1-2 never hit this because no spec had JSX.
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.{js,jsx}'],
    setupFiles: ['./tests/setup-dom.js'],
    // Vite resolves import.meta.env for modules under src/; some of them read
    // it at module scope, so keep the Vite pipeline rather than a raw esbuild
    // transform.
    globals: false,
  },
});
