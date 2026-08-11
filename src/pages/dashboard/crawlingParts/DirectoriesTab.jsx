import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Database, Play, CheckCircle2, Loader2 } from 'lucide-react';
// NOTE: this module lives one directory deeper than StartupCrawling.jsx, so
// these relative specifiers are '../../../', NOT the '../../' they had inline.
import { directoryCrawlAPI } from '../../../services/api';
import LoadingSkeleton from '../../../components/LoadingSkeleton';

// ── Phase 51: Directory Crawlers tab ──────────────────────────
// Lets admins trigger directory-source crawlers (YC today, more to come)
// and view run history + auto-approve promoted rows.
export default function DirectoriesTab() {
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
