import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { corporateAPI } from '../../services/api';
import {
  Rocket, Link2, MessageSquare, Loader2, MapPin, Cpu,
} from 'lucide-react';
import toast from 'react-hot-toast';
import TaxonomyFilterPanel from '../../components/TaxonomyFilterPanel';

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

  const startCollab = async (startup) => {
    try {
      await corporateAPI.createCollab({ startup_user_id: startup.user_id, title: `${startup.name} - Exploration` });
      toast.success(`Started collaboration with ${startup.name}`);
    } catch (err) { toast.error(err.message); }
  };

  return (
    <div style={{ padding: 24, maxWidth: 1600, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <h2 id="tour-page-corp-search-header" style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>Discover Startups</h2>
          <p style={{ fontSize: 12, color: '#888', margin: '2px 0 0 0' }}>{total.toLocaleString()} startups found</p>
        </div>
      </div>

      {/* Top horizontal filter bar */}
      <span id="tour-page-corp-search-filters" style={{ position: 'absolute' }} />
      <TaxonomyFilterPanel
        taxonomy={taxonomy}
        filters={filters}
        onChange={setFilter}
        onClear={clearFilters}
        facets={{}}
        showDeeptech={false}
      />

      <div>
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
            <div id="tour-page-corp-search-results" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
              {startups.map(s => (
                <div key={s.id} style={{ ...card, padding: 12, cursor: 'pointer' }}
                  onClick={() => navigate(`/dashboard/startup-profile/${s.id}`)}
                  onMouseEnter={e => e.currentTarget.style.borderColor = G}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#eee'}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    {s.logo_url ? (
                      <img
                        src={s.logo_url}
                        alt=""
                        style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'contain', background: '#fafafa', border: '1px solid #eee', flexShrink: 0 }}
                        onError={(e) => {
                          // Favicon 404 (e.g. mobikwik): swap in initial-letter avatar.
                          const fallback = document.createElement('div');
                          fallback.textContent = (s.name || '?').charAt(0).toUpperCase();
                          fallback.style.cssText = `width:32px;height:32px;border-radius:8px;background:${G}12;color:${G};font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center;border:1px solid ${G}30;flex-shrink:0;`;
                          e.target.replaceWith(fallback);
                        }}
                      />
                    ) : (
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: `${G}12`, color: G, fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${G}30`, flexShrink: 0 }}>
                        {(s.name || '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                      {(s.city || s.state) && <div style={{ fontSize: 10, color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}><MapPin size={9} style={{ verticalAlign: -1 }} /> {s.city}{s.state ? `, ${s.state}` : ''}</div>}
                    </div>
                    {s.is_deeptech && <Cpu size={12} style={{ color: '#7c3aed', flexShrink: 0 }} />}
                  </div>

                  {s.tagline && <p style={{ fontSize: 11, color: '#666', marginBottom: 8, lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{s.tagline}</p>}

                  {/* Primary chips */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 8 }}>
                    {s.sector && <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 10, background: '#eff6ff', color: '#2563eb', maxWidth: 110, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.sector}</span>}
                    {s.stage && <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 10, background: '#f3f4f6', color: '#555' }}>{s.stage}</span>}
                    {s.tech_readiness && <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 10, background: '#eff6ff', color: '#2563eb' }} title="Tech Readiness Level (1=concept · 9=proven in production)">Tech Readiness {s.tech_readiness}</span>}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 4, paddingTop: 6, borderTop: '1px solid #f5f5f5' }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => startCollab(s)} style={{ flex: 1, padding: '5px', fontSize: 10, fontWeight: 600, borderRadius: 6, background: `${G}12`, color: G, border: `1px solid ${G}30`, cursor: 'pointer' }}>
                      <Link2 size={10} style={{ verticalAlign: -1, marginRight: 2 }} /> Collab
                    </button>
                    <button onClick={() => navigate('/dashboard/messaging')} style={{ padding: '5px 8px', fontSize: 10, borderRadius: 6, background: '#f9fafb', color: '#666', border: '1px solid #e5e7eb', cursor: 'pointer' }}>
                      <MessageSquare size={10} style={{ verticalAlign: -1 }} />
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
