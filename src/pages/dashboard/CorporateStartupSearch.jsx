import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { corporateAPI, watchlistAPI } from '../../services/api';
import {
  Search, Filter, Rocket, Star, Link2, MessageSquare,
  X, Loader2, MapPin, Zap, TrendingUp, Cpu,
} from 'lucide-react';
import toast from 'react-hot-toast';

const G = '#D5AA5B';
const card = { background: '#fff', border: '1px solid #eee', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' };

export default function CorporateStartupSearch() {
  const navigate = useNavigate();
  const [taxonomy, setTaxonomy] = useState({ sectors: [], functions: [], technologies: [], usecases: [] });
  const [filters, setFilters] = useState({ sector: '', func: '', technology: '', usecase: '', stage: '', search: '' });
  const [startups, setStartups] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [taxLoading, setTaxLoading] = useState(true);

  useEffect(() => { loadTaxonomy(); }, []);
  useEffect(() => { loadStartups(); }, [page, filters]);

  const loadTaxonomy = async () => {
    try { const d = await corporateAPI.getTaxonomy(); setTaxonomy(d); }
    catch { toast.error('Failed to load filters'); }
    finally { setTaxLoading(false); }
  };

  const loadStartups = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (filters.search) params.search = filters.search;
      if (filters.sector) params.sector = filters.sector;
      if (filters.func) params.func = filters.func;
      if (filters.technology) params.technology = filters.technology;
      if (filters.usecase) params.usecase = filters.usecase;
      if (filters.stage) params.stage = filters.stage;
      const d = await corporateAPI.searchStartups(params);
      setStartups(d.startups || []);
      setTotal(d.total || 0);
    } catch { toast.error('Failed to load startups'); }
    finally { setLoading(false); }
  };

  const setFilter = (key, val) => { setFilters(p => ({ ...p, [key]: val })); setPage(1); };
  const clearFilters = () => { setFilters({ sector: '', func: '', technology: '', usecase: '', stage: '', search: '' }); setPage(1); };
  const hasFilters = Object.values(filters).some(v => v);

  const stages = ['Ideation', 'Pre-seed', 'Seed', 'Series A', 'Series B', 'Growth'];

  const startCollab = async (startup) => {
    try {
      await corporateAPI.createCollab({ startup_id: startup.id, title: `${startup.name} - Exploration` });
      toast.success(`Started collaboration with ${startup.name}`);
    } catch (err) { toast.error(err.message); }
  };

  return (
    <div style={{ padding: 24, display: 'flex', gap: 20 }}>
      {/* Left Filter Panel */}
      <div style={{ width: 260, flexShrink: 0 }}>
        <div style={{ ...card, padding: 16, position: 'sticky', top: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>
              <Filter size={14} style={{ marginRight: 6, verticalAlign: -2 }} />Filters
            </h3>
            {hasFilters && <button onClick={clearFilters} style={{ fontSize: 11, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}>Clear all</button>}
          </div>

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
            <input type="text" value={filters.search} onChange={e => setFilter('search', e.target.value)}
              placeholder="Search startups..."
              style={{ width: '100%', padding: '8px 10px 8px 30px', fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 8, outline: 'none', background: '#f9fafb' }}
              onFocus={e => e.target.style.borderColor = G} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
          </div>

          {/* Sector */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>Sector</label>
            <select value={filters.sector} onChange={e => setFilter('sector', e.target.value)}
              style={{ width: '100%', padding: '7px 8px', fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 8, background: '#f9fafb' }}>
              <option value="">All Sectors</option>
              {taxonomy.sectors.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>

          {/* Function */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>Function</label>
            <select value={filters.func} onChange={e => setFilter('func', e.target.value)}
              style={{ width: '100%', padding: '7px 8px', fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 8, background: '#f9fafb' }}>
              <option value="">All Functions</option>
              {taxonomy.functions.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
            </select>
          </div>

          {/* Technology (dropdown with optgroups for hierarchy) */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>Technology</label>
            <select
              value={filters.technology || ''}
              onChange={e => setFilter('technology', e.target.value)}
              style={{ width: '100%', padding: '7px 8px', fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 8, background: '#f9fafb' }}
            >
              <option value="">All Technologies</option>
              {(taxonomy.technologies || [])
                .filter(t => !t.parent_id)
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(root => {
                  const children = (taxonomy.technologies || [])
                    .filter(c => c.parent_id === root.id)
                    .sort((a, b) => a.name.localeCompare(b.name));
                  return (
                    <React.Fragment key={root.id}>
                      <option value={root.name}>{root.name}</option>
                      {children.length > 0 && (
                        <optgroup label={'  └─ ' + root.name}>
                          {children.map(child => (
                            <option key={child.id} value={child.name}>&nbsp;&nbsp;{child.name}</option>
                          ))}
                        </optgroup>
                      )}
                    </React.Fragment>
                  );
                })}
            </select>
          </div>

          {/* Use Case */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>Use Case</label>
            <select value={filters.usecase} onChange={e => setFilter('usecase', e.target.value)}
              style={{ width: '100%', padding: '7px 8px', fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 8, background: '#f9fafb' }}>
              <option value="">All Use Cases</option>
              {taxonomy.usecases.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
            </select>
          </div>

          {/* Stage */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>Stage</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {stages.map(s => (
                <button key={s} onClick={() => setFilter('stage', filters.stage === s ? '' : s)}
                  style={{ padding: '4px 10px', fontSize: 11, borderRadius: 20, border: `1px solid ${filters.stage === s ? G : '#e5e7eb'}`,
                    background: filters.stage === s ? G : '#fff', color: filters.stage === s ? '#fff' : '#666', cursor: 'pointer' }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>
            Discover Startups
          </h2>
          <span style={{ fontSize: 12, color: '#888' }}>{total} startups found</span>
        </div>

        {/* Active filter chips */}
        {hasFilters && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
            {Object.entries(filters).filter(([, v]) => v).map(([k, v]) => (
              <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', fontSize: 11, borderRadius: 20, background: `${G}12`, color: G, border: `1px solid ${G}30` }}>
                {k}: {v} <X size={12} style={{ cursor: 'pointer' }} onClick={() => setFilter(k, '')} />
              </span>
            ))}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}><Loader2 size={24} className="animate-spin" style={{ color: G }} /></div>
        ) : startups.length === 0 ? (
          <div style={{ ...card, padding: 40, textAlign: 'center' }}>
            <Rocket size={32} style={{ color: '#ddd', marginBottom: 10 }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: '#888' }}>No startups found</p>
            <p style={{ fontSize: 12, color: '#aaa' }}>Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
              {startups.map(s => (
                <div key={s.id} style={{ ...card, padding: 16, cursor: 'pointer' }}
                  onClick={() => navigate(`/dashboard/startup-profile/${s.id}`)}
                  onMouseEnter={e => e.currentTarget.style.borderColor = G}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#eee'}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: `${G}12`, color: G, fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${G}30`, flexShrink: 0 }}>
                      {s.name?.[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                      {(s.city || s.state) && <div style={{ fontSize: 11, color: '#888' }}><MapPin size={10} style={{ verticalAlign: -1 }} /> {s.city}{s.state ? `, ${s.state}` : ''}</div>}
                    </div>
                    {s.is_deeptech && <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe' }}><Cpu size={9} style={{ verticalAlign: -1 }} /> DeepTech</span>}
                  </div>

                  {s.tagline && <p style={{ fontSize: 12, color: '#666', marginBottom: 10, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{s.tagline}</p>}

                  {/* Taxonomy tags */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                    {(s.taxonomy_sectors || []).map(t => <span key={t} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: '#eff6ff', color: '#2563eb' }}>{t}</span>)}
                    {(s.taxonomy_technologies || []).map(t => <span key={t} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: '#fefce8', color: '#ca8a04' }}>{t}</span>)}
                    {(s.taxonomy_usecases || []).map(t => <span key={t} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: '#f0fdf4', color: '#16a34a' }}>{t}</span>)}
                  </div>

                  {/* Stats row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#888', paddingTop: 10, borderTop: '1px solid #f5f5f5' }}>
                    <span>{s.stage || '—'}</span>
                    <span>TRL {s.tech_readiness || '—'}</span>
                    <span>{s.sector || '—'}</span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6, marginTop: 10 }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => startCollab(s)} style={{ flex: 1, padding: '6px', fontSize: 11, fontWeight: 600, borderRadius: 7, background: `${G}12`, color: G, border: `1px solid ${G}30`, cursor: 'pointer' }}>
                      <Link2 size={12} style={{ verticalAlign: -2, marginRight: 3 }} /> Collaborate
                    </button>
                    <button onClick={() => navigate('/dashboard/messaging')} style={{ padding: '6px 10px', fontSize: 11, borderRadius: 7, background: '#f9fafb', color: '#666', border: '1px solid #e5e7eb', cursor: 'pointer' }}>
                      <MessageSquare size={12} style={{ verticalAlign: -2 }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {total > 12 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                  style={{ padding: '6px 14px', fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: page > 1 ? 'pointer' : 'not-allowed', color: page > 1 ? '#555' : '#ccc' }}>Previous</button>
                <span style={{ padding: '6px 14px', fontSize: 12, color: '#555' }}>Page {page} of {Math.ceil(total / 12)}</span>
                <button disabled={page >= Math.ceil(total / 12)} onClick={() => setPage(p => p + 1)}
                  style={{ padding: '6px 14px', fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: page < Math.ceil(total / 12) ? 'pointer' : 'not-allowed', color: page < Math.ceil(total / 12) ? '#555' : '#ccc' }}>Next</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
