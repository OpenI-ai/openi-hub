# CLAUDE.md — openi-hub (frontend)

Working conventions for Claude sessions in this repo. The session-by-session
history lives in `BUGS.md`; deployment, credentials, and infra state live in
`docs/reference/08-deployment-test-accounts.md` (§12). Read those before
re-deriving anything about Vercel, Railway, Cloudflare, or tokens.

## Verification & E2E convention (mandatory)

API probes and deployed-bundle greps are NOT sufficient to call a frontend
change "E2E verified". Any change that touches what the browser executes —
third-party scripts, `vercel.json` headers (especially Content-Security-Policy),
widgets/iframes, auth or registration flows — must ALSO be smoke-tested in a
real browser against the deployed page before it is reported as verified:

- Cloud sessions have Chromium preinstalled: use Playwright with
  `executablePath: '/opt/pw-browsers/chromium'` (never run `playwright
  install`). Load the live page, assert the feature actually **renders**
  (element present and visible), and capture the browser console — CSP and
  script-load failures appear there and nowhere else.
- **Why this rule exists:** on 31 Aug 2026 the Turnstile CAPTCHA shipped
  "fully verified" by live API probes plus bundle inspection (script URL and
  sitekey confirmed in the served JS) — yet it never rendered, because this
  repo's CSP in `vercel.json` silently blocked `challenges.cloudflare.com`.
  No HTTP error, no server log; only a rendering browser sees a CSP block.
  Rajeev's manual walkthrough caught it. See `BUGS.md`, 31 Aug entry (FE #36).
- **Corollary:** adding ANY new third-party script requires a matching CSP
  entry in `vercel.json` — `script-src`, plus `frame-src` if it renders an
  iframe (Turnstile needs both). Grep the CSP line before shipping.

- **Container gotcha (7 Sep 2026):** `curl` reaches openi.ai through the agent
  proxy but headless Chromium gets `ERR_CONNECTION_RESET` on every external host
  (proxy flags, HTTP/2 / QUIC / post-quantum toggles do not help). Do not give up
  on the rendered check: run a tiny local relay (`http://localhost:8088/*` →
  `https://openi.ai/*` via undici `ProxyAgent` with `SSL_CERT_FILE`, response
  headers passed through untouched) and point Playwright at localhost. The
  browser then executes the production bundle under the production CSP header
  and the same-origin Vercel beacon works. Recipe in `BUGS.md`, 7 Sep (later).

Admin-gated pages that unauthenticated probes cannot reach still need a human
eyeball pass — when closing a session, list those checks explicitly for Rajeev
instead of implying they were covered.
