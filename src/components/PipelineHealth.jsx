import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Activity, RefreshCw, CheckCircle2, XCircle, AlertCircle,
  Zap, Loader2, Database, Server, Rss, Shield, Globe,
} from 'lucide-react';
import { crawlAPI } from '../services/api';
import LoadingSkeleton from './LoadingSkeleton';

const POLL_MS = 30_000;

// ── helpers ─────────────────────────────────────────────────
function relTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return '—';
  const sec = Math.floor((Date.now() - d) / 1000);
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}

function fmtNum(n) {
  if (n == null) return '—';
  const v = typeof n === 'string' ? Number(n) : n;
  if (Number.isNaN(v)) return String(n);
  return v.toLocaleString();
}

// Map ok_reason → { color, label }
const REASON_STYLE = {
  running:             { tone: 'green',  label: 'Running'             },
  idle_drained:        { tone: 'green',  label: 'Idle (drained)'      },
  backlog_no_worker:   { tone: 'red',    label: 'Backlog · No worker' },
  worker_wedged:       { tone: 'red',    label: 'Worker wedged'       },
};

const TONE_CLASS = {
  green:  'bg-green-50 border-green-200 text-green-700',
  red:    'bg-red-50 border-red-200 text-red-700',
  amber:  'bg-amber-50 border-amber-200 text-amber-700',
  gray:   'bg-gray-50 border-gray-200 text-gray-700',
};

// ── tiny inline sparkline (no chart dep) ─────────────────────
function Sparkline({ values = [], width = 80, height = 24 }) {
  if (!values.length) return <span className="text-xs text-gray-400">—</span>;
  const max = Math.max(...values, 1);
  const step = width / Math.max(values.length - 1, 1);
  const points = values
    .map((v, i) => `${i * step},${height - (v / max) * height}`)
    .join(' ');
  return (
    <svg width={width} height={height} className="inline-block align-middle">
      <polyline
        fill="none"
        stroke="#D4A843"
        strokeWidth="1.5"
        points={points}
      />
    </svg>
  );
}

// ── card primitive ───────────────────────────────────────────
function HealthCard({ icon: Icon, title, children, accent = 'gray' }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${TONE_CLASS[accent]}`}>
          <Icon size={16} />
        </div>
        <h3 className="font-display font-semibold text-gray-900 text-sm">{title}</h3>
      </div>
      <div className="space-y-2 text-sm">{children}</div>
    </div>
  );
}

function Row({ label, value, mono = false }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500">{label}</span>
      <span className={`text-gray-900 ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  );
}

// ── main component ───────────────────────────────────────────
export default function PipelineHealth() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastPoll, setLastPoll] = useState(null);

  const load = useCallback(async () => {
    try {
      const r = await crawlAPI.pipelineHealth();
      setData(r);
      setErr(null);
      setLastPoll(Date.now());
    } catch (e) {
      setErr(e.message || 'Failed to load pipeline health');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!autoRefresh) return;
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [autoRefresh, load]);

  // Re-tick the relative-time labels every 5s so "12s ago" stays current
  const [, forceTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => forceTick(x => x + 1), 5000);
    return () => clearInterval(t);
  }, []);

  const reason = data?.ok_reason || 'unknown';
  const style = REASON_STYLE[reason] || { tone: 'gray', label: reason };

  const lastPollRel = useMemo(() => {
    if (!lastPoll) return '—';
    const sec = Math.floor((Date.now() - lastPoll) / 1000);
    if (sec < 60) return `${sec}s ago`;
    return `${Math.floor(sec / 60)}m ago`;
  }, [lastPoll]);

  if (loading && !data) return <LoadingSkeleton type="card" />;

  if (err && !data) {
    return (
      <div className="px-6 py-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-start gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
          <div>
            <div className="font-semibold text-red-900 mb-1">Failed to load pipeline health</div>
            <div className="text-sm text-red-700">{err}</div>
            <button
              onClick={load}
              className="mt-3 text-sm font-medium text-red-700 hover:text-red-900 underline"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const w = data.worker || {};
  const wd = data.watchdog || {};
  const hr = data.homepage_retry || {};
  const cap = data.playwright_retry_cap || {};
  const rss = data.rss_auto_disable || {};
  const cr = data.crawler || {};
  const ep = data.enrichment_pool || {};

  return (
    <div className="px-6 py-5 space-y-5">
      {/* Top status strip */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4 flex-wrap">
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${TONE_CLASS[style.tone]}`}>
          {style.tone === 'green' ? <CheckCircle2 size={18} /> : style.tone === 'red' ? <XCircle size={18} /> : <Activity size={18} />}
          <span className="font-semibold text-sm">{style.label}</span>
        </div>
        <div className="text-sm text-gray-500">
          <span className="font-mono text-xs text-gray-400">ok_reason:</span>{' '}
          <span className="font-mono text-xs text-gray-700">{reason}</span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-gray-600 select-none cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            Auto-refresh 30s
          </label>
          <span className="text-xs text-gray-400">checked {lastPollRel}</span>
          <button
            onClick={load}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* 4-card grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <HealthCard
          icon={Server}
          title="Deep-Enrich Worker"
          accent={w.wedged ? 'red' : w.running ? 'green' : 'gray'}
        >
          <Row label="State" value={
            w.wedged
              ? <span className="text-red-600 font-medium">wedged</span>
              : w.running
                ? <span className="text-green-700 font-medium flex items-center gap-1"><Loader2 size={12} className="animate-spin" />running</span>
                : <span className="text-gray-500">idle</span>
          } />
          <Row label="Inflight" value={`${w.inflight ?? 0} / ${w.concurrency ?? '?'}`} />
          <Row label="Last tick" value={w.last_tick_age_sec != null ? `${w.last_tick_age_sec}s ago` : '—'} />
          <Row label="Started" value={relTime(w.started_at)} />
          <div className="pt-2 mt-2 border-t border-gray-100 grid grid-cols-3 gap-2 text-xs">
            <div><div className="text-gray-400">processed</div><div className="font-semibold">{fmtNum(w.stats?.processed)}</div></div>
            <div><div className="text-gray-400">enriched</div><div className="font-semibold text-green-700">{fmtNum(w.stats?.enriched)}</div></div>
            <div><div className="text-gray-400">failed</div><div className="font-semibold text-red-600">{fmtNum(w.stats?.failed)}</div></div>
          </div>
        </HealthCard>

        <HealthCard
          icon={Shield}
          title="Watchdog (D1)"
          accent={wd.kick_count > 0 ? 'amber' : wd.registered ? 'green' : 'gray'}
        >
          <Row label="Last run" value={relTime(wd.last_run)} />
          <Row label="Kicks (lifetime)" value={fmtNum(wd.kick_count)} />
          <Row label="Last kick" value={relTime(wd.last_kick_at)} />
          <Row label="Last wedge" value={relTime(wd.last_wedge_at)} />
          <div className="pt-2 mt-2 border-t border-gray-100 text-xs text-gray-500">
            stale&gt;{Math.floor((wd.stale_threshold_ms ?? 0) / 1000)}s · backlog&gt;{wd.kick_threshold ?? '?'} · 24h redeploys: {wd.recent_redeploys_24h ?? 0}
          </div>
        </HealthCard>

        <HealthCard
          icon={Globe}
          title="Homepage Retry (G4/G5)"
          accent={hr.last_yield_alert_at ? 'amber' : hr.registered ? 'green' : 'gray'}
        >
          <Row label="Last run" value={relTime(hr.last_run)} />
          <Row label="Total runs" value={fmtNum(hr.totals?.runs)} />
          <Row label="Yields" value={
            <span className="flex items-center gap-2">
              <Sparkline values={hr.recent_yields || []} />
              <span className="text-xs text-gray-500">
                [{(hr.recent_yields || []).join(',')}]
              </span>
            </span>
          } />
          <Row label="Yield alert" value={hr.last_yield_alert_at ? relTime(hr.last_yield_alert_at) : <span className="text-gray-400">none</span>} />
          <div className="pt-2 mt-2 border-t border-gray-100 text-xs text-gray-500">
            Cap: {fmtNum(cap.capped_out)} / {fmtNum(cap.total_fetch_failed)} (limit {cap.cap}) · still eligible: {fmtNum(cap.still_eligible)}
          </div>
        </HealthCard>

        <HealthCard
          icon={Rss}
          title="RSS Auto-Disable (G2)"
          accent={(rss.stats?.feeds_disabled || 0) > 0 ? 'amber' : rss.registered ? 'green' : 'gray'}
        >
          <Row label="Last run" value={relTime(rss.last_run)} />
          <Row label="Cron" value={<span className="font-mono text-xs">{rss.cron || '—'}</span>} />
          <Row label="Lifetime runs" value={fmtNum(rss.stats?.runs)} />
          <Row label="Feeds checked" value={fmtNum(rss.stats?.feeds_checked)} />
          <Row label="Feeds disabled" value={
            <span className={(rss.stats?.feeds_disabled || 0) > 0 ? 'text-amber-700 font-semibold' : ''}>
              {fmtNum(rss.stats?.feeds_disabled)}
            </span>
          } />
          <div className="pt-2 mt-2 border-t border-gray-100 text-xs text-gray-500">
            window {rss.window_days}d · min_runs {rss.min_runs}
          </div>
          {Array.isArray(rss.stats?.last_disabled) && rss.stats.last_disabled.length > 0 && (
            <div className="pt-2 text-xs">
              <div className="text-gray-400 mb-1">Last disabled:</div>
              <ul className="space-y-1">
                {rss.stats.last_disabled.slice(0, 5).map((f, i) => (
                  <li key={i} className="text-amber-700">• {f.name || f}</li>
                ))}
              </ul>
            </div>
          )}
        </HealthCard>
      </div>

      {/* Bottom strip — pool + crawler */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Database size={16} className="text-primary-500" />
          <h3 className="font-display font-semibold text-gray-900 text-sm">Enrichment Pool & Crawler</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <div className="text-xs text-gray-400">Eligible source</div>
            <div className="text-xl font-semibold text-gray-900">{fmtNum(ep.eligible_source)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Deep enriched</div>
            <div className="text-xl font-semibold text-green-700">{fmtNum(ep.deep_enriched)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Attempted</div>
            <div className="text-xl font-semibold text-gray-900">{fmtNum(ep.attempted)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Pending pool</div>
            <div className={`text-xl font-semibold ${Number(ep.pending_pool) > 0 ? 'text-amber-700' : 'text-gray-900'}`}>
              {fmtNum(ep.pending_pool)}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
          <div>
            <div className="text-xs text-gray-400">Schedules enabled</div>
            <div className="text-lg font-semibold text-gray-900">
              {fmtNum(cr.schedules?.enabled)} / {fmtNum(cr.schedules?.total)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Schedules disabled</div>
            <div className="text-lg font-semibold text-gray-500">{fmtNum(cr.schedules?.disabled)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Failed jobs (24h)</div>
            <div className={`text-lg font-semibold ${Number(cr.failed_jobs_24h) > 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {fmtNum(cr.failed_jobs_24h)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Top skip reason</div>
            <div className="text-sm text-gray-700 truncate" title={ep.top_skip_reason?.reason}>
              {ep.top_skip_reason?.reason || '—'}{' '}
              {ep.top_skip_reason?.n != null && (
                <span className="text-gray-400">({fmtNum(ep.top_skip_reason.n)})</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer note */}
      <div className="text-xs text-gray-400 flex items-center gap-2">
        <Zap size={12} />
        Source: <code className="font-mono">GET /api/pipeline/health</code> · server checked at {data.checked_at ? new Date(data.checked_at).toLocaleTimeString() : '—'}
      </div>
    </div>
  );
}
