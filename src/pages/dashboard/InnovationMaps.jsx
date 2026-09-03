/**
 * InnovationMaps.jsx — s106/s108/s108b: directory of standalone Innovation Maps.
 *
 * URL: /dashboard/maps
 * One micro-focused map per curated term, four buyer-lens dimensions.
 *
 * s108b redesign (Rajeev, 2 Sep):
 *  - LENS TABS (Sectors | Technologies | Functions | Use cases) replace the
 *    single endless scroll — a wall of ~130 cards buried the buyer's world.
 *  - "ART OF THE POSSIBLE" strip: personalized entry into the maps. If the
 *    user's profile carries an industry/sector we resolve it — first by
 *    label match against the live terms, else semantically via
 *    /api/maps/suggest (the s107 endpoint, one call) — and show THEIR maps.
 *    Fallback: curated persona quick-picks ("I'm in Banking", "I run
 *    Supply Chain", "I'm a CISO"). Links to the persona's Recommendations
 *    page both ways: maps = what's possible in my world, recommendations =
 *    which startups match me.
 *
 * Hierarchy (s108): /api/maps terms carry `parent`; a parent's
 * member_count is its family rollup. Top-level terms render as cards with
 * child chips; the filter matches a family when any descendant matches.
 * Terms with zero classified members stay hidden.
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Map as MapIcon, Sparkles, ArrowRight } from 'lucide-react';
import { mapsAPI } from '../../services/clusterAPI';
import { profileAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

function buildFamilies(terms) {
  const bySlug = Object.fromEntries(terms.map((t) => [t.slug, t]));
  const childrenOf = {};
  for (const t of terms) {
    if (t.parent && bySlug[t.parent]) {
      (childrenOf[t.parent] = childrenOf[t.parent] || []).push(t);
    }
  }
  const topLevel = terms.filter((t) => !t.parent || !bySlug[t.parent]);
  return { topLevel, childrenOf };
}

function familyMatches(term, childrenOf, needle) {
  if (!needle) return true;
  if (term.label.toLowerCase().includes(needle)) return true;
  return (childrenOf[term.slug] || []).some((c) => familyMatches(c, childrenOf, needle));
}

// Generic quick-picks — the C-suite door when no profile signal exists.
// Every target is a live curated slug (sector portals + function remits).
const PERSONA_PICKS = [
  { label: "I'm in Banking", to: '/dashboard/maps/sector/banking' },
  { label: 'I run Supply Chain', to: '/dashboard/maps/function/supply-chain' },
  { label: "I'm a CISO", to: '/dashboard/maps/sector/cybersecurity' },
  { label: 'Head of Marketing', to: '/dashboard/maps/function/marketing' },
  { label: "I'm in Retail", to: '/dashboard/maps/sector/retail-ecommerce' },
  { label: 'Pharma & Healthcare', to: '/dashboard/maps/sector/pharma' },
  { label: 'Manufacturing', to: '/dashboard/maps/sector/manufacturing' },
  { label: 'HR & People', to: '/dashboard/maps/function/hr' },
];

// Persona role → its Recommendations page (the other half of the bridge).
const RECOMMENDED_ROUTE = {
  corporate: '/dashboard/corporate/recommended-startups',
  student: '/dashboard/student/recommended-startups',
  academia: '/dashboard/academia/recommended-startups',
  investor: '/dashboard/investor/recommended-startups',
  incubator: '/dashboard/incubator/recommended-startups',
  accelerator: '/dashboard/accelerator/recommended-startups',
};

const TAB_ORDER = ['sector', 'technology', 'function', 'usecase'];

// `embedded`: rendered inside ArtOfPossible's tab — suppress this page's
// own big header (the umbrella page provides one) but keep everything else.
export default function InnovationMaps({ embedded = false }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState('');
  const [activeTab, setActiveTab] = useState('sector');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // { label: 'Pharmaceuticals', maps: [{dimension, slug, label}] } | null
  const [forYou, setForYou] = useState(null);

  useEffect(() => {
    let cancelled = false;
    mapsAPI
      .list()
      .then((d) => {
        if (cancelled) return;
        setData(d);
        // Personalization is best-effort and must never block the page:
        // profile → industry/sector string → label match, else semantic
        // suggest (one API call). Any failure silently keeps quick-picks.
        profileAPI
          .getMyProfile()
          .then(async (p) => {
            const prof = p?.profile || p || {};
            const signal = (prof.industry || prof.sector || '').trim();
            if (!signal || cancelled) return;
            const sectorTerms = (d.dimensions || []).find((x) => x.dimension === 'sector')?.terms || [];
            const needle = signal.toLowerCase();
            const direct = sectorTerms.filter(
              (t) => t.member_count > 0 &&
                (t.label.toLowerCase() === needle ||
                  t.label.toLowerCase().includes(needle) ||
                  needle.includes(t.label.toLowerCase()))
            ).slice(0, 2).map((t) => ({ dimension: 'sector', slug: t.slug, label: t.label }));
            let maps = direct;
            if (maps.length === 0 && signal.length >= 3) {
              const s = await mapsAPI.suggest(signal).catch(() => null);
              maps = (s?.maps || []).slice(0, 4).map((m) => ({
                dimension: m.dimension, slug: m.slug, label: m.label,
              }));
            } else if (maps.length > 0 && signal.length >= 3) {
              const s = await mapsAPI.suggest(signal).catch(() => null);
              for (const m of (s?.maps || [])) {
                if (maps.length >= 4) break;
                if (!maps.find((x) => x.dimension === m.dimension && x.slug === m.slug)) {
                  maps.push({ dimension: m.dimension, slug: m.slug, label: m.label });
                }
              }
            }
            if (!cancelled && maps.length > 0) setForYou({ label: signal, maps });
          })
          .catch(() => {});
      })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse text-gray-400 text-sm">Loading maps…</div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="p-4 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>
      </div>
    );
  }

  const needle = filter.trim().toLowerCase();
  const dimensions = (data?.dimensions || []).map((d) => {
    const withMembers = d.terms.filter((t) => t.member_count > 0);
    const { topLevel, childrenOf } = buildFamilies(withMembers);
    return {
      ...d,
      childrenOf,
      terms: topLevel.filter((t) => familyMatches(t, childrenOf, needle)),
    };
  });
  const byDim = Object.fromEntries(dimensions.map((d) => [d.dimension, d]));
  const active = byDim[activeTab] || dimensions[0];
  const anyContent = dimensions.some((d) => d.terms.length > 0);

  const role = user?.primary_role || (Array.isArray(user?.roles) ? user.roles[0] : user?.role);
  const recommendedRoute = RECOMMENDED_ROUTE[role];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header (suppressed when embedded in the Art of the Possible page) */}
      {!embedded && (
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[#D4A843]/10 rounded-lg">
              <MapIcon className="w-6 h-6 text-[#D4A843]" />
            </div>
            <div>
              <h1 id="tour-page-maps-header" className="text-2xl font-semibold text-[#0D2137]">
                Innovation Maps
              </h1>
              <p className="text-sm text-gray-500">
                The art of the possible — where innovation can help your business, by sector,
                technology, function and use case.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Art of the Possible strip — the persona door into the maps. */}
      <div className="mb-5 p-4 bg-gradient-to-r from-[#D4A843]/10 to-transparent border border-[#D4A843]/30 rounded-lg">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#D4A843]" />
            <span className="text-sm font-semibold text-[#0D2137]">
              {embedded
                ? (forYou ? `Your maps — ${forYou.label}` : 'Start with your world')
                : `Art of the Possible${forYou ? ` — for ${forYou.label}` : ''}`}
            </span>
          </div>
          {recommendedRoute && (
            <Link
              to={recommendedRoute}
              className="text-xs font-medium text-[#0D2137] hover:text-[#D4A843] flex items-center gap-1"
            >
              Startups picked for you <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {forYou
            ? forYou.maps.map((m) => (
                <Link
                  key={`${m.dimension}:${m.slug}`}
                  to={`/dashboard/maps/${m.dimension}/${m.slug}`}
                  className="text-xs px-3 py-1.5 bg-white border border-[#D4A843]/40 text-[#0D2137] rounded-full hover:bg-[#D4A843]/15 font-medium"
                >
                  {m.label}
                </Link>
              ))
            : PERSONA_PICKS.map((p) => (
                <Link
                  key={p.to}
                  to={p.to}
                  className="text-xs px-3 py-1.5 bg-white border border-[#D4A843]/40 text-[#0D2137] rounded-full hover:bg-[#D4A843]/15 font-medium"
                >
                  {p.label}
                </Link>
              ))}
        </div>
      </div>

      {/* Lens tabs + filter */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {TAB_ORDER.map((dim) => {
            const d = byDim[dim];
            if (!d) return null;
            const isActive = activeTab === dim;
            return (
              <button
                key={dim}
                onClick={() => setActiveTab(dim)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive ? 'bg-white text-[#0D2137] shadow-sm' : 'text-gray-500 hover:text-[#0D2137]'
                }`}
              >
                {d.label}
                <span className={`ml-1.5 text-xs ${isActive ? 'text-[#D4A843]' : 'text-gray-400'}`}>
                  {d.terms.length}
                </span>
              </button>
            );
          })}
        </div>
        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter maps… e.g. Retail Banking, Agentic AI"
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#D4A843]"
          />
        </div>
      </div>

      {!anyContent && (
        <div className="p-6 bg-white border border-gray-200 rounded-lg text-sm text-gray-600">
          {needle
            ? 'No map matches that filter.'
            : 'The maps are being computed — check back shortly.'}
        </div>
      )}

      {active && active.terms.length === 0 && anyContent && (
        <div className="p-6 bg-white border border-gray-200 rounded-lg text-sm text-gray-600">
          No {active.label.toLowerCase()} map matches that filter.
        </div>
      )}

      {active && active.terms.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {active.terms.map((t) => {
            const kids = active.childrenOf[t.slug] || [];
            if (kids.length === 0) {
              return (
                <Link
                  key={t.slug}
                  to={`/dashboard/maps/${active.dimension}/${t.slug}`}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:border-[#D4A843] hover:shadow-sm transition-all"
                >
                  <div className="font-semibold text-sm text-[#0D2137]">{t.label}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {t.member_count.toLocaleString()} startups
                  </div>
                </Link>
              );
            }
            // Family card: whole card opens the parent (portal) map; child
            // chips are real links (stopPropagation keeps them independent).
            // Grandchildren render nested under their parent chip (Rajeev,
            // 3 Sep: "pls show as a part of family tree" — e.g. Retail
            // Banking visible on the Financial Services card). Families
            // without grandchildren keep the compact wrapped-chip row.
            const hasGrandkids = kids.some((c) => (active.childrenOf[c.slug] || []).length > 0);
            const familySize = kids.reduce(
              (n, c) => n + 1 + (active.childrenOf[c.slug] || []).length,
              0
            );
            return (
              <div
                key={t.slug}
                role="link"
                tabIndex={0}
                onClick={() => navigate(`/dashboard/maps/${active.dimension}/${t.slug}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') navigate(`/dashboard/maps/${active.dimension}/${t.slug}`);
                }}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:border-[#D4A843] hover:shadow-sm transition-all cursor-pointer focus:outline-none focus:border-[#D4A843]"
              >
                <div className="font-semibold text-sm text-[#0D2137]">{t.label}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {t.member_count.toLocaleString()} startups · {familySize} sub-maps
                </div>
                {hasGrandkids ? (
                  <div className="mt-2 space-y-1">
                    {kids.map((c) => {
                      const grandkids = active.childrenOf[c.slug] || [];
                      return (
                        <div key={c.slug}>
                          <Link
                            to={`/dashboard/maps/${active.dimension}/${c.slug}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-[11px] px-1.5 py-0.5 bg-[#D4A843]/10 text-[#0D2137] rounded hover:bg-[#D4A843]/25"
                          >
                            {c.label}
                          </Link>
                          {grandkids.length > 0 && (
                            <div className="mt-1 ml-3 flex flex-wrap items-center gap-1">
                              <span className="text-[10px] text-gray-400" aria-hidden="true">
                                ↳
                              </span>
                              {grandkids.map((g) => (
                                <Link
                                  key={g.slug}
                                  to={`/dashboard/maps/${active.dimension}/${g.slug}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-[#0D2137] rounded hover:bg-[#D4A843]/25"
                                >
                                  {g.label}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {kids.map((c) => (
                      <Link
                        key={c.slug}
                        to={`/dashboard/maps/${active.dimension}/${c.slug}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-[11px] px-1.5 py-0.5 bg-[#D4A843]/10 text-[#0D2137] rounded hover:bg-[#D4A843]/25"
                      >
                        {c.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
