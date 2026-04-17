/**
 * WhoViewedProfile — Phase 37
 *
 * Shows providers (startup/student/academia) who has been viewing their profile
 * in the last N days. Growth plan required. Free plan sees upgrade CTA.
 *
 * Also shows aggregate view stats (total / 7d / 30d) — these are visible on all plans.
 */
import React, { useEffect, useState } from 'react';
import { Eye, Users, TrendingUp, Lock, ChevronRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { profileViewAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const PROVIDER_ROLES = new Set(['startup', 'student', 'academia']);

function relativeTime(ts) {
  if (!ts) return '';
  const diff = (Date.now() - new Date(ts).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function WhoViewedProfile() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [viewers, setViewers] = useState(null);
  const [upgradeRequired, setUpgradeRequired] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !PROVIDER_ROLES.has(user.role)) { setLoading(false); return; }

    let alive = true;
    (async () => {
      try {
        // Stats is available on all plans — fetch first
        const s = await profileViewAPI.viewStats().catch(() => null);
        if (!alive) return;
        setStats(s);

        // Try to fetch viewers — backend returns 402 for free plan with message:
        // "See who viewed your profile with the Growth plan."
        try {
          const v = await profileViewAPI.whoViewedMe();
          if (!alive) return;
          setViewers(v);
        } catch (err) {
          if (/growth plan|upgrade/i.test(err?.message || '')) {
            setUpgradeRequired(true);
          }
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [user]);

  // Only render for providers
  if (!user || !PROVIDER_ROLES.has(user.role)) return null;
  if (loading) {
    return (
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120 }}>
          <Loader2 size={18} className="animate-spin" style={{ color: '#999' }} />
        </div>
      </div>
    );
  }

  const total = Number(stats?.total_views || 0);
  const unique = Number(stats?.unique_viewers || 0);
  const v7d = Number(stats?.views_7d || 0);
  const v30d = Number(stats?.views_30d || 0);

  return (
    <div style={card}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Eye size={16} style={{ color: '#0284c7' }} />
          </div>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: '#1a1a1a' }}>Who viewed your profile</h3>
            <p style={{ fontSize: 11, color: '#888', margin: 0 }}>{total} total · {v7d} in past 7 days</p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
        <MiniStat icon={Users} label="Unique viewers" value={unique} color="#7c3aed" />
        <MiniStat icon={TrendingUp} label="Past 7 days" value={v7d} color="#0284c7" />
        <MiniStat icon={Eye} label="Past 30 days" value={v30d} color="#16a34a" />
      </div>

      {/* Viewer list OR upgrade CTA */}
      {upgradeRequired ? (
        <div style={{ padding: '14px 12px', borderRadius: 10, background: 'linear-gradient(135deg, #fff7e6 0%, #fffbeb 100%)', border: '1px solid #fde68a' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <Lock size={16} style={{ color: '#d97706', flexShrink: 0, marginTop: 1 }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 12, fontWeight: 600, margin: 0, color: '#78350f' }}>See who viewed your profile</p>
              <p style={{ fontSize: 11, color: '#92400e', margin: '3px 0 10px 0' }}>Upgrade to <strong>Growth</strong> (₹499/mo) to see names of corporates, investors, and others checking you out.</p>
              <Link to="/dashboard/settings" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, padding: '6px 12px', borderRadius: 8, background: '#d97706', color: 'white', textDecoration: 'none' }}>
                Upgrade plan <ChevronRight size={12} />
              </Link>
            </div>
          </div>
        </div>
      ) : viewers?.viewers?.length > 0 ? (
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {viewers.viewers.slice(0, 5).map(v => (
              <div key={`${v.id}-${v.viewed_at}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px', borderRadius: 8, transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: avatarColor(v.id), color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600 }}>
                  {v.avatar ? <img src={v.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : (v.name || '?').charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.name}</div>
                  <div style={{ fontSize: 10, color: '#888', textTransform: 'capitalize' }}>{v.role}{v.persona_category === 'seeker' ? ' · seeker' : ''}</div>
                </div>
                <span style={{ fontSize: 10, color: '#999' }}>{relativeTime(v.viewed_at)}</span>
              </div>
            ))}
          </div>
          {viewers.viewers.length > 5 && (
            <p style={{ fontSize: 11, color: '#888', margin: '8px 0 0 0', textAlign: 'center' }}>+ {viewers.viewers.length - 5} more in the past {viewers.period_days} days</p>
          )}
        </div>
      ) : total === 0 ? (
        <p style={{ fontSize: 11, color: '#888', textAlign: 'center', margin: '12px 0' }}>No profile views yet. Share your profile to attract seekers.</p>
      ) : (
        <p style={{ fontSize: 11, color: '#888', textAlign: 'center', margin: '12px 0' }}>No recent named viewers in the past 30 days.</p>
      )}
    </div>
  );
}

function MiniStat({ icon: Icon, label, value, color }) {
  return (
    <div style={{ padding: '10px 10px', borderRadius: 10, background: '#fafafa', border: '1px solid #f0f0f0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
        <Icon size={11} style={{ color }} />
        <span style={{ fontSize: 10, color: '#888' }}>{label}</span>
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', lineHeight: 1 }}>{value.toLocaleString()}</div>
    </div>
  );
}

function avatarColor(id) {
  const palette = ['#7c3aed', '#0284c7', '#16a34a', '#d97706', '#dc2626', '#db2777', '#0891b2', '#4f46e5'];
  return palette[(id || 0) % palette.length];
}

const card = {
  background: 'white',
  borderRadius: 14,
  border: '1px solid #e5e7eb',
  padding: 16,
};
