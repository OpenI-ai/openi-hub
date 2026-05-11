/**
 * ClusterDetail.jsx — Stage C: members of a single cluster.
 *
 * URL: /dashboard/clusters/:id
 * Header: cluster label, member count, avg profile score, top sectors.
 * Body: paginated list of member startups, sortable by score or A-Z.
 * Each row → /dashboard/startup/:user_id (existing startup profile page).
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  Star,
  ExternalLink,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { clusterAPI } from '../../services/clusterAPI';
import ClusterHubAndSpoke from '../../components/ClusterHubAndSpoke';

const PAGE_SIZE = 20;

export default function ClusterDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [cluster, setCluster] = useState(null);
  const [startups, setStartups] = useState({ startups: [], total: 0 });
  // Phase 68/71: representatives = balanced top-N leaves for the hub-and-spoke
  // diagram. Separate from `startups` (sortable+paginated table view) so list
  // pagination/sort never disturbs the diagram. Phase 71 adds `subgroups`:
  // when populated, the diagram renders a third sub-group ring.
  const [representatives, setRepresentatives] = useState([]);
  const [subgroups, setSubgroups] = useState([]);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('score_desc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [c, s, r] = await Promise.all([
        clusterAPI.getOne(id),
        clusterAPI.listStartups(id, { page, pageSize: PAGE_SIZE, sort }),
        clusterAPI
          .representatives(id, { per_sector: 2, max_sectors: 6, include_subgroups: 1 })
          .catch(() => ({ startups: [], subgroups: [] })),
      ]);
      setCluster(c);
      setStartups(s);
      setRepresentatives(r.startups || []);
      setSubgroups(r.subgroups || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id, page, sort]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil((startups.total || 0) / PAGE_SIZE));

  if (loading && !cluster) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse text-gray-400 text-sm">Loading cluster…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <button
          onClick={() => navigate('/dashboard/clusters')}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-[#D4A843] mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Innovation Map
        </button>
        <div className="p-4 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Back nav */}
      <button
        onClick={() => navigate('/dashboard/clusters')}
        className="flex items-center gap-1 text-sm text-gray-600 hover:text-[#D4A843] mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Innovation Map
      </button>

      {/* Header */}
      {cluster && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-5">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-[#D4A843]/10 rounded-lg shrink-0">
              <Layers className="w-7 h-7 text-[#D4A843]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-mono text-gray-400">
                  Theme #{cluster.cluster_id}
                </span>
              </div>
              <h1 className="text-2xl font-semibold text-[#0D2137] mb-2">
                {cluster.cluster_label || `Theme ${cluster.cluster_id}`}
              </h1>

              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>
                    <strong className="text-[#0D2137]">{cluster.member_count.toLocaleString()}</strong> startups
                  </span>
                </div>
                {cluster.avg_profile_score && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4" />
                    <span>
                      Avg score <strong className="text-[#0D2137]">{cluster.avg_profile_score}</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Top sectors */}
              {cluster.top_sectors && cluster.top_sectors.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {cluster.top_sectors.map((s) => (
                    <span
                      key={s.sector}
                      className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded"
                    >
                      {s.sector} <span className="text-gray-400">· {s.n}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Innovation Map diagram — Phase 71 adds a third sub-group ring for
          top-50 themes; other themes silently degrade to the Phase 68
          two-tier (hub → sector → leaf) layout. */}
      {cluster && (representatives.length > 0 || startups.startups.length > 0) && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-[#0D2137]">Innovation Map of representative startups</h2>
            <span className="text-[11px] text-gray-500">
              {subgroups.length > 0
                ? `Top 2 per sub-group · click any node to open`
                : representatives.length > 0
                  ? `Top 2 per sector · click any node to open`
                  : `Top ${Math.min(20, startups.startups.length)} by profile score · click any node to open`}
            </span>
          </div>
          {subgroups.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2 text-[10px] text-gray-500">
              <span className="px-2 py-0.5 bg-[#0D2137] text-white rounded-full">Innovation Map</span>
              <span className="px-2 py-0.5 bg-white border border-[#D4A843] text-[#0D2137] rounded-full">Sectors</span>
              <span className="px-2 py-0.5 bg-[#FFFDF6] border border-[#E5C36A] text-[#0D2137] rounded-full">Sub-groups</span>
            </div>
          )}
          <ClusterHubAndSpoke
            cluster={cluster}
            startups={representatives.length > 0 ? representatives : startups.startups}
            subgroups={subgroups}
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
          <option value="score_desc">Highest score</option>
          <option value="name_asc">Name A-Z</option>
        </select>
      </div>

      {/* Members list */}
      <div className="space-y-2">
        {startups.startups.map((s) => (
          <Link
            key={s.id}
            to={
              // s50 alias: plural /startups/:id resolves to <StartupProfile />.
              // Singular /startup/:id is NOT a registered route. Pass ?by=user_id
              // to disambiguate the id-vs-user_id collision (s50 J10 follow-up).
              s.user_id
                ? `/dashboard/startups/${s.user_id}?by=user_id`
                : `/dashboard/startups/${s.id}`
            }
            className="block bg-white border border-gray-200 rounded-lg p-4 hover:border-[#D4A843] hover:shadow-sm transition-all"
          >
            <div className="flex items-start gap-3">
              {/* Logo */}
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

              {/* Body */}
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
                  {s.profile_score != null && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                      {s.profile_score}
                    </span>
                  )}
                </div>

                {(s.tagline || s.description) && (
                  <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                    {s.tagline || s.description}
                  </p>
                )}

                <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-500">
                  {s.sector && <span>{s.sector}</span>}
                  {s.stage && <span>· {s.stage}</span>}
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
            Page {page} of {totalPages}
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
