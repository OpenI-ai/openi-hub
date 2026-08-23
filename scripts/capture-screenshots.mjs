#!/usr/bin/env node
/**
 * capture-screenshots — re-shoot the homepage slideshow images (s85).
 *
 * PlatformSlideshow.jsx serves eight PNGs out of public/screenshots/. They are
 * 1x and visibly soft on any retina display, which is most of the audience for
 * a marketing slideshow. This re-shoots all eight at deviceScaleFactor 2.
 *
 * ── RUN IT AGAINST PRODUCTION, NOT A LOCAL SEED ──────────────────────────────
 * This matters more than the resolution. A locally seeded database produces
 * images that are WORSE than the ones already committed:
 *
 *   Directory     "11 profiles found", and the profiles are named `startup`,
 *                 `student`, `corporate`, `govt` -- the demo account handles.
 *                 The slideshow caption for that image says "583K+ startup
 *                 profiles".
 *   Marketplace   "0 opportunities found". The seeded challenges are
 *                 invite_only by design, so the owner's Browse tab is empty.
 *   Startup       Profile 0%, 0 viewers, 0 meetings, 0 messages.
 *
 * No amount of capture tuning fixes that; only real data does. So point BASE at
 * the deployed app.
 *
 * ── USAGE ────────────────────────────────────────────────────────────────────
 *   OPENI_BASE=https://app.openi.ai \
 *   OPENI_API=https://openi-hub-production.up.railway.app/api \
 *   OPENI_PASSWORD='...' \
 *     node scripts/capture-screenshots.mjs
 *
 * Writes into public/screenshots/ by default (OPENI_OUT to change). Review the
 * diff before committing -- this overwrites shipped marketing assets.
 *
 * The password is read from the environment and never logged. Prefix the
 * command with a space, or use a shell that ignores space-prefixed history, if
 * you would rather it not land in .zsh_history.
 *
 * ── WHY IT LOGS IN OVER THE API ──────────────────────────────────────────────
 * Driving the login FORM took minutes per shot and frequently hung: the
 * dashboards poll, so `networkidle` never fires. This logs in over the API and
 * injects the session into localStorage instead. Same end state, deterministic,
 * and about 20s for all eight.
 *
 * It also pre-marks every persona's tour as seen. TourWrapper auto-starts a
 * tour on first visit per role, which dims the page and parks a tooltip
 * mid-screen -- the one thing that must not appear in a marketing screenshot.
 * The key is per-ROLE (tourService.hasUserSeenTour -> ls[role]), so a wildcard
 * does nothing; every role has to be listed.
 */
import { mkdirSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Playwright is imported dynamically and is NOT a devDependency of this repo.
// This repo's devDeps are build and lint tooling only (9 runtime deps total);
// browser automation lives in openi-hub-backend/e2e/. Adding ~1 browser
// download to every contributor's `npm install` to support a script that runs
// maybe twice a year is a bad trade, so it is opt-in with a clear prompt.
// OPENI_PLAYWRIGHT lets you point at an existing install rather than adding one
// here -- e.g. the sibling backend repo, which already carries it for its e2e
// suite. Node resolves bare specifiers from the SCRIPT's location, not the cwd,
// so simply running this file from another directory does NOT pick up that
// repo's node_modules; the path has to be explicit.
let chromium;
const PW_PATH = process.env.OPENI_PLAYWRIGHT;

// A RELATIVE OPENI_PLAYWRIGHT has to be resolved against the cwd here, not left
// to import(). Dynamic import resolves a relative specifier against the
// importing MODULE — this file, in scripts/ — so the `../openi-hub-backend/...`
// this script used to suggest looked for openi-hub/openi-hub-backend and never
// resolved. Anyone following the hint got the same failure that sent them here.
// A bare package specifier (no separator, no leading dot) is passed straight
// through so `@playwright/test` still works.
function playwrightSpecifier(raw) {
  if (!raw) return '@playwright/test';
  const looksLikePath = raw.startsWith('.') || raw.startsWith('/') || raw.includes('/node_modules/');
  return looksLikePath ? pathToFileURL(resolve(process.cwd(), raw)).href : raw;
}

try {
  ({ chromium } = await import(playwrightSpecifier(PW_PATH)));
} catch (err) {
  console.error(
    'This script needs Playwright, which is deliberately not a dependency of\n' +
    'this repo (devDeps here are build and lint tooling only).\n\n' +
    'Either install it just for this run:\n' +
    '  npm i --no-save @playwright/test && npx playwright install chromium\n\n' +
    'or point OPENI_PLAYWRIGHT at an existing install -- the package ENTRY FILE,\n' +
    'not the directory. Relative to your shell\'s cwd is fine:\n' +
    '  OPENI_PLAYWRIGHT=../openi-hub-backend/node_modules/@playwright/test/index.mjs \\\n' +
    '    npm run screenshots\n'
  );
  if (PW_PATH) console.error(`OPENI_PLAYWRIGHT was ${PW_PATH}\n  -> resolved to ${playwrightSpecifier(PW_PATH)}\n  -> ${err.message}`);
  process.exit(1);
}

const HERE = dirname(fileURLToPath(import.meta.url));
const BASE = (process.env.OPENI_BASE || 'http://localhost:3000').replace(/\/$/, '');
const API  = (process.env.OPENI_API  || 'http://localhost:5000/api').replace(/\/$/, '');
const OUT  = process.env.OPENI_OUT   || resolve(HERE, '..', 'public', 'screenshots');
const PW   = process.env.OPENI_PASSWORD;
// Pin an existing browser instead of Playwright's downloaded one. The usual
// reason is that `npx playwright install chromium` failed and you would
// rather use the Chrome already on the machine than fight a proxy.
const EXEC = process.env.OPENI_CHROMIUM || undefined;

if (!PW) {
  console.error('OPENI_PASSWORD is required (the shared demo-account password).');
  process.exit(1);
}

// file -> which persona sees it, and where. Filenames must match
// src/components/PlatformSlideshow.jsx exactly or the slideshow 404s.
const SHOTS = [
  { file: '01-login.png',               email: null,                      path: '/login' },
  { file: '02-startup-dashboard.png',   email: 'startup@demo.openi.ai',   path: '/dashboard' },
  { file: '03-student-portfolio.png',   email: 'student@demo.openi.ai',   path: '/dashboard' },
  { file: '04-incubator-programs.png',  email: 'incubator@demo.openi.ai', path: '/dashboard' },
  { file: '05-corporate-dashboard.png', email: 'corporate@demo.openi.ai', path: '/dashboard' },
  { file: '05-marketplace.png',         email: 'corporate@demo.openi.ai', path: '/dashboard/marketplace' },
  { file: '07-directory.png',           email: 'investor@demo.openi.ai',  path: '/dashboard/directory' },
  { file: '08-academia-portfolio.png',  email: 'academia@demo.openi.ai',  path: '/dashboard' },
  // 22 Aug 2026 — the three slides PlatformSlideshow.jsx still has commented
  // out (its "TODO s51"). They were missing from this list, so running this
  // script re-shot the eight that already existed and produced none of the
  // three that were actually wanted. Route and persona for each were confirmed
  // by loading them: "Recommended Startups", "8-Vector Startup Evaluation" and
  // the investor dashboard all render for these personas with no upgrade gate.
  { file: '09-recommended-startups.png', email: 'corporate@demo.openi.ai', path: '/dashboard/corporate/recommended-startups' },
  { file: '10-ai-profile-score.png',     email: 'startup@demo.openi.ai',   path: '/dashboard/evaluate' },
  // /dashboard, not /dashboard/investor/deals, was the first guess here and it
  // was wrong: the slide's caption is "7-stage deal pipeline, AI-evaluated
  // startups, 583K-startup sourcing engine", and the investor landing page
  // shows none of that — the production shot came back as the AI Profile
  // Insights card. InvestorDeals.jsx:16-24 defines exactly seven stages
  // (Sourced, Evaluating, LOI, Diligence, Term Sheet, Closed, Passed), which is
  // the thing the caption is describing.
  { file: '11-investor-dashboard.png',   email: 'investor@demo.openi.ai',  path: '/dashboard/investor/deals' },
];

const ROLES = ['startup','student','academia','corporate','govt','investor','lab',
               'incubator','accelerator','serviceprovider','mentor','evaluator','admin'];

async function login(email) {
  const r = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: PW }),
  });
  if (!r.ok) {
    // 429 is the one you will actually hit: the auth limiter is 20 per 15 min
    // per IP and AuthContext fires /auth/me on every page load.
    throw new Error(r.status === 429
      ? 'rate limited (auth limiter is 20/15min per IP) — wait and re-run'
      : `login failed: HTTP ${r.status}`);
  }
  return r.json();
}

mkdirSync(OUT, { recursive: true });
console.log(`base ${BASE}\napi  ${API}\nout  ${OUT}\n`);

let browser;
try {
  browser = await chromium.launch(EXEC ? { executablePath: EXEC } : {});
} catch (err) {
  // The failure people actually hit here is not a bug in this script: Playwright
  // is installed but its browser BINARIES are not, and `npx playwright install
  // chromium` can just fail — a proxy, a firewall, or a bad day for the CDN.
  // OPENI_CHROMIUM has always been the way out of that and was documented only
  // in a code comment, which is no use to someone reading a stack trace.
  console.error(
    `Could not launch Chromium: ${err.message.split('\n')[0]}\n\n` +
    (EXEC
      ? `OPENI_CHROMIUM was set to:\n  ${EXEC}\nCheck that path exists and is the executable itself.\n`
      : 'If the browser download failed, you do not have to fix the download —\n' +
        'point OPENI_CHROMIUM at a Chrome/Chromium you already have:\n\n' +
        '  macOS:  OPENI_CHROMIUM="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"\n' +
        '  Linux:  OPENI_CHROMIUM=/usr/bin/google-chrome\n\n' +
        'or retry the download:  npx playwright install chromium\n')
  );
  process.exit(1);
}
// ── BLANK-FRAME GUARD ────────────────────────────────────────────────────────
// page.screenshot() throws on a protocol error and on nothing else. It does not
// care whether the page painted, so "no exception" was never evidence that the
// shot is usable.
//
// On 22 Aug 2026 this script printed `OK   01-login.png` and committed 2880x1800
// of a single colour, rgb(251,250,248). /login is a client-rendered route with no
// auth to inject, so it had nothing on screen when the fixed settle window
// elapsed. It shipped to production as the FIRST slide of the homepage
// slideshow -- the one every visitor sees before the carousel advances -- and
// was reported as "blank page rendering on home page see it in action".
//
// Two checks, because they catch different failures. Waiting for text catches a
// page that has not rendered yet and costs nothing when it already has. The
// pixel check catches the rest: painted chrome with an empty body, a splash
// screen, a full-bleed overlay.
const MIN_TEXT     = Number(process.env.OPENI_MIN_TEXT || 40);
const BLANK_SHARE  = Number(process.env.OPENI_BLANK_SHARE || 0.90);

/** Resolve once the body has real text, rather than trusting a fixed timeout. */
async function waitForPaint(page) {
  await page.waitForFunction(
    (min) => (document.body?.innerText || '').trim().length >= min,
    MIN_TEXT,
    { timeout: 15000 },
  );
}

/**
 * Share of sampled pixels holding the single most common colour, 0..1.
 *
 * Measured on the eleven slides in this list: real captures sit between 0.33
 * and 0.48, the blank one was 1.00. The 0.90 default sits well clear of both,
 * so a legitimately flat-but-real screenshot is not going to trip it.
 *
 * Downscales to 160x100 first -- this only has to answer "is anything here",
 * and sampling 16k pixels answers it as well as sampling 5.2M.
 */
async function dominantColourShare(page, buf) {
  return page.evaluate(async (dataUrl) => {
    const img = new Image();
    await new Promise((ok, no) => { img.onload = ok; img.onerror = no; img.src = dataUrl; });
    const w = 160, h = 100;
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);
    const d = ctx.getImageData(0, 0, w, h).data;
    const counts = new Map();
    for (let i = 0; i < d.length; i += 4) {
      const k = (d[i] << 16) | (d[i + 1] << 8) | d[i + 2];
      counts.set(k, (counts.get(k) || 0) + 1);
    }
    return Math.max(...counts.values()) / (w * h);
  }, `data:image/png;base64,${buf.toString('base64')}`);
}

let ok = 0, failed = 0;

for (const s of SHOTS) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  try {
    if (s.email) {
      const { token, user } = await login(s.email);
      await ctx.addInitScript(([t, u, role, roles]) => {
        localStorage.setItem('openi_token', t);
        localStorage.setItem('openi_user', u);
        localStorage.setItem('openi_active_role', role);
        localStorage.setItem('openi_tours', JSON.stringify(
          Object.fromEntries(roles.map(k => [k, true]))));
      }, [token, JSON.stringify(user), user.primary_role || user.role, ROLES]);
    }
    const page = await ctx.newPage();
    // domcontentloaded, NOT networkidle: the dashboards poll and never idle.
    await page.goto(`${BASE}${s.path}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(Number(process.env.OPENI_SETTLE_MS || 5000));
    for (const name of [/skip tour/i, /^close$/i]) {
      const b = page.getByRole('button', { name });
      if (await b.count()) { await b.first().click().catch(() => {}); await page.waitForTimeout(400); }
    }
    await waitForPaint(page);
    const buf = await page.screenshot();
    const share = await dominantColourShare(page, buf);
    if (share >= BLANK_SHARE) {
      // Deliberately not written. A blank file on disk looks like a successful
      // capture to every later reader, including `git diff --stat`.
      throw new Error(
        `blank capture — ${(share * 100).toFixed(1)}% of pixels are one colour ` +
        `(threshold ${(BLANK_SHARE * 100).toFixed(0)}%); previous file left untouched`);
    }
    await writeFile(`${OUT}/${s.file}`, buf);
    console.log(`OK   ${s.file.padEnd(28)} "${await page.title()}"  (flat ${(share * 100).toFixed(0)}%)`);
    ok++;
  } catch (e) {
    console.log(`FAIL ${s.file.padEnd(28)} ${e.message.split('\n')[0].slice(0, 110)}`);
    failed++;
  }
  await ctx.close();
}

await browser.close();
console.log(`\n${ok} captured, ${failed} failed.`);
if (failed) process.exitCode = 1;
else console.log('Review `git diff --stat public/screenshots/` before committing.');
