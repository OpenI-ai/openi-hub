import { useState, useMemo, useEffect } from "react";
import toast from 'react-hot-toast';
import { eightVectorSelfAPI, startupAPI, getToken } from '../../services/api';
import {
  Users, Target, TrendingUp, Cpu, DollarSign,
  BarChart2, Shield, Zap, ChevronDown, ChevronUp,
  MessageSquare, Building2, Calendar, Download, Save,
  Share2, FileDown, Globe, X, ChevronRight,  // Phase 111 Ship 2c icons added
  Sparkles, Link2,                            // s93: AI draft + startup link
} from "lucide-react";

// ─── 8 VECTOR DATA ─────────────────────────────────────────────────────────────
const VECTORS = [
  {
    id: 1, key: "people", name: "People", shortName: "People", Icon: Users,
    hex: "#a78bfa",
    desc: "People-centric culture fostering engagement, preserving respect for the individual while driving collective thriving.",
    criteria: [
      "Articulated Values", "Policies & Processes", "Employee Engagement", "ESOP",
      "Compensation", "Hiring & Retention", "Succession Planning & Growth",
      "Learning Management", "Career Paths & Recognition",
      "HR Management Systems", "Performance Management", "Audits",
      "Sexual Harassment Policy",
    ],
  },
  {
    id: 2, key: "strategic", name: "Strategic Direction", shortName: "Strategic", Icon: Target,
    hex: "#60a5fa",
    desc: "Clarity of purpose / mission, well-articulated business choices & non-choices, business model development.",
    criteria: [
      "Mission, Vision & Objectives & Key Results (OKRs)", "3-Year Plan", "Annual Operating Plan", "Quarterly Review",
      "Technology & Trend Awareness", "New Products", "New Geographies",
      "Joint Ventures", "Business Environmental Factors",
    ],
  },
  {
    id: 3, key: "revenue", name: "Revenue Management", shortName: "Revenue", Icon: TrendingUp,
    hex: "#34d399",
    desc: "Tight alignment of market, customer, product, sales and support mix critical for business success.",
    criteria: [
      "Product Management (MRD/PRD)", "Market Mapping", "Business Research",
      "Competition Analysis", "Market Model", "Product Offering",
      "Contracting Model", "Pricing Model", "Unit Economics", "Revenue Model",
      "Sales Organization", "Sales Process Map", "Quote-to-Cash Cycle",
      "Sales Funnel", "Sales Force Tools", "CRM Tools",
      "Customer Service Management", "Invoicing Velocity", "Collection Systems",
      "Advertising", "Market Research", "Consumer Research", "Marketing",
      "UX Monitoring", "SG&A Monitoring", "Conferences & Publications",
    ],
  },
  {
    id: 4, key: "technology", name: "Technology", shortName: "Technology", Icon: Cpu,
    hex: "#22d3ee",
    desc: "Creating an economic moat through effective innovation, differentiation, engineering and service delivery.",
    criteria: [
      "Product Formula / Core IP", "Product Engineering Maturity",
      "Manufacturing Process Maturity", "R&D Effectiveness / Gross Margin Strategy",
      "Product Testing Effectiveness", "Health, Safety & Environment", "Security",
      "Energy, Water & Carbon Positive", "Operations & Maintenance",
      "Regulated Areas for Product", "Customer Complaint Management",
      "Community Participation", "Vendor & Supplier Management",
    ],
  },
  {
    id: 5, key: "financials", name: "Financials", shortName: "Financials", Icon: DollarSign,
    hex: "#fbbf24",
    desc: "Financial rigor and discipline to manage unit economics, profitability and capital efficiency.",
    criteria: [
      "Commercial Process (Cash Flow, T&Cs)", "Financial Reporting (P&L, Balance Sheet)",
      "Unit Economics", "Financial Model", "Expense Accounting",
      "Vendor Selection & Management", "Vendor Payments", "Collections",
      "Inventory", "Taxes", "Banking", "Financing", "Revenue Billing",
      "Legal", "Secretarial", "Audit", "Working Capital", "Capex",
    ],
  },
  {
    id: 6, key: "information", name: "Information Visibility", shortName: "Info Visibility", Icon: BarChart2,
    hex: "#38bdf8",
    desc: "A data-driven decision-making culture, planning & review cycle, augmenting key workflows with automation.",
    criteria: [
      "Data Protection, DR & Archival", "Security & Privacy of Data",
      "Revenue Metrics", "Operational Metrics",
      "QHSE Metrics (Quality, Health, Safety & Env.)", "Financial Metrics",
    ],
  },
  {
    id: 7, key: "grc", name: "Governance, Risk & Compliance", shortName: "GRC", Icon: Shield,
    hex: "#f87171",
    desc: "Ensuring accountability & business continuity through effective corporate governance and risk mitigation.",
    criteria: [
      "Board Meetings", "Risk Management Framework",
      "Succession Planning for Key Positions", "Business Continuity Plan",
      "Compliance Reports", "Shareholder Meetings", "Investor Relations",
      "Government Interface", "Regulator Interface", "Environmental Matters",
      "Social Interface", "Corporate Communications & PR",
      "Industry Bodies Representation", "Information Security", "CSR",
    ],
  },
  {
    id: 8, key: "stepchange", name: "Step Change", shortName: "Step Change", Icon: Zap,
    hex: "#d4a843",
    desc: "Enabling step change through sequential financing, M&A, new products, customers and markets.",
    criteria: [
      "Fundraise", "Mergers & Acquisitions", "Investor Relations",
      "Joint Venture", "Alliance & Partnership",
      "New Products / Services", "New Market Penetration",
    ],
  },
];

const STATUS_OPTS = [
  { value: "", label: "Select status" },
  { value: "in_place", label: "In Place" },
  { value: "very_good", label: "Very Good" },
  { value: "good", label: "Good" },
  { value: "can_be_better", label: "Can Be Better" },
  { value: "planning", label: "Planning in Process" },
  { value: "not_required", label: "Not Required Now" },
];

const STATUS_COLORS = {
  in_place: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
  very_good: "bg-green-500/15 text-green-400 border border-green-500/30",
  good: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
  can_be_better: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
  planning: "bg-orange-500/15 text-orange-400 border border-orange-500/30",
  not_required: "bg-gray-500/15 text-gray-400 border border-gray-500/30",
};

// ─── RADAR CHART ───────────────────────────────────────────────────────────────
function RadarChart({ vectorScores }) {
  const cx = 170, cy = 170, maxR = 120;
  const n = 8;
  const angles = Array.from({ length: n }, (_, i) =>
    -Math.PI / 2 + (i * 2 * Math.PI) / n
  );
  const pt = (angle, r) => [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];

  const dataPoints = VECTORS.map((v, i) => {
    const score = vectorScores[v.key] || 0;
    return pt(angles[i], (score / 5) * maxR);
  });

  const dataPath = dataPoints
    .map(([x, y], i) => (i === 0 ? `M${x.toFixed(1)},${y.toFixed(1)}` : `L${x.toFixed(1)},${y.toFixed(1)}`))
    .join(" ") + " Z";

  const gridLevels = [1, 2, 3, 4, 5];

  return (
    <svg viewBox="0 0 340 340" className="w-full max-w-[280px] mx-auto">
      {/* Grid rings */}
      {gridLevels.map(level => {
        const r = (level / 5) * maxR;
        const gridPts = angles.map(a => pt(a, r));
        const gPath = gridPts
          .map(([x, y], i) => (i === 0 ? `M${x.toFixed(1)},${y.toFixed(1)}` : `L${x.toFixed(1)},${y.toFixed(1)}`))
          .join(" ") + " Z";
        return (
          <path key={level} d={gPath} fill="none"
            stroke={level === 5 ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.07)"}
            strokeWidth="1"
          />
        );
      })}
      {/* Grid level labels */}
      {gridLevels.map(level => {
        const [x, y] = pt(-Math.PI / 2, (level / 5) * maxR);
        return (
          <text key={level} x={x + 4} y={y} fill="rgba(255,255,255,0.25)"
            fontSize="8" fontFamily="Inter, sans-serif" dominantBaseline="middle">
            {level}
          </text>
        );
      })}
      {/* Axis lines */}
      {angles.map((a, i) => {
        const [x, y] = pt(a, maxR);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y}
          stroke="rgba(255,255,255,0.1)" strokeWidth="1" />;
      })}
      {/* Data fill */}
      <path d={dataPath} fill="rgba(212,168,67,0.18)" stroke="#d4a843"
        strokeWidth="2" strokeLinejoin="round" />
      {/* Data dots */}
      {dataPoints.map(([x, y], i) => (
        (vectorScores[VECTORS[i].key] || 0) > 0 && (
          <circle key={i} cx={x} cy={y} r="4"
            fill={VECTORS[i].hex} stroke="#111115" strokeWidth="1.5" />
        )
      ))}
      {/* Labels */}
      {VECTORS.map((v, i) => {
        const labelR = maxR + 26;
        const [x, y] = pt(angles[i], labelR);
        const tol = 8;
        const anchor = x < cx - tol ? "end" : x > cx + tol ? "start" : "middle";
        return (
          <text key={i} x={x} y={y} textAnchor={anchor} dominantBaseline="middle"
            fill="rgba(255,255,255,0.55)" fontSize="9.5"
            fontFamily="Inter, sans-serif" fontWeight="500">
            {v.shortName}
          </text>
        );
      })}
    </svg>
  );
}

// ─── SCORE BAND ────────────────────────────────────────────────────────────────
function scoreBand(s) {
  if (!s) return { label: "—", cls: "text-gray-400", color: "#6e6e6e" };
  if (s >= 4.5) return { label: "Excellent", cls: "text-emerald-600", color: "#16a34a" };
  if (s >= 3.5) return { label: "Good", cls: "text-lime-600", color: "#65a30d" };
  if (s >= 2.5) return { label: "Developing", cls: "text-amber-600", color: "#d97706" };
  return { label: "Needs Work", cls: "text-red-600", color: "#dc2626" };
}

// ─── VECTOR CARD ───────────────────────────────────────────────────────────────
function VectorCard({ vector, scores, onScore, statuses, onStatus, comments, onComment }) {
  const [expanded, setExpanded] = useState(true);
  const [openComments, setOpenComments] = useState({});

  const criteriaScores = vector.criteria.map((_, i) => scores[`${vector.key}_${i}`]);
  const scoredCount = criteriaScores.filter(s => s != null).length;
  const avgScore = useMemo(() => {
    const vals = criteriaScores.filter(s => s != null);
    return vals.length > 0 ? (vals.reduce((a, b) => a + b, 0) / vals.length) : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- criteriaScores is fully derived from scores + vector.key, which are the listed deps
  }, [scores, vector.key]);

  const progress = (scoredCount / vector.criteria.length) * 100;
  const { Icon } = vector;

  return (
    <div style={{ background:"#fff", border:"1px solid #eeeeee", borderRadius:14, overflow:"hidden", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
      {/* Card header */}
      <button
        onClick={() => setExpanded(e => !e)}
        style={{ width:"100%", display:"flex", alignItems:"center", gap:14, padding:"18px 20px", background:"none", border:"none", cursor:"pointer", transition:"background 0.15s", textAlign:"left" }}
        onMouseEnter={e => e.currentTarget.style.background="#fafafa"}
        onMouseLeave={e => e.currentTarget.style.background="none"}
      >
        <div style={{ width:40, height:40, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, backgroundColor: vector.hex + "22", color: vector.hex }}>
          <Icon className="w-5 h-5" />
        </div>
        <div style={{ flex:1, textAlign:"left" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
            <h3 style={{ margin:0, fontSize:14, fontWeight:600, color:"#1a1a1a" }}>
              {vector.id}. {vector.name}
            </h3>
            {avgScore != null && (
              <span style={{ fontSize:12, fontWeight:700, padding:"2px 8px", borderRadius:20, background: vector.hex + "18", border:`1px solid ${vector.hex}44`, color: vector.hex }}>
                {avgScore.toFixed(2)} / 5
              </span>
            )}
          </div>
          <div style={{ marginTop:8, display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ flex:1, height:4, background:"#f0f0f0", borderRadius:4, overflow:"hidden" }}>
              <div style={{ width:`${progress}%`, height:"100%", borderRadius:4, transition:"width 0.5s ease", backgroundColor: vector.hex + "cc" }} />
            </div>
            <span style={{ fontSize:11, color:"#6e6e6e", flexShrink:0 }}>{scoredCount}/{vector.criteria.length}</span>
          </div>
        </div>
        <div style={{ color:"#bbb", flexShrink:0 }}>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Criteria list */}
      {expanded && (
        <div style={{ borderTop:"1px solid #f0f0f0" }}>
          {/* Description */}
          <p style={{ margin:0, padding:"10px 20px", fontSize:12, color:"#5c5c5c", fontStyle:"italic", borderBottom:"1px solid #f5f5f5" }}>
            {vector.desc}
          </p>
          {/* Column headers — hidden on mobile (SE1: score row wraps below label on small screens) */}
          <div className="hidden sm:grid" style={{ padding:"8px 20px", gridTemplateColumns:"1fr auto auto", alignItems:"center", gap:14, borderBottom:"1px solid #f5f5f5" }}>
            <span style={{ fontSize:11, fontWeight:600, color:"#bbb", textTransform:"uppercase", letterSpacing:"0.05em" }}>Criterion</span>
            <span style={{ fontSize:11, fontWeight:600, color:"#bbb", textTransform:"uppercase", letterSpacing:"0.05em", textAlign:"center", width:180 }}>Score (1–5)</span>
            <span style={{ fontSize:11, fontWeight:600, color:"#bbb", textTransform:"uppercase", letterSpacing:"0.05em" }}>Note</span>
          </div>
          {vector.criteria.map((criterion, idx) => {
            const scoreKey = `${vector.key}_${idx}`;
            const currentScore = scores[scoreKey];
            const statusVal = statuses[scoreKey] || "";
            const commentVal = comments[scoreKey] || "";
            const showComment = openComments[idx];

            return (
              <div key={idx} style={{ borderBottom:"1px solid #f8f8f8" }}>
                {/* SE1: stacks vertically on mobile (label above score row); 3-col grid at sm+ */}
                <div className="flex flex-col sm:grid sm:items-center" style={{ padding:"10px 20px", gridTemplateColumns:"1fr auto auto", gap:14 }}>
                  {/* Name */}
                  <div>
                    <span style={{ fontSize:13, color:"#333" }}>{criterion}</span>
                    {statusVal && (
                      <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${STATUS_COLORS[statusVal]}`}>
                        {STATUS_OPTS.find(o => o.value === statusVal)?.label}
                      </span>
                    )}
                  </div>
                  {/* Score row: buttons + comment toggle. On mobile this sits below the label
                      and spreads full-width; on sm+ the buttons + icon are separate grid cells. */}
                  <div className="flex items-center justify-between sm:contents">
                  {/* Score buttons */}
                  <div style={{ display:"flex", gap:4, flexShrink:0 }}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <button
                        key={n}
                        onClick={() => onScore(scoreKey, currentScore === n ? null : n)}
                        style={{
                          width:32, height:32, borderRadius:8, fontSize:12, fontWeight:700,
                          border: currentScore === n ? "none" : "1.5px solid #e0e0e0",
                          background: currentScore === n ? vector.hex : "#fafafa",
                          color: currentScore === n ? "#fff" : "#999",
                          cursor:"pointer", transition:"all 0.12s",
                        }}
                        onMouseEnter={e => { if (currentScore !== n) { e.currentTarget.style.borderColor = vector.hex; e.currentTarget.style.color = vector.hex; } }}
                        onMouseLeave={e => { if (currentScore !== n) { e.currentTarget.style.borderColor = "#e0e0e0"; e.currentTarget.style.color = "#999"; } }}
                        title={`Score ${n}`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  {/* Comment toggle */}
                  <button
                    onClick={() => setOpenComments(prev => ({ ...prev, [idx]: !prev[idx] }))}
                    style={{ padding:6, borderRadius:8, background:"none", border:"none", cursor:"pointer", color: commentVal ? "#D0A848" : "#ccc", transition:"color 0.15s", flexShrink:0 }}
                    title="Add comment"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                  </div>
                </div>
                {/* Comment + Status expanded row */}
                {showComment && (
                  <div style={{ padding:"0 20px 12px", display:"flex", flexDirection:"row", gap:10, flexWrap:"wrap" }}>
                    <select
                      value={statusVal}
                      onChange={e => onStatus(scoreKey, e.target.value)}
                      style={{ fontSize:16, background:"#fafafa", border:"1.5px solid #e0e0e0", color:"#555", borderRadius:8, padding:"6px 10px", outline:"none", width:200 }}
                    >
                      {STATUS_OPTS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <textarea
                      value={commentVal}
                      onChange={e => onComment(scoreKey, e.target.value)}
                      placeholder="Add notes or observations…"
                      rows={2}
                      style={{ flex:1, minWidth:160, fontSize:16, background:"#fafafa", border:"1.5px solid #e0e0e0", color:"#333", borderRadius:8, padding:"6px 10px", outline:"none", resize:"none" }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function StartupEvaluation() {
  const [startupName, setStartupName] = useState("");
  const [evaluator, setEvaluator] = useState("");
  const [evalDate, setEvalDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [scores, setScores] = useState({});
  const [statuses, setStatuses] = useState({});
  const [comments, setComments] = useState({});

  // Phase 111 Ship 2c: Save + Share state
  const [savedAssessmentId, setSavedAssessmentId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareTab, setShareTab] = useState('pdf');
  const [shareList, setShareList] = useState([]);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareMinting, setShareMinting] = useState(false);
  const [notes, setNotes] = useState('');

  // Phase 111 Ship 2d: past saved assessments (date-wise list for review)
  const [pastAssessments, setPastAssessments] = useState([]);
  const [pastLoading, setPastLoading] = useState(false);
  const [loadingId, setLoadingId] = useState(null);

  // s93: link to a platform startup + AI pre-assessment draft.
  // linkedStartup: { user_id, company_name } | null. aiMeta is the draft's
  // provenance blob, persisted with the assessment so any drafted score is
  // auditable back to the model's raw output. sourceEdited flips the saved
  // `source` from 'ai_draft' to 'ai_reviewed' the moment the analyst touches
  // anything — a client must be able to tell whether a human stands behind it.
  const [linkedStartup, setLinkedStartup] = useState(null);
  const [startupResults, setStartupResults] = useState([]);
  const [startupSearching, setStartupSearching] = useState(false);
  const [aiDrafting, setAiDrafting] = useState(false);
  const [aiMeta, setAiMeta] = useState(null);
  const [sourceEdited, setSourceEdited] = useState(false);

  // Debounced startup search against the platform directory whenever the
  // name input changes without a linked startup selected.
  useEffect(() => {
    if (linkedStartup || startupName.trim().length < 2) { setStartupResults([]); return; }
    const t = setTimeout(async () => {
      setStartupSearching(true);
      try {
        const r = await startupAPI.list({ search: startupName.trim(), limit: 6 });
        setStartupResults(Array.isArray(r?.startups) ? r.startups.filter(s => s.user_id) : []);
      } catch {
        setStartupResults([]);
      } finally {
        setStartupSearching(false);
      }
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- startupAPI is a stable module import
  }, [startupName, linkedStartup]);

  const generateAiDraft = async () => {
    if (!linkedStartup) return;
    const hasScores = Object.values(scores).some(v => v != null);
    if (hasScores && !confirm('Replace the current scores with a fresh AI draft?')) return;
    setAiDrafting(true);
    try {
      const draft = await eightVectorSelfAPI.aiDraft({ startup_user_id: linkedStartup.user_id });
      setScores(draft.criterion_scores || {});
      setStatuses(draft.statuses || {});
      setComments(draft.comments || {});
      setAiMeta(draft.ai_meta || null);
      setSourceEdited(false);
      setSavedAssessmentId(null);
      if (draft.startup_name) setStartupName(draft.startup_name);
      const scored = draft.ai_meta?.scored ?? Object.keys(draft.criterion_scores || {}).length;
      const total = draft.ai_meta?.total_criteria ?? 107;
      toast.success(`AI draft ready — ${scored} of ${total} criteria scored from platform evidence`);
    } catch (err) {
      toast.error(err?.message || 'AI draft failed');
    } finally {
      setAiDrafting(false);
    }
  };

  const refreshPastAssessments = async () => {
    setPastLoading(true);
    try {
      const r = await eightVectorSelfAPI.listMine();
      setPastAssessments(Array.isArray(r) ? r : []);
    } catch {
      setPastAssessments([]);
    } finally {
      setPastLoading(false);
    }
  };

  useEffect(() => { refreshPastAssessments(); }, []);

  // Open a saved assessment back into the form for review / re-assess.
  // There is no in-place update endpoint yet, so re-saving records a fresh row.
  const loadAssessment = async (id) => {
    if (!id) return;
    setLoadingId(id);
    try {
      const a = await eightVectorSelfAPI.get(id);
      setStartupName(a.startup_name || '');
      setScores(a.criterion_scores || {});
      setStatuses(a.statuses || {});
      setComments(a.comments || {});
      setNotes(a.notes || '');
      setSavedAssessmentId(a.id);
      // s93: restore the startup link + AI provenance
      setLinkedStartup(a.startup_user_id ? { user_id: a.startup_user_id, company_name: a.startup_name } : null);
      setAiMeta(a.ai_meta || null);
      setSourceEdited(a.source === 'ai_reviewed');
      if (a.checkpoint_date) setEvalDate(String(a.checkpoint_date).slice(0, 10));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      toast.error(err?.message || 'Failed to load assessment');
    } finally {
      setLoadingId(null);
    }
  };

  // Phase 111 Ship 2c: Save + Share handlers
  const saveAssessment = async () => {
    if (!startupName.trim()) {
      toast.error('Please enter a startup name first');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        startup_name: startupName.trim(),
        vector_scores: vectorScores,
        criterion_scores: scores,
        statuses,
        comments,
        overall_score: overallScore,
        notes: notes.trim() || null,
        // s93: startup link + provenance
        startup_user_id: linkedStartup?.user_id ?? null,
        checkpoint_date: evalDate || null,
        source: aiMeta ? (sourceEdited ? 'ai_reviewed' : 'ai_draft') : 'manual',
        ai_meta: aiMeta,
      };
      const res = await eightVectorSelfAPI.create(payload);
      if (res?.id) {
        setSavedAssessmentId(res.id);
        toast.success('Assessment saved');
        refreshPastAssessments();
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to save assessment');
    } finally {
      setSaving(false);
    }
  };

  const openShareModal = async () => {
    if (!savedAssessmentId) {
      toast.error('Please save the assessment first');
      return;
    }
    setShareOpen(true);
    setShareTab('pdf');
    setShareLoading(true);
    try {
      const r = await eightVectorSelfAPI.listShares(savedAssessmentId);
      setShareList(Array.isArray(r) ? r : []);
    } catch {
      setShareList([]);
    } finally {
      setShareLoading(false);
    }
  };

  const downloadEightVectorPdf = async () => {
    if (!savedAssessmentId) return;
    try {
      const res = await fetch(eightVectorSelfAPI.pdfUrl(savedAssessmentId), { headers: { Authorization: `Bearer ${getToken()}` } });
      if (!res.ok) throw new Error('PDF download failed');
      const blob = await res.blob();
      const dlUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = dlUrl;
      a.download = `8vector-${savedAssessmentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(dlUrl);
      toast.success('PDF downloaded');
    } catch (err) {
      toast.error(err.message || 'Failed to download PDF');
    }
  };

  const mintNewEightVectorShare = async () => {
    setShareMinting(true);
    try {
      const r = await eightVectorSelfAPI.createShare(savedAssessmentId, {});
      setShareList(prev => [r, ...prev]);
      toast.success('Share link created');
    } catch (err) {
      toast.error(err?.message || 'Failed to create share');
    } finally {
      setShareMinting(false);
    }
  };

  const copyEightVectorLink = async (token) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/share/eight-vector-self/${token}`);
      toast.success('Link copied');
    } catch {
      toast.error('Copy failed');
    }
  };

  const revokeEightVectorShare = async (shareId) => {
    if (!confirm('Revoke this share link?')) return;
    try {
      await eightVectorSelfAPI.revokeShare(shareId);
      setShareList(prev => prev.map(s => s.id === shareId ? { ...s, revoked_at: new Date().toISOString() } : s));
      toast.success('Revoked');
    } catch (err) {
      toast.error(err?.message || 'Failed to revoke');
    }
  };


  // s93: any manual touch after an AI draft marks the assessment reviewed.
  const markEdited = () => { if (aiMeta) setSourceEdited(true); };
  const handleScore = (key, val) =>
    { markEdited(); setScores(prev => ({ ...prev, [key]: val })); };
  const handleStatus = (key, val) =>
    { markEdited(); setStatuses(prev => ({ ...prev, [key]: val })); };
  const handleComment = (key, val) =>
    { markEdited(); setComments(prev => ({ ...prev, [key]: val })); };

  const vectorScores = useMemo(() => {
    const result = {};
    VECTORS.forEach(v => {
      const vals = v.criteria
        .map((_, i) => scores[`${v.key}_${i}`])
        .filter(x => x != null);
      result[v.key] = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    });
    return result;
  }, [scores]);

  const overallScore = useMemo(() => {
    const vals = Object.values(vectorScores).filter(v => v > 0);
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  }, [vectorScores]);

  const totalCriteria = VECTORS.reduce((a, v) => a + v.criteria.length, 0);
  const scoredCriteria = Object.values(scores).filter(s => s != null).length;
  const completionPct = Math.round((scoredCriteria / totalCriteria) * 100);

  const { label: overallLabel } = scoreBand(overallScore);

  const inputStyle = {
    background:"#fafafa", border:"1.5px solid #e0e0e0", color:"#333",
    borderRadius:9, padding:"8px 12px", fontSize:16, outline:"none",
    transition:"border-color 0.15s",
  };

  return (
    <div style={{ padding:"24px 28px", maxWidth:1280, minHeight:"100%", background:"#f5f5f5" }}>
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div style={{ marginBottom:24, display:"flex", alignItems:"center", flexWrap:"wrap", gap:14, paddingBottom:20, borderBottom:"1px solid #eeeeee" }}>
        <div>
          <h1 style={{ margin:0, color:"#1a1a1a", fontSize:20, fontWeight:700 }}>8-Vector Startup Evaluation</h1>
          <p style={{ margin:"4px 0 0", color:"#5c5c5c", fontSize:12 }}>OpenI 8-Vector Assessment · {completionPct}% complete</p>
        </div>

        <div style={{ flex:1, display:"flex", alignItems:"center", gap:10, flexWrap:"wrap", justifyContent:"flex-end" }}>
          <div id="tour-page-8vector-name" style={{ position:"relative" }}>
            {linkedStartup ? (
              /* s93: linked-startup chip — the assessment is now ABOUT this
                 platform startup, not a free-text name */
              <div style={{ ...inputStyle, display:"flex", alignItems:"center", gap:6, width:"auto", maxWidth:230, background:"#fff8ec", borderColor:"#D0A848" }}>
                <Link2 style={{ width:13, height:13, color:"#D0A848", flexShrink:0 }} />
                <span style={{ fontSize:13, fontWeight:600, color:"#8a6d2f", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{linkedStartup.company_name}</span>
                <button onClick={() => { setLinkedStartup(null); }} title="Unlink startup"
                  style={{ border:"none", background:"none", cursor:"pointer", padding:0, display:"flex" }}>
                  <X style={{ width:13, height:13, color:"#bba26a" }} />
                </button>
              </div>
            ) : (
              <>
                <Building2 style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"#bbb", width:14, height:14 }} />
                <input type="text" value={startupName} onChange={e => setStartupName(e.target.value)}
                  placeholder="Startup name (search platform)"
                  style={{ ...inputStyle, paddingLeft:30, width:190 }}
                  onFocus={e => e.target.style.borderColor="#D0A848"}
                  onBlur={e => e.target.style.borderColor="#e0e0e0"}
                />
                {/* s93: platform-startup suggestions — picking one links the assessment */}
                {(startupResults.length > 0 || startupSearching) && startupName.trim().length >= 2 && (
                  <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, right:0, zIndex:30, background:"#fff", border:"1px solid #e0e0e0", borderRadius:10, boxShadow:"0 8px 24px rgba(0,0,0,0.12)", overflow:"hidden" }}>
                    {startupSearching && <div style={{ padding:"8px 12px", fontSize:12, color:"#999" }}>Searching…</div>}
                    {startupResults.map(s => (
                      <button key={s.user_id}
                        onClick={() => { setLinkedStartup({ user_id: s.user_id, company_name: s.company_name }); setStartupName(s.company_name || ''); setStartupResults([]); }}
                        style={{ display:"block", width:"100%", textAlign:"left", padding:"8px 12px", border:"none", background:"none", cursor:"pointer", fontSize:13, color:"#333" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#fff8ec"}
                        onMouseLeave={e => e.currentTarget.style.background = "none"}
                      >
                        <span style={{ fontWeight:600 }}>{s.company_name}</span>
                        {s.sector && <span style={{ color:"#999", fontSize:11 }}> · {s.sector}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
          {/* s93: AI pre-assessment draft — enabled once a platform startup is linked */}
          <button
            onClick={generateAiDraft}
            disabled={!linkedStartup || aiDrafting}
            title={linkedStartup ? 'Draft scores from platform evidence — review before saving' : 'Link a platform startup first'}
            style={{
              display:"inline-flex", alignItems:"center", gap:6, padding:"9px 14px",
              background: (!linkedStartup || aiDrafting) ? "#f0f0f0" : "#fff8ec",
              color: (!linkedStartup || aiDrafting) ? "#aaa" : "#D0A848",
              border: `1.5px solid ${(!linkedStartup || aiDrafting) ? "#e0e0e0" : "#D0A848"}`,
              borderRadius:9, fontSize:12, fontWeight:700,
              cursor: (!linkedStartup || aiDrafting) ? "not-allowed" : "pointer",
            }}
          >
            <Sparkles className="w-4 h-4" />
            {aiDrafting ? "Drafting…" : "AI Draft"}
          </button>
          <input type="text" value={evaluator} onChange={e => setEvaluator(e.target.value)}
            placeholder="Evaluator name"
            style={{ ...inputStyle, width:150 }}
            onFocus={e => e.target.style.borderColor="#D0A848"}
            onBlur={e => e.target.style.borderColor="#e0e0e0"}
            className="hidden lg:block"
          />
          <div style={{ position:"relative" }} className="hidden lg:block">
            <Calendar style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"#bbb", width:14, height:14 }} />
            <input type="date" value={evalDate} onChange={e => setEvalDate(e.target.value)}
              style={{ ...inputStyle, paddingLeft:30, width:155, color:"#555" }}
              onFocus={e => e.target.style.borderColor="#D0A848"}
              onBlur={e => e.target.style.borderColor="#e0e0e0"}
            />
          </div>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
          <span style={{ fontSize:12, color:"#5c5c5c" }}>{completionPct}%</span>
          <div style={{ width:80, height:5, background:"#e8e8e8", borderRadius:4, overflow:"hidden" }} className="hidden sm:block">
            <div style={{ width:`${completionPct}%`, height:"100%", background:"#D0A848", borderRadius:4, transition:"width 0.5s" }} />
          </div>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────── */}
      <div style={{ display:"flex", flexDirection:"row", gap:24, flexWrap:"wrap" }}>

        {/* ── LEFT SIDEBAR (sticky) ─────────────────────────────── */}
        <div style={{ width:260, flexShrink:0 }} className="xl:w-64">
          <div style={{ position:"sticky", top:24, display:"flex", flexDirection:"column", gap:16 }}>

            {/* Overall Score Card */}
            <div style={{ background:"#fff", border:"1px solid #eeeeee", borderRadius:14, padding:24, textAlign:"center", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
              <p style={{ margin:"0 0 12px", fontSize:11, fontWeight:600, color:"#bbb", textTransform:"uppercase", letterSpacing:"0.07em" }}>Overall Score</p>
              <div style={{ fontSize:48, fontWeight:800, color:"#1a1a1a", lineHeight:1 }}>
                {overallScore != null ? overallScore.toFixed(2) : "—"}
              </div>
              <div style={{ fontSize:13, fontWeight:600, marginTop:6, color: scoreBand(overallScore).color }}>{overallLabel}</div>
              <div style={{ fontSize:11, color:"#bbb", marginTop:4 }}>out of 5.00</div>
            </div>

            {/* Radar Chart */}
            <div style={{ background:"#fff", border:"1px solid #eeeeee", borderRadius:14, padding:20, boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
              <p style={{ margin:"0 0 16px", fontSize:11, fontWeight:600, color:"#bbb", textTransform:"uppercase", letterSpacing:"0.07em", textAlign:"center" }}>Vector Profile</p>
              <RadarChart vectorScores={vectorScores} />
            </div>

            {/* Vector Summary */}
            <div style={{ background:"#fff", border:"1px solid #eeeeee", borderRadius:14, padding:20, boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
              <p style={{ margin:"0 0 16px", fontSize:11, fontWeight:600, color:"#bbb", textTransform:"uppercase", letterSpacing:"0.07em" }}>Vector Scores</p>
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {VECTORS.map(v => {
                  const s = vectorScores[v.key];
                  const { Icon } = v;
                  const pct = (s / 5) * 100;
                  return (
                    <div key={v.key}>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                          <Icon style={{ width:12, height:12, flexShrink:0, color: v.hex }} />
                          <span style={{ fontSize:11, color:"#555", maxWidth:120, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{v.name}</span>
                        </div>
                        <span style={{ fontSize:11, fontWeight:600, fontVariantNumeric:"tabular-nums", color: s > 0 ? v.hex : "#ccc" }}>
                          {s > 0 ? s.toFixed(2) : "—"}
                        </span>
                      </div>
                      <div style={{ height:4, background:"#f0f0f0", borderRadius:4, overflow:"hidden" }}>
                        <div style={{ width:`${pct}%`, height:"100%", borderRadius:4, transition:"width 0.5s ease", backgroundColor: v.hex + "aa" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT CONTENT (vector cards) ─────────────────────── */}
        <div style={{ flex:1, minWidth:0, display:"flex", flexDirection:"column", gap:14 }}>
          {/* Page intro */}
          <div style={{ marginBottom:4 }}>
            <h2 style={{ margin:"0 0 4px", fontSize:18, fontWeight:700, color:"#1a1a1a" }}>
              {startupName ? `${startupName} — ` : ""}OpenI 8-Vector Assessment
            </h2>
            <p style={{ margin:0, fontSize:13, color:"#5c5c5c" }}>
              Rate each criterion from <strong style={{ color:"#555" }}>1</strong> (poor) to <strong style={{ color:"#555" }}>5</strong> (excellent). Click <MessageSquare style={{ width:13, height:13, display:"inline", verticalAlign:"middle", color:"#bbb" }} /> to add status & notes.
            </p>
          </div>

          {/* s93: AI-draft provenance banner — visible until the draft is superseded */}
          {aiMeta && (
            <div style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"12px 16px", background:"#fff8ec", border:"1.5px solid #ecd9a8", borderRadius:12, fontSize:13, color:"#7a5f28" }}>
              <Sparkles style={{ width:16, height:16, flexShrink:0, marginTop:2, color:"#D0A848" }} />
              <div>
                <strong>AI draft{sourceEdited ? ' (being reviewed)' : ' — not yet reviewed'}.</strong>{' '}
                {aiMeta.scored ?? 0} of {aiMeta.total_criteria ?? 107} criteria scored from platform evidence; unscored criteria had no evidence and are honest gaps, not zeros.
                Unevidenced claims are shrunk toward 2/5, never averaged up. Review every score before saving — your edits mark it analyst-reviewed.
              </div>
            </div>
          )}

          {VECTORS.map(vector => (
            <VectorCard
              key={vector.key}
              vector={vector}
              scores={scores}
              onScore={handleScore}
              statuses={statuses}
              onStatus={handleStatus}
              comments={comments}
              onComment={handleComment}
            />
          ))}

          {/* Footer action */}
          <div style={{ paddingTop:8, display:"flex", justifyContent:"flex-end" }}>
            {/* Phase 111 Ship 2c: Save + Share buttons (replaces window.print Export Report) */}
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              <button
                id="tour-page-8vector-save"
                onClick={saveAssessment}
                disabled={saving || !startupName.trim()}
                style={{
                  display:"inline-flex", alignItems:"center", gap:8,
                  padding:"10px 22px",
                  background: (!startupName.trim() || saving) ? "#ccc" : "#D0A848",
                  color:"#fff", border:"none", borderRadius:10, fontSize:13, fontWeight:700,
                  cursor: (!startupName.trim() || saving) ? "not-allowed" : "pointer",
                  boxShadow: (!startupName.trim() || saving) ? "none" : "0 2px 12px rgba(213,170,91,0.3)",
                  transition:"background 0.15s",
                }}
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : savedAssessmentId ? "Saved" : "Save Assessment"}
              </button>
              {savedAssessmentId && (
                <button
                  onClick={openShareModal}
                  style={{
                    display:"inline-flex", alignItems:"center", gap:8,
                    padding:"10px 22px", background:"#fff8ec", color:"#D0A848",
                    border:"1.5px solid #D0A848", borderRadius:10, fontSize:13, fontWeight:700,
                    cursor:"pointer",
                  }}
                >
                  <Share2 className="w-4 h-4" />
                  Share Report
                </button>
              )}
              <button
                onClick={() => window.print()}
                style={{
                  display:"inline-flex", alignItems:"center", gap:6,
                  padding:"10px 16px", background:"#f5f5f5", color:"#666",
                  border:"none", borderRadius:10, fontSize:12, fontWeight:600,
                  cursor:"pointer",
                }}
                title="Print (browser native)"
              >
                <Download className="w-4 h-4" />
                Print
              </button>
            </div>
          </div>

          {/* Phase 111 Ship 2d: Recent Assessments — date-wise saved list for review */}
          <div style={{ marginTop:18, background:"#fff", border:"1px solid #eee", borderRadius:14, padding:"18px 20px" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
              <h3 style={{ margin:0, fontSize:15, fontWeight:700, color:"#1a1a1a" }}>Recent Assessments</h3>
              <span style={{ fontSize:12, color:"#666" }}>Saved 8-Vector assessments — click a row to review or re-assess</span>
            </div>
            {pastLoading ? (
              <p style={{ margin:0, fontSize:13, color:"#666" }}>Loading…</p>
            ) : pastAssessments.length === 0 ? (
              <p style={{ margin:0, fontSize:13, color:"#666" }}>No saved assessments yet. Score the vectors above and click <strong style={{ color:"#5c5c5c" }}>Save Assessment</strong> to keep one for past review.</p>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {pastAssessments.map(a => {
                  const score = Number(a.overall_score) || 0;
                  const band = scoreBand(score);
                  const created = a.created_at ? new Date(a.created_at) : null;
                  const isLoading = loadingId === a.id;
                  return (
                    <div
                      key={a.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => loadAssessment(a.id)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); loadAssessment(a.id); } }}
                      style={{
                        display:"flex", alignItems:"center", justifyContent:"space-between",
                        gap:12, padding:"10px 14px", borderRadius:10,
                        border:"1px solid #f0f0f0", background: a.id === savedAssessmentId ? "#fff8ec" : "#fafafa",
                        cursor: isLoading ? "wait" : "pointer", opacity: isLoading ? 0.6 : 1,
                        transition:"background 0.12s, border-color 0.12s",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#D0A848"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#f0f0f0"; }}
                    >
                      <div style={{ minWidth:0, flex:1 }}>
                        <div style={{ fontSize:14, fontWeight:600, color:"#1a1a1a", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", display:"flex", alignItems:"center", gap:6 }}>
                          {a.linked_company_name || a.startup_name || "Untitled assessment"}
                          {/* s93: provenance + platform-link chips */}
                          {a.startup_user_id && <Link2 style={{ width:12, height:12, color:"#D0A848", flexShrink:0 }} title="Linked to a platform startup" />}
                          {a.source === 'ai_draft' && <span style={{ fontSize:10, fontWeight:700, padding:"1px 6px", borderRadius:8, background:"#fff8ec", border:"1px solid #ecd9a8", color:"#a8842f", flexShrink:0 }}>AI DRAFT</span>}
                          {a.source === 'ai_reviewed' && <span style={{ fontSize:10, fontWeight:700, padding:"1px 6px", borderRadius:8, background:"#eef7ee", border:"1px solid #bfe0bf", color:"#3d7a3d", flexShrink:0 }}>AI + REVIEWED</span>}
                        </div>
                        <div style={{ fontSize:12, color:"#666", display:"flex", alignItems:"center", gap:5, marginTop:2 }}>
                          <Calendar style={{ width:12, height:12 }} />
                          {a.checkpoint_date ? `Checkpoint ${String(a.checkpoint_date).slice(0, 10)} · ` : ''}
                          {created ? created.toLocaleDateString(undefined, { year:'numeric', month:'short', day:'numeric' }) : "—"}
                          {created && ` · ${created.toLocaleTimeString(undefined, { hour:'2-digit', minute:'2-digit' })}`}
                        </div>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                        <div style={{ textAlign:"right" }}>
                          <div style={{ fontSize:15, fontWeight:700, color:"#1a1a1a" }}>{score ? score.toFixed(2) : "—"}<span style={{ fontSize:11, fontWeight:500, color:"#bbb" }}>/5.00</span></div>
                          <div className={band.cls} style={{ fontSize:11, fontWeight:600 }}>{band.label}</div>
                        </div>
                        <ChevronRight style={{ width:18, height:18, color:"#ccc", flexShrink:0 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Phase 111 Ship 2c: Share modal JSX */}
      {shareOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={(e) => { if (e.target === e.currentTarget) setShareOpen(false); }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 560, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>Share 8-Vector Assessment</h2>
              <button onClick={() => setShareOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6e6e6e', padding: 4 }}>
                <X size={16} />
              </button>
            </div>

            {/* Tab strip */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 18, borderBottom: '1.5px solid #eee' }}>
              {[
                { id: 'pdf', icon: <FileDown size={13} />, label: 'Download PDF' },
                { id: 'link', icon: <Globe size={13} />, label: 'Public link' },
              ].map(t => (
                <button key={t.id} onClick={() => setShareTab(t.id)}
                  style={{ padding: '10px 14px', fontSize: 12, fontWeight: 700, background: 'none', border: 'none',
                           borderBottom: shareTab === t.id ? '2.5px solid #D0A848' : '2.5px solid transparent',
                           marginBottom: -1.5, color: shareTab === t.id ? '#D0A848' : '#666', cursor: 'pointer',
                           display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            {shareTab === 'pdf' && (
              <div>
                <p style={{ fontSize: 12, color: '#666', margin: '0 0 14px', lineHeight: 1.6 }}>
                  Branded PDF with overall score badge + per-vector breakdown + your notes.
                </p>
                <button onClick={downloadEightVectorPdf}
                  style={{ width: '100%', padding: '11px 18px', background: '#D0A848', color: '#0D2137', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <FileDown size={14} /> Download 8-Vector PDF
                </button>
              </div>
            )}

            {shareTab === 'link' && (
              <div>
                <p style={{ fontSize: 12, color: '#666', margin: '0 0 14px', lineHeight: 1.6 }}>
                  Create a link anyone can use to view your assessment (no OpenI account needed). Default 30-day expiry; revocable anytime.
                </p>
                <button onClick={mintNewEightVectorShare} disabled={shareMinting}
                  style={{ width: '100%', padding: '10px 16px', background: '#D0A848', color: '#0D2137', border: 'none', borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: shareMinting ? 'not-allowed' : 'pointer', marginBottom: 16, opacity: shareMinting ? 0.6 : 1 }}>
                  {shareMinting ? 'Creating...' : '+ Create new share link'}
                </button>

                {shareLoading ? (
                  <p style={{ color: '#5c5c5c', fontSize: 12, textAlign: 'center', margin: '14px 0' }}>Loading...</p>
                ) : shareList.length === 0 ? (
                  <p style={{ color: '#5c5c5c', fontSize: 12, fontStyle: 'italic', margin: 0, textAlign: 'center', padding: '12px 0' }}>No share links yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
                    {shareList.map(s => {
                      const expired = s.expires_at && new Date(s.expires_at) < new Date();
                      const revoked = !!s.revoked_at;
                      const inactive = expired || revoked;
                      const shareUrl = `${window.location.origin}/share/eight-vector-self/${s.token}`;
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
                                <button onClick={() => copyEightVectorLink(s.token)} style={{ padding: '3px 7px', background: '#f3f4f6', border: '1px solid #ddd', borderRadius: 5, fontSize: 9, fontWeight: 600, color: '#555', cursor: 'pointer' }}>Copy</button>
                                <button onClick={() => revokeEightVectorShare(s.id)} style={{ padding: '3px 7px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 5, fontSize: 9, fontWeight: 600, color: '#b91c1c', cursor: 'pointer' }}>Revoke</button>
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
