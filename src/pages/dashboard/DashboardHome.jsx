import { useNavigate, Link, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { dashboardAPI, evaluationAPI } from "../../services/api";
import {
  Rocket, ClipboardCheck, DollarSign, Zap,
  ArrowRight, Star, TrendingUp, Activity, BarChart2,
  Search, BookOpen, Building2,
} from "lucide-react";

// OpenI light-theme tokens
const G = "#D0A848";   // gold
const GH = "#C9983F";  // gold hover

const VECTORS = [
  "People", "Strategic Direction", "Revenue Management", "Technology",
  "Financials", "Info Visibility", "GRC", "Step Change",
];

// These are populated from API — fallback defaults shown while loading
const SECTOR_COLORS = ["#D0A848", "#16a34a", "#3b82f6", "#7c3aed", "#d97706", "#ef4444", "#94a3b8", "#C9983F", "#06b6d4", "#f59e0b"];

const QUICK_ACTIONS = [
  { label: "Startup Discovery", desc: "Browse & filter startups", to: "/dashboard/startups",        Icon: Search,         bg: "#fff8ec", fg: "#D0A848", border: "rgba(213,170,91,0.2)" },
  { label: "New Evaluation",    desc: "Run 8-vector assessment",  to: "/dashboard/evaluate",        Icon: ClipboardCheck, bg: "#f0fdf4", fg: "#16a34a", border: "rgba(22,163,74,0.2)" },
  { label: "Knowledge Hub",     desc: "Articles & resources",     to: "/dashboard/knowledge",       Icon: BookOpen,       bg: "#f5f3ff", fg: "#7c3aed", border: "rgba(124,58,237,0.2)" },
  { label: "Infrastructure",    desc: "Labs & facility bookings", to: "/dashboard/infrastructure",  Icon: Building2,      bg: "#fef3c7", fg: "#d97706", border: "rgba(217,119,6,0.2)" },
];

const STATUS_STYLE = {
  Completed:   { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
  "In Review": { bg: "#fff8ec", color: "#D0A848", border: "rgba(213,170,91,0.4)" },
  Pending:     { bg: "#f8fafc", color: "#64748b", border: "#e2e8f0" },
};

const card = {
  background: "#ffffff",
  border: "1px solid #eeeeee",
  borderRadius: 14,
  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
};

// Fallback stats shown while loading or on API error
const FALLBACK_STATS = [
  { value: "—", label: "Startups Registered", Icon: Rocket,     bg: "#fff8ec", fg: "#D0A848", border: "rgba(213,170,91,0.2)" },
  { value: "—", label: "Active Projects",      Icon: Zap,        bg: "#f0fdf4", fg: "#16a34a", border: "rgba(22,163,74,0.2)" },
  { value: "—", label: "Grants Disbursed",     Icon: DollarSign, bg: "#fef3c7", fg: "#d97706", border: "rgba(217,119,6,0.2)" },
  { value: "—", label: "DeepTech Startups",    Icon: BarChart2,  bg: "#f5f3ff", fg: "#7c3aed", border: "rgba(124,58,237,0.2)" },
];

export default function DashboardHome() {
  const { user, activeRole } = useAuth();
  const navigate = useNavigate();

  // Phase 60.3 (s50): for multi-persona accounts, honor the active role tab the
  // user picked, not their legacy single-role column. Without this a corporate
  // user who switched to their secondary Startup role would still be redirected
  // to /dashboard/corporate, which then makes corporate-scoped API calls that
  // fail/stall because the X-Active-Role header is `startup`. Fall back to
  // user.role for back-compat with old caches that haven't been refreshed yet.
  const effectiveRole = activeRole || user?.role;

  // Phase 104e - hooks moved above early returns to satisfy rules-of-hooks.
  // Previously these 7 hooks lived after the redirect guards below, which
  // meant they were skipped when a user was a corporate or other persona,
  // causing potential hook-count mismatches between renders (same trap class
  // as Phase 104b in DocumentRepository).
  const [stats, setStats] = useState(FALLBACK_STATS);
  const [recentEvals, setRecentEvals] = useState([]);
  const [evalMeta, setEvalMeta] = useState({ done: 0, avgScore: 0, pending: 0 });
  const [progress, setProgress] = useState([
    { label: "Recommended", pct: 0, color: "#16a34a" },
    { label: "Under Review", pct: 0, color: "#D0A848" },
    { label: "Needs Work",   pct: 0, color: "#ef4444" },
  ]);
  const [sectorDist, setSectorDist] = useState([]);
  // setScoreDist intentionally unused (kept for future wiring of dynamic score histogram)
  const [scoreDist, _setScoreDist] = useState([
    { range: "80-100", label: "Excellent", pct: 25, color: "#16a34a" },
    { range: "60-79",  label: "Good",      pct: 25, color: "#D0A848" },
    { range: "40-59",  label: "Average",   pct: 25, color: "#d97706" },
    { range: "0-39",   label: "Poor",      pct: 25, color: "#ef4444" },
  ]);

  useEffect(() => {
    // Fetch dashboard stats
    dashboardAPI.stats()
      .then(data => {
        setStats([
          { value: (data.totalStartups ?? "—").toLocaleString(), label: "Startups Registered", Icon: Rocket,     bg: "#fff8ec", fg: "#D0A848", border: "rgba(213,170,91,0.2)" },
          { value: String(data.activeProjects ?? "—"),            label: "Active Projects",      Icon: Zap,        bg: "#f0fdf4", fg: "#16a34a", border: "rgba(22,163,74,0.2)" },
          { value: data.grantsDisplay ?? "—",                     label: "Grants Disbursed",     Icon: DollarSign, bg: "#fef3c7", fg: "#d97706", border: "rgba(217,119,6,0.2)" },
          { value: String(data.deeptechStartups ?? "—"),          label: "DeepTech Startups",    Icon: BarChart2,  bg: "#f5f3ff", fg: "#7c3aed", border: "rgba(124,58,237,0.2)" },
        ]);
        if (data.evaluationProgress) {
          setProgress([
            { label: "Recommended", pct: data.evaluationProgress.recommended ?? 0, color: "#16a34a" },
            { label: "Under Review", pct: data.evaluationProgress.underReview ?? 0, color: "#D0A848" },
            { label: "Needs Work",   pct: data.evaluationProgress.needsWork ?? 0,   color: "#ef4444" },
          ]);
        }
      })
      .catch(() => {}); // keep fallback values on error

    // Fetch real sector distribution from startup_profiles
    dashboardAPI.stats().then(data => {
      if (data.sectorDistribution) {
        const total = data.sectorDistribution.reduce((sum, s) => sum + parseInt(s.count), 0) || 1;
        setSectorDist(data.sectorDistribution.slice(0, 8).map((s, i) => ({
          label: s.sector, pct: Math.round((parseInt(s.count) / total) * 100), color: SECTOR_COLORS[i % SECTOR_COLORS.length],
        })));
      }
    }).catch(() => {});

    // Fetch recent evaluations
    evaluationAPI.list({ limit: 5, sort: 'recent' })
      .then(data => {
        const evals = data.evaluations || data || [];
        setRecentEvals(evals.slice(0, 5));
        const done    = evals.filter(e => e.status === 'Completed').length;
        const pending = evals.filter(e => e.status === 'Pending').length;
        const scores  = evals.filter(e => e.score != null).map(e => e.score);
        const avg     = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 0;
        setEvalMeta({ done, avgScore: avg, pending });
      })
      .catch(() => {});
  }, []);

  // Phase 104e - redirect guards moved here (after all hooks) per rules-of-hooks.
  // Hooks above run on every render; these returns can now safely short-circuit
  // the JSX render path without changing hook order.
  const ALL_PERSONA_ROLES = ['startup','student','academia','corporate','government','investor','mentor','lab','incubator','accelerator','service_provider'];
  if (ALL_PERSONA_ROLES.includes(effectiveRole) && user?.onboarding_completed === false) {
    return <Navigate to="/dashboard/onboarding" replace />;
  }
  if (effectiveRole === 'corporate') return <Navigate to="/dashboard/corporate" replace />;
  const PERSONA_ROLES = ['startup','student','academia','government','investor','mentor','lab','incubator','accelerator'];
  if (PERSONA_ROLES.includes(effectiveRole)) return <Navigate to="/dashboard/home" replace />;

  const firstName = user?.name?.split(" ")[0] || null;

  return (
    <div style={{ padding: "28px", maxWidth: 1200, minHeight: "100%", background: "#f5f5f5" }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:28, flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 id="tour-page-dashboard-index" style={{ margin:0, color:"#1a1a1a", fontSize:22, fontWeight:700 }}>
            Welcome back{firstName ? `, ${firstName}` : ""} 👋
          </h1>
          <p style={{ margin:"4px 0 0", color:"#888888", fontSize:13 }}>
            OpenI Hub · Assessment Platform
          </p>
        </div>
        <button
          onClick={() => navigate("/dashboard/evaluate")}
          style={{
            display:"flex", alignItems:"center", gap:8,
            padding:"9px 18px",
            background: G, color:"#fff",
            border:"none", borderRadius:10, cursor:"pointer",
            fontSize:13, fontWeight:700,
            boxShadow:"0 2px 12px rgba(213,170,91,0.35)",
            transition:"all 0.2s",
          }}
          onMouseEnter={e => e.currentTarget.style.background = GH}
          onMouseLeave={e => e.currentTarget.style.background = G}
        >
          <Zap size={15} /> New Evaluation
        </button>
      </div>

      {/* ── Stats ──────────────────────────────────────────────── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))", gap:14, marginBottom:24 }}>
        {stats.map(({ value, label, Icon, bg, fg, border }) => (
          <div key={label} style={{ ...card, padding:20 }}>
            <div style={{
              width:40, height:40, borderRadius:10,
              background: bg, border:`1px solid ${border}`,
              display:"flex", alignItems:"center", justifyContent:"center", marginBottom:12,
            }}>
              <Icon size={18} color={fg} />
            </div>
            <div style={{ fontSize:24, fontWeight:700, color:"#1a1a1a", marginBottom:2 }}>{value}</div>
            <div style={{ fontSize:12, color:"#5c5c5c" }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gap:20, marginBottom:24 }}
        className="grid grid-cols-1 lg:grid-cols-[1fr_300px]">

        {/* ── 8-Vector Feature Card ──────────────────────────── */}
        <div style={{
          ...card,
          border:"1px solid rgba(213,170,91,0.3)",
          background:"linear-gradient(135deg, #fffdf7 0%, #fff8ec 100%)",
          overflow:"hidden",
        }}>
          <div style={{ padding:24 }}>
            <div style={{ display:"flex", alignItems:"flex-start", gap:14, marginBottom:20, flexWrap:"wrap" }}>
              <div style={{
                width:48, height:48, borderRadius:12,
                background:"rgba(213,170,91,0.15)",
                border:"1px solid rgba(213,170,91,0.25)",
                display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
              }}>
                <ClipboardCheck size={22} color={G} />
              </div>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6, flexWrap:"wrap" }}>
                  <h2 style={{ margin:0, color:"#1a1a1a", fontSize:17, fontWeight:700 }}>
                    8-Vector Startup Evaluation
                  </h2>
                  <span style={{
                    fontSize:10, fontWeight:700,
                    padding:"2px 8px", background: G,
                    color:"#fff", borderRadius:20,
                  }}>NEW</span>
                </div>
                <p style={{ margin:0, color:"#666", fontSize:13, lineHeight:1.5, maxWidth:500 }}>
                  OpenI due diligence across 8 vectors and 100+ criteria.
                  Score, track, and generate evaluation reports for any startup.
                </p>
              </div>
              <button
                onClick={() => navigate("/dashboard/evaluate")}
                style={{
                  display:"flex", alignItems:"center", gap:7,
                  padding:"9px 16px", background: G,
                  color:"#fff", border:"none", borderRadius:9,
                  cursor:"pointer", fontSize:13, fontWeight:700,
                  whiteSpace:"nowrap", flexShrink:0,
                  boxShadow:"0 2px 8px rgba(213,170,91,0.3)",
                }}
                onMouseEnter={e => e.currentTarget.style.background = GH}
                onMouseLeave={e => e.currentTarget.style.background = G}
              >
                Start Evaluation <ArrowRight size={14} />
              </button>
            </div>

            {/* Vector chips */}
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {VECTORS.map((v, i) => (
                <span key={v} style={{
                  display:"flex", alignItems:"center", gap:6,
                  padding:"5px 11px",
                  background:"#fff",
                  border:"1px solid #e8e3d8",
                  borderRadius:20, fontSize:12, color:"#555",
                }}>
                  <span style={{
                    width:17, height:17, borderRadius:"50%",
                    background:"rgba(213,170,91,0.15)",
                    color: G, fontSize:10, fontWeight:700,
                    display:"inline-flex", alignItems:"center", justifyContent:"center",
                  }}>{i+1}</span>
                  {v}
                </span>
              ))}
            </div>
          </div>

          {/* Mini stats row */}
          <div style={{
            borderTop:"1px solid rgba(213,170,91,0.2)",
            display:"grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            background:"rgba(255,255,255,0.7)",
          }}>
            {[
              { v: evalMeta.done || "—",      l:"Evaluations Done", Icon: ClipboardCheck, c: G },
              { v: evalMeta.avgScore || "—",  l:"Avg Score / 5",    Icon: Star,           c: G },
              { v: evalMeta.pending || "—",   l:"Pending Review",   Icon: Activity,       c:"#ef4444" },
              { v: evalMeta.done && recentEvals.length ? Math.round((evalMeta.done/recentEvals.length)*100)+"%" : "—", l:"Completion Rate", Icon: TrendingUp, c:"#16a34a" },
            ].map(({ v, l, Icon, c }) => (
              <div key={l} style={{
                display:"flex", alignItems:"center", gap:10,
                padding:"14px 16px",
                borderRight:"1px solid rgba(213,170,91,0.15)",
              }}>
                <Icon size={15} color={c} />
                <div>
                  <div style={{ color:"#1a1a1a", fontSize:15, fontWeight:700 }}>{v}</div>
                  <div style={{ color:"#5c5c5c", fontSize:11 }}>{l}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Progress Card ──────────────────────────────────── */}
        <div style={{ ...card, padding:22 }}>
          <h3 style={{ margin:"0 0 18px", color:"#1a1a1a", fontSize:14, fontWeight:600 }}>
            Evaluation Status
          </h3>
          {progress.map(({ label, pct, color }) => (
            <div key={label} style={{ marginBottom:14 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                <span style={{ fontSize:12, color:"#555" }}>{label}</span>
                <span style={{ fontSize:12, color:"#5c5c5c" }}>{pct}%</span>
              </div>
              <div style={{ height:7, background:"#f0f0f0", borderRadius:4, overflow:"hidden" }}>
                <div style={{
                  width:`${pct}%`, height:"100%",
                  background:color, borderRadius:4,
                  transition:"width 0.6s ease",
                }} />
              </div>
            </div>
          ))}

          <div style={{ borderTop:"1px solid #eeeeee", marginTop:20, paddingTop:18 }}>
            <h3 style={{ margin:"0 0 14px", color:"#1a1a1a", fontSize:14, fontWeight:600 }}>
              Score Distribution
            </h3>
            {/* Donut chart using conic-gradient */}
            <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:14 }}>
              <div style={{
                width: 90, height: 90, borderRadius: "50%", flexShrink: 0,
                background: `conic-gradient(
                  ${scoreDist[0].color} 0% ${scoreDist[0].pct}%,
                  ${scoreDist[1].color} ${scoreDist[0].pct}% ${scoreDist[0].pct + scoreDist[1].pct}%,
                  ${scoreDist[2].color} ${scoreDist[0].pct + scoreDist[1].pct}% ${scoreDist[0].pct + scoreDist[1].pct + scoreDist[2].pct}%,
                  ${scoreDist[3].color} ${scoreDist[0].pct + scoreDist[1].pct + scoreDist[2].pct}% 100%
                )`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <div style={{
                  width: 54, height: 54, borderRadius: "50%",
                  background: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                  flexDirection: "column",
                }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a", lineHeight: 1 }}>100</span>
                  <span style={{ fontSize: 9, color: "#5c5c5c" }}>total</span>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                {scoreDist.map(s => (
                  <div key={s.range} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: "#555", flex: 1 }}>{s.label}</span>
                    <span style={{ fontSize: 11, color: "#5c5c5c", fontWeight: 600 }}>{s.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent Evaluations + Sector Chart Grid ─────────────── */}
      <div style={{ display:"grid", gap:20, marginBottom:24 }}
        className="grid grid-cols-1 lg:grid-cols-[1fr_300px]">

        {/* Recent Evaluations */}
        <div style={{ ...card, overflow:"hidden" }}>
          <div style={{
            padding:"16px 24px",
            borderBottom:"1px solid #eeeeee",
            display:"flex", alignItems:"center", justifyContent:"space-between",
          }}>
            <h3 style={{ margin:0, color:"#1a1a1a", fontSize:14, fontWeight:600 }}>Recent Evaluations</h3>
            <button
              onClick={() => navigate("/dashboard/evaluate")}
              style={{
                display:"flex", alignItems:"center", gap:4,
                fontSize:12, color: G,
                background:"transparent", border:"none",
                cursor:"pointer", fontWeight:600,
              }}
            >
              New evaluation <ArrowRight size={12} />
            </button>
          </div>
          {recentEvals.length === 0 && (
            <div style={{ padding:"24px", textAlign:"center", color:"#6e6e6e", fontSize:13 }}>
              No evaluations yet.
            </div>
          )}
          {recentEvals.map((ev) => {
            const statusKey = ev.status || "Pending";
            const s = STATUS_STYLE[statusKey] || STATUS_STYLE["Pending"];
            const displayName = ev.startup_name || ev.name || "Unnamed";
            const displaySector = ev.sector || ev.startup_sector || "";
            return (
              <div
                key={ev.id || ev.name}
                onClick={() => navigate("/dashboard/evaluate")}
                style={{
                  padding:"13px 24px",
                  display:"flex", alignItems:"center", gap:14,
                  borderBottom:"1px solid #f5f5f5",
                  cursor:"pointer", transition:"background 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.background="#fafafa"}
                onMouseLeave={e => e.currentTarget.style.background="transparent"}
              >
                <div style={{
                  width:36, height:36, borderRadius:9,
                  background:"rgba(213,170,91,0.12)",
                  color: G, fontWeight:700, fontSize:14,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  flexShrink:0, border:"1px solid rgba(213,170,91,0.2)",
                }}>
                  {displayName[0]}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ color:"#1a1a1a", fontSize:13, fontWeight:500, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{displayName}</div>
                  <div style={{ color:"#5c5c5c", fontSize:11 }}>{displaySector}</div>
                </div>
                <span style={{
                  padding:"4px 10px", borderRadius:20, fontSize:11, fontWeight:600,
                  background: s.bg, color: s.color, border:`1px solid ${s.border}`,
                  whiteSpace:"nowrap",
                }}>
                  {statusKey}
                </span>
                {ev.score != null ? (
                  <div style={{ display:"flex", alignItems:"center", gap:4, color: G, fontSize:13, fontWeight:700, width:36, justifyContent:"flex-end", flexShrink:0 }}>
                    <Star size={11} style={{ fill: G, color: G }} />
                    {ev.score}
                  </div>
                ) : <div style={{ width:36 }} />}
              </div>
            );
          })}
        </div>

        {/* ── Startups by Sector – Horizontal Bar Chart ─────────── */}
        <div style={{ ...card, padding: 22 }}>
          <h3 style={{ margin:"0 0 18px", color:"#1a1a1a", fontSize:14, fontWeight:600 }}>
            Startups by Sector
          </h3>
          {(sectorDist.length > 0 ? sectorDist : [
            { label: "Loading...", pct: 0, color: "#e5e7eb" },
          ]).map(({ label, pct, color }) => (
            <div key={label} style={{ marginBottom: 12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: "#555" }}>{label}</span>
                <span style={{ fontSize: 12, color: "#5c5c5c", fontWeight: 600 }}>{pct}%</span>
              </div>
              <div style={{ height: 8, background: "#f0f0f0", borderRadius: 4, overflow: "hidden" }}>
                <div style={{
                  width: `${pct}%`, height: "100%",
                  background: color, borderRadius: 4,
                  transition: "width 0.6s ease",
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Quick Actions ─────────────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ margin:"0 0 14px", color:"#1a1a1a", fontSize:15, fontWeight:600 }}>
          Quick Actions
        </h3>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))", gap:14 }}>
          {QUICK_ACTIONS.map(({ label, desc, to, Icon, bg, fg, border }) => (
            <Link key={to} to={to} style={{ textDecoration:"none" }}>
              <div
                style={{
                  ...card, padding: 20,
                  cursor: "pointer", transition: "all 0.2s",
                  border: "1px solid #eeeeee",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = "rgba(213,170,91,0.4)";
                  e.currentTarget.style.boxShadow = "0 4px 14px rgba(213,170,91,0.15)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = "#eeeeee";
                  e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)";
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: bg, border: `1px solid ${border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 12,
                }}>
                  <Icon size={18} color={fg} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a", marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 12, color: "#5c5c5c" }}>{desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
