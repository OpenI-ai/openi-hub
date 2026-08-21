/**
 * Phase 36: Academia Discovery Page
 * Enables seeker personas to discover academic institutions and researchers.
 */
import { useState, useEffect } from 'react';
import { BookOpen, Search, MapPin, Award, FileText, ChevronLeft, ChevronRight, Loader2, ExternalLink, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { discoveryAPI } from '../../services/api';

const G = '#D0A848';
const card = { background: '#fff', border: '1px solid #eee', borderRadius: 14, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', cursor: 'pointer', transition: 'border-color 0.15s' };
const INST_TYPES = ['University', 'IIT', 'IIM', 'NIT', 'IIIT', 'Medical College', 'Research Institute', 'Lab', 'Other'];

export default function AcademiaDiscovery() {
  const [academia, setAcademia] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: '', institution_type: '', city: '', state: '', research_area: '', offering: '' });
  const [selected, setSelected] = useState(null);
  const limit = 24;

  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional refetch on page/filters change; `load` is a stable inline closure
  useEffect(() => { load(); }, [page, filters]);

  const load = async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
      const data = await discoveryAPI.academia(params);
      setAcademia(data.academia || []);
      setTotal(data.total || 0);
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <div id="tour-page-academia-header" style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <BookOpen size={22} style={{ color: G }} /> Source Academia
        </h1>
        <p style={{ fontSize: 12, color: '#5c5c5c', margin: '4px 0 0' }}>Connect with universities, researchers, and academic institutions for R&D collaborations</p>
      </div>

      {/* Filters */}
      <div style={{ ...card, padding: 12, marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', cursor: 'auto' }}>
        <div style={{ flex: '1 1 200px', position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: 9, color: '#6e6e6e' }} />
          <input value={filters.search} onChange={e => { setFilters(f => ({ ...f, search: e.target.value })); setPage(1); }}
            placeholder="Search institutions, researchers, departments..."
            style={{ width: '100%', padding: '7px 10px 7px 30px', fontSize: 16, border: '1px solid #ddd', borderRadius: 8 }} />
        </div>
        <select value={filters.institution_type} onChange={e => { setFilters(f => ({ ...f, institution_type: e.target.value })); setPage(1); }}
          style={{ padding: '7px 10px', fontSize: 16, border: '1px solid #ddd', borderRadius: 8 }}>
          <option value="">All Types</option>
          {INST_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <input value={filters.city} onChange={e => { setFilters(f => ({ ...f, city: e.target.value })); setPage(1); }}
          placeholder="City" style={{ width: 100, padding: '7px 10px', fontSize: 16, border: '1px solid #ddd', borderRadius: 8 }} />
        <input value={filters.state} onChange={e => { setFilters(f => ({ ...f, state: e.target.value })); setPage(1); }}
          placeholder="State" style={{ width: 100, padding: '7px 10px', fontSize: 16, border: '1px solid #ddd', borderRadius: 8 }} />
        <input value={filters.research_area} onChange={e => { setFilters(f => ({ ...f, research_area: e.target.value })); setPage(1); }}
          placeholder="Research Area" style={{ width: 120, padding: '7px 10px', fontSize: 16, border: '1px solid #ddd', borderRadius: 8 }} />
        {Object.values(filters).some(Boolean) && (
          <button onClick={() => { setFilters({ search: '', institution_type: '', city: '', state: '', research_area: '', offering: '' }); setPage(1); }}
            style={{ fontSize: 11, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Clear</button>
        )}
      </div>

      <div style={{ fontSize: 12, color: '#5c5c5c', marginBottom: 12 }}>{total} academic profile{total !== 1 ? 's' : ''} found</div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: G }} /></div>
      ) : academia.length === 0 ? (
        <div style={{ ...card, padding: 40, textAlign: 'center', color: '#666', fontSize: 13, cursor: 'auto' }}>No academic profiles found matching your criteria</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {academia.map(a => (
            <div key={a.user_id || a.id} style={card} onClick={() => setSelected(a)}
              onMouseEnter={e => e.currentTarget.style.borderColor = G}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#eee'}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
                {a.avatar ? (
                  <img src={a.avatar} alt="" style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#92400e' }}>
                    {(a.display_name || a.institution_name || '?')[0]}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.display_name || 'Researcher'}</div>
                  <div style={{ fontSize: 11, color: '#5c5c5c' }}>
                    {a.designation || ''}{a.department ? ` - ${a.department}` : ''}
                  </div>
                </div>
              </div>

              {a.institution_name && (
                <div style={{ fontSize: 11, color: '#555', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <BookOpen size={11} /> {a.institution_name}
                  {a.institution_type && <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 20, background: '#f3f4f6', color: '#666', marginLeft: 4 }}>{a.institution_type}</span>}
                </div>
              )}

              {(a.city || a.state) && (
                <div style={{ fontSize: 11, color: '#5c5c5c', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <MapPin size={11} /> {[a.city, a.state].filter(Boolean).join(', ')}
                </div>
              )}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 6 }}>
                {(a.research_areas || []).slice(0, 3).map(r => (
                  <span key={r} style={{ fontSize: 9, padding: '2px 7px', borderRadius: 20, background: '#fef3c7', color: '#92400e' }}>{r}</span>
                ))}
                {(a.offerings || []).slice(0, 2).map(o => (
                  <span key={o} style={{ fontSize: 9, padding: '2px 7px', borderRadius: 20, background: '#f0fdf4', color: '#15803d' }}>{o}</span>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 12, fontSize: 10, color: '#666' }}>
                {a.publications_count > 0 && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><FileText size={10} /> {a.publications_count} publications</span>
                )}
                {a.patents_count > 0 && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Award size={10} /> {a.patents_count} patents</span>
                )}
              </div>

              {(a.linkedin_url || a.google_scholar_url || a.website) && (
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  {a.linkedin_url && <a href={a.linkedin_url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: 10, color: '#2563eb', display: 'flex', alignItems: 'center', gap: 2 }}><ExternalLink size={9} /> LinkedIn</a>}
                  {a.google_scholar_url && <a href={a.google_scholar_url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: 10, color: '#2563eb', display: 'flex', alignItems: 'center', gap: 2 }}><ExternalLink size={9} /> Scholar</a>}
                  {a.website && <a href={a.website} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: 10, color: '#2563eb', display: 'flex', alignItems: 'center', gap: 2 }}><ExternalLink size={9} /> Website</a>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 20 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{ padding: '6px 12px', fontSize: 12, borderRadius: 8, border: '1px solid #ddd', background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}>
            <ChevronLeft size={14} />
          </button>
          <span style={{ fontSize: 12, color: '#666' }}>Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            style={{ padding: '6px 12px', fontSize: 12, borderRadius: 8, border: '1px solid #ddd', background: '#fff', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1 }}>
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div onClick={() => setSelected(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 16, padding: 24, maxWidth: 560, width: '100%', maxHeight: '85vh', overflowY: 'auto', position: 'relative', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <button onClick={() => setSelected(null)}
              style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', cursor: 'pointer', color: '#666', padding: 4 }}>
              <X size={20} />
            </button>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 16 }}>
              {selected.avatar ? (
                <img src={selected.avatar} alt="" style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover' }} />
              ) : (
                <div style={{ width: 56, height: 56, borderRadius: 12, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#92400e' }}>
                  {(selected.display_name || selected.institution_name || '?')[0]}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>{selected.display_name || 'Researcher'}</div>
                <div style={{ fontSize: 13, color: '#5c5c5c' }}>
                  {selected.designation || ''}{selected.department ? ` - ${selected.department}` : ''}
                </div>
              </div>
            </div>
            {selected.institution_name && (
              <div style={{ fontSize: 13, color: '#555', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                <BookOpen size={14} /> {selected.institution_name}
                {selected.institution_type && <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 20, background: '#f3f4f6', color: '#666', marginLeft: 4 }}>{selected.institution_type}</span>}
              </div>
            )}
            {(selected.city || selected.state) && (
              <div style={{ fontSize: 13, color: '#5c5c5c', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                <MapPin size={14} /> {[selected.city, selected.state].filter(Boolean).join(', ')}
              </div>
            )}
            {(selected.publications_count > 0 || selected.patents_count > 0) && (
              <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#666', marginBottom: 12 }}>
                {selected.publications_count > 0 && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FileText size={13} /> {selected.publications_count} publications</span>
                )}
                {selected.patents_count > 0 && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Award size={13} /> {selected.patents_count} patents</span>
                )}
              </div>
            )}
            {(selected.research_areas || []).length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#666', marginBottom: 6, textTransform: 'uppercase' }}>Research Areas</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {selected.research_areas.map(r => (
                    <span key={r} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, background: '#fef3c7', color: '#92400e' }}>{r}</span>
                  ))}
                </div>
              </div>
            )}
            {(selected.offerings || []).length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#666', marginBottom: 6, textTransform: 'uppercase' }}>Offerings</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {selected.offerings.map(o => (
                    <span key={o} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, background: '#f0fdf4', color: '#15803d' }}>{o}</span>
                  ))}
                </div>
              </div>
            )}
            {(selected.linkedin_url || selected.google_scholar_url || selected.website) && (
              <div style={{ display: 'flex', gap: 12, marginTop: 16, paddingTop: 16, borderTop: '1px solid #eee' }}>
                {selected.linkedin_url && <a href={selected.linkedin_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#2563eb', display: 'flex', alignItems: 'center', gap: 4 }}><ExternalLink size={11} /> LinkedIn</a>}
                {selected.google_scholar_url && <a href={selected.google_scholar_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#2563eb', display: 'flex', alignItems: 'center', gap: 4 }}><ExternalLink size={11} /> Scholar</a>}
                {selected.website && <a href={selected.website} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#2563eb', display: 'flex', alignItems: 'center', gap: 4 }}><ExternalLink size={11} /> Website</a>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
