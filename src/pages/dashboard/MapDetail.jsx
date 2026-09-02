/**
 * MapDetail.jsx — s106: one standalone Innovation Map.
 *
 * URL: /dashboard/maps/:dimension/:slug (e.g. /maps/sector/cybersecurity,
 * /maps/technology/agentic-ai, /maps/usecase/anti-counterfeiting).
 *
 * Header: term label, definition, member count, ring chips (the top
 * co-assigned terms from the other dimensions). Diagram: the same
 * <ClusterHubAndSpoke/> as the theme pages — the ring of "sectors" is the
 * co-assigned-term ring the backend returns in top_sectors shape. Body:
 * paginated member list, content-first ranked, junk-blanked (s105 rules).
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  ExternalLink,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Map as MapIcon,
} from 'lucide-react';
import { mapsAPI } from '../../services/clusterAPI';
import ClusterHubAndSpoke from '../../components/ClusterHubAndSpoke';

const PAGE_SIZE = 20;
const DIMENSION_KICKER = {
  sector: 'Sector map',
  technology: 'Technology map',
  function: 'Function map',
  usecase: 'Use-case map',
};

export default function MapDetail() {
  const { dimension, slug } = useParams();
  const navigate = useNavigate();

  const [term, setTerm] = useState(null);
  const [startups, setStartups] = useState({ startups: [], total: 0 });
  const [reps, setReps] = useState({ startups: [], top_sectors: [] });
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('score_desc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [t, s, r] = await Promise.all([
        mapsAPI.getOne(dimension, slug),
        mapsAPI.listStartups(dimension, slug, { page, pageSize: PAGE_SIZE, sort }),
        mapsAPI
          .representatives(dimension, slug, { per_ring: 2, max_ring: 6 })
          .catch(() => ({ startups: [], top_sectors: [] })),
      ]);
      setTerm(t);
      setStartups(s);
      setReps(r);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [dimension, slug, page, sort]);

  useEffect(() => {
    load();
  }, [load]);

  // s108 — navigating between maps in-place (parent breadcrumb, drill-down
  // or ring chips) must not carry the old map's page offset along.
  useEffect(() => {
    setPage(1);
    setSort('score_desc');
  }, [dimension, slug]);

  const totalPages = Math.max(1, Math.ceil((startups.total || 0) / PAGE_SIZE));

  if (loading && !term) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse text-gray-400 text-sm">Loading map…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <button
          onClick={() => navigate('/dashboard/art-of-possible?tab=maps')}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-[#D4A843] mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Innovation Maps
        </button>
        <div className="p-4 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <button
        onClick={() => navigate('/dashboard/art-of-possible?tab=maps')}
        className="flex items-center gap-1 text-sm text-gray-600 hover:text-[#D4A843] mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Innovation Maps
      </button>

      {/* Header */}
      {term && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-5">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-[#D4A843]/10 rounded-lg shrink-0">
              <MapIcon className="w-7 h-7 text-[#D4A843]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-mono text-gray-400 mb-1">
                {DIMENSION_KICKER[dimension] || 'Innovation map'}
                {term.parent && (
                  <>
                    {' · part of '}
                    <Link
                      to={`/dashboard/maps/${dimension}/${term.parent.slug}`}
                      className="text-[#D4A843] hover:underline"
                    >
                      {term.parent.label}
                    </Link>
                  </>
                )}
              </div>
              <h1 id="tour-page-map-detail-header" className="text-2xl font-semibold text-[#0D2137] mb-1">
                {term.label}
              </h1>
              <p className="text-sm text-gray-500 mb-2">{term.definition}</p>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                <span>
                  <strong className="text-[#0D2137]">
                    {term.member_count.toLocaleString()}
                  </strong>{' '}
                  startups
                </span>
              </div>
              {/* s108 — drill-down: this map's child maps (family rollup
                  counts). Children still at 0 (not yet classified) hidden. */}
              {term.children && term.children.some((c) => c.member_count > 0) && (
                <div className="mt-3">
                  <span className="text-[11px] uppercase tracking-wide text-gray-400 mr-2">
                    Drill down
                  </span>
                  <span className="inline-flex flex-wrap gap-2 align-middle">
                    {term.children
                      .filter((c) => c.member_count > 0)
                      .map((c) => (
                        <Link
                          key={c.slug}
                          to={`/dashboard/maps/${dimension}/${c.slug}`}
                          className="text-xs px-2 py-1 bg-[#D4A843]/10 text-[#0D2137] rounded hover:bg-[#D4A843]/25 font-medium"
                        >
                          {c.label} <span className="text-gray-500 font-normal">· {c.member_count.toLocaleString()}</span>
                        </Link>
                      ))}
                  </span>
                </div>
              )}
              {term.ring && term.ring.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {term.ring.map((r) => (
                    <Link
                      key={`${r.dimension}:${r.slug}`}
                      to={`/dashboard/maps/${r.dimension}/${r.slug}`}
                      className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-[#D4A843]/10 hover:text-[#0D2137]"
                    >
                      {r.label} <span className="text-gray-400">· {r.n}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hub-and-spoke diagram — ring = co-assigned terms from the other
          dimensions, returned by the backend in top_sectors shape. */}
      {term && reps.startups.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-[#0D2137]">
              Innovation Map of representative startups
            </h2>
            <span className="text-[11px] text-gray-500">
              Top 2 per related theme · click any node to open
            </span>
          </div>
          <ClusterHubAndSpoke
            cluster={{
              cluster_id: 0,
              kicker: DIMENSION_KICKER[dimension] || 'Innovation map',
              cluster_label: term.label,
              member_count: term.member_count,
              top_sectors: reps.top_sectors,
            }}
            startups={reps.startups}
            subgroups={[]}
          />
        </div>
      )}

      {/* Sort + count */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs text-gray-500">
          Showing {startups.startups.length} of {(startups.total || 0).toLocaleString()} members
        </div>
        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            setPage(1);
          }}
          className="px-3 py-1.5 border border-gray-200 rounded text-sm bg-white"
        >
          <option value="score_desc">Best match</option>
          <option value="name_asc">Name A-Z</option>
        </select>
      </div>

      {/* Members list */}
      <div className="space-y-2">
        {startups.startups.map((s) => (
          <Link
            key={s.id}
            to={
              s.user_id
                ? `/dashboard/startups/${s.user_id}?by=user_id`
                : `/dashboard/startups/${s.id}`
            }
            className="block bg-white border border-gray-200 rounded-lg p-4 hover:border-[#D4A843] hover:shadow-sm transition-all"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center shrink-0">
                {s.logo_url ? (
                  <img
                    src={s.logo_url}
                    alt=""
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <span className="text-xs font-semibold text-gray-400">
                    {(s.company_name || '?').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-[#0D2137] text-sm truncate">
                    {s.company_name || 'Unnamed'}
                  </h3>
                  {s.is_deeptech && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-[#D4A843]/10 text-[#D4A843] rounded font-medium">
                      DeepTech
                    </span>
                  )}
                  {s.match_score != null && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                      match {(s.match_score * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
                {(s.tagline || s.description) && (
                  <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                    {s.tagline || s.description}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-500">
                  {s.stage && <span>{s.stage}</span>}
                  {s.city && (
                    <span className="flex items-center gap-0.5">
                      <MapPin className="w-3 h-3" /> {s.city}
                    </span>
                  )}
                  {s.website && (
                    <a
                      href={s.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-0.5 hover:text-[#D4A843]"
                    >
                      <ExternalLink className="w-3 h-3" /> site
                    </a>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
            className="px-3 py-1.5 border border-gray-200 rounded text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-600">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
            className="px-3 py-1.5 border border-gray-200 rounded text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
