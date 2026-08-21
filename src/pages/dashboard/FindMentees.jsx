import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { menteeAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Search, ChevronLeft, MapPin, Building2, Loader2, ExternalLink, UserPlus } from 'lucide-react';

const G = '#D0A848';
const card = { background: '#fff', border: '1px solid #eee', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' };

const PERSONA_LABELS = { startup: 'Startup', student: 'Student', academia: 'Academia' };
const PERSONA_COLORS = { startup: '#2563eb', student: '#16a34a', academia: '#9333ea' };

export default function FindMentees() {
  const navigate = useNavigate();
  const { id: paramId } = useParams();
  const selectedId = paramId ? parseInt(paramId, 10) : null;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [persona, setPersona] = useState('');

  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (query) params.search = query;
      if (persona) params.persona = persona;
      const res = await menteeAPI.listPublic(params);
      const data = Array.isArray(res) ? res : (res.data || []);
      setItems(data);
    } catch { toast.error('Failed to load mentees'); }
    setLoading(false);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [query, persona]);

  // Route-driven detail
  useEffect(() => {
    if (selectedId && (!detail || detail.user_id !== selectedId)) {
      setDetailLoading(true);
      menteeAPI.getPublic(selectedId)
        .then(res => setDetail(res.data || res))
        .catch(() => { toast.error('Mentee not found'); navigate('/dashboard/find-mentees'); })
        .finally(() => setDetailLoading(false));
    }
    if (!selectedId && detail) setDetail(null);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [selectedId]);

  // ── Detail view ──────────────────────────────────────────────
  if (selectedId) {
    if (detailLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Loader2 size={28} className="animate-spin" style={{ color: G }} /></div>;
    if (!detail) return null;
    const loc = [detail.city, detail.state].filter(Boolean).join(', ');
    return (
      <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
        <button onClick={() => navigate('/dashboard/find-mentees')}
          style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#5c5c5c', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 16 }}>
          <ChevronLeft size={16} /> Back to Mentees
        </button>

        {/* Header card */}
        <div style={{ ...card, padding: 24, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{ width: 56, height: 56, borderRadius: 12, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
              {detail.avatar
                ? <img src={detail.avatar} alt={detail.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <Building2 size={24} color={G} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', margin: '0 0 4px' }}>{detail.name}</h2>
                {detail.persona && (
                  <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 12, fontWeight: 600, color: '#fff', background: PERSONA_COLORS[detail.persona] || '#888' }}>
                    {PERSONA_LABELS[detail.persona] || detail.persona}
                  </span>
                )}
              </div>
              {detail.headline && <p style={{ fontSize: 14, color: '#333', margin: '0 0 4px' }}>{detail.headline}</p>}
              <p style={{ fontSize: 13, color: '#666', margin: 0 }}>
                {detail.org_name || ''}
              </p>
              {loc && (
                <p style={{ fontSize: 12, color: '#5c5c5c', margin: '6px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <MapPin size={12} /> {loc}
                </p>
              )}
            </div>
          </div>

          {/* Areas */}
          {Array.isArray(detail.areas) && detail.areas.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
              {detail.areas.map((s, i) => (
                <span key={i} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#eff6ff', color: '#2563eb' }}>{s}</span>
              ))}
            </div>
          )}
        </div>

        {/* Summary */}
        {detail.summary && (
          <div style={{ ...card, padding: 20, marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 10 }}>About</h3>
            <p style={{ fontSize: 13, color: '#555', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{detail.summary}</p>
          </div>
        )}

        {/* Connect CTA — outbound LinkedIn */}
        {detail.linkedin_url && (
          <a href={detail.linkedin_url} target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: G, color: '#fff', textDecoration: 'none', padding: '12px 24px', borderRadius: 10, fontWeight: 600, fontSize: 14 }}>
            Connect on LinkedIn <ExternalLink size={16} />
          </a>
        )}
      </div>
    );
  }

  // ── List view ────────────────────────────────────────────────
  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      <h1 id="tour-page-find-mentees" style={{ fontSize: 24, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
        <UserPlus size={22} color={G} /> Find Mentees
      </h1>
      <p style={{ color: '#5c5c5c', fontSize: 14, marginTop: 6, marginBottom: 20 }}>
        Discover startups, students, and academics across the ecosystem who are open to mentorship.
      </p>

      {/* Search + persona filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#6e6e6e' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') setQuery(search.trim()); }}
            placeholder="Search by name or organization…"
            style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid #ddd', borderRadius: 10, fontSize: 16, boxSizing: 'border-box' }} />
        </div>
        <select value={persona} onChange={e => setPersona(e.target.value)}
          style={{ padding: '10px 12px', border: '1px solid #ddd', borderRadius: 10, fontSize: 14, background: '#fff', cursor: 'pointer' }}>
          <option value="">All personas</option>
          <option value="startup">Startups</option>
          <option value="student">Students</option>
          <option value="academia">Academia</option>
        </select>
        <button onClick={() => setQuery(search.trim())}
          style={{ background: G, color: '#fff', border: 'none', borderRadius: 10, padding: '0 22px', cursor: 'pointer', fontWeight: 600 }}>
          Search
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Loader2 size={28} className="animate-spin" style={{ color: G }} /></div>
      ) : items.length === 0 ? (
        <p style={{ color: '#5c5c5c', textAlign: 'center', marginTop: 40 }}>No one is currently seeking mentorship. Check back soon.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 16 }}>
          {items.map(m => {
            const loc = [m.city, m.state].filter(Boolean).join(', ');
            return (
              <div key={m.user_id} onClick={() => navigate(`/dashboard/find-mentees/${m.user_id}`)}
                style={{ ...card, padding: 18, cursor: 'pointer', display: 'flex', flexDirection: 'column', transition: 'border-color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = G}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#eee'}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                    {m.avatar
                      ? <img src={m.avatar} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <Building2 size={18} color={G} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, flex: 1 }}>{m.name}</h3>
                      {m.persona && (
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 12, fontWeight: 600, color: '#fff', background: PERSONA_COLORS[m.persona] || '#888' }}>
                          {PERSONA_LABELS[m.persona] || m.persona}
                        </span>
                      )}
                    </div>
                    {m.org_name && <p style={{ margin: '2px 0 0', fontSize: 12, color: '#5c5c5c' }}>{m.org_name}</p>}
                  </div>
                </div>
                {m.headline && <p style={{ margin: '10px 0 0', fontSize: 13, color: '#444', fontWeight: 500 }}>{m.headline}</p>}
                {Array.isArray(m.areas) && m.areas.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {m.areas.slice(0, 4).map((s, i) => (
                      <span key={i} style={{ fontSize: 11, background: '#F5F3EF', color: '#152838', padding: '2px 8px', borderRadius: 10 }}>{s}</span>
                    ))}
                  </div>
                )}
                {m.summary && <p style={{ margin: '10px 0 0', fontSize: 13, color: '#666', lineHeight: 1.45 }}>{m.summary.substring(0, 120)}{m.summary.length > 120 ? '…' : ''}</p>}
                {loc && (
                  <p style={{ margin: '8px 0 0', fontSize: 12, color: '#5c5c5c', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={12} /> {loc}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
