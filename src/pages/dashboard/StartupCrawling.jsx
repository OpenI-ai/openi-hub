import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Globe, RefreshCw, Play, Pause, CheckCircle2, XCircle, Clock, Search, ExternalLink, Eye, ThumbsUp, ThumbsDown,
  Database, Activity, ChevronLeft, ChevronRight,
  Zap, Loader2, Calendar
} from 'lucide-react';
import { crawlAPI, directoryCrawlAPI } from '../../services/api';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import PipelineHealth from '../../components/PipelineHealth';

function StatCard({ label, value, sub, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={18} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-display font-bold text-gray-900">{typeof value === 'number' ? value.toLocaleString() : value}</p>
        <p className="text-sm text-gray-500">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function StatusBadge({ status, config }) {
  const c = config[status] || { label: status, color: 'bg-gray-100 text-gray-600' };
  return <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${c.color || c.bg + ' ' + c.textColor}`}>{c.label}</span>;
}

const ENRICH_STATUS = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'Approved', color: 'bg-accent-100 text-accent-700' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700' },
  error: { label: 'Error', color: 'bg-gray-100 text-gray-600' },
};

const JOB_STATUS = {
  completed: { label: 'Completed', color: 'bg-accent-50 text-accent-600', icon: CheckCircle2 },
  running: { label: 'Running', color: 'bg-blue-50 text-blue-600', icon: Activity },
  queued: { label: 'Queued', color: 'bg-gray-50 text-gray-500', icon: Clock },
  failed: { label: 'Failed', color: 'bg-red-50 text-red-600', icon: XCircle },
};

// ── Phase 51: Directory Crawlers tab ──────────────────────────
// Lets admins trigger directory-source crawlers (YC today, more to come)
// and view run history + auto-approve promoted rows.
function DirectoriesTab() {
  const [stats, setStats] = useState({ sources: [] });
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [approving, setApproving] = useState('');

  const load = useCallback(async () => {
    try {
      const [s, r] = await Promise.all([
        directoryCrawlAPI.stats(),
        directoryCrawlAPI.listRuns({ limit: 20 }),
      ]);
      setStats(s || { sources: [] });
      setRuns(r?.runs || []);
    } catch (err) {
      toast.error('Failed to load directory crawl data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh every 30s while any run is active. Skips when the tab is
  // hidden so background tabs don't hammer the API. s43 — bumped from 10s
  // because each refresh fan-outs to several crawl endpoints; with 583K
  // startup_profiles the cumulative cost is non-trivial.
  useEffect(() => {
    const active = runs.some(r => r.status === 'running');
    if (!active) return;
    const tick = () => { if (!document.hidden) load(); };
    const t = setInterval(tick, 30000);
    return () => clearInterval(t);
  }, [runs, load]);

  const startYC = async (limit = null) => {
    if (starting) return;
    setStarting(true);
    try {
      const body = limit ? { limit } : {};
      const r = await directoryCrawlAPI.runYC(body);
      toast.success(`YC crawl started — run #${r.run?.id}`);
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to start crawl');
    } finally {
      setStarting(false);
    }
  };

  const autoApprove = async (source) => {
    if (approving) return;
    setApproving(source);
    try {
      const r = await directoryCrawlAPI.autoApprove(source, 500);
      toast.success(`${source}: ${r.approved} promoted, ${r.skipped} skipped`);
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Approve failed');
    } finally {
      setApproving('');
    }
  };

  if (loading) return <LoadingSkeleton type="card" />;

  return (
    <div className="space-y-6">
      {/* Overview banner */}
      <div className="bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <Database size={20} className="text-primary-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-display font-bold text-gray-900 text-sm mb-1">Phase 51 — Directory Crawlers</h3>
            <p className="text-xs text-gray-600">
              Ingests startup data from structured public directories (not RSS news feeds).
              YC Companies API gives ~5,850 high-quality startups. Runs write to crawled_startups
              with confidence 0.85 and can be bulk auto-approved into startup_profiles.
            </p>
          </div>
        </div>
      </div>

      {/* Source cards */}
      <div>
        <h3 className="font-display font-bold text-gray-800 text-sm mb-3">Sources</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* YC card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-display font-bold text-gray-900 text-base">Y Combinator</div>
                <p className="text-xs text-gray-500 mt-0.5">~5,850 companies · JSON API · polite 1s/page</p>
              </div>
              <span className="px-2 py-0.5 text-xs rounded-full bg-accent-100 text-accent-700 font-semibold">Live</span>
            </div>
            {(() => {
              const ycStats = stats.sources?.find(s => s.source === 'yc');
              return ycStats ? (
                <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
                  <div><div className="font-bold text-lg text-gray-900">{Number(ycStats.total_inserted).toLocaleString()}</div><div className="text-gray-500">Inserted</div></div>
                  <div><div className="font-bold text-lg text-gray-900">{Number(ycStats.pending_review).toLocaleString()}</div><div className="text-gray-500">Pending</div></div>
                  <div><div className="font-bold text-lg text-gray-900">{Number(ycStats.promoted).toLocaleString()}</div><div className="text-gray-500">Promoted</div></div>
                </div>
              ) : (
                <p className="text-xs text-gray-400 mb-4">No crawls yet.</p>
              );
            })()}
            <div className="flex flex-wrap gap-2">
              <button onClick={() => startYC(25)} disabled={starting}
                className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg font-medium disabled:opacity-50">
                Test (25)
              </button>
              <button onClick={() => startYC(null)} disabled={starting}
                className="px-3 py-1.5 text-xs bg-primary-500 text-dark-950 hover:bg-primary-400 rounded-lg font-semibold disabled:opacity-50 flex items-center gap-1">
                {starting ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                {starting ? 'Starting...' : 'Run full crawl (~5,850)'}
              </button>
              <button onClick={() => autoApprove('yc')} disabled={approving === 'yc'}
                className="px-3 py-1.5 text-xs bg-accent-500 text-white hover:bg-accent-600 rounded-lg font-semibold disabled:opacity-50 flex items-center gap-1">
                {approving === 'yc' ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                Auto-approve 500
              </button>
            </div>
          </div>

          {/* Placeholder cards for future sources */}
          {['Top 250 Accelerators', 'Top 250 VC Portfolios', 'Startup India DPIIT'].map(name => (
            <div key={name} className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-5 opacity-60">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-display font-bold text-gray-700 text-base">{name}</div>
                  <p className="text-xs text-gray-400 mt-0.5">Coming after 550K dataset arrives</p>
                </div>
                <span className="px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-600 font-semibold">Pending</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent runs table */}
      <div>
        <h3 className="font-display font-bold text-gray-800 text-sm mb-3">Recent Runs</h3>
        {runs.length === 0 ? (
          <div className="text-sm text-gray-400 bg-white border border-gray-200 rounded-xl p-6 text-center">
            No crawl runs yet. Click "Run full crawl" above to start.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="text-left px-4 py-2">#</th>
                  <th className="text-left px-4 py-2">Source</th>
                  <th className="text-left px-4 py-2">Status</th>
                  <th className="text-right px-4 py-2">Fetched</th>
                  <th className="text-right px-4 py-2">Inserted</th>
                  <th className="text-right px-4 py-2">Duplicates</th>
                  <th className="text-right px-4 py-2">Errors</th>
                  <th className="text-right px-4 py-2">Duration</th>
                  <th className="text-left px-4 py-2">Started</th>
                </tr>
              </thead>
              <tbody>
                {runs.map(r => (
                  <tr key={r.id} className="border-t border-gray-100">
                    <td className="px-4 py-2 font-mono text-xs text-gray-500">{r.id}</td>
                    <td className="px-4 py-2 font-semibold">{r.source}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        r.status === 'completed' ? 'bg-accent-100 text-accent-700' :
                        r.status === 'running'   ? 'bg-blue-100 text-blue-700 animate-pulse' :
                        r.status === 'failed'    ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>{r.status}</span>
                    </td>
                    <td className="px-4 py-2 text-right">{Number(r.items_fetched || 0).toLocaleString()}</td>
                    <td className="px-4 py-2 text-right font-semibold">{Number(r.items_inserted || 0).toLocaleString()}</td>
                    <td className="px-4 py-2 text-right text-gray-500">{Number(r.duplicates || 0).toLocaleString()}</td>
                    <td className="px-4 py-2 text-right text-red-600">{Number(r.errors || 0).toLocaleString()}</td>
                    <td className="px-4 py-2 text-right text-xs text-gray-500">{r.duration_sec ? `${r.duration_sec}s` : '—'}</td>
                    <td className="px-4 py-2 text-xs text-gray-500">{new Date(r.started_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function StartupCrawling() {
  const [activeTab, setActiveTab] = useState('health');
  const [loading, setLoading] = useState(true);

  // Stats
  const [stats, setStats] = useState({ total_indexed: 0, imported_total: 0, pending_review: 0, active_sources: 0, total_sources: 0 });

  // Enrichment queue
  const [enrichItems, setEnrichItems] = useState([]);
  const [enrichTotal, setEnrichTotal] = useState(0);
  const [enrichStats, setEnrichStats] = useState({ pending: 0, approved: 0, rejected: 0, errors: 0, total: 0 });
  const [enrichPage, setEnrichPage] = useState(1);
  const [enrichSearch, setEnrichSearch] = useState('');
  const [enrichFilter, setEnrichFilter] = useState('all');
  const [batchRunning, setBatchRunning] = useState(false);
  const [enrichSelectedIds, setEnrichSelectedIds] = useState(() => new Set());
  const [enrichBulkBusy, setEnrichBulkBusy] = useState(false);

  // Imported
  const [importedData, setImportedData] = useState({ startups: [], total: 0, countries: [], sectors: [] });
  const [importSearch, setImportSearch] = useState('');
  const [importCountry, setImportCountry] = useState('');
  const [importSector, setImportSector] = useState('');
  const [importPage, setImportPage] = useState(1);
  const [importLoading, setImportLoading] = useState(false);

  // Jobs
  const [jobs, setJobs] = useState([]);

  // Schedules
  const [schedules, setSchedules] = useState([]);

  // Discovered (crawled_startups)
  const [crawledStartups, setCrawledStartups] = useState([]);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [confidenceFilter, setConfidenceFilter] = useState(0);
  const [statusFilter, setStatusFilter] = useState('pending_review');
  const [bulkBusy, setBulkBusy] = useState(false);

  // ── Fetch ─────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      const [s, es] = await Promise.all([crawlAPI.stats(), crawlAPI.enrichmentStats()]);
      setStats(s);
      setEnrichStats(es);
    } catch (_e) { /* non-fatal */ }
  }, []);

  const fetchEnrichment = useCallback(async () => {
    try {
      const params = { page: enrichPage, limit: 20 };
      if (enrichSearch) params.search = enrichSearch;
      if (enrichFilter !== 'all') params.status = enrichFilter;
      const data = await crawlAPI.listEnrichment(params);
      setEnrichItems(data.items || []);
      setEnrichTotal(data.total || 0);
    } catch (_e) { /* non-fatal */ }
  }, [enrichPage, enrichSearch, enrichFilter]);

  const fetchImported = useCallback(async () => {
    setImportLoading(true);
    try {
      const params = { page: importPage, limit: 50 };
      if (importSearch) params.search = importSearch;
      if (importCountry) params.country = importCountry;
      if (importSector) params.sector = importSector;
      const data = await crawlAPI.listImported(params);
      setImportedData(data);
    } catch (_e) { /* non-fatal */ } finally { setImportLoading(false); }
  }, [importPage, importSearch, importCountry, importSector]);

  const fetchJobs = useCallback(async () => {
    try {
      const [j, cs] = await Promise.all([crawlAPI.listJobs(), crawlAPI.listStartups()]);
      setJobs(j || []);
      setCrawledStartups(cs || []);
    } catch (_e) { /* non-fatal */ }
  }, []);

  const fetchSchedules = useCallback(async () => {
    try { const s = await crawlAPI.listSchedules(); setSchedules(s || []); } catch (_e) { /* non-fatal */ }
  }, []);

  // s48 progressive render — flip `loading` off as soon as the FAST path
  // (fetchStats) returns; lists fade in independently when they arrive.
  // Was: Promise.all blocked the whole page on the slowest call (~1s).
  useEffect(() => {
    fetchStats().finally(() => setLoading(false));
    fetchEnrichment();
    fetchJobs();
    fetchSchedules();
  }, []);

  useEffect(() => { if (activeTab === 'enrichment') fetchEnrichment(); }, [activeTab, fetchEnrichment]);
  useEffect(() => { if (activeTab === 'imported') fetchImported(); }, [activeTab, fetchImported]);
  useEffect(() => { if (activeTab === 'discovered') fetchJobs(); }, [activeTab, fetchJobs]);

  // ── Handlers ──────────────────────────────────────────────
  const handleBatchEnrich = async () => {
    setBatchRunning(true);
    try {
      const r = await crawlAPI.batchEnrich();
      toast.success(`Batch enrichment started — ${r.profile_count} profiles queued`);
      setTimeout(() => { fetchStats(); fetchEnrichment(); fetchJobs(); }, 5000);
    } catch (err) { toast.error(err.message); }
    finally { setBatchRunning(false); }
  };

  const handleApproveEnrich = async (id) => {
    try {
      await crawlAPI.approveEnrichment(id);
      toast.success('Enrichment approved & applied');
      fetchEnrichment(); fetchStats();
    } catch (err) { toast.error(err.message); }
  };

  const handleRejectEnrich = async (id) => {
    try {
      await crawlAPI.rejectEnrichment(id);
      toast.success('Enrichment rejected');
      fetchEnrichment(); fetchStats();
    } catch (err) { toast.error(err.message); }
  };

  // ── Bulk handlers for Enrichment Queue ───────────────────────
  const toggleEnrichSelected = (id) => {
    setEnrichSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const selectAllEnrichFiltered = (list) => setEnrichSelectedIds(new Set(list.map(i => i.id)));
  const clearEnrichSelection = () => setEnrichSelectedIds(new Set());

  const handleBulkApproveEnrich = async () => {
    if (enrichSelectedIds.size === 0) return;
    if (!confirm(`Apply enrichment to ${enrichSelectedIds.size} selected profile${enrichSelectedIds.size > 1 ? 's' : ''}? All available scraped fields will be applied to each.`)) return;
    setEnrichBulkBusy(true);
    try {
      const r = await crawlAPI.approveEnrichmentBatch({ ids: Array.from(enrichSelectedIds) });
      toast.success(`Applied: ${r.applied} applied, ${r.skipped} skipped, ${r.errors} errors`);
      clearEnrichSelection();
      fetchEnrichment(); fetchStats();
    } catch (err) { toast.error(err.message); }
    finally { setEnrichBulkBusy(false); }
  };

  const handleBulkRejectEnrich = async () => {
    if (enrichSelectedIds.size === 0) return;
    if (!confirm(`Reject ${enrichSelectedIds.size} selected enrichments?`)) return;
    setEnrichBulkBusy(true);
    try {
      const r = await crawlAPI.rejectEnrichmentBatch(Array.from(enrichSelectedIds), 'bulk rejection');
      toast.success(`Rejected ${r.rejected} enrichments`);
      clearEnrichSelection();
      fetchEnrichment(); fetchStats();
    } catch (err) { toast.error(err.message); }
    finally { setEnrichBulkBusy(false); }
  };

  const handleAutoApplyEnrich = async () => {
    const input = prompt('Auto-apply all pending enrichments that have at least N scraped fields. Enter N (1-5):', '2');
    const minFields = parseInt(input || '', 10);
    if (!minFields || minFields < 1 || minFields > 5) return;
    if (!confirm(`Auto-apply ALL pending enrichments with ≥ ${minFields} scraped fields? This cannot be easily undone.`)) return;
    setEnrichBulkBusy(true);
    try {
      const r = await crawlAPI.approveEnrichmentBatch({ auto_min_fields: minFields });
      toast.success(`Auto-applied: ${r.applied} applied, ${r.skipped} skipped, ${r.errors} errors (of ${r.total})`);
      clearEnrichSelection();
      fetchEnrichment(); fetchStats();
    } catch (err) { toast.error(err.message); }
    finally { setEnrichBulkBusy(false); }
  };

  const handleToggleSchedule = async (id) => {
    try {
      const updated = await crawlAPI.toggleSchedule(id);
      setSchedules(prev => prev.map(s => s.id === id ? updated : s));
      toast.success(updated.is_enabled ? 'Schedule enabled' : 'Schedule paused');
    } catch (err) { toast.error(err.message); }
  };

  const handleRunScheduleNow = async (id, name) => {
    try {
      await crawlAPI.runSchedule(id);
      toast.success(`Triggered "${name}" — running in background`);
      setTimeout(() => { fetchJobs(); fetchSchedules(); }, 5000);
    } catch (err) { toast.error(err.message); }
  };

  // ── Bulk approve / reject on Discovered tab ────────────────
  const toggleSelected = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAllFiltered = (list) => {
    setSelectedIds(new Set(list.map(s => s.id)));
  };
  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Approve ${selectedIds.size} selected startups? This will promote each to startup_profiles.`)) return;
    setBulkBusy(true);
    try {
      const r = await crawlAPI.approveBatch({ ids: Array.from(selectedIds) });
      toast.success(`Approved: ${r.promoted} promoted, ${r.skipped} already existed, ${r.errors} errors`);
      clearSelection();
      fetchJobs(); fetchStats();
    } catch (err) { toast.error(err.message); }
    finally { setBulkBusy(false); }
  };

  const handleBulkReject = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Reject ${selectedIds.size} selected startups?`)) return;
    setBulkBusy(true);
    try {
      const r = await crawlAPI.rejectBatch(Array.from(selectedIds), 'bulk rejection');
      toast.success(`Rejected ${r.rejected} startups`);
      clearSelection();
      fetchJobs(); fetchStats();
    } catch (err) { toast.error(err.message); }
    finally { setBulkBusy(false); }
  };

  const handleAutoApprove = async () => {
    const threshold = parseFloat(prompt('Auto-approve all pending startups with AI confidence ≥', '0.8'));
    if (!threshold || threshold < 0 || threshold > 1) return;
    if (!confirm(`Auto-approve ALL pending startups with confidence ≥ ${threshold}? This cannot be easily undone.`)) return;
    setBulkBusy(true);
    try {
      const r = await crawlAPI.approveBatch({ auto_confidence_min: threshold });
      toast.success(`Auto-approved: ${r.promoted} promoted, ${r.skipped} already existed, ${r.errors} errors (of ${r.total} candidates)`);
      clearSelection();
      fetchJobs(); fetchStats();
    } catch (err) { toast.error(err.message); }
    finally { setBulkBusy(false); }
  };

  // ── Tab config ────────────────────────────────────────────
  const tabs = [
    { id: 'health', label: 'Pipeline Health', count: 0 },
    { id: 'enrichment', label: 'Pending Review', count: enrichStats.pending || 0 },
    { id: 'imported', label: 'Imported Startups', count: stats.imported_total || 0 },
    { id: 'discovered', label: 'Discovered', count: crawledStartups.length },
    { id: 'directories', label: 'Directories (Phase 51)', count: 0 },
    { id: 'jobs', label: 'Jobs & Schedules', count: jobs.length },
  ];

  if (loading) return <LoadingSkeleton type="card" />;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div id="tour-page-crawling" className="px-6 py-5 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Globe size={20} className="text-primary-500" />
              <h1 className="text-xl font-display font-bold text-gray-900">Startup Crawling & Enrichment</h1>
            </div>
            <p className="text-sm text-gray-500">Discover, enrich, and manage startup data from public sources</p>
          </div>
          <button onClick={handleBatchEnrich} disabled={batchRunning}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-dark-950 rounded-xl text-sm font-semibold hover:bg-primary-400 transition-colors disabled:opacity-50">
            {batchRunning ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />}
            {batchRunning ? 'Enriching...' : 'Enrich Missing Data'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Startups" value={stats.imported_total || 0} sub="In startup_profiles" icon={Database} color="bg-primary-500" />
          <StatCard label="Pending Admin Review" value={enrichStats.pending || 0} sub={`${enrichStats.approved || 0} approved · ${enrichStats.rejected || 0} rejected · awaiting human decision`} icon={Zap} color="bg-yellow-400" />
          <StatCard label="Pending Review" value={stats.pending_review || 0} sub={`${(stats.approved || 0).toLocaleString()} approved`} icon={Eye} color="bg-blue-500" />
          <StatCard label="Schedules" value={schedules.filter(s => s.is_enabled).length} sub={`${schedules.length} total configured`} icon={Calendar} color="bg-indigo-500" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {tab.label}
              {tab.count > 0 && <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === tab.id ? 'bg-primary-100 text-primary-700' : 'bg-gray-200 text-gray-600'}`}>{tab.count.toLocaleString()}</span>}
            </button>
          ))}
        </div>

        {/* ═══ ENRICHMENT TAB ═══ */}
        {activeTab === 'enrichment' && (() => {
          const pendingEnrichItems = enrichItems.filter(i => i.status === 'pending');
          const allPendingSelected = pendingEnrichItems.length > 0 && pendingEnrichItems.every(i => enrichSelectedIds.has(i.id));
          return (
          <div>
            <div className="flex gap-3 mb-4 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={enrichSearch} onChange={e => { setEnrichSearch(e.target.value); setEnrichPage(1); clearEnrichSelection(); }}
                  placeholder="Search by domain or company name..." className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400" />
              </div>
              <select value={enrichFilter} onChange={e => { setEnrichFilter(e.target.value); setEnrichPage(1); clearEnrichSelection(); }}
                className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white">
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="error">Error</option>
              </select>
              <button onClick={handleAutoApplyEnrich}
                disabled={enrichBulkBusy}
                className="px-3 py-2.5 bg-accent-50 text-accent-700 border border-accent-200 rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center gap-2">
                <Zap size={13} /> Auto-apply good-quality
              </button>
            </div>

            {/* Selection bar */}
            {enrichSelectedIds.size > 0 && (
              <div className="bg-primary-50 border border-primary-200 rounded-xl p-3 mb-3 flex items-center gap-3 sticky top-4 z-10 shadow-sm">
                <span className="text-sm font-semibold text-primary-800">{enrichSelectedIds.size} selected</span>
                <button onClick={clearEnrichSelection} className="text-xs text-gray-500 hover:text-gray-800 underline">Clear</button>
                <div className="ml-auto flex gap-2">
                  <button
                    onClick={handleBulkApproveEnrich}
                    disabled={enrichBulkBusy}
                    className="px-3 py-1.5 bg-accent-600 text-white rounded-lg text-xs font-semibold hover:bg-accent-700 disabled:opacity-50 flex items-center gap-1">
                    {enrichBulkBusy ? <Loader2 size={12} className="animate-spin" /> : <ThumbsUp size={12} />}
                    Apply {enrichSelectedIds.size}
                  </button>
                  <button
                    onClick={handleBulkRejectEnrich}
                    disabled={enrichBulkBusy}
                    className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600 disabled:opacity-50 flex items-center gap-1">
                    <ThumbsDown size={12} /> Reject {enrichSelectedIds.size}
                  </button>
                </div>
              </div>
            )}

            {enrichItems.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Zap size={40} className="mx-auto mb-3 text-gray-200" />
                <p className="font-semibold text-gray-500">No enrichment items</p>
                <p className="text-sm mt-1">Click "Enrich Missing Data" to start scraping incomplete profiles</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingEnrichItems.length > 0 && (
                  <label className="flex items-center gap-2 text-xs text-gray-500 ml-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={allPendingSelected}
                      onChange={() => allPendingSelected ? clearEnrichSelection() : selectAllEnrichFiltered(pendingEnrichItems)}
                      className="rounded border-gray-300"
                    />
                    {allPendingSelected ? 'Deselect all pending' : `Select all ${pendingEnrichItems.length} pending`}
                  </label>
                )}
                {enrichItems.map(item => {
                  const isSelected = enrichSelectedIds.has(item.id);
                  return (
                  <div key={item.id}
                    onClick={() => item.status === 'pending' && toggleEnrichSelected(item.id)}
                    className={`bg-white rounded-xl border p-4 transition-colors ${
                      isSelected ? 'border-primary-400 bg-primary-50/30' : 'border-gray-200 hover:border-gray-300'
                    } ${item.status === 'pending' ? 'cursor-pointer' : ''}`}>
                    <div className="flex items-start justify-between gap-3">
                      {item.status === 'pending' && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleEnrichSelected(item.id)}
                          onClick={e => e.stopPropagation()}
                          className="mt-1 rounded border-gray-300 flex-shrink-0"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-800 text-sm">{item.company_name || item.target_domain || 'Unknown'}</span>
                          <StatusBadge status={item.status} config={ENRICH_STATUS} />
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-400 mb-2">
                          {item.target_domain && <span className="flex items-center gap-1"><Globe size={10} /> {item.target_domain}</span>}
                          {item.source_url && <a href={item.source_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary-500 hover:underline"><ExternalLink size={10} /> Source</a>}
                        </div>

                        {/* Scraped data preview */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {item.scraped_description && (
                            <div className="col-span-2 p-2 bg-green-50 rounded-lg">
                              <span className="font-semibold text-green-700">Description: </span>
                              <span className="text-green-800">{item.scraped_description.substring(0, 150)}...</span>
                            </div>
                          )}
                          {item.scraped_founded && (
                            <div className="p-2 bg-blue-50 rounded-lg">
                              <span className="font-semibold text-blue-700">Founded: </span>
                              <span className="text-blue-800">{item.scraped_founded}</span>
                            </div>
                          )}
                          {item.scraped_social && Object.keys(typeof item.scraped_social === 'string' ? JSON.parse(item.scraped_social) : item.scraped_social).length > 0 && (
                            <div className="p-2 bg-purple-50 rounded-lg">
                              <span className="font-semibold text-purple-700">Social: </span>
                              <span className="text-purple-800">{Object.keys(typeof item.scraped_social === 'string' ? JSON.parse(item.scraped_social) : item.scraped_social).join(', ')}</span>
                            </div>
                          )}
                          {item.scraped_logo_url && (
                            <div className="p-2 bg-orange-50 rounded-lg flex items-center gap-2">
                              <img src={item.scraped_logo_url} alt="" className="w-5 h-5 rounded" />
                              <span className="font-semibold text-orange-700">Logo found</span>
                            </div>
                          )}
                          {item.error_message && (
                            <div className="col-span-2 p-2 bg-red-50 rounded-lg">
                              <span className="font-semibold text-red-700">Error: </span>
                              <span className="text-red-600">{item.error_message}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      {item.status === 'pending' && (
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          <button onClick={(e) => { e.stopPropagation(); handleApproveEnrich(item.id); }}
                            className="flex items-center gap-1 px-3 py-1.5 bg-accent-50 text-accent-700 border border-accent-200 rounded-lg text-xs font-semibold hover:bg-accent-100">
                            <ThumbsUp size={12} /> Apply
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleRejectEnrich(item.id); }}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-semibold hover:bg-red-100">
                            <ThumbsDown size={12} /> Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {enrichTotal > 20 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button onClick={() => setEnrichPage(p => Math.max(1, p - 1))} disabled={enrichPage === 1}
                  className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40">
                  <ChevronLeft size={14} /> Prev
                </button>
                <span className="text-sm text-gray-500">Page {enrichPage} of {Math.ceil(enrichTotal / 20)}</span>
                <button onClick={() => setEnrichPage(p => p + 1)} disabled={enrichPage >= Math.ceil(enrichTotal / 20)}
                  className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40">
                  Next <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
          );
        })()}

        {/* ═══ IMPORTED TAB ═══ */}
        {activeTab === 'imported' && (
          <div>
            {/* Country/Sector breakdowns */}
            {importedData.countries?.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">By Country</p>
                <div className="flex flex-wrap gap-1.5">
                  {importedData.countries?.slice(0, 10).map(c => (
                    <button key={c.country} onClick={() => { setImportCountry(importCountry === c.country ? '' : c.country); setImportPage(1); }}
                      className={`px-2.5 py-1 text-xs rounded-full border transition-all ${importCountry === c.country ? 'bg-primary-500 text-dark-950 border-primary-500' : 'bg-white border-gray-200 text-gray-600 hover:border-primary-300'}`}>
                      {c.country} ({c.count})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {importedData.sectors?.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">By Sector</p>
                <div className="flex flex-wrap gap-1.5">
                  {importedData.sectors?.slice(0, 10).map(s => (
                    <button key={s.sector} onClick={() => { setImportSector(importSector === s.sector ? '' : s.sector); setImportPage(1); }}
                      className={`px-2.5 py-1 text-xs rounded-full border transition-all ${importSector === s.sector ? 'bg-primary-500 text-dark-950 border-primary-500' : 'bg-white border-gray-200 text-gray-600 hover:border-primary-300'}`}>
                      {s.sector} ({s.count})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Search */}
            <div className="flex gap-3 mb-4">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={importSearch} onChange={e => { setImportSearch(e.target.value); setImportPage(1); }}
                  placeholder="Search imported startups..." className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400" />
              </div>
            </div>

            <p className="text-sm text-gray-500 mb-3">
              <span className="font-semibold text-gray-700">{(importedData.total || 0).toLocaleString()}</span> imported startups
              {(importCountry || importSector) && <span> filtered by {[importCountry, importSector].filter(Boolean).join(' + ')}</span>}
            </p>

            {importLoading ? <LoadingSkeleton type="card" /> : (
              <>
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
                        <th className="px-4 py-3">Company</th>
                        <th className="px-4 py-3">Sector</th>
                        <th className="px-4 py-3">Location</th>
                        <th className="px-4 py-3">Stage</th>
                        <th className="px-4 py-3">Founded</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(importedData.startups || []).map(s => (
                        <tr key={s.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {s.logo_url ? <img src={s.logo_url} alt="" className="w-7 h-7 rounded-lg object-cover" /> :
                                <div className="w-7 h-7 bg-primary-100 rounded-lg flex items-center justify-center text-primary-700 text-xs font-bold">
                                  {(s.company_name || '').charAt(0)}
                                </div>}
                              <span className="font-medium text-gray-800">{s.company_name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{s.sector || '-'}</td>
                          <td className="px-4 py-3 text-gray-500">{[s.city, s.country].filter(Boolean).join(', ') || '-'}</td>
                          <td className="px-4 py-3"><span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">{s.stage || '-'}</span></td>
                          <td className="px-4 py-3 text-gray-500">{s.founded_year || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {importedData.total > 50 && (
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <button onClick={() => setImportPage(p => Math.max(1, p - 1))} disabled={importPage === 1}
                      className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40">
                      <ChevronLeft size={14} /> Prev
                    </button>
                    <span className="text-sm text-gray-500">Page {importPage} of {Math.ceil(importedData.total / 50)}</span>
                    <button onClick={() => setImportPage(p => p + 1)} disabled={importPage >= Math.ceil(importedData.total / 50)}
                      className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40">
                      Next <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ═══ DISCOVERED TAB ═══ */}
        {activeTab === 'discovered' && (() => {
          const filtered = crawledStartups.filter(s =>
            (statusFilter === 'all' || s.status === statusFilter) &&
            (Number(s.ai_confidence || 0) >= confidenceFilter)
          );
          const allSelectedOnPage = filtered.length > 0 && filtered.every(s => selectedIds.has(s.id));
          return (
            <div>
              {/* Filter bar */}
              <div className="bg-white rounded-xl border border-gray-200 p-3 mb-3 flex items-center gap-3 flex-wrap">
                <select
                  value={statusFilter}
                  onChange={e => { setStatusFilter(e.target.value); clearSelection(); }}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg"
                >
                  <option value="pending_review">Pending review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="all">All</option>
                </select>
                <label className="text-sm text-gray-600 flex items-center gap-2">
                  Min confidence:
                  <input
                    type="range" min="0" max="1" step="0.05"
                    value={confidenceFilter}
                    onChange={e => setConfidenceFilter(parseFloat(e.target.value))}
                    className="w-32"
                  />
                  <span className="font-mono text-xs w-8">{confidenceFilter.toFixed(2)}</span>
                </label>
                <span className="text-sm text-gray-500 ml-auto">{filtered.length} matching{statusFilter === 'pending_review' ? ' pending' : ''}</span>
                <button
                  onClick={handleAutoApprove}
                  disabled={bulkBusy}
                  className="px-3 py-1.5 bg-accent-50 text-accent-700 border border-accent-200 rounded-lg text-xs font-semibold disabled:opacity-50"
                >
                  <Zap size={12} className="inline mr-1" /> Auto-approve high confidence
                </button>
              </div>

              {/* Selection bar (sticky) */}
              {selectedIds.size > 0 && (
                <div className="bg-primary-50 border border-primary-200 rounded-xl p-3 mb-3 flex items-center gap-3 sticky top-4 z-10 shadow-sm">
                  <span className="text-sm font-semibold text-primary-800">{selectedIds.size} selected</span>
                  <button onClick={clearSelection} className="text-xs text-gray-500 hover:text-gray-800 underline">Clear</button>
                  <div className="ml-auto flex gap-2">
                    <button
                      onClick={handleBulkApprove}
                      disabled={bulkBusy}
                      className="px-3 py-1.5 bg-accent-600 text-white rounded-lg text-xs font-semibold hover:bg-accent-700 disabled:opacity-50 flex items-center gap-1"
                    >
                      {bulkBusy ? <Loader2 size={12} className="animate-spin" /> : <ThumbsUp size={12} />}
                      Approve {selectedIds.size}
                    </button>
                    <button
                      onClick={handleBulkReject}
                      disabled={bulkBusy}
                      className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600 disabled:opacity-50 flex items-center gap-1"
                    >
                      <ThumbsDown size={12} /> Reject {selectedIds.size}
                    </button>
                  </div>
                </div>
              )}

              {filtered.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <Globe size={40} className="mx-auto mb-3 text-gray-200" />
                  <p className="font-semibold text-gray-500">
                    {crawledStartups.length === 0 ? 'No discovered startups yet' : 'No startups match your filters'}
                  </p>
                  <p className="text-sm mt-1">
                    {crawledStartups.length === 0
                      ? 'Startups found via RSS feeds and user requests will appear here'
                      : 'Try lowering the confidence threshold or changing the status filter'}
                  </p>
                </div>
              ) : (
                <>
                  {/* Select-all row */}
                  <label className="flex items-center gap-2 text-xs text-gray-500 mb-2 ml-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={allSelectedOnPage}
                      onChange={() => allSelectedOnPage ? clearSelection() : selectAllFiltered(filtered)}
                      className="rounded border-gray-300"
                    />
                    {allSelectedOnPage ? 'Deselect all' : `Select all ${filtered.length}`}
                  </label>
                  <div className="space-y-2">
                    {filtered.map(s => {
                      const isSelected = selectedIds.has(s.id);
                      const conf = Number(s.ai_confidence || 0);
                      return (
                        <div
                          key={s.id}
                          onClick={() => s.status === 'pending_review' && toggleSelected(s.id)}
                          className={`bg-white rounded-xl border p-4 flex items-start gap-3 transition-colors ${
                            isSelected ? 'border-primary-400 bg-primary-50/30' : 'border-gray-200 hover:border-gray-300'
                          } ${s.status === 'pending_review' ? 'cursor-pointer' : ''}`}
                        >
                          {s.status === 'pending_review' && (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelected(s.id)}
                              onClick={e => e.stopPropagation()}
                              className="mt-1 rounded border-gray-300 flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-semibold text-gray-800">{s.name}</span>
                              <span className={`px-2 py-0.5 text-xs rounded-full ${s.status === 'approved' ? 'bg-accent-100 text-accent-700' : s.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{s.status}</span>
                              {conf > 0 && (
                                <span className={`px-2 py-0.5 text-xs rounded-full font-mono ${conf >= 0.8 ? 'bg-accent-50 text-accent-700' : conf >= 0.5 ? 'bg-yellow-50 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
                                  conf {conf.toFixed(2)}
                                </span>
                              )}
                              {s.deeptech && <span className="px-2 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-700 font-semibold">DEEPTECH</span>}
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-2">{s.ai_description || s.description || 'No description'}</p>
                            <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400 flex-wrap">
                              {s.ai_sector && <span className="text-gray-600">{s.ai_sector}</span>}
                              {s.ai_stage && <span>· {s.ai_stage}</span>}
                              {s.funding_amount && <span className="text-accent-700 font-semibold">· {(Number(s.funding_amount) / 1e6).toFixed(1)}M {s.funding_currency}</span>}
                              {s.country && <span>· {s.country}</span>}
                              {s.source && <span>· via {s.source}</span>}
                              {s.website && <a href={s.website} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="text-primary-500"><ExternalLink size={10} /></a>}
                            </div>
                          </div>
                          {s.status === 'pending_review' && (
                            <div className="flex gap-2 flex-shrink-0">
                              <button onClick={async (e) => { e.stopPropagation(); try { await crawlAPI.approveStartup(s.id); toast.success('Approved'); fetchJobs(); } catch(err) { toast.error(err.message); } }}
                                className="px-3 py-1.5 bg-accent-50 text-accent-700 border border-accent-200 rounded-lg text-xs font-semibold hover:bg-accent-100">Approve</button>
                              <button onClick={async (e) => { e.stopPropagation(); try { await crawlAPI.rejectStartup(s.id); toast.success('Rejected'); fetchJobs(); } catch(err) { toast.error(err.message); } }}
                                className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-semibold hover:bg-red-100">Reject</button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          );
        })()}

        {/* ═══ PIPELINE HEALTH TAB — PHASE 58 ═══ */}
        {activeTab === 'health' && <PipelineHealth />}

        {/* ═══ DIRECTORIES TAB — PHASE 51 ═══ */}
        {activeTab === 'directories' && <DirectoriesTab />}

        {/* ═══ JOBS & SCHEDULES TAB ═══ */}
        {activeTab === 'jobs' && (
          <div>
            {/* Schedules section */}
            <div className="mb-6">
              <h3 className="font-display font-bold text-gray-800 text-sm mb-3 flex items-center gap-2"><Calendar size={14} /> Auto-Crawl Schedules</h3>
              {schedules.length === 0 ? (
                <p className="text-sm text-gray-400">No schedules configured.</p>
              ) : (
                <div className="space-y-2">
                  {schedules.map(s => (
                    <div key={s.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-800 text-sm">{s.name}</span>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${s.is_enabled ? 'bg-accent-100 text-accent-700' : 'bg-gray-100 text-gray-500'}`}>
                            {s.is_enabled ? 'Active' : 'Paused'}
                          </span>
                          <span className="text-xs text-gray-400 font-mono">{s.cron_expression}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                          <span>Type: {s.source_type}</span>
                          {s.last_run_at && <span>Last run: {new Date(s.last_run_at).toLocaleString()}</span>}
                          {s.last_run_status && <span className={s.last_run_status === 'completed' ? 'text-accent-600' : 'text-red-500'}>{s.last_run_status}</span>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {s.is_enabled && (
                          <button onClick={() => handleRunScheduleNow(s.id, s.name)}
                            title="Run now (bypass cron)"
                            className="p-2 rounded-lg border border-primary-300 text-primary-600 hover:bg-primary-50 transition-all">
                            <RefreshCw size={14} />
                          </button>
                        )}
                        <button onClick={() => handleToggleSchedule(s.id)}
                          className={`p-2 rounded-lg border transition-all ${s.is_enabled ? 'border-yellow-300 text-yellow-600 hover:bg-yellow-50' : 'border-accent-300 text-accent-600 hover:bg-accent-50'}`}>
                          {s.is_enabled ? <Pause size={14} /> : <Play size={14} />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Jobs section */}
            <h3 className="font-display font-bold text-gray-800 text-sm mb-3 flex items-center gap-2"><Activity size={14} /> Recent Jobs</h3>
            {jobs.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Activity size={32} className="mx-auto mb-3 text-gray-200" />
                <p className="text-sm">No crawl jobs yet. Trigger an enrichment or wait for the daily schedule.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {jobs.slice(0, 30).map(job => {
                  const cfg = JOB_STATUS[job.status] || JOB_STATUS.queued;
                  const Icon = cfg.icon;
                  return (
                    <div key={job.id} className="bg-white rounded-xl border border-gray-200 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${cfg.color}`}>
                            <Icon size={12} /> {cfg.label}
                          </span>
                          <span className="text-sm font-medium text-gray-700">{job.source_name || `Job #${job.id}`}</span>
                          {job.job_type && <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{job.job_type}</span>}
                        </div>
                        <span className="text-xs text-gray-400">{job.started_at ? new Date(job.started_at).toLocaleString() : ''}</span>
                      </div>
                      {job.status === 'completed' && (
                        <div className="flex gap-4 mt-2 text-xs text-gray-500">
                          <span>Found: <strong>{job.found || 0}</strong></span>
                          <span>Added: <strong>{job.added || 0}</strong></span>
                          {job.duplicates > 0 && <span>Duplicates: <strong>{job.duplicates}</strong></span>}
                          {job.rejected > 0 && <span>Errors: <strong>{job.rejected}</strong></span>}
                        </div>
                      )}
                      {job.status === 'running' && job.progress > 0 && (
                        <div className="mt-2">
                          <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div className="h-1.5 rounded-full bg-blue-500 transition-all" style={{ width: `${job.progress}%` }} />
                          </div>
                          <span className="text-xs text-blue-500 mt-1">{job.progress}%</span>
                        </div>
                      )}
                      {job.status === 'failed' && job.error && (
                        <p className="text-xs text-red-500 mt-2 bg-red-50 p-2 rounded">{job.error}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
