/**
 * e2e-relay — makes the Playwright smoke suite runnable from a cloud container.
 *
 * THE PROBLEM (banked in CLAUDE.md and BUGS.md, 7 Sep 2026). In an agent
 * container, `curl` reaches openi.ai through the agent proxy but headless
 * Chromium gets ERR_CONNECTION_RESET on EVERY external host. Proxy flags and
 * the HTTP/2 / QUIC / post-quantum TLS toggles make no difference. So the
 * browser cannot load the deployed site directly, and a rendered check is the
 * only thing that catches a CSP block (FE #36: Turnstile shipped "fully
 * verified" by API probes and bundle greps, and never rendered).
 *
 * THE FIX. Relay localhost -> the target origin through undici's ProxyAgent,
 * passing response headers through UNTOUCHED, and point Playwright at
 * localhost. The browser then executes the real bundle under the real CSP
 * header, which is the whole point — rewriting or stripping headers here would
 * silently disable the check this suite exists to perform.
 *
 * NOT NEEDED IN CI. GitHub Actions runners have direct egress, so ci.yml
 * points E2E_BASE_URL straight at the Vercel preview URL and never starts this.
 *
 *   node scripts/e2e-relay.mjs                 # relays to https://openi.ai
 *   E2E_TARGET=https://app.openi.ai node scripts/e2e-relay.mjs
 */
import { createServer } from 'node:http';
import { fetch as undiciFetch, ProxyAgent, Agent } from 'undici';

const TARGET = (process.env.E2E_TARGET || 'https://openi.ai').replace(/\/$/, '');
const PORT = Number(process.env.E2E_RELAY_PORT || 8088);
const PROXY = process.env.HTTPS_PROXY || process.env.https_proxy;

// The container's proxy terminates TLS with its own CA. Node reads it from
// SSL_CERT_FILE / NODE_EXTRA_CA_CERTS; undici needs it passed explicitly.
const dispatcher = PROXY ? new ProxyAgent(PROXY) : new Agent();

// Hop-by-hop headers are meaningless to relay, and a stale content-length or a
// re-applied content-encoding corrupts the body undici has already decoded.
const DROP_REQUEST = new Set(['host', 'connection', 'accept-encoding']);
const DROP_RESPONSE = new Set(['content-encoding', 'content-length', 'transfer-encoding', 'connection']);

const server = createServer(async (req, res) => {
  try {
    const headers = {};
    for (const [k, v] of Object.entries(req.headers)) {
      if (!DROP_REQUEST.has(k.toLowerCase())) headers[k] = v;
    }

    const upstream = await undiciFetch(TARGET + req.url, {
      method: req.method,
      headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : req,
      duplex: 'half',
      redirect: 'manual',
      dispatcher,
    });

    for (const [k, v] of upstream.headers) {
      // Everything else passes through verbatim — Content-Security-Policy
      // above all. If this ever starts rewriting CSP, the suite stops testing
      // the thing it was written to test.
      if (!DROP_RESPONSE.has(k.toLowerCase())) res.setHeader(k, v);
    }
    res.writeHead(upstream.status);
    res.end(Buffer.from(await upstream.arrayBuffer()));
  } catch (err) {
    // 502 rather than a hang, so a failing spec reports a transport problem
    // instead of timing out with no explanation.
    res.writeHead(502, { 'content-type': 'text/plain' });
    res.end(`relay error: ${err.message}`);
  }
});

server.listen(PORT, () => {
  console.log(`[e2e-relay] http://localhost:${PORT}  ->  ${TARGET}${PROXY ? '  (via agent proxy)' : ''}`);
});
