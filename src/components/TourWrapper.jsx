/**
 * TourWrapper — P4 (Phase 4) UI Walkthroughs
 *
 * Drop-in wrapper around react-joyride. One mount per dashboard; pulls the
 * persona's step array from `src/config/tours.js`, decides whether to auto-start
 * (first-login detection via localStorage + user.tours_completed), and persists
 * completion via tourService.
 *
 * Replay: top-bar "Take a tour" button dispatches a window event
 * `openi-replay-tour` that this component listens for.
 *
 * Multi-page steps: each step may include a `route` prop. When the user advances
 * to a step with a different route than the current pathname, we navigate first,
 * pause briefly to let the destination render, then resume.
 *
 * Props:
 *   role        — string; one of the 11 persona roles. Required.
 *   forceStart  — bool;   override and start tour regardless of seen state.
 */
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Joyride, STATUS, EVENTS, ACTIONS } from 'react-joyride';
import { useAuth } from '../context/AuthContext';
import { TOURS } from '../config/tours';
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
  spotlight: {
    borderRadius: 10,
  },
  tooltip: {
    borderRadius: 12,
    padding: 16,
    fontSize: 13,
    fontFamily: 'Lexend, system-ui, sans-serif',
    boxShadow: '0 12px 40px rgba(13, 33, 55, 0.20)',
  },
  tooltipTitle: {
    color: NAVY,
    fontSize: 15,
    fontWeight: 700,
    marginBottom: 6,
  },
  tooltipContent: {
    color: '#444',
    lineHeight: 1.5,
    fontSize: 12.5,
  },
  buttonNext: {
    background: G,
    color: '#fff',
    fontWeight: 600,
    fontSize: 12,
    padding: '8px 16px',
    borderRadius: 7,
    fontFamily: 'inherit',
  },
  buttonBack: {
    color: '#666',
    fontSize: 12,
    fontWeight: 500,
    marginRight: 8,
  },
  buttonSkip: {
    color: '#999',
    fontSize: 11,
    fontWeight: 500,
  },
  buttonClose: {
    display: 'none', // we use Skip; Close is redundant
  },
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
  const navigate  = useNavigate();
  const location  = useLocation();

  const tourDef = useMemo(() => (role && TOURS[role]) || null, [role]);
  const steps   = tourDef?.steps || [];

  const [run, setRun]           = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  // Decide auto-start once per user/role.
  useEffect(() => {
    if (!user || !role || !steps.length) return;
    const seen = hasUserSeenTour(user, role);
    if (forceStart || !seen) {
      // small delay so the dashboard has time to mount its anchors
      const t = setTimeout(() => { setStepIndex(0); setRun(true); }, 600);
      return () => clearTimeout(t);
    }
  }, [user, role, steps.length, forceStart]);

  // Listen for the manual "Take a tour" event from the top-bar button.
  useEffect(() => {
    const onReplay = (e) => {
      // Either match our role, or run regardless if no detail.role provided.
      if (!e.detail?.role || e.detail.role === role) {
        setStepIndex(0);
        setRun(true);
      }
    };
    window.addEventListener('openi-replay-tour', onReplay);
    return () => window.removeEventListener('openi-replay-tour', onReplay);
  }, [role]);

  const onCallback = useCallback((data) => {
    const { status, action, index, type } = data;

    // Tour finished or skipped → mark seen + stop running.
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRun(false);
      setStepIndex(0);
      markTourSeen(role);
      return;
    }

    // STEP_AFTER fires after Joyride finishes a step. In `continuous` mode
    // Joyride advances internally — we only intervene when:
    //   (a) the next step has a `route` that differs from current pathname
    //       (multi-page tours need an explicit navigate + remount), OR
    //   (b) target_not_found, where we step over the missing anchor.
    // For plain same-page advance, sync our local stepIndex passively so
    // replay knows where to resume, but DON'T re-set Joyride's stepIndex
    // (controlled + continuous is a v3 footgun — causes the tooltip to
    // freeze on the first step).
    if (type === EVENTS.STEP_AFTER) {
      const nextIdx = index + (action === ACTIONS.PREV ? -1 : 1);
      if (nextIdx < 0 || nextIdx >= steps.length) {
        setRun(false);
        setStepIndex(0);
        markTourSeen(role);
        return;
      }
      const nextStep = steps[nextIdx];
      if (nextStep?.route && nextStep.route !== location.pathname) {
        // Route change required — pause, navigate, remount with new index.
        setRun(false);
        setStepIndex(nextIdx);
        navigate(nextStep.route);
        setTimeout(() => setRun(true), 450);
      } else {
        // Same-page advance — just track index, let Joyride drive.
        setStepIndex(nextIdx);
      }
      return;
    }

    // Target missing — skip past it.
    if (type === EVENTS.TARGET_NOT_FOUND) {
      if (import.meta.env.DEV) {
        console.warn(`[TourWrapper] target not found for step ${index}:`, steps[index]?.target);
      }
      const nextIdx = index + 1;
      if (nextIdx >= steps.length) {
        setRun(false);
        setStepIndex(0);
        markTourSeen(role);
      } else {
        setRun(false);
        setStepIndex(nextIdx);
        setTimeout(() => setRun(true), 100);
      }
    }
  }, [role, steps, location.pathname, navigate]);

  // No-op if no role, no def, no steps, or admin.
  if (!role || !tourDef || !steps.length) return null;

  return (
    <Joyride
      steps={steps}
      run={run}
      stepIndex={stepIndex}
      callback={onCallback}
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
