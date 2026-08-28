import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { DollarSign, AlertTriangle, TrendingUp, Plus, RefreshCw, Trash2, Loader2, Database, Mail } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import toast from 'react-hot-toast';

const G = '#C9A646';
const SEVERITY_COLOR = {
  warn: { bg: '#fef3c7', fg: '#92400e', label: 'Warn' },
  over_budget: { bg: '#fee2e2', fg: '#dc2626', label: 'Over Budget' },
  critical: { bg: '#fecaca', fg: '#991b1b', label: 'Critical' },
};
const SERVICE_LABEL = {
  railway: 'Railway',
  cloudinary: 'Cloudinary',
  openai: 'OpenAI',
  vercel: 'Vercel',
  resend: 'Resend',
  cloudflare: 'Cloudflare',
  other: 'Other',
};

export default function AdminCosts() {
  const [summary, setSummary] = useState({ daily: [], status: [], manual: [] });
  const [alerts, setAlerts] = useState([]);
  // Phase 102-uptime: uptime state
  const [uptime, setUptime] = useState({ monitors: [], stats: null });
  // Phase 102-sentry: errors state
  const [errors, setErrors] = useState({ issues: [], stats: null });
  // R: DR Drill + db-backup state
  const [drill, setDrill] = useState({ workflows: {}, error: null });
  // Phase 119: Email outbox state
  const [outbox, setOutbox] = useState({ status_counts: [], kind_counts: [], recent_emails: [], unacknowledged_exhausted: [] });
  const [loading, setLoading] = useState(true);
  const [showManual, setShowManual] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // s97 wiring audit: a failed section fetch used to be swallowed into its empty
  // state, so a 500 from Sentry rendered as a green "no unresolved errors" — a
  // broken endpoint displayed as an all-clear. Track failures per section.
  const [sectionFailed, setSectionFailed] = useState({});
  const [manualForm, setManualForm] = useState({ service: 'railway', month_label: '', cost_usd: '', note: '' });

  const load = async () => {
    setLoading(true);
    try {
      // Phase 102-sentry: parallel fetch (added errorsSummary)
      // Phase 119: also fetch email outbox health
      const [s, a, u, e, d, o] = await Promise.all([
        adminAPI.costsSummary(),
        adminAPI.costsAlerts(),
        adminAPI.uptimeSummary().catch(() => null),
        adminAPI.errorsSummary().catch(() => null),
        adminAPI.drillHistory().catch(() => ({ workflows: {}, error: 'failed to load' })),
        adminAPI.emailOutboxHealth().catch(() => null),
      ]);
      setSummary(s);
      setAlerts(a.alerts || []);
      setSectionFailed({ uptime: !u, errors: !e, outbox: !o });
      setUptime(u || { monitors: [], stats: null });
      setErrors(e || { issues: [], stats: null });
      setDrill(d || { workflows: {}, error: null });
      setOutbox(o || { status_counts: [], kind_counts: [], recent_emails: [], unacknowledged_exhausted: [] });
    } catch (e) {
      console.error('[admin-costs]', e);
      toast.error('Failed to load costs: ' + (e?.message || 'unknown'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const submitManual = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await adminAPI.costsManual(manualForm);
      toast.success(`Recorded ${manualForm.service} cost for ${manualForm.month_label}`);
      setShowManual(false);
      setManualForm({ service: 'railway', month_label: '', cost_usd: '', note: '' });
      load();
    } catch (e) {
      toast.error(e?.message || 'Save failed');
    } finally {
      setSubmitting(false);
    }
  };

  // s97 wiring audit: the exhausted-email banner said "acknowledge below" but no
  // acknowledge control existed anywhere — adminAPI.emailOutboxAckAlert had zero
  // call sites. This is that control.
  const ackExhausted = async (id) => {
    try {
      await adminAPI.emailOutboxAckAlert(id);
      setOutbox(prev => ({
        ...prev,
        unacknowledged_exhausted: prev.unacknowledged_exhausted.filter(r => r.id !== id),
      }));
      toast.success('Alert acknowledged');
    } catch (e) { toast.error(e?.message || 'Failed to acknowledge'); }
  };

  const clearAlert = async (id) => {
    if (!window.confirm('Clear this alert?')) return;
    try {
      await adminAPI.costsClearAlert(id);
      setAlerts(prev => prev.filter(a => a.id !== id));
      toast.success('Alert cleared');
    } catch (e) { toast.error(e?.message || 'Failed'); }
  };

  // Build per-service daily series for the line charts
  const seriesByService = {};
  (summary.daily || []).forEach(row => {
    if (!seriesByService[row.service]) seriesByService[row.service] = [];
    seriesByService[row.service].push({
      date: row.date.slice(0, 10),
      credits: Number(row.credits_used || 0),
      bandwidth: Number(row.bandwidth_gb || 0),
      storage: Number(row.storage_gb || 0),
    });
  });

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div id="tour-page-admin-costs" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <DollarSign size={26} color={G} />
            Service Costs
          </h1>
          <p style={{ color: '#666', fontSize: 13, margin: '4px 0 0' }}>
            Daily watchdog runs at 02:00 IST. Manual entry for Railway. Alerts email rajeev@openi.ai.
          </p>
        </div>
        <button onClick={load} disabled={loading}
          style={{ padding: '8px 14px', fontSize: 13, fontWeight: 600, background: G, color: '#fff', border: 'none', borderRadius: 8, cursor: loading ? 'wait' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 80, color: '#666' }}>
          <Loader2 size={32} className="spin" />
        </div>
      ) : (
        <>
          {/* ── Service status grid ─────────────────────────────────────── */}
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px', color: '#333' }}>Service Status</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12, marginBottom: 28 }}>
            {(summary.status || []).map(s => {
              const pct = s.current_pct;
              const overBudget = pct != null && pct >= 100;
              const warn = pct != null && pct >= 80;
              const bg = overBudget ? '#fef2f2' : warn ? '#fffbeb' : '#fff';
              const border = overBudget ? '#fecaca' : warn ? '#fde68a' : '#e5e7eb';
              return (
                <div key={s.service} style={{ background: bg, border: `1.5px solid ${border}`, borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                    {SERVICE_LABEL[s.service] || s.service}
                  </div>
                  {pct != null ? (
                    <div style={{ fontSize: 28, fontWeight: 700, color: overBudget ? '#dc2626' : warn ? '#92400e' : '#111', marginBottom: 4 }}>
                      {pct.toFixed(1)}%
                    </div>
                  ) : (
                    <div style={{ fontSize: 13, fontStyle: 'italic', color: '#5c5c5c', marginBottom: 4 }}>
                      {s.service === 'railway' ? 'Manual tracking' : 'No data'}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: '#666', lineHeight: 1.4 }}>{s.message}</div>
                </div>
              );
            })}
          </div>

          {/* Phase 102-uptime: BetterStack uptime status panel */}
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px', color: '#333', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            Uptime Status
            {uptime.stats && uptime.stats.total > 0 && (
              <span style={{ fontSize: 11, fontWeight: 500, color: '#666', marginLeft: 8 }}>
                {uptime.stats.up}/{uptime.stats.total} up
                {uptime.stats.avg_uptime_pct != null && ` · avg ${uptime.stats.avg_uptime_pct}% (24h)`}
              </span>
            )}
          </h2>
          {sectionFailed.uptime ? (
            <div style={{ padding: 24, color: '#dc2626', fontSize: 13, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, marginBottom: 28 }}>
              Failed to load uptime data — the /admin/uptime/summary request errored. Check Sentry / server logs.
            </div>
          ) : (!uptime.monitors || uptime.monitors.length === 0) ? (
            <div style={{ padding: 24, color: '#666', fontSize: 13, fontStyle: 'italic', background: '#fafafa', borderRadius: 8, marginBottom: 28 }}>
              No uptime data yet. Hourly poll runs at the top of each hour; BetterStack token must be set in Railway env (BETTERSTACK_API_TOKEN).
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, marginBottom: 28 }}>
              {uptime.monitors.map(m => {
                const isUp = m.status === 'up';
                const isDown = m.status === 'down';
                const isPaused = m.status === 'paused';
                const bg = isDown ? '#fef2f2' : isPaused ? '#f3f4f6' : '#fff';
                const border = isDown ? '#fecaca' : isPaused ? '#d1d5db' : '#e5e7eb';
                const dot = isUp ? '#16a34a' : isDown ? '#dc2626' : isPaused ? '#9ca3af' : '#f59e0b';
                return (
                  <div key={m.monitor_id} style={{ background: bg, border: `1.5px solid ${border}`, borderRadius: 12, padding: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: dot, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#333', textTransform: 'uppercase' }}>{m.status}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#555', wordBreak: 'break-all', marginBottom: 6 }}>{m.monitor_url}</div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#666' }}>
                      <span><strong>{m.uptime_pct_24h != null ? Number(m.uptime_pct_24h).toFixed(2) + '%' : '—'}</strong> 24h</span>
                      {m.response_time_avg_ms != null && <span><strong>{m.response_time_avg_ms}ms</strong> p95</span>}
                      {Number(m.incidents_count_24h) > 0 && (
                        <span style={{ color: '#dc2626' }}><strong>{m.incidents_count_24h}</strong> incidents</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Phase 102-sentry: Recent Errors panel */}
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px', color: '#333', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            Recent Errors (Sentry)
            {errors.stats && errors.stats.total > 0 && (
              <span style={{ fontSize: 11, fontWeight: 500, color: '#666', marginLeft: 8 }}>
                {errors.stats.total} unresolved
                {errors.stats.total_event_count > 0 && ` · ${errors.stats.total_event_count.toLocaleString()} events`}
              </span>
            )}
          </h2>
          {sectionFailed.errors ? (
            <div style={{ padding: 24, color: '#dc2626', fontSize: 13, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, marginBottom: 28 }}>
              Failed to load Sentry error summary — the /admin/errors/summary request errored. This is NOT an all-clear.
            </div>
          ) : (!errors.issues || errors.issues.length === 0) ? (
            <div style={{ padding: 24, color: '#15803d', fontSize: 13, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, marginBottom: 28 }}>
              ✓ No unresolved errors in the last 24h.
            </div>
          ) : (
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', marginBottom: 28 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#fafafa', borderBottom: '1px solid #eee' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#666' }}>ID</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#666' }}>Project</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#666' }}>Title</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#666' }}>Level</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#666' }}>Events</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#666' }}>Users</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#666' }}>Last seen</th>
                  </tr>
                </thead>
                <tbody>
                  {errors.issues.slice(0, 15).map(i => {
                    const levelColors = {
                      fatal: { bg: '#fecaca', fg: '#991b1b' },
                      error: { bg: '#fee2e2', fg: '#dc2626' },
                      warning: { bg: '#fef3c7', fg: '#92400e' },
                      info: { bg: '#eff6ff', fg: '#1e40af' },
                      debug: { bg: '#f3f4f6', fg: '#6b7280' },
                    };
                    const lc = levelColors[i.level] || levelColors.error;
                    const projectBadge = (i.project_slug || '').replace('openi-hub-', '');
                    return (
                      <tr key={`${i.project_slug}-${i.short_id}`} style={{ borderBottom: '1px solid #f5f5f5' }}>
                        <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 11, fontWeight: 600 }}>
                          {i.permalink ? (
                            <a href={i.permalink} target="_blank" rel="noreferrer" style={{ color: G, textDecoration: 'none', borderBottom: `1px dashed ${G}` }}>
                              {i.short_id}
                            </a>
                          ) : i.short_id}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 10, background: '#f3f4f6', color: '#4b5563', fontWeight: 600 }}>{projectBadge}</span>
                        </td>
                        <td style={{ padding: '10px 12px', maxWidth: 320, color: '#333', wordBreak: 'break-word' }}>
                          <div style={{ fontWeight: 600 }}>{i.title}</div>
                          {i.culprit && <div style={{ fontSize: 10, color: '#5c5c5c', fontFamily: 'monospace', marginTop: 2 }}>{i.culprit}</div>}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: 10, background: lc.bg, color: lc.fg, fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>{i.level}</span>
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>{Number(i.event_count || 0).toLocaleString()}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>{Number(i.user_count || 0)}</td>
                        <td style={{ padding: '10px 12px', color: '#5c5c5c', fontSize: 11 }}>{i.last_seen ? new Date(i.last_seen).toLocaleString() : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Phase 119: Email Outbox Health */}
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px', color: '#333', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Mail size={16} color={G} /> Email Outbox (Phase 118)
            {(() => {
              const pending = (outbox.status_counts.find(s => s.status === 'pending') || {}).cnt || 0;
              const sent = (outbox.status_counts.find(s => s.status === 'sent') || {}).cnt || 0;
              const failed = (outbox.status_counts.find(s => s.status === 'failed') || {}).cnt || 0;
              const exhausted = outbox.unacknowledged_exhausted.length;
              return (
                <span style={{ fontSize: 11, fontWeight: 500, color: '#666', marginLeft: 8 }}>
                  {pending} pending · {sent} sent (7d) · {failed} failed
                  {exhausted > 0 && <span style={{ color: '#dc2626', fontWeight: 700 }}> · {exhausted} EXHAUSTED</span>}
                </span>
              );
            })()}
          </h2>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', marginBottom: 28 }}>
            {outbox.unacknowledged_exhausted.length > 0 && (
              <div style={{ padding: 12, background: '#fef2f2', borderBottom: '1px solid #fecaca' }}>
                <div style={{ color: '#991b1b', fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
                  ⚠ {outbox.unacknowledged_exhausted.length} email(s) exhausted all retries (triple-fallback fired).
                </div>
                {outbox.unacknowledged_exhausted.map(r => (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#7f1d1d', padding: '4px 0' }}>
                    <span style={{ fontFamily: 'monospace' }}>{r.to_email}</span>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.subject}</span>
                    <button onClick={() => ackExhausted(r.id)}
                      style={{ padding: '3px 10px', fontSize: 11, fontWeight: 600, background: '#fff', color: '#991b1b', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', flexShrink: 0 }}>
                      Acknowledge
                    </button>
                  </div>
                ))}
              </div>
            )}
            {/* Screenshot item #6 — per-kind breakdown. status_counts alone hides WHICH
                email types are failing; a single failing payment_confirmation matters far
                more than twenty failing digests. */}
            {outbox.kind_counts && outbox.kind_counts.length > 0 && (
              <div style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb', background: '#fafafa' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#666', marginBottom: 6, letterSpacing: 0.3 }}>BY KIND (7d)</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {Object.entries(outbox.kind_counts.reduce((acc, r) => {
                    acc[r.kind] = acc[r.kind] || {};
                    acc[r.kind][r.status] = (acc[r.kind][r.status] || 0) + r.cnt;
                    return acc;
                  }, {}))
                    .map(([kind, c]) => [kind, c, Object.entries(c).filter(([s]) => s !== 'sent')])
                    .sort((a, b) => (b[2].length - a[2].length) || ((b[1].sent || 0) - (a[1].sent || 0)))
                    .map(([kind, c, notSent]) => {
                      const hasBad = notSent.some(([s]) => s !== 'pending');
                      return (
                        <span key={kind} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 999, border: '1px solid ' + (hasBad ? '#fecaca' : '#e5e7eb'), background: hasBad ? '#fef2f2' : '#fff', color: '#333' }}>
                          <strong>{kind}</strong> {c.sent || 0} sent
                          {notSent.map(([s, n]) => (
                            <span key={s} style={{ color: s === 'pending' ? '#b45309' : '#dc2626', fontWeight: 700 }}> · {n} {s}</span>
                          ))}
                        </span>
                      );
                    })}
                </div>
              </div>
            )}
            {sectionFailed.outbox ? (
              <div style={{ padding: 24, color: '#dc2626', fontSize: 13, textAlign: 'center' }}>
                Failed to load outbox health — the /admin/email-outbox request errored.
              </div>
            ) : (!outbox.recent_emails || outbox.recent_emails.length === 0) ? (
              <div style={{ padding: 24, color: '#666', fontSize: 13, textAlign: 'center' }}>
                No emails in outbox yet.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#fafafa', borderBottom: '1px solid #eee' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#666' }}>To</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#666' }}>Subject</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#666' }}>Status</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#666' }}>Attempts</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#666' }}>Created</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#666' }}>Sent / Error</th>
                  </tr>
                </thead>
                <tbody>
                  {outbox.recent_emails.slice(0, 10).map(r => {
                    const statusColors = {
                      sent:      { bg: '#d1fae5', fg: '#065f46' },
                      pending:   { bg: '#fef3c7', fg: '#92400e' },
                      failed:    { bg: '#fee2e2', fg: '#dc2626' },
                      exhausted: { bg: '#fecaca', fg: '#991b1b' },
                    };
                    const sc = statusColors[r.status] || { bg: '#f3f4f6', fg: '#6b7280' };
                    return (
                      <tr key={r.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                        <td style={{ padding: '10px 12px', color: '#333', fontFamily: 'monospace', fontSize: 11 }}>{r.to_email}</td>
                        <td style={{ padding: '10px 12px', maxWidth: 280, color: '#333', wordBreak: 'break-word' }}>{r.subject}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: 10, background: sc.bg, color: sc.fg, fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>{r.status}</span>
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>{r.attempts || 0}</td>
                        <td style={{ padding: '10px 12px', color: '#5c5c5c', fontSize: 11 }}>{r.created_at ? new Date(r.created_at).toLocaleString() : '—'}</td>
                        <td style={{ padding: '10px 12px', color: r.last_error ? '#dc2626' : '#888', fontSize: 11, maxWidth: 240, wordBreak: 'break-word' }}>
                          {r.sent_at ? new Date(r.sent_at).toLocaleString() : (r.last_error || '—')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* ── 30-day trend charts (per service) ───────────────────────── */}
          {/* R: DR Backup Health - GitHub Actions workflow runs */}
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px', color: '#333', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Database size={14} /> DR Backup Health
            </h2>
            {drill.error && (
              <div style={{ padding: 12, background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 8, fontSize: 12, color: '#92400e', marginBottom: 10 }}>
                Could not load workflow history: {drill.error}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              {Object.entries(drill.workflows || {}).map(([wfName, wf]) => {
                const isDrill = wfName.includes('restore-drill');
                const successPct = wf.success_rate_30d;
                const successColor = successPct == null ? '#9ca3af' : (successPct >= 90 ? '#10b981' : (successPct >= 70 ? '#f59e0b' : '#ef4444'));
                const lastSuc = wf.last_success;
                const lastFail = wf.last_failure;
                const fmtDt = (iso) => iso ? new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '-';
                const fmtDuration = (s) => s == null ? '-' : (s < 60 ? `${s}s` : `${Math.floor(s/60)}m ${s%60}s`);
                return (
                  <div key={wfName} style={{ padding: 14, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1f2937' }}>
                        {isDrill ? 'Restore Drill' : 'DB Backup'}
                      </div>
                      <div style={{ fontSize: 11, color: '#6b7280', fontFamily: 'monospace' }}>{wfName}</div>
                    </div>
                    {wf.error ? (
                      <div style={{ fontSize: 12, color: '#b91c1c', padding: 8, background: '#fee2e2', borderRadius: 6 }}>
                        Error: {wf.error}
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
                          <div>
                            <div style={{ fontSize: 10, color: '#6e6e6e', textTransform: 'uppercase' }}>Success 30d</div>
                            <div style={{ fontSize: 20, fontWeight: 700, color: successColor }}>
                              {successPct == null ? '-' : `${successPct}%`}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: 10, color: '#6e6e6e', textTransform: 'uppercase' }}>Total runs</div>
                            <div style={{ fontSize: 20, fontWeight: 700, color: '#1f2937' }}>{wf.total || 0}</div>
                          </div>
                        </div>
                        <div style={{ fontSize: 11, color: '#374151', display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {lastSuc ? (
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                              <span style={{ color: '#10b981' }}>OK</span> Last success: {fmtDt(lastSuc.run_started_at)} ({fmtDuration(lastSuc.duration_seconds)})
                              {lastSuc.html_url && <a href={lastSuc.html_url} target="_blank" rel="noreferrer" style={{ marginLeft: 'auto', color: '#3b82f6', fontSize: 10 }}>view</a>}
                            </div>
                          ) : (
                            <div style={{ color: '#6e6e6e' }}>No recent successes</div>
                          )}
                          {lastFail ? (
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                              <span style={{ color: '#ef4444' }}>FAIL</span> Last failure: {fmtDt(lastFail.run_started_at)} ({fmtDuration(lastFail.duration_seconds)})
                              {lastFail.html_url && <a href={lastFail.html_url} target="_blank" rel="noreferrer" style={{ marginLeft: 'auto', color: '#3b82f6', fontSize: 10 }}>view</a>}
                            </div>
                          ) : (
                            <div style={{ color: '#10b981' }}>No failures recorded</div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
              {Object.keys(drill.workflows || {}).length === 0 && !drill.error && (
                <div style={{ padding: 16, color: '#6e6e6e', fontSize: 12, gridColumn: 'span 2' }}>
                  {/* s97: this renders after load() resolved — it is an empty state,
                      not a loading state; it used to say "Loading…" forever. */}
                  {drill.note || 'No workflow runs recorded yet (GITHUB_TOKEN may not be configured).'}
                </div>
              )}
            </div>
          </div>

          <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px', color: '#333' }}>30-Day Trend</h2>
          {Object.keys(seriesByService).length === 0 ? (
            <div style={{ padding: 24, color: '#666', fontSize: 13, fontStyle: 'italic', background: '#fafafa', borderRadius: 8, marginBottom: 28 }}>
              No daily data yet. The watchdog runs at 02:00 IST nightly.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 16, marginBottom: 28 }}>
              {Object.entries(seriesByService).map(([service, data]) => (
                <div key={service} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: '#333' }}>
                    {SERVICE_LABEL[service] || service}
                  </div>
                  <ResponsiveContainer width="100%" height={140}>
                    <LineChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      {service === 'cloudinary' && (
                        <Line type="monotone" dataKey="credits" stroke={G} strokeWidth={2} dot={false} name="Credits" />
                      )}
                      {service !== 'cloudinary' && data.some(d => d.bandwidth) && (
                        <Line type="monotone" dataKey="bandwidth" stroke="#2563eb" strokeWidth={2} dot={false} name="Bandwidth GB" />
                      )}
                      {data.some(d => d.storage) && (
                        <Line type="monotone" dataKey="storage" stroke="#16a34a" strokeWidth={2} dot={false} name="Storage GB" />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ))}
            </div>
          )}

          {/* ── Recent alerts ──────────────────────────────────────────── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: '#333', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <AlertTriangle size={16} color="#92400e" /> Recent Alerts (last 30 days)
            </h2>
          </div>
          {alerts.length === 0 ? (
            <div style={{ padding: 24, color: '#15803d', fontSize: 13, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, marginBottom: 28 }}>
              ✓ No alerts fired in the last 30 days.
            </div>
          ) : (
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', marginBottom: 28 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#fafafa', borderBottom: '1px solid #eee' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#666' }}>Service</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#666' }}>Severity</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#666' }}>Message</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#666' }}>Fired</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#666' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map(a => {
                    const sev = SEVERITY_COLOR[a.severity] || SEVERITY_COLOR.warn;
                    return (
                      <tr key={a.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 600 }}>{SERVICE_LABEL[a.service] || a.service}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ padding: '3px 9px', borderRadius: 12, background: sev.bg, color: sev.fg, fontSize: 11, fontWeight: 600 }}>{sev.label}</span>
                        </td>
                        <td style={{ padding: '10px 12px', color: '#555' }}>{a.message}</td>
                        <td style={{ padding: '10px 12px', color: '#5c5c5c' }}>{new Date(a.fired_at).toLocaleString()}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                          <button onClick={() => clearAlert(a.id)} title="Clear alert"
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#666' }}>
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Manual costs (Railway etc) ─────────────────────────────── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: '#333', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <TrendingUp size={16} color={G} /> Manual Costs (Railway etc)
            </h2>
            <button onClick={() => setShowManual(true)}
              style={{ padding: '6px 12px', fontSize: 12, fontWeight: 600, background: G, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Plus size={12} /> Record Cost
            </button>
          </div>
          {(summary.manual || []).length === 0 ? (
            <div style={{ padding: 24, color: '#666', fontSize: 13, fontStyle: 'italic', background: '#fafafa', borderRadius: 8 }}>
              No manual cost entries yet. Click "Record Cost" to log Railway billing.
            </div>
          ) : (
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#fafafa', borderBottom: '1px solid #eee' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#666' }}>Service</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#666' }}>Month</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#666' }}>Cost (USD)</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#666' }}>Note</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#666' }}>Recorded</th>
                  </tr>
                </thead>
                <tbody>
                  {(summary.manual || []).map(m => (
                    <tr key={m.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>{SERVICE_LABEL[m.service] || m.service}</td>
                      <td style={{ padding: '10px 12px' }}>{m.month_label}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>${Number(m.cost_usd).toFixed(2)}</td>
                      <td style={{ padding: '10px 12px', color: '#666' }}>{m.note || '—'}</td>
                      <td style={{ padding: '10px 12px', color: '#5c5c5c' }}>{new Date(m.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Manual cost entry modal ────────────────────────────────── */}
          {showManual && (
            <div role="dialog" aria-modal="true"
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}>
              <div style={{ background: '#fff', borderRadius: 14, padding: 24, maxWidth: 480, width: '100%' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px' }}>Record Manual Cost</h3>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#444', display: 'block', marginBottom: 4 }}>Service</label>
                <select value={manualForm.service} onChange={e => setManualForm({ ...manualForm, service: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', fontSize: 16, border: '1.5px solid #e5e7eb', borderRadius: 8, marginBottom: 12 }}>
                  <option value="railway">Railway</option>
                  <option value="vercel">Vercel</option>
                  <option value="cloudinary">Cloudinary</option>
                  <option value="openai">OpenAI</option>
                  <option value="other">Other</option>
                </select>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#444', display: 'block', marginBottom: 4 }}>Month (YYYY-MM)</label>
                <input type="text" placeholder="2026-05" value={manualForm.month_label}
                  onChange={e => setManualForm({ ...manualForm, month_label: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', fontSize: 16, border: '1.5px solid #e5e7eb', borderRadius: 8, marginBottom: 12 }} />
                <label style={{ fontSize: 12, fontWeight: 600, color: '#444', display: 'block', marginBottom: 4 }}>Cost (USD)</label>
                <input type="number" step="0.01" min="0" placeholder="104.00" value={manualForm.cost_usd}
                  onChange={e => setManualForm({ ...manualForm, cost_usd: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', fontSize: 16, border: '1.5px solid #e5e7eb', borderRadius: 8, marginBottom: 12 }} />
                <label style={{ fontSize: 12, fontWeight: 600, color: '#444', display: 'block', marginBottom: 4 }}>Note (optional)</label>
                <textarea value={manualForm.note} onChange={e => setManualForm({ ...manualForm, note: e.target.value })} rows={2}
                  style={{ width: '100%', padding: '10px 12px', fontSize: 16, border: '1.5px solid #e5e7eb', borderRadius: 8, marginBottom: 16, resize: 'vertical' }} />
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button onClick={() => setShowManual(false)}
                    style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600, background: '#fff', color: '#666', border: '1.5px solid #ccc', borderRadius: 8, cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button onClick={submitManual}
                    disabled={submitting || !manualForm.month_label || manualForm.cost_usd === ''}
                    style={{ padding: '8px 18px', fontSize: 13, fontWeight: 700, background: G, color: '#fff', border: 'none', borderRadius: 8, cursor: submitting ? 'wait' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
                    {submitting ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
