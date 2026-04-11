import { useState, useEffect } from 'react';
import { incubatorAPI } from '../../services/api';
import {
  Loader2, Plus, X, Users, Trash2, Edit3, Mail, Clock, ToggleLeft, ToggleRight
} from 'lucide-react';
import toast from 'react-hot-toast';

const G = '#D5AA5B';
const card = { background: '#fff', border: '1px solid #eee', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' };

export default function IncubatorMentorPool() {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    mentor_name: '', mentor_email: '', expertise: '', hours_per_month: '', notes: '', is_active: true
  });

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const d = await incubatorAPI.listMentorPool();
      setMentors(Array.isArray(d) ? d : []);
    } catch { toast.error('Failed to load mentor pool'); }
    finally { setLoading(false); }
  };

  const resetForm = () => {
    setForm({ mentor_name: '', mentor_email: '', expertise: '', hours_per_month: '', notes: '', is_active: true });
    setEditingId(null);
  };

  const openEdit = (m) => {
    setForm({
      mentor_name: m.mentor_name || '',
      mentor_email: m.mentor_email || '',
      expertise: (m.expertise || []).join(', '),
      hours_per_month: m.hours_per_month || '',
      notes: m.notes || '',
      is_active: m.is_active,
    });
    setEditingId(m.id);
    setShowAdd(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.mentor_name) return toast.error('Mentor name required');
    try {
      const payload = {
        ...form,
        expertise: form.expertise ? form.expertise.split(',').map(s => s.trim()).filter(Boolean) : null,
        hours_per_month: form.hours_per_month || null,
      };
      if (editingId) {
        await incubatorAPI.updateMentorInPool(editingId, payload);
        toast.success('Mentor updated');
      } else {
        await incubatorAPI.addMentorToPool(payload);
        toast.success('Mentor added to pool');
      }
      setShowAdd(false);
      resetForm();
      load();
    } catch (err) { toast.error(err.message || 'Failed'); }
  };

  const toggleActive = async (m) => {
    try {
      await incubatorAPI.updateMentorInPool(m.id, { is_active: !m.is_active });
      load();
    } catch (err) { toast.error(err.message || 'Failed'); }
  };

  const remove = async (id) => {
    if (!window.confirm('Remove this mentor from the pool?')) return;
    try {
      await incubatorAPI.removeMentorFromPool(id);
      toast.success('Removed');
      load();
    } catch (err) { toast.error(err.message || 'Failed'); }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Loader2 size={28} className="animate-spin" style={{ color: G }} /></div>;

  const active = mentors.filter(m => m.is_active);
  const inactive = mentors.filter(m => !m.is_active);

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>Mentor Pool</h1>
          <p style={{ fontSize: 13, color: '#888', margin: '4px 0 0' }}>{active.length} active · {mentors.length} total mentors</p>
        </div>
        <button onClick={() => { resetForm(); setShowAdd(true); }}
          style={{ padding: '10px 18px', background: G, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={16} /> Add Mentor
        </button>
      </div>

      {mentors.length === 0 ? (
        <div style={{ ...card, padding: 60, textAlign: 'center' }}>
          <Users size={42} style={{ color: '#ddd', marginBottom: 12 }} />
          <div style={{ fontSize: 16, fontWeight: 600, color: '#666', marginBottom: 6 }}>No mentors yet</div>
          <div style={{ fontSize: 13, color: '#999', marginBottom: 18 }}>Add mentors to your pool to assign them to startups in your programs</div>
          <button onClick={() => { resetForm(); setShowAdd(true); }}
            style={{ padding: '10px 20px', background: G, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Add Your First Mentor
          </button>
        </div>
      ) : (
        <>
          {/* Active mentors */}
          {active.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 13, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
                Active ({active.length})
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
                {active.map(m => <MentorCard key={m.id} mentor={m} onEdit={openEdit} onToggle={toggleActive} onRemove={remove} />)}
              </div>
            </div>
          )}

          {/* Inactive mentors */}
          {inactive.length > 0 && (
            <div>
              <h2 style={{ fontSize: 13, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
                Inactive ({inactive.length})
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
                {inactive.map(m => <MentorCard key={m.id} mentor={m} onEdit={openEdit} onToggle={toggleActive} onRemove={remove} />)}
              </div>
            </div>
          )}
        </>
      )}

      {/* Add/Edit Modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div style={{ ...card, width: '100%', maxWidth: 520, padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>{editingId ? 'Edit Mentor' : 'Add Mentor to Pool'}</h2>
              <X size={20} style={{ cursor: 'pointer', color: '#888' }} onClick={() => { setShowAdd(false); resetForm(); }} />
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
              <div>
                <label style={lbl}>Mentor Name *</label>
                <input required value={form.mentor_name} onChange={e => setForm({ ...form, mentor_name: e.target.value })} style={inp} />
              </div>
              <div>
                <label style={lbl}>Email</label>
                <input type="email" value={form.mentor_email} onChange={e => setForm({ ...form, mentor_email: e.target.value })} style={inp} />
              </div>
              <div>
                <label style={lbl}>Expertise (comma-separated)</label>
                <input value={form.expertise} onChange={e => setForm({ ...form, expertise: e.target.value })} placeholder="DeepTech, Fundraising, GTM" style={inp} />
              </div>
              <div>
                <label style={lbl}>Hours per Month</label>
                <input type="number" value={form.hours_per_month} onChange={e => setForm({ ...form, hours_per_month: e.target.value })} style={inp} />
              </div>
              <div>
                <label style={lbl}>Notes</label>
                <textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ ...inp, resize: 'vertical' }} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#666', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
                Active (available for assignments)
              </label>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 6 }}>
                <button type="button" onClick={() => { setShowAdd(false); resetForm(); }}
                  style={{ padding: '9px 16px', background: '#fff', border: '1px solid #ddd', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#666', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit"
                  style={{ padding: '9px 18px', background: G, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  {editingId ? 'Save Changes' : 'Add Mentor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function MentorCard({ mentor: m, onEdit, onToggle, onRemove }) {
  return (
    <div style={{ ...card, padding: 16, opacity: m.is_active ? 1 : 0.6 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#fff8ec', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Users size={18} style={{ color: G }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.mentor_name}</div>
          {m.mentor_email && <div style={{ fontSize: 11, color: '#888', display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={10} />{m.mentor_email}</div>}
          {m.hours_per_month && <div style={{ fontSize: 11, color: '#888', display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={10} />{m.hours_per_month} hrs/mo</div>}
        </div>
      </div>

      {(m.expertise || []).length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 10 }}>
          {m.expertise.slice(0, 4).map(e => <span key={e} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, background: '#eff6ff', color: '#2563eb' }}>{e}</span>)}
        </div>
      )}

      {m.notes && <div style={{ fontSize: 11, color: '#888', marginTop: 8, fontStyle: 'italic' }}>"{m.notes.substring(0, 100)}{m.notes.length > 100 ? '...' : ''}"</div>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTop: '1px solid #f5f5f5' }}>
        <div style={{ fontSize: 11, color: '#888' }}>
          {m.active_mentees > 0 && <span><Users size={11} style={{ verticalAlign: -2, marginRight: 3 }} />{m.active_mentees} mentees</span>}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => onToggle(m)} title={m.is_active ? 'Deactivate' : 'Activate'}
            style={{ padding: '5px 8px', background: 'none', border: '1px solid #eee', borderRadius: 6, cursor: 'pointer', color: m.is_active ? '#16a34a' : '#999' }}>
            {m.is_active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
          </button>
          <button onClick={() => onEdit(m)} title="Edit"
            style={{ padding: '5px 8px', background: 'none', border: '1px solid #eee', borderRadius: 6, cursor: 'pointer', color: '#666' }}>
            <Edit3 size={12} />
          </button>
          <button onClick={() => onRemove(m.id)} title="Remove"
            style={{ padding: '5px 8px', background: 'none', border: '1px solid #fee', borderRadius: 6, cursor: 'pointer', color: '#dc2626' }}>
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

const lbl = { display: 'block', fontSize: 11, fontWeight: 600, color: '#666', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 };
const inp = { width: '100%', padding: '9px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' };
