import { useState, useMemo } from "react";
import toast from 'react-hot-toast';
import { eightVectorSelfAPI, getToken } from '../../services/api';
import {
  Users, Target, TrendingUp, Cpu, DollarSign,
  BarChart2, Shield, Zap, ChevronDown, ChevronUp,
  MessageSquare, Building2, Calendar, Download, Save,
  Share2, FileDown, Globe, X,  // Phase 111 Ship 2c icons added
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
  if (!s) return { label: "—", cls: "text-gray-400", color: "#aaa" };
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
            <span style={{ fontSize:11, color:"#aaa", flexShrink:0 }}>{scoredCount}/{vector.criteria.length}</span>
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
          <p style={{ margin:0, padding:"10px 20px", fontSize:12, color:"#888", fontStyle:"italic", borderBottom:"1px solid #f5f5f5" }}>
            {vector.desc}
          </p>
          {/* Column headers */}
          <div style={{ padding:"8px 20px", display:"grid", gridTemplateColumns:"1fr auto auto", alignItems:"center", gap:14, borderBottom:"1px solid #f5f5f5" }}>
            <span style={{ fontSize:11, fontWeight:600, color:"#bbb", textTransform:"uppercase", letterSpacing:"0.05em" }}>Criterion</span>
            <span style={{ fontSize:11, fontWeight:600, color:"#bbb", textTransform:"uppercase", letterSpacing:"0.05em", textAlign:"center", width:180 }} className="hidden sm:block">Score (1–5)</span>
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
                <div style={{ padding:"10px 20px", display:"grid", gridTemplateColumns:"1fr auto auto", alignItems:"center", gap:14 }}>
                  {/* Name */}
                  <div>
                    <span style={{ fontSize:13, color:"#333" }}>{criterion}</span>
                    {statusVal && (
                      <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${STATUS_COLORS[statusVal]}`}>
                        {STATUS_OPTS.find(o => o.value === statusVal)?.label}
                      </span>
                    )}
                  </div>
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
                    style={{ padding:6, borderRadius:8, background:"none", border:"none", cursor:"pointer", color: commentVal ? "#D5AA5B" : "#ccc", transition:"color 0.15s", flexShrink:0 }}
                    title="Add comment"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                </div>
                {/* Comment + Status expanded row */}
                {showComment && (
                  <div style={{ padding:"0 20px 12px", display:"flex", flexDirection:"row", gap:10, flexWrap:"wrap" }}>
                    <select
                      value={statusVal}
                      onChange={e => onStatus(scoreKey, e.target.value)}
                      style={{ fontSize:12, background:"#fafafa", border:"1.5px solid #e0e0e0", color:"#555", borderRadius:8, padding:"6px 10px", outline:"none", width:200 }}
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
                      style={{ flex:1, minWidth:160, fontSize:12, background:"#fafafa", border:"1.5px solid #e0e0e0", color:"#333", borderRadius:8, padding:"6px 10px", outline:"none", resize:"none" }}
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
      };
      const res = await eightVectorSelfAPI.create(payload);
      if (res?.id) {
        setSavedAssessmentId(res.id);
        toast.success('Assessment saved');
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


  const handleScore = (key, val) =>
    setScores(prev => ({ ...prev, [key]: val }));
  const handleStatus = (key, val) =>
    setStatuses(prev => ({ ...prev, [key]: val }));
  const handleComment = (key, val) =>
    setComments(prev => ({ ...prev, [key]: val }));

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

  const { label: overallLabel, cls: overallCls } = scoreBand(overallScore);

  const inputStyle = {
    background:"#fafafa", border:"1.5px solid #e0e0e0", color:"#333",
    borderRadius:9, padding:"8px 12px", fontSize:13, outline:"none",
    transition:"border-color 0.15s",
  };

  return (
    <div style={{ padding:"24px 28px", maxWidth:1280, minHeight:"100%", background:"#f5f5f5" }}>
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div style={{ marginBottom:24, display:"flex", alignItems:"center", flexWrap:"wrap", gap:14, paddingBottom:20, borderBottom:"1px solid #eeeeee" }}>
        <div>
          <h1 style={{ margin:0, color:"#1a1a1a", fontSize:20, fontWeight:700 }}>8-Vector Startup Evaluation</h1>
          <p style={{ margin:"4px 0 0", color:"#888", fontSize:12 }}>OpenI 8-Vector Assessment · {completionPct}% complete</p>
        </div>

        <div style={{ flex:1, display:"flex", alignItems:"center", gap:10, flexWrap:"wrap", justifyContent:"flex-end" }}>
          <div id="tour-page-8vector-name" style={{ position:"relative" }}>
            <Building2 style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"#bbb", width:14, height:14 }} />
            <input type="text" value={startupName} onChange={e => setStartupName(e.target.value)}
              placeholder="Startup name"
              style={{ ...inputStyle, paddingLeft:30, width:160 }}
              onFocus={e => e.target.style.borderColor="#D5AA5B"}
              onBlur={e => e.target.style.borderColor="#e0e0e0"}
            />
          </div>
          <input type="text" value={evaluator} onChange={e => setEvaluator(e.target.value)}
            placeholder="Evaluator name"
            style={{ ...inputStyle, width:150 }}
            onFocus={e => e.target.style.borderColor="#D5AA5B"}
            onBlur={e => e.target.style.borderColor="#e0e0e0"}
            className="hidden lg:block"
          />
          <div style={{ position:"relative" }} className="hidden lg:block">
            <Calendar style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"#bbb", width:14, height:14 }} />
            <input type="date" value={evalDate} onChange={e => setEvalDate(e.target.value)}
              style={{ ...inputStyle, paddingLeft:30, width:155, color:"#555" }}
              onFocus={e => e.target.style.borderColor="#D5AA5B"}
              onBlur={e => e.target.style.borderColor="#e0e0e0"}
            />
          </div>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
          <span style={{ fontSize:12, color:"#888" }}>{completionPct}%</span>
          <div style={{ width:80, height:5, background:"#e8e8e8", borderRadius:4, overflow:"hidden" }} className="hidden sm:block">
            <div style={{ width:`${completionPct}%`, height:"100%", background:"#D5AA5B", borderRadius:4, transition:"width 0.5s" }} />
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
            <p style={{ margin:0, fontSize:13, color:"#888" }}>
              Rate each criterion from <strong style={{ color:"#555" }}>1</strong> (poor) to <strong style={{ color:"#555" }}>5</strong> (excellent). Click <MessageSquare style={{ width:13, height:13, display:"inline", verticalAlign:"middle", color:"#bbb" }} /> to add status & notes.
            </p>
          </div>

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
                  background: (!startupName.trim() || saving) ? "#ccc" : "#D5AA5B",
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
                    padding:"10px 22px", background:"#fff8ec", color:"#D5AA5B",
                    border:"1.5px solid #D5AA5B", borderRadius:10, fontSize:13, fontWeight:700,
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
        </div>
      </div>
      {/* Phase 111 Ship 2c: Share modal JSX */}
      {shareOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={(e) => { if (e.target === e.currentTarget) setShareOpen(false); }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 560, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>Share 8-Vector Assessment</h2>
              <button onClick={() => setShareOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: 4 }}>
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
                           borderBottom: shareTab === t.id ? '2.5px solid #D5AA5B' : '2.5px solid transparent',
                           marginBottom: -1.5, color: shareTab === t.id ? '#D5AA5B' : '#666', cursor: 'pointer',
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
                  style={{ width: '100%', padding: '11px 18px', background: '#D5AA5B', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
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
                  style={{ width: '100%', padding: '10px 16px', background: '#D5AA5B', color: '#fff', border: 'none', borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: shareMinting ? 'not-allowed' : 'pointer', marginBottom: 16, opacity: shareMinting ? 0.6 : 1 }}>
                  {shareMinting ? 'Creating...' : '+ Create new share link'}
                </button>

                {shareLoading ? (
                  <p style={{ color: '#888', fontSize: 12, textAlign: 'center', margin: '14px 0' }}>Loading...</p>
                ) : shareList.length === 0 ? (
                  <p style={{ color: '#888', fontSize: 12, fontStyle: 'italic', margin: 0, textAlign: 'center', padding: '12px 0' }}>No share links yet.</p>
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
                                <button onClick={() => revokeEightVectorShare(s.id)} style={{ padding: '3px 7px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 5, fontSize: 9, fontWeight: 600, color: '#dc2626', cursor: 'pointer' }}>Revoke</button>
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
