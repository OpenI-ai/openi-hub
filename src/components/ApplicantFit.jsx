/**
 * s127 (3 Oct 2026) — applicant triage (AGENTIC_PLATFORM_PLAN G4). Each application to a challenge carries a fit
 * (0-100), a band and plain reasons from the backend (applicantTriageService): how close the startup is to the
 * challenge, what they share, and what the owner's own decisions on this challenge taught it ("Like applicants you
 * shortlisted"). Shown as a badge + reasons on each applicant; "Best fit first" re-orders the list.
 */
const BAND = {
  strong: { bg: '#f0fdf4', color: '#15803d', border: '#86efac' },
  possible: { bg: '#fffbeb', color: '#92400e', border: '#fcd34d' },
  weak: { bg: '#f3f4f6', color: '#4b5563', border: '#d1d5db' },
};

/** Applications with a fit first, highest fit first; those without keep their order at the end. Pure. */
export function sortByFit(apps) {
  return (apps || []).map((a, i) => [a, i]).sort(([a, i], [b, j]) => {
    const fa = typeof a.fit === 'number' ? a.fit : -1;
    const fb = typeof b.fit === 'number' ? b.fit : -1;
    return fb - fa || i - j;
  }).map(([a]) => a);
}

export function FitBadge({ app }) {
  if (typeof app?.fit !== 'number') return null;
  const s = BAND[app.fit_band] || BAND.weak;
  return (
    <span data-testid="applicant-fit" title={(app.fit_reasons || []).join(' · ')}
      style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: s.bg, color: s.color,
        border: `1px solid ${s.border}`, whiteSpace: 'nowrap' }}>
      {app.fit_label || 'Fit'} {app.fit}
    </span>
  );
}

export function FitReasons({ app }) {
  if (!(app?.fit_reasons || []).length) return null;
  return (
    <div data-testid="applicant-fit-reasons" style={{ fontSize: 11, color: '#555', marginTop: 2, overflowWrap: 'anywhere' }}>
      {app.fit_reasons.join(' · ')}
    </div>
  );
}
