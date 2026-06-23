import { useState, useEffect } from 'react';
import { studentEnhAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Users, Plus, X, Edit3, Trash2, MessageSquare } from 'lucide-react';

const G = '#D0A848';
const card = { background: '#fff', border: '1px solid #eee', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' };
const STATUS_COLORS = { seeking: '#9333ea', requested: '#f59e0b', active: '#16a34a', completed: '#2563eb', declined: '#dc2626' };

export default function StudentMentorships() {
  const [mentorships, setMentorships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});
  const [editId, setEditId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = filter ? { status: filter } : {};
      const res = await studentEnhAPI.listMentorships(params);
      setMentorships(res.mentorships || res.data?.mentorships || []);
    } catch { toast.error('Failed to load mentorships'); }
    setLoading(false);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional refetch on filter change; `load` is a stable inline closure
  useEffect(() => { load(); }, [filter]);

  const openCreate = () => { setEditId(null); setForm({}); setModal(true); };
  const openEdit = (m) => { setEditId(m.id); setForm({ ...m }); setModal(true); };

  const handleSave = async () => {
    try {
      if (editId) { await studentEnhAPI.updateMentorship(editId, form); toast.success('Updated'); }
      else { await studentEnhAPI.createMentorship(form); toast.success('Mentorship request created'); }
      setModal(false); setForm({}); setEditId(null); load();
    } catch { toast.error('Save failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this mentorship record?')) return;
    try { await studentEnhAPI.deleteMentorship(id); toast.success('Deleted'); load(); }
    catch { toast.error('Delete failed'); }
  };

  const updateStatus = async (id, status) => {
    try {
      const data = { status };
      if (status === 'active' && !mentorships.find(m => m.id === id)?.started_at) data.started_at = new Date().toISOString().split('T')[0];
      if (status === 'completed') data.completed_at = new Date().toISOString().split('T')[0];
      await studentEnhAPI.updateMentorship(id, data);
      toast.success(`Status updated to ${status}`);
      load();
    } catch { toast.error('Update failed'); }
  };

  const stars = (n) => n ? ('★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n))) : '';
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

  const FILTERS = ['', 'seeking', 'requested', 'active', 'completed', 'declined'];

  if (loading) return <div style={{ padding: 32, textAlign: 'center', color: '#888' }}>Loading...</div>;

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <div id="tour-page-student-mentorships-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>My Mentorships</h1>
        <button id="tour-page-student-mentorships-create" onClick={openCreate}
          style={{ background: G, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
          <Plus size={16} /> New Mentorship
        </button>
      </div>

      {/* Status filters */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <button key={f || 'all'} onClick={() => setFilter(f)}
            style={{ padding: '5px 14px', borderRadius: 20, border: filter === f ? `2px solid ${G}` : '1px solid #ddd', background: filter === f ? G + '12' : '#fff', color: filter === f ? G : '#666', fontSize: 13, fontWeight: filter === f ? 600 : 400, cursor: 'pointer' }}>
            {f ? f.charAt(0).toUpperCase() + f.slice(1) : 'All'} {f && <span style={{ fontSize: 11, color: '#999' }}>({mentorships.filter(m => !f || m.status === f).length})</span>}
          </button>
        ))}
      </div>

      {/* Mentorship Cards */}
      {mentorships.length === 0 && <p style={{ color: '#888' }}>No mentorships found. Track your mentor connections and learning journey!</p>}
      {mentorships.map(m => (
        <div key={m.id} style={{ ...card, padding: 18, marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{m.topic}</h3>
                <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 20, background: (STATUS_COLORS[m.status] || '#888') + '18', color: STATUS_COLORS[m.status] || '#888', fontWeight: 600 }}>{m.status}</span>
              </div>
              <p style={{ margin: '6px 0 0', fontSize: 14, color: '#555' }}>
                <Users size={13} style={{ verticalAlign: -2, marginRight: 4 }}/>
                {m.mentor_display_name || m.mentor_name || 'Unassigned'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <Edit3 size={15} style={{ cursor: 'pointer', color: '#888' }} onClick={() => openEdit(m)}/>
              <Trash2 size={15} style={{ cursor: 'pointer', color: '#ccc' }} onClick={() => handleDelete(m.id)}/>
            </div>
          </div>

          {m.message && <p style={{ margin: '8px 0 0', fontSize: 13, color: '#888', fontStyle: 'italic' }}>{m.message}</p>}

          <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 12, color: '#888', flexWrap: 'wrap' }}>
            {m.meeting_count > 0 && <span>{m.meeting_count} session{m.meeting_count > 1 ? 's' : ''}</span>}
            {m.started_at && <span>Started {fmtDate(m.started_at)}</span>}
            {m.completed_at && <span>Completed {fmtDate(m.completed_at)}</span>}
            {m.rating && <span style={{ color: G, letterSpacing: 1 }}>{stars(m.rating)}</span>}
          </div>

          {m.notes && <div style={{ marginTop: 8, padding: '8px 12px', background: '#f9f9f6', borderRadius: 8, fontSize: 13, color: '#555' }}><MessageSquare size={12} style={{ verticalAlign: -2, marginRight: 4 }}/>{m.notes}</div>}

          {/* Quick status actions */}
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            {m.status === 'seeking' && <SmBtn label="Mark Requested" onClick={() => updateStatus(m.id, 'requested')} color="#f59e0b"/>}
            {m.status === 'requested' && <SmBtn label="Mark Active" onClick={() => updateStatus(m.id, 'active')} color="#16a34a"/>}
            {m.status === 'active' && <SmBtn label="Mark Completed" onClick={() => updateStatus(m.id, 'completed')} color="#2563eb"/>}
          </div>
        </div>
      ))}

      {/* Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ ...card, padding: 28, width: 460, maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>{editId ? 'Edit' : 'New'} Mentorship</h2>
              <X size={20} style={{ cursor: 'pointer' }} onClick={() => { setModal(false); setEditId(null); }}/>
            </div>
            <Inp label="Topic *" placeholder="What do you need mentorship on?" value={form.topic || ''} onChange={v => setForm(f => ({ ...f, topic: v }))}/>
            <Inp label="Mentor Name" placeholder="Prof. Name or leave blank if platform mentor" value={form.mentor_name || ''} onChange={v => setForm(f => ({ ...f, mentor_name: v }))}/>
            <Inp label="Message" multiline placeholder="Describe what you need help with..." value={form.message || ''} onChange={v => setForm(f => ({ ...f, message: v }))}/>
            {editId && <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                <Sel label="Status" value={form.status || 'seeking'} options={['seeking','requested','active','completed','declined']} onChange={v => setForm(f => ({ ...f, status: v }))}/>
                <Inp label="Sessions" type="number" value={form.meeting_count || 0} onChange={v => setForm(f => ({ ...f, meeting_count: parseInt(v) || 0 }))}/>
              </div>
              <Inp label="Notes" multiline value={form.notes || ''} onChange={v => setForm(f => ({ ...f, notes: v }))}/>
              <Sel label="Rating" value={form.rating || ''} options={['','1','2','3','4','5']} onChange={v => setForm(f => ({ ...f, rating: v ? parseInt(v) : null }))}/>
            </>}
            <button onClick={handleSave} style={{ marginTop: 16, width: '100%', padding: 10, background: G, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
              {editId ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SmBtn({ label, onClick, color }) {
  return (
    <button onClick={onClick} style={{ padding: '3px 10px', borderRadius: 6, border: `1px solid ${color}`, background: color + '12', color, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
      {label}
    </button>
  );
}

function Inp({ label, value, onChange, type = 'text', placeholder, multiline }) {
  const style = { width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit' };
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>{label}</label>
      {multiline
        ? <textarea value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} rows={3} style={{ ...style, resize: 'vertical' }}/>
        : <input type={type} value={value} placeholder={placeholder || ''} onChange={e => onChange(e.target.value)} style={style}/>
      }
    </div>
  );
}

function Sel({ label, value, options, onChange }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8, fontSize: 16, background: '#fff', boxSizing: 'border-box' }}>
        {options.map(o => <option key={o} value={o}>{o ? o.replace(/_/g, ' ') : '—'}</option>)}
      </select>
    </div>
  );
}
