/**
 * completionPct — a progress percentage that NEVER rounds up to 100.
 *
 * THE DEFECT THIS EXISTS FOR (s118b, 19 Sep 2026). The Liveness Census bar
 * rendered `((checked / checkable) * 100).toFixed(1)`. With 573,240 of 573,241
 * profiles checked that is 99.99983%, and `toFixed` rounds it to **"100.0%"** —
 * a headline claiming the census was complete while a real, selectable profile
 * sat outstanding.
 *
 * WHY THAT IS THE SAME BUG TWICE. The denominator fix shipped moments earlier
 * (BE #79 / FE #77) existed precisely so a stall would be VISIBLE instead of
 * hidden under permanent residue. Rounding reintroduces the camouflage one
 * digit further in, and it scales with the corpus: `toFixed(1)` reads 100.0%
 * for anything above 99.95%, so on 573k rows up to ~286 outstanding profiles
 * would have displayed as done.
 *
 * THE RULE. 100 is reserved for genuinely finished. Everything else floors, so
 * the number never overstates progress at any value — a bar that claims more
 * than it has done is the whole failure mode, not just at the top end.
 *
 * Returns a Number (not a string) so callers keep control of formatting and can
 * use the same value for the bar's width, which stops the label and the bar
 * from ever disagreeing.
 */
export function completionPct(done, total) {
  const d = Number(done);
  const t = Number(total);
  // A missing or not-yet-loaded stat must read as "no progress", never NaN% in
  // the DOM and never a full bar.
  if (!Number.isFinite(d) || !Number.isFinite(t) || t <= 0 || d <= 0) return 0;
  // Clamped rather than floored past the end: done > total means the two counts
  // were sampled at different moments, not that more than everything is done.
  if (d >= t) return 100;
  return Math.floor((d / t) * 1000) / 10;
}

export default completionPct;
