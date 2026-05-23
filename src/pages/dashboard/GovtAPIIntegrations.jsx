import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { govtIntegrationAPI } from '../../services/api';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import {
  Globe, Link2, CheckCircle2, AlertCircle, Clock, RefreshCw,
  Shield, ExternalLink, Settings,
  Activity, Lock, Key,
} from 'lucide-react';

const G = '#D5AA5B';
const GH = '#C9983F';

const card = {
  background: '#ffffff',
  border: '1px solid #eeeeee',
  borderRadius: 14,
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
};

// INTEGRATIONS are loaded from API

const STATUS_STYLE = {
  Connected:       { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0',              icon: CheckCircle2 },
  'Pending Setup': { bg: '#fff8ec', color: G,          border: 'rgba(213,170,91,0.4)', icon: Clock },
  Inactive:        { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0',              icon: AlertCircle },
  Error:           { bg: '#fef2f2', color: '#dc2626', border: '#fecaca',              icon: AlertCircle },
};

export default function GovtAPIIntegrations() {
  const [selected, setSelected] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Default color palette for integrations
  const DEFAULT_COLORS = ['#ea580c', '#0284c7', '#16a34a', '#9333ea', '#dc2626', '#0284c7', '#64748b', '#64748b'];
  const DEFAULT_BGS = ['#fff7ed', '#f0f9ff', '#f0fdf4', '#fdf4ff', '#fef2f2', '#f0f9ff', '#f8fafc', '#f8fafc'];

  useEffect(() => {
    govtIntegrationAPI.list()
      .then(data => {
        const items = data.integrations || data || [];
        const normalized = items.map((integ, idx) => ({
          id: integ.id,
          name: integ.name || '',
          description: integ.description || '',
          status: integ.status || 'Inactive',
          category: integ.category || 'Government Portal',
          endpoint: integ.endpoint || integ.api_endpoint || '',
          auth: integ.auth || integ.auth_method || 'API Key',
          lastSync: integ.last_sync || integ.last_synced_at || 'Never',
          callsToday: integ.calls_today || integ.api_calls_today || 0,
          logo: integ.logo || (integ.name ? integ.name.split(' ').map(w => w[0]).join('').slice(0, 2) : '??'),
          color: integ.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
          bg: integ.bg || DEFAULT_BGS[idx % DEFAULT_BGS.length],
          dataPoints: integ.data_points || integ.dataPoints || [],
        }));
        setIntegrations(normalized);
      })
      .catch(err => { toast.error(err.message || 'Failed to load integrations'); setIntegrations([]); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSkeleton type="card" />;

  const categories = ['All', ...new Set(integrations.map(i => i.category))];
  const filtered = integrations.filter(i => categoryFilter === 'All' || i.category === categoryFilter);

  const connected   = integrations.filter(i => i.status === 'Connected').length;
  const totalCalls  = integrations.reduce((s, i) => s + (i.callsToday || 0), 0);

  if (selected) return <IntegrationDetail integration={selected} onBack={() => setSelected(null)} onSync={(id) => {
    govtIntegrationAPI.sync(id)
      .then(() => toast.success('Sync initiated'))
      .catch(err => toast.error(err.message || 'Sync failed'));
  }} />;

  return (
    <div style={{ padding: 28, maxWidth: 1200, background: '#f5f5f5', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, color: '#1a1a1a', fontSize: 22, fontWeight: 700 }}>Government API Integrations</h1>
          <p style={{ margin: '4px 0 0', color: '#888', fontSize: 13 }}>Connect with central & state government databases for seamless startup verification</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', background: '#f5f5f5', color: '#555', border: '1px solid #eee', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
            <RefreshCw size={12} /> Sync All
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', background: G, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, boxShadow: '0 2px 8px rgba(213,170,91,0.3)' }}>
            <Link2 size={12} /> Add Integration
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 22 }}>
        {[
          { label: 'Total APIs',    value: integrations.length, icon: Globe,         bg: '#fff8ec', fg: G },
          { label: 'Connected',     value: connected,           icon: CheckCircle2,  bg: '#f0fdf4', fg: '#16a34a' },
          { label: 'Pending Setup', value: integrations.filter(i => i.status === 'Pending Setup').length, icon: Clock, bg: '#fff8ec', fg: '#ea580c' },
          { label: "Today's Calls", value: totalCalls,          icon: Activity,      bg: '#f0f9ff', fg: '#0284c7' },
        ].map(({ label, value, icon: Icon, bg, fg }) => (
          <div key={label} style={{ ...card, padding: 16 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
              <Icon size={15} color={fg} />
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a' }}>{value}</div>
            <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
        {categories.map(c => (
          <button key={c} onClick={() => setCategoryFilter(c)} style={{
            padding: '6px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, border: '1.5px solid', cursor: 'pointer',
            background: categoryFilter === c ? G : '#fff', color: categoryFilter === c ? '#fff' : '#666', borderColor: categoryFilter === c ? G : '#eee',
          }}>{c}</button>
        ))}
      </div>

      {/* Integration cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
        {filtered.map(integ => {
          const ss = STATUS_STYLE[integ.status] || STATUS_STYLE['Inactive'];
          const SIcon = ss.icon;
          return (
            <div key={integ.id}
              onClick={() => setSelected(integ)}
              style={{ ...card, padding: 22, cursor: 'pointer', transition: 'box-shadow 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 11, background: integ.bg, color: integ.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15, border: `1.5px solid ${integ.color}22`, flexShrink: 0 }}>{integ.logo}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{integ.name}</div>
                    <div style={{ fontSize: 11, color: '#888' }}>{integ.category}</div>
                  </div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`, display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                  <SIcon size={8} />{integ.status}
                </span>
              </div>

              <p style={{ margin: '0 0 14px', color: '#666', fontSize: 12, lineHeight: 1.5 }}>{integ.description}</p>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                {integ.dataPoints.slice(0, 3).map(dp => (
                  <span key={dp} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: '#f5f5f5', color: '#888', border: '1px solid #eee' }}>{dp}</span>
                ))}
                {integ.dataPoints.length > 3 && (
                  <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: '#f5f5f5', color: '#aaa', border: '1px solid #eee' }}>+{integ.dataPoints.length - 3} more</span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid #f5f5f5' }}>
                <div style={{ display: 'flex', gap: 14 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>{integ.callsToday}</div>
                    <div style={{ fontSize: 10, color: '#aaa' }}>calls today</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#555' }}>{integ.auth}</div>
                    <div style={{ fontSize: 10, color: '#aaa' }}>auth method</div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: '#aaa', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <RefreshCw size={10} /> {integ.lastSync}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function IntegrationDetail({ integration: integ, onBack, onSync }) {
  const ss = STATUS_STYLE[integ.status] || STATUS_STYLE['Inactive'];
  const SIcon = ss.icon;

  return (
    <div style={{ padding: 28, maxWidth: 900, background: '#f5f5f5', minHeight: '100%' }}>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, color: G, fontSize: 13, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 20, padding: 0 }}>
        ← Integrations
      </button>

      <div style={{ ...card, padding: 28, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18, flexWrap: 'wrap' }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: integ.bg, color: integ.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18, border: `2px solid ${integ.color}22`, flexShrink: 0 }}>{integ.logo}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
              <h1 style={{ margin: 0, color: '#1a1a1a', fontSize: 20, fontWeight: 800 }}>{integ.name}</h1>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <SIcon size={10} />{integ.status}
              </span>
            </div>
            <p style={{ margin: 0, color: '#666', fontSize: 13, lineHeight: 1.6 }}>{integ.description}</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {integ.status === 'Pending Setup' && (
              <button style={{ padding: '8px 16px', background: G, color: '#fff', border: 'none', borderRadius: 9, cursor: 'pointer', fontSize: 12, fontWeight: 700, boxShadow: '0 2px 8px rgba(213,170,91,0.3)' }}>Connect</button>
            )}
            {integ.status === 'Connected' && (
              <>
                <button onClick={() => onSync && onSync(integ.id)} style={{ padding: '8px 14px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <RefreshCw size={11} /> Sync Now
                </button>
                <button style={{ padding: '8px 14px', background: '#f5f5f5', color: '#555', border: '1px solid #eee', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Settings size={11} /> Configure
                </button>
              </>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginTop: 24 }}>
          {[
            { label: 'Auth Method',  value: integ.auth,        icon: Key },
            { label: 'Calls Today',  value: integ.callsToday,  icon: Activity },
            { label: 'Last Synced',  value: integ.lastSync,    icon: RefreshCw },
            { label: 'Category',     value: integ.category,    icon: Globe },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 14, background: '#fafafa', borderRadius: 10, border: '1px solid #f0f0f0' }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: '#fff8ec', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={12} color={G} />
              </div>
              <div>
                <div style={{ fontSize: 10, color: '#aaa' }}>{label}</div>
                <div style={{ fontSize: 12, color: '#1a1a1a', fontWeight: 600 }}>{value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 16 }}>
        <div style={{ ...card, padding: 22 }}>
          <h3 style={{ margin: '0 0 16px', color: '#1a1a1a', fontSize: 14, fontWeight: 600 }}>Available Data Points</h3>
          {integ.dataPoints.map((dp, i) => (
            <div key={dp} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: i < integ.dataPoints.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
              <CheckCircle2 size={13} color="#16a34a" />
              <span style={{ fontSize: 13, color: '#555' }}>{dp}</span>
            </div>
          ))}
        </div>

        <div style={{ ...card, padding: 20, alignSelf: 'start' }}>
          <h3 style={{ margin: '0 0 14px', color: '#1a1a1a', fontSize: 13, fontWeight: 700 }}>Endpoint</h3>
          <div style={{ padding: '8px 12px', background: '#1a1a1a', borderRadius: 8, marginBottom: 14 }}>
            <code style={{ fontSize: 11, color: '#a3e635', wordBreak: 'break-all' }}>{integ.endpoint}</code>
          </div>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 14, lineHeight: 1.5 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Shield size={11} color={G} />
              <span>Compliant with GoI Data Exchange Standards</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Lock size={11} color={G} />
              <span>All data encrypted in transit (TLS 1.3)</span>
            </div>
          </div>
          <button style={{ width: '100%', padding: '8px 0', background: '#f0f9ff', color: '#0284c7', border: '1px solid #bae6fd', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            <ExternalLink size={11} /> View API Docs
          </button>
        </div>
      </div>
    </div>
  );
}
