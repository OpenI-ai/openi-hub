import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Activity, RefreshCw, CheckCircle2, XCircle, AlertCircle,
  Zap, Loader2, Database, Server, Rss, Shield, Globe,
  HeartPulse, Play, Square,
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

  // s87: start/stop the liveness backfill worker from the panel.
  const [lvBusy, setLvBusy] = useState(false);
  const livenessAction = useCallback(async (kind) => {
    setLvBusy(true);
    try {
      if (kind === 'start') await crawlAPI.livenessWorkerStart();
      else await crawlAPI.livenessWorkerStop();
      await load();
    } catch (e) {
      setErr(e.message || 'Liveness worker action failed');
    } finally {
      setLvBusy(false);
    }
  }, [load]);

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
  // s87: liveness census. Sibling keys — absent on a pre-s87 backend, in
  // which case the whole section stays hidden rather than rendering dashes.
  const lb = data.liveness_backfill;
  const lc = data.liveness_corpus;
  const lcron = data.liveness;
  const lcTotal = Number(lc?.total_crawled || 0);
  const lcNever = Number(lc?.never_checked || 0);
  const lcChecked = Math.max(0, lcTotal - lcNever);
  const lcPct = lcTotal > 0 ? (lcChecked / lcTotal) * 100 : 0;
  // Drain rate + ETA from the worker's own run, when it is running.
  const lvElapsedSec = lb?.running && lb?.started_at
    ? Math.max(1, (Date.now() - Date.parse(lb.started_at)) / 1000) : null;
  const lvRate = lvElapsedSec && lb?.stats?.processed > 0
    ? lb.stats.processed / lvElapsedSec : null;
  const lvEtaDays = lvRate && lcNever > 0 ? (lcNever / lvRate) / 86400 : null;
  // s88: the unknown bucket split the backend now reports. All optional —
  // absent on a pre-s88 backend, in which case the breakdown line stays hidden.
  const lcUnknownChecked = lc?.unknown_checked != null ? Number(lc.unknown_checked) : null;
  const lcFailOnce = Number(lc?.unknown_fail_once || 0);
  const lcRetryDue = Number(lc?.fail_retry_due || 0);
  // s88: the pool is drained only when never-checked AND due second strikes
  // are both empty — a fail-once row becomes startable again after its window.
  const lvPoolEmpty = lcNever === 0 && lcRetryDue === 0;

  return (
    <div className="py-5 space-y-5 min-w-0">
      {/* Top status strip */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 flex items-center gap-3 sm:gap-4 flex-wrap">
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${TONE_CLASS[style.tone]}`}>
          {style.tone === 'green' ? <CheckCircle2 size={18} /> : style.tone === 'red' ? <XCircle size={18} /> : <Activity size={18} />}
          <span className="font-semibold text-sm">{style.label}</span>
        </div>
        <div className="text-sm text-gray-500">
          <span className="font-mono text-xs text-gray-400">ok_reason:</span>{' '}
          <span className="font-mono text-xs text-gray-700">{reason}</span>
        </div>
        <div className="sm:ml-auto flex items-center gap-3 flex-wrap">
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
          <div className="pt-2 mt-2 border-t border-gray-100 text-xs text-gray-500 break-words">
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

      {/* s87 — Liveness census: backfill worker + corpus progress + cron */}
      {lb !== undefined && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <HeartPulse size={16} className="text-primary-500" />
            <h3 className="font-display font-semibold text-gray-900 text-sm">Liveness Census</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${lb?.running ? TONE_CLASS.green : TONE_CLASS.gray}`}>
              {lb?.running ? 'backfill running' : 'backfill idle'}
            </span>
            <div className="ml-auto">
              {lb?.running ? (
                <button
                  onClick={() => livenessAction('stop')}
                  disabled={lvBusy}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  {lvBusy ? <Loader2 size={14} className="animate-spin" /> : <Square size={14} />}
                  Stop backfill
                </button>
              ) : (
                <button
                  onClick={() => livenessAction('start')}
                  disabled={lvBusy || lvPoolEmpty}
                  title={lvPoolEmpty ? 'Pool is drained — nothing left to check' : undefined}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors disabled:opacity-50"
                >
                  {lvBusy ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                  Start backfill
                </button>
              )}
            </div>
          </div>

          {/* corpus progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>{fmtNum(lcChecked)} of {fmtNum(lcTotal)} crawled profiles checked</span>
              <span>{lcPct.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${lcPct}%` }} />
            </div>
            {lvRate != null && (
              <div className="text-xs text-gray-400 mt-1">
                ~{lvRate.toFixed(1)} rows/s this run{lvEtaDays != null ? ` · ~${lvEtaDays < 1 ? `${Math.ceil(lvEtaDays * 24)}h` : `${lvEtaDays.toFixed(1)}d`} to drain` : ''}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 mb-4">
            <div><div className="text-xs text-gray-400">Live</div><div className="text-lg font-semibold text-green-700">{fmtNum(lc?.live)}</div></div>
            <div><div className="text-xs text-gray-400">Parked</div><div className="text-lg font-semibold text-amber-700">{fmtNum(lc?.parked)}</div></div>
            <div><div className="text-xs text-gray-400">Mismatched</div><div className="text-lg font-semibold text-amber-700">{fmtNum(lc?.mismatched)}</div></div>
            <div><div className="text-xs text-gray-400">Unreachable</div><div className="text-lg font-semibold text-red-600">{fmtNum(lc?.unreachable)}</div></div>
            <div><div className="text-xs text-gray-400">Unknown</div><div className="text-lg font-semibold text-gray-900">{fmtNum(lc?.unknown)}</div></div>
            <div><div className="text-xs text-gray-400">Never checked</div><div className="text-lg font-semibold text-gray-900">{fmtNum(lcNever)}</div></div>
          </div>

          {/* s88: what Unknown actually holds, beyond the never-checked rows */}
          {lcUnknownChecked != null && (
            <div className="mb-4 text-xs text-gray-500">
              Checked but still unknown: <span className="font-semibold text-gray-700">{fmtNum(lcUnknownChecked)}</span>
              {' — '}{fmtNum(lcFailOnce)} failed one fetch
              {lc?.fail_retry_days != null ? ` (2nd strike after ${lc.fail_retry_days}d` : ' ('}
              {lcRetryDue > 0 ? `, ${fmtNum(lcRetryDue)} due now)` : ', none due yet)'}
              {' · '}{fmtNum(Math.max(0, lcUnknownChecked - lcFailOnce))} ambiguous content (SPA/thin/non-english)
            </div>
          )}

          <div className="pt-3 border-t border-gray-100 flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500">
            <span>
              Worker: inflight {lb?.inflight ?? 0}/{lb?.concurrency ?? '—'}
              {lb?.started_at ? ` · started ${relTime(lb.started_at)}` : ''}
              {lb?.stats ? ` · processed ${fmtNum(lb.stats.processed)} · errors ${fmtNum(lb.stats.errors)}` : ''}
            </span>
            <span>
              Recheck cron: {lcron?.registered
                ? `registered (${lcron.interval})`
                : 'OFF — set LIVENESS_RECHECK_ENABLED=true'}
              {lcron?.last_batch != null ? ` · batch ${fmtNum(lcron.last_batch)}` : ''}
              {lcron?.lastRun ? ` · last run ${relTime(lcron.lastRun)}` : ''}
            </span>
          </div>
        </div>
      )}

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
