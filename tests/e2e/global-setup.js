/**
 * Two jobs, both learned the hard way on 9 Sep 2026.
 *
 * 1. FAIL FAST WHEN THE TARGET IS NOT THE APP. The Vercel project runs SSO
 *    protection with deploymentType "all_except_custom_domains", so every
 *    PREVIEW deployment answers with a login page. The first real CI run spent
 *    4.5 minutes producing eleven identical timeouts and one VACUOUS pass — the
 *    "no analytics before consent" spec held because a login page has no
 *    analytics either. One probe up front turns that into a named error.
 *
 * 2. UNLOCK THE PREVIEW WITH A COOKIE, NOT A HEADER. The obvious way to send
 *    Vercel's bypass secret is Playwright's `extraHTTPHeaders`. Do not: those
 *    headers go on EVERY request, including cross-origin ones, which promotes
 *    simple requests to CORS preflights that third parties reject. It broke
 *    four specs with
 *        Access to font at 'https://fonts.gstatic.com/...' blocked by CORS
 *        policy: Request header field x-vercel-set-bypass-cookie is not
 *        allowed by Access-Control-Allow-Headers in preflight response
 *    — a failure entirely manufactured by the test setup. Vercel also accepts
 *    the bypass as QUERY PARAMETERS, which sets a cookie scoped to the
 *    deployment host. One request here, saved as storageState, and every later
 *    request is a plain same-origin one with no custom headers anywhere.
 */
import { request } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

export const STORAGE_STATE = path.join(process.cwd(), 'test-results', '.vercel-bypass.json');

export default async function globalSetup(config) {
  const baseURL = config.projects[0].use.baseURL;
  const secret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

  const ctx = await request.newContext();

  // With a secret, ask for the bypass cookie in the same request that probes
  // the target — one round trip does both jobs.
  const probeUrl = secret
    ? `${baseURL}?x-vercel-protection-bypass=${encodeURIComponent(secret)}&x-vercel-set-bypass-cookie=true`
    : baseURL;

  let res;
  try {
    res = await ctx.get(probeUrl, { timeout: 20_000 });
  } catch (err) {
    await ctx.dispose();
    throw new Error(`E2E target ${baseURL} is unreachable: ${err.message}`);
  }

  const status = res.status();
  const body = await res.text().catch(() => '');

  // Vercel SSO answers 401/403, or serves its own login page.
  const looksLikeVercelAuth =
    status === 401 ||
    status === 403 ||
    /vercel\.com\/sso-api|Authentication Required|_vercel\/sso/i.test(body);

  if (looksLikeVercelAuth) {
    await ctx.dispose();
    throw new Error(
      `E2E target ${baseURL} is behind Vercel deployment protection (HTTP ${status}).\n` +
      (secret
        ? `VERCEL_AUTOMATION_BYPASS_SECRET is set but was rejected — check the value matches the\n` +
          `one shown under Protection Bypass for Automation on the Vercel project.`
        : `Set the VERCEL_AUTOMATION_BYPASS_SECRET Actions secret from the Vercel project's\n` +
          `Protection Bypass for Automation setting. e2e.yml passes it through when present.`) +
      `\nProduction (openi.ai) is on a custom domain and is NOT affected by this.`
    );
  }

  if (status >= 400) {
    await ctx.dispose();
    throw new Error(`E2E target ${baseURL} answered HTTP ${status} — nothing to smoke test.`);
  }

  // Hand the bypass cookie to the browser contexts. Written even without a
  // secret so `storageState` always has a file to point at.
  fs.mkdirSync(path.dirname(STORAGE_STATE), { recursive: true });
  await ctx.storageState({ path: STORAGE_STATE });
  await ctx.dispose();
}
