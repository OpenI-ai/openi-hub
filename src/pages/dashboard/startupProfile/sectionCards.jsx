/**
 * OpenI Hub - sectionCards.jsx
 *
 * section card shells - funding chart/list toggle, subsection list, empty state
 *
 * VERBATIM slice of src/pages/dashboard/StartupProfile.jsx lines 931-999 as it
 * stood before the Phase 163 split (9 Aug 2026). Do NOT reformat the body -
 * see ./index.js for the re-concat verification recipe and the invariants.
 */

import React from 'react';
import { BarChart3, List } from 'lucide-react';
import { Badge, SUBSECTION_DEFS } from './fieldPrimitives.jsx';
import { FundingChart } from './fundingChart.jsx';
import { SubSectionRow } from './subsectionRows.jsx';

// --- BODY START (verbatim, do not reformat) ---
// --- lines 931-999 ---
// Phase 92.1 (T17b) - per-section card with chart/list toggle.
// Toggle only meaningful for funding section (where the chart exists).
// Other sections render as plain row lists.
function FundingSectionCard({ section }) {
  const s = section;
  const isFunding = s.key === 'funding';
  const [view, setView] = React.useState('chart'); // 'chart' | 'list'
  const showChart = isFunding && view === 'chart';
  const showList  = !isFunding || view === 'list';

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-display font-bold text-gray-900">{s.title}</h3>
          <Badge tone="gray">{s.rows.length}</Badge>
        </div>
        {isFunding && (
          <div className="flex items-center gap-1 bg-gray-100 rounded-md p-0.5">
            <button
              onClick={() => setView('chart')}
              className={`p-1.5 rounded transition-colors ${view === 'chart' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
              title="Chart view"
              aria-label="Chart view"
            >
              <BarChart3 size={14} />
            </button>
            <button
              onClick={() => setView('list')}
              className={`p-1.5 rounded transition-colors ${view === 'list' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
              title="List view"
              aria-label="List view"
            >
              <List size={14} />
            </button>
          </div>
        )}
      </div>
      {showChart && <FundingChart rounds={s.rows} />}
      {showList && (
        <div className="space-y-1">
          {s.rows.map((r, i) => (
            <SubSectionRow key={r.id || i} sectionKey={s.key} row={r} />
          ))}
        </div>
      )}
    </div>
  );
}

function StartupSubSections({ data }) {
  if (!data) return null;
  const sections = SUBSECTION_DEFS
    .map(s => ({ ...s, rows: Array.isArray(data[s.key]) ? data[s.key] : [] }))
    .filter(s => s.rows.length > 0);
  if (sections.length === 0) return null;
  return (
    <div className="space-y-4">
      {sections.map(s => (
        <FundingSectionCard key={s.key} section={s} />
      ))}
    </div>
  );
}

function EmptySection({ message }) {
  return <p className="text-gray-400 text-sm py-4 text-center">{message}</p>;
}

// --- BODY END ---

export {
  StartupSubSections,
  EmptySection,
};
