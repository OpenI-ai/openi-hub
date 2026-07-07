/**
 * Phase 36: Student Discovery Page
 * Enables seeker personas to discover and source student talent.
 */
import { useState, useEffect } from 'react';
import { GraduationCap, Search, MapPin, BookOpen, ChevronLeft, ChevronRight, Loader2, ExternalLink, FolderGit2, Award } from 'lucide-react';
import toast from 'react-hot-toast';
import { discoveryAPI, studentEnhAPI } from '../../services/api';

const G = '#D0A848';
const card = { background: '#fff', border: '1px solid #eee', borderRadius: 14, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', cursor: 'pointer', transition: 'border-color 0.15s' };

export default function StudentDiscovery() {
  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: '', city: '', state: '', graduation_year: '', research_area: '', skill: '' });
  const [, setFacets] = useState({ institutions: [] });
  const [selected, setSelected] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const limit = 24;

  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional refetch on page/filters change; `load` is a stable inline closure
  useEffect(() => { load(); }, [page, filters]);

  // Fetch the selected student's structured portfolio (projects + certs).
  useEffect(() => {
    if (!selected) { setPortfolio(null); return; }
    const sid = selected.user_id || selected.id;
    if (!sid) { setPortfolio(null); return; }
    let cancelled = false;
    setPortfolioLoading(true);
    studentEnhAPI.portfolioByUser(sid)
      .then(data => { if (!cancelled) setPortfolio(data); })
      .catch(() => { if (!cancelled) setPortfolio(null); })
      .finally(() => { if (!cancelled) setPortfolioLoading(false); });
    return () => { cancelled = true; };
  }, [selected]);

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

  // Phase 87b — when a student is selected, render the profile as a full page
  // (in place of the results list) rather than a centered popup overlay, per
  // testing-team feedback. "Back to results" returns to the discovery grid.
  if (selected) {
    return (
      <div style={{ padding: 24, maxWidth: 760, margin: '0 auto' }}>
        <button onClick={() => setSelected(null)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16, padding: '7px 12px', fontSize: 13, fontWeight: 600, color: '#555', background: '#fff', border: '1px solid #ddd', borderRadius: 8, cursor: 'pointer' }}>
          <ChevronLeft size={15} /> Back to results
        </button>

        <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #eee' }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 16 }}>
            {selected.avatar ? (
              <img src={selected.avatar} alt="" style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 56, height: 56, borderRadius: 12, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#999' }}>
                {(selected.display_name || '?')[0]}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>{selected.display_name || 'Student'}</div>
              <div style={{ fontSize: 13, color: '#888' }}>
                {selected.degree ? `${selected.degree}` : ''}{selected.department ? ` in ${selected.department}` : ''}
              </div>
            </div>
          </div>

          {selected.institution && (
            <div style={{ fontSize: 13, color: '#555', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
              <BookOpen size={14} /> {selected.institution}
            </div>
          )}
          {(selected.city || selected.state) && (
            <div style={{ fontSize: 13, color: '#888', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
              <MapPin size={14} /> {[selected.city, selected.state].filter(Boolean).join(', ')}
            </div>
          )}
          {selected.graduation_year && (
            <div style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>Class of {selected.graduation_year}</div>
          )}

          {selected.project_title && (
            <div style={{ fontSize: 13, color: '#555', marginBottom: 12 }}>
              <span style={{ fontWeight: 600 }}>Project:</span> {selected.project_title}
              {selected.project_description && <div style={{ marginTop: 4, color: '#777' }}>{selected.project_description}</div>}
            </div>
          )}

          {selected.bio && (
            <div style={{ fontSize: 13, color: '#444', marginBottom: 12, lineHeight: 1.5 }}>{selected.bio}</div>
          )}

          {(selected.skills || []).length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#999', marginBottom: 6, textTransform: 'uppercase' }}>Skills</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {selected.skills.map(sk => (
                  <span key={sk} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, background: '#eff6ff', color: '#2563eb' }}>{sk}</span>
                ))}
              </div>
            </div>
          )}

          {(selected.research_areas || []).length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#999', marginBottom: 6, textTransform: 'uppercase' }}>Research Areas</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {selected.research_areas.map(r => (
                  <span key={r} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, background: '#fef3c7', color: '#92400e' }}>{r}</span>
                ))}
              </div>
            </div>
          )}

          {(selected.looking_for || []).length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#999', marginBottom: 6, textTransform: 'uppercase' }}>Seeking</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {selected.looking_for.map(l => (
                  <span key={l} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, background: '#f0fdf4', color: '#16a34a' }}>{l}</span>
                ))}
              </div>
            </div>
          )}

          {/* Structured My-Portfolio: projects + certifications */}
          {portfolioLoading && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #eee', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#999' }}>
              <Loader2 size={14} className="animate-spin" /> Loading portfolio…
            </div>
          )}
          {!portfolioLoading && portfolio && (portfolio.projects || []).length > 0 && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #eee' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#999', marginBottom: 8, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 5 }}>
                <FolderGit2 size={13} /> Projects ({portfolio.projects.length})
              </div>
              {portfolio.projects.map(p => (
                <div key={p.id} style={{ marginBottom: 10, padding: 10, background: '#fafafa', borderRadius: 10, border: '1px solid #f0f0f0' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    {p.title}
                    {p.is_featured && <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 20, background: '#fef3c7', color: '#92400e' }}>Featured</span>}
                  </div>
                  {p.description && <div style={{ fontSize: 12, color: '#777', marginTop: 4, lineHeight: 1.45 }}>{p.description}</div>}
                  {(p.tech_stack || []).length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                      {p.tech_stack.map(t => <span key={t} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: '#eff6ff', color: '#2563eb' }}>{t}</span>)}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                    {p.github_url && <a href={p.github_url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: '#2563eb', display: 'flex', alignItems: 'center', gap: 3 }}><ExternalLink size={10} /> Code</a>}
                    {p.demo_url && <a href={p.demo_url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: '#2563eb', display: 'flex', alignItems: 'center', gap: 3 }}><ExternalLink size={10} /> Demo</a>}
                    {p.paper_url && <a href={p.paper_url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: '#2563eb', display: 'flex', alignItems: 'center', gap: 3 }}><ExternalLink size={10} /> Paper</a>}
                  </div>
                </div>
              ))}
            </div>
          )}
          {!portfolioLoading && portfolio && (portfolio.certifications || []).length > 0 && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #eee' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#999', marginBottom: 8, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Award size={13} /> Certifications ({portfolio.certifications.length})
              </div>
              {portfolio.certifications.map(c => (
                <div key={c.id} style={{ marginBottom: 8, padding: 10, background: '#fafafa', borderRadius: 10, border: '1px solid #f0f0f0' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    {c.title}
                    {c.is_verified && <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 20, background: '#f0fdf4', color: '#16a34a' }}>Verified</span>}
                  </div>
                  {c.provider && <div style={{ fontSize: 12, color: '#777', marginTop: 3 }}>{c.provider}</div>}
                  {c.credential_url && <a href={c.credential_url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: '#2563eb', display: 'flex', alignItems: 'center', gap: 3, marginTop: 5 }}><ExternalLink size={10} /> Credential</a>}
                </div>
              ))}
            </div>
          )}

          {(selected.linkedin_url || selected.portfolio_url) && (
            <div style={{ display: 'flex', gap: 12, marginTop: 16, paddingTop: 16, borderTop: '1px solid #eee' }}>
              {selected.linkedin_url && <a href={selected.linkedin_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#2563eb', display: 'flex', alignItems: 'center', gap: 4 }}><ExternalLink size={11} /> LinkedIn</a>}
              {selected.portfolio_url && <a href={selected.portfolio_proxy_url || selected.portfolio_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#2563eb', display: 'flex', alignItems: 'center', gap: 4 }}><ExternalLink size={11} /> Portfolio</a>}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <div id="tour-page-students-header" style={{ marginBottom: 20 }}>
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
            style={{ width: '100%', padding: '7px 10px 7px 30px', fontSize: 16, border: '1px solid #ddd', borderRadius: 8, outline: 'none' }} />
        </div>
        <input value={filters.city} onChange={e => { setFilters(f => ({ ...f, city: e.target.value })); setPage(1); }}
          placeholder="City" style={{ width: 100, padding: '7px 10px', fontSize: 16, border: '1px solid #ddd', borderRadius: 8, outline: 'none' }} />
        <input value={filters.state} onChange={e => { setFilters(f => ({ ...f, state: e.target.value })); setPage(1); }}
          placeholder="State" style={{ width: 100, padding: '7px 10px', fontSize: 16, border: '1px solid #ddd', borderRadius: 8, outline: 'none' }} />
        <input value={filters.graduation_year} onChange={e => { setFilters(f => ({ ...f, graduation_year: e.target.value })); setPage(1); }}
          placeholder="Grad Year" type="number" style={{ width: 90, padding: '7px 10px', fontSize: 16, border: '1px solid #ddd', borderRadius: 8, outline: 'none' }} />
        <input value={filters.skill} onChange={e => { setFilters(f => ({ ...f, skill: e.target.value })); setPage(1); }}
          placeholder="Skill" style={{ width: 100, padding: '7px 10px', fontSize: 16, border: '1px solid #ddd', borderRadius: 8, outline: 'none' }} />
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
            <div key={s.user_id || s.id} style={card} onClick={() => setSelected(s)}
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
                  {s.portfolio_url && <a href={s.portfolio_proxy_url || s.portfolio_url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: 10, color: '#2563eb', display: 'flex', alignItems: 'center', gap: 2 }}><ExternalLink size={9} /> Portfolio</a>}
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
