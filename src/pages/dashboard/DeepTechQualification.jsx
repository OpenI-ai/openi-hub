import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { deeptechAPI, deeptechShareAPI, getToken } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import { DEEPTECH_SECTIONS, DEEPTECH_OPTIONS, DEEPTECH_SCORE_MAP } from '../../config/deeptechSections';
import {
  Zap, CheckCircle2, Circle, ChevronRight, ChevronDown,
  Award, AlertTriangle, BarChart3, ArrowRight,
  Cpu, FlaskConical, Shield, Microscope, Rocket,
  // Phase 111 Ship 2a icons
  Share2, FileDown, Globe,
} from 'lucide-react';

const G = '#D0A848';
const GH = '#C9983F';

const card = {
  background: '#ffffff',
  border: '1px solid #eeeeee',
  borderRadius: 14,
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
};

// DeepTech qualification criteria per RFP sec 1.2.
// Question text + weights live in the dependency-free shared config
// (src/config/deeptechSections.js) so the public share page can reuse them.
// Section icon + color are presentation-only and re-attached here locally.
const SECTION_PRESENTATION = {
  technology:  { icon: Cpu,          color: '#7c3aed' },
  innovation:  { icon: FlaskConical, color: '#0284c7' },
  team:        { icon: Microscope,   color: '#16a34a' },
  defence:     { icon: Shield,       color: '#dc2626' },
  scalability: { icon: Rocket,       color: '#ea580c' },
};

const SECTIONS = DEEPTECH_SECTIONS.map((s) => ({
  ...s,
  ...(SECTION_PRESENTATION[s.id] || {}),
}));

const OPTIONS = DEEPTECH_OPTIONS;

const SCORE_MAP = DEEPTECH_SCORE_MAP;

function calcScore(answers) {
  // Phase 89.6 (T29) — full denominator. Unanswered = 0 contribution, weight
  // still counts. 'na' is intentionally excluded from denominator (it means
  // "this question doesn't apply to my startup"), so an N/A row reduces the
  // total possible score rather than penalising as a zero. Empty / undefined
  // answers (user hasn't picked yet) DO count their weight in the denominator
  // — score reflects fraction of the full assessment completed at "Yes".
  let totalWeight = 0, earned = 0;
  SECTIONS.forEach(sec => {
    sec.questions.forEach(q => {
      const ans = answers[q.id];
      if (ans === 'na') return; // skip — reduces denominator
      totalWeight += q.weight;
      const val = SCORE_MAP[ans];
      if (val !== null && val !== undefined) {
        earned += val * q.weight;
      }
      // else: unanswered question — earned stays at 0, but weight counts
    });
  });
  if (totalWeight === 0) return 0;
  return Math.round((earned / totalWeight) * 100);
}

function getVerdict(score) {
  if (score >= 70) return { label: 'Qualified as DeepTech',    color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0',              icon: Award };
  if (score >= 50) return { label: 'Conditionally Qualified',  color: G,          bg: '#fff8ec', border: 'rgba(213,170,91,0.4)', icon: AlertTriangle };
  return               { label: 'Does Not Qualify',           color: '#dc2626', bg: '#fef2f2', border: '#fecaca',              icon: AlertTriangle };
}

// RECENT assessments are loaded from API

export default function DeepTechQualification() {
  const [mode, setMode]       = useState('list'); // 'list' | 'assess'
  const [answers, setAnswers] = useState({});
  const [startupName, setStartupName] = useState('');
  const [expanded, setExpanded] = useState({ technology: true });
  const [submitted, setSubmitted] = useState(false);

  // Phase 111 Ship 2a: Share modal state
  const [savedAssessmentId, setSavedAssessmentId] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareTab, setShareTab] = useState('pdf');
  const [shareList, setShareList] = useState([]);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareMinting, setShareMinting] = useState(false);
  const [recentAssessments, setRecentAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Phase 89.5 (T28 follow-up) — auto-fill startup name for startup persona
  // so the most common case (user assessing their own startup) skips the
  // redundant manual entry. nameInputRef lets the disabled-click handler
  // scroll + focus the field when gate fails.
  const { user } = useAuth();
  const nameInputRef = useRef(null);
  useEffect(() => {
    if (mode !== 'assess') return;
    if (startupName.trim()) return; // user already typed something
    if (user?.role === 'startup') {
      const auto = (user.organization_name || user.name || '').trim();
      if (auto) setStartupName(auto);
    }
  }, [mode, user?.role, user?.organization_name, user?.name]);

  useEffect(() => {
    deeptechAPI.list()
      .then(data => {
        const items = data.assessments || data.deeptech_assessments || data || [];
        const normalized = items.map(a => {
          // score column is PG NUMERIC(5,2) → pg driver returns it as a STRING
          // (e.g. "95.00"). Coerce to a real number so the Avg Score stat and
          // the >=70/>=50 verdict comparisons don't NaN / string-compare.
          const numScore = Number(a.score) || 0;
          return {
            id: a.id,
            name: a.startup_name || a.name || '',
            score: numScore,
            verdict: a.verdict || a.result || (numScore >= 70 ? 'Qualified as DeepTech' : numScore >= 50 ? 'Conditionally Qualified' : 'Does Not Qualify'),
            date: a.created_at ? new Date(a.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : a.date || '',
          };
        });
        setRecentAssessments(normalized);
      })
      .catch(err => { toast.error(err.message || 'Failed to load assessments'); setRecentAssessments([]); })
      .finally(() => setLoading(false));
  }, []);

  const score   = calcScore(answers);
  const verdict = getVerdict(score);
  const VIcon   = verdict.icon;

  const answeredCount = Object.keys(answers).filter(k => answers[k]).length;
  const totalQ = SECTIONS.reduce((s, sec) => s + sec.questions.length, 0);

  const reset = () => { setAnswers({}); setStartupName(''); setSubmitted(false); setMode('list'); };

  // Open an existing assessment from the Recent Assessments list. Fetches the
  // full row (incl. stored answers JSONB) and pre-fills the assess form so the
  // user can review and re-run the qualification. NOTE: re-submitting records a
  // fresh assessment (there is no in-place update endpoint yet), so this is a
  // "review & re-assess" flow rather than a destructive edit.
  const [loadingId, setLoadingId] = useState(null);
  const loadAssessment = async (id) => {
    if (!id || loadingId) return;
    setLoadingId(id);
    try {
      const a = await deeptechAPI.get(id);
      setAnswers(a?.answers && typeof a.answers === 'object' ? a.answers : {});
      setStartupName(a?.startup_name || a?.name || '');
      setSubmitted(false);
      setMode('assess');
    } catch (err) {
      toast.error(err?.message || 'Failed to open assessment');
    } finally {
      setLoadingId(null);
    }
  };

  // Phase 111 Ship 2a: Share handlers
  const openShareModal = async () => {
    if (!savedAssessmentId) return;
    setShareOpen(true);
    setShareTab('pdf');
    setShareLoading(true);
    try {
      const r = await deeptechShareAPI.listShares(savedAssessmentId);
      setShareList(Array.isArray(r) ? r : []);
    } catch (err) {
      setShareList([]);
    } finally {
      setShareLoading(false);
    }
  };

  const downloadDeepTechPdf = async () => {
    try {
      const url = deeptechShareAPI.pdfUrl(savedAssessmentId);
      const res = await fetch(url, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (!res.ok) throw new Error('PDF download failed');
      const blob = await res.blob();
      const dlUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = dlUrl;
      a.download = `deeptech-${savedAssessmentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(dlUrl);
      toast.success('PDF downloaded');
    } catch (err) {
      toast.error(err.message || 'Failed to download PDF');
    }
  };

  const mintNewDeepTechShare = async () => {
    setShareMinting(true);
    try {
      const r = await deeptechShareAPI.createShare(savedAssessmentId, {});
      setShareList(prev => [r, ...prev]);
      toast.success('Share link created');
    } catch (err) {
      toast.error(err?.message || 'Failed to create share');
    } finally {
      setShareMinting(false);
    }
  };

  const copyDeepTechLink = async (token) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/share/deeptech/${token}`);
      toast.success('Link copied');
    } catch {
      toast.error('Copy failed');
    }
  };

  const revokeDeepTechShare = async (shareId) => {
    if (!confirm('Revoke this share link?')) return;
    try {
      await deeptechShareAPI.revokeShare(shareId);
      setShareList(prev => prev.map(s => s.id === shareId ? { ...s, revoked_at: new Date().toISOString() } : s));
      toast.success('Revoked');
    } catch (err) {
      toast.error(err?.message || 'Failed to revoke');
    }
  };

  return (
    <div style={{ padding: 28, maxWidth: 1100, background: '#f5f5f5', minHeight: '100%' }}>
      {/* Header */}
      <div id="tour-page-deeptech-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, color: '#1a1a1a', fontSize: 22, fontWeight: 700 }}>DeepTech Qualification</h1>
          <p style={{ margin: '4px 0 0', color: '#888', fontSize: 13 }}>Qualify startups as DeepTech using structured criteria across 5 dimensions</p>
        </div>
        {mode === 'list' && (
          <button id="tour-page-deeptech-assess"
            onClick={() => setMode('assess')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: G, color: '#fff', border: 'none', borderRadius: 9, cursor: 'pointer', fontSize: 13, fontWeight: 700, boxShadow: '0 2px 10px rgba(213,170,91,0.3)' }}
            onMouseEnter={e => e.currentTarget.style.background = GH}
            onMouseLeave={e => e.currentTarget.style.background = G}
          >
            <Zap size={14} /> New Assessment
          </button>
        )}
        {mode === 'assess' && !submitted && (
          <button onClick={() => setMode('list')} style={{ padding: '7px 14px', background: '#f5f5f5', color: '#555', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            ← Back
          </button>
        )}
      </div>

      {/* List view */}
      {mode === 'list' && loading && <LoadingSkeleton type="table" />}

      {mode === 'list' && !loading && (
        <>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 22 }}>
            {[
              { label: 'Assessments Done', value: recentAssessments.length, icon: BarChart3, bg: '#fff8ec', fg: G },
              { label: 'Qualified',        value: recentAssessments.filter(r => r.verdict === 'Qualified as DeepTech').length, icon: Award, bg: '#f0fdf4', fg: '#16a34a' },
              { label: 'Conditional',      value: recentAssessments.filter(r => r.verdict === 'Conditionally Qualified').length, icon: AlertTriangle, bg: '#fff8ec', fg: '#ea580c' },
              { label: 'Avg Score',        value: recentAssessments.length > 0 ? Math.round(recentAssessments.reduce((s, r) => s + r.score, 0) / recentAssessments.length) + '%' : '0%', icon: Zap, bg: '#f0f9ff', fg: '#0284c7' },
            ].map(({ label, value, icon: Icon, bg, fg }) => (
              <div key={label} style={{ ...card, padding: 16 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                  <Icon size={15} color={fg} />
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a' }}>{value}</div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Recent assessments */}
          <div style={{ ...card, overflow: 'hidden' }}>
            <div style={{ padding: '14px 22px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, color: '#1a1a1a', fontSize: 14, fontWeight: 600 }}>Recent Assessments</h3>
              <button onClick={() => setMode('assess')} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: G, background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                New <ArrowRight size={12} />
              </button>
            </div>
            {recentAssessments.map((r, i) => {
              const v = getVerdict(r.score);
              const VI = v.icon;
              const clickable = !!r.id;
              return (
                <div
                  key={(r.id || r.name) + '-' + i}
                  onClick={clickable ? () => loadAssessment(r.id) : undefined}
                  role={clickable ? 'button' : undefined}
                  tabIndex={clickable ? 0 : undefined}
                  onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); loadAssessment(r.id); } } : undefined}
                  title={clickable ? 'Click to review this assessment' : undefined}
                  onMouseEnter={clickable ? (e) => { e.currentTarget.style.background = '#fafafa'; } : undefined}
                  onMouseLeave={clickable ? (e) => { e.currentTarget.style.background = 'transparent'; } : undefined}
                  style={{ padding: '13px 22px', borderBottom: i < recentAssessments.length - 1 ? '1px solid #f5f5f5' : 'none', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', cursor: clickable ? 'pointer' : 'default', background: 'transparent', transition: 'background 0.12s', opacity: loadingId && loadingId === r.id ? 0.55 : 1 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(213,170,91,0.12)', color: G, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, border: '1px solid rgba(213,170,91,0.2)', flexShrink: 0 }}>{r.name[0]}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#1a1a1a', fontSize: 13, fontWeight: 600 }}>{r.name}</div>
                    <div style={{ color: '#888', fontSize: 11 }}>{r.date}</div>
                  </div>
                  {/* Score bar */}
                  <div style={{ minWidth: 120 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: '#888' }}>Score</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: v.color }}>{r.score}%</span>
                    </div>
                    <div style={{ height: 5, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${r.score}%`, height: '100%', background: v.color, borderRadius: 3 }} />
                    </div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: v.bg, color: v.color, border: `1px solid ${v.border}`, display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                    <VI size={10} />{v.label}
                  </span>
                  {clickable && <ChevronRight size={16} color="#ccc" style={{ flexShrink: 0 }} />}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Assessment form */}
      {mode === 'assess' && !submitted && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          <div>
            {/* Phase 89.5 (T28 follow-up) — startup name as a prominent
                required field at top of form. Gold border + red asterisk
                signal "fill me in first" so users don't miss it. */}
            <div style={{
              ...card,
              padding: 20,
              marginBottom: 16,
              border: startupName.trim() ? `1.5px solid ${G}` : '2px solid #d97706',
              background: startupName.trim() ? '#fff' : '#fffbeb',
              transition: 'border-color 0.2s, background 0.2s',
            }}>
              <label style={{ display: 'block', color: '#1a1a1a', fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
                Startup to assess <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                ref={nameInputRef}
                value={startupName}
                onChange={e => setStartupName(e.target.value)}
                placeholder="Enter the startup name being assessed"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '12px 14px',
                  background: '#fff',
                  border: `1.5px solid ${startupName.trim() ? '#e0e0e0' : '#d97706'}`,
                  borderRadius: 10,
                  fontSize: 16,
                  outline: 'none',
                  color: '#1a1a1a',
                  transition: 'border-color 0.15s',
                  fontWeight: 500,
                }}
                onFocus={e => e.target.style.borderColor = G}
                onBlur={e => e.target.style.borderColor = startupName.trim() ? '#e0e0e0' : '#d97706'}
              />
              {!startupName.trim() && (
                <p style={{ margin: '8px 0 0', color: '#92400e', fontSize: 12, fontWeight: 500 }}>
                  Required — Submit will be disabled until you enter a name.
                </p>
              )}
            </div>

            {/* Sections */}
            {SECTIONS.map(sec => {
              const SIcon = sec.icon;
              const isOpen = expanded[sec.id] !== false;
              const sectionAnswered = sec.questions.filter(q => answers[q.id]).length;
              return (
                <div key={sec.id} style={{ ...card, marginBottom: 14, overflow: 'hidden' }}>
                  <div
                    onClick={() => setExpanded(p => ({ ...p, [sec.id]: !isOpen }))}
                    style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', borderBottom: isOpen ? '1px solid #f5f5f5' : 'none' }}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: `${sec.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <SIcon size={15} color={sec.color} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{sec.label}</div>
                      <div style={{ fontSize: 11, color: '#888' }}>{sectionAnswered}/{sec.questions.length} answered</div>
                    </div>
                    {/* Section progress */}
                    <div style={{ width: 60, height: 4, background: '#f0f0f0', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: `${(sectionAnswered / sec.questions.length) * 100}%`, height: '100%', background: sec.color, borderRadius: 2 }} />
                    </div>
                    {isOpen ? <ChevronDown size={14} color="#aaa" /> : <ChevronRight size={14} color="#aaa" />}
                  </div>
                  {isOpen && (
                    <div style={{ padding: '10px 20px 16px' }}>
                      {sec.questions.map((q, qi) => (
                        <div key={q.id} style={{ marginBottom: qi < sec.questions.length - 1 ? 18 : 0, paddingBottom: qi < sec.questions.length - 1 ? 18 : 0, borderBottom: qi < sec.questions.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
                            <div style={{ minWidth: 20, height: 20, borderRadius: '50%', background: answers[q.id] ? '#f0fdf4' : '#f8fafc', border: `1.5px solid ${answers[q.id] ? '#16a34a' : '#e2e8f0'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1, flexShrink: 0 }}>
                              {answers[q.id]
                                ? <CheckCircle2 size={11} color="#16a34a" />
                                : <Circle size={11} color="#ddd" />
                              }
                            </div>
                            <div style={{ flex: 1 }}>
                              <span style={{ fontSize: 13, color: '#1a1a1a', lineHeight: 1.5 }}>{q.text}</span>
                              <span style={{ fontSize: 10, color: '#aaa', marginLeft: 8 }}>Weight: {q.weight}x</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingLeft: 28 }}>
                            {OPTIONS.map(opt => (
                              <button key={opt.value} onClick={() => setAnswers(p => ({ ...p, [q.id]: opt.value }))} style={{
                                padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                border: `1.5px solid ${answers[q.id] === opt.value ? opt.color : '#eee'}`,
                                background: answers[q.id] === opt.value ? opt.bg : '#fff',
                                color: answers[q.id] === opt.value ? opt.color : '#888',
                                transition: 'all 0.15s',
                              }}>
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            <button
              onClick={() => {
                // Phase 89.5 (T28 follow-up) — if gates are unmet, point the
                // user at the missing field instead of silently doing nothing.
                if (!startupName.trim()) {
                  toast.error('Please enter a startup name first.');
                  if (nameInputRef.current) {
                    nameInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setTimeout(() => nameInputRef.current?.focus(), 350);
                  }
                  return;
                }
                if (answeredCount < totalQ * 0.8) {
                  toast.error(`Please answer at least ${Math.ceil(totalQ * 0.8)} questions before submitting.`);
                  return;
                }
                // Phase 98 (T28) — setSubmitted moved INSIDE .then() so the
                // success view only renders after the backend confirms. On
                // error, stay on the form so the user can retry.
                deeptechAPI.create({ startup_name: startupName.trim(), score, verdict: verdict.label, answers })
                  .then((res) => {
                    toast.success('Assessment submitted successfully');
                    setRecentAssessments(prev => [{ name: startupName.trim(), score, verdict: verdict.label, date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }, ...prev]);
                    setSubmitted(true);
                    if (res?.id) setSavedAssessmentId(res.id);  // Phase 111 Ship 2a — enable Share
                  })
                  .catch(err => toast.error(err.message || 'Failed to submit assessment'));
              }}
              style={{
                width: '100%', padding: '13px 0', background: (answeredCount >= totalQ * 0.8 && startupName.trim()) ? G : '#e0e0e0',
                color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700,
                cursor: (answeredCount >= totalQ * 0.8 && startupName.trim()) ? 'pointer' : 'not-allowed',
                boxShadow: (answeredCount >= totalQ * 0.8 && startupName.trim()) ? '0 2px 12px rgba(213,170,91,0.35)' : 'none',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (answeredCount >= totalQ * 0.8 && startupName.trim()) e.currentTarget.style.background = GH; }}
              onMouseLeave={e => { if (answeredCount >= totalQ * 0.8 && startupName.trim()) e.currentTarget.style.background = G; }}
            >
              Submit Qualification Assessment
            </button>
            {(answeredCount < totalQ * 0.8 || !startupName.trim()) && (
              <p style={{ textAlign: 'center', color: '#aaa', fontSize: 12, marginTop: 8 }}>
                {!startupName.trim() && answeredCount < totalQ * 0.8
                  ? `Enter a startup name above and answer at least ${Math.ceil(totalQ * 0.8)} questions to submit (${answeredCount}/${totalQ} answered)`
                  : !startupName.trim()
                  ? 'Enter a startup name above to submit'
                  : `Please answer at least ${Math.ceil(totalQ * 0.8)} questions to submit (${answeredCount}/${totalQ} answered)`}
              </p>
            )}
          </div>

          {/* Live score sidebar */}
          <div style={{ alignSelf: 'start', position: 'sticky', top: 20 }}>
            <div style={{ ...card, padding: 20, marginBottom: 14 }}>
              <h3 style={{ margin: '0 0 16px', color: '#1a1a1a', fontSize: 13, fontWeight: 700 }}>Live Score</h3>
              {/* Circular-ish score */}
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 40, fontWeight: 800, color: score >= 70 ? '#16a34a' : score >= 50 ? G : '#dc2626', lineHeight: 1 }}>{score}%</div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>DeepTech Score</div>
                {/* Phase 89.6 (T29) — surface the "partial assessment" signal so users
                    understand the score will rise as they answer more questions. */}
                {answeredCount < totalQ && (
                  <div style={{ fontSize: 10, color: '#d97706', marginTop: 6, fontWeight: 600 }}>
                    Provisional — {answeredCount} of {totalQ} answered
                  </div>
                )}
              </div>
              <div style={{ height: 8, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden', marginBottom: 14 }}>
                <div style={{ width: `${score}%`, height: '100%', background: score >= 70 ? '#16a34a' : score >= 50 ? G : '#dc2626', borderRadius: 4, transition: 'width 0.4s ease' }} />
              </div>
              <div style={{ padding: '10px 14px', borderRadius: 10, background: verdict.bg, border: `1px solid ${verdict.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                <VIcon size={14} color={verdict.color} />
                <span style={{ fontSize: 12, fontWeight: 700, color: verdict.color }}>{verdict.label}</span>
              </div>
              <div style={{ marginTop: 14, fontSize: 11, color: '#aaa' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>Answered</span><span style={{ color: '#1a1a1a', fontWeight: 600 }}>{answeredCount}/{totalQ}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Threshold</span><span style={{ color: '#16a34a', fontWeight: 600 }}>70%</span>
                </div>
              </div>
            </div>

            {/* Per-section scores */}
            <div style={{ ...card, padding: 18 }}>
              <h3 style={{ margin: '0 0 14px', color: '#1a1a1a', fontSize: 12, fontWeight: 700 }}>Section Breakdown</h3>
              {SECTIONS.map(sec => {
                const SIcon = sec.icon;
                // Phase 89.6 (T29) — same full-denominator math as calcScore.
                let tw = 0, earned = 0;
                sec.questions.forEach(q => {
                  const ans = answers[q.id];
                  if (ans === 'na') return; // skip — reduces denominator
                  tw += q.weight;
                  const val = SCORE_MAP[ans];
                  if (val !== null && val !== undefined) {
                    earned += val * q.weight;
                  }
                });
                const pct = tw > 0 ? Math.round((earned / tw) * 100) : 0;
                return (
                  <div key={sec.id} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <SIcon size={10} color={sec.color} />
                      <span style={{ fontSize: 11, color: '#555', flex: 1 }}>{sec.label}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: sec.color }}>{pct}%</span>
                    </div>
                    <div style={{ height: 4, background: '#f0f0f0', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: sec.color, borderRadius: 2, transition: 'width 0.3s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Result screen */}
      {mode === 'assess' && submitted && (
        <div style={{ ...card, padding: 40, textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: verdict.bg, border: `2px solid ${verdict.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <VIcon size={28} color={verdict.color} />
          </div>
          <h2 style={{ margin: '0 0 8px', color: '#1a1a1a', fontSize: 22, fontWeight: 800 }}>{startupName || 'Startup'}</h2>
          <div style={{ fontSize: 40, fontWeight: 800, color: verdict.color, marginBottom: 8 }}>{score}%</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: verdict.color, marginBottom: 20 }}>{verdict.label}</div>
          <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginBottom: 28 }}>
            {[
              { label: 'Threshold', value: '70%', color: '#16a34a' },
              { label: 'Your Score', value: `${score}%`, color: verdict.color },
              { label: 'Questions', value: `${answeredCount}/${totalQ}`, color: '#1a1a1a' },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <div style={{ fontSize: 20, fontWeight: 700, color }}>{value}</div>
                <div style={{ fontSize: 11, color: '#aaa' }}>{label}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={reset} style={{ padding: '10px 22px', background: G, color: '#fff', border: 'none', borderRadius: 9, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
              Done
            </button>
            <button onClick={() => { setSubmitted(false); }} style={{ padding: '10px 22px', background: '#f5f5f5', color: '#555', border: 'none', borderRadius: 9, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              Review Answers
            </button>
            {/* Phase 111 Ship 2a: Share button — only if assessment was saved */}
            {savedAssessmentId && (
              <button onClick={() => openShareModal()} style={{ padding: '10px 22px', background: '#fff8ec', color: G, border: `1.5px solid ${G}`, borderRadius: 9, cursor: 'pointer', fontSize: 13, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Share2 size={14} /> Share Report
              </button>
            )}
          </div>
        </div>
      )}
      {/* Phase 111 Ship 2a: Share modal */}
      {shareOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={(e) => { if (e.target === e.currentTarget) setShareOpen(false); }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 560, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>Share DeepTech Assessment</h2>
              <button onClick={() => setShareOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: 4 }}>×</button>
            </div>

            {/* Tab strip */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 18, borderBottom: '1.5px solid #eee' }}>
              {[
                { id: 'pdf', icon: <FileDown size={13} />, label: 'Download PDF' },
                { id: 'link', icon: <Globe size={13} />, label: 'Public link' },
              ].map(t => (
                <button key={t.id} onClick={() => setShareTab(t.id)}
                  style={{ padding: '10px 14px', fontSize: 12, fontWeight: 700, background: 'none', border: 'none',
                           borderBottom: shareTab === t.id ? `2.5px solid ${G}` : '2.5px solid transparent',
                           marginBottom: -1.5, color: shareTab === t.id ? G : '#666', cursor: 'pointer',
                           display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            {shareTab === 'pdf' && (
              <div>
                <p style={{ fontSize: 12, color: '#666', margin: '0 0 14px', lineHeight: 1.6 }}>
                  Branded PDF of this DeepTech assessment with score, verdict, and per-question answers.
                </p>
                <button onClick={() => downloadDeepTechPdf()}
                  style={{ width: '100%', padding: '11px 18px', background: G, color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <FileDown size={14} /> Download DeepTech PDF
                </button>
              </div>
            )}

            {shareTab === 'link' && (
              <div>
                <p style={{ fontSize: 12, color: '#666', margin: '0 0 14px', lineHeight: 1.6 }}>
                  Create a link anyone can use to view this assessment (no OpenI account needed). Default 30-day expiry; revocable anytime.
                </p>
                <button onClick={() => mintNewDeepTechShare()} disabled={shareMinting}
                  style={{ width: '100%', padding: '10px 16px', background: G, color: '#fff', border: 'none', borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: shareMinting ? 'not-allowed' : 'pointer', marginBottom: 16, opacity: shareMinting ? 0.6 : 1 }}>
                  {shareMinting ? 'Creating…' : '+ Create new share link'}
                </button>

                {shareLoading ? (
                  <p style={{ color: '#888', fontSize: 12, textAlign: 'center', margin: '14px 0' }}>Loading…</p>
                ) : shareList.length === 0 ? (
                  <p style={{ color: '#888', fontSize: 12, fontStyle: 'italic', margin: 0, textAlign: 'center', padding: '12px 0' }}>No share links yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
                    {shareList.map(s => {
                      const expired = s.expires_at && new Date(s.expires_at) < new Date();
                      const revoked = !!s.revoked_at;
                      const inactive = expired || revoked;
                      const shareUrl = `${window.location.origin}/share/deeptech/${s.token}`;
                      return (
                        <div key={s.id} style={{ padding: 10, borderRadius: 8, background: inactive ? '#fafafa' : '#fff8ec', border: `1px solid ${inactive ? '#eee' : 'rgba(213,170,91,0.3)'}`, opacity: inactive ? 0.6 : 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: revoked ? '#fef2f2' : (expired ? '#fef9e7' : '#f0fdf4'), color: revoked ? '#dc2626' : (expired ? '#a16207' : '#16a34a') }}>
                              {revoked ? 'REVOKED' : (expired ? 'EXPIRED' : 'ACTIVE')}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: 6, background: '#fff', borderRadius: 6, border: '1px solid #eee', fontSize: 10, fontFamily: 'monospace' }}>
                            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#555' }}>{shareUrl}</span>
                            {!inactive && (
                              <>
                                <button onClick={() => copyDeepTechLink(s.token)} style={{ padding: '3px 7px', background: '#f3f4f6', border: '1px solid #ddd', borderRadius: 5, fontSize: 9, fontWeight: 600, color: '#555', cursor: 'pointer' }}>Copy</button>
                                <button onClick={() => revokeDeepTechShare(s.id)} style={{ padding: '3px 7px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 5, fontSize: 9, fontWeight: 600, color: '#dc2626', cursor: 'pointer' }}>Revoke</button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
