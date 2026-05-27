import { useState, useEffect } from 'react';
import { labEnhAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { BookOpen, Plus, X, ExternalLink, Trash2 } from 'lucide-react';

const G = '#D5AA5B';
const card = { background: '#fff', border: '1px solid #eee', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' };

export default function LabPublications() {
  const [pubs, setPubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ title: '', authors: '', journal: '', published_date: '', doi_url: '', abstract: '' });

  const load = async () => {
    setLoading(true);
    try {
      const res = await labEnhAPI.listPublications();
      setPubs(res.data?.publications || res.data || []);
    } catch { toast.error('Failed to load publications'); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.title) { toast.error('Title is required'); return; }
    try {
      await labEnhAPI.createPublication(form);
      toast.success('Publication added');
      setModal(false); setForm({ title: '', authors: '', journal: '', published_date: '', doi_url: '', abstract: '' }); load();
    } catch { toast.error('Create failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this publication?')) return;
    try { await labEnhAPI.deletePublication(id); toast.success('Deleted'); load(); } catch { toast.error('Delete failed'); }
  };

  const fmtDate = (d) => {
    if (!d) return '';
    try { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return d; }
  };

  if (loading) return <div style={{ padding: 32, textAlign: 'center', color: '#888' }}>Loading…</div>;

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <span id="tour-page-lab-publications-header" />
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Publications</h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: '#888' }}>{pubs.length} publication{pubs.length !== 1 && 's'} on record</p>
        </div>
        <button id="tour-page-lab-publications-add" onClick={() => setModal(true)}
          style={{ background: G, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
          <Plus size={16}/> Add Publication
        </button>
      </div>

      {/* Publications List */}
      {pubs.length === 0 && (
        <div style={{ textAlign: 'center', marginTop: 60, color: '#888' }}>
          <BookOpen size={48} color="#ddd"/>
          <p style={{ marginTop: 12 }}>No publications yet. Add your first research paper or article.</p>
        </div>
      )}
      {pubs.map(p => (
        <div key={p.id} style={{ ...card, padding: 18, marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, lineHeight: 1.3 }}>{p.title}</h3>
              {p.authors && <p style={{ margin: '4px 0 0', fontSize: 13, color: '#666' }}>{p.authors}</p>}
              <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 13, color: '#888', flexWrap: 'wrap' }}>
                {p.journal && <span style={{ fontStyle: 'italic' }}>{p.journal}</span>}
                {p.published_date && <span>{fmtDate(p.published_date)}</span>}
              </div>
              {p.abstract && <p style={{ margin: '8px 0 0', fontSize: 13, color: '#555', lineHeight: 1.5 }}>{p.abstract.substring(0, 200)}{p.abstract.length > 200 && '…'}</p>}
            </div>
            <div style={{ display: 'flex', gap: 8, marginLeft: 12, flexShrink: 0 }}>
              {p.doi_url && (
                <a href={p.doi_url} target="_blank" rel="noopener noreferrer"
                  style={{ color: G, display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, textDecoration: 'none' }}>
                  <ExternalLink size={14}/> DOI
                </a>
              )}
              <Trash2 size={16} color="#ccc" style={{ cursor: 'pointer' }} onClick={() => handleDelete(p.id)}/>
            </div>
          </div>
        </div>
      ))}

      {/* Create Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ ...card, padding: 28, width: 460, maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>Add Publication</h2>
              <X size={20} style={{ cursor: 'pointer' }} onClick={() => setModal(false)}/>
            </div>
            <Inp label="Title *" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))}/>
            <Inp label="Authors" placeholder="e.g. Sharma V., Patel R." value={form.authors} onChange={v => setForm(f => ({ ...f, authors: v }))}/>
            <Inp label="Journal / Conference" value={form.journal} onChange={v => setForm(f => ({ ...f, journal: v }))}/>
            <Inp label="Published Date" type="date" value={form.published_date} onChange={v => setForm(f => ({ ...f, published_date: v }))}/>
            <Inp label="DOI URL" placeholder="https://doi.org/..." value={form.doi_url} onChange={v => setForm(f => ({ ...f, doi_url: v }))}/>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Abstract</label>
              <textarea value={form.abstract} onChange={e => setForm(f => ({ ...f, abstract: e.target.value }))} rows={4}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8, fontSize: 16, boxSizing: 'border-box', resize: 'vertical' }}/>
            </div>
            <button onClick={handleCreate} style={{ marginTop: 8, width: '100%', padding: 10, background: G, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
              Add Publication
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
