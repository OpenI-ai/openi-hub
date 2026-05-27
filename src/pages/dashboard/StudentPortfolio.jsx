import { useState, useEffect } from 'react';
import { studentEnhAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { FolderKanban, Award, Plus, X, Edit3, Trash2, Star, ExternalLink, Github } from 'lucide-react';

const G = '#D5AA5B';
const card = { background: '#fff', border: '1px solid #eee', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' };

const TABS = ['Projects', 'Certifications'];
const PROJECT_TYPES = ['research', 'hackathon', 'capstone', 'thesis', 'side_project', 'open_source', 'other'];
const PROJECT_STATUSES = ['idea', 'in_progress', 'completed', 'published', 'archived'];
const CERT_TYPES = ['certification', 'course', 'workshop', 'bootcamp', 'competition', 'award', 'scholarship'];
const STATUS_COLORS = { idea: '#9333ea', in_progress: '#2563eb', completed: '#16a34a', published: '#D5AA5B', archived: '#6b7280' };
const TYPE_COLORS = { certification: '#2563eb', course: '#16a34a', workshop: '#f59e0b', bootcamp: '#ec4899', competition: '#9333ea', award: '#D5AA5B', scholarship: '#0ea5e9' };

export default function StudentPortfolio() {
  const [tab, setTab] = useState(0);
  const [projects, setProjects] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'project' | 'certification' | null
  const [form, setForm] = useState({});
  const [editId, setEditId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [p, c] = await Promise.all([studentEnhAPI.listProjects(), studentEnhAPI.listCertifications()]);
      setProjects(p.projects || p.data?.projects || []);
      setCertifications(c.certifications || c.data?.certifications || []);
    } catch { toast.error('Failed to load data'); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openCreate = (type) => { setEditId(null); setForm({}); setModal(type); };
  const openEdit = (type, item) => { setEditId(item.id); setForm({ ...item, tech_stack: item.tech_stack?.join(', ') || '', collaborators: item.collaborators?.join(', ') || '', skills_gained: item.skills_gained?.join(', ') || '' }); setModal(type); };

  const handleSave = async () => {
    try {
      const data = { ...form };
      // Convert comma-separated strings to arrays
      if (data.tech_stack && typeof data.tech_stack === 'string') data.tech_stack = data.tech_stack.split(',').map(s => s.trim()).filter(Boolean);
      if (data.collaborators && typeof data.collaborators === 'string') data.collaborators = data.collaborators.split(',').map(s => s.trim()).filter(Boolean);
      if (data.skills_gained && typeof data.skills_gained === 'string') data.skills_gained = data.skills_gained.split(',').map(s => s.trim()).filter(Boolean);

      if (modal === 'project') {
        if (editId) { await studentEnhAPI.updateProject(editId, data); toast.success('Project updated'); }
        else { await studentEnhAPI.createProject(data); toast.success('Project created'); }
      } else {
        if (editId) { await studentEnhAPI.updateCertification(editId, data); toast.success('Certification updated'); }
        else { await studentEnhAPI.createCertification(data); toast.success('Certification added'); }
      }
      setModal(null); setForm({}); setEditId(null); load();
    } catch { toast.error('Save failed'); }
  };

  const handleDelete = async (type, id) => {
    if (!confirm('Delete this item?')) return;
    try {
      if (type === 'project') { await studentEnhAPI.deleteProject(id); toast.success('Deleted'); }
      else { await studentEnhAPI.deleteCertification(id); toast.success('Deleted'); }
      load();
    } catch { toast.error('Delete failed'); }
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

  if (loading) return <div style={{ padding: 32, textAlign: 'center', color: '#888' }}>Loading...</div>;

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>My Portfolio</h1>
        <button onClick={() => openCreate(tab === 0 ? 'project' : 'certification')}
          style={{ background: G, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
          <Plus size={16} /> {tab === 0 ? 'Add Project' : 'Add Certification'}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid #eee' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            style={{ padding: '8px 20px', border: 'none', borderBottom: tab === i ? `3px solid ${G}` : '3px solid transparent', background: 'none', fontWeight: tab === i ? 700 : 400, color: tab === i ? G : '#666', cursor: 'pointer', fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
            {i === 0 ? <FolderKanban size={14}/> : <Award size={14}/>} {t} <span style={{ fontSize: 12, color: '#999' }}>({i === 0 ? projects.length : certifications.length})</span>
          </button>
        ))}
      </div>

      {/* Projects Tab */}
      {tab === 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: 16 }}>
          {projects.length === 0 && <p style={{ color: '#888' }}>No projects yet. Showcase your research, hackathons, and side projects!</p>}
          {projects.map(p => (
            <div key={p.id} style={{ ...card, padding: 18, borderLeft: p.is_featured ? `4px solid ${G}` : undefined }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{p.title}</h3>
                  {p.is_featured && <span style={{ fontSize: 11, color: G, fontWeight: 600 }}>★ Featured</span>}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Edit3 size={15} style={{ cursor: 'pointer', color: '#888' }} onClick={() => openEdit('project', p)}/>
                  <Trash2 size={15} style={{ cursor: 'pointer', color: '#ccc' }} onClick={() => handleDelete('project', p.id)}/>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#f0f0f0', color: '#555', fontWeight: 600 }}>{p.project_type?.replace('_', ' ')}</span>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: (STATUS_COLORS[p.status] || '#888') + '18', color: STATUS_COLORS[p.status] || '#888', fontWeight: 600 }}>{p.status?.replace('_', ' ')}</span>
              </div>
              {p.description && <p style={{ margin: '8px 0 0', fontSize: 13, color: '#555', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.description}</p>}
              {p.tech_stack?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                  {p.tech_stack.map((t, i) => <span key={i} style={{ fontSize: 11, padding: '1px 7px', borderRadius: 12, background: G + '18', color: G, fontWeight: 500 }}>{t}</span>)}
                </div>
              )}
              {p.awards_won && <div style={{ marginTop: 8, fontSize: 12, color: '#D5AA5B', fontWeight: 600 }}>🏆 {p.awards_won}</div>}
              <div style={{ display: 'flex', gap: 12, marginTop: 10, fontSize: 12, color: '#888' }}>
                {p.start_date && <span>{fmtDate(p.start_date)}{p.end_date ? ` — ${fmtDate(p.end_date)}` : ' — Present'}</span>}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                {p.github_url && <a href={p.github_url} target="_blank" rel="noopener noreferrer" style={{ color: '#555' }}><Github size={15}/></a>}
                {p.demo_url && <a href={p.demo_url} target="_blank" rel="noopener noreferrer" style={{ color: G }}><ExternalLink size={15}/></a>}
                {p.paper_url && <a href={p.paper_url} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontSize: 12 }}>📄 Paper</a>}
              </div>
              {p.collaborators?.length > 0 && <div style={{ marginTop: 6, fontSize: 11, color: '#999' }}>with {p.collaborators.join(', ')}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Certifications Tab */}
      {tab === 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 16 }}>
          {certifications.length === 0 && <p style={{ color: '#888' }}>No certifications yet. Add your courses, awards, and competitions!</p>}
          {certifications.map(c => (
            <div key={c.id} style={{ ...card, padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{c.title}</h3>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Edit3 size={15} style={{ cursor: 'pointer', color: '#888' }} onClick={() => openEdit('certification', c)}/>
                  <Trash2 size={15} style={{ cursor: 'pointer', color: '#ccc' }} onClick={() => handleDelete('certification', c.id)}/>
                </div>
              </div>
              {c.provider && <p style={{ margin: '4px 0 0', fontSize: 13, color: '#888' }}>{c.provider}</p>}
              <span style={{ display: 'inline-block', marginTop: 6, fontSize: 11, padding: '2px 8px', borderRadius: 20, background: (TYPE_COLORS[c.cert_type] || '#888') + '18', color: TYPE_COLORS[c.cert_type] || '#888', fontWeight: 600 }}>{c.cert_type}</span>
              {c.skills_gained?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                  {c.skills_gained.map((s, i) => <span key={i} style={{ fontSize: 11, padding: '1px 7px', borderRadius: 12, background: '#f0f0f0', color: '#555' }}>{s}</span>)}
                </div>
              )}
              <div style={{ display: 'flex', gap: 12, marginTop: 10, fontSize: 12, color: '#888' }}>
                {c.completion_date && <span>Completed {fmtDate(c.completion_date)}</span>}
                {c.expiry_date && <span style={{ color: new Date(c.expiry_date) < new Date() ? '#dc2626' : '#888' }}>Expires {fmtDate(c.expiry_date)}</span>}
              </div>
              {c.credential_url && <a href={c.credential_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8, fontSize: 12, color: G, fontWeight: 600 }}><ExternalLink size={12}/> View Credential</a>}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ ...card, padding: 28, width: 480, maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>{editId ? 'Edit' : 'New'} {modal === 'project' ? 'Project' : 'Certification'}</h2>
              <X size={20} style={{ cursor: 'pointer' }} onClick={() => { setModal(null); setEditId(null); }}/>
            </div>
            {modal === 'project' && <>
              <Inp label="Title *" value={form.title || ''} onChange={v => setForm(f => ({ ...f, title: v }))}/>
              <Inp label="Description" value={form.description || ''} onChange={v => setForm(f => ({ ...f, description: v }))} multiline/>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Sel label="Type" value={form.project_type || 'research'} options={PROJECT_TYPES} onChange={v => setForm(f => ({ ...f, project_type: v }))}/>
                <Sel label="Status" value={form.status || 'in_progress'} options={PROJECT_STATUSES} onChange={v => setForm(f => ({ ...f, status: v }))}/>
              </div>
              <Inp label="Tech Stack" placeholder="Python, React, TensorFlow" value={form.tech_stack || ''} onChange={v => setForm(f => ({ ...f, tech_stack: v }))}/>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Inp label="Start Date" type="date" value={form.start_date?.substring(0,10) || ''} onChange={v => setForm(f => ({ ...f, start_date: v }))}/>
                <Inp label="End Date" type="date" value={form.end_date?.substring(0,10) || ''} onChange={v => setForm(f => ({ ...f, end_date: v }))}/>
              </div>
              <Inp label="GitHub URL" value={form.github_url || ''} onChange={v => setForm(f => ({ ...f, github_url: v }))}/>
              <Inp label="Demo URL" value={form.demo_url || ''} onChange={v => setForm(f => ({ ...f, demo_url: v }))}/>
              <Inp label="Paper URL" value={form.paper_url || ''} onChange={v => setForm(f => ({ ...f, paper_url: v }))}/>
              <Inp label="Collaborators" placeholder="Name 1, Name 2" value={form.collaborators || ''} onChange={v => setForm(f => ({ ...f, collaborators: v }))}/>
              <Inp label="Awards Won" value={form.awards_won || ''} onChange={v => setForm(f => ({ ...f, awards_won: v }))}/>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', marginTop: 8 }}>
                <input type="checkbox" checked={form.is_featured || false} onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))}/>
                <Star size={14} color={G}/> Feature this project
              </label>
            </>}
            {modal === 'certification' && <>
              <Inp label="Title *" value={form.title || ''} onChange={v => setForm(f => ({ ...f, title: v }))}/>
              <Inp label="Provider" placeholder="Coursera, AWS, IIT Bombay" value={form.provider || ''} onChange={v => setForm(f => ({ ...f, provider: v }))}/>
              <Sel label="Type" value={form.cert_type || 'certification'} options={CERT_TYPES} onChange={v => setForm(f => ({ ...f, cert_type: v }))}/>
              <Inp label="Credential URL" value={form.credential_url || ''} onChange={v => setForm(f => ({ ...f, credential_url: v }))}/>
              <Inp label="Skills Gained" placeholder="Python, AWS, TensorFlow" value={form.skills_gained || ''} onChange={v => setForm(f => ({ ...f, skills_gained: v }))}/>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Inp label="Completion Date" type="date" value={form.completion_date?.substring(0,10) || ''} onChange={v => setForm(f => ({ ...f, completion_date: v }))}/>
                <Inp label="Expiry Date" type="date" value={form.expiry_date?.substring(0,10) || ''} onChange={v => setForm(f => ({ ...f, expiry_date: v }))}/>
              </div>
            </>}
            <button onClick={handleSave} style={{ marginTop: 16, width: '100%', padding: 10, background: G, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
              {editId ? 'Update' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
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
        {options.map(o => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
      </select>
    </div>
  );
}
