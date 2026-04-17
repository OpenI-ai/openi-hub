import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { startupAPI, publicAPI } from '../../services/api';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import TaxonomyFilterPanel from '../../components/TaxonomyFilterPanel';
import {
  Search, Cpu, MapPin, Users, DollarSign, Bookmark, BookmarkCheck,
  ChevronLeft, ChevronRight, Globe, Calendar,
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
  const location = [startup.city, startup.state, startup.country].filter(Boolean).join(', ');

  return (
    <div onClick={onClick} className="bg-white rounded-xl border border-gray-200 p-3 hover:shadow-md hover:border-primary-200 transition-all cursor-pointer">
      {/* Header: logo + name + watchlist */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          {startup.logo_url ? (
            <img src={startup.logo_url} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0 bg-gray-50" />
          ) : (
            <div className="w-9 h-9 bg-primary-500 rounded-lg flex items-center justify-center text-dark-950 font-bold text-xs flex-shrink-0">{initials}</div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <h3 className="font-display font-bold text-gray-900 text-sm truncate">{startup.company_name}</h3>
              {startup.is_deeptech && <Cpu size={11} className="text-primary-500 flex-shrink-0" />}
            </div>
            {location && <div className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-0.5 truncate"><MapPin size={9} className="flex-shrink-0" /> <span className="truncate">{location}</span></div>}
          </div>
        </div>
        <button onClick={e => { e.stopPropagation(); onWatchlist(startup.id); }}
          className={`p-1 rounded transition-all flex-shrink-0 ${watchlisted ? 'text-primary-500 bg-primary-50' : 'text-gray-300 hover:text-primary-400'}`}>
          {watchlisted ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
        </button>
      </div>

      {/* Tagline */}
      {(startup.tagline || startup.description) && (
        <p className="text-[11px] text-gray-600 leading-snug mb-2 line-clamp-2">{startup.tagline || startup.description}</p>
      )}

      {/* Primary chips: sector + stage */}
      <div className="flex gap-1 mb-2 flex-wrap">
        {startup.sector && <span className="px-1.5 py-0.5 bg-primary-50 text-primary-700 border border-primary-100 text-[10px] rounded-full truncate max-w-[120px]">{startup.sector}</span>}
        {startup.stage && <span className={`px-1.5 py-0.5 text-[10px] rounded-full ${startup.stage?.includes('Series') ? 'bg-accent-100 text-accent-700' : 'bg-gray-100 text-gray-600'}`}>{startup.stage}</span>}
        {startup.tech_readiness && <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] rounded-full">TRL {startup.tech_readiness}</span>}
      </div>

      {/* Inline compact stats footer */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100 text-[10px] text-gray-500">
        {startup.founded_year && (
          <span className="inline-flex items-center gap-0.5"><Calendar size={9} /> {startup.founded_year}</span>
        )}
        {startup.team_size && (
          <span className="inline-flex items-center gap-0.5"><Users size={9} /> {startup.team_size}</span>
        )}
        {startup.funding_raised ? (
          <span className="inline-flex items-center gap-0.5 font-semibold text-accent-700"><DollarSign size={9} /> {formatFunding(startup.funding_raised)}</span>
        ) : startup.domain_name ? (
          <span className="inline-flex items-center gap-0.5 truncate"><Globe size={9} /> <span className="truncate max-w-[90px]">{startup.domain_name}</span></span>
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

  return (
    <div className="p-6" style={{ maxWidth: 1600, margin: '0 auto' }}>
      {/* Page header */}
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

      {/* Top horizontal filter bar */}
      <TaxonomyFilterPanel
        taxonomy={taxonomy}
        filters={filters}
        onChange={setFilter}
        onClear={clearFilters}
        facets={facets}
      />

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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
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
  );
}
