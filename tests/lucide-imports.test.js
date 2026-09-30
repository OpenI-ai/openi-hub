/**
 * s123 (30 Sep 2026): an icon that does not exist in the installed lucide-react
 * imports as `undefined`; lint and the build both pass, and the page crashes at
 * render ("Element type is invalid"). Caught once by a component test before
 * merge (Handshake in EngageAgents.jsx). This guard checks EVERY lucide-react
 * import in src/ against the installed package, so no page can ship with one.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import * as lucide from 'lucide-react';

function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return files(p);
    return /\.(jsx?|tsx?)$/.test(e.name) ? [p] : [];
  });
}

describe('lucide-react imports', () => {
  it('every icon imported anywhere in src/ exists in the installed lucide-react', () => {
    const missing = [];
    for (const f of files(path.resolve(__dirname, '../src'))) {
      const src = fs.readFileSync(f, 'utf8');
      for (const m of src.matchAll(/import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/g)) {
        const list = m[1].replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');  // comments inside the braces
        for (const raw of list.split(',')) {
          const name = raw.trim().split(/\s+as\s+/)[0].trim();
          if (name && !(name in lucide)) missing.push(`${path.relative(process.cwd(), f)}: ${name}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });
});
