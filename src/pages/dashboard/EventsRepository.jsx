import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Calendar, MapPin, Users, Plus, Search, Filter,
  ChevronRight, Clock, Tag, ExternalLink, Download,
  Mic, Trophy, BookOpen, Zap, Globe, Video,
  CheckCircle2, AlertCircle, ArrowRight, X, Trash2,
} from 'lucide-react';
import { eventAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSkeleton from '../../components/LoadingSkeleton';

const G = '#D5AA5B';
const GH = '#C9983F';

// Phase 66 — roles allowed to create events. Mirrors backend
// eventController.CREATE_ROLES exactly.
const CREATE_ROLES = ['admin','corporate','government','investor','incubator','accelerator','lab'];

const card = {
  background: '#ffffff',
  border: '1px solid #eeeeee',
  borderRadius: 14,
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
};

// Phase 66 (Bug C fix) — single canonical key set. Filters used to render twice
// because the previous map had both lowercase and capitalized keys.
const EVENT_TYPES = {
  hackathon:   { label: 'Hackathon',    color: '#7c3aed', bg: '#f5f3ff', icon: Zap },
  workshop:    { label: 'Workshop',     color: '#0284c7', bg: '#f0f9ff', icon: BookOpen },
  conference:  { label: 'Conference',   color: '#16a34a', bg: '#f0fdf4', icon: Mic },
  demo_day:    { label: 'Demo Day',     color: G,          bg: '#fff8ec', icon: Trophy },
  webinar:     { label: 'Webinar',      color: '#ea580c', bg: '#fff7ed', icon: Video },
  networking:  { label: 'Networking',   color: '#dc2626', bg: '#fef2f2', icon: Users },
};

const STATUS_STYLE = {
  Upcoming:   { bg: '#f0f9ff', color: '#0284c7', border: '#bae6fd' },
  upcoming:   { bg: '#f0f9ff', color: '#0284c7', border: '#bae6fd' },
  Live:       { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  ongoing:    { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  Completed:  { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' },
  completed:  { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' },
  Cancelled:  { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  cancelled:  { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const normalizeEventStatus = (s) => {
  if (!s) return 'Upcoming';
  const map = { upcoming: 'Upcoming', ongoing: 'Live', completed: 'Completed', cancelled: 'Cancelled' };
  return map[s.toLowerCase()] || s.charAt(0).toUpperCase() + s.slice(1);
};
const normalizeEventType = (t) => {
  if (!t) return 'workshop';
  return t.toLowerCase().replace(/\s+/g, '_');
};

const EMPTY_FORM = {
  title: '',
  description: '',
  type: 'workshop',
  start_date: '',
  end_date: '',
  location: '',
  is_virtual: false,
  capacity: '',
  tags: '',
};

const normalizeEvent = (e) => ({
  ...e,
  type: normalizeEventType(e.type),
  status: normalizeEventStatus(e.status),
  date: fmtDate(e.start_date),
  endDate: fmtDate(e.end_date),
  location: e.location || '—',
  mode: e.is_virtual ? 'Online' : 'In-Person',
  organiser: e.organization_name || e.organiser || 'OpenI Hub',
  registrations: Number(e.registered) || 0,
  capacity: Number(e.capacity) || 100,
  description: e.description || '',
  tags: e.tags || [],
  agenda: e.agenda || [],
  speakers: e.speakers || [],
  visibility: e.visibility || 'public',
  created_by: e.created_by,
  organization_name: e.organization_name || null,
});

export default function EventsRepository() {
  const { user, roles } = useAuth();
  const canCreate = (roles || []).some(r => CREATE_ROLES.includes(r));
  const userId = user?.id;

  const [events, setEvents]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [view, setView]         = useState('grid');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch]     = useState('');
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  // Ship #10 follow-up (22 May 2026 late evening) — registered set is now
  // backend-backed via event_registrations table. Pre-follow-up was in-session
  // only (refresh re-enabled the Register button).
  const [registeredSet, setRegisteredSet] = useState(new Set());

  useEffect(() => {
    // Parallel fetch: events list + the current user's registration ids.
    // myRegistrations is auth-only and never fails for a logged-in user;
    // catch silently so a transient failure still lets the page load.
    Promise.all([
      eventAPI.list().catch(err => { toast.error(err?.response?.data?.message || err.message || 'Failed to load events'); return { events: [] }; }),
      eventAPI.myRegistrations().catch(err => { console.error('[event.myRegistrations] failed:', err); return { event_ids: [] }; }),
    ])
      .then(([eventsData, regsData]) => {
        const raw = eventsData.events || eventsData || [];
        setEvents(raw.map(normalizeEvent));
        setRegisteredSet(new Set(regsData.event_ids || []));
      })
      .finally(() => setLoading(false));
  }, []);

  const handleRegister = (evId) => {
    if (registeredSet.has(evId)) return; // already registered (backend will no-op anyway via ON CONFLICT)
    eventAPI.register(evId)
      .then(() => {
        toast.success('Registered for event successfully');
        setEvents(prev => prev.map(e => e.id === evId ? { ...e, registrations: e.registrations + 1 } : e));
        if (selected && selected.id === evId) {
          setSelected(prev => ({ ...prev, registrations: prev.registrations + 1 }));
        }
        setRegisteredSet(prev => { const s = new Set(prev); s.add(evId); return s; });
      })
      .catch(err => {
        console.error('[event.register] failed:', err);
        toast.error(err?.response?.data?.message || err.message || 'Failed to register');
      });
  };

  // Ship #10 (22 May 2026) — brochure download via authed fetch + blob.
  // BASE_URL exposed indirectly via eventAPI.brochureUrl. Authorization header
  // populated from localStorage token (same shape as services/api.js request()).
  const handleDownloadBrochure = async (ev) => {
    try {
      const url = eventAPI.brochureUrl(ev.id);
      const token = localStorage.getItem('openi_token') || '';
      const resp = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!resp.ok) throw new Error('Failed to download brochure');
      const blob = await resp.blob();
      const dlUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = dlUrl;
      a.download = `Event-${(ev.title || 'event').replace(/[^a-zA-Z0-9]/g, '-').slice(0, 50)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(dlUrl);
      toast.success('Brochure downloaded');
    } catch (err) {
      toast.error(err.message || 'Failed to download brochure');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Event title is required');
      return;
    }
    setSubmitting(true);
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      type: form.type,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      location: form.location.trim() || null,
      is_virtual: !!form.is_virtual,
      capacity: form.capacity ? Number(form.capacity) : null,
      tags: form.tags.trim() ? form.tags.split(',').map(s => s.trim()).filter(Boolean) : [],
    };
    try {
      const created = await eventAPI.create(payload);
      const norm = normalizeEvent(created);
      setEvents(prev => [norm, ...prev]);
      toast.success('Event saved as draft — only you can see it until you publish');
      setShowCreate(false);
      setForm(EMPTY_FORM);
    } catch (err) {
      toast.error(err.message || 'Failed to create event');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async (evId) => {
    try {
      const updated = await eventAPI.publish(evId);
      const norm = normalizeEvent(updated);
      setEvents(prev => prev.map(e => e.id === evId ? norm : e));
      if (selected && selected.id === evId) setSelected(norm);
      toast.success('Event published — visible to everyone now');
    } catch (err) {
      toast.error(err.message || 'Failed to publish event');
    }
  };

  // Ship #11 (21 May 2026) — delete event (creator + same-org + admin gated server-side)
  const handleDelete = async (evId) => {
    if (!window.confirm('Delete this event? This action cannot be undone.')) return;
    try {
      await eventAPI.delete(evId);
      setEvents(prev => prev.filter(e => e.id !== evId));
      if (selected && selected.id === evId) setSelected(null);
      toast.success('Event deleted');
    } catch (err) {
      toast.error(err.message || 'Failed to delete event');
    }
  };

  const filtered = events.filter(e => {
    const matchType   = typeFilter === 'All' || e.type === typeFilter;
    const matchStatus = statusFilter === 'All' || e.status === statusFilter;
    const matchSearch = (e.title || '').toLowerCase().includes(search.toLowerCase()) ||
                        (e.tags || []).some(t => t.toLowerCase().includes(search.toLowerCase()));
    return matchType && matchStatus && matchSearch;
  });

  if (loading) return <LoadingSkeleton type="card" />;

  if (selected) {
    return <EventDetail
      event={selected}
      onBack={() => setSelected(null)}
      onRegister={handleRegister}
      onPublish={handlePublish}
      onDelete={handleDelete}
      onDownloadBrochure={handleDownloadBrochure}
      isRegistered={registeredSet.has(selected.id)}
      currentUserId={userId}
    />;
  }

  return (
    <div style={{ padding: 28, maxWidth: 1200, background: '#f5f5f5', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, color: '#1a1a1a', fontSize: 22, fontWeight: 700 }}>Events Repository</h1>
          <p style={{ margin: '4px 0 0', color: '#888', fontSize: 13 }}>Hackathons, workshops, demo days and conferences for the OpenI startup ecosystem</p>
        </div>
        {canCreate && (
          <button onClick={() => setShowCreate(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: G, color: '#fff', border: 'none', borderRadius: 9, cursor: 'pointer', fontSize: 13, fontWeight: 700, boxShadow: '0 2px 10px rgba(213,170,91,0.3)' }}
            onMouseEnter={e => e.currentTarget.style.background = GH}
            onMouseLeave={e => e.currentTarget.style.background = G}
          >
            <Plus size={14} /> Create Event
          </button>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 22 }}>
        {[
          { label: 'Total Events',   value: events.length, icon: Calendar, bg: '#fff8ec', fg: G },
          { label: 'Upcoming',       value: events.filter(e => e.status === 'Upcoming').length, icon: Clock, bg: '#f0f9ff', fg: '#0284c7' },
          { label: 'Live Now',       value: events.filter(e => e.status === 'Live').length, icon: Zap, bg: '#f0fdf4', fg: '#16a34a' },
          { label: 'Total Registered', value: events.reduce((s, e) => s + e.registrations, 0), icon: Users, bg: '#fdf4ff', fg: '#9333ea' },
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

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
          <input placeholder="Search events, tags…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box', paddingLeft: 30, paddingRight: 12, paddingTop: 9, paddingBottom: 9, background: '#fff', border: '1.5px solid #eee', borderRadius: 9, fontSize: 13, outline: 'none', color: '#1a1a1a' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {['All', ...Object.keys(EVENT_TYPES)].map(t => (
            <button key={t} onClick={() => setTypeFilter(t)} style={{
              padding: '6px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, textTransform: 'capitalize', border: '1.5px solid', cursor: 'pointer',
              background: typeFilter === t ? G : '#fff',
              color: typeFilter === t ? '#fff' : '#666',
              borderColor: typeFilter === t ? G : '#eee',
            }}>{t === 'All' ? 'All Types' : EVENT_TYPES[t]?.label}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          {['All', 'Upcoming', 'Live', 'Completed'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} style={{
              padding: '6px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, border: '1.5px solid', cursor: 'pointer',
              background: statusFilter === s ? '#1a1a1a' : '#fff',
              color: statusFilter === s ? '#fff' : '#666',
              borderColor: statusFilter === s ? '#1a1a1a' : '#eee',
            }}>{s}</button>
          ))}
        </div>
        {/* View toggle */}
        <div style={{ display: 'flex', background: '#fff', border: '1px solid #eee', borderRadius: 8, padding: 3, gap: 2 }}>
          {[{ v: 'grid', label: '⊞' }, { v: 'list', label: '☰' }].map(({ v, label }) => (
            <button key={v} onClick={() => setView(v)} style={{ padding: '5px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', background: view === v ? G : 'transparent', color: view === v ? '#fff' : '#888', fontSize: 13, fontWeight: 700 }}>{label}</button>
          ))}
        </div>
      </div>

      {/* Grid view */}
      {view === 'grid' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {filtered.map(ev => <EventCard key={ev.id} ev={ev} currentUserId={userId} onClick={() => setSelected(ev)} />)}
          {filtered.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 48, color: '#aaa', fontSize: 13 }}>
              No events found{canCreate ? <> · <button onClick={() => setShowCreate(true)} style={{ background: 'none', border: 'none', color: G, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>Create the first one</button></> : null}
            </div>
          )}
        </div>
      )}

      {/* Phase 66 — Create Event modal */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false); }}
        >
          <form onSubmit={handleCreate} style={{ background: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 560, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 12px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, color: '#1a1a1a', fontSize: 18, fontWeight: 700 }}>Create Event</h3>
                <p style={{ margin: '4px 0 0', color: '#888', fontSize: 12 }}>Saved as a draft. Only you can see it until you publish.</p>
              </div>
              <button type="button" onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', padding: 4 }}><X size={18} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>
              <Field label="Event Title *">
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} maxLength={500} required placeholder="e.g., DefTech Demo Day Bengaluru 2026" style={fieldInputStyle} />
              </Field>

              <Field label="Type">
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={fieldInputStyle}>
                  {Object.entries(EVENT_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </Field>

              <Field label="Description">
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} maxLength={5000} rows={3} placeholder="What's the event about?" style={{ ...fieldInputStyle, resize: 'vertical' }} />
              </Field>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Start Date">
                  <input type="datetime-local" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} style={fieldInputStyle} />
                </Field>
                <Field label="End Date">
                  <input type="datetime-local" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} style={fieldInputStyle} />
                </Field>
              </div>

              <Field label="Location">
                <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} maxLength={500} placeholder="City or venue (or leave blank for virtual)" style={fieldInputStyle} />
              </Field>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#1a1a1a' }}>
                <input type="checkbox" checked={form.is_virtual} onChange={e => setForm(f => ({ ...f, is_virtual: e.target.checked }))} />
                Virtual / Online event
              </label>

              <Field label="Capacity">
                <input type="number" min={0} max={100000} value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} placeholder="e.g., 200" style={fieldInputStyle} />
              </Field>

              <Field label="Tags" hint="Comma-separated">
                <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="defence, ai, demo" style={fieldInputStyle} />
              </Field>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button type="button" onClick={() => setShowCreate(false)} disabled={submitting} style={{ flex: 1, padding: '10px 16px', background: '#fff', color: '#555', border: '1.5px solid #ddd', borderRadius: 9, cursor: submitting ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600 }}>Cancel</button>
              <button type="submit" disabled={submitting} style={{ flex: 1, padding: '10px 16px', background: G, color: '#fff', border: 'none', borderRadius: 9, cursor: submitting ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700, opacity: submitting ? 0.7 : 1 }}>
                {submitting ? 'Saving…' : 'Save as Draft'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List view */}
      {view === 'list' && (
        <div style={{ ...card, overflow: 'hidden' }}>
          <div style={{ padding: '12px 22px', borderBottom: '1px solid #eee', background: '#fafafa', display: 'grid', gridTemplateColumns: '1fr 120px 140px 90px 80px', gap: 12 }}>
            {['Event', 'Type', 'Date', 'Status', 'Regs'].map(h => <span key={h} style={{ fontSize: 11, color: '#888', fontWeight: 600 }}>{h}</span>)}
          </div>
          {filtered.map((ev, i) => {
            const et = EVENT_TYPES[ev.type] || EVENT_TYPES.workshop;
            const ss = STATUS_STYLE[ev.status] || STATUS_STYLE['Upcoming'];
            const EIcon = et.icon;
            return (
              <div key={ev.id} onClick={() => setSelected(ev)} style={{ padding: '13px 22px', borderBottom: i < filtered.length - 1 ? '1px solid #f5f5f5' : 'none', display: 'grid', gridTemplateColumns: '1fr 120px 140px 90px 80px', gap: 12, alignItems: 'center', cursor: 'pointer', transition: 'background 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{ev.title}</div>
                  <div style={{ fontSize: 11, color: '#888', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <MapPin size={10} />{ev.location}
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: et.bg, color: et.color, border: `1px solid ${et.color}22`, display: 'inline-flex', alignItems: 'center', gap: 4, width: 'fit-content' }}>
                  <EIcon size={9} />{et.label}
                </span>
                <span style={{ fontSize: 11, color: '#555' }}>{ev.date}</span>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`, width: 'fit-content' }}>{ev.status}</span>
                <span style={{ fontSize: 12, color: '#1a1a1a', fontWeight: 600 }}>{ev.registrations}<span style={{ color: '#aaa', fontWeight: 400 }}>/{ev.capacity}</span></span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Phase 66 — small layout helpers used by the Create Event modal.
const fieldInputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '9px 11px',
  background: '#fff',
  border: '1.5px solid #e5e5e5',
  borderRadius: 8,
  fontSize: 13,
  color: '#1a1a1a',
  outline: 'none',
};

function Field({ label, hint, children }) {
  return (
    <label style={{ display: 'block' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#444' }}>{label}</span>
        {hint ? <span style={{ fontSize: 10, color: '#999' }}>{hint}</span> : null}
      </div>
      {children}
    </label>
  );
}

function EventCard({ ev, currentUserId, onClick }) {
  const et = EVENT_TYPES[ev.type] || EVENT_TYPES.workshop;
  const ss = STATUS_STYLE[ev.status] || STATUS_STYLE['Upcoming'];
  const EIcon = et.icon;
  const regPct = Math.round((ev.registrations / ev.capacity) * 100);
  const isMyDraft = ev.visibility === 'draft' && currentUserId && ev.created_by === currentUserId;

  return (
    <div style={{ ...card, overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow 0.15s', position: 'relative' }}
      onClick={onClick}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'}
    >
      {/* Top colour bar */}
      <div style={{ height: 4, background: et.color }} />
      {/* Phase 66 draft badge — only visible to the creator */}
      {isMyDraft && (
        <div style={{ position: 'absolute', top: 12, right: 12, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>
          DRAFT — only you
        </div>
      )}
      <div style={{ padding: 20 }}>
        {/* Type & status */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: et.bg, color: et.color, border: `1px solid ${et.color}22`, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <EIcon size={10} />{et.label}
          </span>
          <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: ss.bg, color: ss.color, border: `1px solid ${ss.border}` }}>{ev.status}</span>
        </div>

        <h3 style={{ margin: '0 0 8px', color: '#1a1a1a', fontSize: 14, fontWeight: 700, lineHeight: 1.4 }}>{ev.title}</h3>
        {ev.organization_name && (
          <div style={{ margin: '0 0 8px', fontSize: 11, color: '#888', fontStyle: 'italic' }}>Hosted by {ev.organization_name}</div>
        )}
        <p style={{ margin: '0 0 14px', color: '#666', fontSize: 12, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{ev.description}</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#555' }}>
            <Calendar size={12} color="#aaa" />
            {ev.date}{ev.date !== ev.endDate ? ` – ${ev.endDate}` : ''}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#555' }}>
            <MapPin size={12} color="#aaa" />{ev.location}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#555' }}>
            <Globe size={12} color="#aaa" />{ev.mode}
          </div>
        </div>

        {/* Tags */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 14 }}>
          {ev.tags.map(t => <span key={t} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: '#f5f5f5', color: '#888', border: '1px solid #eee' }}>{t}</span>)}
        </div>

        {/* Registrations */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: '#888', display: 'flex', alignItems: 'center', gap: 4 }}><Users size={10} /> Registrations</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: regPct > 85 ? '#dc2626' : '#1a1a1a' }}>{ev.registrations}/{ev.capacity}</span>
          </div>
          <div style={{ height: 5, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${regPct}%`, height: '100%', background: regPct > 85 ? '#dc2626' : G, borderRadius: 3 }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Ship #10 (22 May 2026) — calendar helpers (defined outside component
// for clarity; pure functions, no React state)
function pad(n) { return String(n).padStart(2, '0'); }
function toIcsDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  return `${dt.getUTCFullYear()}${pad(dt.getUTCMonth()+1)}${pad(dt.getUTCDate())}T${pad(dt.getUTCHours())}${pad(dt.getUTCMinutes())}${pad(dt.getUTCSeconds())}Z`;
}
function buildIcsContent(ev) {
  const start = toIcsDate(ev.start_date || new Date());
  const end = toIcsDate(ev.end_date || ev.start_date || new Date());
  const summary = (ev.title || 'Event').replace(/[,;]/g, '\\$&');
  const desc = (ev.description || '').replace(/[\r\n]+/g, '\\n').replace(/[,;]/g, '\\$&');
  const loc = (ev.location || (ev.is_virtual ? 'Online' : '')).replace(/[,;]/g, '\\$&');
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//OpenI Hub//Event//EN',
    'BEGIN:VEVENT',
    `UID:event-${ev.id}@openi.ai`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${desc}`,
    `LOCATION:${loc}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}
function downloadIcs(ev) {
  const content = buildIcsContent(ev);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(ev.title || 'event').replace(/[^a-zA-Z0-9]/g, '-').slice(0, 50)}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
function buildGoogleCalUrl(ev) {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: ev.title || 'Event',
    dates: `${toIcsDate(ev.start_date || new Date())}/${toIcsDate(ev.end_date || ev.start_date || new Date())}`,
    details: ev.description || '',
    location: ev.location || (ev.is_virtual ? 'Online' : ''),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
function buildOutlookUrl(ev) {
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: ev.title || 'Event',
    startdt: new Date(ev.start_date || new Date()).toISOString(),
    enddt: new Date(ev.end_date || ev.start_date || new Date()).toISOString(),
    body: ev.description || '',
    location: ev.location || (ev.is_virtual ? 'Online' : ''),
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

function EventDetail({ event: ev, onBack, onRegister, onPublish, onDelete, onDownloadBrochure, isRegistered, currentUserId }) {
  // Ship #10 (22 May 2026) — calendar dropdown state (local to EventDetail)
  const [calDrop, setCalDrop] = useState(false);
  const et = EVENT_TYPES[ev.type] || EVENT_TYPES.workshop;
  const ss = STATUS_STYLE[ev.status] || STATUS_STYLE['Upcoming'];
  const EIcon = et.icon;
  const regPct = Math.round((ev.registrations / ev.capacity) * 100);
  const isMyDraft = ev.visibility === 'draft' && currentUserId && ev.created_by === currentUserId;

  return (
    <div style={{ padding: 28, maxWidth: 900, background: '#f5f5f5', minHeight: '100%' }}>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, color: G, fontSize: 13, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 20, padding: 0 }}>
        ← Events
      </button>

      {currentUserId && ev.created_by === currentUserId && onDelete && (
        <button
          onClick={() => onDelete(ev.id)}
          style={{ marginLeft: 12, padding: '8px 14px', background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}
          title="Delete this event"
        >
          <Trash2 size={14} /> Delete
        </button>
      )}

      {isMyDraft && (
        <div style={{ marginBottom: 16, padding: '10px 14px', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 9, color: '#92400e', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <span><strong>This event is a draft.</strong> Only you can see it. Click Publish to make it visible to all OpenI users.</span>
          <button onClick={() => onPublish && onPublish(ev.id)} style={{ padding: '6px 14px', background: '#92400e', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>Publish</button>
        </div>
      )}

      {/* Header */}
      <div style={{ ...card, padding: 28, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: et.bg, color: et.color, border: `1px solid ${et.color}22`, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <EIcon size={10} />{et.label}
              </span>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: ss.bg, color: ss.color, border: `1px solid ${ss.border}` }}>{ev.status}</span>
              <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#f5f3ff', color: '#7c3aed', border: '1px solid #e9d5ff' }}>{ev.mode}</span>
            </div>
            <h1 style={{ margin: '0 0 8px', color: '#1a1a1a', fontSize: 20, fontWeight: 800 }}>{ev.title}</h1>
            <p style={{ margin: 0, color: '#666', fontSize: 14, lineHeight: 1.6 }}>{ev.description}</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginTop: 22 }}>
          {[
            { icon: Calendar, label: 'Date',         value: `${ev.date}${ev.date !== ev.endDate ? ` – ${ev.endDate}` : ''}` },
            { icon: MapPin,   label: 'Location',     value: ev.location },
            { icon: Users,    label: 'Hosted by',    value: ev.organization_name || ev.organiser || 'OpenI Hub' },
            { icon: Users,    label: 'Registrations',value: `${ev.registrations} / ${ev.capacity}` },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 7, background: '#fff8ec', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={13} color={G} />
              </div>
              <div>
                <div style={{ fontSize: 10, color: '#aaa', marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 12, color: '#1a1a1a', fontWeight: 600 }}>{value}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 16, height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${regPct}%`, height: '100%', background: regPct > 85 ? '#dc2626' : G, borderRadius: 3 }} />
        </div>

        {/* Ship #10 (22 May 2026) — wire Register disable + Brochure + Calendar dropdown */}
        <div style={{ marginTop: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {ev.status !== 'Completed' && (
            <button
              onClick={() => onRegister && onRegister(ev.id)}
              disabled={isRegistered}
              style={{
                padding: '9px 20px',
                background: isRegistered ? '#d1d5db' : G,
                color: isRegistered ? '#6b7280' : '#fff',
                border: 'none',
                borderRadius: 9,
                cursor: isRegistered ? 'not-allowed' : 'pointer',
                fontSize: 13, fontWeight: 700,
                boxShadow: isRegistered ? 'none' : '0 2px 10px rgba(213,170,91,0.3)',
              }}
            >
              {isRegistered ? '✓ Registered' : 'Register Now'}
            </button>
          )}
          <button
            onClick={() => onDownloadBrochure && onDownloadBrochure(ev)}
            style={{ padding: '9px 20px', background: '#f5f5f5', color: '#555', border: '1.5px solid #eee', borderRadius: 9, cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Download size={13} /> Download Brochure
          </button>
          {/* Calendar dropdown — click reveals 3 export options */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setCalDrop(prev => !prev)}
              style={{ padding: '9px 20px', background: '#f0f9ff', color: '#0284c7', border: '1px solid #bae6fd', borderRadius: 9, cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <ExternalLink size={13} /> Add to Calendar
            </button>
            {calDrop && (
              <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 9, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', zIndex: 10, minWidth: 180 }}>
                <button onClick={() => { downloadIcs(ev); setCalDrop(false); }} style={{ display: 'block', width: '100%', padding: '8px 14px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#333' }}>
                  Download .ics file
                </button>
                <a href={buildGoogleCalUrl(ev)} target="_blank" rel="noopener noreferrer" onClick={() => setCalDrop(false)} style={{ display: 'block', padding: '8px 14px', textDecoration: 'none', fontSize: 12, color: '#333', borderTop: '1px solid #f3f4f6' }}>
                  Google Calendar
                </a>
                <a href={buildOutlookUrl(ev)} target="_blank" rel="noopener noreferrer" onClick={() => setCalDrop(false)} style={{ display: 'block', padding: '8px 14px', textDecoration: 'none', fontSize: 12, color: '#333', borderTop: '1px solid #f3f4f6' }}>
                  Outlook Calendar
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16 }}>
        {/* Agenda */}
        <div style={{ ...card, overflow: 'hidden' }}>
          <div style={{ padding: '14px 22px', borderBottom: '1px solid #eee' }}>
            <h3 style={{ margin: 0, color: '#1a1a1a', fontSize: 14, fontWeight: 600 }}>Agenda</h3>
          </div>
          {ev.agenda.map((item, i) => (
            <div key={i} style={{ padding: '14px 22px', borderBottom: i < ev.agenda.length - 1 ? '1px solid #f5f5f5' : 'none', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ minWidth: 70, fontSize: 11, fontWeight: 700, color: G }}>{item.time}</div>
              <div style={{ color: '#1a1a1a', fontSize: 13 }}>{item.title}</div>
            </div>
          ))}
        </div>

        {/* Speakers & tags */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ ...card, padding: 18 }}>
            <h3 style={{ margin: '0 0 14px', color: '#1a1a1a', fontSize: 13, fontWeight: 700 }}>Speakers</h3>
            {ev.speakers.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < ev.speakers.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(213,170,91,0.12)', color: G, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, border: '1.5px solid rgba(213,170,91,0.25)', flexShrink: 0 }}>{s[0]}</div>
                <span style={{ fontSize: 12, color: '#1a1a1a' }}>{s}</span>
              </div>
            ))}
          </div>
          <div style={{ ...card, padding: 18 }}>
            <h3 style={{ margin: '0 0 12px', color: '#1a1a1a', fontSize: 13, fontWeight: 700 }}>Tags</h3>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {ev.tags.map(t => (
                <span key={t} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#fff8ec', color: G, border: '1px solid rgba(213,170,91,0.3)' }}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
