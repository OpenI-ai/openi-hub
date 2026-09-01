import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { corporateAPI } from '../../services/api';
import { mapsAPI } from '../../services/clusterAPI';
import {
  Rocket, Link2, MessageSquare, Loader2, MapPin, Cpu, Plus, Upload, Globe, CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import TaxonomyFilterPanel from '../../components/TaxonomyFilterPanel';
import AddStartupModal from '../../components/AddStartupModal';
import BulkUploadModal from '../../components/BulkUploadModal';

const G = '#D0A848';
const card = { background: '#fff', border: '1px solid #eee', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' };

export default function CorporateStartupSearch() {
  const navigate = useNavigate();
  const [taxonomy, setTaxonomy] = useState({ sectors: [], functions: [], technologies: [], usecases: [] });
  const [filters, setFilters] = useState({ sector: '', func: '', technology: '', usecase: '', stage: '', search: '' });
  const [startups, setStartups] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [, setTaxLoading] = useState(true);
  // Add Startup — this route is corporate-gated, and corporate is in the
  // STARTUP_ADDER_ROLES set, so a scout on this page can submit a startup that
  // isn't in the Hub yet (same claimable stub the crawler/CSV path makes).
  const [showAdd, setShowAdd] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  // s102 — client-reported gap: nothing distinguished a registered/claimed
  // startup (messaging reaches a person) from an imported directory profile
  // (it does not). Backend now returns on_platform per row + honors this filter.
  const [onPlatformOnly, setOnPlatformOnly] = useState(false);

  useEffect(() => { loadTaxonomy(); }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional refetch on page/filters change; `loadStartups` is a stable inline closure
  useEffect(() => { loadStartups(); }, [page, filters, onPlatformOnly]);

  const loadTaxonomy = async () => {
    // s107 — filters speak the curated Innovation Maps taxonomy (118 terms,
    // same source of truth as /dashboard/maps), not the legacy
    // /api/public/taxonomy vocabulary: the backend resolves these labels
    // against taxonomy_terms and filters via startup_taxonomy at the
    // calibrated threshold. Falls back to the legacy vocabulary only if
    // the maps API is unavailable.
    try {
      const d = await mapsAPI.list();
      const byDim = Object.fromEntries(
        (d.dimensions || []).map(dim => [
          dim.dimension,
          dim.terms.filter(t => t.member_count > 0).map(t => ({ id: t.slug, name: t.label })),
        ])
      );
      setTaxonomy({
        sectors: byDim.sector || [],
        functions: byDim.function || [],
        technologies: byDim.technology || [],
        usecases: byDim.usecase || [],
      });
    } catch {
      try { const d = await corporateAPI.getTaxonomy(); setTaxonomy(d); }
      catch { toast.error('Failed to load filters'); }
    } finally { setTaxLoading(false); }
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
      if (onPlatformOnly) params.on_platform = 'true';
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
          <p style={{ fontSize: 12, color: '#5c5c5c', margin: '2px 0 0 0' }}>{total.toLocaleString()} startups found</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 13, fontWeight: 600, borderRadius: 8, background: G, color: '#1a1a1a', border: 'none', cursor: 'pointer', flexShrink: 0 }}
        >
          <Plus size={15} /> Add Startup
        </button>
            <button
              onClick={() => setShowBulkUpload(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 13, fontWeight: 600, borderRadius: 8, background: '#fff', color: G, border: `1px solid ${G}`, cursor: 'pointer', flexShrink: 0, marginLeft: 8 }}
            >
              <Upload size={15} /> Bulk Upload
            </button>
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

      {/* s102 — provenance filter */}
      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#555', margin: '0 0 12px', cursor: 'pointer', userSelect: 'none' }}
        title="Show only startups with a registered or claimed account — messaging and collaboration reach a real person">
        <input type="checkbox" checked={onPlatformOnly} onChange={e => { setOnPlatformOnly(e.target.checked); setPage(1); }} />
        On OpenI only <span style={{ color: '#999' }}>(hide unclaimed directory profiles)</span>
      </label>

      <div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}><Loader2 size={24} className="animate-spin" style={{ color: G }} /></div>
        ) : startups.length === 0 ? (
          <div style={{ ...card, padding: 40, textAlign: 'center' }}>
            <Rocket size={32} style={{ color: '#ddd', marginBottom: 10 }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: '#5c5c5c' }}>No startups found</p>
            <p style={{ fontSize: 12, color: '#6e6e6e', marginBottom: 14 }}>Try adjusting your filters — or add a startup that isn&apos;t in the Hub yet.</p>
            <button
              onClick={() => setShowAdd(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 13, fontWeight: 600, borderRadius: 8, background: G, color: '#1a1a1a', border: 'none', cursor: 'pointer' }}
            >
              <Plus size={15} /> Add a startup
            </button>
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
                      {(s.city || s.state) && <div style={{ fontSize: 10, color: '#5c5c5c', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}><MapPin size={9} style={{ verticalAlign: -1 }} /> {s.city}{s.state ? `, ${s.state}` : ''}</div>}
                    </div>
                    {s.is_deeptech && <Cpu size={12} style={{ color: '#7c3aed', flexShrink: 0 }} />}
                  </div>

                  {s.tagline && <p style={{ fontSize: 11, color: '#666', marginBottom: 8, lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{s.tagline}</p>}

                  {/* Primary chips */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 8 }}>
                    {s.on_platform ? (
                      <span title="Registered on OpenI — messaging and collaboration reach a real person"
                        style={{ fontSize: 9, padding: '1px 6px', borderRadius: 10, background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', fontWeight: 600 }}>
                        <CheckCircle2 size={8} style={{ verticalAlign: -1, marginRight: 2 }} />On OpenI
                      </span>
                    ) : (
                      <span title="Imported from public sources — nobody has claimed this profile yet, so in-platform messages won't be read. Reach out via their website instead."
                        style={{ fontSize: 9, padding: '1px 6px', borderRadius: 10, background: '#f3f4f6', color: '#6b7280', border: '1px solid #e5e7eb' }}>
                        Directory
                      </span>
                    )}
                    {s.sector && <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 10, background: '#eff6ff', color: '#2563eb', maxWidth: 110, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.sector}</span>}
                    {s.stage && <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 10, background: '#f3f4f6', color: '#555' }}>{s.stage}</span>}
                    {s.tech_readiness && <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 10, background: '#eff6ff', color: '#2563eb' }} title="Tech Readiness Level (1=concept · 9=proven in production)">Tech Readiness {s.tech_readiness}</span>}
                  </div>

                  {/* Actions — s102: Collab/Message only reach a real person on
                      registered/claimed startups; directory profiles get the
                      honest alternative (their website) instead of a dead inbox. */}
                  <div style={{ display: 'flex', gap: 4, paddingTop: 6, borderTop: '1px solid #f5f5f5' }} onClick={e => e.stopPropagation()}>
                    {s.on_platform ? (
                      <>
                        <button onClick={() => startCollab(s)} style={{ flex: 1, padding: '5px', fontSize: 10, fontWeight: 600, borderRadius: 6, background: `${G}12`, color: G, border: `1px solid ${G}30`, cursor: 'pointer' }}>
                          <Link2 size={10} style={{ verticalAlign: -1, marginRight: 2 }} /> Collab
                        </button>
                        <button onClick={() => navigate('/dashboard/messaging')} style={{ padding: '5px 8px', fontSize: 10, borderRadius: 6, background: '#f9fafb', color: '#666', border: '1px solid #e5e7eb', cursor: 'pointer' }}>
                          <MessageSquare size={10} style={{ verticalAlign: -1 }} />
                        </button>
                      </>
                    ) : s.website ? (
                      <a href={s.website.startsWith('http') ? s.website : `https://${s.website}`} target="_blank" rel="noreferrer"
                        title="Not on OpenI yet — reach out via their website"
                        style={{ flex: 1, padding: '5px', fontSize: 10, fontWeight: 600, borderRadius: 6, background: '#f9fafb', color: '#555', border: '1px solid #e5e7eb', textAlign: 'center', textDecoration: 'none' }}>
                        <Globe size={10} style={{ verticalAlign: -1, marginRight: 2 }} /> Visit website
                      </a>
                    ) : (
                      <span style={{ flex: 1, padding: '5px', fontSize: 10, color: '#999', textAlign: 'center' }}
                        title="Imported directory profile with no website on record">
                        Not on OpenI yet
                      </span>
                    )}
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

            {/* Always-visible footer CTA — parity with StartupDiscovery. The FTS
                rarely returns zero rows, so the empty-state CTA above is hard to
                reach; this gives a scout an Add path even when results exist. */}
            <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <p style={{ fontSize: 13, color: '#5c5c5c', margin: 0 }}>Can&apos;t find the startup you&apos;re looking for? Add it to the database.</p>
              <button
                onClick={() => setShowAdd(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 13, fontWeight: 600, borderRadius: 8, background: G, color: '#1a1a1a', border: 'none', cursor: 'pointer' }}
              >
                <Plus size={15} /> Add a startup
              </button>
            </div>
          </>
        )}
      </div>

      <AddStartupModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onAdded={() => { setPage(1); loadStartups(); }}
        initialName={filters.search}
      />

          <BulkUploadModal
            open={showBulkUpload}
            onClose={() => setShowBulkUpload(false)}
            onUploaded={() => { setPage(1); loadStartups(); }}
          />
    </div>
  );
}
