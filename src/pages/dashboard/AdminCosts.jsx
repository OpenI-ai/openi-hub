import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { DollarSign, AlertTriangle, TrendingUp, Plus, RefreshCw, Trash2, Loader2 } from 'lucide-react';
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
};

export default function AdminCosts() {
  const [summary, setSummary] = useState({ daily: [], status: [], manual: [] });
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showManual, setShowManual] = useState(false);
  const [manualForm, setManualForm] = useState({ service: 'railway', month_label: '', cost_usd: '', note: '' });

  const load = async () => {
    setLoading(true);
    try {
      const [s, a] = await Promise.all([
        adminAPI.costsSummary(),
        adminAPI.costsAlerts(),
      ]);
      setSummary(s);
      setAlerts(a.alerts || []);
    } catch (e) {
      console.error('[admin-costs]', e);
      toast.error('Failed to load costs: ' + (e?.message || 'unknown'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const submitManual = async () => {
    try {
      await adminAPI.costsManual(manualForm);
      toast.success(`Recorded ${manualForm.service} cost for ${manualForm.month_label}`);
      setShowManual(false);
      setManualForm({ service: 'railway', month_label: '', cost_usd: '', note: '' });
      load();
    } catch (e) {
      toast.error(e?.message || 'Save failed');
    }
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
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
        <div style={{ textAlign: 'center', padding: 80, color: '#999' }}>
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
                    <div style={{ fontSize: 13, fontStyle: 'italic', color: '#888', marginBottom: 4 }}>
                      {s.service === 'railway' ? 'Manual tracking' : 'No data'}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: '#666', lineHeight: 1.4 }}>{s.message}</div>
                </div>
              );
            })}
          </div>

          {/* ── 30-day trend charts (per service) ───────────────────────── */}
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px', color: '#333' }}>30-Day Trend</h2>
          {Object.keys(seriesByService).length === 0 ? (
            <div style={{ padding: 24, color: '#999', fontSize: 13, fontStyle: 'italic', background: '#fafafa', borderRadius: 8, marginBottom: 28 }}>
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
            <div style={{ padding: 24, color: '#16a34a', fontSize: 13, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, marginBottom: 28 }}>
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
                        <td style={{ padding: '10px 12px', color: '#888' }}>{new Date(a.fired_at).toLocaleString()}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                          <button onClick={() => clearAlert(a.id)} title="Clear alert"
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#999' }}>
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
            <div style={{ padding: 24, color: '#999', fontSize: 13, fontStyle: 'italic', background: '#fafafa', borderRadius: 8 }}>
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
                      <td style={{ padding: '10px 12px', color: '#888' }}>{new Date(m.created_at).toLocaleDateString()}</td>
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
                  style={{ width: '100%', padding: '10px 12px', fontSize: 13, border: '1.5px solid #e5e7eb', borderRadius: 8, marginBottom: 12 }}>
                  <option value="railway">Railway</option>
                  <option value="vercel">Vercel</option>
                  <option value="cloudinary">Cloudinary</option>
                  <option value="openai">OpenAI</option>
                  <option value="other">Other</option>
                </select>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#444', display: 'block', marginBottom: 4 }}>Month (YYYY-MM)</label>
                <input type="text" placeholder="2026-05" value={manualForm.month_label}
                  onChange={e => setManualForm({ ...manualForm, month_label: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', fontSize: 13, border: '1.5px solid #e5e7eb', borderRadius: 8, marginBottom: 12 }} />
                <label style={{ fontSize: 12, fontWeight: 600, color: '#444', display: 'block', marginBottom: 4 }}>Cost (USD)</label>
                <input type="number" step="0.01" min="0" placeholder="104.00" value={manualForm.cost_usd}
                  onChange={e => setManualForm({ ...manualForm, cost_usd: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', fontSize: 13, border: '1.5px solid #e5e7eb', borderRadius: 8, marginBottom: 12 }} />
                <label style={{ fontSize: 12, fontWeight: 600, color: '#444', display: 'block', marginBottom: 4 }}>Note (optional)</label>
                <textarea value={manualForm.note} onChange={e => setManualForm({ ...manualForm, note: e.target.value })} rows={2}
                  style={{ width: '100%', padding: '10px 12px', fontSize: 13, border: '1.5px solid #e5e7eb', borderRadius: 8, marginBottom: 16, resize: 'vertical' }} />
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button onClick={() => setShowManual(false)}
                    style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600, background: '#fff', color: '#666', border: '1.5px solid #ccc', borderRadius: 8, cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button onClick={submitManual}
                    disabled={!manualForm.month_label || manualForm.cost_usd === ''}
                    style={{ padding: '8px 18px', fontSize: 13, fontWeight: 700, background: G, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                    Save
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
