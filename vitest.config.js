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
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.{js,jsx}'],
    // Vite resolves import.meta.env for modules under src/; some of them read
    // it at module scope, so keep the Vite pipeline rather than a raw esbuild
    // transform.
    globals: false,
  },
});
