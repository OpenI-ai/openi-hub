import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { watchlistAPI, startupAPI } from '../../services/api';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import {
  Star, Plus, Trash2, Download, Share2, Search, Filter,
  ChevronRight, Rocket, Users, FolderPlus, X, Check,
  Eye, FileText, Tag, Lock, Globe, Edit3, MoreHorizontal,
} from 'lucide-react';

const G = '#D5AA5B';
const GH = '#C9983F';

const card = {
  background: '#ffffff',
  border: '1px solid #eeeeee',
  borderRadius: 14,
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
};

// Mock data removed — data is fetched from API

const VIS_STYLE = {
  public:     { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0',              icon: Globe, label: 'Public' },
  internal:   { bg: '#fff8ec', color: G,          border: 'rgba(213,170,91,0.4)', icon: Users, label: 'Internal' },
  restricted: { bg: '#fef2f2', color: '#dc2626',  border: '#fecaca',              icon: Lock,  label: 'Restricted' },
};

const STATUS_STYLE = {
  Active:     { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  'On Hold':  { bg: '#fff7ed', color: '#ea580c', border: '#fed7aa' },
  Pending:    { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' },
  'In Review':{ bg: '#fff8ec', color: G,          border: 'rgba(213,170,91,0.4)' },
};

export default function StartupWatchlist() {
  const [lists, setLists]           = useState([]);
  const [allStartups, setAllStartups] = useState([]);
  const [selected, setSelected]     = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showAdd, setShowAdd]       = useState(false);
  // Phase 89.8 (T31) — search-driven Add Startup modal. Backend's
  // /startups defaults to limit=24, so loading once at mount only surfaces
  // a tiny slice of the 575k+ startup_profiles. Debounced server-side
  // search lets users find any startup by name.
  const [addSearch, setAddSearch]   = useState('');
  const [addResults, setAddResults] = useState([]);
  const [addLoading, setAddLoading] = useState(false);
  const addSeqRef                   = useRef(0);
  const [search, setSearch]         = useState('');
  const [loading, setLoading]       = useState(true);
  const [newList, setNewList]       = useState({ name: '', description: '', visibility: 'internal', tags: '' });

  useEffect(() => {
    Promise.all([watchlistAPI.list(), startupAPI.list()])
      .then(([wData, sData]) => {
        const watchlists = wData.watchlists || wData || [];
        const normalizedLists = watchlists.map(w => ({
          id: w.id,
          name: w.name || '',
          description: w.description || '',
          visibility: w.visibility || 'internal',
          createdBy: w.created_by_name || w.created_by || 'Admin',
          createdOn: w.created_at ? new Date(w.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
          tags: w.tags || [],
          startupIds: (w.startups || []).map(s => s.id || s.startup_id || s),
        }));
        setLists(normalizedLists);

        const startups = sData.startups || sData || [];
        const normalizedStartups = startups.map(s => ({
          id: s.id,
          name: s.company_name || s.name || '',
          logo_url: s.logo_url || null,
          sector: s.sector || '',
          score: s.score ? (s.score / 20) : null,
          stage: s.stage || s.pipeline_stage || 'Application',
          status: s.status || 'Pending',
          deeptech: s.is_deeptech || s.deeptech || false,
        }));
        setAllStartups(normalizedStartups);
      })
      .catch(err => { toast.error(err.message || 'Failed to load watchlists'); setLists([]); setAllStartups([]); })
      .finally(() => setLoading(false));
  }, []);

  const selectedList = lists.find(l => l.id === selected);
  const listStartups = selectedList
    ? allStartups.filter(s => selectedList.startupIds.includes(s.id))
    : [];

  // Phase 89.8 (T31) — debounced server-side search. Fires after 250ms of
  // typing-pause to avoid flooding the backend. Race-guard via addSeqRef so a
  // slow earlier response doesn't overwrite a fast later one (Phase 87b
  // pattern). Empty search yields empty results — user must type to discover.
  useEffect(() => {
    if (!showAdd) {
      // Reset modal state when it closes so re-open starts clean.
      setAddSearch('');
      setAddResults([]);
      setAddLoading(false);
      return undefined;
    }
    const q = addSearch.trim();
    if (q.length < 2) {
      setAddResults([]);
      setAddLoading(false);
      return undefined;
    }
    setAddLoading(true);
    const mySeq = ++addSeqRef.current;
    const tid = setTimeout(() => {
      startupAPI.list({ search: q, limit: 50 })
        .then(data => {
          if (mySeq !== addSeqRef.current) return; // stale response, drop it
          const rows = data.startups || data || [];
          setAddResults(rows.map(s => ({
            id: s.id,
            user_id: s.user_id,
            name: s.company_name || s.name || '',
            logo_url: s.logo_url || null,
            sector: s.sector || '',
            stage: s.stage || '',
          })));
        })
        .catch(() => {
          if (mySeq !== addSeqRef.current) return;
          setAddResults([]);
        })
        .finally(() => {
          if (mySeq !== addSeqRef.current) return;
          setAddLoading(false);
        });
    }, 250);
    return () => clearTimeout(tid);
  }, [showAdd, addSearch]);

  // Phase 89.8 (T31) — availableToAdd now derived from server-side search
  // results, filtered client-side to exclude startups already in this list.
  const availableToAdd = selectedList
    ? addResults.filter(s => !selectedList.startupIds.includes(s.id))
    : [];

  const createList = () => {
    if (!newList.name.trim()) return;
    const payload = {
      name: newList.name.trim(),
      description: newList.description.trim(),
      visibility: newList.visibility,
      tags: newList.tags.split(',').map(t => t.trim()).filter(Boolean),
    };
    watchlistAPI.create(payload)
      .then(data => {
        toast.success('Watchlist created successfully');
        const w = data.watchlist || data;
        const created = {
          id: w.id || Date.now(),
          name: w.name || payload.name,
          description: w.description || payload.description,
          visibility: w.visibility || payload.visibility,
          createdBy: 'You',
          createdOn: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          tags: w.tags || payload.tags,
          startupIds: [],
        };
        setLists(prev => [...prev, created]);
        setSelected(created.id);
      })
      .catch(err => {
        toast.error(err.message || 'Failed to create watchlist');
        // Fallback local add
        const created = { id: Date.now(), ...payload, createdBy: 'You', createdOn: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }), startupIds: [] };
        setLists(prev => [...prev, created]);
        setSelected(created.id);
      });
    setNewList({ name: '', description: '', visibility: 'internal', tags: '' });
    setShowCreate(false);
  };

  const removeStartup = (startupId) => {
    if (selectedList) {
      watchlistAPI.removeStartup(selectedList.id, startupId).catch(err => toast.error(err.message || 'Failed to remove startup'));
    }
    setLists(prev => prev.map(l => l.id === selected
      ? { ...l, startupIds: l.startupIds.filter(id => id !== startupId) }
      : l
    ));
  };

  const addStartup = (startupId) => {
    if (selectedList) {
      watchlistAPI.addStartup(selectedList.id, startupId).catch(err => toast.error(err.message || 'Failed to add startup'));
    }
    setLists(prev => prev.map(l => l.id === selected
      ? { ...l, startupIds: [...l.startupIds, startupId] }
      : l
    ));
  };

  const deleteList = (id) => {
    watchlistAPI.remove(id).catch(err => toast.error(err.message || 'Failed to delete watchlist'));
    setLists(prev => prev.filter(l => l.id !== id));
    if (selected === id) setSelected(null);
  };

  if (loading) return <LoadingSkeleton type="card" />;

  const filteredLists = lists.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ padding: 28, maxWidth: 1200, background: '#f5f5f5', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, color: '#1a1a1a', fontSize: 22, fontWeight: 700 }}>Startup Watchlists</h1>
          <p style={{ margin: '4px 0 0', color: '#888', fontSize: 13 }}>Curate and share startup selection lists by program, technology or interest</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: G, color: '#fff', border: 'none', borderRadius: 9, cursor: 'pointer', fontSize: 13, fontWeight: 700, boxShadow: '0 2px 10px rgba(213,170,91,0.3)' }}
          onMouseEnter={e => e.currentTarget.style.background = GH}
          onMouseLeave={e => e.currentTarget.style.background = G}
        >
          <Plus size={14} /> New Watchlist
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 22 }}>
        {[
          { label: 'Total Lists',       value: lists.length, icon: Star,    bg: '#fff8ec', fg: G },
          { label: 'Startups Tracked',  value: new Set(lists.flatMap(l => l.startupIds)).size, icon: Rocket, bg: '#f0fdf4', fg: '#16a34a' },
          { label: 'Shared Lists',      value: lists.filter(l => l.visibility !== 'restricted').length, icon: Share2, bg: '#f0f9ff', fg: '#0284c7' },
          { label: 'Restricted',        value: lists.filter(l => l.visibility === 'restricted').length, icon: Lock,   bg: '#fef2f2', fg: '#dc2626' },
        ].map(({ label, value, icon: Icon, bg, fg }) => (
          <div key={label} style={{ ...card, padding: 16 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
              <Icon size={15} color={fg} />
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a' }}>{value}</div>
            <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16 }}>
        {/* Lists sidebar */}
        <div style={{ ...card, overflow: 'hidden', alignSelf: 'start' }}>
          <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid #f5f5f5' }}>
            <div style={{ position: 'relative' }}>
              <Search size={12} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
              <input placeholder="Search lists…" value={search} onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', paddingLeft: 26, paddingRight: 10, paddingTop: 7, paddingBottom: 7, background: '#f8f8f8', border: '1.5px solid #eee', borderRadius: 8, fontSize: 12, outline: 'none', color: '#1a1a1a' }}
              />
            </div>
          </div>
          {filteredLists.map(l => {
            const vs = VIS_STYLE[l.visibility];
            const VIcon = vs.icon;
            const isActive = selected === l.id;
            return (
              <div key={l.id}
                onClick={() => setSelected(l.id)}
                style={{
                  padding: '12px 16px', borderBottom: '1px solid #f5f5f5', cursor: 'pointer',
                  background: isActive ? 'rgba(213,170,91,0.07)' : 'transparent',
                  borderLeft: isActive ? `3px solid ${G}` : '3px solid transparent',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#fafafa'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: isActive ? 700 : 600, color: '#1a1a1a', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 20, background: vs.bg, color: vs.color, border: `1px solid ${vs.border}`, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                        <VIcon size={8} />{vs.label}
                      </span>
                      <span style={{ fontSize: 10, color: '#888' }}>{l.startupIds.length} startups</span>
                    </div>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); deleteList(l.id); }}
                    style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#ddd', borderRadius: 5, flexShrink: 0 }}
                    onMouseEnter={e => e.currentTarget.style.color = '#dc2626'}
                    onMouseLeave={e => e.currentTarget.style.color = '#ddd'}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                  {l.tags.slice(0, 3).map(t => (
                    <span key={t} style={{ fontSize: 9, padding: '1px 6px', borderRadius: 20, background: '#f5f5f5', color: '#888', border: '1px solid #eee' }}>{t}</span>
                  ))}
                </div>
              </div>
            );
          })}
          {filteredLists.length === 0 && (
            <div style={{ padding: 28, textAlign: 'center', color: '#aaa', fontSize: 12 }}>No watchlists found</div>
          )}
        </div>

        {/* Detail panel */}
        {selectedList ? (
          <div>
            {/* List header */}
            <div style={{ ...card, padding: 22, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <h2 style={{ margin: '0 0 4px', color: '#1a1a1a', fontSize: 17, fontWeight: 700 }}>{selectedList.name}</h2>
                  <p style={{ margin: '0 0 10px', color: '#666', fontSize: 13 }}>{selectedList.description}</p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {selectedList.tags.map(t => (
                      <span key={t} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#fff8ec', color: G, border: '1px solid rgba(213,170,91,0.3)' }}>{t}</span>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setShowAdd(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 13px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                  >
                    <Plus size={12} /> Add Startup
                  </button>
                  {/* Ship #4 (22 May 2026) — wire Export PDF + Share */}
                  <button
                    onClick={async () => {
                      try {
                        const url = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/watchlists/${selectedList.id}/pdf`;
                        const token = localStorage.getItem('openi_token') || '';
                        const resp = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
                        if (!resp.ok) throw new Error('Failed to export PDF');
                        const blob = await resp.blob();
                        const dlUrl = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = dlUrl;
                        a.download = `Watchlist-${(selectedList.name || 'list').replace(/[^a-zA-Z0-9]/g, '-').slice(0, 50)}.pdf`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(dlUrl);
                        toast.success('PDF downloaded');
                      } catch (err) {
                        toast.error(err.message || 'Failed to export PDF');
                      }
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 13px', background: '#f0f9ff', color: '#0284c7', border: '1px solid #bae6fd', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                  >
                    <Download size={12} /> Export PDF
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const shareUrl = `${window.location.origin}/dashboard/startup-watchlist?list=${selectedList.id}`;
                        if (navigator.clipboard && navigator.clipboard.writeText) {
                          await navigator.clipboard.writeText(shareUrl);
                          toast.success('Link copied to clipboard (visible to other OpenI users)');
                        } else {
                          toast.error('Clipboard API not available');
                        }
                      } catch (err) {
                        toast.error('Failed to copy link');
                      }
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 13px', background: '#fff8ec', color: G, border: '1px solid rgba(213,170,91,0.3)', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                  >
                    <Share2 size={12} /> Share
                  </button>
                </div>
              </div>
              <div style={{ marginTop: 12, fontSize: 12, color: '#aaa' }}>
                Created by {selectedList.createdBy} · {selectedList.createdOn} · {listStartups.length} startups
              </div>
            </div>

            {/* Startup cards */}
            {listStartups.length === 0 ? (
              <div style={{ ...card, padding: 48, textAlign: 'center' }}>
                <Star size={32} color="#eee" style={{ marginBottom: 12 }} />
                <p style={{ color: '#aaa', fontSize: 13, margin: 0 }}>No startups in this list yet.</p>
                <button onClick={() => setShowAdd(true)} style={{ marginTop: 14, padding: '8px 18px', background: G, color: '#fff', border: 'none', borderRadius: 9, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                  Add Startup
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                {listStartups.map(s => {
                  const ss = STATUS_STYLE[s.status] || STATUS_STYLE['Pending'];
                  return (
                    <div key={s.id} style={{ ...card, padding: 18, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                      {s.logo_url ? (
                        <img
                          src={s.logo_url}
                          alt=""
                          style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'contain', background: '#fafafa', border: '1px solid #eee', flexShrink: 0 }}
                          onError={(e) => {
                            const fallback = document.createElement('div');
                            fallback.textContent = (s.name || '?').charAt(0).toUpperCase();
                            fallback.style.cssText = `width:40px;height:40px;border-radius:10px;background:rgba(213,170,91,0.12);color:${G};font-weight:700;font-size:16px;display:flex;align-items:center;justify-content:center;border:1.5px solid rgba(213,170,91,0.25);flex-shrink:0;`;
                            e.target.replaceWith(fallback);
                          }}
                        />
                      ) : (
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(213,170,91,0.12)', color: G, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, border: '1.5px solid rgba(213,170,91,0.25)', flexShrink: 0 }}>{(s.name || '?').charAt(0).toUpperCase()}</div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                          <span style={{ color: '#1a1a1a', fontSize: 14, fontWeight: 600 }}>{s.name}</span>
                          {s.deeptech && <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 20, background: '#fdf4ff', color: '#9333ea', border: '1px solid #e9d5ff' }}>DeepTech</span>}
                        </div>
                        <div style={{ color: '#888', fontSize: 12 }}>{s.sector} · Stage: {s.stage}</div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: ss.bg, color: ss.color, border: `1px solid ${ss.border}` }}>{s.status}</span>
                      {s.score && <span style={{ fontSize: 13, color: G, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}><Star size={11} style={{ fill: G, color: G }} />{s.score}</span>}
                      <button
                        onClick={() => removeStartup(s.id)}
                        style={{ padding: 6, background: 'transparent', border: 'none', cursor: 'pointer', color: '#ddd', borderRadius: 7, marginLeft: 4 }}
                        onMouseEnter={e => e.currentTarget.style.color = '#dc2626'}
                        onMouseLeave={e => e.currentTarget.style.color = '#ddd'}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div style={{ ...card, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 12 }}>
            <Star size={36} color="#eee" />
            <p style={{ color: '#aaa', fontSize: 13, margin: 0 }}>Select a watchlist to view startups</p>
            <button onClick={() => setShowCreate(true)} style={{ padding: '8px 18px', background: G, color: '#fff', border: 'none', borderRadius: 9, cursor: 'pointer', fontSize: 13, fontWeight: 700, marginTop: 4 }}>
              Create New Watchlist
            </button>
          </div>
        )}
      </div>

      {/* Create list modal */}
      {showCreate && (
        <Modal title="Create New Watchlist" onClose={() => setShowCreate(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="List Name">
              <input value={newList.name} onChange={e => setNewList(p => ({ ...p, name: e.target.value }))} placeholder="e.g. AI Priority Watch Q3 2025" />
            </Field>
            <Field label="Description">
              <input value={newList.description} onChange={e => setNewList(p => ({ ...p, description: e.target.value }))} placeholder="Brief description of this list's purpose" />
            </Field>
            <Field label="Visibility">
              <select value={newList.visibility} onChange={e => setNewList(p => ({ ...p, visibility: e.target.value }))}>
                <option value="public">Public</option>
                <option value="internal">Internal (OpenI only)</option>
                <option value="restricted">Restricted</option>
              </select>
            </Field>
            <Field label="Tags (comma separated)">
              <input value={newList.tags} onChange={e => setNewList(p => ({ ...p, tags: e.target.value }))} placeholder="e.g. AI, priority, Q3-2025" />
            </Field>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
              <button onClick={() => setShowCreate(false)} style={{ padding: '8px 16px', background: '#f5f5f5', color: '#555', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Cancel</button>
              <button onClick={createList} style={{ padding: '8px 18px', background: G, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>Create</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add startup modal */}
      {showAdd && selectedList && (
        <Modal title={`Add Startup to "${selectedList.name}"`} onClose={() => setShowAdd(false)}>
          {/* Phase 89.8 (T31) — search-driven discovery. Users type to find any
              startup across the 575k+ catalogue rather than picking from a
              static slice of 24. */}
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
            <input
              autoFocus
              type="text"
              value={addSearch}
              onChange={e => setAddSearch(e.target.value)}
              placeholder="Search startups by name…"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '10px 14px 10px 36px',
                background: '#fff',
                border: '1.5px solid #e0e0e0',
                borderRadius: 10,
                fontSize: 14,
                outline: 'none',
                color: '#1a1a1a',
              }}
            />
          </div>
          {addSearch.trim().length < 2 ? (
            <p style={{ color: '#888', fontSize: 13, textAlign: 'center', margin: '20px 0' }}>
              Type at least 2 characters to search.
            </p>
          ) : addLoading ? (
            <p style={{ color: '#888', fontSize: 13, textAlign: 'center', margin: '20px 0' }}>
              Searching…
            </p>
          ) : availableToAdd.length === 0 ? (
            <p style={{ color: '#888', fontSize: 13, textAlign: 'center', margin: '20px 0' }}>
              No matching startups found (or all matches are already in this list).
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 400, overflowY: 'auto' }}>
              {availableToAdd.map(s => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#fafafa', borderRadius: 9, border: '1px solid #eee' }}>
                  {s.logo_url ? (
                    <img
                      src={s.logo_url}
                      alt=""
                      style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'contain', background: '#fff', border: '1px solid #eee', flexShrink: 0 }}
                      onError={(e) => {
                        const fallback = document.createElement('div');
                        fallback.textContent = (s.name || '?').charAt(0).toUpperCase();
                        fallback.style.cssText = `width:32px;height:32px;border-radius:8px;background:rgba(213,170,91,0.12);color:${G};font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center;flex-shrink:0;`;
                        e.target.replaceWith(fallback);
                      }}
                    />
                  ) : (
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(213,170,91,0.12)', color: G, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{(s.name || '?').charAt(0).toUpperCase()}</div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: '#888' }}>{s.sector} · {s.stage}</div>
                  </div>
                  <button onClick={() => { addStartup(s.id); setShowAdd(false); }} style={{ padding: '5px 12px', background: G, color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Plus size={11} /> Add
                  </button>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', maxHeight: '80vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>{title}</h2>
          <button onClick={onClose} style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', borderRadius: 7 }}><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  const child = children;
  return (
    <div>
      <label style={{ display: 'block', color: '#444', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>{label}</label>
      {child.type === 'input' || child.type === 'select' || child.type === 'textarea'
        ? <child.type {...child.props} style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', background: '#fafafa', border: '1.5px solid #e0e0e0', borderRadius: 9, fontSize: 13, outline: 'none', color: '#1a1a1a', fontFamily: 'inherit', ...(child.props.style || {}) }} />
        : child
      }
    </div>
  );
}
