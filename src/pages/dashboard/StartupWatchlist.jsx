import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom'; // M3 (27 May 2026) — for Message button deep-link
import { watchlistAPI, startupAPI, meetingAPI, messageAPI } from '../../services/api';
import safeStorage from '../../utils/safeStorage';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import UpgradeCTA from '../../components/UpgradeCTA';
import { isUpgradeError } from '../../utils/upgradeError';
import {
  Star, Plus, Trash2, Download, Share2, Search, Rocket, X, Lock,
  MessageCircle, ChevronLeft, Loader2,
} from 'lucide-react';
import { G, GH, card, VIS_STYLE, STATUS_STYLE } from './watchlistParts/styles';
import CreateListModal from './watchlistParts/CreateListModal';
import AddStartupModal from './watchlistParts/AddStartupModal';
import SharesModal from './watchlistParts/SharesModal';

export default function StartupWatchlist() {
  const [lists, setLists]           = useState([]);
  const [allStartups, setAllStartups] = useState([]);
  const [selected, setSelected]     = useState(null);
  const [hydratingId, setHydratingId] = useState(null); // list whose members are being lazy-loaded via getOne
  const [showCreate, setShowCreate] = useState(false);
  const [showAdd, setShowAdd]       = useState(false);
  // Phase 89.8 (T31) — search-driven Add Startup modal. Backend's
  // /startups defaults to limit=24, so loading once at mount only surfaces
  // a tiny slice of the 575k+ startup_profiles. Debounced server-side
  // search lets users find any startup by name.
  const [addSearch, setAddSearch]   = useState('');
  const [addResults, setAddResults] = useState([]);
  const [addLoading, setAddLoading] = useState(false);
  // Phase 104d (22 May 2026 late evening) — multi-select state for Add Startup modal
  const [addSelected, setAddSelected] = useState(new Set());
  const addSeqRef                   = useRef(0);
  // Ship #4 follow-up (22 May 2026 late evening) — tokenized public sharing
  const [showSharesModal, setShowSharesModal] = useState(false);
  const [sharesList, setSharesList] = useState([]);
  const [sharesLoading, setSharesLoading] = useState(false);
  const [minting, setMinting] = useState(false);
  // Phase 109: collaborator-tab state
  const [sharesTab, setSharesTab] = useState('link'); // 'link' or 'collab'
  const [collabList, setCollabList] = useState([]);
  const [collabLoading, setCollabLoading] = useState(false);
  const [collabSearch, setCollabSearch] = useState('');
  const [collabResults, setCollabResults] = useState([]);
  const [collabSelected, setCollabSelected] = useState([]); // [{id, name, email}]
  const [collabEmails, setCollabEmails] = useState([]);
  const [collabEmailDraft, setCollabEmailDraft] = useState('');
  const [collabRole, setCollabRole] = useState('viewer');
  const [collabMessage, setCollabMessage] = useState('');
  const [collabBusy, setCollabBusy] = useState(false);
  const collabSeqRef = useRef(0);
  const [search, setSearch]         = useState('');
  const [loading, setLoading]       = useState(true);
  const [newList, setNewList]       = useState({ name: '', description: '', visibility: 'internal', tags: '' });
  const [upgradeError, setUpgradeError] = useState(null);

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
          // Backend list() returns authoritative startup_count but NOT a startups
          // array. Carry it so the count is correct on cold load (bug: count → 0
          // after refresh). startupIds is hydrated lazily on selection via getOne.
          startupCount: w.startup_count ?? (w.startups ? w.startups.length : 0),
          startupIds: (w.startups || []).map(s => s.id || s.startup_id || s),
          hydrated: Array.isArray(w.startups),
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
          // M3 (27 May 2026) — bridge for Message button; populated when getOne
          // returns owner_user_id (claimed startup, active OpenI user)
          owner_user_id: s.owner_user_id || null,
          owner_is_active: s.owner_is_active !== undefined ? s.owner_is_active : null,
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
      setAddSelected(new Set()); // Phase 104d — clear multi-select on close
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
          startupCount: 0,
          hydrated: true,
        };
        setLists(prev => [...prev, created]);
        setSelected(created.id);
      })
      .catch(err => {
        toast.error(err.message || 'Failed to create watchlist');
        // Fallback local add
        const created = { id: Date.now(), ...payload, createdBy: 'You', createdOn: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }), startupIds: [], startupCount: 0, hydrated: true };
        setLists(prev => [...prev, created]);
        setSelected(created.id);
      });
    setNewList({ name: '', description: '', visibility: 'internal', tags: '' });
    setShowCreate(false);
  };

  // M3 (27 May 2026) — navigate helper for Message button deep-link
  const navigate = useNavigate();

  const handleMessage = async (recipientUserId, startupName) => {
    if (!recipientUserId) {
      toast.error('This startup has not yet claimed their OpenI profile');
      return;
    }
    setUpgradeError(null);
    try {
      const conv = await messageAPI.createConversation({ type: 'direct', member_ids: [recipientUserId] });
      navigate('/dashboard/messaging?conversation=' + conv.id);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || `Failed to open conversation with ${startupName || 'startup'}`);
      if (isUpgradeError(err)) setUpgradeError(err);
      else setUpgradeError(null);
    }
  };

  const removeStartup = (startupId) => {
    if (selectedList) {
      watchlistAPI.removeStartup(selectedList.id, startupId).catch(err => toast.error(err.message || 'Failed to remove startup'));
    }
    setLists(prev => prev.map(l => l.id === selected
      ? { ...l, startupIds: l.startupIds.filter(id => id !== startupId), startupCount: Math.max(0, (l.startupCount ?? l.startupIds.length) - 1) }
      : l
    ));
  };

  // Select a list and lazily hydrate its members. list() returns only a count,
  // so on cold load startupIds is empty and the detail cards/count would be
  // wrong after refresh. getOne() returns the full startup rows; we merge them
  // into allStartups (independent of the small startupAPI.list slice) and set
  // the real startupIds. Idempotent: skips the fetch once a list is hydrated.
  const selectList = (id) => {
    setSelected(id);
    const target = lists.find(l => l.id === id);
    if (!target || target.hydrated) return;
    setHydratingId(id);
    watchlistAPI.get(id)
      .then(data => {
        const rows = data.startups || [];
        const ids = rows.map(s => s.id);
        const normalized = rows.map(s => ({
          id: s.id,
          name: s.company_name || s.name || '',
          logo_url: s.logo_url || null,
          sector: s.sector || '',
          score: s.score ? (s.score / 20) : null,
          stage: s.stage || s.pipeline_stage || 'Application',
          status: s.status || 'Pending',
          deeptech: s.is_deeptech || s.deeptech || false,
          owner_user_id: s.owner_user_id || null,
          owner_is_active: s.owner_is_active !== undefined ? s.owner_is_active : null,
        }));
        setAllStartups(prev => {
          const byId = new Map(prev.map(s => [s.id, s]));
          normalized.forEach(s => byId.set(s.id, s));
          return Array.from(byId.values());
        });
        setLists(prev => prev.map(l => l.id === id
          ? { ...l, startupIds: ids, startupCount: ids.length, hydrated: true }
          : l
        ));
      })
      .catch(err => toast.error(err.message || 'Failed to load watchlist startups'))
      .finally(() => setHydratingId(prev => (prev === id ? null : prev)));
  };

  // Phase 104d (22 May 2026 late evening) — supports BOTH single-id and array-of-ids.
  // Cohort report: row Add button closed the modal on first click, single-select only,
  // exception on click. Now: checkbox UI builds an array in addSelected, footer button
  // calls addStartup(addSelected) with the array. Single-id path preserved for any
  // other surface that calls addStartup with a scalar.
  const addStartup = (startupIdOrIds) => {
    const ids = Array.isArray(startupIdOrIds) ? startupIdOrIds : [startupIdOrIds];
    if (!ids.length) return;
    if (!selectedList) return;
    // Fire all in parallel and track per-id outcome. We only report success for
    // the ids that actually persisted, and only optimistically add those — so a
    // backend rejection (e.g. FK violation) never shows a false "added" toast.
    const tasks = ids.map(id =>
      watchlistAPI.addStartup(selectedList.id, id)
        .then(() => ({ id, ok: true }))
        .catch(err => {
          console.error('[watchlist.addStartup] failed for id=' + id, err);
          return { id, ok: false, error: err?.response?.data?.message || err.message };
        })
    );
    Promise.all(tasks).then(results => {
      const okIds = results.filter(r => r.ok).map(r => r.id);
      const failed = results.filter(r => !r.ok);

      if (okIds.length) {
        const newIds = okIds.filter(id => !(selectedList.startupIds || []).includes(id));
        setLists(prev => prev.map(l => l.id === selected
          ? { ...l, startupIds: [...(l.startupIds || []), ...newIds], startupCount: (l.startupCount ?? l.startupIds.length) + newIds.length }
          : l
        ));
        if (okIds.length > 1) toast.success(`${okIds.length} startups added to "${selectedList.name}"`);
        else toast.success('Startup added');
      }

      if (failed.length) {
        if (failed.length === 1) {
          toast.error(failed[0].error || 'Failed to add startup');
        } else {
          toast.error(`${failed.length} of ${ids.length} could not be added${okIds.length ? '' : ' — none were saved'}`);
        }
      }
    });
  };

  // Ship #4 follow-up — tokenized share handlers
  const openSharesModal = async () => {
    if (!selectedList) return;
    setShowSharesModal(true);
    setSharesLoading(true);
    try {
      const r = await watchlistAPI.listShares(selectedList.id);
      setSharesList(Array.isArray(r) ? r : []);
    } catch (err) {
      console.error('[watchlist.listShares] failed:', err);
      toast.error(err?.response?.data?.message || err.message || 'Failed to load share links');
      setSharesList([]);
    } finally {
      setSharesLoading(false);
    }
  };

  const mintNewShare = async () => {
    if (!selectedList) return;
    setMinting(true);
    try {
      const r = await watchlistAPI.createShare(selectedList.id, { expires_in_days: 30 });
      setSharesList(prev => [r, ...prev]);
      const shareUrl = `${window.location.origin}/watchlists/share/${r.token}`;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('New share link copied to clipboard');
      } else {
        toast.success('Share link created');
      }
    } catch (err) {
      console.error('[watchlist.createShare] failed:', err);
      toast.error(err?.response?.data?.message || err.message || 'Failed to create share link');
    } finally {
      setMinting(false);
    }
  };

  const revokeOneShare = async (shareId) => {
    try {
      await watchlistAPI.revokeShare(shareId);
      setSharesList(prev => prev.map(s => s.id === shareId ? { ...s, revoked_at: new Date().toISOString() } : s));
      toast.success('Share link revoked');
    } catch (err) {
      console.error('[watchlist.revokeShare] failed:', err);
      toast.error(err?.response?.data?.message || err.message || 'Failed to revoke');
    }
  };

  // Phase 109: collaborator handlers
  const loadCollaborators = async () => {
    if (!selectedList) return;
    setCollabLoading(true);
    try {
      const r = await watchlistAPI.listCollaborators(selectedList.id);
      setCollabList(Array.isArray(r) ? r : []);
    } catch (err) {
      console.error('[loadCollaborators]', err);
      setCollabList([]);
    } finally {
      setCollabLoading(false);
    }
  };

  // Debounced user typeahead via meetingAPI.searchUsers (Phase 99c pattern with race-guard)
  useEffect(() => {
    if (!showSharesModal || sharesTab !== 'collab') return;
    const q = collabSearch.trim();
    if (q.length < 2) { setCollabResults([]); return; }
    const mySeq = ++collabSeqRef.current;
    const timer = setTimeout(async () => {
      try {
        const r = await meetingAPI.searchUsers(q);
        if (mySeq !== collabSeqRef.current) return; // a newer fetch already in flight
        const list = Array.isArray(r) ? r : (r?.users || []);
        // Hide already-selected + already-collaborators
        const excludeIds = new Set([
          ...collabSelected.map(u => u.id),
          ...collabList.map(c => c.user_id),
        ]);
        setCollabResults(list.filter(u => !excludeIds.has(u.id)).slice(0, 8));
      } catch (err) {
        if (mySeq !== collabSeqRef.current) return;
        setCollabResults([]);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [collabSearch, showSharesModal, sharesTab, collabSelected, collabList]);

  const addCollabEmail = () => {
    const em = collabEmailDraft.trim().toLowerCase();
    if (!em || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      toast.error('Enter a valid email');
      return;
    }
    if (collabEmails.includes(em)) return;
    setCollabEmails(prev => [...prev, em]);
    setCollabEmailDraft('');
  };

  const sendCollaboratorInvites = async () => {
    if (collabSelected.length === 0 && collabEmails.length === 0) return;
    setCollabBusy(true);
    try {
      const r = await watchlistAPI.inviteCollaborators(selectedList.id, {
        user_ids: collabSelected.map(u => u.id),
        emails: collabEmails,
        role: collabRole,
        message: collabMessage.trim() || undefined,
      });
      const addedCount = (r.added || []).length;
      const pendingCount = (r.pending_email_invites || []).length;
      const parts = [];
      if (addedCount > 0) parts.push(`${addedCount} collaborator${addedCount === 1 ? '' : 's'} added`);
      if (pendingCount > 0) parts.push(`${pendingCount} email invite${pendingCount === 1 ? '' : 's'} sent to non-OpenI users`);
      toast.success(parts.join(' · ') || 'Done');
      // Reset draft state
      setCollabSelected([]); setCollabEmails([]); setCollabEmailDraft('');
      setCollabSearch(''); setCollabResults([]); setCollabMessage('');
      // Refresh list
      await loadCollaborators();
    } catch (err) {
      console.error('[sendCollaboratorInvites]', err);
      toast.error(err?.message || 'Failed to send invites');
    } finally {
      setCollabBusy(false);
    }
  };

  const removeOneCollaborator = async (collabId) => {
    if (!confirm('Remove this collaborator? They will lose access to this watchlist.')) return;
    try {
      await watchlistAPI.removeCollaborator(selectedList.id, collabId);
      setCollabList(prev => prev.filter(c => c.id !== collabId));
      toast.success('Collaborator removed');
    } catch (err) {
      toast.error(err?.message || 'Failed to remove');
    }
  };

  const changeCollaboratorRole = async (collabId, newRole) => {
    try {
      const r = await watchlistAPI.updateCollaboratorRole(selectedList.id, collabId, { role: newRole });
      setCollabList(prev => prev.map(c => c.id === collabId ? { ...c, role: r.role } : c));
    } catch (err) {
      toast.error(err?.message || 'Failed to change role');
    }
  };

  const copyShareUrl = async (token) => {
    const shareUrl = `${window.location.origin}/watchlists/share/${token}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Could not copy');
    }
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
          <span id="tour-page-watchlist-header" style={{ position: 'absolute' }} />
          <h1 style={{ margin: 0, color: '#1a1a1a', fontSize: 22, fontWeight: 700 }}>Startup Watchlists</h1>
          <p style={{ margin: '4px 0 0', color: '#888', fontSize: 13 }}>Curate and share startup selection lists by program, technology or interest</p>
        </div>
        <button
          id="tour-page-watchlist-create"
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
          { label: 'Startups Tracked',  value: lists.reduce((sum, l) => sum + (l.startupCount ?? l.startupIds.length), 0), icon: Rocket, bg: '#f0fdf4', fg: '#16a34a' },
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

      {/* Mobile Ship 3 (27 May 2026): single-pane on mobile, side-by-side on md+ */}
      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr]" style={{ gap: 16 }}>
        {/* Lists sidebar — Mobile Ship 3: hidden on mobile when a list is selected */}
        <div className={selected ? 'hidden md:block' : 'block'} style={{ ...card, overflow: 'hidden', alignSelf: 'start' }}>
          <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid #f5f5f5' }}>
            <div style={{ position: 'relative' }}>
              <Search size={12} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
              <input placeholder="Search lists…" value={search} onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', paddingLeft: 26, paddingRight: 10, paddingTop: 7, paddingBottom: 7, background: '#f8f8f8', border: '1.5px solid #eee', borderRadius: 8, fontSize: 16, outline: 'none', color: '#1a1a1a' }}
              />
            </div>
          </div>
          {filteredLists.map(l => {
            const vs = VIS_STYLE[l.visibility];
            const VIcon = vs.icon;
            const isActive = selected === l.id;
            return (
              <div key={l.id}
                onClick={() => selectList(l.id)}
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
                      <span style={{ fontSize: 10, color: '#888' }}>{l.startupCount ?? l.startupIds.length} startups</span>
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

        {/* Detail panel — Mobile Ship 3: always visible when active on mobile */}
        {selectedList ? (
          <div>
            {/* Mobile Ship 3: back-arrow to return to lists on mobile */}
            <button
              onClick={() => setSelected(null)}
              className="md:hidden"
              aria-label="Back to lists"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 10px', marginBottom: 10,
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: '#666', fontSize: 13, fontWeight: 600, borderRadius: 6,
              }}
            >
              <ChevronLeft size={16} /> Back to lists
            </button>
            {upgradeError && (
              <div style={{ marginBottom: 12 }}>
                <UpgradeCTA compact feature={upgradeError.feature} plan={upgradeError.plan} message={upgradeError.message} />
              </div>
            )}
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
                    id="tour-page-watchlist-add"
                    onClick={() => setShowAdd(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 13px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                  >
                    <Plus size={12} /> Add Startup
                  </button>
                  {/* Ship #4 (22 May 2026) — wire Export PDF + Share */}
                  <span id="tour-page-watchlist-share" style={{ position: 'absolute' }} />
                  <button
                    onClick={async () => {
                      try {
                        const url = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/watchlists/${selectedList.id}/pdf`;
                        const token = safeStorage.getItem('openi_token') || '';
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
                  {/* Ship #4 follow-up — Share button now opens a Manage Shares modal */}
                  <button
                    onClick={openSharesModal}
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
            {hydratingId === selectedList.id && listStartups.length === 0 ? (
              <div style={{ ...card, padding: 48, textAlign: 'center' }}>
                <Loader2 size={28} color={G} className="animate-spin" style={{ marginBottom: 12 }} />
                <p style={{ color: '#aaa', fontSize: 13, margin: 0 }}>Loading startups…</p>
              </div>
            ) : listStartups.length === 0 ? (
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
                    <div
                      key={s.id}
                      onClick={() => navigate(`/dashboard/startups/${s.owner_user_id}?by=user_id`)}
                      style={{ ...card, padding: 18, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', cursor: 'pointer' }}
                    >
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
                      {/* M3 (27 May 2026) — Message button, only when startup is claimed + owner active */}
                      {s.owner_user_id && s.owner_is_active && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleMessage(s.owner_user_id, s.name); }}
                          title={`Message ${s.name || 'startup'}`}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '4px 10px', fontSize: 11, fontWeight: 600,
                            background: '#fff', color: G, border: `1px solid ${G}`,
                            borderRadius: 14, cursor: 'pointer',
                          }}
                        >
                          <MessageCircle size={12} /> Message
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); removeStartup(s.id); }}
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
        <CreateListModal
          createList={createList}
          newList={newList}
          setNewList={setNewList}
          setShowCreate={setShowCreate}
        />
      )}

      {/* Add startup modal */}
      {showAdd && selectedList && (
        <AddStartupModal
          addLoading={addLoading}
          addSearch={addSearch}
          addSelected={addSelected}
          addStartup={addStartup}
          availableToAdd={availableToAdd}
          selectedList={selectedList}
          setAddSearch={setAddSearch}
          setAddSelected={setAddSelected}
          setShowAdd={setShowAdd}
        />
      )}

      {/* Phase 109: tabbed Manage Shares modal — Public link OR Collaborators */}
      {showSharesModal && selectedList && (
        <SharesModal
          addCollabEmail={addCollabEmail}
          changeCollaboratorRole={changeCollaboratorRole}
          collabBusy={collabBusy}
          collabEmailDraft={collabEmailDraft}
          collabEmails={collabEmails}
          collabList={collabList}
          collabLoading={collabLoading}
          collabMessage={collabMessage}
          collabResults={collabResults}
          collabRole={collabRole}
          collabSearch={collabSearch}
          collabSelected={collabSelected}
          copyShareUrl={copyShareUrl}
          mintNewShare={mintNewShare}
          minting={minting}
          removeOneCollaborator={removeOneCollaborator}
          revokeOneShare={revokeOneShare}
          selectedList={selectedList}
          sendCollaboratorInvites={sendCollaboratorInvites}
          setCollabEmailDraft={setCollabEmailDraft}
          setCollabEmails={setCollabEmails}
          setCollabMessage={setCollabMessage}
          setCollabResults={setCollabResults}
          setCollabRole={setCollabRole}
          setCollabSearch={setCollabSearch}
          setCollabSelected={setCollabSelected}
          setSharesTab={setSharesTab}
          setShowSharesModal={setShowSharesModal}
          sharesList={sharesList}
          sharesLoading={sharesLoading}
          sharesTab={sharesTab}
        />
      )}
    </div>
  );
}
