/**
 * Fail fast when the target URL is not actually the app.
 *
 * WHY THIS EXISTS. On 9 Sep 2026 the first real CI run of this suite sat for
 * over ten minutes and reported nothing. Cause: the Vercel project has SSO
 * protection enabled with deploymentType "all_except_custom_domains", so every
 * PREVIEW deployment answers with Vercel's login page instead of the app. Each
 * of the twelve specs then burned its full 45-second timeout, twice over with
 * the CI retry.
 *
 * A wall of identical timeouts is the worst possible failure report: it looks
 * like the app is broken when the truth is that the runner was never allowed
 * in. One request up front turns ten minutes of noise into a ten-second error
 * that names the real problem and the fix.
 */
import { request } from '@playwright/test';

export default async function globalSetup(config) {
  const { baseURL, extraHTTPHeaders } = config.projects[0].use;
  const ctx = await request.newContext({ extraHTTPHeaders });

  let res;
  try {
    res = await ctx.get(baseURL, { maxRedirects: 0, timeout: 20_000 });
  } catch (err) {
    await ctx.dispose();
    throw new Error(`E2E target ${baseURL} is unreachable: ${err.message}`);
  }

  const status = res.status();
  const body = await res.text().catch(() => '');
  await ctx.dispose();

  // Vercel SSO answers 401/403, or redirects to vercel.com/sso-api.
  const looksLikeVercelAuth =
    status === 401 ||
    status === 403 ||
    /vercel\.com\/sso-api|Authentication Required|_vercel\/sso/i.test(body);

  if (looksLikeVercelAuth) {
    throw new Error(
      `E2E target ${baseURL} is behind Vercel deployment protection (HTTP ${status}).\n` +
      `The suite cannot log in, so every spec would time out.\n` +
      `Fix, in order of preference:\n` +
      `  1. Enable Protection Bypass for Automation on the Vercel project, then add the\n` +
      `     generated secret to this repo as the VERCEL_AUTOMATION_BYPASS_SECRET Actions\n` +
      `     secret. e2e.yml already passes it through when present.\n` +
      `  2. Set ssoProtection to "only_preview_deployments: false" if previews should be\n` +
      `     public.\n` +
      `Production (openi.ai) is on a custom domain and is NOT affected by this.`
    );
  }

  if (status >= 400) {
    throw new Error(`E2E target ${baseURL} answered HTTP ${status} — nothing to smoke test.`);
  }
}
