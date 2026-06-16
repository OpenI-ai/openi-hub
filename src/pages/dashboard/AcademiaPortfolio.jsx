import { useState, useEffect } from 'react';
import { academiaEnhAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { FlaskConical, BookOpen, DollarSign, Plus, X, Edit3, Trash2, Star, ExternalLink } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

const G = '#D0A848';
const card = { background: '#fff', border: '1px solid #eee', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' };

const TABS = ['Research', 'Publications', 'Grants'];
const PROJECT_TYPES = ['fundamental', 'applied', 'industry_sponsored', 'govt_funded', 'collaborative', 'consultancy', 'other'];
const PROJECT_STATUSES = ['proposed', 'ongoing', 'completed', 'published', 'archived'];
const PUB_TYPES = ['journal', 'conference', 'book_chapter', 'thesis', 'preprint', 'patent', 'technical_report', 'other'];
const GRANT_TYPES = ['government', 'industry', 'foundation', 'internal', 'international', 'other'];
const GRANT_STATUSES = ['applied', 'approved', 'active', 'completed', 'rejected'];

const STATUS_COLORS = { proposed: '#9333ea', ongoing: '#2563eb', completed: '#16a34a', published: '#D0A848', archived: '#6b7280' };
const GRANT_STATUS_COLORS = { applied: '#f59e0b', approved: '#9333ea', active: '#16a34a', completed: '#2563eb', rejected: '#dc2626' };
const PUB_TYPE_COLORS = { journal: '#2563eb', conference: '#16a34a', book_chapter: '#7c3aed', thesis: '#ec4899', preprint: '#f59e0b', patent: '#dc2626', technical_report: '#6b7280', other: '#888' };

export default function AcademiaPortfolio() {
  const [tab, setTab] = useState(0);
  const [projects, setProjects] = useState([]);
  const [publications, setPublications] = useState([]);
  const [grants, setGrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [editId, setEditId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [p, pub, g] = await Promise.all([
        academiaEnhAPI.listProjects(), academiaEnhAPI.listPublications(), academiaEnhAPI.listGrants()
      ]);
      setProjects(p.projects || p.data?.projects || []);
      setPublications(pub.publications || pub.data?.publications || []);
      setGrants(g.grants || g.data?.grants || []);
    } catch { toast.error('Failed to load data'); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openCreate = (type) => { setEditId(null); setForm({}); setModal(type); };
  const openEdit = (type, item) => {
    setEditId(item.id);
    setForm({ ...item,
      domain: item.domain?.join(', ') || '',
      collaborators: item.collaborators?.join(', ') || '',
      authors: item.authors?.join(', ') || '',
      keywords: item.keywords?.join(', ') || '',
      co_investigators: item.co_investigators?.join(', ') || '',
    });
    setModal(type);
  };

  const toArr = (v) => v && typeof v === 'string' ? v.split(',').map(s => s.trim()).filter(Boolean) : v || null;

  const handleSave = async () => {
    try {
      const data = { ...form };
      if (data.domain) data.domain = toArr(data.domain);
      if (data.collaborators) data.collaborators = toArr(data.collaborators);
      if (data.authors) data.authors = toArr(data.authors);
      if (data.keywords) data.keywords = toArr(data.keywords);
      if (data.co_investigators) data.co_investigators = toArr(data.co_investigators);

      if (modal === 'project') {
        editId ? await academiaEnhAPI.updateProject(editId, data) : await academiaEnhAPI.createProject(data);
      } else if (modal === 'publication') {
        editId ? await academiaEnhAPI.updatePublication(editId, data) : await academiaEnhAPI.createPublication(data);
      } else {
        editId ? await academiaEnhAPI.updateGrant(editId, data) : await academiaEnhAPI.createGrant(data);
      }
      toast.success(editId ? 'Updated' : 'Created');
      setModal(null); setForm({}); setEditId(null); load();
    } catch { toast.error('Save failed'); }
  };

  const handleDelete = async (type, id) => {
    if (!confirm('Delete this item?')) return;
    try {
      if (type === 'project') await academiaEnhAPI.deleteProject(id);
      else if (type === 'publication') await academiaEnhAPI.deletePublication(id);
      else await academiaEnhAPI.deleteGrant(id);
      toast.success('Deleted'); load();
    } catch { toast.error('Delete failed'); }
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const fmtAmt = (amt, cur) => amt ? formatCurrency(amt, cur || 'INR', 'full') : '';

  if (loading) return <div style={{ padding: 32, textAlign: 'center', color: '#888' }}>Loading...</div>;

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <div id="tour-page-academia-portfolio-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Academic Portfolio</h1>
        <button id="tour-page-academia-portfolio-add" onClick={() => openCreate(tab === 0 ? 'project' : tab === 1 ? 'publication' : 'grant')}
          style={{ background: G, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
          <Plus size={16} /> {['Add Research', 'Add Publication', 'Add Grant'][tab]}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid #eee' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            style={{ padding: '8px 20px', border: 'none', borderBottom: tab === i ? `3px solid ${G}` : '3px solid transparent', background: 'none', fontWeight: tab === i ? 700 : 400, color: tab === i ? G : '#666', cursor: 'pointer', fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
            {[<FlaskConical key="fc" size={14}/>, <BookOpen key="bo" size={14}/>, <DollarSign key="ds" size={14}/>][i]} {t} <span style={{ fontSize: 12, color: '#999' }}>({[projects.length, publications.length, grants.length][i]})</span>
          </button>
        ))}
      </div>

      {/* Research Projects Tab */}
      {tab === 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: 16 }}>
          {projects.length === 0 && <p style={{ color: '#888' }}>No research projects yet. Add your ongoing and completed research!</p>}
          {projects.map(p => (
            <div key={p.id} style={{ ...card, padding: 18, borderLeft: p.is_featured ? `4px solid ${G}` : undefined }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{p.title}</h3>
                  {p.is_featured && <span style={{ fontSize: 11, color: G, fontWeight: 600 }}>★ Featured</span>}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Edit3 size={15} style={{ cursor: 'pointer', color: '#888' }} onClick={() => openEdit('project', p)}/>
                  <Trash2 size={15} style={{ cursor: 'pointer', color: '#ccc' }} onClick={() => handleDelete('project', p.id)}/>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#f0f0f0', color: '#555', fontWeight: 600 }}>{p.project_type?.replace(/_/g, ' ')}</span>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: (STATUS_COLORS[p.status] || '#888') + '18', color: STATUS_COLORS[p.status] || '#888', fontWeight: 600 }}>{p.status}</span>
              </div>
              {p.description && <p style={{ margin: '8px 0 0', fontSize: 13, color: '#555', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.description}</p>}
              {p.domain?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                  {p.domain.map((d, i) => <span key={i} style={{ fontSize: 11, padding: '1px 7px', borderRadius: 12, background: G + '18', color: G, fontWeight: 500 }}>{d}</span>)}
                </div>
              )}
              {p.funding_amount && <div style={{ marginTop: 8, fontSize: 13, color: '#16a34a', fontWeight: 600 }}>💰 {fmtAmt(p.funding_amount, p.funding_currency)}{p.funding_source ? ` — ${p.funding_source}` : ''}</div>}
              {p.partner_institutions && <div style={{ marginTop: 4, fontSize: 12, color: '#888' }}>🏛 {p.partner_institutions}</div>}
              <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 12, color: '#888' }}>
                {p.start_date && <span>{fmtDate(p.start_date)}{p.end_date ? ` — ${fmtDate(p.end_date)}` : ' — Present'}</span>}
              </div>
              {p.paper_url && <a href={p.paper_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6, fontSize: 12, color: G }}><ExternalLink size={12}/> Paper</a>}
            </div>
          ))}
        </div>
      )}

      {/* Publications Tab */}
      {tab === 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: 16 }}>
          {publications.length === 0 && <p style={{ color: '#888' }}>No publications yet. Add your journal papers, conference proceedings, and preprints!</p>}
          {publications.map(p => (
            <div key={p.id} style={{ ...card, padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, flex: 1 }}>{p.title}</h3>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 8 }}>
                  <Edit3 size={15} style={{ cursor: 'pointer', color: '#888' }} onClick={() => openEdit('publication', p)}/>
                  <Trash2 size={15} style={{ cursor: 'pointer', color: '#ccc' }} onClick={() => handleDelete('publication', p.id)}/>
                </div>
              </div>
              {p.authors?.length > 0 && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#888' }}>{p.authors.join(', ')}</p>}
              <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: (PUB_TYPE_COLORS[p.pub_type] || '#888') + '18', color: PUB_TYPE_COLORS[p.pub_type] || '#888', fontWeight: 600 }}>{p.pub_type?.replace(/_/g, ' ')}</span>
                {p.is_open_access && <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 10, background: '#16a34a18', color: '#16a34a', fontWeight: 600 }}>Open Access</span>}
                {p.citations_count > 0 && <span style={{ fontSize: 11, color: '#888' }}>📖 {p.citations_count} citation{p.citations_count > 1 ? 's' : ''}</span>}
              </div>
              {p.journal_or_venue && <p style={{ margin: '6px 0 0', fontSize: 13, color: '#555', fontStyle: 'italic' }}>{p.journal_or_venue}</p>}
              {p.keywords?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                  {p.keywords.map((k, i) => <span key={i} style={{ fontSize: 10, padding: '1px 6px', borderRadius: 10, background: '#f0f0f0', color: '#666' }}>{k}</span>)}
                </div>
              )}
              {p.publication_date && <div style={{ marginTop: 6, fontSize: 12, color: '#888' }}>{fmtDate(p.publication_date)}</div>}
              <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                {p.doi_url && <a href={p.doi_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: G, fontWeight: 600 }}>DOI</a>}
                {p.paper_url && <a href={p.paper_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#2563eb' }}>PDF</a>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Grants Tab */}
      {tab === 2 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 16 }}>
          {grants.length === 0 && <p style={{ color: '#888' }}>No grants yet. Track your research funding and grant applications!</p>}
          {grants.map(g => (
            <div key={g.id} style={{ ...card, padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{g.title}</h3>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Edit3 size={15} style={{ cursor: 'pointer', color: '#888' }} onClick={() => openEdit('grant', g)}/>
                  <Trash2 size={15} style={{ cursor: 'pointer', color: '#ccc' }} onClick={() => handleDelete('grant', g.id)}/>
                </div>
              </div>
              {g.granting_body && <p style={{ margin: '4px 0 0', fontSize: 13, color: '#888' }}>{g.granting_body}</p>}
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#f0f0f0', color: '#555', fontWeight: 600 }}>{g.grant_type}</span>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: (GRANT_STATUS_COLORS[g.status] || '#888') + '18', color: GRANT_STATUS_COLORS[g.status] || '#888', fontWeight: 600 }}>{g.status}</span>
              </div>
              {g.amount && <div style={{ marginTop: 8, fontSize: 14, fontWeight: 700, color: '#16a34a' }}>{fmtAmt(g.amount, g.currency)}</div>}
              {g.project_title && <div style={{ marginTop: 4, fontSize: 12, color: '#555' }}>Project: {g.project_title}</div>}
              {g.co_investigators?.length > 0 && <div style={{ marginTop: 4, fontSize: 11, color: '#999' }}>Co-PIs: {g.co_investigators.join(', ')}</div>}
              <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 12, color: '#888' }}>
                {g.start_date && <span>{fmtDate(g.start_date)}{g.end_date ? ` — ${fmtDate(g.end_date)}` : ''}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ ...card, padding: 28, width: 500, maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>{editId ? 'Edit' : 'New'} {modal === 'project' ? 'Research Project' : modal === 'publication' ? 'Publication' : 'Grant'}</h2>
              <X size={20} style={{ cursor: 'pointer' }} onClick={() => { setModal(null); setEditId(null); }}/>
            </div>

            {modal === 'project' && <>
              <Inp label="Title *" value={form.title || ''} onChange={v => setForm(f => ({ ...f, title: v }))}/>
              <Inp label="Description" value={form.description || ''} onChange={v => setForm(f => ({ ...f, description: v }))} multiline/>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                <Sel label="Type" value={form.project_type || 'fundamental'} options={PROJECT_TYPES} onChange={v => setForm(f => ({ ...f, project_type: v }))}/>
                <Sel label="Status" value={form.status || 'ongoing'} options={PROJECT_STATUSES} onChange={v => setForm(f => ({ ...f, status: v }))}/>
              </div>
              <Inp label="Domain / Research Areas" placeholder="AI/ML, Drug Discovery, Quantum" value={form.domain || ''} onChange={v => setForm(f => ({ ...f, domain: v }))}/>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                <Inp label="Funding Amount" type="number" value={form.funding_amount || ''} onChange={v => setForm(f => ({ ...f, funding_amount: v }))}/>
                <Sel label="Currency" value={form.funding_currency || 'INR'} options={['INR','USD']} onChange={v => setForm(f => ({ ...f, funding_currency: v }))}/>
              </div>
              <Inp label="Funding Source" placeholder="DST-SERB, ICMR, Industry" value={form.funding_source || ''} onChange={v => setForm(f => ({ ...f, funding_source: v }))}/>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                <Inp label="Start Date" type="date" value={form.start_date?.substring(0,10) || ''} onChange={v => setForm(f => ({ ...f, start_date: v }))}/>
                <Inp label="End Date" type="date" value={form.end_date?.substring(0,10) || ''} onChange={v => setForm(f => ({ ...f, end_date: v }))}/>
              </div>
              <Inp label="Collaborators" placeholder="Dr. Name 1, Dr. Name 2" value={form.collaborators || ''} onChange={v => setForm(f => ({ ...f, collaborators: v }))}/>
              <Inp label="Partner Institutions" value={form.partner_institutions || ''} onChange={v => setForm(f => ({ ...f, partner_institutions: v }))}/>
              <Inp label="Paper URL" value={form.paper_url || ''} onChange={v => setForm(f => ({ ...f, paper_url: v }))}/>
              <Inp label="Outcomes" value={form.outcomes || ''} onChange={v => setForm(f => ({ ...f, outcomes: v }))} multiline/>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', marginTop: 8 }}>
                <input type="checkbox" checked={form.is_featured || false} onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))}/>
                <Star size={14} color={G}/> Feature this project
              </label>
            </>}

            {modal === 'publication' && <>
              <Inp label="Title *" value={form.title || ''} onChange={v => setForm(f => ({ ...f, title: v }))}/>
              <Sel label="Type" value={form.pub_type || 'journal'} options={PUB_TYPES} onChange={v => setForm(f => ({ ...f, pub_type: v }))}/>
              <Inp label="Authors" placeholder="S. Iyer, M. Krishnan, R. Nair" value={form.authors || ''} onChange={v => setForm(f => ({ ...f, authors: v }))}/>
              <Inp label="Journal / Venue" placeholder="Nature Machine Intelligence" value={form.journal_or_venue || ''} onChange={v => setForm(f => ({ ...f, journal_or_venue: v }))}/>
              <Inp label="DOI URL" value={form.doi_url || ''} onChange={v => setForm(f => ({ ...f, doi_url: v }))}/>
              <Inp label="Paper URL" value={form.paper_url || ''} onChange={v => setForm(f => ({ ...f, paper_url: v }))}/>
              <Inp label="Abstract" value={form.abstract || ''} onChange={v => setForm(f => ({ ...f, abstract: v }))} multiline/>
              <Inp label="Keywords" placeholder="GNN, Drug Discovery, Molecular" value={form.keywords || ''} onChange={v => setForm(f => ({ ...f, keywords: v }))}/>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                <Inp label="Publication Date" type="date" value={form.publication_date?.substring(0,10) || ''} onChange={v => setForm(f => ({ ...f, publication_date: v }))}/>
                <Inp label="Citations" type="number" value={form.citations_count || 0} onChange={v => setForm(f => ({ ...f, citations_count: parseInt(v) || 0 }))}/>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', marginTop: 8 }}>
                <input type="checkbox" checked={form.is_open_access || false} onChange={e => setForm(f => ({ ...f, is_open_access: e.target.checked }))}/>
                Open Access
              </label>
            </>}

            {modal === 'grant' && <>
              <Inp label="Grant Title *" value={form.title || ''} onChange={v => setForm(f => ({ ...f, title: v }))}/>
              <Inp label="Granting Body" placeholder="DST, SERB, ICMR, TCS" value={form.granting_body || ''} onChange={v => setForm(f => ({ ...f, granting_body: v }))}/>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                <Sel label="Type" value={form.grant_type || 'government'} options={GRANT_TYPES} onChange={v => setForm(f => ({ ...f, grant_type: v }))}/>
                <Sel label="Status" value={form.status || 'applied'} options={GRANT_STATUSES} onChange={v => setForm(f => ({ ...f, status: v }))}/>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                <Inp label="Amount" type="number" value={form.amount || ''} onChange={v => setForm(f => ({ ...f, amount: v }))}/>
                <Sel label="Currency" value={form.currency || 'INR'} options={['INR','USD']} onChange={v => setForm(f => ({ ...f, currency: v }))}/>
              </div>
              <Inp label="Project Title" value={form.project_title || ''} onChange={v => setForm(f => ({ ...f, project_title: v }))}/>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                <Inp label="Start Date" type="date" value={form.start_date?.substring(0,10) || ''} onChange={v => setForm(f => ({ ...f, start_date: v }))}/>
                <Inp label="End Date" type="date" value={form.end_date?.substring(0,10) || ''} onChange={v => setForm(f => ({ ...f, end_date: v }))}/>
              </div>
              <Inp label="Co-Investigators" placeholder="Dr. Name 1, Dr. Name 2" value={form.co_investigators || ''} onChange={v => setForm(f => ({ ...f, co_investigators: v }))}/>
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
