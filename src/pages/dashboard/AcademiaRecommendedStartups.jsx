/**
 * P1.4 (s32) — Academia Recommended Startups
 *
 * Consumes GET /api/academia/recommended-startups (academia/faculty persona only).
 * The backend uses cluster-bridge logic: faculty's research_areas/offerings →
 * academia-cluster anchors → bridged startup-cluster IDs → boosted top-10.
 * Falls back to user's own embedding-assigned cluster_id when lexical match misses
 * (handles rare/specialized vocabulary like "Hypersonics", "Defence Tech").
 */
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Sparkles, Cpu, MapPin, TrendingUp, Loader2, ArrowRight } from 'lucide-react';
import { academiaEnhAPI, recommendationsAPI } from '../../services/api';

const G = '#D5AA5B';
const SOURCE = 'academia_recommended_startups';
const card = {
  background: '#fff',
  border: '1px solid #eee',
  borderRadius: 14,
  padding: 16,
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  cursor: 'pointer',
  transition: 'border-color 0.15s, box-shadow 0.15s',
};

export default function AcademiaRecommendedStartups() {
  const navigate = useNavigate();
  const [startups, setStartups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await academiaEnhAPI.recommendedStartups();
      setStartups(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.message || 'Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (s) => {
    // s36: fire-and-forget click telemetry. Don't block navigation.
    recommendationsAPI.trackClick({
      persona_role: 'academia',
      target_startup_id: s.user_id,
      cluster_boost: parseInt(s.cluster_boost, 10) || 0,
      boost_lift: parseInt(s.boost_lift, 10) || 0,
      match_score: parseInt(s.match_score, 10) || 0,
      source_surface: SOURCE,
    }).catch(() => {});
    navigate(`/dashboard/startup/${s.user_id}`);
  };

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={22} style={{ color: G }} /> Recommended Startups
        </h1>
        <p style={{ fontSize: 12, color: '#888', margin: '4px 0 0' }}>
          Startups matching your research areas and what you offer to industry, ranked by topical alignment.
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <Loader2 size={32} style={{ color: G, animation: 'spin 1s linear infinite' }} />
        </div>
      ) : startups.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', padding: 40, cursor: 'auto' }}>
          <Sparkles size={32} style={{ color: G, marginBottom: 12, opacity: 0.6 }} />
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', margin: '0 0 6px' }}>
            No recommendations yet
          </h3>
          <p style={{ color: '#666', fontSize: 13, margin: '0 0 18px', lineHeight: 1.5 }}>
            Add <b>research areas</b> and <b>offerings</b> (consulting, supervision, lab access, etc.) to your profile.<br />
            We'll match you with startups in adjacent technical clusters.
          </p>
          <Link
            to="/dashboard/profile"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: G, color: '#0D2137',
              padding: '8px 16px', borderRadius: 8,
              fontSize: 13, fontWeight: 600, textDecoration: 'none',
            }}
          >
            Complete your profile <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
          {startups.map((s, i) => {
            const initials = (s.company_name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
            const location = [s.city, s.state].filter(Boolean).join(', ');
            const boosted = (s.cluster_boost || 0) > 0;
            const lift = parseInt(s.boost_lift, 10) || 0;
            return (
              <div
                key={`${s.user_id}-${i}`}
                style={card}
                onClick={() => handleCardClick(s)}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = G; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.10)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#eee'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'; }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                  {s.logo_url ? (
                    <img
                      src={s.logo_url}
                      alt=""
                      style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', background: '#f7f5f0', flexShrink: 0 }}
                      onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                    />
                  ) : null}
                  <div
                    style={{
                      width: 40, height: 40, borderRadius: 8, background: G, color: '#0D2137',
                      display: s.logo_url ? 'none' : 'flex',
                      alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0,
                    }}
                  >
                    {initials}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.company_name || 'Unnamed'}
                      </h3>
                      {s.is_deeptech && <Cpu size={11} style={{ color: G, flexShrink: 0 }} />}
                    </div>
                    {location && (
                      <div style={{ fontSize: 11, color: '#888', marginTop: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
                        <MapPin size={10} /> {location}
                      </div>
                    )}
                  </div>
                </div>

                {s.tagline && (
                  <p style={{ fontSize: 12, color: '#555', margin: '0 0 8px', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {s.tagline}
                  </p>
                )}

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginTop: 8 }}>
                  {s.sector && (
                    <span style={{ fontSize: 10, padding: '2px 8px', background: '#f7f5f0', color: '#666', borderRadius: 4 }}>
                      {s.sector}
                    </span>
                  )}
                  {boosted && (
                    <span
                      title={lift > 0 ? `Lifted by ${lift} ranks via cluster match` : 'Matched your research cluster'}
                      style={{ fontSize: 10, padding: '2px 8px', background: '#fff7e6', color: '#a06600', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 3, fontWeight: 600 }}
                    >
                      <TrendingUp size={10} />
                      {lift > 0 ? `+${lift} cluster` : 'cluster match'}
                    </span>
                  )}
                  {(() => {
                    const ms = parseInt(s.match_score, 10) || 0;
                    if (ms <= 0) return null;
                    const label = ms >= 15 ? 'Strong match' : ms >= 8 ? 'Good match' : 'Possible match';
                    const color = ms >= 15 ? '#0d8a3e' : ms >= 8 ? '#a06600' : '#888';
                    const bg    = ms >= 15 ? '#e6f6ec' : ms >= 8 ? '#fff7e6' : '#f5f5f5';
                    return (
                      <span style={{ marginLeft: 'auto', fontSize: 10, padding: '2px 8px', background: bg, color, borderRadius: 4, fontWeight: 600 }}>
                        {label}
                      </span>
                    );
                  })()}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
