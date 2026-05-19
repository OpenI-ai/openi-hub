/**
 * Phase 100 — Per-persona vocabulary for application review.
 *
 * challenge_applications.status values from DB CHECK constraint:
 *   applied | shortlisted | evaluating | selected | rejected
 *
 * Each persona can rename these for display only. Backend stays canonical.
 */

const DEFAULT_LABELS = {
  applied:     { label: 'Applied',     color: '#0369a1', bg: '#e0f2fe' },
  shortlisted: { label: 'Shortlisted', color: '#ca8a04', bg: '#fefce8' },
  evaluating:  { label: 'Evaluating',  color: '#9333ea', bg: '#f3e8ff' },
  selected:    { label: 'Selected',    color: '#16a34a', bg: '#f0fdf4' },
  rejected:    { label: 'Rejected',    color: '#dc2626', bg: '#fef2f2' },
};

const PERSONA_OVERRIDES = {
  investor: {
    shortlisted: { label: 'Shortlisted',   color: '#ca8a04', bg: '#fefce8' },
    evaluating:  { label: 'Due Diligence', color: '#9333ea', bg: '#f3e8ff' },
    selected:    { label: 'Term Sheet',    color: '#16a34a', bg: '#f0fdf4' },
    rejected:    { label: 'Passed',        color: '#dc2626', bg: '#fef2f2' },
  },
  mentor: {
    evaluating:  { label: 'Interview',     color: '#9333ea', bg: '#f3e8ff' },
    selected:    { label: 'Accepted',      color: '#16a34a', bg: '#f0fdf4' },
    rejected:    { label: 'Declined',      color: '#dc2626', bg: '#fef2f2' },
  },
  // corporate, government, lab, incubator, accelerator, service_provider use defaults
};

export function getStatusLabel(persona, status) {
  const override = (PERSONA_OVERRIDES[persona] && PERSONA_OVERRIDES[persona][status]);
  return override || DEFAULT_LABELS[status] || DEFAULT_LABELS.applied;
}

// Action button labels (verbs) — distinct from badge labels
const DEFAULT_ACTIONS = {
  shortlist: 'Shortlist',
  evaluate:  'Evaluate',
  select:    'Select',
  reject:    'Reject',
};

const PERSONA_ACTION_OVERRIDES = {
  investor: {
    shortlist: 'Shortlist',
    evaluate:  'Start DD',
    select:    'Term Sheet',
    reject:    'Pass',
  },
  mentor: {
    shortlist: 'Shortlist',
    evaluate:  'Schedule Interview',
    select:    'Accept',
    reject:    'Decline',
  },
};

export function getActionLabel(persona, action) {
  const override = (PERSONA_ACTION_OVERRIDES[persona] && PERSONA_ACTION_OVERRIDES[persona][action]);
  return override || DEFAULT_ACTIONS[action] || action;
}

export default { getStatusLabel, getActionLabel };
