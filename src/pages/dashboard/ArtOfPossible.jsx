/**
 * ArtOfPossible.jsx — s108b (Rajeev, 2 Sep): one destination serving both
 * sides of a buyer's question, as two tabs:
 *
 *   1. "Recommended for You" — which startups match ME (the persona's
 *      existing recommendations page, rendered inline).
 *   2. "Innovation Maps" — what's possible in MY WORLD (the hierarchical
 *      per-term maps, rendered inline with its page header suppressed).
 *
 * URL: /dashboard/art-of-possible[?tab=recommended|maps]
 * Deep links: the sidebar "Art of Possible" entry lands on the persona's
 * recommendations (or maps when the role has none); the "Innovation Maps"
 * discover entry deep-links to ?tab=maps. The old standalone routes
 * (/dashboard/maps, /dashboard/<persona>/recommended-startups) stay
 * routable so existing links and tours don't break.
 *
 * Personas without a recommendations page (startup, government, lab,
 * mentor, service provider, admin) see only the maps tab.
 */

import { useSearchParams } from 'react-router-dom';
import { Sparkles, Map as MapIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import InnovationMaps from './InnovationMaps';
import CorporateRecommendedStartups from './CorporateRecommendedStartups';
import StudentRecommendedStartups from './StudentRecommendedStartups';
import AcademiaRecommendedStartups from './AcademiaRecommendedStartups';
import InvestorRecommendedStartups from './InvestorRecommendedStartups';
import IncubatorRecommendedStartups from './IncubatorRecommendedStartups';
import AcceleratorRecommendedStartups from './AcceleratorRecommendedStartups';

const REC_COMPONENT = {
  corporate: CorporateRecommendedStartups,
  student: StudentRecommendedStartups,
  academia: AcademiaRecommendedStartups,
  investor: InvestorRecommendedStartups,
  incubator: IncubatorRecommendedStartups,
  accelerator: AcceleratorRecommendedStartups,
};

export default function ArtOfPossible() {
  const { activeRole, primaryRole } = useAuth();
  const role = activeRole || primaryRole;
  const Rec = REC_COMPONENT[role] || null;

  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get('tab');
  const tab = requested === 'maps' || (!Rec && requested !== 'recommended')
    ? 'maps'
    : requested === 'recommended' && Rec
      ? 'recommended'
      : Rec ? 'recommended' : 'maps';

  const switchTab = (t) => setSearchParams({ tab: t }, { replace: true });

  return (
    <div>
      {/* Umbrella header + tab switch. The tab CONTENT pages render their
          own headers/tooling below, so this bar stays slim. */}
      <div className="px-6 pt-6 max-w-7xl mx-auto">
        <h1 id="tour-page-aop-header" className="text-2xl font-semibold text-[#0D2137] mb-1">
          Art of the Possible
        </h1>
        <p className="text-sm text-gray-500 mb-4">
          Startups matched to you, and the innovation landscape of your world.
        </p>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
          {Rec && (
            <button
              onClick={() => switchTab('recommended')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                tab === 'recommended'
                  ? 'bg-white text-[#0D2137] shadow-sm'
                  : 'text-gray-500 hover:text-[#0D2137]'
              }`}
            >
              <Sparkles className="w-4 h-4 text-[#D4A843]" /> Recommended for You
            </button>
          )}
          <button
            onClick={() => switchTab('maps')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === 'maps'
                ? 'bg-white text-[#0D2137] shadow-sm'
                : 'text-gray-500 hover:text-[#0D2137]'
            }`}
          >
            <MapIcon className="w-4 h-4 text-[#D4A843]" /> Innovation Maps
          </button>
        </div>
      </div>

      {tab === 'recommended' && Rec ? <Rec /> : <InnovationMaps embedded />}
    </div>
  );
}
