/**
 * OpenI Hub — API Service Layer · BARREL
 *
 * Phase 164 (W5-1). src/services/api.js had grown to 1,208 lines, which made it
 * unreadable in full inside a single context window. It is now a thin shim over
 * this directory, so all 124 importers keep working unchanged.
 *
 * LAYOUT — every module is a verbatim slice of the pre-split api.js:
 *
 *   file           lines        size    depends on
 *   core.js            1-134    134 ln   core: (is core)
 *   platform.js      135-262    128 ln   core: BASE_URL, request, get, post, put, del, blobRequest
 *   entities.js      263-403    141 ln   core: BASE_URL, get, post, put, del
 *   sharing.js       404-526    123 ln   core: BASE_URL, get, post, put, patch, del
 *   profiles.js      527-648    122 ln   core: get, post, put, del, blobRequest
 *   invites.js       649-700     52 ln   core: request, get, post, del, blobRequest
 *   personas.js      701-968    268 ln   core: BASE_URL, get, post, put, del
 *   engagement.js    969-1095   127 ln   core: BASE_URL, get, post, put, del, blobRequest
 *   admin.js        1096-1208   113 ln   core: get, post, put, del
 *
 * INVARIANTS
 *   1. Public surface is exactly the 85 names the pre-split file exported —
 *      4 token helpers from core + 81 `xxxAPI` objects across the 8 domains.
 *      There was NO default export before; there must be none now.
 *   2. core.js's internals (BASE_URL, request, get, post, put, patch, del,
 *      blobRequest) were module-private in the original. core.js exports them so
 *      the domain slices can import them, but this barrel deliberately does NOT
 *      re-export them. Widening the surface here is a regression.
 *   3. The domain slices have no edges between each other — they import from
 *      './core' and nothing else. Verified: zero cross-slice references. Keep it
 *      that way; a domain-to-domain import is the start of a cycle.
 *   4. This directory is apiDomains/, not api/. src/services/api.js plus
 *      src/services/api/ is ambiguous under Vite — extension resolution beats
 *      directory-index resolution, so api/ would be silently shadowed. Same
 *      reason tours.js was split into tourData/, not tours/.
 *   5. Slice bodies stay byte-identical to the original. Any real edit goes
 *      inside the sentinels and invalidates the recipe below — that's fine, but
 *      re-baseline it deliberately, don't let it rot.
 *
 * RE-CONCAT VERIFICATION RECIPE — proves the slices are still verbatim.
 * From the frontend repo root, against the pre-split blob:
 *
 *   python3 - <<'PY'
 *   import re, subprocess
 *   ORDER = ['core','platform','entities','sharing','profiles',
 *            'invites','personas','engagement','admin']
 *   out = []
 *   for m in ORDER:
 *       t = open(f'src/services/apiDomains/{m}.js', encoding='utf-8').read()
 *       b = t.split('BODY START')[1].split('\n', 1)[1]
 *       b = b.rsplit('// ---8<--- BODY END', 1)[0]
 *       out.append(b.rstrip('\n'))
 *   got = '\n'.join(out) + '\n'
 *   # undo core.js's one intentional deviation (see core.js header)
 *   got = got.replace("from '../../utils/safeStorage'", "from '../utils/safeStorage'", 1)
 *   want = subprocess.run(['git','show','fd70228:src/services/api.js'],
 *                         capture_output=True, text=True).stdout
 *   print('VERBATIM MATCH' if got == want else 'MISMATCH')
 *   PY
 *
 * (fd70228 is the last commit before this split.)
 */

// core — public helpers only, per INVARIANT 2
export { getToken, setToken, removeToken, getActiveRole } from './core';

// domains — each module exports only its own `xxxAPI` objects, so `export *`
// cannot leak core internals through the barrel
export * from './platform';
export * from './entities';
export * from './sharing';
export * from './profiles';
export * from './invites';
export * from './personas';
export * from './engagement';
export * from './admin';
