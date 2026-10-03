/**
 * s127 (3 Oct 2026) — G4 "search that learns": the dashboard search puts the startups YOU shortlisted and opened
 * before first and those you passed on last, each marked so you see why. Same order as the backend's
 * searchLearnService.order (shortlisted, opened, rest, passed; stable within each).
 */
export const MARK_RANK = { shortlisted: 0, opened: 1, none: 2, passed: 3 };
export const MARK_TEXT = { shortlisted: 'On your shortlist', opened: 'You opened this before', passed: 'You passed on this' };

/** Reorder startups by the person's own marks; never sorts in place. */
export function orderByMarks(items, marks = {}) {
  const id = s => s.user_id || s.id;
  return (items || []).map((s, i) => [s, i])
    .sort(([a, i], [b, j]) => (MARK_RANK[marks[id(a)] || 'none'] - MARK_RANK[marks[id(b)] || 'none']) || i - j)
    .map(([s]) => s);
}
