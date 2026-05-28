import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
// Phase 100: Link + per-persona labels + AuthContext
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getStatusLabel, getActionLabel } from '../../config/applicationStatusLabels';
// T32-99d: meetingAPI for invitee typeahead
import { corporateAPI, meetingAPI, messageAPI } from '../../services/api';
import CollaboratorsPanel from '../../components/CollaboratorsPanel';
import ReviewPanel from '../../components/ReviewPanel';
import {
  Target, Plus, ChevronLeft, Clock, CheckCircle,
  Users, Loader2, Calendar, DollarSign, AlertCircle, Star,
  MapPin, FileText, HelpCircle, Trash2, ChevronDown, ChevronUp,
  X, Download, Sparkles, Brain, BarChart3, Zap, Send, UserPlus,
  MessageCircle,
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
          style={{ flex: 1, minWidth: 80, border: 'none', outline: 'none', background: 'transparent', fontSize: 16, padding: '2px 0' }}
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
  // Phase 120: selected now derived from URL :id param (mobile back-button fix)
  const { id: ccParamId } = useParams();
  const selected = ccParamId ? parseInt(ccParamId, 10) : null;
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
  // Phase 35: Corporate AI Intelligence
  const [aiAdvisorLoading, setAiAdvisorLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [evaluatingAppId, setEvaluatingAppId] = useState(null);
  const [evaluations, setEvaluations] = useState({});
  const [analysisData, setAnalysisData] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  // T32-99d: invite modal state
  const [showInvite, setShowInvite] = useState(false);
  // Bug #2 Side B: Team UI state
  const [showTeam, setShowTeam] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [addMemberEmail, setAddMemberEmail] = useState('');
  const [addMemberRole, setAddMemberRole] = useState('reviewer');
  const [addMemberBusy, setAddMemberBusy] = useState(false);
  const [inviteSearch, setInviteSearch] = useState('');
  const [inviteResults, setInviteResults] = useState([]);
  const [inviteSelected, setInviteSelected] = useState([]);
  // Phase 108: invite by email (non-OpenI users get magic-link signup invite)
  const [inviteEmails, setInviteEmails] = useState([]);
  const [inviteEmailDraft, setInviteEmailDraft] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviteList, setInviteList] = useState([]);
  const [inviteBusy, setInviteBusy] = useState(false);
  const inviteSeqRef = useRef(0);
  // Phase 100: persona for label mapping + investor financial fields gate
  const { user } = useAuth();
  const navigate = useNavigate(); // M2 (27 May 2026) — for Message button conversation deep-link
  const persona = user?.role || 'corporate';

  useEffect(() => { load(); loadTaxonomy(); }, []);

  // Phase C3 (28 May, feedback #4 fix) — ?challenge=<id> deep-link consumer.
  // Routes from ChallengesToReview, email invite acceptance, and other surfaces
  // can deep-link to a specific challenge detail view. Defer one tick so the
  // initial load() finishes and the challenges list is in state before loadDetail.
  const [searchParamsCC] = useSearchParams();
  // Phase 120: Legacy ?challenge=<id> deep-link redirect — convert to /:id path form
  useEffect(() => {
    const challengeParam = searchParamsCC.get('challenge');
    if (challengeParam && !ccParamId) {
      const id = parseInt(challengeParam, 10);
      if (!isNaN(id) && id > 0) {
        navigate(`/dashboard/corporate/challenges/${id}`, { replace: true });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount-only — URL-driven fetch effect below takes over after redirect

  // Phase 120: Fetch detail whenever URL :id changes
  useEffect(() => {
    if (selected && (!detail || detail.id !== selected)) {
      loadDetail(selected);
    } else if (!selected && detail) {
      setDetail(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);
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
    try { const d = await corporateAPI.getTaxonomy(); setTaxonomy(d); } catch (_e) { /* non-fatal */ }
  };

  const loadTemplates = async () => {
    try { const d = await corporateAPI.listTemplates(); setTemplates(d); } catch (_e) { /* non-fatal */ }
  };

  const loadRecommendations = async (id) => {
    try { const d = await corporateAPI.challengeRecs(id); setRecommendedStartups(d); } catch (_e) { /* non-fatal */ }
  };

  const loadDetail = async (id) => {
    // Phase 120: setSelected removed — selected is now derived from URL :id
    try {
      const d = await corporateAPI.getChallenge(id); setDetail(d);
      if (d.challenge?.status === 'open') loadRecommendations(id);
      else setRecommendedStartups([]);
    } catch (err) {
      console.error('[loadDetail] failed:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Failed to load challenge');
    }
  };

  const create = async () => {
    if (!form.title.trim()) return toast.error('Title is required');
    setSaving(true);
    try {
      await corporateAPI.createChallenge(form);
      toast.success('Challenge created');
      setShowCreate(false);
      // T32-99c-hotfix: post-create form reset keeps all fields including visibility + challenge_type
      setForm({ title: '', description: '', budget_range: '', timeline: '', deadline: '', sectors: [], functions: [], technologies: [], usecases: [], requirements: '', problem_statement: '', location: '', min_profile_pct: 25, data_room_required: false, rfi_questions: [], faqs: [], status: 'open', visibility: 'public', challenge_type: 'partner' });
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

  // Phase 35: AI handlers
  const runAiAdvisor = async () => {
    if (!form.title && !form.description) return toast.error('Enter a title or description first');
    setAiAdvisorLoading(true);
    try {
      const data = await corporateAPI.aiAdvisor({ title: form.title, description: form.description, problem_statement: form.problem_statement });
      if (data.ai_available === false) { toast('AI not available — ' + (data.message || '')); return; }
      setAiSuggestions(data);
      toast.success('AI suggestions ready');
    } catch (err) { toast.error(err.message); }
    finally { setAiAdvisorLoading(false); }
  };

  const runAiEvaluate = async (appId) => {
    if (!detail) return;
    setEvaluatingAppId(appId);
    try {
      const data = await corporateAPI.aiEvaluate({ challenge_id: detail.id, application_id: appId });
      if (data.ai_available === false) { toast('AI not available'); return; }
      setEvaluations(prev => ({ ...prev, [appId]: data }));
      toast.success('AI evaluation complete');
    } catch (err) { toast.error(err.message); }
    finally { setEvaluatingAppId(null); }
  };

  const runAiAnalysis = async () => {
    if (!detail) return;
    setAnalysisLoading(true);
    try {
      const data = await corporateAPI.aiAnalyze(detail.id);
      if (data.ai_available === false) { toast('AI not available'); return; }
      setAnalysisData(data);
      setShowAnalysis(true);
      toast.success('AI analysis complete');
    } catch (err) { toast.error(err.message); }
    finally { setAnalysisLoading(false); }
  };

    // Bug #2 Side B: Team UI handlers
  async function loadTeamMembers(challengeId) {
    setTeamLoading(true);
    try {
      const r = await corporateAPI.listMembers(challengeId);
      setTeamMembers(r.members || r || []);
    } catch (e) {
      console.error('[team] listMembers failed:', e);
      toast.error(e?.message || 'Failed to load team members');
    } finally {
      setTeamLoading(false);
    }
  }
  async function addTeamMember(challengeId) {
    const email = addMemberEmail.trim().toLowerCase();
    if (!/\S+@\S+\.\S+/.test(email)) { toast.error('Enter a valid email'); return; }
    setAddMemberBusy(true);
    try {
      await corporateAPI.addMember(challengeId, { email, role: addMemberRole });
      toast.success(`${email} added as ${addMemberRole}`);
      setAddMemberEmail('');
      setAddMemberRole('reviewer');
      await loadTeamMembers(challengeId);
    } catch (e) {
      console.error('[team] addMember failed:', e);
      toast.error(e?.response?.data?.message || e?.message || 'Failed to add member');
    } finally {
      setAddMemberBusy(false);
    }
  }
  async function updateTeamMemberRole(challengeId, userId, role) {
    try {
      await corporateAPI.updateMember(challengeId, userId, { role });
      toast.success('Role updated');
      await loadTeamMembers(challengeId);
    } catch (e) {
      console.error('[team] updateMember failed:', e);
      toast.error(e?.message || 'Failed to update role');
    }
  }
  async function removeTeamMember(challengeId, userId) {
    if (!window.confirm('Remove this member from the team?')) return;
    try {
      await corporateAPI.removeMember(challengeId, userId);
      toast.success('Member removed');
      await loadTeamMembers(challengeId);
    } catch (e) {
      console.error('[team] removeMember failed:', e);
      toast.error(e?.message || 'Failed to remove member');
    }
  }

const startEdit = () => {
    const rfi = (() => { try { return typeof detail.rfi_questions === 'string' ? JSON.parse(detail.rfi_questions) : (detail.rfi_questions || []); } catch { return []; } })();
    const fq = (() => { try { return typeof detail.faqs === 'string' ? JSON.parse(detail.faqs) : (detail.faqs || []); } catch { return []; } })();
    // T32-99c-hotfix: include visibility + challenge_type so Edit doesn't lose them
    setForm({
      title: detail.title || '', description: detail.description || '', budget_range: detail.budget_range || '',
      timeline: detail.timeline || '', deadline: detail.deadline ? detail.deadline.split('T')[0] : '',
      sectors: detail.sectors || [], functions: detail.functions || [], technologies: detail.technologies || [],
      usecases: detail.usecases || [], requirements: detail.requirements || '',
      problem_statement: detail.problem_statement || '', location: detail.location || '',
      min_profile_pct: detail.min_profile_pct || 25, data_room_required: detail.data_room_required || false,
      rfi_questions: rfi, faqs: fq, status: detail.status || 'open',
      visibility: detail.visibility || 'public', challenge_type: detail.challenge_type || 'partner',
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

  const deleteChallenge = async () => {
    if (!detail) return;
    const ok = window.confirm(
      `Delete "${detail.title}"?\n\nThis permanently removes the challenge and ALL applications, team members, and evaluations attached to it. This cannot be undone.`
    );
    if (!ok) return;
    try {
      await corporateAPI.deleteChallenge(detail.id);
      toast.success('Challenge deleted');
      setDetail(null);
      navigate('/dashboard/corporate/challenges');
      load();
    } catch (err) { toast.error(err.message || 'Failed to delete challenge'); }
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
  // T32-99c-hotfix2: edit modal falls through detail-view early return
  // When showCreate is true (Edit clicked), let function continue to main
  // return where the modal lives. Otherwise modal would never render.
  if (selected && detail && !showCreate) {
    const st = STATUS_STYLE[detail.status] || STATUS_STYLE.open;
    const rfiQuestions = (() => { try { return typeof detail.rfi_questions === 'string' ? JSON.parse(detail.rfi_questions) : (detail.rfi_questions || []); } catch { return []; } })();
    const faqs = (() => { try { return typeof detail.faqs === 'string' ? JSON.parse(detail.faqs) : (detail.faqs || []); } catch { return []; } })();

    return (
      <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
        <button onClick={() => navigate('/dashboard/corporate/challenges')} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#888', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 16 }}>
          <ChevronLeft size={16} /> Back to Challenges
        </button>

        {/* Header card */}
        <div style={{ ...card, padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', margin: 0, flex: 1 }}>{detail.title}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <select value={detail.status} onChange={e => changeStatus(e.target.value)}
                style={{ fontSize: 16, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: st.bg, color: st.color, border: `1px solid ${st.color}30`, cursor: 'pointer', outline: 'none' }}>
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
              {/* T32-99d: Invite Startups button — visible on ALL challenges (public can curate too) */}
              {(
                <button onClick={async () => {
                  setShowInvite(true);
                  try {
                    const r = await corporateAPI.listInvites(detail.id);
                    setInviteList(r.invites || []);
                  } catch (e) { console.error('[invites] list failed:', e); }
                }}
                  style={{ fontSize: 11, fontWeight: 700, padding: '5px 14px', borderRadius: 8, background: G, color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <UserPlus size={12} /> Invite Startups
                </button>
              )}
              {/* Bug #2 Side B: Manage Team button — opens reviewer/viewer/editor team modal */}
              <button onClick={async () => { setShowTeam(true); await loadTeamMembers(detail.id); }}
                style={{ fontSize: 11, fontWeight: 700, padding: '5px 14px', borderRadius: 8, background: '#fff', color: G, border: `1px solid ${G}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Users size={12} /> Manage Team
              </button>
              <button onClick={deleteChallenge}
                title="Delete challenge"
                style={{ fontSize: 11, fontWeight: 600, padding: '5px 10px', borderRadius: 8, background: '#fff', color: '#c43c3c', border: '1px solid #c43c3c40', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Trash2 size={12} /> Delete
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
              // T32-99c-hotfix: visibility badge supports public / invite_only / draft (legacy: private)
              background: (detail.visibility === 'invite_only' || detail.visibility === 'private') ? '#fef3c7' : detail.visibility === 'draft' ? '#f3f4f6' : '#f0fdf4',
              color:      (detail.visibility === 'invite_only' || detail.visibility === 'private') ? '#92400e' : detail.visibility === 'draft' ? '#6b7280' : '#16a34a' }}>
              {detail.visibility === 'invite_only' ? 'Invite-only' : detail.visibility === 'draft' ? 'Draft' : detail.visibility === 'private' ? 'Private' : 'Public'}
            </span>
          </div>
          {/* T32-99e: invite stats row — only render when at least one invite exists */}
          {(detail.invites_total > 0) && (
            <div style={{ display: 'flex', gap: 16, padding: '8px 12px', marginBottom: 12, background: '#fafafa', border: '1px solid #eee', borderRadius: 8, fontSize: 12, color: '#555' }}>
              <span><strong style={{ color: G }}>{detail.invites_total}</strong> Invites Sent</span>
              <span><strong style={{ color: '#15803d' }}>{detail.invites_accepted || 0}</strong> Accepted</span>
              <span><strong style={{ color: '#92400e' }}>{detail.invites_pending || 0}</strong> Pending</span>
              {detail.invites_declined > 0 && <span><strong style={{ color: '#b91c1c' }}>{detail.invites_declined}</strong> Declined</span>}
            </div>
          )}
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

        {/* Phase 40: Collaboration team — REMOVED 28 May 2026 per cohort feedback #2.
            "Manage Team" modal (org_members) already covers this function.
            Removing the duplicate Challenge Team CollaboratorsPanel here. */}

        {/* Phase 40 (P8): Reviews */}
        <div style={{ marginBottom: 16 }}>
          <ReviewPanel entityType="challenge" entityId={detail.id} title="Challenge Reviews" />
        </div>

        {/* Applications */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>
            <Users size={15} style={{ verticalAlign: -3, marginRight: 6 }} />Applications ({(detail.applications || []).length})
          </h3>
          {(detail.applications || []).length > 0 && (
            <div style={{ display: 'flex', gap: 6 }}>
              {showAnalysis && analysisData && (
                <button onClick={() => setShowAnalysis(false)}
                  style={{ padding: '5px 12px', fontSize: 11, fontWeight: 600, borderRadius: 7, background: '#f3f4f6', color: '#333', border: '1px solid #ddd', cursor: 'pointer' }}>
                  Show Applications
                </button>
              )}
              <button onClick={runAiAnalysis} disabled={analysisLoading}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', fontSize: 11, fontWeight: 600, borderRadius: 7, background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#fff', border: 'none', cursor: analysisLoading ? 'wait' : 'pointer', opacity: analysisLoading ? 0.7 : 1 }}>
                {analysisLoading ? <Loader2 size={11} className="animate-spin" /> : <BarChart3 size={11} />} AI Analysis
              </button>
            </div>
          )}
        </div>
        {/* Phase 35: AI Analysis Panel */}
        {showAnalysis && analysisData && (
          <div style={{ marginBottom: 16 }}>
            {analysisData.top_pick && (
              <div style={{ ...card, padding: 16, marginBottom: 10, border: '2px solid #7c3aed', background: '#faf5ff' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Zap size={13} /> Top Pick
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>
                  {(detail.applications || []).find(a => a.id === analysisData.top_pick.application_id)?.startup_name || 'Startup'}
                </div>
                <div style={{ fontSize: 11, color: '#555', marginTop: 4, lineHeight: 1.5 }}>{analysisData.top_pick.rationale}</div>
              </div>
            )}
            <div style={{ display: 'grid', gap: 8 }}>
              {(analysisData.analyses || []).sort((a, b) => (a.ranking || 99) - (b.ranking || 99)).map(analysis => {
                const app = (detail.applications || []).find(a => a.id === analysis.application_id) || {};
                return (
                  <div key={analysis.application_id} style={{ ...card, padding: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>
                        #{analysis.ranking} {app.startup_name || `Application #${analysis.application_id}`}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 60, height: 6, borderRadius: 3, background: '#e5e7eb', overflow: 'hidden' }}>
                          <div style={{ width: `${analysis.fit_score || 0}%`, height: '100%', borderRadius: 3, background: analysis.fit_score >= 70 ? '#16a34a' : analysis.fit_score >= 40 ? '#f59e0b' : '#dc2626' }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: analysis.fit_score >= 70 ? '#16a34a' : analysis.fit_score >= 40 ? '#f59e0b' : '#dc2626' }}>{analysis.fit_score}/100</span>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: '#555', marginBottom: 6, lineHeight: 1.5 }}>{analysis.summary}</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {(analysis.strengths || []).length > 0 && (
                        <div style={{ flex: 1 }}>
                          {analysis.strengths.map((s, i) => <span key={i} style={{ display: 'inline-block', fontSize: 10, padding: '2px 7px', borderRadius: 6, background: '#f0fdf4', color: '#16a34a', margin: '0 3px 3px 0' }}>{s}</span>)}
                        </div>
                      )}
                      {(analysis.weaknesses || []).length > 0 && (
                        <div style={{ flex: 1 }}>
                          {analysis.weaknesses.map((w, i) => <span key={i} style={{ display: 'inline-block', fontSize: 10, padding: '2px 7px', borderRadius: 6, background: '#fef2f2', color: '#dc2626', margin: '0 3px 3px 0' }}>{w}</span>)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {(detail.applications || []).length === 0 ? (
          <div style={{ ...card, padding: 30, textAlign: 'center', color: '#999', fontSize: 13 }}>No applications yet</div>
        ) : (!showAnalysis) && (
          <div style={{ display: 'grid', gap: 10 }}>
            {(detail.applications || []).map(app => {
              /* Phase 100: badge uses persona label */
              const personaLabel = getStatusLabel(persona, app.status);
              const as = { label: personaLabel.label, color: personaLabel.color, bg: personaLabel.bg };
              const appRfiAnswers = (() => { try { return typeof app.rfi_answers === 'string' ? JSON.parse(app.rfi_answers) : (app.rfi_answers || {}); } catch { return {}; } })();
              const appDataRoom = (() => { try { return typeof app.data_room === 'string' ? JSON.parse(app.data_room) : (app.data_room || []); } catch { return []; } })();

              return (
                <div key={app.id} style={{ ...card, padding: 16 }}>
                  {/* Phase 100: clickable name + investor financials + empty-stub hint */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ flex: 1 }}>
                      {/* Phase 101: Invited chip on application card — gold pill next to name */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        {app.applicant_id ? (
                          <Link to={`/dashboard/startup-profile/${app.applicant_id}?by=user_id`}
                            style={{ fontSize: 14, fontWeight: 600, color: G, textDecoration: 'none', borderBottom: `1px dashed ${G}` }}>
                            {app.startup_name || app.applicant_name}
                          </Link>
                        ) : (
                          <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>{app.startup_name || app.applicant_name}</span>
                        )}
                        {/* M2 (27 May 2026) — Message button opens a direct conversation with the applicant */}
                        {app.applicant_id && (
                          <button
                            onClick={async () => {
                              try {
                                const conv = await messageAPI.createConversation({ type: 'direct', member_ids: [app.applicant_id] });
                                navigate('/dashboard/messaging?conversation=' + conv.id);
                              } catch (err) {
                                toast.error(err?.response?.data?.message || err?.message || 'Failed to open conversation');
                              }
                            }}
                            title={`Message ${app.applicant_name || 'applicant'}`}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              padding: '4px 10px', fontSize: 11, fontWeight: 600,
                              background: '#fff', color: G, border: `1px solid ${G}`,
                              borderRadius: 14, cursor: 'pointer',
                            }}
                          >
                            <MessageCircle size={12} /> Message
                          </button>
                        )}
                        {app.is_invited && (
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 12,
                            background: `${G}20`, color: '#5a4715', border: `1px solid ${G}`,
                            display: 'inline-flex', alignItems: 'center', gap: 3,
                          }} title={app.invite_status ? `Invite status: ${app.invite_status}` : 'Invited by your team'}>
                            ★ Invited
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: '#888' }}>
                        {app.applicant_email} {app.sector ? `| ${app.sector}` : ''} {app.stage ? `| ${app.stage}` : ''}
                        {app.profile_pct != null && <span style={{ marginLeft: 8, color: '#16a34a' }}>Profile: {app.profile_pct}%</span>}
                      </div>
                      {/* Phase 100: investor-only financial chips */}
                      {persona === 'investor' && (app.funding_raised || app.traction_score || app.revenue_range || app.employee_range) && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                          {app.funding_raised > 0 && (
                            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: '#fefce8', color: '#854d0e' }}>
                              Raised: {app.funding_raised_currency || ''} {app.funding_raised} {app.funding_raised_unit || ''}
                            </span>
                          )}
                          {app.traction_score > 0 && (
                            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: '#f0fdf4', color: '#15803d' }}>
                              Traction: {app.traction_score}/100
                            </span>
                          )}
                          {app.revenue_range && (
                            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: '#eff6ff', color: '#1e40af' }}>
                              Revenue: {app.revenue_range}
                            </span>
                          )}
                          {app.employee_range && (
                            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: '#f3f4f6', color: '#4b5563' }}>
                              Team: {app.employee_range}
                            </span>
                          )}
                        </div>
                      )}
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
                  {/* Phase 100: empty-stub hint when invitee accepted but hasn't filled in application */}
                  {!app.pitch && !app.proposal_url && Object.keys(appRfiAnswers).length === 0 && appDataRoom.length === 0 && (
                    <div style={{ padding: 10, marginBottom: 8, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, fontSize: 11, color: '#92400e' }}>
                      {/* Phase 101 Sub-C: action guidance under empty-stub hint */}
                      <strong>Application empty</strong> — the invitee has accepted but hasn't filled in their pitch, RFI answers, or uploaded documents yet.
                      <div style={{ marginTop: 4, fontSize: 11, color: '#92400e' }}>
                        You may still evaluate them based on their startup profile (click the name above), or send them a reminder using the button below.
                      </div>
                    </div>
                  )}
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

                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {/* Phase 100: per-persona action labels */}
                    {app.status === 'applied' && (
                      <>
                        <button onClick={() => updateAppStatus(app.id, 'shortlisted')} style={{ padding: '5px 12px', fontSize: 11, fontWeight: 600, borderRadius: 7, background: '#fefce815', color: '#ca8a04', border: '1px solid #fde68a', cursor: 'pointer' }}>
                          <Star size={11} style={{ verticalAlign: -2 }} /> {getActionLabel(persona, 'shortlist')}
                        </button>
                        <button onClick={() => updateAppStatus(app.id, 'rejected')} style={{ padding: '5px 12px', fontSize: 11, borderRadius: 7, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', cursor: 'pointer' }}>
                          {getActionLabel(persona, 'reject')}
                        </button>
                      </>
                    )}
                    {app.status === 'shortlisted' && (
                      <button onClick={() => updateAppStatus(app.id, 'selected')} style={{ padding: '5px 12px', fontSize: 11, fontWeight: 600, borderRadius: 7, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', cursor: 'pointer' }}>
                        <CheckCircle size={11} style={{ verticalAlign: -2 }} /> {getActionLabel(persona, 'select')}
                      </button>
                    )}
                    {/* Phase 101 Sub-C: Remind button when application is empty AND has invite_id */}
                    {app.is_invited && app.invite_id && !app.pitch && !app.proposal_url && Object.keys(appRfiAnswers).length === 0 && appDataRoom.length === 0 && (
                      <button onClick={async () => {
                        try {
                          await corporateAPI.remindInvitee(detail.id, app.invite_id);
                          toast.success(`Reminder sent to ${app.applicant_name || 'invitee'}`);
                        } catch (e) {
                          toast.error(e?.message || 'Reminder failed');
                        }
                      }} style={{ padding: '5px 12px', fontSize: 11, fontWeight: 600, borderRadius: 7, background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        ✉ Remind
                      </button>
                    )}
                    {/* Phase 35: AI Evaluate */}
                    <button onClick={() => runAiEvaluate(app.id)} disabled={evaluatingAppId === app.id}
                      style={{ padding: '5px 12px', fontSize: 11, fontWeight: 600, borderRadius: 7, background: evaluations[app.id] ? '#f0fdf4' : 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: evaluations[app.id] ? '#16a34a' : '#fff', border: evaluations[app.id] ? '1px solid #bbf7d0' : 'none', cursor: evaluatingAppId === app.id ? 'wait' : 'pointer', opacity: evaluatingAppId === app.id ? 0.7 : 1 }}>
                      {evaluatingAppId === app.id ? <Loader2 size={11} className="animate-spin" style={{ verticalAlign: -2 }} /> : <Sparkles size={11} style={{ verticalAlign: -2 }} />} {evaluations[app.id] ? 'Re-evaluate' : 'AI Evaluate'}
                    </button>
                  </div>

                  {/* Phase 35: AI Evaluation Results */}
                  {evaluations[app.id] && (
                    <div style={{ marginTop: 10, background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 10, padding: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span><Brain size={12} style={{ verticalAlign: -2 }} /> AI Evaluation</span>
                        <span style={{ fontSize: 16, fontWeight: 800, color: evaluations[app.id].overall_score >= 3.5 ? '#16a34a' : evaluations[app.id].overall_score >= 2.5 ? '#f59e0b' : '#dc2626' }}>{evaluations[app.id].overall_score}/5</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 4, marginBottom: 8 }}>
                        {[
                          { k: 'solution_fit', l: 'Solution Fit' }, { k: 'tech_maturity', l: 'Tech Maturity' },
                          { k: 'scalability', l: 'Scalability' }, { k: 'integration_feasibility', l: 'Integration' },
                          { k: 'team_capability', l: 'Team' }, { k: 'cost_effectiveness', l: 'Cost' },
                          { k: 'innovation_score', l: 'Innovation' }, { k: 'strategic_alignment', l: 'Strategy' },
                        ].map(v => (
                          <div key={v.k} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 10, color: '#666', width: 65, flexShrink: 0 }}>{v.l}</span>
                            <div style={{ flex: 1, height: 5, borderRadius: 3, background: '#e5e7eb', overflow: 'hidden' }}>
                              <div style={{ width: `${((evaluations[app.id][v.k] || 0) / 5) * 100}%`, height: '100%', borderRadius: 3, background: '#7c3aed' }} />
                            </div>
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#7c3aed', width: 14 }}>{evaluations[app.id][v.k] || '-'}</span>
                          </div>
                        ))}
                      </div>
                      {evaluations[app.id].explanation && <div style={{ fontSize: 11, color: '#555', lineHeight: 1.5, marginBottom: 6 }}>{evaluations[app.id].explanation}</div>}
                      {(evaluations[app.id].red_flags || []).length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                          {evaluations[app.id].red_flags.map((f, i) => <span key={i} style={{ fontSize: 9, padding: '2px 7px', borderRadius: 6, background: '#fef2f2', color: '#dc2626' }}>{f}</span>)}
                        </div>
                      )}
                      {evaluations[app.id].recommended_action && (
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: evaluations[app.id].recommended_action === 'shortlist' ? '#f0fdf4' : evaluations[app.id].recommended_action === 'reject' ? '#fef2f2' : '#eff6ff', color: evaluations[app.id].recommended_action === 'shortlist' ? '#16a34a' : evaluations[app.id].recommended_action === 'reject' ? '#dc2626' : '#2563eb' }}>
                          AI: {evaluations[app.id].recommended_action}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* T32-99d: Invite Startups modal */}
        {showInvite && (
          <div role="dialog" aria-modal="true"
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}>
            <div style={{ background: '#fff', borderRadius: 14, padding: 24, maxWidth: 640, width: '100%', maxHeight: '85vh', overflow: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: '#111' }}>Invite Startups</h3>
                  <p style={{ fontSize: 12, color: '#666', margin: '4px 0 0' }}>Pick startups to invite. They will see this challenge in their Invitations Inbox.</p>
                </div>
                <button onClick={() => { setShowInvite(false); setInviteSearch(''); setInviteResults([]); setInviteSelected([]); setInviteMessage(''); }}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}>
                  <X size={20} color="#666" />
                </button>
              </div>

              {/* Typeahead search */}
              <label style={{ fontSize: 12, fontWeight: 600, color: '#444', display: 'block', marginBottom: 4 }}>Search startups</label>
              <input type="text" autoFocus value={inviteSearch}
                onChange={async (e) => {
                  const q = e.target.value;
                  setInviteSearch(q);
                  if (q.trim().length < 2) { setInviteResults([]); return; }
                  const mySeq = ++inviteSeqRef.current;
                  try {
                    const r = await meetingAPI.searchUsers(q);
                    if (mySeq !== inviteSeqRef.current) return;
                    const startups = (r.users || []).filter(u => u.role === 'startup');
                    const selectedIds = new Set(inviteSelected.map(s => s.id));
                    const alreadyInvited = new Set(inviteList.map(i => i.invited_user_id));
                    setInviteResults(startups.filter(u => !selectedIds.has(u.id) && !alreadyInvited.has(u.id)));
                  } catch (err) { console.error('[invite-search]', err); }
                }}
                placeholder="Type at least 2 characters (name, email, or org)"
                style={{ width: '100%', padding: '10px 12px', fontSize: 16, border: '1.5px solid #e5e7eb', borderRadius: 10, outline: 'none', background: '#f9fafb', marginBottom: 8 }} />

              {/* Results */}
              {inviteResults.length > 0 && (
                <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, maxHeight: 180, overflow: 'auto', marginBottom: 12 }}>
                  {inviteResults.map(u => (
                    <div key={u.id}
                      onClick={() => {
                        setInviteSelected(prev => [...prev, u]);
                        setInviteResults(prev => prev.filter(x => x.id !== u.id));
                      }}
                      style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}
                      onMouseDown={e => e.preventDefault()}
                      onMouseEnter={e => e.currentTarget.style.background = '#fef9e8'}
                      onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                      <span><strong>{u.name}</strong>{u.organization_name && <span style={{ color: '#888' }}> · {u.organization_name}</span>}</span>
                      <Plus size={14} color={G} />
                    </div>
                  ))}
                </div>
              )}
              {inviteSearch.trim().length >= 2 && inviteResults.length === 0 && (
                <p style={{ fontSize: 12, color: '#999', marginBottom: 12, fontStyle: 'italic' }}>No matching startups found.</p>
              )}

              {/* Selected chips */}
              {inviteSelected.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#444', display: 'block', marginBottom: 6 }}>Selected ({inviteSelected.length})</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {inviteSelected.map(u => (
                      <span key={u.id}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', fontSize: 12, borderRadius: 20, background: `${G}15`, color: '#5a4715', border: `1px solid ${G}` }}>
                        {u.name}
                        <button type="button" onClick={() => setInviteSelected(prev => prev.filter(x => x.id !== u.id))}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, marginLeft: 2 }}>
                          <X size={12} color="#5a4715" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Phase 108: Or invite by email (non-OpenI users) */}
              <div style={{ marginBottom: 12, paddingTop: 12, borderTop: '1px solid #eee' }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#444', display: 'block', marginBottom: 4 }}>
                  Or invite by email
                </label>
                <p style={{ fontSize: 11, color: '#888', margin: '0 0 6px' }}>
                  Not yet on OpenI? Add an email — they'll get a signup invite. Press Enter or comma to add.
                </p>
                <input type="email" value={inviteEmailDraft}
                  onChange={(e) => setInviteEmailDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      const em = inviteEmailDraft.trim().toLowerCase().replace(/,$/, '');
                      if (/\S+@\S+\.\S+/.test(em) && !inviteEmails.includes(em)) {
                        setInviteEmails(prev => [...prev, em]);
                        setInviteEmailDraft('');
                      }
                    }
                  }}
                  onBlur={() => {
                    const em = inviteEmailDraft.trim().toLowerCase().replace(/,$/, '');
                    if (/\S+@\S+\.\S+/.test(em) && !inviteEmails.includes(em)) {
                      setInviteEmails(prev => [...prev, em]);
                      setInviteEmailDraft('');
                    }
                  }}
                  placeholder="vanessa@example.com"
                  style={{ width: '100%', padding: '8px 12px', fontSize: 16, border: '1.5px solid #e5e7eb', borderRadius: 8, outline: 'none', background: '#f9fafb' }} />
                {inviteEmails.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {inviteEmails.map(em => (
                      <span key={em}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', fontSize: 12, borderRadius: 20, background: `${G}15`, color: '#5a4715', border: `1px solid ${G}` }}>
                        {em}
                        <button type="button" onClick={() => setInviteEmails(prev => prev.filter(x => x !== em))}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, marginLeft: 2 }}>
                          <X size={12} color="#5a4715" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Message field */}
              <label style={{ fontSize: 12, fontWeight: 600, color: '#444', display: 'block', marginBottom: 4 }}>Personal message (optional)</label>
              <textarea value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                placeholder="Add context for the invitee — what excites you about this challenge for them?"
                rows={3}
                style={{ width: '100%', padding: '10px 12px', fontSize: 16, border: '1.5px solid #e5e7eb', borderRadius: 10, outline: 'none', background: '#f9fafb', resize: 'vertical', marginBottom: 16 }} />

              {/* Send + Cancel */}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginBottom: 20 }}>
                <button onClick={() => { setShowInvite(false); setInviteSearch(''); setInviteResults([]); setInviteSelected([]); setInviteMessage(''); }}
                  style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600, background: '#fff', color: '#666', border: '1.5px solid #ccc', borderRadius: 8, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button
                  disabled={inviteBusy || (
                    inviteSelected.length === 0 &&
                    inviteEmails.length === 0 &&
                    !(/\S+@\S+\.\S+/.test(inviteEmailDraft.trim()))
                  )}
                  onClick={async () => {
                    setInviteBusy(true);
                    // Phase C2 (28 May, feedback #3 fix) — Promote any pending
                    // draft email to chip before sending. Cohort screenshot
                    // showed Send disabled with valid email typed but not
                    // Enter-promoted. This makes the Send click promote-then-send.
                    let emailsToSend = inviteEmails.slice();
                    const draft = inviteEmailDraft.trim().toLowerCase().replace(/,$/, '');
                    if (/\S+@\S+\.\S+/.test(draft) && !emailsToSend.includes(draft)) {
                      emailsToSend.push(draft);
                    }
                    try {
                      const r = await corporateAPI.sendInvites(detail.id, {
                        user_ids: inviteSelected.map(u => u.id),
                        emails: emailsToSend,   // Phase 108 + Phase C2 chip-promote
                        message: inviteMessage.trim() || undefined,
                      });
                      const pendingCount = (r.pending_email_invites || []).length;
                      const msgParts = [];
                      if (r.created > 0) msgParts.push(`${r.created} in-app invite${r.created === 1 ? '' : 's'} sent`);
                      if (pendingCount > 0) msgParts.push(`${pendingCount} email invite${pendingCount === 1 ? '' : 's'} sent to non-OpenI user${pendingCount === 1 ? '' : 's'}`);
                      if (r.skipped_existing) msgParts.push(`${r.skipped_existing} already invited`);
                      toast.success(msgParts.join(' · ') || 'Done');
                      setInviteEmails([]); setInviteEmailDraft('');
                      setInviteSelected([]); setInviteMessage(''); setInviteSearch(''); setInviteResults([]);
                      const list = await corporateAPI.listInvites(detail.id);
                      setInviteList(list.invites || []);
                    } catch (err) {
                      console.error('[send-invites]', err);
                      toast.error(err?.message || 'Failed to send invites');
                    } finally {
                      setInviteBusy(false);
                    }
                  }}
                  style={{ padding: '8px 18px', fontSize: 13, fontWeight: 700, background: (inviteSelected.length === 0 && inviteEmails.length === 0) || inviteBusy ? '#ccc' : G, color: '#fff', border: 'none', borderRadius: 8, cursor: (inviteSelected.length === 0 && inviteEmails.length === 0) || inviteBusy ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Send size={14} /> Send Invites
                </button>
              </div>

              {/* Existing invites */}
              <div style={{ borderTop: '1px solid #eee', paddingTop: 14 }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: '#333', margin: '0 0 10px' }}>Invited ({inviteList.length})</h4>
                {inviteList.length === 0 ? (
                  <p style={{ fontSize: 12, color: '#999', fontStyle: 'italic', margin: 0 }}>No invites sent yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {inviteList.map(inv => {
                      const colors = inv.status === 'pending' ? { bg: '#fef3c7', fg: '#92400e' }
                        : inv.status === 'accepted' ? { bg: '#dcfce7', fg: '#15803d' }
                        : inv.status === 'declined' ? { bg: '#fee2e2', fg: '#b91c1c' }
                        : { bg: '#f3f4f6', fg: '#6b7280' };
                      return (
                        <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#fafafa', borderRadius: 8, fontSize: 12 }}>
                          <div>
                            <strong>{inv.invitee_name}</strong>
                            {inv.invitee_org && <span style={{ color: '#888' }}> · {inv.invitee_org}</span>}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ padding: '2px 8px', borderRadius: 12, background: colors.bg, color: colors.fg, fontSize: 11, fontWeight: 600 }}>{inv.status}</span>
                            {inv.status === 'pending' && (
                              <button onClick={async () => {
                                if (!window.confirm(`Revoke invite for ${inv.invitee_name}?`)) return;
                                try {
                                  await corporateAPI.revokeInvite(detail.id, inv.id);
                                  const list = await corporateAPI.listInvites(detail.id);
                                  setInviteList(list.invites || []);
                                  toast.success('Invite revoked');
                                } catch (err) { toast.error(err?.message || 'Failed'); }
                              }}
                                style={{ padding: '3px 8px', fontSize: 11, fontWeight: 600, background: 'transparent', color: '#c43c3c', border: '1px solid #c43c3c40', borderRadius: 6, cursor: 'pointer' }}>
                                Revoke
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Bug #2 Side B: Team modal — invite reviewers/viewers/editors */}
        {showTeam && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20,
          }}>
            <div style={{
              background: '#fff', borderRadius: 12, padding: 24, maxWidth: 600, width: '100%',
              maxHeight: '90vh', overflowY: 'auto',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: '#111' }}>Manage Challenge Team</h3>
                <button onClick={() => { setShowTeam(false); setAddMemberEmail(''); setAddMemberRole('reviewer'); }}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}>
                  <X size={18} color="#666" />
                </button>
              </div>
              <p style={{ fontSize: 12, color: '#666', margin: '0 0 16px' }}>
                Add reviewers (rate applications), viewers (read-only), or editors (full access except delete).
                They get notified and can find this challenge in their "Challenges to Review" inbox.
              </p>

              {/* Add Member Form */}
              <div style={{ padding: 14, background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: 10, marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input type="email" value={addMemberEmail}
                    onChange={(e) => setAddMemberEmail(e.target.value)}
                    placeholder="member@example.com"
                    style={{ flex: 1, padding: '8px 12px', fontSize: 16, border: '1.5px solid #e5e7eb', borderRadius: 8, outline: 'none', background: '#fff' }} />
                  <select value={addMemberRole}
                    onChange={(e) => setAddMemberRole(e.target.value)}
                    style={{ padding: '8px 12px', fontSize: 16, border: '1.5px solid #e5e7eb', borderRadius: 8, background: '#fff', cursor: 'pointer' }}>
                    <option value="reviewer">Reviewer</option>
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                  </select>
                  <button onClick={() => addTeamMember(detail.id)}
                    disabled={addMemberBusy || !addMemberEmail.trim()}
                    style={{ padding: '8px 16px', fontSize: 13, fontWeight: 700, background: addMemberBusy || !addMemberEmail.trim() ? '#ccc' : G, color: '#fff', border: 'none', borderRadius: 8, cursor: addMemberBusy || !addMemberEmail.trim() ? 'not-allowed' : 'pointer' }}>
                    {addMemberBusy ? 'Adding...' : 'Add'}
                  </button>
                </div>
                <p style={{ fontSize: 11, color: '#888', margin: 0 }}>
                  Member must already have an OpenI Hub account.
                </p>
              </div>

              {/* Members List */}
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#333', margin: '0 0 10px' }}>
                Team Members ({teamMembers.length})
              </h4>
              {teamLoading && (
                <p style={{ fontSize: 12, color: '#888', fontStyle: 'italic', margin: 0 }}>Loading...</p>
              )}
              {!teamLoading && teamMembers.length === 0 && (
                <p style={{ fontSize: 12, color: '#999', fontStyle: 'italic', margin: 0 }}>No team members yet. Add reviewers above.</p>
              )}
              {!teamLoading && teamMembers.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {teamMembers.map(m => (
                    <div key={m.user_id || m.id}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{m.name || m.email}</div>
                        <div style={{ fontSize: 11, color: '#888' }}>{m.email}</div>
                      </div>
                      {m.role === 'owner' ? (
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 12, background: '#fff3cd', color: '#8a6d3b', border: '1px solid #ffeaa7' }}>
                          Owner
                        </span>
                      ) : (
                        <>
                          <select value={m.role}
                            onChange={(e) => updateTeamMemberRole(detail.id, m.user_id || m.id, e.target.value)}
                            style={{ padding: '4px 8px', fontSize: 16, border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff', cursor: 'pointer' }}>
                            <option value="reviewer">Reviewer</option>
                            <option value="viewer">Viewer</option>
                            <option value="editor">Editor</option>
                          </select>
                          <button onClick={() => removeTeamMember(detail.id, m.user_id || m.id)}
                            title="Remove member"
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, color: '#c43c3c' }}>
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                <button onClick={() => { setShowTeam(false); setAddMemberEmail(''); setAddMemberRole('reviewer'); }}
                  style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600, background: '#fff', color: '#666', border: '1.5px solid #ccc', borderRadius: 8, cursor: 'pointer' }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // List + Create
  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      {/* Ship #12 follow-up — tour anchors */}
      <div id="tour-page-challenges-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>
          <Target size={20} style={{ verticalAlign: -3, marginRight: 8, color: G }} />Innovation Challenges
        </h1>
        <button id="tour-page-challenges-new" onClick={() => { loadTemplates(); setShowTemplatePicker(true); }}
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
              placeholder="Search challenges..." style={{ width: '100%', padding: '7px 10px', fontSize: 16, border: '1px solid #ddd', borderRadius: 8, outline: 'none' }} />
          </div>
          <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
            style={{ padding: '7px 10px', fontSize: 16, border: '1px solid #ddd', borderRadius: 8, outline: 'none' }}>
            <option value="all">All Status</option>
            {Object.entries(STATUS_STYLE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={filters.sector} onChange={e => setFilters(f => ({ ...f, sector: e.target.value }))}
            style={{ padding: '7px 10px', fontSize: 16, border: '1px solid #ddd', borderRadius: 8, outline: 'none' }}>
            <option value="">All Sectors</option>
            {(taxonomy.sectors || []).map(s => { const name = typeof s === 'string' ? s : s.name; return <option key={name} value={name}>{name}</option>; })}
          </select>
          <select value={filters.sort} onChange={e => setFilters(f => ({ ...f, sort: e.target.value }))}
            style={{ padding: '7px 10px', fontSize: 16, border: '1px solid #ddd', borderRadius: 8, outline: 'none' }}>
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
                {/* T32-99c: 3-way visibility toggle (public / invite_only / draft) — values match backend CHECK constraint */}
                <label style={{ fontSize: 11, fontWeight: 600, color: '#555', marginBottom: 4, display: 'block' }}>Visibility</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[{ key: 'public', label: 'Public' }, { key: 'invite_only', label: 'Invite-only' }, { key: 'draft', label: 'Draft' }].map(v => (
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
              style={{ padding: '10px 14px', fontSize: 16, border: '1px solid #e5e7eb', borderRadius: 10, outline: 'none', background: '#f9fafb' }} />
            <textarea placeholder="Short description" rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              style={{ padding: '10px 14px', fontSize: 16, border: '1px solid #e5e7eb', borderRadius: 10, outline: 'none', background: '#f9fafb', resize: 'vertical' }} />
            <textarea placeholder="Detailed problem statement — describe what you need solved, constraints, and expectations..." rows={4} value={form.problem_statement} onChange={e => setForm(p => ({ ...p, problem_statement: e.target.value }))}
              style={{ padding: '10px 14px', fontSize: 16, border: '1px solid #e5e7eb', borderRadius: 10, outline: 'none', background: '#f9fafb', resize: 'vertical' }} />

            {/* Phase 35: AI Advisor */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button type="button" onClick={runAiAdvisor} disabled={aiAdvisorLoading}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 12, fontWeight: 600, borderRadius: 8, background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#fff', border: 'none', cursor: aiAdvisorLoading ? 'wait' : 'pointer', opacity: aiAdvisorLoading ? 0.7 : 1 }}>
                {aiAdvisorLoading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />} AI Advisor
              </button>
              <span style={{ fontSize: 10, color: '#999' }}>Get AI suggestions for sectors, technologies, budget, and more</span>
            </div>

            {aiSuggestions && (
              <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Brain size={14} /> AI Suggestions
                  <button onClick={() => setAiSuggestions(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}><X size={12} /></button>
                </div>
                {aiSuggestions.refined_problem_statement && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#555', marginBottom: 3 }}>Refined Problem Statement</div>
                    <div style={{ fontSize: 11, color: '#333', lineHeight: 1.5, marginBottom: 4 }}>{aiSuggestions.refined_problem_statement}</div>
                    <button onClick={() => setForm(f => ({ ...f, problem_statement: aiSuggestions.refined_problem_statement }))}
                      style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: '#7c3aed', color: '#fff', border: 'none', cursor: 'pointer' }}>Apply</button>
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
                  {aiSuggestions.sectors?.length > 0 && (
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#555', marginBottom: 3 }}>Sectors</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 4 }}>
                        {aiSuggestions.sectors.map(s => <span key={s} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 6, background: '#eff6ff', color: '#2563eb' }}>{s}</span>)}
                      </div>
                      <button onClick={() => setForm(f => ({ ...f, sectors: [...new Set([...f.sectors, ...(aiSuggestions.sectors || [])])] }))}
                        style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: '#7c3aed', color: '#fff', border: 'none', cursor: 'pointer' }}>Apply</button>
                    </div>
                  )}
                  {aiSuggestions.technologies?.length > 0 && (
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#555', marginBottom: 3 }}>Technologies</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 4 }}>
                        {aiSuggestions.technologies.map(t => <span key={t} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 6, background: '#f0fdf4', color: '#16a34a' }}>{t}</span>)}
                      </div>
                      <button onClick={() => setForm(f => ({ ...f, technologies: [...new Set([...f.technologies, ...(aiSuggestions.technologies || [])])] }))}
                        style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: '#7c3aed', color: '#fff', border: 'none', cursor: 'pointer' }}>Apply</button>
                    </div>
                  )}
                  {aiSuggestions.budget_range && (
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#555', marginBottom: 3 }}>Budget</div>
                      <div style={{ fontSize: 11, color: '#333', marginBottom: 4 }}>{aiSuggestions.budget_range}</div>
                      <button onClick={() => setForm(f => ({ ...f, budget_range: aiSuggestions.budget_range }))}
                        style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: '#7c3aed', color: '#fff', border: 'none', cursor: 'pointer' }}>Apply</button>
                    </div>
                  )}
                  {aiSuggestions.timeline && (
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#555', marginBottom: 3 }}>Timeline</div>
                      <div style={{ fontSize: 11, color: '#333', marginBottom: 4 }}>{aiSuggestions.timeline}</div>
                      <button onClick={() => setForm(f => ({ ...f, timeline: aiSuggestions.timeline }))}
                        style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: '#7c3aed', color: '#fff', border: 'none', cursor: 'pointer' }}>Apply</button>
                    </div>
                  )}
                </div>
                {aiSuggestions.evaluation_criteria?.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#555', marginBottom: 3 }}>Evaluation Criteria</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {aiSuggestions.evaluation_criteria.map((c, i) => <span key={i} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 6, background: '#fef3c7', color: '#92400e' }}>{c}</span>)}
                    </div>
                  </div>
                )}
                {aiSuggestions.suggestions?.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#555', marginBottom: 3 }}>Tips</div>
                    {aiSuggestions.suggestions.map((s, i) => <div key={i} style={{ fontSize: 10, color: '#666', marginBottom: 2 }}>- {s}</div>)}
                  </div>
                )}
              </div>
            )}

            {/* Timeline & logistics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
              <input placeholder="Budget range" value={form.budget_range} onChange={e => setForm(p => ({ ...p, budget_range: e.target.value }))}
                style={{ padding: '10px 14px', fontSize: 16, border: '1px solid #e5e7eb', borderRadius: 10, outline: 'none', background: '#f9fafb' }} />
              <input placeholder="Timeline" value={form.timeline} onChange={e => setForm(p => ({ ...p, timeline: e.target.value }))}
                style={{ padding: '10px 14px', fontSize: 16, border: '1px solid #e5e7eb', borderRadius: 10, outline: 'none', background: '#f9fafb' }} />
              <input type="date" placeholder="Deadline" value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))}
                style={{ padding: '10px 14px', fontSize: 16, border: '1px solid #e5e7eb', borderRadius: 10, outline: 'none', background: '#f9fafb' }} />
              <input placeholder="Location / region" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                style={{ padding: '10px 14px', fontSize: 16, border: '1px solid #e5e7eb', borderRadius: 10, outline: 'none', background: '#f9fafb' }} />
            </div>
            <textarea placeholder="Detailed requirements" rows={2} value={form.requirements} onChange={e => setForm(p => ({ ...p, requirements: e.target.value }))}
              style={{ padding: '10px 14px', fontSize: 16, border: '1px solid #e5e7eb', borderRadius: 10, outline: 'none', background: '#f9fafb', resize: 'vertical' }} />

            {/* Settings row */}
            <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#555' }}>
                <span style={{ fontWeight: 600 }}>Min profile %:</span>
                <input type="number" min={0} max={100} value={form.min_profile_pct} onChange={e => setForm(p => ({ ...p, min_profile_pct: parseInt(e.target.value) || 25 }))}
                  style={{ width: 50, padding: '5px 8px', fontSize: 16, borderRadius: 6, border: '1px solid #e5e7eb', textAlign: 'center' }} />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#555', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.data_room_required} onChange={e => setForm(p => ({ ...p, data_room_required: e.target.checked }))} />
                <span style={{ fontWeight: 600 }}>Require data room uploads</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#555' }}>
                <span style={{ fontWeight: 600 }}>Status:</span>
                <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                  style={{ padding: '5px 8px', fontSize: 16, borderRadius: 6, border: '1px solid #e5e7eb' }}>
                  <option value="draft">Draft</option>
                  <option value="open">Open</option>
                  {editMode && <option value="reviewing">Reviewing</option>}
                  {editMode && <option value="closed">Closed</option>}
                  {editMode && <option value="awarded">Awarded</option>}
                </select>
              </label>
            </div>

            {/* Taxonomy selectors — searchable dropdowns */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <TagDropdown label="Sectors" options={taxonomy.sectors} selected={form.sectors}
                onChange={val => setForm(p => ({ ...p, sectors: val }))}
                colorScheme={{ bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' }} />
              <TagDropdown label="Technologies" options={taxonomy.technologies} selected={form.technologies}
                onChange={val => setForm(p => ({ ...p, technologies: val }))}
                colorScheme={{ bg: '#fefce8', color: '#ca8a04', border: '#fde68a' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
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
                  }} style={{ padding: '6px 8px', fontSize: 16, borderRadius: 6, border: '1px solid #e5e7eb', minWidth: 80 }}>
                    <option value="text">Text</option>
                    <option value="mcq">MCQ</option>
                  </select>
                  <input placeholder="Question" value={q.question} onChange={e => {
                    const upd = [...form.rfi_questions]; upd[i] = { ...upd[i], question: e.target.value };
                    setForm(p => ({ ...p, rfi_questions: upd }));
                  }} style={{ flex: 1, padding: '6px 10px', fontSize: 16, borderRadius: 6, border: '1px solid #e5e7eb', outline: 'none' }} />
                  {q.type === 'mcq' && (
                    // Ship #6 (21 May 2026) — per-option RFI input
                    // Previously this was a comma-separated text input. If the
                    // cohort typed "Yes" then "NO" without a comma it stored as
                    // ["YesNO"] (single concatenated string). Replaced with
                    // per-option Add/Remove rows so each option is unambiguous.
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {(q.options || []).map((opt, oi) => (
                        <div key={oi} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                          <input placeholder={`Option ${oi + 1}`} value={opt} onChange={e => {
                            const upd = [...form.rfi_questions];
                            const newOpts = [...(upd[i].options || [])];
                            newOpts[oi] = e.target.value;
                            upd[i] = { ...upd[i], options: newOpts };
                            setForm(p => ({ ...p, rfi_questions: upd }));
                          }} style={{ flex: 1, padding: '5px 8px', fontSize: 16, borderRadius: 5, border: '1px solid #e5e7eb', outline: 'none' }} />
                          <button type="button" onClick={() => {
                            const upd = [...form.rfi_questions];
                            upd[i] = { ...upd[i], options: (upd[i].options || []).filter((_, oj) => oj !== oi) };
                            setForm(p => ({ ...p, rfi_questions: upd }));
                          }} style={{ padding: '3px 6px', fontSize: 11, borderRadius: 5, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', cursor: 'pointer' }}>×</button>
                        </div>
                      ))}
                      <button type="button" onClick={() => {
                        const upd = [...form.rfi_questions];
                        upd[i] = { ...upd[i], options: [...(upd[i].options || []), ''] };
                        setForm(p => ({ ...p, rfi_questions: upd }));
                      }} style={{ alignSelf: 'flex-start', padding: '3px 8px', fontSize: 11, color: G, background: 'none', border: '1px dashed #e5e7eb', borderRadius: 5, cursor: 'pointer', fontWeight: 600 }}>+ Add Option</button>
                    </div>
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
                  }} style={{ flex: 1, padding: '6px 10px', fontSize: 16, borderRadius: 6, border: '1px solid #e5e7eb', outline: 'none' }} />
                  <input placeholder="Answer" value={faq.answer} onChange={e => {
                    const upd = [...form.faqs]; upd[i] = { ...upd[i], answer: e.target.value };
                    setForm(p => ({ ...p, faqs: upd }));
                  }} style={{ flex: 1, padding: '6px 10px', fontSize: 16, borderRadius: 6, border: '1px solid #e5e7eb', outline: 'none' }} />
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
                onClick={() => navigate(`/dashboard/corporate/challenges/${ch.id}`)}
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
                    {/* T32-99c-hotfix: list badge */}
                    {(ch.visibility === 'invite_only' || ch.visibility === 'private') && <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: '#fef3c7', color: '#92400e' }}>Invite-only</span>}
                    {ch.visibility === 'draft' && <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: '#f3f4f6', color: '#6b7280' }}>Draft</span>}
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
