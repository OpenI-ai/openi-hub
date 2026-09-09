/**
 * s116 (9 Sep 2026) — layer 1 of the frontend test plan: a smoke suite that
 * loads real pages in a real browser.
 *
 * WHY A BROWSER AND NOT AN API PROBE. This repo's mandatory verification rule
 * (CLAUDE.md) exists because of FE #36: on 31 Aug 2026 the Turnstile CAPTCHA
 * shipped "fully verified" by live API probes plus bundle inspection — the
 * script URL and sitekey were confirmed in the served JS — and it never
 * rendered, because the CSP in vercel.json silently blocked
 * challenges.cloudflare.com. No HTTP error, no server log. Only a rendering
 * browser sees a CSP block. Every spec here therefore asserts that something
 * is VISIBLE, and the suite fails on CSP violations in the console.
 *
 * BASE URL. E2E_BASE_URL decides what is under test:
 *   - CI, on a PR: the Vercel preview URL for that PR.
 *   - A cloud container: http://localhost:8088, fronted by
 *     scripts/e2e-relay.mjs, because headless Chromium cannot reach external
 *     hosts through the agent proxy (BUGS.md, 7 Sep).
 *   - Unset: production, which is the right default for a human running it.
 *
 * BROWSER BINARY. Cloud sessions have Chromium preinstalled at
 * /opt/pw-browsers. NEVER run `playwright install` here — CLAUDE.md says so
 * and the download is blocked anyway.
 */
import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL || 'https://openi.ai';

export default defineConfig({
  testDir: './tests/e2e',
  // Every spec talks to a deployed site, so a slow cold start is normal and a
  // hung page must still fail rather than stall the job.
  timeout: 45_000,
  expect: { timeout: 10_000 },

  // These are read-only smoke tests against a SHARED deployment. Retrying a
  // genuine failure wastes a minute; retrying a network blip saves a red build
  // nobody will read. One retry in CI only.
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  forbidOnly: !!process.env.CI,

  reporter: process.env.CI ? [['github'], ['list']] : [['list']],

  use: {
    baseURL,
    // A failure against a deployed site is often unreproducible later, so keep
    // the evidence from the first attempt.
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    ignoreHTTPSErrors: true,
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          // Cloud containers pin a Chromium build that will NOT match whatever
          // @playwright/test wants next (today: installed expects 1243, the
          // container ships 1194), so PLAYWRIGHT_BROWSERS_PATH alone fails with
          // "Executable doesn't exist". /opt/pw-browsers/chromium is a stable
          // symlink to the real binary and is what CLAUDE.md tells you to use.
          // Unset on a normal dev machine, where Playwright resolves its own.
          ...(process.env.PLAYWRIGHT_CHROMIUM_PATH
            ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
            : {}),
        },
      },
    },
  ],
});
