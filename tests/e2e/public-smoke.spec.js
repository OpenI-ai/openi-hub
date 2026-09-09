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

  test('requests the Turnstile script and logs no CSP violation', async ({ page }) => {
    // THE FE #36 REGRESSION, checked the only way that actually sees it. The
    // sitekey being present in the bundle proves nothing; what matters is
    // whether the browser was ALLOWED to fetch the script.
    //
    // Skipped when relayed: the container cannot reach Cloudflare at all, so a
    // missing request there is indistinguishable from a CSP block and the
    // assertion would prove nothing. The header check above still runs.
    test.skip(RELAYED, 'relayed container cannot reach challenges.cloudflare.com; CSP header test covers it');

    const turnstileRequests = [];
    const cspViolations = [];
    page.on('request', (r) => {
      if (r.url().includes('challenges.cloudflare.com')) turnstileRequests.push(r.url());
    });
    page.on('console', (msg) => {
      if (/Content Security Policy|Refused to (load|execute|frame)/i.test(msg.text())) {
        cspViolations.push(msg.text());
      }
    });

    await page.goto('/register', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4_000);

    expect(cspViolations, `CSP violations on /register: ${cspViolations.join(' | ')}`).toEqual([]);
    expect(
      turnstileRequests.length,
      'Turnstile script was never requested — check script-src AND frame-src in vercel.json'
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
