/**
 * OpenI Hub — Admin Analytics Dashboard (Phase 24)
 * Platform-wide metrics with time-series charts, funnel, persona breakdown.
 * Admin-only page.
 */
import { useState, useEffect } from 'react';
import { analyticsAPI, adminAPI } from '../../services/api';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Users, Target, Building2, Loader2,
  ArrowUpRight, Link2, Sparkles, AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

const G = '#D5AA5B';
const DARK = '#0D2137';
const card = { background: '#fff', border: '1px solid #eee', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: 20 };

const PIE_COLORS = ['#16a34a', '#D5AA5B', '#7c3aed'];
const BAR_COLORS = ['#3b82f6', '#16a34a', '#f59e0b', '#ec4899', '#7c3aed', '#14b8a6', '#ef4444', '#0ea5e9', '#8b5cf6', '#0d9488', '#D5AA5B'];

function StatCard({ icon: Icon, label, value, sub, color = G }) {
  return (
    <div style={{ ...card, display: 'flex', gap: 12, alignItems: 'center' }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color: DARK }}>{value}</div>
        <div style={{ fontSize: 12, color: '#888' }}>{label}</div>
        {sub && <div style={{ fontSize: 10, color: '#16a34a', display: 'flex', alignItems: 'center', gap: 2 }}><ArrowUpRight size={10} /> {sub}</div>}
      </div>
    </div>
  );
}

export default function AdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [funnel, setFunnel] = useState([]);
  const [personas, setPersonas] = useState([]);
  const [adoption, setAdoption] = useState([]);
  const [tsData, setTsData] = useState([]);
  const [tsMetric, setTsMetric] = useState('registrations');
  const [tsPeriod, setTsPeriod] = useState('30d');
  // P7d (s24): profile AI score distribution. Loaded in same Promise.all but
  // tolerant of missing endpoint (older backend deploys) — null = "skip panel".
  const [aiDist, setAiDist] = useState(null);
  // s34 P1.3: Stage B cluster_boost telemetry (s30 backend endpoint).
  // Same tolerance pattern — null = older backend, skip panel.
  const [boostImpact, setBoostImpact] = useState(null);
  // s38: click-through analytics (s36 backend endpoint). null = older backend.
  const [clickImpact, setClickImpact] = useState(null);

  useEffect(() => {
    Promise.all([
      analyticsAPI.overview(),
      analyticsAPI.funnel(),
      analyticsAPI.personas(),
      analyticsAPI.featureAdoption(),
      analyticsAPI.timeseries({ metric: tsMetric, period: tsPeriod }),
      adminAPI.profileScoreDistribution().catch(() => null),  // tolerate 404 on older backends
      adminAPI.clusterBoostImpact(30).catch(() => null),      // s34: tolerate 404
      adminAPI.clusterClickImpact(30).catch(() => null),      // s38: tolerate 404
    ]).then(([ov, fn, ps, fa, ts, dist, boost, click]) => {
      setOverview(ov);
      setFunnel(fn.funnel || []);
      setPersonas(ps.personas || []);
      setAdoption((fa.features || []).filter(f => f.users > 0).sort((a, b) => b.users - a.users));
      setTsData(ts.data || []);
      setAiDist(dist);
      setBoostImpact(boost);
      setClickImpact(click);
    }).catch(err => toast.error(err.message)).finally(() => setLoading(false));
  }, []);

  // Reload timeseries on metric/period change
  useEffect(() => {
    if (!loading) {
      analyticsAPI.timeseries({ metric: tsMetric, period: tsPeriod })
        .then(ts => setTsData(ts.data || []))
        .catch(() => {});
    }
  }, [tsMetric, tsPeriod, loading]);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Loader2 size={28} className="spin" style={{ color: '#aaa' }} /></div>;
  }

  const ov = overview || {};
  const planDist = [
    { name: 'Free', value: parseInt(ov.plan_distribution?.free) || 0 },
    { name: 'Pro', value: parseInt(ov.plan_distribution?.pro) || 0 },
    { name: 'Enterprise', value: parseInt(ov.plan_distribution?.enterprise) || 0 },
  ].filter(d => d.value > 0);

  // Aggregate timeseries by date (collapse role/status groups)
  const tsAggregated = Object.values(
    tsData.reduce((acc, r) => {
      const d = r.date?.split('T')[0] || r.date;
      if (!acc[d]) acc[d] = { date: d, count: 0 };
      acc[d].count += parseInt(r.count) || 0;
      return acc;
    }, {})
  );

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <div id="tour-page-admin-analytics">
        <h1 style={{ fontSize: 22, fontWeight: 700, color: DARK, marginBottom: 4 }}>Platform Analytics</h1>
      </div>
      <p style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>Admin dashboard — platform-wide metrics and trends</p>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 24 }}>
        <StatCard icon={Users} label="Total Users" value={ov.users?.total || 0} sub={`+${ov.users?.new_7d || 0} this week`} color="#3b82f6" />
        <StatCard icon={Target} label="Challenges" value={ov.challenges?.total || 0} sub={`${ov.challenges?.open || 0} open`} color="#16a34a" />
        <StatCard icon={Link2} label="Connections" value={ov.connections?.total || 0} sub={`${ov.connections?.accepted || 0} accepted`} color="#ec4899" />
        <StatCard icon={Building2} label="Organizations" value={ov.organizations?.total || 0} sub={`${ov.organizations?.filled_seats || 0} seats filled`} color="#7c3aed" />
      </div>

      {/* Row: Time Series + Plan Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Time Series */}
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Trends</h3>
            <div style={{ display: 'flex', gap: 4 }}>
              {['registrations', 'challenges', 'applications', 'connections'].map(m => (
                <button key={m} onClick={() => setTsMetric(m)}
                  style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, border: tsMetric === m ? `1px solid ${G}` : '1px solid #eee', background: tsMetric === m ? '#fffbeb' : '#fff', color: tsMetric === m ? G : '#999', cursor: 'pointer', textTransform: 'capitalize' }}>
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
            {['7d', '30d', '90d'].map(p => (
              <button key={p} onClick={() => setTsPeriod(p)}
                style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, border: tsPeriod === p ? `1px solid ${G}` : '1px solid #eee', background: tsPeriod === p ? '#fffbeb' : '#fff', color: tsPeriod === p ? G : '#bbb', cursor: 'pointer' }}>
                {p}
              </button>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={tsAggregated}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d?.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke={G} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Plan Distribution Pie */}
        <div style={card}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Plan Distribution</h3>
          {planDist.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={planDist} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {planDist.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: 40, color: '#ccc', fontSize: 13 }}>No data</div>
          )}
        </div>
      </div>

      {/* Row: Conversion Funnel + Feature Adoption */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        {/* Funnel */}
        <div style={card}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Conversion Funnel</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={funnel} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis dataKey="stage" type="category" tick={{ fontSize: 10 }} width={120} />
              <Tooltip />
              <Bar dataKey="count" fill={G} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Feature Adoption */}
        <div style={card}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Feature Adoption</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={adoption} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={130} />
              <Tooltip />
              <Bar dataKey="users" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Persona Breakdown Table */}
      <div style={card}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Persona Breakdown</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eee' }}>
                <th style={{ textAlign: 'left', padding: '8px 10px', color: '#999', fontWeight: 600 }}>Persona</th>
                <th style={{ textAlign: 'right', padding: '8px 10px', color: '#999', fontWeight: 600 }}>Users</th>
                <th style={{ textAlign: 'right', padding: '8px 10px', color: '#999', fontWeight: 600 }}>Onboarded</th>
                <th style={{ textAlign: 'right', padding: '8px 10px', color: '#999', fontWeight: 600 }}>Profile Done</th>
                <th style={{ textAlign: 'right', padding: '8px 10px', color: '#999', fontWeight: 600 }}>Pro</th>
                <th style={{ textAlign: 'right', padding: '8px 10px', color: '#999', fontWeight: 600 }}>Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {personas.map((p, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f5f5f5' }}>
                  <td style={{ padding: '8px 10px', fontWeight: 600, textTransform: 'capitalize' }}>{p.role?.replace('_', ' ')}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right' }}>{p.count}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', color: '#16a34a' }}>{p.onboarded}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right' }}>{p.profile_done}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', color: G }}>{p.pro_users}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', color: '#7c3aed' }}>{p.enterprise_users}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* P7d (s24) — Profile AI Quality distribution */}
      {aiDist && <ProfileAiPanel data={aiDist} />}

      {/* s34 P1.3 — Stage B cluster_boost impact (s30 telemetry surfaced) */}
      {boostImpact && <BoostImpactPanel data={boostImpact} />}

      {/* s38 — Click-through analytics (s36 telemetry surfaced) */}
      {clickImpact && <ClickImpactPanel data={clickImpact} />}
    </div>
  );
}

// ── P7d: Profile AI Quality panel ────────────────────────────
// Shows histogram (10 buckets), per-persona stats, bottom-20 outliers, and
// auto-vs-manual intent split for the last 30 days. Tolerant of empty data
// (renders "no analyses yet" rather than crashing).
function ProfileAiPanel({ data }) {
  const summary = data.summary || {};
  const hist = data.histogram || [];
  const perPersona = data.per_persona || [];
  const outliers = data.outliers || [];
  const intent30d = data.intent_30d || [];

  // Map width_bucket output (1..10) to label "0-10","10-20",… "90-100".
  // Bucket 11 (=100 exactly) and bucket 0 (out-of-range) are merged into "90-100".
  const histChart = Array.from({ length: 10 }, (_, i) => {
    const lo = i * 10;
    const hi = lo + 10;
    const label = `${lo}-${hi}`;
    let n = 0;
    for (const row of hist) {
      const b = parseInt(row.bucket);
      if (b === i + 1 || (i === 9 && (b === 10 || b === 11))) n += parseInt(row.n) || 0;
    }
    return { range: label, count: n };
  });

  const totalAnalyzed = parseInt(summary.total_analyzed) || 0;

  return (
    <div style={{ ...card, marginTop: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <Sparkles size={16} style={{ color: G }} />
        <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Profile AI Quality</h3>
        <span style={{ fontSize: 11, color: '#888', marginLeft: 'auto' }}>
          {totalAnalyzed} analyzed · mean {summary.overall_mean ?? '—'} · median {summary.overall_median ?? '—'}
        </span>
      </div>
      <p style={{ fontSize: 11, color: '#888', marginTop: 0, marginBottom: 16 }}>
        Phase 7 GPT quality scores across all personas. Helps spot low-quality cohorts and individual outliers for coaching nudges.
      </p>

      {totalAnalyzed === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#bbb', fontSize: 13 }}>
          No AI analyses yet. Scores populate as users click "Re-analyze" or save profiles (auto-compute).
        </div>
      ) : (
        <>
          {/* Row 1: Histogram + Intent breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 6 }}>Score Distribution (0–100, 10 buckets)</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={histChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="range" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill={G} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 6 }}>Last 30d activity</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #eee', color: '#999' }}>
                    <th style={{ textAlign: 'left', padding: '4px 6px', fontWeight: 600 }}>Trigger</th>
                    <th style={{ textAlign: 'right', padding: '4px 6px', fontWeight: 600 }}>Calls</th>
                    <th style={{ textAlign: 'right', padding: '4px 6px', fontWeight: 600 }}>Success</th>
                    <th style={{ textAlign: 'right', padding: '4px 6px', fontWeight: 600 }}>Latency</th>
                  </tr>
                </thead>
                <tbody>
                  {intent30d.length === 0 ? (
                    <tr><td colSpan={4} style={{ padding: 12, textAlign: 'center', color: '#ccc' }}>No data</td></tr>
                  ) : intent30d.map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f5f5f5' }}>
                      <td style={{ padding: '4px 6px', textTransform: 'capitalize', fontWeight: 600 }}>{r.intent}</td>
                      <td style={{ padding: '4px 6px', textAlign: 'right' }}>{r.n}</td>
                      <td style={{ padding: '4px 6px', textAlign: 'right', color: '#16a34a' }}>{r.success_n}</td>
                      <td style={{ padding: '4px 6px', textAlign: 'right', color: '#888' }}>{r.avg_latency_ms ? `${Math.round(r.avg_latency_ms)}ms` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Row 2: Per-persona stats */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 6 }}>Per-persona quality stats</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #eee', color: '#999' }}>
                    <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 600 }}>Persona</th>
                    <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 600 }}>Total</th>
                    <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 600 }}>Analyzed</th>
                    <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 600 }}>Coverage</th>
                    <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 600 }}>Mean</th>
                    <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 600 }}>Median</th>
                    <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 600 }}>Range</th>
                  </tr>
                </thead>
                <tbody>
                  {perPersona.map((p, i) => {
                    const cov = p.total > 0 ? Math.round((p.analyzed / p.total) * 100) : 0;
                    const meanColor = p.mean >= 70 ? '#16a34a' : p.mean >= 40 ? '#f59e0b' : p.mean != null ? '#ef4444' : '#bbb';
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid #f5f5f5' }}>
                        <td style={{ padding: '6px 8px', fontWeight: 600, textTransform: 'capitalize' }}>{(p.persona_type || '—').replace(/_/g, ' ')}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right' }}>{p.total}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right' }}>{p.analyzed}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', color: cov >= 50 ? '#16a34a' : '#888' }}>{cov}%</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700, color: meanColor }}>{p.mean ?? '—'}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right' }}>{p.median ?? '—'}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', color: '#888' }}>
                          {p.min != null && p.max != null ? `${p.min}–${p.max}` : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Row 3: Bottom outliers */}
          {outliers.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <AlertCircle size={12} style={{ color: '#ef4444' }} />
                <div style={{ fontSize: 12, fontWeight: 600, color: '#555' }}>Bottom 20 outliers — coaching candidates</div>
              </div>
              <div style={{ overflowX: 'auto', maxHeight: 320, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #eee', color: '#999', position: 'sticky', top: 0, background: '#fff' }}>
                      <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 600 }}>User</th>
                      <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 600 }}>Persona</th>
                      <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 600 }}>AI Score</th>
                      <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 600 }}>Completeness</th>
                      <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 600 }}>Profile</th>
                    </tr>
                  </thead>
                  <tbody>
                    {outliers.map((o, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f5f5f5' }}>
                        <td style={{ padding: '6px 8px' }}>
                          <div style={{ fontWeight: 600 }}>{o.display_name || `User ${o.user_id}`}</div>
                          <div style={{ fontSize: 10, color: '#999' }}>{o.email}</div>
                        </td>
                        <td style={{ padding: '6px 8px', textTransform: 'capitalize', color: '#666' }}>{(o.persona_type || '—').replace(/_/g, ' ')}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700, color: '#ef4444' }}>{o.profile_score_ai}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', color: '#888' }}>{o.profile_score ?? '—'}</td>
                        <td style={{ padding: '6px 8px' }}>
                          <a href={`/profile/${o.user_id}`} target="_blank" rel="noreferrer" style={{ fontSize: 10, color: G, textDecoration: 'none', fontWeight: 600 }}>
                            View →
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── s34 P1.3: Stage B cluster_boost impact panel ─────────────
// Surfaces the s30 telemetry: how often the cluster_boost actually changes
// the top-10 ranking, broken down by persona, and which anchor clusters get
// picked most often. Backend endpoint: GET /admin/clusters/boost-impact.
function BoostImpactPanel({ data }) {
  const summary = data.summary || {};
  const perPersona = data.per_persona || [];
  const topAnchors = data.top_anchor_clusters || [];
  const windowDays = data.window_days || 30;

  const pctLift = summary.total_calls > 0
    ? Math.round((summary.calls_with_lift / summary.total_calls) * 100)
    : 0;

  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: DARK }}>
          Cluster Boost Impact <span style={{ fontSize: 11, fontWeight: 400, color: '#888' }}>· last {windowDays}d</span>
        </h3>
        <span style={{ fontSize: 10, color: '#aaa' }}>Stage B telemetry</span>
      </div>

      {/* Headline KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, marginBottom: 16 }}>
        <Kpi label="Total calls" value={summary.total_calls || 0} />
        <Kpi label="Calls with lift" value={`${summary.calls_with_lift || 0} (${pctLift}%)`} color={pctLift >= 50 ? '#16a34a' : '#f59e0b'} />
        <Kpi label="Avg # boosted/call" value={summary.avg_n_boosted ?? '—'} />
        <Kpi label="Avg # lifted/call" value={summary.avg_n_lifted ?? '—'} />
        <Kpi label="Max lift" value={summary.overall_max_lift ?? '—'} color={G} bold />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        {/* Per-persona table */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 6 }}>Per-persona</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #eee', color: '#999' }}>
                  <th style={{ textAlign: 'left',  padding: '6px 8px', fontWeight: 600 }}>Persona</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 600 }}>Calls</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 600 }}>% w/ lift</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 600 }}>Avg boosted</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 600 }}>Avg lifted</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 600 }}>Max lift</th>
                </tr>
              </thead>
              <tbody>
                {perPersona.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: 16, textAlign: 'center', color: '#ccc' }}>No recommendation calls yet</td></tr>
                ) : perPersona.map((p, i) => {
                  const pct = parseFloat(p.pct_calls_with_lift) || 0;
                  const liftColor = p.max_lift >= 50 ? '#16a34a' : p.max_lift >= 10 ? '#f59e0b' : p.max_lift > 0 ? '#888' : '#ccc';
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #f5f5f5' }}>
                      <td style={{ padding: '6px 8px', fontWeight: 600, textTransform: 'capitalize' }}>{p.persona_role}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>{p.total_calls}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', color: pct >= 50 ? '#16a34a' : '#888' }}>{pct.toFixed(0)}%</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>{p.avg_n_boosted ?? '—'}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>{p.avg_n_lifted ?? '—'}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700, color: liftColor }}>{p.max_lift ?? '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ fontSize: 10, color: '#aaa', marginTop: 8, lineHeight: 1.5 }}>
            <b>Lift</b> = ranks a startup gained because of cluster boost. High max_lift on sparse-overlap personas (investor, academia) shows the bridge is doing real work.
          </div>
        </div>

        {/* Top anchor clusters */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 6 }}>Top anchor clusters</div>
          <div style={{ overflowY: 'auto', maxHeight: 280 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #eee', color: '#999' }}>
                  <th style={{ textAlign: 'left',  padding: '4px 6px', fontWeight: 600 }}>Cluster</th>
                  <th style={{ textAlign: 'right', padding: '4px 6px', fontWeight: 600 }}>Picks</th>
                  <th style={{ textAlign: 'right', padding: '4px 6px', fontWeight: 600 }}>Members</th>
                </tr>
              </thead>
              <tbody>
                {topAnchors.length === 0 ? (
                  <tr><td colSpan={3} style={{ padding: 12, textAlign: 'center', color: '#ccc' }}>None</td></tr>
                ) : topAnchors.map((c, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ padding: '4px 6px' }}>
                      <div style={{ fontWeight: 600, color: DARK }}>{c.cluster_label || `#${c.cluster_id}`}</div>
                      <div style={{ fontSize: 9, color: '#aaa' }}>id {c.cluster_id}</div>
                    </td>
                    <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 700, color: G }}>{c.picks}</td>
                    <td style={{ padding: '4px 6px', textAlign: 'right', color: '#888' }}>{c.member_count ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// Tiny KPI tile used inside BoostImpactPanel
function Kpi({ label, value, color = '#1a1a1a', bold = false }) {
  return (
    <div style={{ background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 8, padding: '8px 10px' }}>
      <div style={{ fontSize: 9, color: '#888', textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: bold ? 800 : 600, color, marginTop: 2 }}>{value}</div>
    </div>
  );
}

// ── s38: Click-through analytics panel ──────────────────────
// Surfaces s36 telemetry: how often users click recommended startups
// (CTR), broken down by persona, plus top-clicked startups + clusters,
// plus a boosted-vs-unboosted CTR comparison (does cluster_boost convert?).
// Backend endpoint: GET /admin/clusters/click-impact.
function ClickImpactPanel({ data }) {
  const perPersona = data.per_persona || [];
  const topStartups = data.top_clicked_startups || [];
  const topClusters = data.top_clicked_clusters || [];
  const lift = data.lift_effect || {};
  const windowDays = data.window_days || 30;

  // Aggregate totals across all personas in the window.
  const totalImpressions = perPersona.reduce((s, p) => s + (parseInt(p.n_impressions, 10) || 0), 0);
  const totalClicks = perPersona.reduce((s, p) => s + (parseInt(p.n_clicks, 10) || 0), 0);
  const totalUniqueClickers = perPersona.reduce((s, p) => s + (parseInt(p.unique_clickers, 10) || 0), 0);
  const overallCtr = totalImpressions > 0
    ? ((totalClicks * 100) / totalImpressions).toFixed(2)
    : '0.00';

  // Lift effect: did boost actually convert?
  const boostedCtr = parseFloat(lift.boosted_ctr_pct);
  const unboostedCtr = parseFloat(lift.unboosted_ctr_pct);
  const liftDelta = (Number.isFinite(boostedCtr) && Number.isFinite(unboostedCtr))
    ? (boostedCtr - unboostedCtr).toFixed(2)
    : null;

  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: DARK }}>
          Click-Through Analytics <span style={{ fontSize: 11, fontWeight: 400, color: '#888' }}>· last {windowDays}d</span>
        </h3>
        <span style={{ fontSize: 10, color: '#aaa' }}>s36 telemetry</span>
      </div>

      {/* Headline KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, marginBottom: 16 }}>
        <Kpi label="Impressions" value={totalImpressions.toLocaleString()} />
        <Kpi label="Clicks" value={totalClicks.toLocaleString()} />
        <Kpi label="Overall CTR" value={`${overallCtr}%`} color={parseFloat(overallCtr) >= 5 ? '#16a34a' : '#1a1a1a'} bold />
        <Kpi label="Unique clickers" value={totalUniqueClickers} />
        <Kpi
          label="Boost lift Δ"
          value={liftDelta != null ? `${liftDelta > 0 ? '+' : ''}${liftDelta}%` : '—'}
          color={liftDelta != null && parseFloat(liftDelta) > 0 ? '#16a34a' : liftDelta != null && parseFloat(liftDelta) < 0 ? '#ef4444' : '#888'}
          bold
        />
      </div>

      {/* Boosted vs Unboosted CTR comparison */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8, marginBottom: 16 }}>
        <div style={{ background: '#fff7e6', border: '1px solid #ffe7b0', borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ fontSize: 10, color: '#a06600', textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: 600 }}>Boosted impressions</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: DARK, marginTop: 4 }}>
            {(parseInt(lift.boosted_impressions, 10) || 0).toLocaleString()} impressions →
            {' '}{parseInt(lift.boosted_clicks, 10) || 0} clicks
            {' '}<span style={{ color: '#a06600' }}>({lift.boosted_ctr_pct ?? '—'}%)</span>
          </div>
        </div>
        <div style={{ background: '#f5f5f5', border: '1px solid #eee', borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ fontSize: 10, color: '#666', textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: 600 }}>Unboosted impressions</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: DARK, marginTop: 4 }}>
            {(parseInt(lift.unboosted_impressions, 10) || 0).toLocaleString()} impressions →
            {' '}{parseInt(lift.unboosted_clicks, 10) || 0} clicks
            {' '}<span style={{ color: '#666' }}>({lift.unboosted_ctr_pct ?? '—'}%)</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        {/* Per-persona table */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 6 }}>Per-persona</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #eee', color: '#999' }}>
                  <th style={{ textAlign: 'left',  padding: '6px 8px', fontWeight: 600 }}>Persona</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 600 }}>Calls</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 600 }}>Impressions</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 600 }}>Clicks</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 600 }}>CTR</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 600 }}>Boosted</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 600 }}>Users</th>
                </tr>
              </thead>
              <tbody>
                {perPersona.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: 16, textAlign: 'center', color: '#ccc' }}>No data yet</td></tr>
                ) : perPersona.map((p, i) => {
                  const ctr = parseFloat(p.ctr_pct) || 0;
                  const ctrColor = ctr >= 5 ? '#16a34a' : ctr >= 1 ? '#f59e0b' : ctr > 0 ? '#888' : '#ccc';
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #f5f5f5' }}>
                      <td style={{ padding: '6px 8px', fontWeight: 600, textTransform: 'capitalize' }}>{p.persona_role}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>{p.n_calls}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', color: '#888' }}>{p.n_impressions}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>{p.n_clicks}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700, color: ctrColor }}>{p.ctr_pct ?? '—'}%</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', color: '#a06600' }}>{p.n_boosted_clicks}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', color: '#888' }}>{p.unique_clickers}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ fontSize: 10, color: '#aaa', marginTop: 8, lineHeight: 1.5 }}>
            <b>CTR</b> = clicks ÷ impressions. <b>Boosted</b> = clicks where the row had cluster_boost &gt; 0. Higher boosted-CTR than baseline means cluster bridge is converting, not just decorating.
          </div>
        </div>

        {/* Right column: top startups + clusters stacked */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 6 }}>Top clicked startups</div>
          <div style={{ overflowY: 'auto', maxHeight: 200, marginBottom: 12 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <tbody>
                {topStartups.length === 0 ? (
                  <tr><td style={{ padding: 8, textAlign: 'center', color: '#ccc' }}>None</td></tr>
                ) : topStartups.slice(0, 8).map((s, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ padding: '4px 6px' }}>
                      <div style={{ fontWeight: 600, color: DARK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
                        {s.company_name || `#${s.user_id}`}
                      </div>
                    </td>
                    <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 700, color: G }}>{s.n_clicks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 6 }}>Top clicked clusters</div>
          <div style={{ overflowY: 'auto', maxHeight: 200 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <tbody>
                {topClusters.length === 0 ? (
                  <tr><td style={{ padding: 8, textAlign: 'center', color: '#ccc' }}>None</td></tr>
                ) : topClusters.slice(0, 8).map((c, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ padding: '4px 6px' }}>
                      <div style={{ fontWeight: 600, color: DARK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
                        {c.cluster_label || `#${c.cluster_id}`}
                      </div>
                    </td>
                    <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 700, color: G }}>{c.n_clicks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
