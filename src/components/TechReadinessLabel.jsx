/**
 * TechReadinessLabel.jsx — Phase 69 jargon sweep.
 *
 * "TRL" was an opaque acronym for new users. This helper renders the
 * plain-English label "Tech Readiness" with a hover tooltip that explains
 * the 1-9 scale (NASA Technology Readiness Level standard).
 *
 * Usage:
 *   <TechReadinessLabel value={6} />
 *     → "Tech Readiness 6"  (with hover tooltip)
 *
 *   <TechReadinessLabel />
 *     → "Tech Readiness"     (column header / form label)
 *
 *   <TechReadinessLabel asLevel value={4} />
 *     → "Tech Readiness · Level 4"  (long-form display, with hover)
 *
 * Implementation: native title attribute on the wrapper. Cheap, no
 * tooltip library needed, accessible.
 */

const SCALE_TOOLTIP =
  'Tech Readiness Level (TRL): NASA standard 1–9 scale.\n' +
  '1 = basic concept · 4 = lab demo · 6 = prototype in relevant environment · 9 = proven in production.';

export default function TechReadinessLabel({ value, asLevel = false, className, style }) {
  const hasValue = value != null && value !== '' && Number.isFinite(Number(value));
  const text = hasValue
    ? asLevel
      ? `Tech Readiness · Level ${value}`
      : `Tech Readiness ${value}`
    : 'Tech Readiness';

  return (
    <span title={SCALE_TOOLTIP} className={className} style={style}>
      {text}
    </span>
  );
}
