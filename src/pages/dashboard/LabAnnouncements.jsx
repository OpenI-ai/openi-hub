import { useState, useEffect } from 'react';
import { labAnnouncementAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ApplicantInvitePanel from '../../components/ApplicantInvitePanel';
import toast from 'react-hot-toast';
import { Megaphone, Plus, X, Pencil, Trash2, Globe, Lock, Calendar } from 'lucide-react';

const G = '#D0A848';
const card = { background: '#fff', border: '1px solid #eee', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' };

const STATUS_COLORS = { draft: '#6B7280', open: '#22C55E', closed: '#EF4444' };
const STATUS_OPTIONS = ['draft', 'open', 'closed'];

export default function LabAnnouncements() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const res = await labAnnouncementAPI.list();
      setItems(res.data?.announcements || res.data || []);
    } catch { toast.error('Failed to load announcements'); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm({ status: 'draft', is_public: false }); setModal(true); };
  const openEdit = (a) => {
    setEditing(a);
    setForm({
      title: a.title || '',
      description: a.description || '',
      facilities: Array.isArray(a.facilities) ? a.facilities.join(', ') : '',
      sectors: Array.isArray(a.sectors) ? a.sectors.join(', ') : '',
      eligibility: a.eligibility || '',
      deadline: a.deadline ? a.deadline.substring(0, 10) : '',
      application_url: a.application_url || '',
      is_public: a.is_public === true,
      status: a.status || 'draft',
    });
    setModal(true);
  };

  const toArr = (s) => (s || '').split(',').map(x => x.trim()).filter(Boolean);

  const handleSave = async () => {
    if (!form.title) { toast.error('Title is required'); return; }
    const payload = {
      title: form.title,
      description: form.description || null,
      facilities: toArr(form.facilities),
      sectors: toArr(form.sectors),
      eligibility: form.eligibility || null,
      deadline: form.deadline || null,
      application_url: form.application_url || null,
      is_public: form.is_public === true,
      status: form.status || 'draft',
    };
    try {
      if (editing) {
        await labAnnouncementAPI.update(editing.id, payload);
        toast.success('Announcement updated');
      } else {
        await labAnnouncementAPI.create(payload);
        toast.success('Announcement created');
      }
      setModal(false); setForm({}); setEditing(null); load();
    } catch { toast.error('Save failed'); }
  };

  const handleDelete = async (a) => {
    if (!window.confirm(`Delete "${a.title}"? This cannot be undone.`)) return;
    try { await labAnnouncementAPI.remove(a.id); toast.success('Deleted'); load(); }
    catch { toast.error('Delete failed'); }
  };

  const togglePublic = async (a) => {
    try { await labAnnouncementAPI.update(a.id, { is_public: !a.is_public }); load(); }
    catch { toast.error('Update failed'); }
  };

  const fmtDate = (d) => {
    if (!d) return null;
    try { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return d; }
  };

  if (loading) return <div style={{ padding: 32, textAlign: 'center', color: '#888' }}>Loading…</div>;

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Megaphone size={22} color={G}/> Facility Announcements
        </h1>
        <button onClick={openCreate}
          style={{ background: G, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
          <Plus size={16}/> New Announcement
        </button>
      </div>
      <p style={{ color: '#888', fontSize: 14, marginTop: 0, marginBottom: 20 }}>
        Invite startups to apply for your lab facilities. Mark as <strong>Open</strong> and <strong>Public</strong> to make visible across the ecosystem.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 16 }}>
        {items.length === 0 && <p style={{ color: '#888' }}>No announcements yet. Create your first call for applications.</p>}
        {items.map(a => (
          <div key={a.id} style={{ ...card, padding: 18, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, flex: 1 }}>{a.title}</h3>
              <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 12, fontWeight: 600, color: '#fff', background: STATUS_COLORS[a.status] || '#888', textTransform: 'capitalize' }}>
                {a.status || 'draft'}
              </span>
            </div>
            {Array.isArray(a.sectors) && a.sectors.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {a.sectors.slice(0, 4).map((s, i) => (
                  <span key={i} style={{ fontSize: 11, background: '#F5F3EF', color: '#152838', padding: '2px 8px', borderRadius: 10 }}>{s}</span>
                ))}
              </div>
            )}
            {a.description && <p style={{ margin: '10px 0 0', fontSize: 13, color: '#666', lineHeight: 1.45 }}>{a.description.substring(0, 120)}{a.description.length > 120 ? '…' : ''}</p>}
            {a.deadline && (
              <p style={{ margin: '8px 0 0', fontSize: 12, color: '#888', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Calendar size={12}/> Deadline: {fmtDate(a.deadline)}
              </p>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
              <button onClick={() => togglePublic(a)} title={a.is_public ? 'Public — click to hide' : 'Private — click to publish'}
                style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer', color: a.is_public ? '#22C55E' : '#888' }}>
                {a.is_public ? <Globe size={14}/> : <Lock size={14}/>} {a.is_public ? 'Public' : 'Private'}
              </button>
              <span style={{ flex: 1 }} />
              <button onClick={() => openEdit(a)} title="Edit" style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#555', display: 'flex' }}><Pencil size={16}/></button>
              <button onClick={() => handleDelete(a)} title="Delete" style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#EF4444', display: 'flex' }}><Trash2 size={16}/></button>
            </div>
            {/* Cross-Ecosystem Phase F: invite applicants to this announcement */}
            <div style={{ marginTop: 12 }}>
              <ApplicantInvitePanel entityType="lab" entityId={a.id} entityLabel={a.title} user={user} />
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ ...card, padding: 28, width: 480, maxHeight: '86vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>{editing ? 'Edit Announcement' : 'New Announcement'}</h2>
              <X size={20} style={{ cursor: 'pointer' }} onClick={() => { setModal(false); setEditing(null); }}/>
            </div>
            <Inp label="Title *" value={form.title || ''} onChange={v => setForm(f => ({ ...f, title: v }))}/>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Description</label>
              <textarea value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8, fontSize: 16, boxSizing: 'border-box', resize: 'vertical' }}/>
            </div>
            <Inp label="Facilities (comma-separated)" value={form.facilities || ''} onChange={v => setForm(f => ({ ...f, facilities: v }))} placeholder="e.g. Cleanroom, 3D Printing, Wet Lab"/>
            <Inp label="Sectors (comma-separated)" value={form.sectors || ''} onChange={v => setForm(f => ({ ...f, sectors: v }))} placeholder="e.g. Biotech, Materials, Energy"/>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Eligibility</label>
              <textarea value={form.eligibility || ''} onChange={e => setForm(f => ({ ...f, eligibility: e.target.value }))} rows={2}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8, fontSize: 16, boxSizing: 'border-box', resize: 'vertical' }}/>
            </div>
            <Inp label="Application Deadline" type="date" value={form.deadline || ''} onChange={v => setForm(f => ({ ...f, deadline: v }))}/>
            <Inp label="Application URL" value={form.application_url || ''} onChange={v => setForm(f => ({ ...f, application_url: v }))} placeholder="https://…"/>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Status</label>
              <select value={form.status || 'draft'} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8, fontSize: 16, boxSizing: 'border-box', background: '#fff' }}>
                {STATUS_OPTIONS.map(s => <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, marginBottom: 16, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.is_public === true} onChange={e => setForm(f => ({ ...f, is_public: e.target.checked }))}/>
              Make public (visible across the ecosystem)
            </label>
            <button onClick={handleSave} style={{ width: '100%', padding: 10, background: G, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
              {editing ? 'Save Changes' : 'Create Announcement'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Inp({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>{label}</label>
      <input type={type} value={value} placeholder={placeholder || ''} onChange={e => onChange(e.target.value)}
        style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8, fontSize: 16, boxSizing: 'border-box' }}/>
    </div>
  );
}
