/**
 * s127 (3 Oct 2026) — THE UNWIRED GUARD. Rajeev: "i thought testing agent will catch all the unwired issues? how do
 * we ensure there no other surprises for other personas" … "it's a live platform and we need to ensure good User
 * Experience". The live smoke only checks that pages LOAD, so a "coming soon" page, a button that does nothing, or a
 * hardcoded "connected" badge all passed it. This guard reads every page a persona can reach from its menu (and from
 * its dashboard tiles) and fails when one of them:
 *   1. has no route or no page file behind it;
 *   2. is a placeholder ("coming soon", "being wired up", ComingSoonPlaceholder);
 *   3. has a <button> with no onClick, no type="submit" and no {...props} — a button that does nothing;
 *   4. claims an integration is live with a hardcoded status: 'connected'.
 * It reads the page file itself, not its children: a child component's dead button needs the testing agent's
 * click-through (NEXT_SESSION_TODOS 0000t-qa-agent).
 *
 * KNOWN may list a page with a reason, for a fix already on its way. An entry that no longer finds anything FAILS,
 * so the list can only shrink.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SRC = join(process.cwd(), 'src');
const read = (p) => readFileSync(join(SRC, p), 'utf8');

const KNOWN = {};

/** Menu paths whose page is still a placeholder, with the PR that replaces it. Fails once the page is real. */
const KNOWN_PLACEHOLDER_ROUTES = {};

/** Every /dashboard path a persona reaches: its menu (personas.js) and its home tiles (PersonaDashboard.jsx). */
export function menuPaths() {
  const out = new Set();
  for (const f of ['config/personas.js', 'pages/dashboard/PersonaDashboard.jsx']) {
    for (const m of read(f).matchAll(/to:\s*'(\/dashboard\/[^'?#]+)/g)) out.add(m[1].replace(/\/$/, ''));
  }
  return [...out];
}

function routeTable() {
  const app = read('App.jsx');
  const imports = {};
  for (const m of app.matchAll(/(?:const|import)\s+(\w+)\s*(?:=\s*lazy\(\(\)\s*=>\s*import\(|from\s*)'(\.\/[^']+)'/g)) imports[m[1]] = m[2];
  const routes = {};
  for (const m of app.matchAll(/<Route\s+path="([^"]+)"\s+element=\{<(\w+)/g)) routes[m[1].replace(/^\/dashboard\//, '')] = m[2];
  return { imports, routes };
}

function fileOf(spec) {
  for (const ext of ['', '.jsx', '.js', '/index.jsx', '/index.js']) {
    const f = join(SRC, spec.slice(2) + ext);
    if (existsSync(f) && statSync(f).isFile()) return f;
  }
  return null;
}

/** <button …> tags whose attributes (read to the tag's real end, past `=>` and `>=` inside braces) give it nothing to do. */
export function deadButtons(src) {
  const dead = [];
  for (const m of src.matchAll(/<button\b/g)) {
    let depth = 0, i = m.index + 7;
    for (; i < src.length; i++) {
      const c = src[i];
      if (c === '{') depth++; else if (c === '}') depth--; else if (c === '>' && depth === 0) break;
    }
    const attrs = src.slice(m.index + 7, i);
    if (!/\bonClick\b|type=["']submit["']|\{\.\.\./.test(attrs)) {
      const line = src.slice(0, m.index).split('\n').length;
      dead.push(`line ${line}: ${src.slice(i + 1, i + 60).replace(/\s+/g, ' ').trim()}`);
    }
  }
  return dead;
}

export function findings(src) {
  const f = [];
  for (const d of deadButtons(src)) f.push(`a button that does nothing (${d})`);
  if (/coming soon|being wired up|ComingSoonPlaceholder/i.test(src)) f.push('a placeholder ("coming soon")');
  if (/status:\s*'connected'/.test(src)) f.push("a hardcoded status: 'connected'");
  return f;
}

describe('unwired guard — every page a persona can reach does something real', () => {
  const { imports, routes } = routeTable();
  const pages = menuPaths().map((path) => {
    const comp = routes[path.replace(/^\/dashboard\//, '')];
    const file = comp && imports[comp] && fileOf(imports[comp]);
    return { path, comp, file, rel: file && file.replace(SRC, '') };
  });

  it('reads a real menu (sanity)', () => {
    expect(pages.length).toBeGreaterThan(40);
    expect(pages.map(p => p.path)).toContain('/dashboard/government/grants');
  });

  it('every menu item and dashboard tile has a route and a page file', () => {
    const missing = pages.filter(p => !p.file && !KNOWN_PLACEHOLDER_ROUTES[p.path]).map(p => `${p.path} → ${p.comp || 'no <Route>'}`);
    expect(missing).toEqual([]);
    const fixed = Object.keys(KNOWN_PLACEHOLDER_ROUTES).filter(path => pages.find(p => p.path === path)?.file);
    expect(fixed, 'now a real page: remove it from KNOWN_PLACEHOLDER_ROUTES').toEqual([]);
  });

  it('no reachable page is a placeholder, has a button that does nothing, or fakes a connection', () => {
    const bad = [];
    for (const p of pages.filter(p => p.file && !KNOWN[p.rel])) {
      for (const f of findings(readFileSync(p.file, 'utf8'))) bad.push(`${p.path} (${p.rel}): ${f}`);
    }
    expect(bad).toEqual([]);
  });

  it('KNOWN only lists pages that still have a finding (the list can only shrink)', () => {
    const stale = Object.keys(KNOWN).filter(rel => !findings(read(rel.slice(1))).length);
    expect(stale).toEqual([]);
  });

  it('the scanner itself: catches a dead button, ignores => and >= inside handlers', () => {
    expect(deadButtons('<button className="x">Go</button>')).toHaveLength(1);
    expect(deadButtons('<button disabled={a >= b} onClick={() => go()}>Go</button>')).toHaveLength(0);
    expect(deadButtons('<button type="submit">Save</button><button {...rest}>X</button>')).toHaveLength(0);
    expect(findings("const s = { status: 'connected' };")).toHaveLength(1);
  });
});
