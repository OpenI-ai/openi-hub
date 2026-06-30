import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { startupAPI, publicAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import TaxonomyFilterPanel from '../../components/TaxonomyFilterPanel';
import AddStartupModal from '../../components/AddStartupModal';
import {
  Search, Cpu, MapPin, Users, Wallet, Bookmark, BookmarkCheck,
  ChevronLeft, ChevronRight, Globe, Calendar, Plus,
} from 'lucide-react';

// Personas allowed to submit a scouted startup to the catalogue: OpenI staff
// (admin, evaluator) + every innovation-seeker persona. Provider personas
// (startup/student/academia) are excluded — a startup doesn't add startups.
const STARTUP_ADDER_ROLES = [
  'admin', 'evaluator', 'corporate', 'government', 'investor',
  'mentor', 'lab', 'incubator', 'accelerator', 'service_provider',
];

function formatFunding(val, currency, unit) {
  if (!val) return null;
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (!Number.isFinite(num) || num <= 0) return null;

  // Phase 92.3 era: if backend already stored funding_raised in user-picked unit
  // (Lakh / Cr / K / M), respect it. Just prepend the currency symbol.
  const cur = (currency || 'INR').toUpperCase();
  const symbol = cur === 'INR' ? '₹' : cur === 'USD' ? '$' : `${cur} `;
  if (unit) {
    // num is already in unit-scaled form, e.g. funding_raised=0.5 unit='Cr' currency='INR'
    return `${symbol}${num}${unit}`;
  }

  // Legacy / pre-Phase-92.3 rows: num is raw rupees or raw dollars. Auto-format by magnitude.
  if (cur === 'INR') {
    if (num >= 1e7) return `${symbol}${(num / 1e7).toFixed(num >= 1e8 ? 0 : 1)}Cr`;
    if (num >= 1e5) return `${symbol}${(num / 1e5).toFixed(num >= 1e6 ? 0 : 1)}L`;
    if (num >= 1e3) return `${symbol}${(num / 1e3).toFixed(0)}K`;
    return `${symbol}${num}`;
  }
  // USD / other
  if (num >= 1e9) return `${symbol}${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `${symbol}${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${symbol}${(num / 1e3).toFixed(0)}K`;
  return `${symbol}${num}`;
}

// Validate that team_size is a positive integer before showing
function validTeamSize(val) {
  if (val == null) return null;
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (!Number.isInteger(num) || num < 1) return null;
  return num;
}

function StartupCard({ startup, onWatchlist, watchlisted, onClick, isClaimable = true }) {
  // Phase 92.2 (T21) - isClaimable=false means the row has NULL user_id
  // (imported-unclaimed). Card visually indicates non-clickable state.
  const initials = (startup.company_name || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const location = [startup.city, startup.state, startup.country].filter(Boolean).join(', ');

  return (
    <div
      onClick={isClaimable ? onClick : undefined}
      title={isClaimable ? '' : 'Profile not yet claimed by the founder'}
      className={`bg-white rounded-xl border p-3 transition-all ${
        isClaimable
          ? 'border-gray-200 hover:shadow-md hover:border-primary-200 cursor-pointer'
          : 'border-gray-100 opacity-60 cursor-not-allowed'
      }`}
    >
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

      {/* Tagline (defensively filters numeric/date values from bad CSV data) */}
      {(() => {
        const raw = startup.tagline || startup.description;
        if (!raw) return null;
        const s = String(raw).trim();
        // Skip pure numbers or ISO dates
        if (/^[0-9]+(\.[0-9]+)?$/.test(s) || /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(s)) return null;
        return <p className="text-[11px] text-gray-600 leading-snug mb-2 line-clamp-2">{s}</p>;
      })()}

      {/* Primary chips: sector + stage */}
      <div className="flex gap-1 mb-2 flex-wrap">
        {startup.sector && <span className="px-1.5 py-0.5 bg-primary-50 text-primary-700 border border-primary-100 text-[10px] rounded-full truncate max-w-[120px]">{startup.sector}</span>}
        {startup.stage && <span className={`px-1.5 py-0.5 text-[10px] rounded-full ${startup.stage?.includes('Series') ? 'bg-accent-100 text-accent-700' : 'bg-gray-100 text-gray-600'}`}>{startup.stage}</span>}
        {startup.tech_readiness && <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] rounded-full" title="Tech Readiness Level (1=concept · 9=proven in production)">Tech Readiness {startup.tech_readiness}</span>}
      </div>

      {/* Inline compact stats footer */}
      {(() => {
        const fundingStr = formatFunding(startup.funding_raised, startup.funding_raised_currency, startup.funding_raised_unit);
        const teamSize = validTeamSize(startup.team_size);
        const foundedYear = Number.isInteger(Number(startup.founded_year)) && Number(startup.founded_year) >= 1900 ? startup.founded_year : null;
        const hasAny = fundingStr || teamSize || foundedYear || startup.domain_name;
        if (!hasAny) return null;
        return (
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100 text-[10px] text-gray-500">
            {foundedYear && (
              <span className="inline-flex items-center gap-0.5"><Calendar size={9} /> {foundedYear}</span>
            )}
            {teamSize && (
              <span className="inline-flex items-center gap-0.5"><Users size={9} /> {teamSize}</span>
            )}
            {fundingStr ? (
              <span className="inline-flex items-center gap-0.5 font-semibold text-accent-700"><Wallet size={9} /> {fundingStr}</span>
            ) : startup.domain_name ? (
              <span className="inline-flex items-center gap-0.5 truncate"><Globe size={9} /> <span className="truncate max-w-[90px]">{startup.domain_name}</span></span>
            ) : null}
          </div>
        );
      })()}
    </div>
  );
}

export default function StartupDiscovery() {
  const navigate = useNavigate();
  const { user, activeRole } = useAuth();
  const canAdd = STARTUP_ADDER_ROLES.includes(activeRole || user?.role);
  const [showAdd, setShowAdd] = useState(false);
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
      <div id="tour-page-startups-header" className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Discover Startups</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total.toLocaleString()} startups · Search and filter the ecosystem</p>
        </div>
        <div className="flex items-center gap-4">
          {watchlist.length > 0 && (
            <p className="text-sm text-primary-600">
              <BookmarkCheck size={14} className="inline mr-1" />
              {watchlist.length} in watchlist
            </p>
          )}
          {canAdd && (
            <button
              onClick={() => setShowAdd(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-500 text-dark-950 font-semibold text-sm rounded-lg hover:bg-primary-400 flex-shrink-0"
            >
              <Plus size={15} /> Add Startup
            </button>
          )}
        </div>
      </div>

      {/* Top horizontal filter bar */}
      <div id="tour-page-startups-filters" />
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
          {canAdd && (
            <div className="mt-5">
              <p className="text-sm text-gray-500 mb-2">
                {debouncedSearch
                  ? <>Can&apos;t find <span className="font-semibold text-gray-700">&ldquo;{debouncedSearch}&rdquo;</span>? Add it to the database.</>
                  : 'Met a startup that isn\u2019t here yet? Add it to the database.'}
              </p>
              <button
                onClick={() => setShowAdd(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-500 text-dark-950 font-semibold text-sm rounded-lg hover:bg-primary-400"
              >
                <Plus size={15} /> Add this startup
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
            {startups.map(startup => {
              // Phase 92.2 (T21) - imported-unclaimed rows from csv_import_s39
              // have NULL user_id. Pre-92.2 fallback to startup_profiles.id
              // collided with other startups' user_id (id=7 -> 01Games demo etc).
              // Fix: navigate by user_id ONLY. Disable click on unclaimed rows.
              const isClaimable = !!startup.user_id;
              return (
                <StartupCard
                  key={startup.id}
                  startup={startup}
                  watchlisted={watchlist.includes(startup.id)}
                  onWatchlist={toggleWatchlist}
                  isClaimable={isClaimable}
                  onClick={isClaimable
                    ? () => navigate(`/dashboard/startup-profile/${startup.user_id}?by=user_id`)
                    : null}
                />
              );
            })}
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

          {canAdd && (
            <div className="mt-10 flex flex-col items-center gap-2 border-t border-gray-100 pt-6">
              <p className="text-sm text-gray-500">
                Can&apos;t find the startup you&apos;re looking for? Add it to the database.
              </p>
              <button
                onClick={() => setShowAdd(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-500 text-dark-950 font-semibold text-sm rounded-lg hover:bg-primary-400"
              >
                <Plus size={15} /> Add a startup
              </button>
            </div>
          )}
        </>
      )}

      <AddStartupModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onAdded={() => fetchStartups()}
        initialName={startups.length === 0 ? (debouncedSearch || '') : ''}
      />
    </div>
  );
}
