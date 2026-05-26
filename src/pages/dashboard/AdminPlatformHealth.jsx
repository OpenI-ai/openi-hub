import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { Users, UserCheck, TrendingUp, DollarSign, Database, Activity, AlertCircle, Loader2 } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import toast from 'react-hot-toast';

const G = '#C9A646';
const COLORS_PERSONA = ['#C9A646', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6', '#F97316', '#84CC16'];

function fmt(n) {
  if (typeof n !== 'number') return '0';
  return n.toLocaleString('en-IN');
}
function fmtINR(n) {
  return 'Rs ' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
}
function fmtUSD(n) {
  return '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function Tile({ icon: Icon, label, value, sub, color }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {Icon && <Icon size={12} style={{ color: color || G }} />}
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: color || '#111' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#9ca3af' }}>{sub}</div>}
    </div>
  );
}

function Section({ title, children, sub }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 4px', color: '#1f2937' }}>{title}</h3>
      {sub && <p style={{ fontSize: 11, color: '#6b7280', margin: '0 0 12px' }}>{sub}</p>}
      {children}
    </div>
  );
}

export default function AdminPlatformHealth() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const r = await adminAPI.platformHealth();
      setData(r);
    } catch (e) {
      console.error('[admin-platform-health]', e);
      toast.error('Failed to load: ' + (e?.message || 'unknown'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div style={{ padding: 40, display: 'flex', alignItems: 'center', gap: 8, color: '#6b7280' }}>
        <Loader2 size={16} className="animate-spin" /> Loading platform health...
      </div>
    );
  }

  if (!data) {
    return <div style={{ padding: 40, color: '#9ca3af' }}>No data available.</div>;
  }

  const u = data.users || {};
  const rev = data.revenue || { mtd: { inr: {}, usd: {} }, ytd: { inr: {}, usd: {} }, monthly_history_12mo: [] };
  const churn = data.churn || {};
  const generated = data.generated_at ? new Date(data.generated_at).toLocaleString('en-IN') : 'unknown';

  return (
    <div style={{ padding: '20px 24px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: '#1a1a1a' }}>Platform Health</h1>
        <span style={{ fontSize: 11, color: '#9ca3af' }}>As of {generated}</span>
      </div>

      <Section title="Real Signups" sub="Self-registered users (excludes bulk-imported directory substrate).">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
          <Tile icon={Users} label="Total claimed" value={fmt(u.total_claimed)} />
          <Tile icon={UserCheck} label="Active account" value={fmt(u.active_account)} sub="is_active=true" />
          <Tile icon={Activity} label="Active 30d" value={fmt(u.active_30d)} sub="last login" />
          <Tile icon={TrendingUp} label="Signups 7d" value={fmt(u.signups_7d)} />
          <Tile icon={TrendingUp} label="Signups 30d" value={fmt(u.signups_30d)} />
          <Tile icon={TrendingUp} label="Signups 90d" value={fmt(u.signups_90d)} />
        </div>
      </Section>

      <Section title="Directory" sub="Full ecosystem including bulk-seeded India startup substrate.">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <Tile icon={Database} label="Directory total" value={fmt(u.directory_total)} />
          <Tile icon={UserCheck} label="Claimed profiles" value={fmt(u.directory_claimed)} sub={u.directory_total ? Math.round((u.directory_claimed / u.directory_total) * 100) + '% claim rate' : ''} />
          <Tile icon={Database} label="Imported (seed)" value={fmt(u.directory_imported)} />
        </div>
      </Section>

      <Section title="Revenue" sub="Gross (captured) and Net (captured - refunded). FY = 1 Apr to now.">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
          <Tile icon={DollarSign} label="INR Month-to-date" value={fmtINR(rev.mtd?.inr?.gross || 0)} sub={(rev.mtd?.inr?.payment_count || 0) + ' payments'} />
          <Tile icon={DollarSign} label="INR Year-to-date" value={fmtINR(rev.ytd?.inr?.gross || 0)} sub={(rev.ytd?.inr?.payment_count || 0) + ' payments'} />
          <Tile icon={DollarSign} label="USD Month-to-date" value={fmtUSD(rev.mtd?.usd?.gross || 0)} sub={(rev.mtd?.usd?.payment_count || 0) + ' payments'} />
          <Tile icon={DollarSign} label="USD Year-to-date" value={fmtUSD(rev.ytd?.usd?.gross || 0)} sub={(rev.ytd?.usd?.payment_count || 0) + ' payments'} />
        </div>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 10 }}>Revenue by month (last 12)</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={rev.monthly_history_12mo || []} margin={{ top: 6, right: 8, bottom: 4, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="inr_gross" stackId="a" fill={G} name="INR" />
              <Bar dataKey="usd_gross" stackId="a" fill="#3B82F6" name="USD" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Section>

      <Section title="Churn early warning" sub="30-day forward + backward windows (matches Phase 113 reminder cadence).">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 12 }}>
          <Tile icon={AlertCircle} label="Active subs" value={fmt(data.paid_count || 0)} color={G} />
          <Tile icon={AlertCircle} label="Renewing in 30d" value={fmt(churn.renewing_30d || 0)} color={(churn.renewing_30d || 0) > 0 ? '#F59E0B' : '#10B981'} />
          <Tile icon={AlertCircle} label="Expired in last 30d" value={fmt(churn.expired_30d || 0)} color={(churn.expired_30d || 0) > 0 ? '#EF4444' : '#10B981'} />
        </div>
      </Section>

      <Section title="Signups timeline (90d)" sub="Daily real signups, canonical 11 personas only.">
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.signups_timeline || []} margin={{ top: 6, right: 8, bottom: 4, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke={G} strokeWidth={2} dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Section>

      <Section title="Persona breakdown" sub="Canonical 11 personas, claimed real signups only.">
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={data.persona_breakdown || []} dataKey="count" nameKey="role" cx="50%" cy="50%" outerRadius={100} innerRadius={50} label={(d) => d.role + ': ' + d.count} labelLine={false}>
                {(data.persona_breakdown || []).map((entry, i) => (
                  <Cell key={i} fill={COLORS_PERSONA[i % COLORS_PERSONA.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Section>
    </div>
  );
}
