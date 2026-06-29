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
import { hasSeenPageTour, markPageTourSeen } from '../services/tourService';

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
  buttonSkip: { color: '#999', fontSize: 11, fontWeight: 500 },
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

  // Auto-start once per pathname per browser. Re-runs on pathname change so
  // navigating Marketplace → Reports each auto-starts its own tour once.
  useEffect(() => {
    if (!steps.length) return;
    if (hasSeenPageTour(pathname)) return;
    const t = setTimeout(startFresh, 600);
    return () => clearTimeout(t);
  }, [pathname, steps.length, startFresh]);

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
