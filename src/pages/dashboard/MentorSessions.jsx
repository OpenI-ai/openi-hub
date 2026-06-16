import { useState, useEffect } from 'react';
import { mentorEnhAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Calendar, Plus, X, Clock, Filter } from 'lucide-react';

const G = '#D0A848';
const card = { background: '#fff', border: '1px solid #eee', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' };

const STATUS_COLORS = { scheduled: '#3B82F6', completed: '#22C55E', cancelled: '#EF4444', 'no-show': '#F59E0B' };
const STATUSES = ['all', 'scheduled', 'completed', 'cancelled'];

export default function MentorSessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ topic: '', mentee_name: '', session_date: '', duration_minutes: 30 });

  const load = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const res = await mentorEnhAPI.listSessions(params);
      setSessions(res.data?.sessions || res.data || []);
    } catch { toast.error('Failed to load sessions'); }
    setLoading(false);
  };
  useEffect(() => { load(); }, [filter]);

  const handleCreate = async () => {
    if (!form.topic || !form.session_date) { toast.error('Topic and date required'); return; }
    try {
      await mentorEnhAPI.createSession(form);
      toast.success('Session created');
      setModal(false); setForm({ topic: '', mentee_name: '', session_date: '', duration_minutes: 30 }); load();
    } catch { toast.error('Create failed'); }
  };

  const stars = (n) => n ? '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n)) : '';

  const fmtDate = (d) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    catch { return d; }
  };

  if (loading) return <div style={{ padding: 32, textAlign: 'center', color: '#888' }}>Loading…</div>;

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <div id="tour-page-mentor-sessions-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Mentor Sessions</h1>
        <button id="tour-page-mentor-sessions-create" onClick={() => setModal(true)}
          style={{ background: G, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
          <Plus size={16}/> New Session
        </button>
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, alignItems: 'center' }}>
        <Filter size={15} color="#888"/>
        {STATUSES.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            style={{ padding: '5px 14px', border: filter === s ? `2px solid ${G}` : '1px solid #ddd', borderRadius: 20, background: filter === s ? '#FFF8ED' : '#fff', fontSize: 13, cursor: 'pointer', fontWeight: filter === s ? 600 : 400, textTransform: 'capitalize' }}>
            {s}
          </button>
        ))}
      </div>

      {/* Sessions List */}
      {sessions.length === 0 && <p style={{ color: '#888', textAlign: 'center', marginTop: 40 }}>No sessions found.</p>}
      {sessions.map(s => (
        <div key={s.id} style={{ ...card, padding: 18, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{s.topic || 'Untitled'}</h3>
              <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 12, fontWeight: 600, color: '#fff',
                background: STATUS_COLORS[s.status] || '#888' }}>
                {s.status || 'scheduled'}
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#888' }}>
              {s.mentee_name && <span>👤 {s.mentee_name} &nbsp;·&nbsp; </span>}
              <Calendar size={12} style={{ verticalAlign: 'middle' }}/> {fmtDate(s.session_date)}
              {s.duration_minutes && <span> &nbsp;·&nbsp; <Clock size={12} style={{ verticalAlign: 'middle' }}/> {s.duration_minutes} min</span>}
            </p>
          </div>
          {s.rating > 0 && <div style={{ color: G, fontSize: 15, letterSpacing: 1 }}>{stars(s.rating)}</div>}
        </div>
      ))}

      {/* Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ ...card, padding: 28, width: 400 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>New Session</h2>
              <X size={20} style={{ cursor: 'pointer' }} onClick={() => setModal(false)}/>
            </div>
            <Inp label="Topic *" value={form.topic} onChange={v => setForm(f => ({ ...f, topic: v }))}/>
            <Inp label="Mentee Name" value={form.mentee_name} onChange={v => setForm(f => ({ ...f, mentee_name: v }))}/>
            <Inp label="Session Date *" type="datetime-local" value={form.session_date} onChange={v => setForm(f => ({ ...f, session_date: v }))}/>
            <Inp label="Duration (min)" type="number" value={form.duration_minutes} onChange={v => setForm(f => ({ ...f, duration_minutes: parseInt(v) || 30 }))}/>
            <button onClick={handleCreate} style={{ marginTop: 14, width: '100%', padding: 10, background: G, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
              Create Session
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Inp({ label, value, onChange, type = 'text' }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8, fontSize: 16, boxSizing: 'border-box' }}/>
    </div>
  );
}
