import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { startupAPI, publicAPI } from '../../services/api';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import { Search, Cpu, MapPin, Users, DollarSign, Bookmark, BookmarkCheck, SlidersHorizontal, ChevronLeft, ChevronRight, Globe, Building2, Calendar, X } from 'lucide-react';

const STAGES = ['All', 'Pre-seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Growth', 'Pre-revenue'];

function StartupCard({ startup, onWatchlist, watchlisted, onClick }) {
  const initials = (startup.company_name || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const location = [startup.city, startup.state].filter(Boolean).join(', ') || 'India';

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
        <button onClick={e => { e.stopPropagation(); onWatchlist(startup.id); }} className={`p-1.5 rounded-lg transition-all flex-shrink-0 ${watchlisted ? 'text-primary-500 bg-primary-50' : 'text-gray-300 hover:text-primary-400'}`}>
          {watchlisted ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
        </button>
      </div>

      <p className="text-xs text-gray-600 leading-relaxed mb-3 line-clamp-2">{startup.tagline || startup.description || 'No description available'}</p>

      <div className="flex gap-1.5 mb-3 flex-wrap">
        {startup.sector && <span className="px-2 py-0.5 bg-primary-50 text-primary-700 border border-primary-100 text-xs rounded-full truncate max-w-[140px]">{startup.sector}</span>}
        {startup.stage && <span className={`px-2 py-0.5 text-xs rounded-full ${startup.stage?.includes('Series') ? 'bg-accent-100 text-accent-700' : 'bg-gray-100 text-gray-600'}`}>{startup.stage}</span>}
        {startup.tech_readiness && <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">TRL {startup.tech_readiness}</span>}
      </div>

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

function formatFunding(val) {
  if (!val) return '-';
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return val;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(0)}K`;
  return `$${num}`;
}

export default function StartupDiscovery() {
  const navigate = useNavigate();
  const [startups, setStartups] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sector, setSector] = useState('All');
  const [stage, setStage] = useState('All');
  const [deeptech, setDeeptech] = useState(false);
  const [watchlist, setWatchlist] = useState([]);
  const [sortBy, setSortBy] = useState('recent');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 24;

  // Taxonomy from API
  const [taxonomySectors, setTaxonomySectors] = useState([]);
  const [taxonomyTechs, setTaxonomyTechs] = useState([]);

  useEffect(() => {
    publicAPI.getTaxonomy().then(data => {
      if (data.sectors) setTaxonomySectors(['All', ...data.sectors.filter(s => !s.parent_id).map(s => s.name).sort()]);
      if (data.technologies) setTaxonomyTechs(data.technologies.filter(t => !t.parent_id).map(t => t.name).sort());
    }).catch(() => {});
  }, []);

  const fetchStartups = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (search) params.search = search;
      if (sector !== 'All') params.sector = sector;
      if (stage !== 'All') params.stage = stage;
      if (deeptech) params.deeptech = 'true';
      const data = await startupAPI.list(params);
      setStartups(data.startups || []);
      setTotal(data.total || 0);
    } catch (err) {
      toast.error(err.message || 'Failed to load startups');
    } finally {
      setLoading(false);
    }
  }, [page, search, sector, stage, deeptech]);

  useEffect(() => { fetchStartups(); }, [fetchStartups]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleFilterChange = (setter) => (val) => {
    setter(val);
    setPage(1);
  };

  const toggleWatchlist = (id) => setWatchlist(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Startup Discovery</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total.toLocaleString()} startups available · Search and filter the ecosystem</p>
        </div>
      </div>

      {/* Search & Controls */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-primary-400 text-sm shadow-sm"
            placeholder="Search by name, sector, technology, or keyword..."
          />
        </div>
        <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${showFilters ? 'bg-primary-500 text-dark-950 border-primary-500' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
          <SlidersHorizontal size={15} /> Filters
        </button>
      </div>

      {/* Active filter chips */}
      {(sector !== 'All' || stage !== 'All' || deeptech) && (
        <div className="flex flex-wrap gap-2 mb-3">
          {sector !== 'All' && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-700 text-xs rounded-full border border-primary-200">
              {sector} <button onClick={() => { setSector('All'); setPage(1); }}><X size={12} /></button>
            </span>
          )}
          {stage !== 'All' && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200">
              {stage} <button onClick={() => { setStage('All'); setPage(1); }}><X size={12} /></button>
            </span>
          )}
          {deeptech && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-700 text-xs rounded-full border border-purple-200">
              DeepTech <button onClick={() => { setDeeptech(false); setPage(1); }}><X size={12} /></button>
            </span>
          )}
          <button onClick={() => { setSector('All'); setStage('All'); setDeeptech(false); setPage(1); }}
            className="text-xs text-gray-500 hover:text-gray-700 underline">Clear all</button>
        </div>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Sector</label>
              <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                {(taxonomySectors.length > 1 ? taxonomySectors : ['All', 'Financial Services', 'Healthcare', 'IT & Software', 'AI & Data Science', 'Manufacturing', 'Retail & Consumer', 'Energy & Utilities', 'Education', 'Defence & Aerospace', 'Agriculture', 'Automotive & Mobility', 'Pharmaceuticals & Life Sciences', 'Media & Entertainment', 'FMCG / CPG', 'Marketing & Advertising', 'Electronics & IoT', 'Deep Technology', 'Cybersecurity', 'Real Estate & Construction', 'Social Impact', 'Climate & Sustainability', 'Telecom', 'Logistics & Supply Chain', 'Travel & Hospitality']).map(s => (
                  <label key={s} className="flex items-center gap-2 cursor-pointer py-0.5">
                    <input type="radio" name="sector" checked={sector === s} onChange={() => handleFilterChange(setSector)(s)} className="text-primary-500 w-3.5 h-3.5" />
                    <span className="text-xs text-gray-700">{s}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Stage</label>
              <div className="space-y-1">
                {STAGES.map(s => (
                  <label key={s} className="flex items-center gap-2 cursor-pointer py-0.5">
                    <input type="radio" name="stage" checked={stage === s} onChange={() => handleFilterChange(setStage)(s)} className="text-primary-500 w-3.5 h-3.5" />
                    <span className="text-xs text-gray-700">{s}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Technology</label>
              <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                {taxonomyTechs.length > 0 ? taxonomyTechs.map(t => (
                  <button key={t} onClick={() => setSearchInput(prev => prev === t ? '' : t)}
                    className={`block w-full text-left px-2 py-1 rounded text-xs transition-all ${searchInput === t ? 'bg-primary-100 text-primary-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}>
                    {t}
                  </button>
                )) : (
                  <p className="text-xs text-gray-400">Loading...</p>
                )}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Special Filters</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={deeptech} onChange={e => { setDeeptech(e.target.checked); setPage(1); }} className="rounded text-primary-500" />
                  <span className="text-xs text-gray-700 flex items-center gap-1"><Cpu size={12} className="text-primary-500" /> DeepTech Only</span>
                </label>
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
            <button onClick={() => { setSector('All'); setStage('All'); setDeeptech(false); setSearchInput(''); setPage(1); }} className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm">Reset Filters</button>
          </div>
        </div>
      )}

      {/* Results header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-gray-800">{total.toLocaleString()}</span> startups found
          {search && <span className="ml-1">for &ldquo;<span className="text-primary-600">{search}</span>&rdquo;</span>}
          {watchlist.length > 0 && <span className="ml-2">· <span className="font-semibold text-primary-600">{watchlist.length}</span> in watchlist</span>}
        </p>
        {totalPages > 1 && (
          <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <LoadingSkeleton type="card" />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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

          {startups.length === 0 && (
            <div className="text-center py-16">
              <Search size={40} className="mx-auto text-gray-200 mb-4" />
              <h3 className="font-semibold text-gray-600">No startups match your search</h3>
              <p className="text-gray-400 text-sm mt-1">Try adjusting the search term or filters</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={15} /> Previous
              </button>
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                let p;
                if (totalPages <= 5) { p = i + 1; }
                else if (page <= 3) { p = i + 1; }
                else if (page >= totalPages - 2) { p = totalPages - 4 + i; }
                else { p = page - 2 + i; }
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium ${p === page ? 'bg-primary-500 text-dark-950' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    {p}
                  </button>
                );
              })}
              {totalPages > 5 && page < totalPages - 2 && <span className="text-gray-400">...</span>}
              {totalPages > 5 && page < totalPages - 2 && (
                <button onClick={() => setPage(totalPages)} className="w-10 h-10 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">{totalPages}</button>
              )}
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
