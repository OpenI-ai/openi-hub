import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { labAnnouncementAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Search, ChevronLeft, Calendar, Building2, Loader2, ExternalLink, Megaphone } from 'lucide-react';

const G = '#D0A848';
const card = { background: '#fff', border: '1px solid #eee', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' };

const STATUS_COLORS = { open: '#22C55E', closed: '#EF4444' };

export default function BrowseLabFacilities() {
  const navigate = useNavigate();
  const { id: paramId } = useParams();
  const selectedId = paramId ? parseInt(paramId, 10) : null;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');

  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await labAnnouncementAPI.listPublic(query ? { search: query } : {});
      const data = Array.isArray(res) ? res : (res.data || []);
      setItems(data);
    } catch { toast.error('Failed to load facility calls'); }
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [query]);

  // Route-driven detail
  useEffect(() => {
    if (selectedId && (!detail || detail.id !== selectedId)) {
      setDetailLoading(true);
      labAnnouncementAPI.getPublic(selectedId)
        .then(res => setDetail(res.data || res))
        .catch(() => { toast.error('Announcement not found'); navigate('/dashboard/browse-facilities'); })
        .finally(() => setDetailLoading(false));
    }
    if (!selectedId && detail) setDetail(null);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [selectedId]);

  const fmtDate = (d) => {
    if (!d) return null;
    try { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return d; }
  };

  // ── Detail view ──────────────────────────────────────────────
  if (selectedId) {
    if (detailLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Loader2 size={28} className="animate-spin" style={{ color: G }} /></div>;
    if (!detail) return null;
    return (
      <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
        <button onClick={() => navigate('/dashboard/browse-facilities')}
          style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#888', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 16 }}>
          <ChevronLeft size={16} /> Back to Facility Calls
        </button>

        {/* Header card */}
        <div style={{ ...card, padding: 24, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 10, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Building2 size={22} color={G} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', margin: '0 0 4px' }}>{detail.title}</h2>
                {detail.status && (
                  <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 12, fontWeight: 600, color: '#fff', background: STATUS_COLORS[detail.status] || '#888', textTransform: 'capitalize' }}>
                    {detail.status}
                  </span>
                )}
              </div>
              <p style={{ fontSize: 13, color: '#666', margin: 0 }}>
                {detail.lab_org || detail.lab_name || 'Lab Facility'}
                {detail.lab_org && detail.lab_name && detail.lab_org !== detail.lab_name ? ` · ${detail.lab_name}` : ''}
              </p>
            </div>
          </div>

          {/* Meta row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 12, color: '#666', marginTop: 14 }}>
            {detail.deadline && (
              <span><Calendar size={12} style={{ verticalAlign: -2 }} /> Deadline: {fmtDate(detail.deadline)}</span>
            )}
          </div>

          {/* Tags */}
          {Array.isArray(detail.sectors) && detail.sectors.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
              {detail.sectors.map((s, i) => (
                <span key={i} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: '#eff6ff', color: '#2563eb' }}>{s}</span>
              ))}
            </div>
          )}
        </div>

        {/* Description */}
        {detail.description && (
          <div style={{ ...card, padding: 20, marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 10 }}>About this Call</h3>
            <p style={{ fontSize: 13, color: '#555', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{detail.description}</p>
          </div>
        )}

        {/* Facilities */}
        {Array.isArray(detail.facilities) && detail.facilities.length > 0 && (
          <div style={{ ...card, padding: 20, marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 10 }}>Facilities Available</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {detail.facilities.map((f, i) => (
                <span key={i} style={{ fontSize: 12, background: '#F5F3EF', color: '#152838', padding: '4px 10px', borderRadius: 10 }}>{f}</span>
              ))}
            </div>
          </div>
        )}

        {/* Eligibility */}
        {detail.eligibility && (
          <div style={{ ...card, padding: 20, marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 10 }}>Eligibility</h3>
            <p style={{ fontSize: 13, color: '#555', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{detail.eligibility}</p>
          </div>
        )}

        {/* Apply CTA — outbound link */}
        {detail.application_url && detail.status === 'open' && (
          <a href={detail.application_url} target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: G, color: '#fff', textDecoration: 'none', padding: '12px 24px', borderRadius: 10, fontWeight: 600, fontSize: 14 }}>
            Apply Now <ExternalLink size={16} />
          </a>
        )}
        {detail.status === 'closed' && (
          <p style={{ fontSize: 13, color: '#EF4444', fontWeight: 600 }}>This call is now closed.</p>
        )}
      </div>
    );
  }

  // ── List view ────────────────────────────────────────────────
  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      <h1 id="tour-page-browse-facilities" style={{ fontSize: 24, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Megaphone size={22} color={G} /> Lab Facility Calls
      </h1>
      <p style={{ color: '#888', fontSize: 14, marginTop: 6, marginBottom: 20 }}>
        Discover open calls from labs across the ecosystem inviting startups to apply for facility access.
      </p>

      {/* Search */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') setQuery(search.trim()); }}
            placeholder="Search facility calls…"
            style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid #ddd', borderRadius: 10, fontSize: 16, boxSizing: 'border-box' }} />
        </div>
        <button onClick={() => setQuery(search.trim())}
          style={{ background: G, color: '#fff', border: 'none', borderRadius: 10, padding: '0 22px', cursor: 'pointer', fontWeight: 600 }}>
          Search
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Loader2 size={28} className="animate-spin" style={{ color: G }} /></div>
      ) : items.length === 0 ? (
        <p style={{ color: '#888', textAlign: 'center', marginTop: 40 }}>No open facility calls right now. Check back soon.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 16 }}>
          {items.map(a => (
            <div key={a.id} onClick={() => navigate(`/dashboard/browse-facilities/${a.id}`)}
              style={{ ...card, padding: 18, cursor: 'pointer', display: 'flex', flexDirection: 'column', transition: 'border-color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = G}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#eee'}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, flex: 1 }}>{a.title}</h3>
                {a.status && (
                  <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 12, fontWeight: 600, color: '#fff', background: STATUS_COLORS[a.status] || '#888', textTransform: 'capitalize' }}>
                    {a.status}
                  </span>
                )}
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#888' }}>
                {a.lab_org || a.lab_name || 'Lab Facility'}
              </p>
              {Array.isArray(a.sectors) && a.sectors.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                  {a.sectors.slice(0, 4).map((s, i) => (
                    <span key={i} style={{ fontSize: 11, background: '#F5F3EF', color: '#152838', padding: '2px 8px', borderRadius: 10 }}>{s}</span>
                  ))}
                </div>
              )}
              {a.description && <p style={{ margin: '10px 0 0', fontSize: 13, color: '#666', lineHeight: 1.45 }}>{a.description.substring(0, 120)}{a.description.length > 120 ? '…' : ''}</p>}
              {a.deadline && (
                <p style={{ margin: '8px 0 0', fontSize: 12, color: '#888', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Calendar size={12} /> Deadline: {fmtDate(a.deadline)}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
