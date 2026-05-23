/**
 * TourWrapper — P4 (Phase 4) UI Walkthroughs
 *
 * Drop-in wrapper around react-joyride v3. One mount per dashboard; pulls the
 * persona's step array from `src/config/tours.js`, decides whether to auto-start
 * (first-login detection via localStorage + user.tours_completed), and persists
 * completion via tourService.
 *
 * Replay: top-bar "Take a tour" button dispatches a window event
 * `openi-replay-tour` that this component listens for.
 *
 * Multi-page steps: each step may include a `route` prop. When the user advances
 * to a step with a different route than the current pathname, we navigate first,
 * pause briefly to let the destination render, then remount Joyride with a
 * fresh `stepIndex` to resume.
 *
 * Why uncontrolled-by-default: react-joyride v3 has a known footgun where
 * passing `stepIndex` AND `continuous` together causes the tooltip to freeze
 * after the first Next click — the controlled-stepIndex prop fights with
 * Joyride's internal advancement. Solution: let Joyride manage stepIndex itself
 * for the common same-page case; only assert `stepIndex` when we genuinely
 * need to (route-change recovery + replay-from-zero), and force a remount via
 * key change at those moments.
 *
 * Props:
 *   role        — string; one of the 11 persona roles. Required.
 *   forceStart  — bool;   override and start tour regardless of seen state.
 */
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Joyride, STATUS, EVENTS, ACTIONS } from 'react-joyride';
import { useAuth } from '../context/AuthContext';
import { TOURS, PAGE_TOURS } from '../config/tours';  // Ship #12 (22 May 2026) — page-tour multiplex
import { hasUserSeenTour, markTourSeen } from '../services/tourService';

const G = '#D5AA5B';
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

export default function TourWrapper({ role, forceStart = false }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Ship #12 (22 May 2026) — page-tour multiplex
  // When pageMode is true, render PAGE_TOURS[pathname].steps instead of
  // the role-based first-login tour. Set/cleared by the page-tour event
  // listener. Both modes share the same Joyride instance + onCallback.
  const [pageMode, setPageMode] = useState(false);
  const tourDef = useMemo(() => (role && TOURS[role]) || null, [role]);
  const roleSteps = tourDef?.steps || [];
  const pageDef = useMemo(() => PAGE_TOURS?.[location.pathname] || null, [location.pathname]);
  const pageSteps = pageDef?.steps || [];
  const steps = pageMode ? pageSteps : roleSteps;

  const [run, setRun]               = useState(false);
  // initialStep is only consulted by Joyride at MOUNT time. We bump `runKey`
  // to force a remount when we want Joyride to pick up a new starting index.
  const [initialStep, setInitialStep] = useState(0);
  const [runKey, setRunKey]         = useState(0);
  // Track Joyride's current step internally for tour-end / save logic.
  const indexRef = useRef(0);

  const startFresh = useCallback((idx = 0) => {
    indexRef.current = idx;
    setInitialStep(idx);
    setRunKey(k => k + 1);
    setRun(true);
  }, []);

  // Decide auto-start once per user/role.
  useEffect(() => {
    if (!user || !role || !steps.length) return;
    const seen = hasUserSeenTour(user, role);
    if (forceStart || !seen) {
      const t = setTimeout(() => startFresh(0), 600);
      return () => clearTimeout(t);
    }
  }, [user, role, steps.length, forceStart, startFresh]);

  // Listen for the manual "Take a tour" event from the top-bar button.
  useEffect(() => {
    const onReplay = (e) => {
      if (!e.detail?.role || e.detail.role === role) {
        setPageMode(false);  // role-tour mode
        startFresh(0);
      }
    };
    window.addEventListener('openi-replay-tour', onReplay);
    return () => window.removeEventListener('openi-replay-tour', onReplay);
  }, [role, startFresh]);

  // Ship #12 (22 May 2026) — page-tour event listener. Top-bar "Tour this
  // page" button dispatches this. Switches to page-mode and resets to step 0.
  useEffect(() => {
    const onPageTour = () => {
      if (pageSteps.length === 0) return;
      setPageMode(true);
      startFresh(0);
    };
    window.addEventListener('openi-page-tour', onPageTour);
    return () => window.removeEventListener('openi-page-tour', onPageTour);
  }, [pageSteps.length, startFresh]);

  const onCallback = useCallback((data) => {
    const { status, action, index, type } = data;

    // Track Joyride's current step for save/replay.
    if (typeof index === 'number') indexRef.current = index;

    // Tour finished or skipped → mark seen + stop running.
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRun(false);
      // Ship #12 — only mark role-tour as seen. Page tours are replayable on demand.
      if (!pageMode) markTourSeen(role);
      return;
    }

    // STEP_AFTER: Joyride is about to advance internally. We only intervene
    // when the next step requires a route change. For same-page advance we do
    // NOTHING — Joyride handles it (this is the v3 fix: no controlled
    // stepIndex => no freeze).
    if (type === EVENTS.STEP_AFTER) {
      const nextIdx = index + (action === ACTIONS.PREV ? -1 : 1);
      if (nextIdx < 0 || nextIdx >= steps.length) return; // Joyride will FINISH

      const nextStep = steps[nextIdx];
      if (nextStep?.route && nextStep.route !== location.pathname) {
        // Pause Joyride, navigate, remount with the new initialStep.
        setRun(false);
        navigate(nextStep.route);
        setTimeout(() => startFresh(nextIdx), 450);
      }
      // else: same-page — let Joyride advance internally
      return;
    }

    // TARGET_NOT_FOUND: skip past the bad anchor.
    if (type === EVENTS.TARGET_NOT_FOUND) {
      if (import.meta.env.DEV) {
        console.warn(`[TourWrapper] target not found for step ${index}:`, steps[index]?.target);
      }
      const nextIdx = index + 1;
      if (nextIdx >= steps.length) {
        setRun(false);
        markTourSeen(role);
      } else {
        // Force a remount that picks up at the next step.
        setRun(false);
        setTimeout(() => startFresh(nextIdx), 100);
      }
    }
  }, [role, steps, location.pathname, navigate, startFresh]);

  // Ship #12 — relax early-return so page tours work even if the persona
  // has no role-tour defined. Render when either tour mode has steps.
  if (!role) return null;
  if (!steps.length) return null;

  return (
    <Joyride
      key={runKey}
      steps={steps}
      run={run}
      // Use `initialStepIndex` (uncontrolled mode) NOT `stepIndex` (controlled
      // mode). With controlled mode + `continuous`, Joyride suppresses internal
      // advancement and the tooltip freezes on step 0 after the first Next click.
      // We force a remount via `key={runKey}` whenever we need Joyride to pick
      // up a new starting index (replay-from-zero, route-change recovery,
      // target-not-found recovery).
      initialStepIndex={initialStep}
      // v3 renamed `callback` → `onEvent`. The legacy `callback` prop is
      // silently ignored — that is why our handler never fired after s26 P4
      // ship and the tour froze on step 0 after Next.
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
