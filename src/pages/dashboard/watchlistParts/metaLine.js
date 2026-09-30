// s123 (30 Sep 2026): imported profiles carry placeholder text such as the
// string "null" — Rajeev's Dentsu watchlist read "null · Stage: Application".
const PLACEHOLDER = /^(null|undefined|none|n\/a|na|-|undisclosed)$/i;
const clean = v => { const t = String(v ?? '').trim(); return t && !PLACEHOLDER.test(t) ? t : ''; };

export function metaLine(s) {
  const stage = clean(s.stage);
  return [clean(s.sector), stage && `Stage: ${stage}`].filter(Boolean).join(' · ');
}
