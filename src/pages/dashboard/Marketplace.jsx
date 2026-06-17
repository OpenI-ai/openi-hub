import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { challengeAPI, corporateAPI } from '../../services/api';
import FileUpload from '../../components/FileUpload';
import {
  Search, Target, ChevronLeft, Clock, Calendar, DollarSign, MapPin,
  Building2, Users, Loader2, AlertCircle, CheckCircle, FileText,
  ChevronDown, ChevronUp, Upload, X, HelpCircle, Send, Filter, ArrowUpDown,
} from 'lucide-react';
import toast from 'react-hot-toast';

const G = '#D0A848';
const card = { background: '#fff', border: '1px solid #eee', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' };

const SORT_OPTIONS = [
  { value: '', label: 'Default' },
  { value: 'relevance', label: 'Relevance' },
  { value: 'newest', label: 'Newest First' },
  { value: 'deadline', label: 'Deadline Soon' },
  { value: 'applications', label: 'Most Applications' },
];

const CHALLENGE_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'partner', label: 'Partner' },
  { value: 'source', label: 'Source' },
  { value: 'invest', label: 'Invest' },
];

const STATUS_BADGE = {
  applied:     { bg: '#eff6ff', color: '#2563eb', label: 'Applied' },
  shortlisted: { bg: '#fefce8', color: '#ca8a04', label: 'Shortlisted' },
  evaluating:  { bg: '#faf5ff', color: '#7c3aed', label: 'Evaluating' },
  selected:    { bg: '#f0fdf4', color: '#16a34a', label: 'Selected' },
  rejected:    { bg: '#fef2f2', color: '#dc2626', label: 'Rejected' },
};

export default function Marketplace() {
  const [challenges, setChallenges] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ sector: '', technology: '', usecase: '', location: '', company: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [taxonomy, setTaxonomy] = useState({ sectors: [], technologies: [], usecases: [] });
  const [sort, setSort] = useState('');
  const [challengeType, setChallengeType] = useState('');
  const [facets, setFacets] = useState({ sector: {}, challenge_type: {} });

  // Detail/apply state — Phase 120: selectedId now derived from URL :id param
  const navigate = useNavigate();
  const { id: paramId } = useParams();
  const selectedId = paramId ? parseInt(paramId, 10) : null;
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showApply, setShowApply] = useState(false);
  const [searchParams] = useSearchParams();

  // Phase 120: Legacy deep-link redirect (?challenge=<id>&action=apply)
  // Converts old query-param form to new path form so email links + bookmarks still work.
  // ChallengeInvites.jsx after Accept continues to send users to this URL shape.
  useEffect(() => {
    const qpChallenge = searchParams.get('challenge');
    const qpAction = searchParams.get('action');
    if (qpChallenge && !paramId) {
      const id = parseInt(qpChallenge, 10);
      if (Number.isFinite(id)) {
        const newPath = `/dashboard/marketplace/${id}${qpAction === 'apply' ? '?action=apply' : ''}`;
        navigate(newPath, { replace: true });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount-only — redirect, then the URL-driven fetch effect below takes over

  // Phase 120: Fetch detail whenever URL :id changes (back/forward, click, deep-link)
  useEffect(() => {
    if (selectedId && (!detail || detail.id !== selectedId)) {
      openDetail(selectedId).then(() => {
        if (searchParams.get('action') === 'apply') {
          setShowApply(true);
          setTimeout(() => {
            const el = document.querySelector('textarea[placeholder*="solution addresses"]');
            if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.focus(); }
          }, 300);
        }
      });
    } else if (!selectedId && (detail || showApply)) {
      // URL reverted to list — clear detail state
      setDetail(null);
      setShowApply(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const [profilePct, setProfilePct] = useState(null);
  const [applying, setApplying] = useState(false);
  const [applyForm, setApplyForm] = useState({ pitch: '', proposal_url: '', rfi_answers: {}, data_room: [] });
  const [editMode, setEditMode] = useState(false); // Bug 4: edit an already-submitted application
  const [expandedFaq, setExpandedFaq] = useState(null);

  // My applications tab
  const [tab, setTab] = useState('browse'); // 'browse' | 'applications'
  const [myApps, setMyApps] = useState([]);
  const [appsLoading, setAppsLoading] = useState(false);

  useEffect(() => { loadChallenges(); loadTaxonomy(); }, []);

  const loadChallenges = async (p = 1, s = search, f = filters, srt = sort, ct = challengeType) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 20 };
      if (s.trim()) params.search = s.trim();
      if (srt) params.sort = srt;
      if (ct) params.challenge_type = ct;
      Object.entries(f).forEach(([k, v]) => { if (v) params[k] = v; });
      const data = await challengeAPI.listOpen(params);
      setChallenges(data.challenges || []);
      setTotal(data.total || 0);
      setPage(p);
      if (data.facets) setFacets(data.facets);
    } catch { toast.error('Failed to load challenges'); }
    finally { setLoading(false); }
  };

  const loadTaxonomy = async () => {
    try { const d = await corporateAPI.getTaxonomy(); setTaxonomy(d); } catch (_e) { /* non-fatal */ }
  };

  const openDetail = async (id) => {
    // Phase 120: caller is either the URL-driven useEffect or an explicit
    // navigate('/dashboard/marketplace/<id>') from a card click handler.
    // On failure we navigate back to list rather than calling setSelectedId(null).
    setDetailLoading(true);
    try {
      const [d, pc] = await Promise.all([
        challengeAPI.getDetail(id),
        challengeAPI.profileCheck(),
      ]);
      setDetail(d);
      setProfilePct(pc.profile_pct);
    } catch (err) { toast.error(err.message); navigate('/dashboard/marketplace'); }
    finally { setDetailLoading(false); }
  };

  const loadMyApps = async () => {
    setAppsLoading(true);
    try { const d = await challengeAPI.getMyApplications(); setMyApps(d); }
    catch { toast.error('Failed to load applications'); }
    finally { setAppsLoading(false); }
  };

  const handleSearch = () => { loadChallenges(1, search, filters, sort, challengeType); };
  const handleSort = (val) => { setSort(val); loadChallenges(1, search, filters, val, challengeType); };
  const handleChallengeType = (val) => { setChallengeType(val); loadChallenges(1, search, filters, sort, val); };
  const clearFilters = () => {
    const empty = { sector: '', technology: '', usecase: '', location: '', company: '' };
    setFilters(empty);
    setSort('');
    setChallengeType('');
    loadChallenges(1, search, empty, '', '');
  };

  const submitApplication = async () => {
    setApplying(true);
    try {
      if (editMode) {
        await challengeAPI.updateMyApplication(selectedId, applyForm);
        toast.success('Application updated successfully!');
      } else {
        await challengeAPI.apply(selectedId, applyForm);
        toast.success('Application submitted successfully!');
      }
      setShowApply(false);
      setEditMode(false);
      setApplyForm({ pitch: '', proposal_url: '', rfi_answers: {}, data_room: [] });
      openDetail(selectedId); // refresh
    } catch (err) { toast.error(err.message); }
    finally { setApplying(false); }
  };

  // Bug 4: open the apply form pre-populated with the user's existing application.
  const startEditApplication = () => {
    const a = detail?.my_application || {};
    const parse = (v, fallback) => {
      if (v == null) return fallback;
      if (typeof v === 'string') { try { return JSON.parse(v); } catch { return fallback; } }
      return v;
    };
    setApplyForm({
      pitch: a.pitch || '',
      proposal_url: a.proposal_url || '',
      rfi_answers: parse(a.rfi_answers, {}),
      data_room: parse(a.data_room, []),
    });
    setEditMode(true);
    setShowApply(true);
  };

  // ── Detail View ─────────────────────────────────────────────
  if (selectedId) {
    if (detailLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Loader2 size={28} className="animate-spin" style={{ color: G }} /></div>;
    if (!detail) return null;

    const rfiQuestions = (() => { try { return typeof detail.rfi_questions === 'string' ? JSON.parse(detail.rfi_questions) : (detail.rfi_questions || []); } catch { return []; } })();
    const faqs = (() => { try { return typeof detail.faqs === 'string' ? JSON.parse(detail.faqs) : (detail.faqs || []); } catch { return []; } })();
    const minPct = detail.min_profile_pct || 25;

    // Bug 4: shared apply/edit form — used for both new applications and editing an existing one.
    const applyFormJsx = (
      <div>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 14 }}>{editMode ? 'Edit Application' : 'Submit Application'}</h3>
        <div style={{ display: 'grid', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 4, display: 'block' }}>Your Pitch *</label>
            <textarea placeholder="Describe how your solution addresses the challenge..." rows={4} value={applyForm.pitch}
              onChange={e => setApplyForm(p => ({ ...p, pitch: e.target.value }))}
              style={{ width: '100%', padding: '10px 14px', fontSize: 16, border: '1px solid #e5e7eb', borderRadius: 10, outline: 'none', background: '#f9fafb', resize: 'vertical', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 4, display: 'block' }}>Proposal / Pitch Deck URL</label>
            <input type="url" placeholder="https://..." value={applyForm.proposal_url}
              onChange={e => setApplyForm(p => ({ ...p, proposal_url: e.target.value }))}
              style={{ width: '100%', padding: '10px 14px', fontSize: 16, border: '1px solid #e5e7eb', borderRadius: 10, outline: 'none', background: '#f9fafb', boxSizing: 'border-box' }} />
          </div>

          {/* RFI Questions */}
          {rfiQuestions.length > 0 && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#333', marginBottom: 8, display: 'block' }}>
                <FileText size={12} style={{ verticalAlign: -2, marginRight: 4 }} />Request for Information
              </label>
              <div style={{ display: 'grid', gap: 12 }}>
                {rfiQuestions.map(q => (
                  <div key={q.id} style={{ border: '1px solid #f0f0f0', borderRadius: 10, padding: 14 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 6, display: 'block' }}>{q.question}</label>
                    {q.type === 'mcq' ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {(q.options || []).map(opt => (
                          <button key={opt} type="button" onClick={() => setApplyForm(p => ({ ...p, rfi_answers: { ...p.rfi_answers, [q.id]: opt } }))}
                            style={{ padding: '6px 14px', fontSize: 12, borderRadius: 8, border: `1px solid ${applyForm.rfi_answers[q.id] === opt ? G : '#e5e7eb'}`, background: applyForm.rfi_answers[q.id] === opt ? '#fdf6e9' : '#fff', color: applyForm.rfi_answers[q.id] === opt ? '#92700a' : '#666', cursor: 'pointer', fontWeight: applyForm.rfi_answers[q.id] === opt ? 600 : 400 }}>
                            {opt}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <textarea rows={2} placeholder="Your answer..." value={applyForm.rfi_answers[q.id] || ''}
                        onChange={e => setApplyForm(p => ({ ...p, rfi_answers: { ...p.rfi_answers, [q.id]: e.target.value } }))}
                        style={{ width: '100%', padding: '8px 12px', fontSize: 16, border: '1px solid #e5e7eb', borderRadius: 8, outline: 'none', background: '#f9fafb', resize: 'vertical', boxSizing: 'border-box' }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Supporting Documents — always available so applicants can attach multiple files. */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#333', marginBottom: 8, display: 'block' }}>
              <Upload size={12} style={{ verticalAlign: -2, marginRight: 4 }} />Supporting Documents
            </label>
            <p style={{ fontSize: 11, color: '#888', marginBottom: 8, marginTop: 0 }}>Attach any supporting files — pitch deck, solution video, client testimonials, financials, certifications, etc. Upload a file or paste a URL. Add as many as you need.</p>
              {applyForm.data_room.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <select value={item.type} onChange={e => {
                    const updated = [...applyForm.data_room];
                    updated[i] = { ...updated[i], type: e.target.value };
                    setApplyForm(p => ({ ...p, data_room: updated }));
                  }} style={{ padding: '8px 10px', fontSize: 16, borderRadius: 8, border: '1px solid #e5e7eb', background: '#f9fafb', minWidth: 140 }}>
                    <option value="pitch_deck">Pitch Deck</option>
                    <option value="solution_video">Solution Video</option>
                    <option value="client_testimonial">Client Testimonial</option>
                    <option value="financial_data">Financial Data</option>
                    <option value="certifications">Certifications</option>
                    <option value="other">Other</option>
                  </select>
                  <FileUpload compact value={item.url} onChange={url => {
                    const updated = [...applyForm.data_room];
                    updated[i] = { ...updated[i], url };
                    setApplyForm(p => ({ ...p, data_room: updated }));
                  }} folder="data_room" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.mp4,.mov" />
                  <button onClick={() => setApplyForm(p => ({ ...p, data_room: p.data_room.filter((_, j) => j !== i) }))}
                    style={{ padding: '6px 8px', borderRadius: 8, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', cursor: 'pointer' }}><X size={14} /></button>
                </div>
              ))}
            <button onClick={() => setApplyForm(p => ({ ...p, data_room: [...p.data_room, { type: 'pitch_deck', url: '', name: '' }] }))}
              style={{ fontSize: 12, color: G, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>+ Add Document</button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
            <button onClick={() => { setShowApply(false); setEditMode(false); }} style={{ padding: '8px 16px', fontSize: 13, borderRadius: 8, background: '#f3f4f6', color: '#555', border: 'none', cursor: 'pointer' }}>Cancel</button>
            <button onClick={submitApplication} disabled={applying || !applyForm.pitch.trim()}
              style={{ padding: '8px 24px', fontSize: 13, fontWeight: 600, borderRadius: 8, background: applyForm.pitch.trim() ? G : '#e5e7eb', color: applyForm.pitch.trim() ? '#fff' : '#999', border: 'none', cursor: applyForm.pitch.trim() ? 'pointer' : 'default' }}>
              {applying ? <Loader2 size={14} className="animate-spin" /> : (editMode ? 'Save Changes' : 'Submit Application')}
            </button>
          </div>
        </div>
      </div>
    );

    return (
      <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
        <button onClick={() => navigate('/dashboard/marketplace')}
          style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#888', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 16 }}>
          <ChevronLeft size={16} /> Back to Marketplace
        </button>

        {/* Challenge header */}
        <div style={{ ...card, padding: 24, marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 16 }}>
            {detail.corporate_logo ? (
              <img src={detail.corporate_logo} alt="" style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'contain', background: '#fff', padding: 4 }} />
            ) : (
              <div style={{ width: 48, height: 48, borderRadius: 10, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Building2 size={22} style={{ color: '#aaa' }} /></div>
            )}
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', margin: '0 0 4px' }}>{detail.title}</h2>
              <div style={{ fontSize: 13, color: '#666' }}>
                {detail.company_name || detail.corporate_name || detail.organization_name}
                {detail.corporate_city && <span style={{ marginLeft: 8, color: '#999' }}><MapPin size={11} style={{ verticalAlign: -2 }} /> {detail.corporate_city}</span>}
              </div>
            </div>
          </div>

          {/* Meta info */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 12, color: '#666', marginBottom: 14 }}>
            {detail.budget_range && <span><DollarSign size={12} style={{ verticalAlign: -2 }} /> {detail.budget_range}</span>}
            {detail.timeline && <span><Clock size={12} style={{ verticalAlign: -2 }} /> {detail.timeline}</span>}
            {detail.deadline && <span><Calendar size={12} style={{ verticalAlign: -2 }} /> Deadline: {new Date(detail.deadline).toLocaleDateString()}</span>}
            {detail.location && <span><MapPin size={12} style={{ verticalAlign: -2 }} /> {detail.location}</span>}
            <span><Users size={12} style={{ verticalAlign: -2 }} /> {detail.application_count || 0} applicants</span>
          </div>

          {/* Tags */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {(detail.sectors || []).map(t => <span key={t} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: '#eff6ff', color: '#2563eb' }}>{t}</span>)}
            {(detail.technologies || []).map(t => <span key={t} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: '#fefce8', color: '#ca8a04' }}>{t}</span>)}
            {(detail.usecases || []).map(t => <span key={t} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: '#f0fdf4', color: '#16a34a' }}>{t}</span>)}
          </div>
        </div>

        {/* Problem Statement */}
        {detail.problem_statement && (
          <div style={{ ...card, padding: 20, marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 10 }}>Problem Statement</h3>
            <p style={{ fontSize: 13, color: '#555', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{detail.problem_statement}</p>
          </div>
        )}

        {/* Description */}
        {detail.description && (
          <div style={{ ...card, padding: 20, marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 10 }}>Description</h3>
            <p style={{ fontSize: 13, color: '#555', lineHeight: 1.7, margin: 0 }}>{detail.description}</p>
          </div>
        )}

        {/* FAQs */}
        {faqs.length > 0 && (
          <div style={{ ...card, padding: 20, marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 }}>
              <HelpCircle size={14} style={{ verticalAlign: -2, marginRight: 6 }} />Frequently Asked Questions
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

        {/* Apply Section */}
        <div style={{ ...card, padding: 20, marginBottom: 16 }}>
          {detail.has_applied && !showApply ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckCircle size={18} style={{ color: '#16a34a' }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#16a34a' }}>You have already applied</div>
                  <div style={{ fontSize: 12, color: '#888' }}>
                    Status: {(STATUS_BADGE[detail.my_application?.status] || {}).label || detail.my_application?.status}
                    {' | '}Applied on {new Date(detail.my_application?.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <button onClick={startEditApplication}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', fontSize: 13, fontWeight: 600, borderRadius: 8, background: '#fff', color: G, border: `1px solid ${G}`, cursor: 'pointer' }}>
                <FileText size={14} /> Edit application
              </button>
            </div>
          ) : detail.has_applied ? (
            applyFormJsx
          ) : detail.status !== 'open' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#888' }}>
              <AlertCircle size={18} />
              <span style={{ fontSize: 13 }}>This challenge is no longer accepting applications</span>
            </div>
          ) : (profilePct || 0) < minPct ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertCircle size={18} style={{ color: '#f59e0b' }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#f59e0b' }}>Profile incomplete</div>
                <div style={{ fontSize: 12, color: '#888' }}>Your profile is {profilePct}% complete. Minimum {minPct}% required to apply. Please update your profile first.</div>
              </div>
            </div>
          ) : !showApply ? (
            <button onClick={() => setShowApply(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', fontSize: 14, fontWeight: 600, borderRadius: 10, background: G, color: '#fff', border: 'none', cursor: 'pointer', width: '100%', justifyContent: 'center' }}>
              <Send size={16} /> Apply to this Challenge
            </button>
          ) : (
            applyFormJsx
          )}
        </div>
      </div>
    );
  }

  // ── Browse / My Applications tabs ───────────────────────────
  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      {/* Ship #12 follow-up — tour anchors */}
      <div id="tour-page-marketplace-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>
          <Target size={20} style={{ verticalAlign: -3, marginRight: 8, color: G }} />Innovation Marketplace
        </h1>
        <div id="tour-page-marketplace-tabs" style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => { setTab('browse'); }} style={{ padding: '7px 16px', fontSize: 12, fontWeight: 600, borderRadius: '8px 0 0 8px', border: `1px solid ${tab === 'browse' ? G : '#e5e7eb'}`, background: tab === 'browse' ? G : '#fff', color: tab === 'browse' ? '#fff' : '#666', cursor: 'pointer' }}>Browse</button>
          <button onClick={() => { setTab('applications'); loadMyApps(); }} style={{ padding: '7px 16px', fontSize: 12, fontWeight: 600, borderRadius: '0 8px 8px 0', border: `1px solid ${tab === 'applications' ? G : '#e5e7eb'}`, background: tab === 'applications' ? G : '#fff', color: tab === 'applications' ? '#fff' : '#666', cursor: 'pointer' }}>My Applications</button>
        </div>
      </div>

      {tab === 'applications' ? (
        /* My Applications */
        <div>
          {appsLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Loader2 size={24} className="animate-spin" style={{ color: G }} /></div>
          ) : myApps.length === 0 ? (
            <div style={{ ...card, padding: 40, textAlign: 'center' }}>
              <FileText size={32} style={{ color: '#ddd', marginBottom: 10 }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: '#888' }}>No applications yet</p>
              <p style={{ fontSize: 12, color: '#aaa' }}>Browse challenges and apply to get started</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {myApps.map(app => {
                const st = STATUS_BADGE[app.status] || STATUS_BADGE.applied;
                return (
                  <div key={app.id} style={{ ...card, padding: 16, cursor: 'pointer' }}
                    onClick={() => navigate(`/dashboard/marketplace/${app.challenge_id}`)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', margin: 0 }}>{app.challenge_title}</h3>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: st.bg, color: st.color }}>{st.label}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 14, fontSize: 11, color: '#888' }}>
                      <span><Building2 size={11} style={{ verticalAlign: -2 }} /> {app.company_name || app.corporate_name || app.organization_name}</span>
                      {app.deadline && <span><Calendar size={11} style={{ verticalAlign: -2 }} /> {new Date(app.deadline).toLocaleDateString()}</span>}
                      <span>Applied: {new Date(app.created_at).toLocaleDateString()}</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                      {(app.sectors || []).map(t => <span key={t} style={{ fontSize: 9, padding: '2px 7px', borderRadius: 20, background: '#eff6ff', color: '#2563eb' }}>{t}</span>)}
                      {(app.technologies || []).map(t => <span key={t} style={{ fontSize: 9, padding: '2px 7px', borderRadius: 20, background: '#fefce8', color: '#ca8a04' }}>{t}</span>)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Browse challenges */
        <div>
          {/* Search bar — Ship #12 follow-up tour anchor */}
          <div id="tour-page-marketplace-search" style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
              <input placeholder="Search challenges by title, problem, description..." value={search}
                onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
                style={{ width: '100%', padding: '10px 14px 10px 36px', fontSize: 16, border: '1px solid #e5e7eb', borderRadius: 10, outline: 'none', background: '#f9fafb', boxSizing: 'border-box' }} />
            </div>
            <button onClick={handleSearch} style={{ padding: '10px 18px', fontSize: 13, fontWeight: 600, borderRadius: 10, background: G, color: '#fff', border: 'none', cursor: 'pointer' }}>Search</button>
            <button onClick={() => setShowFilters(!showFilters)} style={{ padding: '10px 14px', fontSize: 13, borderRadius: 10, background: showFilters ? '#fdf6e9' : '#f3f4f6', color: showFilters ? G : '#666', border: `1px solid ${showFilters ? G : '#e5e7eb'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Filter size={14} /> Filters
            </button>
            {/* Sort dropdown */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 4 }}>
              <ArrowUpDown size={14} style={{ color: '#888' }} />
              <select value={sort} onChange={e => handleSort(e.target.value)}
                style={{ padding: '10px 10px', fontSize: 16, borderRadius: 10, border: '1px solid #e5e7eb', background: sort ? '#fdf6e9' : '#f9fafb', color: sort ? '#92700a' : '#555', outline: 'none', cursor: 'pointer', fontWeight: sort ? 600 : 400 }}>
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            {/* Challenge type filter */}
            <select value={challengeType} onChange={e => handleChallengeType(e.target.value)}
              style={{ padding: '10px 10px', fontSize: 16, borderRadius: 10, border: `1px solid ${challengeType ? G : '#e5e7eb'}`, background: challengeType ? '#fdf6e9' : '#f9fafb', color: challengeType ? '#92700a' : '#555', outline: 'none', cursor: 'pointer', fontWeight: challengeType ? 600 : 400 }}>
              {CHALLENGE_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Filters */}
          {showFilters && (
            <div style={{ ...card, padding: 16, marginBottom: 16 }}>
              {/* Mobile Ship 1 (27 May 2026): auto-fit so 3 dropdowns stack on mobile */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#555', marginBottom: 4, display: 'block' }}>Sector</label>
                  <select value={filters.sector} onChange={e => setFilters(p => ({ ...p, sector: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', fontSize: 16, borderRadius: 8, border: '1px solid #e5e7eb', background: '#f9fafb' }}>
                    <option value="">All Sectors</option>
                    {taxonomy.sectors.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#555', marginBottom: 4, display: 'block' }}>Technology</label>
                  <select value={filters.technology} onChange={e => setFilters(p => ({ ...p, technology: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', fontSize: 16, borderRadius: 8, border: '1px solid #e5e7eb', background: '#f9fafb' }}>
                    <option value="">All Technologies</option>
                    {taxonomy.technologies.filter(t => t.level === 0).map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#555', marginBottom: 4, display: 'block' }}>Use Case</label>
                  <select value={filters.usecase} onChange={e => setFilters(p => ({ ...p, usecase: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', fontSize: 16, borderRadius: 8, border: '1px solid #e5e7eb', background: '#f9fafb' }}>
                    <option value="">All Use Cases</option>
                    {taxonomy.usecases.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginBottom: 10 }}>
                <input placeholder="Filter by location..." value={filters.location} onChange={e => setFilters(p => ({ ...p, location: e.target.value }))}
                  style={{ padding: '8px 12px', fontSize: 16, borderRadius: 8, border: '1px solid #e5e7eb', background: '#f9fafb', outline: 'none' }} />
                <input placeholder="Filter by company..." value={filters.company} onChange={e => setFilters(p => ({ ...p, company: e.target.value }))}
                  style={{ padding: '8px 12px', fontSize: 16, borderRadius: 8, border: '1px solid #e5e7eb', background: '#f9fafb', outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => loadChallenges(1, search, filters, sort, challengeType)} style={{ padding: '7px 16px', fontSize: 12, fontWeight: 600, borderRadius: 8, background: G, color: '#fff', border: 'none', cursor: 'pointer' }}>Apply Filters</button>
                <button onClick={clearFilters} style={{ padding: '7px 16px', fontSize: 12, borderRadius: 8, background: '#f3f4f6', color: '#666', border: 'none', cursor: 'pointer' }}>Clear</button>
              </div>
            </div>
          )}

          {/* Facet chips */}
          {Object.keys(facets.sector || {}).length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {Object.entries(facets.sector).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, count]) => (
                <button key={name} onClick={() => { setFilters(p => ({ ...p, sector: p.sector === name ? '' : name })); loadChallenges(1, search, { ...filters, sector: filters.sector === name ? '' : name }, sort, challengeType); }}
                  style={{ padding: '4px 12px', fontSize: 11, borderRadius: 20, border: `1px solid ${filters.sector === name ? G : '#e5e7eb'}`, background: filters.sector === name ? '#fdf6e9' : '#fff', color: filters.sector === name ? '#92700a' : '#666', cursor: 'pointer', fontWeight: filters.sector === name ? 600 : 400 }}>
                  {name} <span style={{ color: '#bbb', marginLeft: 3 }}>{count}</span>
                </button>
              ))}
            </div>
          )}
          {Object.keys(facets.challenge_type || {}).length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {Object.entries(facets.challenge_type).map(([type, count]) => (
                <button key={type} onClick={() => handleChallengeType(challengeType === type ? '' : type)}
                  style={{ padding: '4px 12px', fontSize: 11, borderRadius: 20, border: `1px solid ${challengeType === type ? G : '#e5e7eb'}`, background: challengeType === type ? '#fdf6e9' : '#fff', color: challengeType === type ? '#92700a' : '#666', cursor: 'pointer', fontWeight: challengeType === type ? 600 : 400, textTransform: 'capitalize' }}>
                  {type} <span style={{ color: '#bbb', marginLeft: 3 }}>{count}</span>
                </button>
              ))}
            </div>
          )}

          {/* Results count */}
          <div style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>
            {loading ? 'Loading...' : `${total} challenge${total !== 1 ? 's' : ''} found`}
          </div>

          {/* Challenge cards */}
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Loader2 size={24} className="animate-spin" style={{ color: G }} /></div>
          ) : challenges.length === 0 ? (
            <div style={{ ...card, padding: 40, textAlign: 'center' }}>
              <Target size={32} style={{ color: '#ddd', marginBottom: 10 }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: '#888' }}>No open challenges found</p>
              <p style={{ fontSize: 12, color: '#aaa' }}>Try adjusting your search or filters</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {challenges.map(ch => (
                <div key={ch.id} style={{ ...card, padding: 18, cursor: 'pointer' }}
                  onClick={() => navigate(`/dashboard/marketplace/${ch.id}`)}
                  onMouseEnter={e => e.currentTarget.style.borderColor = G}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#eee'}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    {ch.corporate_logo ? (
                      <img src={ch.corporate_logo} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'contain', background: '#fff', padding: 4, flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 40, height: 40, borderRadius: 8, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Building2 size={18} style={{ color: '#bbb' }} /></div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Phase 101 Sub-E: Invited chip on marketplace card — gold pill next to title */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', margin: 0, lineHeight: 1.3 }}>{ch.title}</h3>
                        {ch.visibility === 'invite_only' && (
                          <span style={{
                            fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 12,
                            background: `${G}20`, color: '#5a4715', border: `1px solid ${G}`,
                          }} title="You were invited to this private challenge">
                            ★ Invited
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>
                        {ch.company_name || ch.corporate_name || ch.organization_name}
                        {ch.location && <span style={{ marginLeft: 8 }}><MapPin size={10} style={{ verticalAlign: -2 }} /> {ch.location}</span>}
                      </div>
                      {ch.problem_statement && (
                        <p style={{ fontSize: 12, color: '#666', lineHeight: 1.5, margin: '0 0 8px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {ch.problem_statement}
                        </p>
                      )}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 11, color: '#999', marginBottom: 6 }}>
                        {ch.budget_range && <span><DollarSign size={11} style={{ verticalAlign: -2 }} /> {ch.budget_range}</span>}
                        {ch.timeline && <span><Clock size={11} style={{ verticalAlign: -2 }} /> {ch.timeline}</span>}
                        {ch.deadline && <span><Calendar size={11} style={{ verticalAlign: -2 }} /> {new Date(ch.deadline).toLocaleDateString()}</span>}
                        <span><Users size={11} style={{ verticalAlign: -2 }} /> {ch.application_count || 0} applicants</span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {(ch.sectors || []).map(t => <span key={t} style={{ fontSize: 9, padding: '2px 7px', borderRadius: 20, background: '#eff6ff', color: '#2563eb' }}>{t}</span>)}
                        {(ch.technologies || []).map(t => <span key={t} style={{ fontSize: 9, padding: '2px 7px', borderRadius: 20, background: '#fefce8', color: '#ca8a04' }}>{t}</span>)}
                        {(ch.usecases || []).map(t => <span key={t} style={{ fontSize: 9, padding: '2px 7px', borderRadius: 20, background: '#f0fdf4', color: '#16a34a' }}>{t}</span>)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {total > 20 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
              <button disabled={page <= 1} onClick={() => loadChallenges(page - 1, search, filters, sort, challengeType)}
                style={{ padding: '7px 16px', fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb', background: page <= 1 ? '#f9fafb' : '#fff', color: page <= 1 ? '#ccc' : '#555', cursor: page <= 1 ? 'default' : 'pointer' }}>Previous</button>
              <span style={{ padding: '7px 12px', fontSize: 12, color: '#888' }}>Page {page} of {Math.ceil(total / 20)}</span>
              <button disabled={page >= Math.ceil(total / 20)} onClick={() => loadChallenges(page + 1, search, filters, sort, challengeType)}
                style={{ padding: '7px 16px', fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb', background: page >= Math.ceil(total / 20) ? '#f9fafb' : '#fff', color: page >= Math.ceil(total / 20) ? '#ccc' : '#555', cursor: page >= Math.ceil(total / 20) ? 'default' : 'pointer' }}>Next</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
