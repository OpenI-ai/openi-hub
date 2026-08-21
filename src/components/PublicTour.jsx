/**
 * PublicTour — self-contained product tour for NON-dashboard pages.
 *
 * Used on public pages (Landing, Marketplace, Reports, FAQ, Global Search),
 * auth pages (Register, Forgot/Reset Password, Verify Email) and shared-link
 * pages (/share/*, /challenges/share, etc). Pulls the route's step array from
 * PAGE_TOURS via resolvePageTour and runs it with NO role and NO cross-route
 * navigation — every public tour is single-page.
 *
 * Auto-start-once (guest-friendly): on mount / pathname change, if this browser
 * has not yet auto-seen the page tour for this pathname, start it after a short
 * delay. On FINISH/SKIP mark it seen so it never auto-popups again. Works fully
 * logged-out (pure localStorage, no backend, no user required).
 *
 * Manual replay: the topbar "Tour this page" button dispatches `openi-page-tour`,
 * which we listen for and replay from step 0 regardless of seen state.
 *
 * Why uncontrolled-by-default: react-joyride v3 freezes after the first Next
 * click when `stepIndex` (controlled) + `continuous` are passed together. So we
 * use `initialStepIndex` (uncontrolled) and force a remount via `key={runKey}`
 * whenever we need a fresh start.
 */
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Joyride, STATUS } from 'react-joyride';
import { resolvePageTour } from '../config/tours';
// hasSeenPageTour is intentionally NOT imported: nothing on a public page reads
// seen-state any more now that auto-start is gone (see the block below). The
// writer is kept so the record survives for a future intent-triggered start.
import { markPageTourSeen } from '../services/tourService';

const G = '#D0A848';
const NAVY = '#0D2137';

const styles = {
  options: {
    primaryColor: G,
    textColor: NAVY,
    zIndex: 10000,
    arrowColor: '#fff',
    backgroundColor: '#fff',
    overlayColor: 'rgba(13, 33, 55, 0.55)',
  },
  spotlight: { borderRadius: 10 },
  tooltip: {
    borderRadius: 12,
    padding: 16,
    fontSize: 13,
    fontFamily: 'Lexend, system-ui, sans-serif',
    boxShadow: '0 12px 40px rgba(13, 33, 55, 0.20)',
  },
  tooltipTitle: { color: NAVY, fontSize: 15, fontWeight: 700, marginBottom: 6 },
  tooltipContent: { color: '#444', lineHeight: 1.5, fontSize: 12.5 },
  buttonNext: {
    background: G, color: '#fff', fontWeight: 600, fontSize: 12,
    padding: '8px 16px', borderRadius: 7, fontFamily: 'inherit',
  },
  buttonBack: { color: '#666', fontSize: 12, fontWeight: 500, marginRight: 8 },
  buttonSkip: { color: '#666', fontSize: 11, fontWeight: 500 },
  buttonClose: { display: 'none' },
};

const locale = {
  back:  'Back',
  close: 'Close',
  last:  'Finish',
  next:  'Next',
  open:  'Start tour',
  skip:  'Skip tour',
};

export default function PublicTour() {
  const location = useLocation();
  const pathname = location.pathname;

  // matchPath-aware so dynamic share/detail routes (`/share/startup/:token`)
  // resolve their tour entry, not just exact keys.
  const pageDef = useMemo(() => resolvePageTour(pathname), [pathname]);
  const steps = pageDef?.steps || [];

  const [run, setRun]       = useState(false);
  const [runKey, setRunKey] = useState(0);

  // Force a remount so Joyride re-reads step 0 (uncontrolled start).
  const startFresh = useCallback(() => {
    setRunKey(k => k + 1);
    setRun(true);
  }, []);

  // NO AUTO-START ON PUBLIC PAGES (UX audit, 21 Aug 2026).
  //
  // This used to fire 600ms after mount for any pathname this browser had not
  // seen — i.e. for EVERY first-time visitor, which is the entire audience the
  // marketing pages exist for. Measured at 1440x900 and 390x844: the overlay
  // dimmed the page, the spotlight cutout clipped the hero H1 mid-sentence, and
  // the tooltip landed on top of BOTH calls to action. On mobile it hid the
  // primary CTA outright, leaving the secondary button as the only reachable
  // action. Its copy also restated the subheadline it was covering.
  //
  // A tour is an answer to "how does this work?", and a first-time visitor has
  // not asked that yet — they are still reading what the product IS. Interrupting
  // that to explain navigation costs the first impression and buys nothing.
  //
  // The tour itself is untouched and still fully reachable: PublicLayout renders
  // a "Tour this page" button (desktop topbar + mobile menu) whenever
  // resolvePageTour matches the route, which dispatches `openi-page-tour` and is
  // handled by the replay effect below. That is opt-in, which is the correct
  // trigger for an explainer.
  //
  // hasSeenPageTour / markPageTourSeen are deliberately kept: the FINISH/SKIP
  // handler still records completion, so if auto-start is ever reintroduced
  // (behind an intent trigger — scroll past the hero, or a click) it will not
  // re-fire for someone who already finished it.
  //
  // Auto-start on the SIGNED-IN dashboard is a separate mechanism
  // (TourWrapper.jsx, mounted in DashboardLayout) and is intentionally left on:
  // 92 dashboard pages across 11 personas is a genuine orientation problem, and
  // that user has already converted.

  // Manual replay from the topbar "Tour this page" button. Replays regardless
  // of seen state.
  useEffect(() => {
    const onPageTour = () => {
      if (steps.length === 0) return;
      startFresh();
    };
    window.addEventListener('openi-page-tour', onPageTour);
    return () => window.removeEventListener('openi-page-tour', onPageTour);
  }, [steps.length, startFresh]);

  const onCallback = useCallback((data) => {
    const { status } = data;
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRun(false);
      markPageTourSeen(pathname);
    }
  }, [pathname]);

  if (!steps.length) return null;

  return (
    <Joyride
      key={runKey}
      steps={steps}
      run={run}
      initialStepIndex={0}
      onEvent={onCallback}
      continuous
      showProgress
      showSkipButton
      disableScrolling={false}
      disableOverlayClose
      spotlightClicks={false}
      hideCloseButton
      styles={styles}
      locale={locale}
    />
  );
}
