import { useState, useEffect, useRef } from 'react';
import { corporateAPI } from '../../services/api';
import {
  Target, Plus, ChevronLeft, Clock, CheckCircle, XCircle,
  Users, Loader2, Calendar, DollarSign, AlertCircle, Star,
  MapPin, FileText, HelpCircle, Trash2, ChevronDown, ChevronUp,
  X, Search, Download,
} from 'lucide-react';
import toast from 'react-hot-toast';

const G = '#D5AA5B';
const card = { background: '#fff', border: '1px solid #eee', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' };

// ── Searchable Multi-Select Dropdown ──────────────────────────
function TagDropdown({ label, options, selected, onChange, colorScheme = { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' } }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = options.filter(o => {
    const name = typeof o === 'string' ? o : o.name;
    return name.toLowerCase().includes(query.toLowerCase());
  });

  const toggle = (val) => {
    onChange(selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val]);
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: '#555', marginBottom: 4, display: 'block' }}>{label}</label>
      {/* Selected pills + input */}
      <div onClick={() => setOpen(true)}
        style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '6px 10px', minHeight: 38, border: `1px solid ${open ? G : '#e5e7eb'}`, borderRadius: 10, background: '#f9fafb', cursor: 'text', alignItems: 'center', transition: 'border-color 0.15s' }}>
        {selected.map(val => (
          <span key={val} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, padding: '2px 8px', borderRadius: 6, background: colorScheme.bg, color: colorScheme.color, fontWeight: 500 }}>
            {val}
            <X size={10} style={{ cursor: 'pointer', opacity: 0.7 }} onClick={e => { e.stopPropagation(); toggle(val); }} />
          </span>
        ))}
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={selected.length === 0 ? `Search ${label.toLowerCase()}...` : ''}
          style={{ flex: 1, minWidth: 80, border: 'none', outline: 'none', background: 'transparent', fontSize: 12, padding: '2px 0' }}
        />
        <ChevronDown size={13} style={{ color: '#aaa', flexShrink: 0 }} />
      </div>
      {/* Dropdown */}
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, marginTop: 4, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.10)', maxHeight: 220, overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '12px 14px', fontSize: 12, color: '#999', textAlign: 'center' }}>No matches found</div>
          ) : (
            filtered.map(o => {
              const name = typeof o === 'string' ? o : o.name;
              const sub = typeof o === 'object' && o.level > 0;
              const isSelected = selected.includes(name);
              return (
                <div key={name} onClick={() => { toggle(name); setQuery(''); }}
                  style={{ padding: '8px 14px', paddingLeft: sub ? 28 : 14, fontSize: 12, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isSelected ? colorScheme.bg : 'transparent', color: isSelected ? colorScheme.color : '#333', fontWeight: isSelected ? 600 : 400 }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#f9fafb'; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}>
                  <span>{sub ? '↳ ' : ''}{name}</span>
                  {isSelected && <CheckCircle size={12} />}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

const STATUS_STYLE = {
  draft:     { bg: '#f3f4f6', color: '#6b7280', label: 'Draft' },
  open:      { bg: '#eff6ff', color: '#2563eb', label: 'Open' },
  reviewing: { bg: '#fefce8', color: '#ca8a04', label: 'Reviewing' },
  closed:    { bg: '#f3f4f6', color: '#6b7280', label: 'Closed' },
  awarded:   { bg: '#f0fdf4', color: '#16a34a', label: 'Awarded' },
};

const APP_STATUS = {
  applied:     { bg: '#eff6ff', color: '#2563eb', label: 'Applied' },
  shortlisted: { bg: '#fefce8', color: '#ca8a04', label: 'Shortlisted' },
  evaluating:  { bg: '#faf5ff', color: '#7c3aed', label: 'Evaluating' },
  selected:    { bg: '#f0fdf4', color: '#16a34a', label: 'Selected' },
  rejected:    { bg: '#fef2f2', color: '#dc2626', label: 'Rejected' },
};

export default function CorporateChallenges() {
  const [challenges, setChallenges] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', budget_range: '', timeline: '', deadline: '', sectors: [], functions: [], technologies: [], usecases: [], requirements: '', problem_statement: '', location: '', min_profile_pct: 25, data_room_required: false, rfi_questions: [], faqs: [], status: 'open', visibility: 'public', challenge_type: 'partner' });
  const [saving, setSaving] = useState(false);
  const [taxonomy, setTaxonomy] = useState({ sectors: [], functions: [], technologies: [], usecases: [] });
  const [editMode, setEditMode] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(null);
  // Phase 9: Templates, Filters, Recommendations
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [templates, setTemplates] = useState({ builtin: [], saved: [] });
  const [filters, setFilters] = useState({ status: 'all', sector: '', search: '', sort: 'newest' });
  const [recommendedStartups, setRecommendedStartups] = useState([]);

  useEffect(() => { load(); loadTaxonomy(); }, []);
  useEffect(() => { load(); }, [filters]);

  const load = async () => {
    try {
      const params = {};
      if (filters.status !== 'all') params.status = filters.status;
      if (filters.sector) params.sector = filters.sector;
      if (filters.search) params.search = filters.search;
      if (filters.sort) params.sort = filters.sort;
      const d = await corporateAPI.listChallenges(params);
      setChallenges(d);
    } catch { toast.error('Failed to load challenges'); }
    finally { setLoading(false); }
  };

  const loadTaxonomy = async () => {
    try { const d = await corporateAPI.getTaxonomy(); setTaxonomy(d); } catch {}
  };

  const loadTemplates = async () => {
    try { const d = await corporateAPI.listTemplates(); setTemplates(d); } catch {}
  };

  const loadRecommendations = async (id) => {
    try { const d = await corporateAPI.challengeRecs(id); setRecommendedStartups(d); } catch {}
  };

  const loadDetail = async (id) => {
    try {
      const d = await corporateAPI.getChallenge(id); setDetail(d); setSelected(id);
      if (d.challenge?.status === 'open') loadRecommendations(id);
      else setRecommendedStartups([]);
    } catch { toast.error('Failed to load challenge'); }
  };

  const create = async () => {
    if (!form.title.trim()) return toast.error('Title is required');
    setSaving(true);
    try {
      await corporateAPI.createChallenge(form);
      toast.success('Challenge created');
      setShowCreate(false);
      setForm({ title: '', description: '', budget_range: '', timeline: '', deadline: '', sectors: [], functions: [], technologies: [], usecases: [], requirements: '', problem_statement: '', location: '', min_profile_pct: 25, data_room_required: false, rfi_questions: [], faqs: [], status: 'open' });
      load();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const updateAppStatus = async (appId, status) => {
    try {
      await corporateAPI.updateApplication(selected, appId, { status });
      toast.success(`Application ${status}`);
      loadDetail(selected);
    } catch (err) { toast.error(err.message); }
  };

  const startEdit = () => {
    const rfi = (() => { try { return typeof detail.rfi_questions === 'string' ? JSON.parse(detail.rfi_questions) : (detail.rfi_questions || []); } catch { return []; } })();
    const fq = (() => { try { return typeof detail.faqs === 'string' ? JSON.parse(detail.faqs) : (detail.faqs || []); } catch { return []; } })();
    setForm({
      title: detail.title || '', description: detail.description || '', budget_range: detail.budget_range || '',
      timeline: detail.timeline || '', deadline: detail.deadline ? detail.deadline.split('T')[0] : '',
      sectors: detail.sectors || [], functions: detail.functions || [], technologies: detail.technologies || [],
      usecases: detail.usecases || [], requirements: detail.requirements || '',
      problem_statement: detail.problem_statement || '', location: detail.location || '',
      min_profile_pct: detail.min_profile_pct || 25, data_room_required: detail.data_room_required || false,
      rfi_questions: rfi, faqs: fq, status: detail.status || 'open',
    });
    setEditMode(true);
    setShowCreate(true);
  };

  const updateChallenge = async () => {
    if (!form.title.trim()) return toast.error('Title is required');
    setSaving(true);
    try {
      await corporateAPI.updateChallenge(selected, form);
      toast.success('Challenge updated');
      setShowCreate(false);
      setEditMode(false);
      loadDetail(selected);
      load();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const changeStatus = async (newStatus) => {
    try {
      await corporateAPI.updateChallenge(selected, { status: newStatus });
      toast.success(`Status changed to ${newStatus}`);
      loadDetail(selected);
      load();
    } catch (err) { toast.error(err.message); }
  };

  const toggleTag = (field, val) => {
    setForm(p => ({
      ...p,
      [field]: p[field].includes(val) ? p[field].filter(v => v !== val) : [...p[field], val],
    }));
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Loader2 size={28} className="animate-spin" style={{ color: G }} /></div>;

  // Detail view
  if (selected && detail) {
    const st = STATUS_STYLE[detail.status] || STATUS_STYLE.open;
    const rfiQuestions = (() => { try { return typeof detail.rfi_questions === 'string' ? JSON.parse(detail.rfi_questions) : (detail.rfi_questions || []); } catch { return []; } })();
    const faqs = (() => { try { return typeof detail.faqs === 'string' ? JSON.parse(detail.faqs) : (detail.faqs || []); } catch { return []; } })();

    return (
      <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
        <button onClick={() => { setSelected(null); setDetail(null); }} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#888', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 16 }}>
          <ChevronLeft size={16} /> Back to Challenges
        </button>

        {/* Header card */}
        <div style={{ ...card, padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', margin: 0, flex: 1 }}>{detail.title}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <select value={detail.status} onChange={e => changeStatus(e.target.value)}
                style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: st.bg, color: st.color, border: `1px solid ${st.color}30`, cursor: 'pointer', outline: 'none' }}>
                {Object.entries(STATUS_STYLE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <button onClick={async () => {
                try {
                  const blob = await corporateAPI.exportChallengePdf(detail.id);
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a'); a.href = url; a.download = `Challenge-${detail.id}.pdf`;
                  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
                  toast.success('PDF downloaded');
                } catch (err) { toast.error('Failed to export PDF'); }
              }}
                style={{ fontSize: 11, fontWeight: 600, padding: '5px 14px', borderRadius: 8, background: '#fff', color: '#555', border: '1px solid #ddd', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Download size={12} /> Export PDF
              </button>
              <button onClick={startEdit}
                style={{ fontSize: 11, fontWeight: 600, padding: '5px 14px', borderRadius: 8, background: '#fff', color: G, border: `1px solid ${G}`, cursor: 'pointer' }}>
                Edit
              </button>
              {/* Share buttons */}
              <button onClick={() => {
                const url = detail.visibility === 'private' && detail.share_token
                  ? `${window.location.origin}/challenges/share/${detail.share_token}`
                  : `${window.location.origin}/marketplace`;
                navigator.clipboard.writeText(url); toast.success('Link copied!');
              }} style={{ fontSize: 11, fontWeight: 600, padding: '5px 10px', borderRadius: 8, background: '#fff', color: '#555', border: '1px solid #ddd', cursor: 'pointer' }} title="Copy link">
                Link
              </button>
              <button onClick={() => {
                const url = detail.visibility === 'private' && detail.share_token
                  ? `${window.location.origin}/challenges/share/${detail.share_token}`
                  : `${window.location.origin}/marketplace`;
                window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
              }} style={{ fontSize: 11, padding: '5px 8px', borderRadius: 8, background: '#0a66c2', color: '#fff', border: 'none', cursor: 'pointer' }}>
                in
              </button>
              <button onClick={() => {
                const url = detail.visibility === 'private' && detail.share_token
                  ? `${window.location.origin}/challenges/share/${detail.share_token}`
                  : `${window.location.origin}/marketplace`;
                window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(detail.title)}`, '_blank');
              }} style={{ fontSize: 11, padding: '5px 8px', borderRadius: 8, background: '#1a1a1a', color: '#fff', border: 'none', cursor: 'pointer' }}>
                X
              </button>
            </div>
          </div>
          {/* Type + Visibility badges */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            {detail.challenge_type && (
              <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                background: detail.challenge_type === 'partner' ? '#f0fdf4' : detail.challenge_type === 'source' ? '#eff6ff' : '#fefce8',
                color: detail.challenge_type === 'partner' ? '#16a34a' : detail.challenge_type === 'source' ? '#2563eb' : '#f59e0b' }}>
                {detail.challenge_type === 'partner' ? 'Partner' : detail.challenge_type === 'source' ? 'Source' : 'Invest'}
              </span>
            )}
            <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
              background: detail.visibility === 'private' ? '#fef2f2' : '#f0fdf4',
              color: detail.visibility === 'private' ? '#dc2626' : '#16a34a' }}>
              {detail.visibility === 'private' ? 'Private' : 'Public'}
            </span>
          </div>
          {detail.description && <p style={{ fontSize: 13, color: '#555', lineHeight: 1.6, marginBottom: 12 }}>{detail.description}</p>}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 12, color: '#666', marginBottom: 12 }}>
            {detail.budget_range && <span><DollarSign size={12} style={{ verticalAlign: -2 }} /> {detail.budget_range}</span>}
            {detail.timeline && <span><Clock size={12} style={{ verticalAlign: -2 }} /> {detail.timeline}</span>}
            {detail.deadline && <span><Calendar size={12} style={{ verticalAlign: -2 }} /> Deadline: {new Date(detail.deadline).toLocaleDateString()}</span>}
            {detail.location && <span><MapPin size={12} style={{ verticalAlign: -2 }} /> {detail.location}</span>}
          </div>
          {/* Settings summary */}
          <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#999', marginBottom: 12 }}>
            <span>Min profile: {detail.min_profile_pct || 25}%</span>
            <span>Data room: {detail.data_room_required ? 'Required' : 'Optional'}</span>
            {detail.published_at && <span>Published: {new Date(detail.published_at).toLocaleDateString()}</span>}
          </div>
          {/* Tags */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {(detail.sectors || []).map(t => <span key={t} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: '#eff6ff', color: '#2563eb' }}>{t}</span>)}
            {(detail.technologies || []).map(t => <span key={t} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: '#fefce8', color: '#ca8a04' }}>{t}</span>)}
            {(detail.usecases || []).map(t => <span key={t} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: '#f0fdf4', color: '#16a34a' }}>{t}</span>)}
            {(detail.functions || []).map(t => <span key={t} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: '#faf5ff', color: '#7c3aed' }}>{t}</span>)}
          </div>
        </div>

        {/* Problem Statement */}
        {detail.problem_statement && (
          <div style={{ ...card, padding: 20, marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 10 }}>
              <FileText size={14} style={{ verticalAlign: -2, marginRight: 6 }} />Problem Statement
            </h3>
            <p style={{ fontSize: 13, color: '#555', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{detail.problem_statement}</p>
          </div>
        )}

        {/* Requirements */}
        {detail.requirements && (
          <div style={{ ...card, padding: 20, marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 10 }}>
              <AlertCircle size={14} style={{ verticalAlign: -2, marginRight: 6 }} />Requirements
            </h3>
            <p style={{ fontSize: 13, color: '#555', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{detail.requirements}</p>
          </div>
        )}

        {/* RFI Questions */}
        {rfiQuestions.length > 0 && (
          <div style={{ ...card, padding: 20, marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 }}>
              <FileText size={14} style={{ verticalAlign: -2, marginRight: 6 }} />RFI Questions ({rfiQuestions.length})
            </h3>
            <div style={{ display: 'grid', gap: 10 }}>
              {rfiQuestions.map((q, i) => (
                <div key={q.id || i} style={{ border: '1px solid #f0f0f0', borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#333', marginBottom: 4 }}>
                    {i + 1}. {q.question}
                    <span style={{ fontSize: 10, color: '#999', marginLeft: 8, fontWeight: 400 }}>({q.type === 'mcq' ? 'Multiple Choice' : 'Text Answer'})</span>
                  </div>
                  {q.type === 'mcq' && (q.options || []).length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                      {q.options.map(opt => (
                        <span key={opt} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, background: '#f9fafb', border: '1px solid #e5e7eb', color: '#666' }}>{opt}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FAQs — Accordion */}
        {faqs.length > 0 && (
          <div style={{ ...card, padding: 20, marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 }}>
              <HelpCircle size={14} style={{ verticalAlign: -2, marginRight: 6 }} />Frequently Asked Questions ({faqs.length})
            </h3>
            <div style={{ display: 'grid', gap: 8 }}>
              {faqs.map((faq, i) => (
                <div key={i} style={{ border: '1px solid #f0f0f0', borderRadius: 10, overflow: 'hidden' }}>
                  <button onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                    style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#fafafa', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>{faq.question}</span>
                    {expandedFaq === i ? <ChevronUp size={14} color="#999" /> : <ChevronDown size={14} color="#999" />}
                  </button>
                  {expandedFaq === i && (
                    <div style={{ padding: '12px 14px', fontSize: 13, color: '#555', lineHeight: 1.6 }}>{faq.answer}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Applications */}
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 }}>
          <Users size={15} style={{ verticalAlign: -3, marginRight: 6 }} />Applications ({(detail.applications || []).length})
        </h3>
        {(detail.applications || []).length === 0 ? (
          <div style={{ ...card, padding: 30, textAlign: 'center', color: '#999', fontSize: 13 }}>No applications yet</div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {(detail.applications || []).map(app => {
              const as = APP_STATUS[app.status] || APP_STATUS.applied;
              const appRfiAnswers = (() => { try { return typeof app.rfi_answers === 'string' ? JSON.parse(app.rfi_answers) : (app.rfi_answers || {}); } catch { return {}; } })();
              const appDataRoom = (() => { try { return typeof app.data_room === 'string' ? JSON.parse(app.data_room) : (app.data_room || []); } catch { return []; } })();

              return (
                <div key={app.id} style={{ ...card, padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>{app.startup_name || app.applicant_name}</div>
                      <div style={{ fontSize: 11, color: '#888' }}>
                        {app.applicant_email} {app.sector ? `| ${app.sector}` : ''} {app.stage ? `| ${app.stage}` : ''}
                        {app.profile_pct != null && <span style={{ marginLeft: 8, color: '#16a34a' }}>Profile: {app.profile_pct}%</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: as.bg, color: as.color }}>{as.label}</span>
                      {/* Star Rating */}
                      <div style={{ display: 'flex', gap: 1 }}>
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} size={14} fill={s <= (app.rating || 0) ? '#f59e0b' : 'none'} style={{ color: s <= (app.rating || 0) ? '#f59e0b' : '#ddd', cursor: 'pointer' }}
                            onClick={() => corporateAPI.updateApplication(detail.id, app.id, { rating: s }).then(() => { loadDetail(detail.id); toast.success('Rating saved'); })} />
                        ))}
                      </div>
                    </div>
                  </div>
                  {app.pitch && <p style={{ fontSize: 12, color: '#555', marginBottom: 8, lineHeight: 1.5 }}>{app.pitch}</p>}
                  {app.proposal_url && (
                    <div style={{ fontSize: 11, marginBottom: 8 }}>
                      <span style={{ color: '#888' }}>Proposal: </span>
                      <a href={app.proposal_url} target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}>{app.proposal_url}</a>
                    </div>
                  )}

                  {/* RFI Answers */}
                  {Object.keys(appRfiAnswers).length > 0 && rfiQuestions.length > 0 && (
                    <div style={{ marginBottom: 8, border: '1px solid #f0f0f0', borderRadius: 8, padding: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#333', marginBottom: 6 }}>RFI Answers</div>
                      {rfiQuestions.map(q => (
                        appRfiAnswers[q.id] ? (
                          <div key={q.id} style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>
                            <span style={{ fontWeight: 600 }}>{q.question}:</span> {appRfiAnswers[q.id]}
                          </div>
                        ) : null
                      ))}
                    </div>
                  )}

                  {/* Data Room */}
                  {appDataRoom.length > 0 && (
                    <div style={{ marginBottom: 8, border: '1px solid #f0f0f0', borderRadius: 8, padding: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#333', marginBottom: 6 }}>Data Room</div>
                      {appDataRoom.map((doc, di) => (
                        <div key={di} style={{ fontSize: 11, marginBottom: 2 }}>
                          <span style={{ color: '#888', textTransform: 'capitalize' }}>{(doc.type || 'file').replace(/_/g, ' ')}:</span>{' '}
                          <a href={doc.url} target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}>{doc.url}</a>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 6 }}>
                    {app.status === 'applied' && (
                      <>
                        <button onClick={() => updateAppStatus(app.id, 'shortlisted')} style={{ padding: '5px 12px', fontSize: 11, fontWeight: 600, borderRadius: 7, background: '#fefce815', color: '#ca8a04', border: '1px solid #fde68a', cursor: 'pointer' }}>
                          <Star size={11} style={{ verticalAlign: -2 }} /> Shortlist
                        </button>
                        <button onClick={() => updateAppStatus(app.id, 'rejected')} style={{ padding: '5px 12px', fontSize: 11, borderRadius: 7, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', cursor: 'pointer' }}>
                          Reject
                        </button>
                      </>
                    )}
                    {app.status === 'shortlisted' && (
                      <button onClick={() => updateAppStatus(app.id, 'selected')} style={{ padding: '5px 12px', fontSize: 11, fontWeight: 600, borderRadius: 7, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', cursor: 'pointer' }}>
                        <CheckCircle size={11} style={{ verticalAlign: -2 }} /> Select
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // List + Create
  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>
          <Target size={20} style={{ verticalAlign: -3, marginRight: 8, color: G }} />Innovation Challenges
        </h1>
        <button onClick={() => { loadTemplates(); setShowTemplatePicker(true); }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 13, fontWeight: 600, borderRadius: 8, background: G, color: '#fff', border: 'none', cursor: 'pointer' }}>
          <Plus size={15} /> New Challenge
        </button>
      </div>

      {/* Template Picker Modal */}
      {showTemplatePicker && (
        <div style={{ ...card, padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>Start from a Template</h3>
            <button onClick={() => setShowTemplatePicker(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}><X size={16} /></button>
          </div>
          {/* Challenge Type Selector */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            {[
              { key: 'partner', label: 'Partner', desc: 'PoC, Pilot, Scale with startups', color: '#16a34a' },
              { key: 'source', label: 'Source', desc: 'Find & procure startup solutions', color: '#2563eb' },
              { key: 'invest', label: 'Invest', desc: 'Evaluate startups for investment', color: '#f59e0b' },
            ].map(t => (
              <button key={t.key} onClick={() => setForm(f => ({ ...f, challenge_type: t.key }))}
                style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: `2px solid ${form.challenge_type === t.key ? t.color : '#eee'}`, background: form.challenge_type === t.key ? `${t.color}08` : '#fff', cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: form.challenge_type === t.key ? t.color : '#333' }}>{t.label}</div>
                <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>{t.desc}</div>
              </button>
            ))}
          </div>
          {/* Template Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10, marginBottom: 10 }}>
            {/* Blank */}
            <div onClick={() => { setForm(f => ({ ...f, title: '', description: '', problem_statement: '', sectors: [], technologies: [], usecases: [], budget_range: '', timeline: '' })); setShowTemplatePicker(false); setShowCreate(true); setEditMode(false); }}
              style={{ ...card, padding: 14, cursor: 'pointer', textAlign: 'center', border: `2px dashed #ddd` }}
              onMouseEnter={e => e.currentTarget.style.borderColor = G} onMouseLeave={e => e.currentTarget.style.borderColor = '#ddd'}>
              <Plus size={20} style={{ color: '#ccc', margin: '8px auto' }} />
              <div style={{ fontSize: 12, fontWeight: 600, color: '#666' }}>Blank Challenge</div>
              <div style={{ fontSize: 10, color: '#aaa' }}>Start from scratch</div>
            </div>
            {/* Built-in */}
            {(templates.builtin || []).map(t => (
              <div key={t.id} onClick={() => { setForm(f => ({ ...f, ...t.template_data })); setShowTemplatePicker(false); setShowCreate(true); setEditMode(false); }}
                style={{ ...card, padding: 14, cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = G} onMouseLeave={e => e.currentTarget.style.borderColor = '#eee'}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#333', marginBottom: 4 }}>{t.name}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                  {(t.template_data?.sectors || []).slice(0, 2).map(s => <span key={s} style={{ fontSize: 9, padding: '1px 6px', borderRadius: 10, background: '#eff6ff', color: '#2563eb' }}>{s}</span>)}
                </div>
              </div>
            ))}
            {/* Saved */}
            {(templates.saved || []).map(t => {
              const td = typeof t.template_data === 'string' ? JSON.parse(t.template_data) : (t.template_data || {});
              return (
                <div key={t.id} style={{ ...card, padding: 14, cursor: 'pointer', position: 'relative' }}
                  onClick={() => { setForm(f => ({ ...f, ...td })); setShowTemplatePicker(false); setShowCreate(true); setEditMode(false); }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#8b5cf6'} onMouseLeave={e => e.currentTarget.style.borderColor = '#eee'}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#333', marginBottom: 4 }}>{t.name}</div>
                  <div style={{ fontSize: 9, color: '#8b5cf6', fontWeight: 500 }}>Custom Template</div>
                  <button onClick={async (e) => { e.stopPropagation(); await corporateAPI.deleteTemplate(t.id); loadTemplates(); toast.success('Template deleted'); }}
                    style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#ccc' }}><Trash2 size={12} /></button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter Bar */}
      {!showCreate && !selected && (
        <div style={{ ...card, padding: 12, marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          <div style={{ flex: '1 1 180px' }}>
            <input value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              placeholder="Search challenges..." style={{ width: '100%', padding: '7px 10px', fontSize: 12, border: '1px solid #ddd', borderRadius: 8, outline: 'none' }} />
          </div>
          <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
            style={{ padding: '7px 10px', fontSize: 12, border: '1px solid #ddd', borderRadius: 8, outline: 'none' }}>
            <option value="all">All Status</option>
            {Object.entries(STATUS_STYLE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={filters.sector} onChange={e => setFilters(f => ({ ...f, sector: e.target.value }))}
            style={{ padding: '7px 10px', fontSize: 12, border: '1px solid #ddd', borderRadius: 8, outline: 'none' }}>
            <option value="">All Sectors</option>
            {(taxonomy.sectors || []).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filters.sort} onChange={e => setFilters(f => ({ ...f, sort: e.target.value }))}
            style={{ padding: '7px 10px', fontSize: 12, border: '1px solid #ddd', borderRadius: 8, outline: 'none' }}>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="deadline">By Deadline</option>
            <option value="applications">Most Applications</option>
          </select>
          {(filters.search || filters.status !== 'all' || filters.sector) && (
            <button onClick={() => setFilters({ status: 'all', sector: '', search: '', sort: 'newest' })}
              style={{ fontSize: 11, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Clear</button>
          )}
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <div style={{ ...card, padding: 20, marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 14 }}>{editMode ? 'Edit Challenge' : 'Create Innovation Challenge'}</h3>
          <div style={{ display: 'grid', gap: 12 }}>
            {/* Challenge Type + Visibility */}
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 2 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#555', marginBottom: 4, display: 'block' }}>Challenge Type</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[{ key: 'partner', label: 'Partner', color: '#16a34a' }, { key: 'source', label: 'Source', color: '#2563eb' }, { key: 'invest', label: 'Invest', color: '#f59e0b' }].map(t => (
                    <button key={t.key} type="button" onClick={() => setForm(f => ({ ...f, challenge_type: t.key }))}
                      style={{ flex: 1, padding: '6px 10px', fontSize: 11, fontWeight: 600, borderRadius: 8, border: `1.5px solid ${form.challenge_type === t.key ? t.color : '#eee'}`, background: form.challenge_type === t.key ? `${t.color}10` : '#fff', color: form.challenge_type === t.key ? t.color : '#888', cursor: 'pointer' }}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#555', marginBottom: 4, display: 'block' }}>Visibility</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[{ key: 'public', label: 'Public' }, { key: 'private', label: 'Private' }].map(v => (
                    <button key={v.key} type="button" onClick={() => setForm(f => ({ ...f, visibility: v.key }))}
                      style={{ flex: 1, padding: '6px 10px', fontSize: 11, fontWeight: 600, borderRadius: 8, border: `1.5px solid ${form.visibility === v.key ? G : '#eee'}`, background: form.visibility === v.key ? `${G}10` : '#fff', color: form.visibility === v.key ? G : '#888', cursor: 'pointer' }}>
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {/* Basic info */}
            <input placeholder="Challenge title *" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              style={{ padding: '10px 14px', fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 10, outline: 'none', background: '#f9fafb' }} />
            <textarea placeholder="Short description" rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              style={{ padding: '10px 14px', fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 10, outline: 'none', background: '#f9fafb', resize: 'vertical' }} />
            <textarea placeholder="Detailed problem statement — describe what you need solved, constraints, and expectations..." rows={4} value={form.problem_statement} onChange={e => setForm(p => ({ ...p, problem_statement: e.target.value }))}
              style={{ padding: '10px 14px', fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 10, outline: 'none', background: '#f9fafb', resize: 'vertical' }} />

            {/* Timeline & logistics */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
              <input placeholder="Budget range" value={form.budget_range} onChange={e => setForm(p => ({ ...p, budget_range: e.target.value }))}
                style={{ padding: '10px 14px', fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 10, outline: 'none', background: '#f9fafb' }} />
              <input placeholder="Timeline" value={form.timeline} onChange={e => setForm(p => ({ ...p, timeline: e.target.value }))}
                style={{ padding: '10px 14px', fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 10, outline: 'none', background: '#f9fafb' }} />
              <input type="date" placeholder="Deadline" value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))}
                style={{ padding: '10px 14px', fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 10, outline: 'none', background: '#f9fafb' }} />
              <input placeholder="Location / region" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                style={{ padding: '10px 14px', fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 10, outline: 'none', background: '#f9fafb' }} />
            </div>
            <textarea placeholder="Detailed requirements" rows={2} value={form.requirements} onChange={e => setForm(p => ({ ...p, requirements: e.target.value }))}
              style={{ padding: '10px 14px', fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 10, outline: 'none', background: '#f9fafb', resize: 'vertical' }} />

            {/* Settings row */}
            <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#555' }}>
                <span style={{ fontWeight: 600 }}>Min profile %:</span>
                <input type="number" min={0} max={100} value={form.min_profile_pct} onChange={e => setForm(p => ({ ...p, min_profile_pct: parseInt(e.target.value) || 25 }))}
                  style={{ width: 50, padding: '5px 8px', fontSize: 12, borderRadius: 6, border: '1px solid #e5e7eb', textAlign: 'center' }} />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#555', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.data_room_required} onChange={e => setForm(p => ({ ...p, data_room_required: e.target.checked }))} />
                <span style={{ fontWeight: 600 }}>Require data room uploads</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#555' }}>
                <span style={{ fontWeight: 600 }}>Status:</span>
                <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                  style={{ padding: '5px 8px', fontSize: 12, borderRadius: 6, border: '1px solid #e5e7eb' }}>
                  <option value="draft">Draft</option>
                  <option value="open">Open</option>
                  {editMode && <option value="reviewing">Reviewing</option>}
                  {editMode && <option value="closed">Closed</option>}
                  {editMode && <option value="awarded">Awarded</option>}
                </select>
              </label>
            </div>

            {/* Taxonomy selectors — searchable dropdowns */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <TagDropdown label="Sectors" options={taxonomy.sectors} selected={form.sectors}
                onChange={val => setForm(p => ({ ...p, sectors: val }))}
                colorScheme={{ bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' }} />
              <TagDropdown label="Technologies" options={taxonomy.technologies} selected={form.technologies}
                onChange={val => setForm(p => ({ ...p, technologies: val }))}
                colorScheme={{ bg: '#fefce8', color: '#ca8a04', border: '#fde68a' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <TagDropdown label="Use Cases" options={taxonomy.usecases} selected={form.usecases}
                onChange={val => setForm(p => ({ ...p, usecases: val }))}
                colorScheme={{ bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' }} />
              <TagDropdown label="Functions" options={taxonomy.functions || []} selected={form.functions}
                onChange={val => setForm(p => ({ ...p, functions: val }))}
                colorScheme={{ bg: '#faf5ff', color: '#7c3aed', border: '#ddd6fe' }} />
            </div>

            {/* RFI Question Builder */}
            <div style={{ border: '1px solid #f0f0f0', borderRadius: 10, padding: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#333', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <FileText size={13} />RFI Questions ({form.rfi_questions.length})
              </label>
              {form.rfi_questions.map((q, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
                  <select value={q.type} onChange={e => {
                    const upd = [...form.rfi_questions]; upd[i] = { ...upd[i], type: e.target.value };
                    setForm(p => ({ ...p, rfi_questions: upd }));
                  }} style={{ padding: '6px 8px', fontSize: 11, borderRadius: 6, border: '1px solid #e5e7eb', minWidth: 80 }}>
                    <option value="text">Text</option>
                    <option value="mcq">MCQ</option>
                  </select>
                  <input placeholder="Question" value={q.question} onChange={e => {
                    const upd = [...form.rfi_questions]; upd[i] = { ...upd[i], question: e.target.value };
                    setForm(p => ({ ...p, rfi_questions: upd }));
                  }} style={{ flex: 1, padding: '6px 10px', fontSize: 12, borderRadius: 6, border: '1px solid #e5e7eb', outline: 'none' }} />
                  {q.type === 'mcq' && (
                    <input placeholder="Options (comma separated)" value={(q.options || []).join(', ')} onChange={e => {
                      const upd = [...form.rfi_questions]; upd[i] = { ...upd[i], options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) };
                      setForm(p => ({ ...p, rfi_questions: upd }));
                    }} style={{ flex: 1, padding: '6px 10px', fontSize: 12, borderRadius: 6, border: '1px solid #e5e7eb', outline: 'none' }} />
                  )}
                  <button onClick={() => setForm(p => ({ ...p, rfi_questions: p.rfi_questions.filter((_, j) => j !== i) }))}
                    style={{ padding: '5px', borderRadius: 6, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', cursor: 'pointer' }}><Trash2 size={12} /></button>
                </div>
              ))}
              <button onClick={() => setForm(p => ({ ...p, rfi_questions: [...p.rfi_questions, { id: `rfi_${Date.now()}`, type: 'text', question: '', options: [] }] }))}
                style={{ fontSize: 11, color: G, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>+ Add Question</button>
            </div>

            {/* FAQ Builder */}
            <div style={{ border: '1px solid #f0f0f0', borderRadius: 10, padding: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#333', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <HelpCircle size={13} />FAQs ({form.faqs.length})
              </label>
              {form.faqs.map((faq, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
                  <input placeholder="Question" value={faq.question} onChange={e => {
                    const upd = [...form.faqs]; upd[i] = { ...upd[i], question: e.target.value };
                    setForm(p => ({ ...p, faqs: upd }));
                  }} style={{ flex: 1, padding: '6px 10px', fontSize: 12, borderRadius: 6, border: '1px solid #e5e7eb', outline: 'none' }} />
                  <input placeholder="Answer" value={faq.answer} onChange={e => {
                    const upd = [...form.faqs]; upd[i] = { ...upd[i], answer: e.target.value };
                    setForm(p => ({ ...p, faqs: upd }));
                  }} style={{ flex: 1, padding: '6px 10px', fontSize: 12, borderRadius: 6, border: '1px solid #e5e7eb', outline: 'none' }} />
                  <button onClick={() => setForm(p => ({ ...p, faqs: p.faqs.filter((_, j) => j !== i) }))}
                    style={{ padding: '5px', borderRadius: 6, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', cursor: 'pointer' }}><Trash2 size={12} /></button>
                </div>
              ))}
              <button onClick={() => setForm(p => ({ ...p, faqs: [...p.faqs, { question: '', answer: '' }] }))}
                style={{ fontSize: 11, color: G, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>+ Add FAQ</button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => { setShowCreate(false); setEditMode(false); }} style={{ padding: '8px 16px', fontSize: 13, borderRadius: 8, background: '#f3f4f6', color: '#555', border: 'none', cursor: 'pointer' }}>Cancel</button>
              {!editMode && (
                <button onClick={async () => {
                  const name = prompt('Template name:');
                  if (!name) return;
                  try { await corporateAPI.createTemplate({ name, template_data: form }); toast.success('Template saved!'); } catch { toast.error('Failed to save template'); }
                }} style={{ padding: '8px 16px', fontSize: 13, borderRadius: 8, background: '#f3f4f6', color: '#8b5cf6', border: '1px solid #8b5cf620', cursor: 'pointer' }}>
                  Save as Template
                </button>
              )}
              <button onClick={editMode ? updateChallenge : create} disabled={saving} style={{ padding: '8px 20px', fontSize: 13, fontWeight: 600, borderRadius: 8, background: G, color: '#fff', border: 'none', cursor: 'pointer' }}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : (editMode ? 'Update Challenge' : 'Create Challenge')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Challenge list */}
      {challenges.length === 0 ? (
        <div style={{ ...card, padding: 40, textAlign: 'center' }}>
          <Target size={32} style={{ color: '#ddd', marginBottom: 10 }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: '#888' }}>No challenges yet</p>
          <p style={{ fontSize: 12, color: '#aaa' }}>Launch your first innovation challenge</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {challenges.map(ch => {
            const st = STATUS_STYLE[ch.status] || STATUS_STYLE.open;
            return (
              <div key={ch.id} style={{ ...card, padding: 16, cursor: 'pointer' }}
                onClick={() => loadDetail(ch.id)}
                onMouseEnter={e => e.currentTarget.style.borderColor = G}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#eee'}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', margin: 0 }}>{ch.title}</h3>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    {ch.challenge_type && (
                      <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 7px', borderRadius: 20,
                        background: ch.challenge_type === 'partner' ? '#f0fdf4' : ch.challenge_type === 'source' ? '#eff6ff' : '#fefce8',
                        color: ch.challenge_type === 'partner' ? '#16a34a' : ch.challenge_type === 'source' ? '#2563eb' : '#f59e0b' }}>
                        {ch.challenge_type === 'partner' ? 'Partner' : ch.challenge_type === 'source' ? 'Source' : 'Invest'}
                      </span>
                    )}
                    {ch.visibility === 'private' && <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: '#fef2f2', color: '#dc2626' }}>Private</span>}
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: st.bg, color: st.color }}>{st.label}</span>
                  </div>
                </div>
                {ch.problem_statement && (
                  <p style={{ fontSize: 12, color: '#666', lineHeight: 1.4, margin: '0 0 6px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {ch.problem_statement}
                  </p>
                )}
                <div style={{ display: 'flex', gap: 14, fontSize: 11, color: '#888' }}>
                  <span><Users size={11} style={{ verticalAlign: -2 }} /> {parseInt(ch.application_count) || 0} applications</span>
                  {ch.budget_range && <span><DollarSign size={11} style={{ verticalAlign: -2 }} /> {ch.budget_range}</span>}
                  {ch.deadline && <span><Calendar size={11} style={{ verticalAlign: -2 }} /> {new Date(ch.deadline).toLocaleDateString()}</span>}
                  {ch.location && <span><MapPin size={11} style={{ verticalAlign: -2 }} /> {ch.location}</span>}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                  {(ch.sectors || []).map(t => <span key={t} style={{ fontSize: 9, padding: '2px 7px', borderRadius: 20, background: '#eff6ff', color: '#2563eb' }}>{t}</span>)}
                  {(ch.technologies || []).map(t => <span key={t} style={{ fontSize: 9, padding: '2px 7px', borderRadius: 20, background: '#fefce8', color: '#ca8a04' }}>{t}</span>)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
