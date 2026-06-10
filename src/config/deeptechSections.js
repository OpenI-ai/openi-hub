/**
 * DeepTech qualification criteria per RFP sec 1.2.
 *
 * Dependency-free shared config so BOTH the dashboard authoring page
 * (DeepTechQualification.jsx) and the public share page (SharedDeepTech.jsx)
 * can read the human-readable question text + weights without coupling the
 * public bundle to dashboard-only deps (useAuth, getToken, etc.).
 *
 * NOTE: section `icon` and `color` are intentionally NOT here — they are
 * lucide React components / presentation concerns that the dashboard
 * re-attaches locally. Keep this module pure data (no React, no lucide).
 */

const G = '#D5AA5B';

export const DEEPTECH_SECTIONS = [
  {
    id: 'technology',
    label: 'Technology Depth',
    questions: [
      { id: 'q1', text: 'Is the core technology based on original R&D or novel IP developed by the startup?', weight: 3 },
      { id: 'q2', text: 'Does the technology involve cutting-edge fields such as AI/ML, Quantum, Biotech, Nanotechnology, Advanced Materials, or Space Tech?', weight: 3 },
      { id: 'q3', text: 'Is the technology currently at Tech Readiness Level 4 or above (demonstrated in lab / relevant environment)?', weight: 2 },
      { id: 'q4', text: 'Has the technology been validated through peer-reviewed research, patents, or independent testing?', weight: 2 },
    ],
  },
  {
    id: 'innovation',
    label: 'Innovation & Differentiation',
    questions: [
      { id: 'q5', text: 'Does the startup address a problem that has no commercially available solution?', weight: 2 },
      { id: 'q6', text: 'Is the technology differentiated from existing solutions by a factor of 10x or more in performance, cost, or capability?', weight: 3 },
      { id: 'q7', text: 'Has the startup filed or received patents, trade secrets, or other formal IP protections?', weight: 2 },
    ],
  },
  {
    id: 'team',
    label: 'Technical Team Capability',
    questions: [
      { id: 'q8',  text: 'Does the founding/core team have PhDs, post-doctoral researchers, or domain experts with 10+ years of relevant experience?', weight: 2 },
      { id: 'q9',  text: 'Has the team published research in internationally recognised journals or conferences in the last 3 years?', weight: 2 },
      { id: 'q10', text: 'Is the startup associated with or spun out from an academic institution, national lab, or research organisation?', weight: 1 },
    ],
  },
  {
    id: 'defence',
    label: 'Defence & Dual-Use Relevance',
    questions: [
      { id: 'q11', text: 'Is the technology directly applicable to one or more of OpenI\'s thrust areas (e.g., AI, cyber, quantum, materials, biodefence, space)?', weight: 3 },
      { id: 'q12', text: 'Does the technology have dual-use potential (both civilian and defence applications)?', weight: 2 },
      { id: 'q13', text: 'Has the startup previously worked with government agencies, defence establishments, or strategic sector clients?', weight: 1 },
    ],
  },
  {
    id: 'scalability',
    label: 'Scalability & Commercialisation',
    questions: [
      { id: 'q14', text: 'Does the startup have a clear path to scaling production or deployment within 18–24 months?', weight: 2 },
      { id: 'q15', text: 'Is there demonstrable market demand or a signed LOI/MOU from a potential customer?', weight: 1 },
      { id: 'q16', text: 'Has the startup raised institutional funding (seed, Series A, government grant, or strategic investment)?', weight: 1 },
    ],
  },
];

export const DEEPTECH_OPTIONS = [
  { value: 'yes',     label: 'Yes',     color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  { value: 'partial', label: 'Partial', color: G,         bg: '#fff8ec', border: 'rgba(213,170,91,0.4)' },
  { value: 'no',      label: 'No',      color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  { value: 'na',      label: 'N/A',     color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
];

export const DEEPTECH_SCORE_MAP = { yes: 1, partial: 0.5, no: 0, na: null };
