/**
 * Phase 36: Student Discovery Page
 * Enables seeker personas to discover and source student talent.
 */
import { useState, useEffect } from 'react';
import { GraduationCap, Search, MapPin, BookOpen, Briefcase, ChevronLeft, ChevronRight, Loader2, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { discoveryAPI } from '../../services/api';

const G = '#D5AA5B';
const card = { background: '#fff', border: '1px solid #eee', borderRadius: 14, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', cursor: 'pointer', transition: 'border-color 0.15s' };

export default function StudentDiscovery() {
  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: '', city: '', state: '', graduation_year: '', research_area: '', skill: '' });
  const [facets, setFacets] = useState({ institutions: [] });
  const limit = 24;

  useEffect(() => { load(); }, [page, filters]);

  const load = async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
      const data = await discoveryAPI.students(params);
      setStudents(data.students || []);
      setTotal(data.total || 0);
      if (data.facets) setFacets(data.facets);
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <GraduationCap size={22} style={{ color: G }} /> Source Students
        </h1>
        <p style={{ fontSize: 12, color: '#888', margin: '4px 0 0' }}>Discover student talent for internships, projects, and research collaborations</p>
      </div>

      {/* Filters */}
      <div style={{ ...card, padding: 12, marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', cursor: 'auto' }}>
        <div style={{ flex: '1 1 200px', position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: 9, color: '#aaa' }} />
          <input value={filters.search} onChange={e => { setFilters(f => ({ ...f, search: e.target.value })); setPage(1); }}
            placeholder="Search students, institutions, projects..."
            style={{ width: '100%', padding: '7px 10px 7px 30px', fontSize: 12, border: '1px solid #ddd', borderRadius: 8, outline: 'none' }} />
        </div>
        <input value={filters.city} onChange={e => { setFilters(f => ({ ...f, city: e.target.value })); setPage(1); }}
          placeholder="City" style={{ width: 100, padding: '7px 10px', fontSize: 12, border: '1px solid #ddd', borderRadius: 8, outline: 'none' }} />
        <input value={filters.state} onChange={e => { setFilters(f => ({ ...f, state: e.target.value })); setPage(1); }}
          placeholder="State" style={{ width: 100, padding: '7px 10px', fontSize: 12, border: '1px solid #ddd', borderRadius: 8, outline: 'none' }} />
        <input value={filters.graduation_year} onChange={e => { setFilters(f => ({ ...f, graduation_year: e.target.value })); setPage(1); }}
          placeholder="Grad Year" type="number" style={{ width: 90, padding: '7px 10px', fontSize: 12, border: '1px solid #ddd', borderRadius: 8, outline: 'none' }} />
        <input value={filters.skill} onChange={e => { setFilters(f => ({ ...f, skill: e.target.value })); setPage(1); }}
          placeholder="Skill" style={{ width: 100, padding: '7px 10px', fontSize: 12, border: '1px solid #ddd', borderRadius: 8, outline: 'none' }} />
        {Object.values(filters).some(Boolean) && (
          <button onClick={() => { setFilters({ search: '', city: '', state: '', graduation_year: '', research_area: '', skill: '' }); setPage(1); }}
            style={{ fontSize: 11, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Clear</button>
        )}
      </div>

      {/* Results count */}
      <div style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>{total} student{total !== 1 ? 's' : ''} found</div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: G }} /></div>
      ) : students.length === 0 ? (
        <div style={{ ...card, padding: 40, textAlign: 'center', color: '#999', fontSize: 13, cursor: 'auto' }}>No students found matching your criteria</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {students.map(s => (
            <div key={s.user_id || s.id} style={card}
              onMouseEnter={e => e.currentTarget.style.borderColor = G}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#eee'}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
                {s.avatar ? (
                  <img src={s.avatar} alt="" style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#999' }}>
                    {(s.display_name || '?')[0]}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.display_name || 'Student'}</div>
                  <div style={{ fontSize: 11, color: '#888' }}>
                    {s.degree ? `${s.degree}` : ''}{s.department ? ` in ${s.department}` : ''}
                  </div>
                </div>
              </div>

              {s.institution && (
                <div style={{ fontSize: 11, color: '#555', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <BookOpen size={11} /> {s.institution}
                </div>
              )}

              {(s.city || s.state) && (
                <div style={{ fontSize: 11, color: '#888', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <MapPin size={11} /> {[s.city, s.state].filter(Boolean).join(', ')}
                </div>
              )}

              {s.project_title && (
                <div style={{ fontSize: 11, color: '#555', marginBottom: 6 }}>
                  <span style={{ fontWeight: 600 }}>Project:</span> {s.project_title}
                </div>
              )}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 6 }}>
                {(s.skills || []).slice(0, 4).map(sk => (
                  <span key={sk} style={{ fontSize: 9, padding: '2px 7px', borderRadius: 20, background: '#eff6ff', color: '#2563eb' }}>{sk}</span>
                ))}
                {(s.research_areas || []).slice(0, 2).map(r => (
                  <span key={r} style={{ fontSize: 9, padding: '2px 7px', borderRadius: 20, background: '#fef3c7', color: '#92400e' }}>{r}</span>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 8, fontSize: 10, color: '#999' }}>
                {s.graduation_year && <span>Class of {s.graduation_year}</span>}
                {(s.looking_for || []).length > 0 && <span>Seeking: {s.looking_for.slice(0, 2).join(', ')}</span>}
              </div>

              {(s.linkedin_url || s.portfolio_url) && (
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  {s.linkedin_url && <a href={s.linkedin_url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: 10, color: '#2563eb', display: 'flex', alignItems: 'center', gap: 2 }}><ExternalLink size={9} /> LinkedIn</a>}
                  {s.portfolio_url && <a href={s.portfolio_url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: 10, color: '#2563eb', display: 'flex', alignItems: 'center', gap: 2 }}><ExternalLink size={9} /> Portfolio</a>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
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
    </div>
  );
}
