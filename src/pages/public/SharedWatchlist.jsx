/**
 * Ship #4 follow-up (22 May 2026 late evening) — SharedWatchlist.
 * Public page for viewing a shared watchlist via tokenized URL.
 * No authentication required. Read-only.
 * Backend route: GET /api/public/watchlists/share/:token
 */
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Loader2, ArrowRight, Calendar, MapPin, Briefcase } from 'lucide-react';
import { publicWatchlistShare } from '../../services/api';
import PublicLayout from '../../components/PublicLayout';

const G = '#D0A848';
const card = { background: '#fff', border: '1px solid #eee', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' };

export default function SharedWatchlist() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { if (token) loadWatchlist(); /* eslint-disable-next-line */ }, [token]);

  const loadWatchlist = async () => {
    try {
      const d = await publicWatchlistShare.read(token);
      setData(d);
    } catch (err) {
      setError(err.message || 'Watchlist not found');
    } finally {
      setLoading(false);
    }
  };

  const fmtDate = (iso) => {
    if (!iso) return '';
    try { return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return ''; }
  };

  return (
    <PublicLayout>
      <div style={{ maxWidth: 880, margin: '0 auto', padding: '40px 24px' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <Loader2 size={28} style={{ color: G, animation: 'spin 1s linear infinite' }} />
          </div>
        )}

        {error && (
          <div style={{ ...card, padding: 40, textAlign: 'center' }}>
            <Star size={32} style={{ color: '#ddd', marginBottom: 10 }} />
            <p style={{ fontSize: 16, fontWeight: 600, color: '#5c5c5c' }}>{error}</p>
            <p style={{ fontSize: 13, color: '#6e6e6e' }}>This share link may have been revoked, expired, or the watchlist no longer exists.</p>
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 16, color: G, fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>
              Visit OpenI <ArrowRight size={14} />
            </Link>
          </div>
        )}

        {!loading && !error && data && (
          <>
            {/* Header */}
            <div style={{ ...card, padding: 28, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, fontSize: 11, color: '#5c5c5c', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                <Star size={13} style={{ color: G }} />
                <span>Shared Watchlist</span>
              </div>
              <h1 id="tour-page-share-watchlist" style={{ fontSize: 26, fontWeight: 700, color: '#1a1a1a', margin: '0 0 6px' }}>{data.watchlist?.name || 'Watchlist'}</h1>
              {data.watchlist?.description && (
                <p style={{ fontSize: 13, color: '#666', margin: '0 0 12px', lineHeight: 1.6 }}>{data.watchlist.description}</p>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 11, color: '#5c5c5c' }}>
                {data.watchlist?.created_by_name && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Briefcase size={11} /> Curated by <strong style={{ color: '#555' }}>{data.watchlist.created_by_name}</strong>
                  </div>
                )}
                {data.share_meta?.expires_at && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={11} /> Link expires {fmtDate(data.share_meta.expires_at)}
                  </div>
                )}
              </div>
              {Array.isArray(data.watchlist?.tags) && data.watchlist.tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 12 }}>
                  {data.watchlist.tags.map((t, i) => (
                    <span key={i} style={{ fontSize: 10, padding: '2px 8px', background: '#fdf6e9', color: G, borderRadius: 4, border: '1px solid rgba(213,170,91,0.3)' }}>{t}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Startups */}
            {(!data.startups || data.startups.length === 0) ? (
              <div style={{ ...card, padding: 40, textAlign: 'center' }}>
                <p style={{ fontSize: 14, color: '#5c5c5c' }}>This watchlist does not have any startups yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 12, color: '#5c5c5c', fontWeight: 600 }}>
                  {data.startups.length} {data.startups.length === 1 ? 'Startup' : 'Startups'}
                </div>
                {data.startups.map(s => (
                  <div key={s.id} style={{ ...card, padding: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(213,170,91,0.15)', color: G, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, flexShrink: 0 }}>
                        {(s.name || '?').charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                        {s.tagline && (
                          <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>{s.tagline}</div>
                        )}
                      </div>
                    </div>
                    {s.description && (
                      <p style={{ fontSize: 12, color: '#666', margin: 0, lineHeight: 1.5 }}>{s.description}</p>
                    )}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
                      {s.sector && (
                        <span style={{ fontSize: 10, padding: '2px 7px', background: '#f5f5f5', color: '#666', borderRadius: 4 }}>{s.sector}</span>
                      )}
                      {s.stage && (
                        <span style={{ fontSize: 10, padding: '2px 7px', background: '#f5f5f5', color: '#666', borderRadius: 4 }}>{s.stage}</span>
                      )}
                      {s.tech_readiness && (
                        <span style={{ fontSize: 10, padding: '2px 7px', background: '#f5f5f5', color: '#666', borderRadius: 4 }}>Tech Readiness: {s.tech_readiness}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* CTA */}
            <div style={{ ...card, padding: 24, marginTop: 24, textAlign: 'center', background: 'linear-gradient(135deg, #fdf6e9 0%, #fff 100%)' }}>
              <p style={{ fontSize: 13, color: '#666', margin: '0 0 12px' }}>Want to build your own startup watchlist?</p>
              <Link to="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: G, color: '#fff', borderRadius: 9, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                Join OpenI <ArrowRight size={14} />
              </Link>
            </div>
          </>
        )}
      </div>
    </PublicLayout>
  );
}
