/**
 * Phase 71e — Corporate Recommended Startups (Stage B Discovery surface).
 *
 * Consumes GET /api/corporate/recommendations (existing endpoint). Backend
 * uses cluster boost on the corporate's innovation_areas to lift relevant
 * startups, plus weighted overlap on technologies + focus_areas, sector
 * fallback, deeptech bonus, TRL bonus, and applied-to-this-corporate signal.
 *
 * Same card pattern as Investor / Student / Academia surfaces with cluster
 * match badge, boost lift indicator, and click-through tracking.
 */
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Sparkles, Cpu, MapPin, TrendingUp, Loader2, ArrowRight } from 'lucide-react';
import { corporateAPI, recommendationsAPI } from '../../services/api';

const G = '#D0A848';
const SOURCE = 'corporate_recommended_startups';
const card = {
  background: '#fff',
  border: '1px solid #eee',
  borderRadius: 14,
  padding: 16,
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  cursor: 'pointer',
  transition: 'border-color 0.15s, box-shadow 0.15s',
};

export default function CorporateRecommendedStartups() {
  const navigate = useNavigate();
  const [startups, setStartups] = useState([]);
  const [basedOn, setBasedOn] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await corporateAPI.recommendations();
      // Backend returns { recommendations: [...], based_on: [...] }
      const rows = Array.isArray(data?.recommendations) ? data.recommendations : [];
      setStartups(rows);
      setBasedOn(Array.isArray(data?.based_on) ? data.based_on : []);
    } catch (err) {
      toast.error(err.message || 'Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (s) => {
    recommendationsAPI.trackClick({
      persona_role: 'corporate',
      target_startup_id: s.user_id,
      cluster_boost: parseInt(s.cluster_boost, 10) || 0,
      boost_lift: parseInt(s.boost_lift, 10) || 0,
      match_score: parseInt(s.match_score, 10) || 0,
      source_surface: SOURCE,
    }).catch(() => {});
    navigate(`/dashboard/startups/${s.user_id}?by=user_id`);
  };

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      {/* Ship #12 follow-up — tour anchors */}
      <div id="tour-page-recs-header" style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={22} style={{ color: G }} /> Recommended Startups
        </h1>
        <p style={{ fontSize: 12, color: '#5c5c5c', margin: '4px 0 0' }}>
          Startups matching your innovation areas, ranked by topical alignment and applied signal.
        </p>
        {basedOn.length > 0 && (
          <div id="tour-page-recs-basedon" style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <span style={{ fontSize: 11, color: '#5c5c5c' }}>Based on:</span>
            {basedOn.slice(0, 6).map((tag, i) => (
              <span
                key={i}
                style={{ fontSize: 10, padding: '2px 8px', background: '#f7f5f0', color: '#666', borderRadius: 4 }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
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
            Add <b>innovation areas</b> to your corporate profile.<br />
            We'll match you with startups in adjacent topical clusters and surface those who applied to your challenges.
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
            const initials = (s.organization || s.company_name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
            const location = [s.city].filter(Boolean).join(', ');
            const boosted = (s.cluster_boost || 0) > 0;
            const lift = parseInt(s.boost_lift, 10) || 0;
            const applied = (s.applied_signal || 0) > 0;
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
                        {s.organization || s.company_name || 'Unnamed'}
                      </h3>
                      {s.is_deeptech && <Cpu size={11} style={{ color: G, flexShrink: 0 }} />}
                    </div>
                    {location && (
                      <div style={{ fontSize: 11, color: '#5c5c5c', marginTop: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
                        <MapPin size={10} /> {location}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginTop: 8 }}>
                  {s.sector && (
                    <span style={{ fontSize: 10, padding: '2px 8px', background: '#f7f5f0', color: '#666', borderRadius: 4 }}>
                      {s.sector}
                    </span>
                  )}
                  {applied && (
                    <span
                      title="Applied to one of your challenges"
                      style={{ fontSize: 10, padding: '2px 8px', background: '#e6f6ec', color: '#0d8a3e', borderRadius: 4, fontWeight: 600 }}
                    >
                      Applied
                    </span>
                  )}
                  {boosted && (
                    <span
                      title={lift > 0 ? `Lifted by ${lift} via Innovation Map match` : 'Matches your focus theme'}
                      style={{ fontSize: 10, padding: '2px 8px', background: '#fff7e6', color: '#a06600', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 3, fontWeight: 600 }}
                    >
                      <TrendingUp size={10} />
                      {lift > 0 ? `+${lift} theme` : 'theme match'}
                    </span>
                  )}
                  {(() => {
                    const ms = parseInt(s.match_score, 10) || 0;
                    if (ms <= 0) return null;
                    const label = ms >= 25 ? 'Strong match' : ms >= 12 ? 'Good match' : 'Possible match';
                    const color = ms >= 25 ? '#0d8a3e' : ms >= 12 ? '#a06600' : '#888';
                    const bg    = ms >= 25 ? '#e6f6ec' : ms >= 12 ? '#fff7e6' : '#f5f5f5';
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
