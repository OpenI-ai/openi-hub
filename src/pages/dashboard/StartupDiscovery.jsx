import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { startupAPI, publicAPI } from '../../services/api';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import TaxonomyFilterPanel from '../../components/TaxonomyFilterPanel';
import {
  Search, Cpu, MapPin, Users, DollarSign, Bookmark, BookmarkCheck,
  ChevronLeft, ChevronRight, Globe, Calendar, X,
} from 'lucide-react';

function formatFunding(val) {
  if (!val) return '-';
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return val;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(0)}K`;
  return `$${num}`;
}

function StartupCard({ startup, onWatchlist, watchlisted, onClick }) {
  const initials = (startup.company_name || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const location = [startup.city, startup.state, startup.country].filter(Boolean).join(', ') || '—';

  return (
    <div onClick={onClick} className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md hover:border-primary-200 transition-all cursor-pointer group">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 min-w-0">
          {startup.logo_url ? (
            <img src={startup.logo_url} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
          ) : (
            <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center text-dark-950 font-bold text-sm flex-shrink-0">{initials}</div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-gray-900 text-sm truncate">{startup.company_name}</h3>
              {startup.is_deeptech && <Cpu size={12} className="text-primary-500 flex-shrink-0" />}
            </div>
            <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1"><MapPin size={10} /> {location}</div>
          </div>
        </div>
        <button onClick={e => { e.stopPropagation(); onWatchlist(startup.id); }}
          className={`p-1.5 rounded-lg transition-all flex-shrink-0 ${watchlisted ? 'text-primary-500 bg-primary-50' : 'text-gray-300 hover:text-primary-400'}`}>
          {watchlisted ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
        </button>
      </div>

      <p className="text-xs text-gray-600 leading-relaxed mb-3 line-clamp-2">{startup.tagline || startup.description || 'No description available'}</p>

      <div className="flex gap-1.5 mb-3 flex-wrap">
        {startup.sector && <span className="px-2 py-0.5 bg-primary-50 text-primary-700 border border-primary-100 text-xs rounded-full truncate max-w-[140px]">{startup.sector}</span>}
        {startup.stage && <span className={`px-2 py-0.5 text-xs rounded-full ${startup.stage?.includes('Series') ? 'bg-accent-100 text-accent-700' : 'bg-gray-100 text-gray-600'}`}>{startup.stage}</span>}
        {startup.tech_readiness && <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">TRL {startup.tech_readiness}</span>}
      </div>

      {(startup.technologies || []).length > 0 && (
        <div className="flex gap-1 mb-3 flex-wrap">
          {(startup.technologies || []).slice(0, 3).map((t, i) => (
            <span key={i} className="px-2 py-0.5 bg-yellow-50 text-yellow-700 text-[10px] rounded-full">{t}</span>
          ))}
          {(startup.technologies || []).length > 3 && (
            <span className="px-2 py-0.5 text-gray-500 text-[10px]">+{startup.technologies.length - 3}</span>
          )}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 text-center mt-3 pt-3 border-t border-gray-100">
        {startup.founded_year && (
          <div>
            <div className="text-sm font-bold text-gray-800 flex items-center justify-center gap-1"><Calendar size={11} className="text-gray-400" /> {startup.founded_year}</div>
            <div className="text-xs text-gray-400">Founded</div>
          </div>
        )}
        {startup.team_size && (
          <div>
            <div className="text-sm font-bold text-gray-800 flex items-center justify-center gap-1"><Users size={11} className="text-gray-400" /> {startup.team_size}</div>
            <div className="text-xs text-gray-400">Team</div>
          </div>
        )}
        {startup.funding_raised ? (
          <div>
            <div className="text-sm font-bold text-gray-800 flex items-center justify-center gap-1"><DollarSign size={11} className="text-gray-400" /> {formatFunding(startup.funding_raised)}</div>
            <div className="text-xs text-gray-400">Raised</div>
          </div>
        ) : startup.domain_name ? (
          <div>
            <div className="text-sm font-bold text-gray-800 flex items-center justify-center gap-1"><Globe size={11} className="text-gray-400" /> <span className="truncate text-xs">{startup.domain_name}</span></div>
            <div className="text-xs text-gray-400">Domain</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function StartupDiscovery() {
  const navigate = useNavigate();
  const [startups, setStartups] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [facets, setFacets] = useState({ stage: {}, sector: {} });

  const [filters, setFilters] = useState({ sector: '', func: '', technology: '', usecase: '', stage: '', search: '', deeptech: false });
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [watchlist, setWatchlist] = useState([]);
  const [page, setPage] = useState(1);
  const limit = 24;

  const [taxonomy, setTaxonomy] = useState({ sectors: [], functions: [], technologies: [], usecases: [] });

  useEffect(() => {
    publicAPI.getTaxonomy().then(data => {
      if (data) setTaxonomy({
        sectors: data.sectors || [],
        functions: data.functions || [],
        technologies: data.technologies || [],
        usecases: data.usecases || [],
      });
    }).catch(() => {});
  }, []);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(filters.search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [filters.search]);

  const fetchStartups = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (debouncedSearch) params.search = debouncedSearch;
      if (filters.sector) params.sector = filters.sector;
      if (filters.stage) params.stage = filters.stage;
      if (filters.technology) params.technology = filters.technology;
      if (filters.func) params.func = filters.func;
      if (filters.usecase) params.usecase = filters.usecase;
      if (filters.deeptech) params.deeptech = 'true';

      const data = await startupAPI.list(params);
      setStartups(data.startups || []);
      setTotal(data.total || 0);
      setFacets(data.facets || { stage: {}, sector: {} });
    } catch (err) {
      toast.error(err.message || 'Failed to load startups');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, filters.sector, filters.stage, filters.technology, filters.func, filters.usecase, filters.deeptech]);

  useEffect(() => { fetchStartups(); }, [fetchStartups]);

  const setFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    if (key !== 'search') setPage(1);
  };
  const clearFilters = () => {
    setFilters({ sector: '', func: '', technology: '', usecase: '', stage: '', search: '', deeptech: false });
    setPage(1);
  };

  const toggleWatchlist = (id) => setWatchlist(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const totalPages = Math.ceil(total / limit);

  const activeFilterChips = Object.entries(filters)
    .filter(([k, v]) => v && k !== 'search' && v !== false)
    .map(([k, v]) => ({ key: k, value: typeof v === 'boolean' ? 'DeepTech' : v }));

  return (
    <div className="p-6" style={{ display: 'flex', gap: 20, maxWidth: 1400, margin: '0 auto' }}>
      {/* Left filter panel */}
      <div style={{ width: 260, flexShrink: 0 }}>
        <TaxonomyFilterPanel
          taxonomy={taxonomy}
          filters={filters}
          onChange={setFilter}
          onClear={clearFilters}
          facets={facets}
        />
      </div>

      {/* Results */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">Discover Startups</h1>
            <p className="text-gray-500 text-sm mt-0.5">{total.toLocaleString()} startups · Search and filter the ecosystem</p>
          </div>
          {watchlist.length > 0 && (
            <p className="text-sm text-primary-600">
              <BookmarkCheck size={14} className="inline mr-1" />
              {watchlist.length} in watchlist
            </p>
          )}
        </div>

        {activeFilterChips.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {activeFilterChips.map(({ key, value }) => (
              <span key={key} className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-700 text-xs rounded-full border border-primary-200">
                {key}: {value} <button onClick={() => setFilter(key, key === 'deeptech' ? false : '')}><X size={12} /></button>
              </span>
            ))}
            <button onClick={clearFilters} className="text-xs text-gray-500 hover:text-gray-700 underline">Clear all</button>
          </div>
        )}

        {loading ? (
          <LoadingSkeleton type="card" />
        ) : startups.length === 0 ? (
          <div className="text-center py-16">
            <Search size={40} className="mx-auto text-gray-200 mb-4" />
            <h3 className="font-semibold text-gray-600">No startups match your filters</h3>
            <p className="text-gray-400 text-sm mt-1">Try clearing filters or adjusting the search term</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {startups.map(startup => (
                <StartupCard
                  key={startup.id}
                  startup={startup}
                  watchlisted={watchlist.includes(startup.id)}
                  onWatchlist={toggleWatchlist}
                  onClick={() => navigate(`/dashboard/startup-profile/${startup.user_id || startup.id}`)}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={15} /> Previous
                </button>
                <span className="text-sm text-gray-600 px-4">Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next <ChevronRight size={15} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
