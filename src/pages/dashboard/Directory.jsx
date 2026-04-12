import { useState, useEffect } from 'react';
import { directoryAPI, profileAPI } from '../../services/api';
import { PERSONAS, PERSONA_CATEGORIES } from '../../config/personas';
import ConnectButton from '../../components/ConnectButton';
import MutualConnectionsBadge from '../../components/MutualConnectionsBadge';
import ContextualTip from '../../components/ContextualTip';
import {
  Search, Filter, ChevronLeft, Loader2, MapPin, Star, CheckCircle,
  X, Users, Building2, Rocket, GraduationCap, BookOpen, Landmark,
  TrendingUp, FlaskConical, Home, Zap, User, ArrowUpDown,
} from 'lucide-react';
import toast from 'react-hot-toast';

const G = '#D5AA5B';
const card = { background: '#fff', border: '1px solid #eee', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' };

const ICON_MAP = { Rocket, GraduationCap, BookOpen, Building2, Landmark, TrendingUp, Users, FlaskConical, Home, Zap };

export default function Directory() {
  const [profiles, setProfiles] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('');
  const [filters, setFilters] = useState({ persona_type: '', persona_category: '', city: '', state: '', sector: '', skill: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [filterOptions, setFilterOptions] = useState({ cities: [], states: [], sectors: [], skills: [] });
  const [facets, setFacets] = useState({});

  // Detail view state
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Sort options
  const SORT_OPTIONS = [
    { value: '', label: 'Default' },
    { value: 'relevance', label: 'Relevance' },
    { value: 'name_asc', label: 'Name A-Z' },
    { value: 'name_desc', label: 'Name Z-A' },
    { value: 'newest', label: 'Newest' },
    { value: 'profile_score', label: 'Profile Score' },
  ];

  useEffect(() => { loadProfiles(); loadFilters(); }, []);

  const loadProfiles = async (p = 1, s = search, f = filters, srt = sort) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 20 };
      if (s.trim()) params.search = s.trim();
      if (srt) params.sort = srt;
      Object.entries(f).forEach(([k, v]) => { if (v) params[k] = v; });
      const data = await directoryAPI.search(params);
      setProfiles(data.profiles || []);
      setTotal(data.total || 0);
      setFacets(data.facets?.persona_type || {});
      setPage(p);
    } catch { toast.error('Failed to load directory'); }
    finally { setLoading(false); }
  };

  const loadFilters = async () => {
    try { const d = await directoryAPI.filters(); setFilterOptions(d); } catch {}
  };

  const handleSearch = () => { loadProfiles(1, search, filters, sort); };
  const handleSort = (val) => { setSort(val); loadProfiles(1, search, filters, val); };
  const handleFacetClick = (type) => {
    const f = { ...filters, persona_type: filters.persona_type === type ? '' : type };
    setFilters(f);
    loadProfiles(1, search, f, sort);
  };
  const clearFilters = () => {
    const empty = { persona_type: '', persona_category: '', city: '', state: '', sector: '', skill: '' };
    setFilters(empty);
    setSort('');
    loadProfiles(1, search, empty, '');
  };

  const openDetail = async (userId) => {
    setDetailLoading(true);
    setSelectedId(userId);
    try {
      const data = await profileAPI.getPublic(userId);
      setDetail(data);
    } catch (err) { toast.error(err.message); setSelectedId(null); }
    finally { setDetailLoading(false); }
  };

  const totalPages = Math.ceil(total / 20);

  // ── Persona badge helper ─────────────────────────────────────
  const PersonaBadge = ({ type }) => {
    const p = PERSONAS[type];
    if (!p) return null;
    const Icon = ICON_MAP[p.icon];
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600,
        padding: '2px 10px', borderRadius: 20, background: `${p.color}14`, color: p.color }}>
        {Icon && <Icon size={12} />} {p.label}
      </span>
    );
  };

  // ── Avatar / Logo helper ─────────────────────────────────────
  const Avatar = ({ src, name, size = 52 }) => {
    if (src) {
      return <img src={src} alt="" style={{ width: size, height: size, borderRadius: 12, objectFit: 'cover', border: '1px solid #eee' }} />;
    }
    const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    return (
      <div style={{ width: size, height: size, borderRadius: 12, background: '#f3f4f6', display: 'flex',
        alignItems: 'center', justifyContent: 'center', fontSize: size * 0.35, fontWeight: 700, color: '#999', border: '1px solid #eee' }}>
        {initials}
      </div>
    );
  };

  // ── Detail View ─────────────────────────────────────────────
  if (selectedId) {
    if (detailLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Loader2 size={28} className="animate-spin" style={{ color: G }} /></div>;
    if (!detail) return null;

    const { user: u, profile: prof } = detail;
    const persona = PERSONAS[u.role] || {};
    const Icon = ICON_MAP[persona.icon];

    // Build detail fields based on role
    const detailSections = buildDetailSections(u.role, prof);

    return (
      <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
        <button onClick={() => { setSelectedId(null); setDetail(null); }}
          style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#888', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 16 }}>
          <ChevronLeft size={16} /> Back to Directory
        </button>

        {/* Profile header */}
        <div style={{ ...card, padding: 24, marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <Avatar src={prof?.logo_url || u.avatar} name={u.name} size={64} />
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', margin: '0 0 4px' }}>{u.name}</h2>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>{u.organization_name || ''}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                <PersonaBadge type={u.role} />
                <span style={{ fontSize: 11, color: '#999', padding: '2px 10px', borderRadius: 20, background: '#f9fafb' }}>
                  {PERSONA_CATEGORIES[u.persona_category]?.label || u.persona_category}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Detail sections */}
        {detailSections.map((section, i) => (
          <div key={i} style={{ ...card, padding: 20, marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 }}>{section.title}</h3>
            {section.type === 'fields' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                {section.fields.filter(f => f.value).map((f, j) => (
                  <div key={j}>
                    <div style={{ fontSize: 11, color: '#999', marginBottom: 2 }}>{f.label}</div>
                    <div style={{ fontSize: 13, color: '#333', fontWeight: 500 }}>{f.value}</div>
                  </div>
                ))}
              </div>
            )}
            {section.type === 'text' && (
              <p style={{ fontSize: 13, color: '#555', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{section.value}</p>
            )}
            {section.type === 'tags' && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {section.tags.map((t, j) => (
                  <span key={j} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: section.bg || '#eff6ff', color: section.color || '#2563eb' }}>{t}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  // ── List View ──────────────────────────────────────────────
  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', margin: '0 0 4px' }}>Directory</h1>
        <p style={{ fontSize: 13, color: '#888', margin: 0 }}>Discover innovators, mentors, investors, labs, and more across the ecosystem</p>
        <ContextualTip tipKey="directory-intro">
          Search by name, filter by persona type or sector, and click Connect to build your network. Use the sort dropdown to find the most relevant profiles.
        </ContextualTip>
      </div>

      {/* Search bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search by name, organization, or tagline..."
            style={{ width: '100%', padding: '10px 12px 10px 36px', fontSize: 13, border: '1px solid #ddd', borderRadius: 10, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <button onClick={handleSearch}
          style={{ padding: '10px 20px', fontSize: 13, fontWeight: 600, borderRadius: 10, background: G, color: '#fff', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          Search
        </button>
        <button onClick={() => setShowFilters(!showFilters)}
          style={{ padding: '10px 14px', fontSize: 13, borderRadius: 10, background: showFilters ? '#f0f0f0' : '#fff', border: '1px solid #ddd', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Filter size={14} /> Filters
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ArrowUpDown size={14} style={{ color: '#888' }} />
          <select value={sort} onChange={e => handleSort(e.target.value)}
            style={{ padding: '8px 10px', fontSize: 12, border: '1px solid #ddd', borderRadius: 8, outline: 'none', background: '#fff', cursor: 'pointer' }}>
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Facet chips */}
      {Object.keys(facets).length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
          {Object.entries(facets).map(([type, count]) => {
            const active = filters.persona_type === type;
            return (
              <button key={type} onClick={() => handleFacetClick(type)}
                style={{
                  padding: '4px 12px', borderRadius: 16, fontSize: 11, cursor: 'pointer',
                  border: active ? `2px solid ${G}` : '1px solid #ddd',
                  background: active ? '#fffbf0' : '#fff',
                  color: active ? '#1a1a2e' : '#666', fontWeight: active ? 600 : 400,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                {(PERSONAS[type]?.label || type).replace('_', ' ')}
                <span style={{ background: active ? G : '#eee', color: active ? '#fff' : '#888', borderRadius: 8, padding: '0 6px', fontSize: 10 }}>{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Filter panel */}
      {showFilters && (
        <div style={{ ...card, padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {/* Persona Type */}
            <div>
              <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>Persona Type</label>
              <select value={filters.persona_type} onChange={e => setFilters(f => ({ ...f, persona_type: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid #ddd', borderRadius: 8, outline: 'none', boxSizing: 'border-box' }}>
                <option value="">All Types</option>
                {Object.entries(PERSONAS).map(([key, p]) => <option key={key} value={key}>{p.label}</option>)}
              </select>
            </div>

            {/* Category */}
            <div>
              <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>Category</label>
              <select value={filters.persona_category} onChange={e => setFilters(f => ({ ...f, persona_category: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid #ddd', borderRadius: 8, outline: 'none', boxSizing: 'border-box' }}>
                <option value="">All Categories</option>
                {Object.entries(PERSONA_CATEGORIES).map(([key, c]) => <option key={key} value={key}>{c.label}</option>)}
              </select>
            </div>

            {/* City */}
            <div>
              <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>City</label>
              <input value={filters.city} onChange={e => setFilters(f => ({ ...f, city: e.target.value }))}
                placeholder="e.g., Delhi" list="dir-cities"
                style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid #ddd', borderRadius: 8, outline: 'none', boxSizing: 'border-box' }} />
              <datalist id="dir-cities">{filterOptions.cities.map(c => <option key={c} value={c} />)}</datalist>
            </div>

            {/* State */}
            <div>
              <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>State</label>
              <input value={filters.state} onChange={e => setFilters(f => ({ ...f, state: e.target.value }))}
                placeholder="e.g., Karnataka" list="dir-states"
                style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid #ddd', borderRadius: 8, outline: 'none', boxSizing: 'border-box' }} />
              <datalist id="dir-states">{filterOptions.states.map(s => <option key={s} value={s} />)}</datalist>
            </div>

            {/* Sector */}
            <div>
              <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>Sector / Focus Area</label>
              <input value={filters.sector} onChange={e => setFilters(f => ({ ...f, sector: e.target.value }))}
                placeholder="e.g., AI/ML" list="dir-sectors"
                style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid #ddd', borderRadius: 8, outline: 'none', boxSizing: 'border-box' }} />
              <datalist id="dir-sectors">{filterOptions.sectors.map(s => <option key={s} value={s} />)}</datalist>
            </div>

            {/* Skill */}
            <div>
              <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>Skill / Technology</label>
              <input value={filters.skill} onChange={e => setFilters(f => ({ ...f, skill: e.target.value }))}
                placeholder="e.g., Python" list="dir-skills"
                style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid #ddd', borderRadius: 8, outline: 'none', boxSizing: 'border-box' }} />
              <datalist id="dir-skills">{filterOptions.skills.map(s => <option key={s} value={s} />)}</datalist>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <button onClick={clearFilters}
              style={{ padding: '8px 16px', fontSize: 12, borderRadius: 8, background: '#fff', border: '1px solid #ddd', cursor: 'pointer', color: '#666' }}>
              Clear
            </button>
            <button onClick={() => loadProfiles(1, search, filters)}
              style={{ padding: '8px 16px', fontSize: 12, fontWeight: 600, borderRadius: 8, background: G, color: '#fff', border: 'none', cursor: 'pointer' }}>
              Apply
            </button>
          </div>
        </div>
      )}

      {/* Result count */}
      <div style={{ fontSize: 12, color: '#999', marginBottom: 12 }}>
        {loading ? 'Searching...' : `${total} profile${total !== 1 ? 's' : ''} found`}
      </div>

      {/* Loading */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <Loader2 size={28} className="animate-spin" style={{ color: G }} />
        </div>
      ) : profiles.length === 0 ? (
        /* Empty state */
        <div style={{ ...card, padding: 48, textAlign: 'center' }}>
          <Users size={40} style={{ color: '#ddd', marginBottom: 12 }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: '#999', marginBottom: 4 }}>No profiles found</div>
          <div style={{ fontSize: 13, color: '#bbb' }}>Try adjusting your search or filters</div>
        </div>
      ) : (
        <>
          {/* Results grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
            {profiles.map(p => (
              <div key={p.id} onClick={() => openDetail(p.user_id)} style={{ ...card, padding: 18, cursor: 'pointer', transition: 'box-shadow 0.15s', position: 'relative' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.10)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'}>

                {/* Featured / Verified badges */}
                <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 4 }}>
                  {p.is_featured && <Star size={14} style={{ color: '#f59e0b', fill: '#f59e0b' }} />}
                  {p.is_verified && <CheckCircle size={14} style={{ color: '#16a34a' }} />}
                </div>

                {/* Top row: avatar + name + org */}
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 10 }}>
                  <Avatar src={p.logo_url || p.avatar} name={p.display_name} size={48} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.display_name}</div>
                    {p.organization && (
                      <div style={{ fontSize: 12, color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.organization}</div>
                    )}
                    <div style={{ marginTop: 4 }}>
                      <PersonaBadge type={p.persona_type} />
                    </div>
                  </div>
                </div>

                {/* Tagline */}
                {p.tagline && (
                  <div style={{ fontSize: 12, color: '#777', marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {p.tagline}
                  </div>
                )}

                {/* Location */}
                {(p.city || p.state) && (
                  <div style={{ fontSize: 12, color: '#999', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={12} /> {[p.city, p.state].filter(Boolean).join(', ')}
                  </div>
                )}

                {/* Sectors */}
                {p.sectors && p.sectors.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 6 }}>
                    {p.sectors.slice(0, 4).map(t => (
                      <span key={t} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: '#eff6ff', color: '#2563eb' }}>{t}</span>
                    ))}
                    {p.sectors.length > 4 && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: '#f3f4f6', color: '#999' }}>+{p.sectors.length - 4}</span>}
                  </div>
                )}

                {/* Skills */}
                {p.skills_or_focus && p.skills_or_focus.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 6 }}>
                    {p.skills_or_focus.slice(0, 4).map(t => (
                      <span key={t} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: '#fefce8', color: '#ca8a04' }}>{t}</span>
                    ))}
                    {p.skills_or_focus.length > 4 && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: '#f3f4f6', color: '#999' }}>+{p.skills_or_focus.length - 4}</span>}
                  </div>
                )}

                {/* Profile score bar */}
                {p.profile_score > 0 && (
                  <div style={{ marginTop: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#bbb', marginBottom: 3 }}>
                      <span>Profile</span>
                      <span>{p.profile_score}%</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: '#f3f4f6' }}>
                      <div style={{ height: '100%', borderRadius: 2, background: p.profile_score >= 70 ? '#16a34a' : p.profile_score >= 40 ? '#f59e0b' : '#ef4444', width: `${p.profile_score}%` }} />
                    </div>
                  </div>
                )}

                {/* Connect + Mutual connections (Phase 18) */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, borderTop: '1px solid #f5f5f5', paddingTop: 8 }}
                  onClick={e => e.stopPropagation()}>
                  <MutualConnectionsBadge userId={p.user_id} size="sm" />
                  <ConnectButton userId={p.user_id} size="sm" />
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 20 }}>
              <button onClick={() => loadProfiles(page - 1, search, filters)} disabled={page <= 1}
                style={{ padding: '8px 16px', fontSize: 12, borderRadius: 8, border: '1px solid #ddd', background: '#fff', cursor: page <= 1 ? 'not-allowed' : 'pointer', color: page <= 1 ? '#ccc' : '#333' }}>
                Previous
              </button>
              <span style={{ fontSize: 12, color: '#999' }}>Page {page} of {totalPages}</span>
              <button onClick={() => loadProfiles(page + 1, search, filters)} disabled={page >= totalPages}
                style={{ padding: '8px 16px', fontSize: 12, borderRadius: 8, border: '1px solid #ddd', background: '#fff', cursor: page >= totalPages ? 'not-allowed' : 'pointer', color: page >= totalPages ? '#ccc' : '#333' }}>
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Build detail sections from profile data per role ──────────
function buildDetailSections(role, prof) {
  if (!prof) return [];
  const sections = [];

  // Common: About / Bio / Description
  const about = prof.description || prof.bio;
  if (about) sections.push({ title: 'About', type: 'text', value: about });

  // Location
  const loc = [prof.city, prof.state, prof.country].filter(Boolean);
  const baseFields = [];
  if (loc.length) baseFields.push({ label: 'Location', value: loc.join(', ') });
  if (prof.website) baseFields.push({ label: 'Website', value: prof.website });
  if (prof.linkedin_url) baseFields.push({ label: 'LinkedIn', value: prof.linkedin_url });

  // Role-specific fields
  if (role === 'startup') {
    if (prof.sector)         baseFields.push({ label: 'Sector', value: prof.sector });
    if (prof.stage)          baseFields.push({ label: 'Stage', value: prof.stage });
    if (prof.founded_year)   baseFields.push({ label: 'Founded', value: prof.founded_year });
    if (prof.team_size)      baseFields.push({ label: 'Team Size', value: prof.team_size });
    if (prof.tech_readiness) baseFields.push({ label: 'TRL', value: prof.tech_readiness });
    if (prof.is_deeptech)    baseFields.push({ label: 'DeepTech', value: 'Yes' });
    if (prof.dpiit_number)   baseFields.push({ label: 'DPIIT', value: prof.dpiit_number });
  } else if (role === 'student') {
    if (prof.institution)      baseFields.push({ label: 'Institution', value: prof.institution });
    if (prof.degree)           baseFields.push({ label: 'Degree', value: prof.degree });
    if (prof.department)       baseFields.push({ label: 'Department', value: prof.department });
    if (prof.graduation_year)  baseFields.push({ label: 'Graduating', value: prof.graduation_year });
    if (prof.project_title)    baseFields.push({ label: 'Project', value: prof.project_title });
  } else if (role === 'academia') {
    if (prof.institution_name) baseFields.push({ label: 'Institution', value: prof.institution_name });
    if (prof.institution_type) baseFields.push({ label: 'Type', value: prof.institution_type });
    if (prof.department)       baseFields.push({ label: 'Department', value: prof.department });
    if (prof.designation)      baseFields.push({ label: 'Designation', value: prof.designation });
    if (prof.publications_count) baseFields.push({ label: 'Publications', value: prof.publications_count });
    if (prof.patents_count)    baseFields.push({ label: 'Patents', value: prof.patents_count });
  } else if (role === 'corporate') {
    if (prof.industry)       baseFields.push({ label: 'Industry', value: prof.industry });
    if (prof.company_size)   baseFields.push({ label: 'Company Size', value: prof.company_size });
    if (prof.annual_revenue) baseFields.push({ label: 'Revenue', value: prof.annual_revenue });
    if (prof.contact_person) baseFields.push({ label: 'Contact', value: prof.contact_person });
  } else if (role === 'government') {
    if (prof.body_type)   baseFields.push({ label: 'Type', value: prof.body_type });
    if (prof.department)  baseFields.push({ label: 'Department', value: prof.department });
    if (prof.designation) baseFields.push({ label: 'Designation', value: prof.designation });
  } else if (role === 'investor') {
    if (prof.investor_type) baseFields.push({ label: 'Type', value: prof.investor_type });
    if (prof.fund_size)     baseFields.push({ label: 'Fund Size', value: prof.fund_size });
    if (prof.portfolio_count) baseFields.push({ label: 'Portfolio', value: prof.portfolio_count });
  } else if (role === 'mentor') {
    if (prof.designation)      baseFields.push({ label: 'Designation', value: prof.designation });
    if (prof.organisation)     baseFields.push({ label: 'Organisation', value: prof.organisation });
    if (prof.years_experience) baseFields.push({ label: 'Experience', value: `${prof.years_experience} years` });
    if (prof.max_mentees)      baseFields.push({ label: 'Max Mentees', value: prof.max_mentees });
  } else if (role === 'lab') {
    if (prof.parent_org)  baseFields.push({ label: 'Parent Org', value: prof.parent_org });
    if (prof.lab_type)    baseFields.push({ label: 'Lab Type', value: prof.lab_type });
    if (prof.capacity)    baseFields.push({ label: 'Capacity', value: prof.capacity });
    if (prof.hourly_rate) baseFields.push({ label: 'Hourly Rate', value: `INR ${prof.hourly_rate}` });
  } else if (role === 'incubator') {
    if (prof.parent_org)       baseFields.push({ label: 'Parent Org', value: prof.parent_org });
    if (prof.program_duration) baseFields.push({ label: 'Duration', value: prof.program_duration });
    if (prof.cohort_size)      baseFields.push({ label: 'Cohort Size', value: prof.cohort_size });
    if (prof.funding_offered)  baseFields.push({ label: 'Funding', value: prof.funding_offered });
    if (prof.portfolio_count)  baseFields.push({ label: 'Portfolio', value: prof.portfolio_count });
  } else if (role === 'accelerator') {
    if (prof.parent_org)       baseFields.push({ label: 'Parent Org', value: prof.parent_org });
    if (prof.program_duration) baseFields.push({ label: 'Duration', value: prof.program_duration });
    if (prof.batch_size)       baseFields.push({ label: 'Batch Size', value: prof.batch_size });
    if (prof.funding_offered)  baseFields.push({ label: 'Funding', value: prof.funding_offered });
    if (prof.portfolio_count)  baseFields.push({ label: 'Portfolio', value: prof.portfolio_count });
  }

  if (baseFields.length) sections.push({ title: 'Details', type: 'fields', fields: baseFields });

  // Tag arrays
  const tagArrays = [
    { key: 'technologies', title: 'Technologies', bg: '#fefce8', color: '#ca8a04' },
    { key: 'focus_areas', title: 'Focus Areas', bg: '#eff6ff', color: '#2563eb' },
    { key: 'research_areas', title: 'Research Areas', bg: '#eff6ff', color: '#2563eb' },
    { key: 'innovation_areas', title: 'Innovation Areas', bg: '#eff6ff', color: '#2563eb' },
    { key: 'focus_sectors', title: 'Focus Sectors', bg: '#eff6ff', color: '#2563eb' },
    { key: 'skills', title: 'Skills', bg: '#fefce8', color: '#ca8a04' },
    { key: 'expertise', title: 'Expertise', bg: '#fefce8', color: '#ca8a04' },
    { key: 'capabilities', title: 'Capabilities', bg: '#fefce8', color: '#ca8a04' },
    { key: 'equipment', title: 'Equipment', bg: '#f0fdf4', color: '#16a34a' },
    { key: 'programs', title: 'Programs', bg: '#faf5ff', color: '#7c3aed' },
    { key: 'services', title: 'Services', bg: '#f0fdf4', color: '#16a34a' },
    { key: 'corporate_partners', title: 'Corporate Partners', bg: '#eff6ff', color: '#2563eb' },
    { key: 'looking_for', title: 'Looking For', bg: '#fff7ed', color: '#ea580c' },
    { key: 'offerings', title: 'What We Offer', bg: '#f0fdf4', color: '#16a34a' },
    { key: 'offering', title: 'What I Offer', bg: '#f0fdf4', color: '#16a34a' },
    { key: 'investment_stage', title: 'Investment Stages', bg: '#faf5ff', color: '#7c3aed' },
  ];

  tagArrays.forEach(({ key, title, bg, color }) => {
    const arr = prof[key];
    if (arr && Array.isArray(arr) && arr.length > 0) {
      sections.push({ title, type: 'tags', tags: arr, bg, color });
    }
  });

  return sections;
}
