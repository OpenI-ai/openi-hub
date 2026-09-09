/**
 * Public smoke — the pages any visitor can reach, asserted in a real browser.
 *
 * These are deliberately shallow and deliberately RENDERED. The class of bug
 * they exist to catch is FE #36: Turnstile shipped "fully verified" on 31 Aug
 * 2026 by live API probes plus bundle inspection, and never appeared, because
 * the CSP in vercel.json blocked challenges.cloudflare.com. There was no HTTP
 * error and no server log. A visibility assertion plus a console watch is the
 * only thing that sees it.
 *
 * Read-only by design: these run against a shared deployment, so nothing here
 * submits a form, creates an account, or mutates anything.
 *
 * TWO ENVIRONMENTS, DIFFERENT POWERS — read this before adding a spec.
 *   - CI / a real machine: direct egress. Every assertion below is meaningful.
 *   - A cloud container behind scripts/e2e-relay.mjs (E2E_RELAYED=1): the
 *     browser can reach ONLY the relay origin. Requests to api.openi.ai,
 *     Cloudflare, Google and Sentry all die as ERR_TUNNEL_CONNECTION_FAILED
 *     or ERR_CONNECTION_RESET. Those are container limits, NOT page defects,
 *     so they are tolerated there and stay fatal everywhere else.
 * Never widen the relayed tolerances to make CI green — that is how you get a
 * suite that passes while the site is broken, which is exactly FE #36 again.
 */
import { test, expect } from '@playwright/test';

/** True when the browser is talking through scripts/e2e-relay.mjs. */
const RELAYED = process.env.E2E_RELAYED === '1';

/**
 * Collects console errors and page errors. CSP violations surface as console
 * errors and nowhere else, which is why this helper exists rather than just
 * asserting on the DOM.
 */
function watchConsole(page) {
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  return errors;
}

/** Console noise that is not a page defect and would otherwise make this flaky. */
const IGNORABLE = [
  /favicon/i,
  /Failed to load resource: the server responded with a status of 40[34]/i,
  // Analytics and error reporting are blocked by many corporate networks and
  // by ad blockers. Their absence is not a page defect.
  /_vercel\/insights/i,
  /googletagmanager|google-analytics|gtag/i,
  /sentry/i,
];

/**
 * Transport failures that ONLY a relayed container produces. Kept separate
 * from IGNORABLE so they cannot silently soften a CI run: in CI these mean the
 * site really cannot reach its own API, which is a genuine outage.
 */
const RELAY_ONLY = [
  /net::ERR_TUNNEL_CONNECTION_FAILED/,
  /net::ERR_CONNECTION_RESET/,
  /net::ERR_NAME_NOT_RESOLVED/,
  /net::ERR_PROXY_CONNECTION_FAILED/,
  /Failed to fetch/i,
];

function realErrors(errors) {
  const patterns = RELAYED ? [...IGNORABLE, ...RELAY_ONLY] : IGNORABLE;
  return errors.filter((e) => !patterns.some((re) => re.test(e)));
}

test.describe('landing page', () => {
  test('renders and reports no console errors', async ({ page }) => {
    const errors = watchConsole(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // The React root must actually paint. A white page with a 200 status is
    // the failure mode a status-code check misses.
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('#root')).not.toBeEmpty();
    await expect(page).toHaveTitle(/.+/);

    const real = realErrors(errors);
    expect(real, `console errors on /: ${real.join(' | ')}`).toEqual([]);
  });

  test('offers a route into the product', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    // Not asserting exact copy — the landing page was fully redesigned in s109
    // and will change again. That there is SOME way to sign in or register is
    // the invariant worth pinning.
    const entry = page.locator('a[href*="register"], a[href*="login"]');
    await expect(entry.first()).toBeVisible();
  });
});

test.describe('content security policy', () => {
  // The corollary rule in CLAUDE.md: any new third-party script needs a
  // matching CSP entry — script-src, plus frame-src if it renders an iframe.
  // This reads the SERVED header, so it is meaningful in every environment
  // including a relayed container, and it is the cheapest possible guard
  // against a repeat of FE #36.
  test('allows Turnstile in both script-src and frame-src', async ({ request }) => {
    const res = await request.get('/register');
    const csp = res.headers()['content-security-policy'];
    expect(csp, 'no Content-Security-Policy header on /register').toBeTruthy();

    const directive = (name) => (csp.split(';').find((d) => d.trim().startsWith(name)) || '');
    // Turnstile needs BOTH: the script to load, and the iframe to render.
    // Only one of the two was the FE #36 bug.
    expect(directive('script-src'), 'Turnstile missing from script-src').toContain('challenges.cloudflare.com');
    expect(directive('frame-src'), 'Turnstile missing from frame-src').toContain('challenges.cloudflare.com');
  });

  test('allows the analytics and payment origins the app actually loads', async ({ request }) => {
    const res = await request.get('/');
    const csp = res.headers()['content-security-policy'] || '';
    const scriptSrc = csp.split(';').find((d) => d.trim().startsWith('script-src')) || '';
    // Each of these is loaded by shipped code; a CSP that omits one produces a
    // silent, browser-only failure.
    expect(scriptSrc).toContain('googletagmanager.com'); // GA4, FE #71
    expect(scriptSrc).toContain('checkout.razorpay.com'); // payments
  });
});

test.describe('cookie consent banner', () => {
  // Added in FE #71 as the banner /privacy §6 promised, and it gates gtag.
  // If it stops rendering, GA4 either never loads or loads without consent —
  // the second is a compliance problem, and neither shows up in an API probe.
  test('renders for a fresh visitor', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const banner = page.getByText(/cookie/i).first();
    await expect(banner).toBeVisible({ timeout: 15_000 });
  });

  test('does not load Google Analytics before consent is given', async ({ page }) => {
    const gtagRequests = [];
    page.on('request', (r) => {
      if (/googletagmanager\.com|google-analytics\.com/.test(r.url())) gtagRequests.push(r.url());
    });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2_000);
    expect(gtagRequests, `gtag loaded before consent: ${gtagRequests.join(' | ')}`).toEqual([]);
  });
});

test.describe('register page', () => {
  test('opens on the persona chooser', async ({ page }) => {
    // /register does NOT open on an email field — it opens on "Choose your
    // persona", and the credentials form only appears after a role is picked.
    // Writing this spec is what established that; the first draft asserted an
    // email input and failed against a perfectly healthy page.
    const errors = watchConsole(page);
    await page.goto('/register', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: /choose your persona/i })).toBeVisible();
    // Both category groups must offer at least one role, or a whole half of
    // the funnel is unreachable.
    await expect(page.getByRole('button', { name: /^Startup/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Corporate/ })).toBeVisible();

    const real = realErrors(errors);
    expect(real, `console errors on /register: ${real.join(' | ')}`).toEqual([]);
  });

  test('reveals the credentials form after a persona is chosen', async ({ page }) => {
    await page.goto('/register', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /^Startup/ }).click();

    await expect(page.locator('input[type="email"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });

  test('requests the Turnstile script and logs no CSP violation', async ({ page, request }) => {
    // THE FE #36 REGRESSION, checked the only way that actually sees it. The
    // sitekey being present in the bundle proves nothing on its own; what
    // matters is whether the browser was ALLOWED to fetch the script.
    //
    // But "no request was made" has THREE possible causes, and they must not be
    // conflated:
    //   1. CSP blocked it            → the bug this test exists for.
    //   2. The network cannot reach Cloudflare → a relayed container.
    //   3. Turnstile is switched OFF in this build → not a bug at all.
    // TurnstileWidget.jsx is feature-flagged on VITE_TURNSTILE_SITE_KEY: with
    // the key unset it renders nothing and injects no script, deliberately, so
    // both halves deploy as a no-op. Vercel PREVIEW builds do not carry the
    // key (production does), so on a preview this test would fail for reason 3
    // while reading exactly like reason 1 — the worst kind of false alarm.
    //
    // So: rule out 2 and 3 explicitly before asserting anything.
    test.skip(RELAYED, 'relayed container cannot reach challenges.cloudflare.com; the CSP header test covers it');

    // Reason 3: read the served bundle and look for a Turnstile sitekey. Vite
    // inlines it at build time, so its absence means the flag is off.
    const registerHtml = await (await request.get('/register')).text();
    const bundlePath = (registerHtml.match(/\/assets\/index-[A-Za-z0-9_-]+\.js/) || [])[0];
    const bundle = bundlePath ? await (await request.get(bundlePath)).text() : '';
    // Cloudflare sitekeys are 24 chars and Vite inlines the value as a quoted
    // string literal. The leading digit varies by key TYPE — 0x… is a real
    // key, 1x/2x/3x… are the documented test keys (always-passes,
    // always-blocks, forces-interactive). Matching only `0x4` missed the
    // always-passes key configured for previews, so this check would have gone
    // on skipping while reporting itself satisfied.
    const turnstileEnabled = /["'][0-3]x[A-Za-z0-9]{22}["']/.test(bundle);
    test.skip(
      !turnstileEnabled,
      'VITE_TURNSTILE_SITE_KEY is not set in this build, so TurnstileWidget renders nothing by ' +
      'design. Set it for the Vercel Preview environment to exercise this check on PRs — note ' +
      'Cloudflare sitekeys are domain-scoped, so previews need one that allows *.vercel.app ' +
      '(or the always-passing test key).'
    );

    const turnstileRequests = [];
    const cspViolations = [];
    page.on('request', (r) => {
      if (r.url().includes('challenges.cloudflare.com')) turnstileRequests.push(r.url());
    });
    page.on('console', (msg) => {
      const t = msg.text();
      if (!/Content Security Policy|Refused to (load|execute|frame)/i.test(t)) return;
      // vercel.live is Vercel's own preview feedback toolbar, injected into
      // PREVIEW deployments only and never present in production. Allowing it
      // would mean carrying vercel.live in the production CSP for a script
      // production never loads, so the right move is to ignore it here.
      // Scoped to that one host on purpose: every other violation is the app's
      // and must fail, which is the entire point of this spec.
      if (t.includes('vercel.live')) return;
      cspViolations.push(t);
    });

    await page.goto('/register', { waitUntil: 'domcontentloaded' });

    // TurnstileWidget lives on STEP 2 of the wizard (Register.jsx:671), not on
    // the landing step — s101 deliberately put the bot check on the submitting
    // step because tokens expire. So the widget never mounts and the script is
    // never injected until the form is driven there. Loading /register and
    // waiting, as this spec first did, proves nothing.
    //
    // Nothing here submits: step 2 is the profile step, and the account is only
    // created by the button beyond it. These values never reach the database.
    await page.getByRole('button', { name: /^Startup/ }).click();
    await page.locator('input[placeholder="Your full name"]').fill('E2E Smoke');
    await page.locator('input[type="email"]').first().fill(`e2e-smoke-${Date.now()}@openi-e2e.invalid`);
    const pwd = page.locator('input[type="password"]');
    // Register.jsx:145 — step1Valid needs password === confirmPwd, both >= 6.
    await pwd.first().fill('E2eSmokePassw0rd');
    await pwd.nth(1).fill('E2eSmokePassw0rd');
    await page.locator('input[type="checkbox"]').first().check();
    await page.getByRole('button', { name: /Continue/ }).click();

    // Prove we actually got there before asserting on what step 2 loads.
    await expect(page.getByText(/Profile/i).first()).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(4_000);

    expect(cspViolations, `CSP violations on /register: ${cspViolations.join(' | ')}`).toEqual([]);
    expect(
      turnstileRequests.length,
      'Turnstile script was never requested on the step that renders it — check script-src AND frame-src in vercel.json'
    ).toBeGreaterThan(0);
  });

  test('captures UTM parameters from the LinkedIn sign-up link', async ({ page }) => {
    // The exact URL on the OpenI LinkedIn company page (s114). If this stops
    // working, signup attribution silently reports everything as (direct).
    await page.goto(
      '/register?utm_source=linkedin&utm_medium=company_page&utm_campaign=signup_button',
      { waitUntil: 'domcontentloaded' }
    );
    await page.waitForTimeout(1_500);
    const stored = await page.evaluate(() => {
      try { return sessionStorage.getItem('openi_utm'); } catch { return null; }
    });
    expect(stored, 'openi_utm was not written to sessionStorage').toBeTruthy();
    expect(JSON.parse(stored)).toMatchObject({ utm_source: 'linkedin' });
  });
});

test.describe('marketplace', () => {
  test('renders without console errors', async ({ page }) => {
    const errors = watchConsole(page);
    await page.goto('/marketplace', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#root')).not.toBeEmpty();
    // Not asserting a challenge COUNT: the marketplace legitimately empties
    // when every challenge closes, and a test that fails on a real business
    // state trains people to ignore red.
    const real = realErrors(errors);
    expect(real, `console errors on /marketplace: ${real.join(' | ')}`).toEqual([]);
  });
});

test.describe('login page', () => {
  test('renders the form', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });
});
