import { useState, useEffect, useRef } from 'react';
import { meetingAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { PERSONAS } from '../../config/personas';
import {
  CalendarCheck, Plus, Loader2, MapPin, Clock, Users,
  Check, X, ChevronLeft, Video, Calendar, AlertCircle, Search,
} from 'lucide-react';
import toast from 'react-hot-toast';

const G = '#D0A848';
const card = { background: '#fff', border: '1px solid #eee', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' };

const TYPE_BADGE = {
  one_on_one: { bg: '#eff6ff', color: '#2563eb', label: '1:1' },
  group:      { bg: '#faf5ff', color: '#7c3aed', label: 'Group' },
  demo:       { bg: '#fff7ed', color: '#ea580c', label: 'Demo' },
  review:     { bg: '#f0fdf4', color: '#16a34a', label: 'Review' },
};

const STATUS_BADGE = {
  proposed:  { bg: '#fefce8', color: '#ca8a04', label: 'Proposed' },
  confirmed: { bg: '#f0fdf4', color: '#16a34a', label: 'Confirmed' },
  completed: { bg: '#f3f4f6', color: '#6b7280', label: 'Completed' },
  cancelled: { bg: '#fef2f2', color: '#dc2626', label: 'Cancelled' },
};

const RSVP_BADGE = {
  pending:  { bg: '#fefce8', color: '#ca8a04', label: 'Pending' },
  accepted: { bg: '#f0fdf4', color: '#16a34a', label: 'Accepted' },
  declined: { bg: '#fef2f2', color: '#dc2626', label: 'Declined' },
};

const fmtDate = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
};
const fmtTime = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

const Avatar = ({ src, name, size = 32 }) => {
  if (src) return <img src={src} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: '1px solid #eee' }} />;
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: '#f3f4f6', display: 'flex',
      alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 700, color: '#999', border: '1px solid #eee', flexShrink: 0 }}>
      {initials}
    </div>
  );
};

export default function Meetings() {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('upcoming');

  // Detail
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', meeting_type: 'one_on_one',
    start_time: '', end_time: '', location: '', meeting_link: '', notes: '',
  });
  const [participants, setParticipants] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [userResults, setUserResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const searchTimeout = useRef(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional refetch on tab change; `loadMeetings` is a stable inline closure
  useEffect(() => { loadMeetings(); }, [tab]);

  const loadMeetings = async () => {
    setLoading(true);
    try {
      const data = await meetingAPI.list({ tab });
      setMeetings(data.meetings || []);
    } catch { toast.error('Failed to load meetings'); }
    finally { setLoading(false); }
  };

  const openDetail = async (id) => {
    setDetailLoading(true);
    setSelectedId(id);
    try {
      const data = await meetingAPI.get(id);
      setDetail(data);
    } catch (err) { toast.error(err.message); setSelectedId(null); }
    finally { setDetailLoading(false); }
  };

  const handleRsvp = async (meetingId, rsvp) => {
    try {
      await meetingAPI.respond(meetingId, rsvp);
      toast.success(`RSVP: ${rsvp}`);
      loadMeetings();
      if (selectedId === meetingId) openDetail(meetingId);
    } catch (err) { toast.error(err.message); }
  };

  const handleStatusChange = async (meetingId, status) => {
    try {
      await meetingAPI.update(meetingId, { status });
      toast.success(`Meeting ${status}`);
      loadMeetings();
      if (selectedId === meetingId) openDetail(meetingId);
    } catch (err) { toast.error(err.message); }
  };

  // Participant search
  const handleUserSearch = (val) => {
    setUserSearch(val);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!val.trim()) { setUserResults([]); return; }
    searchTimeout.current = setTimeout(async () => {
      setSearchingUsers(true);
      try {
        const data = await meetingAPI.searchUsers(val);
        setUserResults((data.users || []).filter(u => !participants.find(p => p.id === u.id)));
      } catch (_e) { /* non-fatal user search */ }
      finally { setSearchingUsers(false); }
    }, 300);
  };

  const addParticipant = (u) => {
    setParticipants(prev => [...prev, u]);
    setUserResults(r => r.filter(x => x.id !== u.id));
    setUserSearch('');
  };

  const removeParticipant = (id) => {
    setParticipants(prev => prev.filter(p => p.id !== id));
  };

  const handleCreate = async () => {
    if (!form.title.trim()) return toast.error('Title is required');
    if (!form.start_time || !form.end_time) return toast.error('Start and end time are required');
    setCreating(true);
    try {
      await meetingAPI.create({
        ...form,
        participant_ids: participants.map(p => p.id),
      });
      toast.success('Meeting scheduled!');
      setShowCreate(false);
      setForm({ title: '', description: '', meeting_type: 'one_on_one', start_time: '', end_time: '', location: '', meeting_link: '', notes: '' });
      setParticipants([]);
      loadMeetings();
    } catch (err) { toast.error(err.message); }
    finally { setCreating(false); }
  };

  // ── Detail View ─────────────────────────────────────────────
  if (selectedId) {
    if (detailLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Loader2 size={28} className="animate-spin" style={{ color: G }} /></div>;
    if (!detail) return null;

    const typeBadge = TYPE_BADGE[detail.meeting_type] || TYPE_BADGE.one_on_one;
    const statusBadge = STATUS_BADGE[detail.status] || STATUS_BADGE.proposed;
    const isOrganizer = detail.organizer_id === user?.id;
    const myParticipant = (detail.participants || []).find(p => p.user_id === user?.id);
    const canRespond = myParticipant && myParticipant.rsvp === 'pending' && detail.status === 'proposed';

    return (
      <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
        <button onClick={() => { setSelectedId(null); setDetail(null); }}
          style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#888', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 16 }}>
          <ChevronLeft size={16} /> Back to Meetings
        </button>

        {/* Meeting header */}
        <div style={{ ...card, padding: 24, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', margin: '0 0 6px' }}>{detail.title}</h2>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 20, background: typeBadge.bg, color: typeBadge.color }}>{typeBadge.label}</span>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 20, background: statusBadge.bg, color: statusBadge.color }}>{statusBadge.label}</span>
              </div>
            </div>
          </div>

          {detail.description && (
            <p style={{ fontSize: 13, color: '#555', lineHeight: 1.6, margin: '0 0 14px', whiteSpace: 'pre-wrap' }}>{detail.description}</p>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, fontSize: 13 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#666' }}>
              <Calendar size={14} style={{ color: G }} />
              <span>{fmtDate(detail.start_time)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#666' }}>
              <Clock size={14} style={{ color: G }} />
              <span>{fmtTime(detail.start_time)} - {fmtTime(detail.end_time)}</span>
            </div>
            {detail.location && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#666' }}>
                <MapPin size={14} style={{ color: G }} />
                <span>{detail.location}</span>
              </div>
            )}
            {detail.meeting_link && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#666' }}>
                <Video size={14} style={{ color: G }} />
                <a href={detail.meeting_link} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'none' }}>Join Meeting</a>
              </div>
            )}
          </div>

          {detail.notes && (
            <div style={{ marginTop: 14, padding: 12, background: '#fafafa', borderRadius: 10, fontSize: 13, color: '#555' }}>
              <strong>Notes:</strong> {detail.notes}
            </div>
          )}
        </div>

        {/* Participants */}
        <div style={{ ...card, padding: 20, marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 }}>
            <Users size={14} style={{ verticalAlign: -2, marginRight: 6 }} />Participants ({(detail.participants || []).length})
          </h3>
          <div style={{ display: 'grid', gap: 8 }}>
            {(detail.participants || []).map(p => {
              const rsvpBadge = RSVP_BADGE[p.rsvp] || RSVP_BADGE.pending;
              const persona = PERSONAS[p.persona] || {};
              return (
                <div key={p.user_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
                  <Avatar src={p.avatar} name={p.name} size={36} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>
                      {p.name}
                      {p.role === 'organizer' && <span style={{ fontSize: 10, marginLeft: 6, padding: '1px 6px', borderRadius: 10, background: '#fff7ed', color: '#ea580c' }}>Organizer</span>}
                    </div>
                    <div style={{ fontSize: 11, color: '#999' }}>
                      {p.organization || ''}{p.organization && persona.label ? ' - ' : ''}{persona.label || ''}
                    </div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 20, background: rsvpBadge.bg, color: rsvpBadge.color }}>{rsvpBadge.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div style={{ ...card, padding: 20 }}>
          {canRespond && (
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => handleRsvp(detail.id, 'accepted')}
                style={{ flex: 1, padding: '10px 20px', fontSize: 13, fontWeight: 600, borderRadius: 10, background: '#16a34a', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Check size={16} /> Accept
              </button>
              <button onClick={() => handleRsvp(detail.id, 'declined')}
                style={{ flex: 1, padding: '10px 20px', fontSize: 13, fontWeight: 600, borderRadius: 10, background: '#fff', color: '#dc2626', border: '1px solid #fca5a5', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <X size={16} /> Decline
              </button>
            </div>
          )}
          {isOrganizer && detail.status === 'confirmed' && (
            <button onClick={() => handleStatusChange(detail.id, 'completed')}
              style={{ width: '100%', padding: '10px 20px', fontSize: 13, fontWeight: 600, borderRadius: 10, background: G, color: '#fff', border: 'none', cursor: 'pointer' }}>
              Mark as Completed
            </button>
          )}
          {isOrganizer && ['proposed', 'confirmed'].includes(detail.status) && (
            <button onClick={() => handleStatusChange(detail.id, 'cancelled')}
              style={{ width: '100%', padding: '10px 20px', fontSize: 13, fontWeight: 600, borderRadius: 10, background: '#fff', color: '#dc2626', border: '1px solid #fca5a5', cursor: 'pointer', marginTop: 8 }}>
              Cancel Meeting
            </button>
          )}
          {!canRespond && !isOrganizer && myParticipant && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#888', fontSize: 13 }}>
              <AlertCircle size={16} />
              <span>You {myParticipant.rsvp === 'accepted' ? 'accepted' : 'declined'} this meeting</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── List View ──────────────────────────────────────────────
  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', margin: '0 0 4px' }}>Meetings</h1>
          <p style={{ fontSize: 13, color: '#888', margin: 0 }}>Schedule and manage meetings with anyone on the platform</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', fontSize: 13, fontWeight: 600, borderRadius: 10, background: G, color: '#fff', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          <Plus size={16} /> Schedule Meeting
        </button>
      </div>

      {/* Tabs */}
      <div id="tour-page-meetings-tabs" style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid #eee', paddingBottom: 0 }}>
        {['upcoming', 'past', 'all'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '8px 20px', fontSize: 13, fontWeight: tab === t ? 700 : 500, color: tab === t ? G : '#888',
              background: 'none', border: 'none', borderBottom: tab === t ? `2px solid ${G}` : '2px solid transparent',
              cursor: 'pointer', marginBottom: -1, textTransform: 'capitalize' }}>
            {t}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <Loader2 size={28} className="animate-spin" style={{ color: G }} />
        </div>
      ) : meetings.length === 0 ? (
        <div style={{ ...card, padding: 48, textAlign: 'center' }}>
          <CalendarCheck size={40} style={{ color: '#ddd', marginBottom: 12 }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: '#999', marginBottom: 4 }}>No {tab} meetings</div>
          <div style={{ fontSize: 13, color: '#bbb' }}>Click "Schedule Meeting" to get started</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {meetings.map(m => {
            const typeBadge = TYPE_BADGE[m.meeting_type] || TYPE_BADGE.one_on_one;
            const statusBadge = STATUS_BADGE[m.status] || STATUS_BADGE.proposed;
            const canRespond = m.my_rsvp === 'pending' && m.status === 'proposed';
            const pList = m.participants || [];

            return (
              <div key={m.id} style={{ ...card, padding: 18, cursor: 'pointer', transition: 'box-shadow 0.15s' }}
                onClick={() => openDetail(m.id)}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.10)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>{m.title}</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: typeBadge.bg, color: typeBadge.color }}>{typeBadge.label}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: statusBadge.bg, color: statusBadge.color }}>{statusBadge.label}</span>
                      {canRespond && (
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#fefce8', color: '#ca8a04' }}>Action Required</span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 12, color: '#666', marginBottom: 10 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={12} style={{ color: '#aaa' }} /> {fmtDate(m.start_time)}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={12} style={{ color: '#aaa' }} /> {fmtTime(m.start_time)} - {fmtTime(m.end_time)}
                  </span>
                  {m.location && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={12} style={{ color: '#aaa' }} /> {m.location}
                    </span>
                  )}
                </div>

                {/* Participant avatars */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                  {pList.slice(0, 5).map((p, i) => (
                    <div key={p.user_id} style={{ marginLeft: i > 0 ? -8 : 0, zIndex: 5 - i }} title={p.name}>
                      <Avatar src={p.avatar} name={p.name} size={28} />
                    </div>
                  ))}
                  {pList.length > 5 && (
                    <div style={{ marginLeft: -8, width: 28, height: 28, borderRadius: '50%', background: '#f3f4f6', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#999', border: '1px solid #eee' }}>
                      +{pList.length - 5}
                    </div>
                  )}
                  <span style={{ marginLeft: 8, fontSize: 11, color: '#999' }}>{m.participant_count || pList.length} participant{(m.participant_count || pList.length) !== 1 ? 's' : ''}</span>
                </div>

                {/* RSVP quick actions */}
                {canRespond && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => handleRsvp(m.id, 'accepted')}
                      style={{ padding: '6px 16px', fontSize: 12, fontWeight: 600, borderRadius: 8, background: '#16a34a', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Check size={14} /> Accept
                    </button>
                    <button onClick={() => handleRsvp(m.id, 'declined')}
                      style={{ padding: '6px 16px', fontSize: 12, fontWeight: 600, borderRadius: 8, background: '#fff', color: '#dc2626', border: '1px solid #fca5a5', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <X size={14} /> Decline
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create Meeting Modal ───────────────────────────────── */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
          onClick={() => setShowCreate(false)}>
          <div style={{ ...card, padding: 28, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>Schedule Meeting</h2>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'grid', gap: 14 }}>
              {/* Title */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g., Demo Session with TechNova Labs"
                  style={{ width: '100%', padding: '10px 12px', fontSize: 16, border: '1px solid #ddd', borderRadius: 10, outline: 'none', boxSizing: 'border-box' }} />
              </div>

              {/* Description */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Meeting agenda or details..."
                  rows={3}
                  style={{ width: '100%', padding: '10px 12px', fontSize: 16, border: '1px solid #ddd', borderRadius: 10, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>

              {/* Meeting Type */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>Meeting Type</label>
                <select value={form.meeting_type} onChange={e => setForm(f => ({ ...f, meeting_type: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', fontSize: 16, border: '1px solid #ddd', borderRadius: 10, outline: 'none', boxSizing: 'border-box' }}>
                  <option value="one_on_one">One-on-One</option>
                  <option value="group">Group</option>
                  <option value="demo">Demo</option>
                  <option value="review">Review</option>
                </select>
              </div>

              {/* Date/Time */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>Start Time *</label>
                  <input type="datetime-local" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', fontSize: 16, border: '1px solid #ddd', borderRadius: 10, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>End Time *</label>
                  <input type="datetime-local" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', fontSize: 16, border: '1px solid #ddd', borderRadius: 10, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>

              {/* Location + Link */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>Location</label>
                  <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                    placeholder="e.g., OpenI HQ, Delhi"
                    style={{ width: '100%', padding: '10px 12px', fontSize: 16, border: '1px solid #ddd', borderRadius: 10, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>Meeting Link</label>
                  <input value={form.meeting_link} onChange={e => setForm(f => ({ ...f, meeting_link: e.target.value }))}
                    placeholder="e.g., https://meet.google.com/..."
                    style={{ width: '100%', padding: '10px 12px', fontSize: 16, border: '1px solid #ddd', borderRadius: 10, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Any additional notes..."
                  rows={2}
                  style={{ width: '100%', padding: '10px 12px', fontSize: 16, border: '1px solid #ddd', borderRadius: 10, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>

              {/* Participant Search */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>Invite Participants</label>
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
                  <input value={userSearch} onChange={e => handleUserSearch(e.target.value)}
                    placeholder="Search by name or email..."
                    style={{ width: '100%', padding: '10px 12px 10px 32px', fontSize: 16, border: '1px solid #ddd', borderRadius: 10, outline: 'none', boxSizing: 'border-box' }} />
                  {searchingUsers && <Loader2 size={14} className="animate-spin" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: G }} />}
                </div>

                {/* Search results dropdown */}
                {userResults.length > 0 && (
                  <div style={{ border: '1px solid #eee', borderRadius: 10, marginTop: 4, maxHeight: 160, overflowY: 'auto', background: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                    {userResults.map(u => {
                      const p = PERSONAS[u.role] || {};
                      return (
                        <div key={u.id} onClick={() => addParticipant(u)}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f5f5f5' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                          onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                          <Avatar src={u.avatar} name={u.name} size={28} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{u.name}</div>
                            <div style={{ fontSize: 11, color: '#999' }}>{u.organization_name || u.email}{p.label ? ` - ${p.label}` : ''}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Selected participants */}
                {participants.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {participants.map(p => (
                      <span key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, padding: '4px 10px', borderRadius: 20, background: '#f3f4f6', color: '#333' }}>
                        {p.name}
                        <X size={12} style={{ cursor: 'pointer', color: '#999' }} onClick={() => removeParticipant(p.id)} />
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit */}
              <button onClick={handleCreate} disabled={creating}
                style={{ width: '100%', padding: '12px 20px', fontSize: 14, fontWeight: 600, borderRadius: 10, background: G, color: '#fff', border: 'none', cursor: creating ? 'not-allowed' : 'pointer', opacity: creating ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {creating ? <Loader2 size={16} className="animate-spin" /> : <CalendarCheck size={16} />}
                {creating ? 'Scheduling...' : 'Schedule Meeting'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
