/**
 * Clusters.jsx — Stage C: browse all 100 startup clusters.
 *
 * Grid of cluster cards, each showing label / member count / sample logos.
 * Search by label, sort by size or A-Z, paginated 24/page.
 * Click → /dashboard/clusters/:id detail page.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import { clusterAPI } from '../../services/clusterAPI';

const PAGE_SIZE = 24;

export default function Clusters() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sort, setSort] = useState('size_desc');
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ clusters: [], total: 0, page: 1, pageSize: PAGE_SIZE });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await clusterAPI.list({ q, sort, page, pageSize: PAGE_SIZE });
      setData(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [q, sort, page]);

  useEffect(() => {
    load();
  }, [load]);

  // Submit search input on Enter or via button
  const submitSearch = (e) => {
    e?.preventDefault();
    setPage(1);
    setQ(searchInput.trim());
  };

  const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-[#D4A843]/10 rounded-lg">
            <Layers className="w-6 h-6 text-[#D4A843]" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[#0D2137]">Innovation Map</h1>
            <p className="text-sm text-gray-600">
              Browse {data.total ? `the ${data.total.toLocaleString()}` : 'the'} innovation themes extracted from the OpenI startup directory
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <form onSubmit={submitSearch} className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search the Innovation Map (e.g. AI Agents, Healthcare)…"
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D4A843] focus:border-transparent outline-none text-sm bg-white"
          />
        </form>
        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white"
        >
          <option value="size_desc">Largest first</option>
          <option value="label_asc">Label A-Z</option>
        </select>
      </div>

      {/* Results count */}
      <div className="text-xs text-gray-500 mb-3">
        {loading ? 'Loading…' : `${data.total.toLocaleString()} theme${data.total === 1 ? '' : 's'}`}
        {q && !loading && <span> matching "{q}"</span>}
      </div>

      {/* Grid */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-sm text-red-700 mb-4">
          {error}
        </div>
      )}

      {!loading && data.clusters.length === 0 && !error && (
        <div className="text-center py-12 text-gray-500">
          <Layers className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No themes match your search.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.clusters.map((c) => (
          <button
            key={c.cluster_id}
            onClick={() => navigate(`/dashboard/clusters/${c.cluster_id}`)}
            className="text-left bg-white border border-gray-200 rounded-lg p-4 hover:border-[#D4A843] hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-[#0D2137] text-sm truncate">
                  {c.cluster_label || `Theme ${c.cluster_id}`}
                </h3>
                <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                  <Users className="w-3 h-3" />
                  <span>{c.member_count.toLocaleString()} startups</span>
                </div>
              </div>
              <span className="text-[10px] font-mono text-gray-400 ml-2 shrink-0">
                #{c.cluster_id}
              </span>
            </div>

            {/* Sample logos */}
            {c.sample_logos && c.sample_logos.length > 0 && (
              <div className="flex -space-x-2">
                {c.sample_logos.slice(0, 4).map((url, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-gray-50 border-2 border-white overflow-hidden flex items-center justify-center"
                  >
                    <img
                      src={url}
                      alt=""
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </button>
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
            Page {data.page} of {totalPages}
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
