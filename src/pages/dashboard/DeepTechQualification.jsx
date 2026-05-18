import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { deeptechAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import {
  Zap, CheckCircle2, Circle, ChevronRight, ChevronDown,
  Award, AlertTriangle, Info, BarChart3, ArrowRight,
  Cpu, FlaskConical, Globe, Shield, Microscope, Rocket,
} from 'lucide-react';

const G = '#D5AA5B';
const GH = '#C9983F';

const card = {
  background: '#ffffff',
  border: '1px solid #eeeeee',
  borderRadius: 14,
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
};

// DeepTech qualification criteria per RFP sec 1.2
const SECTIONS = [
  {
    id: 'technology',
    label: 'Technology Depth',
    icon: Cpu,
    color: '#7c3aed',
    questions: [
      { id: 'q1', text: 'Is the core technology based on original R&D or novel IP developed by the startup?', weight: 3 },
      { id: 'q2', text: 'Does the technology involve cutting-edge fields such as AI/ML, Quantum, Biotech, Nanotechnology, Advanced Materials, or Space Tech?', weight: 3 },
      { id: 'q3', text: 'Is the technology currently at Tech Readiness Level 4 or above (demonstrated in lab / relevant environment)?', weight: 2 },
      { id: 'q4', text: 'Has the technology been validated through peer-reviewed research, patents, or independent testing?', weight: 2 },
    ],
  },
  {
    id: 'innovation',
    label: 'Innovation & Differentiation',
    icon: FlaskConical,
    color: '#0284c7',
    questions: [
      { id: 'q5', text: 'Does the startup address a problem that has no commercially available solution?', weight: 2 },
      { id: 'q6', text: 'Is the technology differentiated from existing solutions by a factor of 10x or more in performance, cost, or capability?', weight: 3 },
      { id: 'q7', text: 'Has the startup filed or received patents, trade secrets, or other formal IP protections?', weight: 2 },
    ],
  },
  {
    id: 'team',
    label: 'Technical Team Capability',
    icon: Microscope,
    color: '#16a34a',
    questions: [
      { id: 'q8',  text: 'Does the founding/core team have PhDs, post-doctoral researchers, or domain experts with 10+ years of relevant experience?', weight: 2 },
      { id: 'q9',  text: 'Has the team published research in internationally recognised journals or conferences in the last 3 years?', weight: 2 },
      { id: 'q10', text: 'Is the startup associated with or spun out from an academic institution, national lab, or research organisation?', weight: 1 },
    ],
  },
  {
    id: 'defence',
    label: 'Defence & Dual-Use Relevance',
    icon: Shield,
    color: '#dc2626',
    questions: [
      { id: 'q11', text: 'Is the technology directly applicable to one or more of OpenI\'s thrust areas (e.g., AI, cyber, quantum, materials, biodefence, space)?', weight: 3 },
      { id: 'q12', text: 'Does the technology have dual-use potential (both civilian and defence applications)?', weight: 2 },
      { id: 'q13', text: 'Has the startup previously worked with government agencies, defence establishments, or strategic sector clients?', weight: 1 },
    ],
  },
  {
    id: 'scalability',
    label: 'Scalability & Commercialisation',
    icon: Rocket,
    color: '#ea580c',
    questions: [
      { id: 'q14', text: 'Does the startup have a clear path to scaling production or deployment within 18–24 months?', weight: 2 },
      { id: 'q15', text: 'Is there demonstrable market demand or a signed LOI/MOU from a potential customer?', weight: 1 },
      { id: 'q16', text: 'Has the startup raised institutional funding (seed, Series A, government grant, or strategic investment)?', weight: 1 },
    ],
  },
];

const OPTIONS = [
  { value: 'yes',     label: 'Yes',     color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  { value: 'partial', label: 'Partial', color: G,          bg: '#fff8ec', border: 'rgba(213,170,91,0.4)' },
  { value: 'no',      label: 'No',      color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  { value: 'na',      label: 'N/A',     color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
];

const SCORE_MAP = { yes: 1, partial: 0.5, no: 0, na: null };

function calcScore(answers) {
  let totalWeight = 0, earned = 0;
  SECTIONS.forEach(sec => {
    sec.questions.forEach(q => {
      const ans = answers[q.id];
      const val = SCORE_MAP[ans];
      if (val !== null && val !== undefined && ans !== 'na') {
        totalWeight += q.weight;
        earned += val * q.weight;
      }
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
        const normalized = items.map(a => ({
          name: a.startup_name || a.name || '',
          score: a.score || 0,
          verdict: a.verdict || a.result || (a.score >= 70 ? 'Qualified as DeepTech' : a.score >= 50 ? 'Conditionally Qualified' : 'Does Not Qualify'),
          date: a.created_at ? new Date(a.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : a.date || '',
        }));
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

  return (
    <div style={{ padding: 28, maxWidth: 1100, background: '#f5f5f5', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, color: '#1a1a1a', fontSize: 22, fontWeight: 700 }}>DeepTech Qualification</h1>
          <p style={{ margin: '4px 0 0', color: '#888', fontSize: 13 }}>Qualify startups as DeepTech using structured criteria across 5 dimensions</p>
        </div>
        {mode === 'list' && (
          <button
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
              return (
                <div key={r.name + i} style={{ padding: '13px 22px', borderBottom: i < recentAssessments.length - 1 ? '1px solid #f5f5f5' : 'none', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
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
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Assessment form */}
      {mode === 'assess' && !submitted && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>
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
                  fontSize: 14,
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
                  .then(() => {
                    toast.success('Assessment submitted successfully');
                    setRecentAssessments(prev => [{ name: startupName.trim(), score, verdict: verdict.label, date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }, ...prev]);
                    setSubmitted(true);
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
                let tw = 0, earned = 0;
                sec.questions.forEach(q => {
                  const val = SCORE_MAP[answers[q.id]];
                  if (val !== null && val !== undefined && answers[q.id] !== 'na') {
                    tw += q.weight; earned += val * q.weight;
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
          </div>
        </div>
      )}
    </div>
  );
}
