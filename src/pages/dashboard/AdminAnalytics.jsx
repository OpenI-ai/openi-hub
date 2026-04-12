/**
 * OpenI Hub — Admin Analytics Dashboard (Phase 24)
 * Platform-wide metrics with time-series charts, funnel, persona breakdown.
 * Admin-only page.
 */
import { useState, useEffect } from 'react';
import { analyticsAPI } from '../../services/api';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  Users, Target, TrendingUp, Building2, Loader2, BarChart3,
  ArrowUpRight, UserPlus, Link2, Briefcase,
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

  useEffect(() => {
    Promise.all([
      analyticsAPI.overview(),
      analyticsAPI.funnel(),
      analyticsAPI.personas(),
      analyticsAPI.featureAdoption(),
      analyticsAPI.timeseries({ metric: tsMetric, period: tsPeriod }),
    ]).then(([ov, fn, ps, fa, ts]) => {
      setOverview(ov);
      setFunnel(fn.funnel || []);
      setPersonas(ps.personas || []);
      setAdoption((fa.features || []).filter(f => f.users > 0).sort((a, b) => b.users - a.users));
      setTsData(ts.data || []);
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
      <h1 style={{ fontSize: 22, fontWeight: 700, color: DARK, marginBottom: 4 }}>Platform Analytics</h1>
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
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
    </div>
  );
}
