import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { corporateAPI, recommendationsAPI } from '../../services/api';
import ProfileScoreAiCard from '../../components/ProfileScoreAiCard';
import {
  Building2, FolderKanban, Target, Link2, Star, Users,
  Search, Plus, ArrowRight, Loader2, TrendingUp, Clock,
  CheckCircle, Sparkles, RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';

const G = '#D5AA5B';
const card = { background: '#fff', border: '1px solid #eee', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' };

const STATUS_COLORS = {
  applied: { bg: '#eff6ff', color: '#2563eb', label: 'Applied' },
  shortlisted: { bg: '#fefce8', color: '#ca8a04', label: 'Shortlisted' },
  selected: { bg: '#f0fdf4', color: '#16a34a', label: 'Selected' },
  rejected: { bg: '#fef2f2', color: '#dc2626', label: 'Rejected' },
  evaluating: { bg: '#faf5ff', color: '#7c3aed', label: 'Evaluating' },
};

const COLLAB_COLORS = {
  exploring: '#3b82f6', poc: '#f59e0b', pilot: '#8b5cf6', scaling: '#16a34a', completed: '#6b7280',
};

export default function CorporateDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recs, setRecs] = useState([]);
  const [recsAiEnhanced, setRecsAiEnhanced] = useState(false);
  const [recsRefreshing, setRecsRefreshing] = useState(false);

  useEffect(() => { loadDashboard(); loadRecs(); }, []);

  const loadDashboard = async () => {
    try {
      const d = await corporateAPI.dashboard();
      setData(d);
    } catch (err) { toast.error('Failed to load dashboard'); }
    finally { setLoading(false); }
  };

  const loadRecs = async () => {
    try { const d = await corporateAPI.recommendations(); setRecs(d.recommendations || []); setRecsAiEnhanced(d.ai_enhanced || false); } catch (_e) { /* non-fatal */ }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Loader2 size={28} className="animate-spin" style={{ color: G }} /></div>;

  const collabs = data?.collaborations || {};
  const stats = [
    { label: 'My Projects', value: data?.projects || 0, icon: FolderKanban, color: '#3b82f6', to: '/dashboard/projects' },
    { label: 'Active Challenges', value: data?.challenges?.active || 0, icon: Target, color: G, to: '/dashboard/corporate/challenges' },
    { label: 'Collaborations', value: parseInt(collabs.total) || 0, icon: Link2, color: '#16a34a', to: '/dashboard/corporate/collabs' },
    { label: 'Watchlists', value: data?.watchlists || 0, icon: Star, color: '#f59e0b', to: '/dashboard/watchlist' },
    { label: 'Applications', value: data?.recent_applications?.length || 0, icon: Users, color: '#8b5cf6', to: '/dashboard/corporate/challenges' },
  ];

  const quickActions = [
    { label: 'Find Startups', desc: 'Search by sector, technology, use case', icon: Search, to: '/dashboard/corporate/search', color: G },
    { label: 'Launch Challenge', desc: 'Post innovation requirements', icon: Plus, to: '/dashboard/corporate/challenges', color: '#16a34a' },
    { label: 'View Collaborations', desc: 'Track startup partnerships', icon: Link2, to: '/dashboard/corporate/collabs', color: '#3b82f6' },
    { label: 'My Watchlist', desc: 'Curated startup lists', icon: Star, to: '/dashboard/watchlist', color: '#f59e0b' },
  ];

  // Collaboration pipeline data
  const pipeline = [
    { label: 'Exploring', count: parseInt(collabs.exploring) || 0, color: COLLAB_COLORS.exploring },
    { label: 'PoC', count: parseInt(collabs.poc) || 0, color: COLLAB_COLORS.poc },
    { label: 'Pilot', count: parseInt(collabs.pilot) || 0, color: COLLAB_COLORS.pilot },
    { label: 'Scaling', count: parseInt(collabs.scaling) || 0, color: COLLAB_COLORS.scaling },
    { label: 'Completed', count: parseInt(collabs.completed) || 0, color: COLLAB_COLORS.completed },
  ];
  const pipelineMax = Math.max(...pipeline.map(p => p.count), 1);

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      {/* Welcome */}
      <div id="tour-welcome" style={{ ...card, padding: '20px 24px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: '#16a34a15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Building2 size={22} style={{ color: '#16a34a' }} />
        </div>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>
            Welcome, {user?.organization_name || user?.name}
          </h1>
          <p style={{ fontSize: 13, color: '#666', margin: 0 }}>Corporate Innovation Dashboard</p>
        </div>
      </div>

      {/* Phase 7 (P7) — AI Profile Insights (s24 P7b: corporate persona) */}
      <ProfileScoreAiCard />

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14, marginBottom: 20 }}>
        {stats.map(s => (
          <div key={s.label} style={{ ...card, padding: 18, cursor: 'pointer' }} onClick={() => navigate(s.to)}
            onMouseEnter={e => e.currentTarget.style.borderColor = s.color}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#eee'}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: `${s.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.icon size={18} style={{ color: s.color }} />
              </div>
              <span style={{ fontSize: 12, color: '#888', fontWeight: 500 }}>{s.label}</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#1a1a1a' }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
        {/* Quick Actions */}
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 }}>Quick Actions</h2>
          <div style={{ display: 'grid', gap: 10 }}>
            {quickActions.map(a => (
              <div key={a.label} style={{ ...card, padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
                onClick={() => navigate(a.to)}
                onMouseEnter={e => { e.currentTarget.style.borderColor = a.color; e.currentTarget.style.background = '#fafafa'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#eee'; e.currentTarget.style.background = '#fff'; }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: `${a.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <a.icon size={17} style={{ color: a.color }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{a.label}</div>
                  <div style={{ fontSize: 11, color: '#888' }}>{a.desc}</div>
                </div>
                <ArrowRight size={14} style={{ color: '#ccc' }} />
              </div>
            ))}
          </div>
        </div>

        {/* Collaboration Pipeline */}
        <div id="tour-corp-pipeline">
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 }}>Collaboration Pipeline</h2>
          <div style={{ ...card, padding: 18 }}>
            {pipeline.map(p => (
              <div key={p.label} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 500, color: '#555' }}>{p.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: p.color }}>{p.count}</span>
                </div>
                <div style={{ height: 8, background: '#f3f4f6', borderRadius: 4 }}>
                  <div style={{ height: 8, borderRadius: 4, background: p.color, width: `${(p.count / pipelineMax) * 100}%`, transition: 'width 0.3s' }} />
                </div>
              </div>
            ))}
          </div>

          {/* Recent Applications */}
          <h2 id="tour-corp-applications" style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 12, marginTop: 20 }}>Recent Applications</h2>
          <div style={{ ...card, padding: 0 }}>
            {(data?.recent_applications || []).length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#999', fontSize: 13 }}>No applications yet</div>
            ) : (
              (data?.recent_applications || []).slice(0, 5).map((app, i) => (
                <div key={app.id} style={{ padding: '12px 16px', borderBottom: i < 4 ? '1px solid #f5f5f5' : 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${(STATUS_COLORS[app.status] || STATUS_COLORS.applied).bg}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {app.status === 'selected' ? <CheckCircle size={13} style={{ color: '#16a34a' }} /> : <Clock size={13} style={{ color: '#888' }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {app.applicant_name || 'Unknown'}
                    </div>
                    <div style={{ fontSize: 11, color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {app.challenge_title}
                    </div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: (STATUS_COLORS[app.status] || STATUS_COLORS.applied).bg, color: (STATUS_COLORS[app.status] || STATUS_COLORS.applied).color }}>
                    {(STATUS_COLORS[app.status] || STATUS_COLORS.applied).label}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Application Analytics */}
      {data?.application_analytics && data.application_analytics.total > 0 && (
        <div style={{ marginTop: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 }}>
            <Target size={15} style={{ verticalAlign: -3, marginRight: 6, color: G }} />Challenge Performance
          </h2>
          <div style={{ ...card, padding: 20 }}>
            {/* Summary numbers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Total Applications', value: data.application_analytics.total, color: '#3b82f6' },
                { label: 'Applied', value: data.application_analytics.applied || 0, color: '#6b7280' },
                { label: 'Shortlisted', value: data.application_analytics.shortlisted || 0, color: '#ca8a04' },
                { label: 'Selected', value: data.application_analytics.selected || 0, color: '#16a34a' },
                { label: 'Rejected', value: data.application_analytics.rejected || 0, color: '#dc2626' },
              ].map((m, i) => (
                <div key={i} style={{ textAlign: 'center', padding: 12, borderRadius: 10, background: `${m.color}08` }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: m.color }}>{m.value}</div>
                  <div style={{ fontSize: 10, color: '#888', fontWeight: 500 }}>{m.label}</div>
                </div>
              ))}
            </div>
            {/* Conversion funnel */}
            {data.application_analytics.total > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 8 }}>Conversion Funnel</div>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  {[
                    { label: 'Applied', value: data.application_analytics.total, color: '#3b82f6' },
                    { label: 'Shortlisted', value: data.application_analytics.shortlisted || 0, color: '#ca8a04' },
                    { label: 'Selected', value: data.application_analytics.selected || 0, color: '#16a34a' },
                  ].map((step, i) => (
                    <div key={i} style={{ flex: 1 }}>
                      <div style={{ height: 28, borderRadius: 6, background: `${step.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                        <div style={{
                          position: 'absolute', left: 0, top: 0, height: '100%', borderRadius: 6,
                          background: step.color,
                          width: `${data.application_analytics.total > 0 ? (step.value / data.application_analytics.total) * 100 : 0}%`,
                          opacity: 0.2, transition: 'width 0.5s',
                        }} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: step.color, position: 'relative' }}>
                          {step.value} {step.label}
                        </span>
                      </div>
                      {i < 2 && data.application_analytics.total > 0 && (
                        <div style={{ textAlign: 'center', fontSize: 9, color: '#999', marginTop: 2 }}>
                          {Math.round((step.value / data.application_analytics.total) * 100)}%
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recommended Startups */}
      {recs.length > 0 && (
        <div id="tour-corp-recommended" style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>
              <TrendingUp size={15} style={{ verticalAlign: -3, marginRight: 6, color: G }} />Recommended Startups
              {recsAiEnhanced && <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#faf5ff', color: '#7c3aed', marginLeft: 8 }}><Sparkles size={9} style={{ verticalAlign: -1 }} /> AI Enhanced</span>}
            </h2>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button onClick={async () => { setRecsRefreshing(true); try { const d = await corporateAPI.recommendations({ refresh: true }); setRecs(d.recommendations || []); setRecsAiEnhanced(d.ai_enhanced || false); } catch (_e) { /* non-fatal */ } setRecsRefreshing(false); }}
                disabled={recsRefreshing}
                style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: '#7c3aed', background: 'none', border: 'none', cursor: recsRefreshing ? 'wait' : 'pointer', opacity: recsRefreshing ? 0.6 : 1 }}>
                {recsRefreshing ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />} Refresh AI
              </button>
              <button onClick={() => navigate('/dashboard/corporate/search')}
                style={{ fontSize: 11, fontWeight: 600, color: G, background: 'none', border: 'none', cursor: 'pointer' }}>
                See all →
              </button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {recs.slice(0, 6).map(r => (
              <div key={r.user_id} style={{ ...card, padding: 14, cursor: 'pointer' }}
                onClick={() => {
                  // s36: fire-and-forget click telemetry. Don't block navigation.
                  recommendationsAPI.trackClick({
                    persona_role: 'corporate',
                    target_startup_id: r.user_id,
                    cluster_boost: parseInt(r.cluster_boost, 10) || 0,
                    boost_lift: parseInt(r.boost_lift, 10) || 0,
                    match_score: parseInt(r.match_score, 10) || 0,
                    source_surface: 'corporate_dashboard_recs',
                  }).catch(() => {});
                  navigate(`/dashboard/startup/${r.user_id}`);
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = G}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#eee'}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
                  {r.logo_url || r.avatar ? (
                    <img src={r.logo_url || r.avatar} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover', border: '1px solid #eee' }} />
                  ) : (
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#999' }}>
                      {(r.name || r.organization || '?')[0]}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.organization || r.name}</div>
                    <div style={{ fontSize: 11, color: '#888' }}>
                      {r.sector || ''}{r.city ? ` · ${r.city}` : ''}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 6 }}>
                  {(r.technologies || r.focus_areas || []).slice(0, 3).map(t => (
                    <span key={t} style={{ fontSize: 9, padding: '2px 7px', borderRadius: 20, background: '#fefce8', color: '#ca8a04' }}>{t}</span>
                  ))}
                </div>
                {/* AI narrative */}
                {r.fit_narrative && (
                  <div style={{ fontSize: 10, color: '#555', lineHeight: 1.4, marginBottom: 6 }}>{r.fit_narrative}</div>
                )}
                <div style={{ display: 'flex', gap: 8, fontSize: 10, color: '#999', flexWrap: 'wrap' }}>
                  {r.tech_readiness && <span title="Tech Readiness Level (1=concept · 9=proven in production)">Tech Readiness {r.tech_readiness}</span>}
                  {r.is_deeptech && <span style={{ color: '#7c3aed', fontWeight: 600 }}>DeepTech</span>}
                  {r.match_score > 0 && <span style={{ color: G, fontWeight: 600 }}>{r.match_score >= 100 ? `${r.match_score}/100` : `${r.match_score}pt`} match</span>}
                  {r.recommended_action && (
                    <span style={{ fontWeight: 600, color: r.recommended_action === 'shortlist' ? '#16a34a' : r.recommended_action === 'skip' ? '#999' : '#2563eb' }}>
                      {r.recommended_action}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
