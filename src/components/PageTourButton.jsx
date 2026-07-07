/**
 * PageTourButton — inline "?" tour-replay control for standalone pages.
 *
 * Standalone auth / share / landing pages mount <PublicTour /> directly (they
 * don't use PublicLayout's header, which carries its own "?" tour button).
 * After PublicTour's auto-start-once is consumed there's no way to replay the
 * tour. This small icon-only button gives each such page an inline replay
 * affordance, matching the icon-only "?" button style used in PublicLayout's
 * header (no text label — just the HelpCircle glyph in a circular outline).
 *
 * It dispatches the same `openi-page-tour` event PublicTour listens for, and
 * renders nothing when the current route has no page tour (so it never shows a
 * dead button). Place it next to the page's <h1>.
 */
import { useLocation } from 'react-router-dom';
import { HelpCircle } from 'lucide-react';
import { resolvePageTour } from '../config/tours';

const GOLD = '#D0A848';

export default function PageTourButton({ style }) {
  const { pathname } = useLocation();
  const pageTour = resolvePageTour(pathname);
  if (!pageTour) return null;

  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent('openi-page-tour'))}
      title={`Tour: ${pageTour.title || 'this page'}`}
      aria-label="Take a tour of this page"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 36,
        height: 36,
        borderRadius: '50%',
        border: `1px solid ${GOLD}`,
        background: 'transparent',
        color: GOLD,
        cursor: 'pointer',
        transition: 'background 0.15s, color 0.15s',
        ...style,
      }}
      onMouseEnter={e => { e.currentTarget.style.background = GOLD; e.currentTarget.style.color = '#fff'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = GOLD; }}
    >
      <HelpCircle size={18} />
    </button>
  );
}
