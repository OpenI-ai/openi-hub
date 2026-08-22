// Phase 165 (W5-2): 1,721 lines -> this page + ./corporateChallenges/.
// The extracted components hold no state; everything below still owns it.
// See ./corporateChallenges/index.js for the layout and the verification gates.
import { useState, useEffect, useRef } from 'react';
import { useDraftForm } from '../../hooks/useFormDraft';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { isUpgradeError } from '../../utils/upgradeError';
import { corporateAPI } from '../../services/api';
import ReviewPanel from '../../components/ReviewPanel';
import ConfirmDialog from '../../components/ConfirmDialog';
import {
  Target, Plus, ChevronLeft, Clock, Users, Loader2, Calendar, DollarSign, AlertCircle, MapPin,
  FileText, HelpCircle, Trash2, ChevronDown, ChevronUp, Download, UserPlus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { G, card, STATUS_STYLE } from './corporateChallenges/index.js';
import {
  ChallengeApplications, InviteStartupsModal, TeamModal, TemplatePickerModal, ChallengeForm,
  ChallengeListCards,
} from './corporateChallenges/index.js';

export default function CorporateChallenges() {
  // s83 — delete-confirmation dialog state (replaces window.confirm)
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [challenges, setChallenges] = useState([]);
  // Phase 120: selected now derived from URL :id param (mobile back-button fix)
  const { id: ccParamId } = useParams();
  const selected = ccParamId ? parseInt(ccParamId, 10) : null;
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [upgradeError, setUpgradeError] = useState(null);
  const [taxonomy, setTaxonomy] = useState({ sectors: [], functions: [], technologies: [], usecases: [] });
  const [editMode, setEditMode] = useState(false);
  // Draft-backed: a challenge brief is a long write, and losing it to a
  // route change was silent. Keyed per target so a new challenge and an
  // in-progress edit of an existing one cannot overwrite each other.
  const CHALLENGE_FORM_EMPTY = { title: '', description: '', budget_range: '', timeline: '', deadline: '', sectors: [], functions: [], technologies: [], usecases: [], requirements: '', problem_statement: '', location: '', min_profile_pct: 25, data_room_required: false, rfi_questions: [], faqs: [], status: 'open', visibility: 'public', challenge_type: 'partner' };
  const [form, setForm, formDraft] = useDraftForm(
    editMode && selected ? `corporate-challenge:${selected}` : 'corporate-challenge:new',
    CHALLENGE_FORM_EMPTY,
  );
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [expandedReviewApp, setExpandedReviewApp] = useState(null);
  // Phase 9: Templates, Filters, Recommendations
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [templates, setTemplates] = useState({ builtin: [], saved: [] });
  const [filters, setFilters] = useState({ status: 'all', sector: '', search: '', sort: 'newest' });
  const [, setRecommendedStartups] = useState([]);
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

  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional one-time load on mount; loaders are stable inline closures
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
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional refetch on filters change; `load` is a stable inline closure
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
    setUpgradeError(null);
    try {
      await corporateAPI.createChallenge(form);
      toast.success('Challenge created');
      setShowCreate(false);
      // T32-99c-hotfix: post-create form reset keeps all fields including visibility + challenge_type
      formDraft.submitted();   // resets the form AND drops the saved draft
      load();
    } catch (err) {
      toast.error(err.message);
      if (isUpgradeError(err)) setUpgradeError(err);
      else setUpgradeError(null);
    }
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
      const res = await corporateAPI.addMember(challengeId, { email, role: addMemberRole });
      // Phase 99f: backend returns 202 { pending: true } when the email is NOT yet
      // an OpenI Hub account — a magic-link signup invite was sent instead of an
      // immediate team add. They materialize into challenge_members on signup.
      if (res?.pending) {
        toast.success(`Invite sent to ${email}. They'll join your team as ${res.role || addMemberRole} once they sign up on OpenI Hub.`);
      } else {
        toast.success(`${email} added as ${addMemberRole}`);
      }
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
    // rebaseline, not setForm: seeding from the loaded row must not register
    // as an unsaved change (see useFormDraft's header).
    formDraft.rebaseline({
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
      formDraft.clearDraft();
      setShowCreate(false);
      setEditMode(false);
      loadDetail(selected);
      load();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  // s83 — this copy was flatly WRONG after soft-delete shipped. It promised
  // "permanently removes the challenge and ALL applications, team members, and
  // evaluations… cannot be undone", every clause of which is now false: the
  // children are kept and an admin can restore. Leaving it would have scared
  // owners away from a reversible action on exactly the grounds that no longer
  // apply. Also moved off window.confirm() — see components/ConfirmDialog.jsx.
  const deleteChallenge = async () => {
    if (!detail) return;
    setDeleting(true);
    try {
      await corporateAPI.deleteChallenge(detail.id);
      toast.success('Challenge deleted');
      setConfirmDelete(false);
      setDetail(null);
      navigate('/dashboard/corporate/challenges');
      load();
    } catch (err) {
      toast.error(err.message || 'Failed to delete challenge');
    } finally {
      setDeleting(false);
    }
  };

  const changeStatus = async (newStatus) => {
    try {
      await corporateAPI.updateChallenge(selected, { status: newStatus });
      toast.success(`Status changed to ${newStatus}`);
      loadDetail(selected);
      load();
    } catch (err) { toast.error(err.message); }
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
    // Phase 99g: role-aware editing. Backend getChallenge returns my_role
    // ('owner' | 'editor' | 'reviewer' | 'viewer'). Owners + editors may change
    // status, edit, manage team and delete; reviewers/viewers see a read-only
    // header (Export PDF, Invite Startups and share links stay visible to all).
    const canEdit = ['owner', 'editor'].includes(detail.my_role || 'owner');

    return (
      <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
        <button onClick={() => navigate('/dashboard/corporate/challenges')} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#5c5c5c', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 16 }}>
          <ChevronLeft size={16} /> Back to Challenges
        </button>

        {/* Header card */}
        <div style={{ ...card, padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', margin: 0, flex: '1 1 280px', minWidth: 0, wordBreak: 'break-word' }}>{detail.title}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {canEdit ? (
                <select value={detail.status} onChange={e => changeStatus(e.target.value)}
                  style={{ fontSize: 16, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: st.bg, color: st.color, border: `1px solid ${st.color}30`, cursor: 'pointer' }}>
                  {Object.entries(STATUS_STYLE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              ) : (
                <span style={{ fontSize: 16, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: st.bg, color: st.color, border: `1px solid ${st.color}30` }}>
                  {st.label}
                </span>
              )}
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
              {canEdit && (
                <button onClick={startEdit}
                  style={{ fontSize: 11, fontWeight: 600, padding: '5px 14px', borderRadius: 8, background: '#fff', color: G, border: `1px solid ${G}`, cursor: 'pointer' }}>
                  Edit
                </button>
              )}
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
              {/* Phase 99g: team management is an owner/editor-only privilege */}
              {canEdit && (
                <button onClick={async () => { setShowTeam(true); await loadTeamMembers(detail.id); }}
                  style={{ fontSize: 11, fontWeight: 700, padding: '5px 14px', borderRadius: 8, background: '#fff', color: G, border: `1px solid ${G}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Users size={12} /> Manage Team
                </button>
              )}
              {canEdit && (
                <button onClick={() => setConfirmDelete(true)}
                  title="Delete challenge"
                  style={{ fontSize: 11, fontWeight: 600, padding: '5px 10px', borderRadius: 8, background: '#fff', color: '#c43c3c', border: '1px solid #c43c3c40', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Trash2 size={12} /> Delete
                </button>
              )}
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
          <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#666', marginBottom: 12 }}>
            <span>Min profile: {detail.min_profile_pct || 25}%</span>
            <span>Data room: {detail.data_room_required ? 'Required' : 'Optional'}</span>
            {detail.published_at && <span>Published: {new Date(detail.published_at).toLocaleDateString()}</span>}
          </div>
          {/* Tags */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {(detail.sectors || []).map(t => <span key={t} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: '#eff6ff', color: '#2563eb' }}>{t}</span>)}
            {(detail.technologies || []).map(t => <span key={t} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: '#fefce8', color: '#a16207' }}>{t}</span>)}
            {(detail.usecases || []).map(t => <span key={t} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: '#f0fdf4', color: '#15803d' }}>{t}</span>)}
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
                    <span style={{ fontSize: 10, color: '#666', marginLeft: 8, fontWeight: 400 }}>({q.type === 'mcq' ? 'Multiple Choice' : 'Text Answer'})</span>
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
          <ReviewPanel entityType="challenge" entityId={detail.id} title="Challenge Reviews" subtitle="Overall feedback on this challenge as a whole" />
        </div>

        {/* Applications + AI Analysis (extracted) */}
        <ChallengeApplications
          analysisData={analysisData} analysisLoading={analysisLoading} detail={detail}
          evaluatingAppId={evaluatingAppId} evaluations={evaluations} expandedReviewApp={expandedReviewApp}
          loadDetail={loadDetail} navigate={navigate} persona={persona} rfiQuestions={rfiQuestions}
          runAiAnalysis={runAiAnalysis} runAiEvaluate={runAiEvaluate}
          setExpandedReviewApp={setExpandedReviewApp} setShowAnalysis={setShowAnalysis}
          showAnalysis={showAnalysis} updateAppStatus={updateAppStatus} user={user}
        />

        {/* T32-99d: Invite Startups modal */}
        {showInvite && <InviteStartupsModal
          detail={detail} inviteBusy={inviteBusy} inviteEmailDraft={inviteEmailDraft}
          inviteEmails={inviteEmails} inviteList={inviteList} inviteMessage={inviteMessage}
          inviteResults={inviteResults} inviteSearch={inviteSearch} inviteSelected={inviteSelected}
          inviteSeqRef={inviteSeqRef} setInviteBusy={setInviteBusy} setInviteEmailDraft={setInviteEmailDraft}
          setInviteEmails={setInviteEmails} setInviteList={setInviteList} setInviteMessage={setInviteMessage}
          setInviteResults={setInviteResults} setInviteSearch={setInviteSearch}
          setInviteSelected={setInviteSelected} setShowInvite={setShowInvite} user={user}
        />}

        {/* Bug #2 Side B: Team modal — invite reviewers/viewers/editors */}
        {showTeam && <TeamModal
          addMemberBusy={addMemberBusy} addMemberEmail={addMemberEmail} addMemberRole={addMemberRole}
          addTeamMember={addTeamMember} detail={detail} removeTeamMember={removeTeamMember}
          setAddMemberEmail={setAddMemberEmail} setAddMemberRole={setAddMemberRole} setShowTeam={setShowTeam}
          teamLoading={teamLoading} teamMembers={teamMembers} updateTeamMemberRole={updateTeamMemberRole}
        />}
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
      {showTemplatePicker && <TemplatePickerModal
        form={form} loadTemplates={loadTemplates} setEditMode={setEditMode} setForm={setForm}
        setShowCreate={setShowCreate} setShowTemplatePicker={setShowTemplatePicker} templates={templates}
      />}

      {/* Filter Bar */}
      {!showCreate && !selected && (
        <div style={{ ...card, padding: 12, marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          <div style={{ flex: '1 1 180px' }}>
            <input value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              placeholder="Search challenges..." style={{ width: '100%', padding: '7px 10px', fontSize: 16, border: '1px solid #ddd', borderRadius: 8 }} />
          </div>
          <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
            style={{ padding: '7px 10px', fontSize: 16, border: '1px solid #ddd', borderRadius: 8 }}>
            <option value="all">All Status</option>
            {Object.entries(STATUS_STYLE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={filters.sector} onChange={e => setFilters(f => ({ ...f, sector: e.target.value }))}
            style={{ padding: '7px 10px', fontSize: 16, border: '1px solid #ddd', borderRadius: 8 }}>
            <option value="">All Sectors</option>
            {(taxonomy.sectors || []).map(s => { const name = typeof s === 'string' ? s : s.name; return <option key={name} value={name}>{name}</option>; })}
          </select>
          <select value={filters.sort} onChange={e => setFilters(f => ({ ...f, sort: e.target.value }))}
            style={{ padding: '7px 10px', fontSize: 16, border: '1px solid #ddd', borderRadius: 8 }}>
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
      {showCreate && <ChallengeForm
        aiAdvisorLoading={aiAdvisorLoading} aiSuggestions={aiSuggestions} create={create} editMode={editMode}
        form={form} runAiAdvisor={runAiAdvisor} saving={saving}
        draft={formDraft}
        setAiSuggestions={setAiSuggestions} setEditMode={setEditMode} setForm={setForm}
        setShowCreate={setShowCreate} taxonomy={taxonomy} updateChallenge={updateChallenge}
        upgradeError={upgradeError}
      />}

      {/* Challenge list */}
      <ChallengeListCards
        challenges={challenges} navigate={navigate}
      />

      <ConfirmDialog
        open={confirmDelete}
        busy={deleting}
        title={`Delete "${detail?.title ?? ''}"?`}
        confirmLabel="Delete challenge"
        tone="danger"
        onConfirm={deleteChallenge}
        onClose={() => setConfirmDelete(false)}
        body={(
          <>
            <p>
              <strong className="text-gray-900">Applications, team members and evaluations are kept.</strong>{' '}
              The challenge is removed from the marketplace and stops accepting applications.
            </p>
            <p className="text-gray-500">
              Ask an OpenI admin if you need it restored. Notifications about this challenge are
              removed and do not come back.
            </p>
          </>
        )}
      />
    </div>
  );
}
