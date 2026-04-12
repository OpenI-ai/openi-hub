import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { connectionAPI } from "../../services/api";
import {
  LayoutDashboard, Rocket, ClipboardCheck, BookOpen,
  Shield, Settings, LogOut, Menu, X,
  Bell, GraduationCap, ChevronRight, Database,
  Users, Building2, Globe, FileText,
  FolderKanban, MessageSquare, GitBranch, FolderOpen,
  Star, Zap, Calendar, UserCheck, ThumbsUp, Link2,
  Search, User, CalendarCheck, TrendingUp, Landmark,
  FlaskConical, Home, Target, Link,
} from "lucide-react";
import { PERSONA_NAV, PERSONAS } from "../../config/personas";
import SearchBar from "../../components/SearchBar";

// ── OpenI brand tokens (light theme – matches openi.ai) ───────
const C = {
  gold:        "#D5AA5B",   // primary gold (buttons, active)
  goldDark:    "#C9983F",   // hover gold
  goldLight:   "rgba(213,170,91,0.12)",
  goldBorder:  "rgba(213,170,91,0.35)",
  white:       "#ffffff",
  pageBg:      "#f5f5f5",   // light grey page background
  sidebarBg:   "#ffffff",   // white sidebar
  sidebarBorder: "#e8e8e8",
  topbarBg:    "#ffffff",
  topbarBorder: "#eeeeee",
  textPrimary: "#1a1a1a",   // near-black headings
  textSecond:  "#555555",   // body text
  textMuted:   "#888888",   // muted labels
  activeText:  "#D5AA5B",   // active nav item text
  activeBg:    "rgba(213,170,91,0.10)",
  activeBorder:"rgba(213,170,91,0.30)",
  hoverBg:     "#f7f3ec",   // nav hover
};

// Icon lookup for persona nav (string → component)
const ICON_MAP = {
  LayoutDashboard, Rocket, ClipboardCheck, BookOpen, Shield, Settings,
  GraduationCap, Database, Users, Building2, Globe, FileText,
  FolderKanban, MessageSquare, GitBranch, FolderOpen, Star, Zap,
  Calendar, UserCheck, ThumbsUp, Link2, Search, User, CalendarCheck,
  TrendingUp, Landmark, FlaskConical, Home, Target, Link,
  Handshake: Link, // Handshake not in lucide-react 0.294 — alias to Link
};

// roles: undefined = visible to all, array = only listed roles see it
const NAV = [
  { to: "/dashboard",                label: "Overview",         Icon: LayoutDashboard, end: true },
  { to: "/dashboard/evaluate",       label: "8-Vector Eval",    Icon: ClipboardCheck,  badge: "NEW", roles: ["admin","evaluator"] },
  { to: "/dashboard/startups",       label: "Startups",         Icon: Rocket },
  { to: "/dashboard/evaluations",    label: "Programs",         Icon: FileText,        roles: ["admin","evaluator"] },
  { to: "/dashboard/cohorts",        label: "Cohorts",          Icon: GraduationCap,   roles: ["admin"] },
  { to: "/dashboard/mentors",        label: "Mentors",          Icon: Users,           roles: ["admin","evaluator","mentor"] },
  { to: "/dashboard/ipr",            label: "IPR Database",     Icon: Shield,          roles: ["admin","evaluator"] },
  { to: "/dashboard/infrastructure", label: "Infrastructure",   Icon: Building2,       roles: ["admin"] },
  { to: "/dashboard/knowledge",      label: "Knowledge",        Icon: BookOpen },
  { to: "/dashboard/crawling",       label: "Crawling",         Icon: Globe,           roles: ["admin"] },
  { to: "/dashboard/register",       label: "Register Startup", Icon: Database,        roles: ["admin"] },
  { to: "/dashboard/pipeline",       label: "Pipeline",         Icon: GitBranch,       roles: ["admin","evaluator"] },
  { to: "/dashboard/projects",       label: "Projects",         Icon: FolderKanban,    roles: ["admin","evaluator"] },
  { to: "/dashboard/messaging",      label: "Messaging",        Icon: MessageSquare,   badge: "NEW" },
  { to: "/dashboard/documents",      label: "Documents",        Icon: FolderOpen },
  { to: "/dashboard/watchlist",      label: "Watchlists",       Icon: Star,            roles: ["admin","startup"] },
  { to: "/dashboard/deeptech",       label: "DeepTech Qual.",   Icon: Zap,             roles: ["admin","evaluator"] },
  { to: "/dashboard/events",         label: "Events",           Icon: Calendar },
  { to: "/dashboard/sme",            label: "SME Experts",      Icon: UserCheck,       roles: ["admin","evaluator"] },
  { to: "/dashboard/feedback",       label: "Feedback",         Icon: ThumbsUp,        roles: ["admin","evaluator"] },
  { to: "/dashboard/govt-apis",      label: "Govt. APIs",       Icon: Link2,           roles: ["admin"] },
];

const MOCK_NOTIFS = [
  { id:1, title:"New evaluation submitted for ArmorTech AI",    time:"2 min ago",   read:false, color:"#D5AA5B" },
  { id:2, title:"DroneShield procurement approved",             time:"1 hour ago",  read:false, color:"#16a34a" },
  { id:3, title:"Quarterly review scheduled for 15 May",        time:"3 hours ago", read:false, color:"#3b82f6" },
  { id:4, title:"New startup BioDefend registered",             time:"Yesterday",   read:true,  color:"#7c3aed" },
  { id:5, title:"QKD pilot reached 82% completion",             time:"Yesterday",   read:true,  color:"#d97706" },
  { id:6, title:"Mentor assignment updated for CyberVault",     time:"2 days ago",  read:true,  color:"#ef4444" },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFS);
  const unreadCount = notifications.filter(n => !n.read).length;
  const [pendingConns, setPendingConns] = useState(0);

  // Fetch pending connection requests count
  useEffect(() => {
    connectionAPI.stats().then(d => setPendingConns(d.pending_incoming || 0)).catch(() => {});
  }, []);

  // For admin/evaluator: use legacy NAV with role filtering
  // For all other personas: use PERSONA_NAV config
  const isLegacyRole = user?.role === 'admin' || user?.role === 'evaluator';
  const filteredNav = isLegacyRole
    ? NAV.filter(item => !item.roles || item.roles.includes(user?.role))
    : (PERSONA_NAV[user?.role] || PERSONA_NAV.startup).map(item => ({
        ...item,
        Icon: ICON_MAP[item.icon] || LayoutDashboard,
        // Inject pending count badge on My Network nav item
        badge: item.to === '/dashboard/network' && pendingConns > 0 ? String(pendingConns) : item.badge,
      }));

  const handleLogout = () => {
    logout();
    navigate("/dashboard/login");
  };

  return (
    <div style={{ display:"flex", height:"100vh", background: C.pageBg, overflow:"hidden" }}>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position:"fixed", inset:0, zIndex:20, background:"rgba(0,0,0,0.4)" }}
          className="lg:hidden"
        />
      )}

      {/* ── SIDEBAR ─────────────────────────────────────────────── */}
      <aside
        style={{
          width:"240px",
          background: C.sidebarBg,
          borderRight: `1px solid ${C.sidebarBorder}`,
          display:"flex", flexDirection:"column", flexShrink:0,
          position:"relative", zIndex:30, overflow:"hidden",
          boxShadow: "2px 0 8px rgba(0,0,0,0.06)",
        }}
        className={`
          fixed lg:static inset-y-0 left-0
          transition-transform duration-200
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo */}
        <div style={{
          display:"flex", alignItems:"center", gap:"10px",
          padding:"18px 20px",
          borderBottom: `1px solid ${C.sidebarBorder}`,
          flexShrink:0,
        }}>
          <img
            src="/openi-logo.png"
            alt="OpenI"
            style={{ height:34, width:"auto", maxWidth:100, objectFit:"contain" }}
            onError={e => {
              e.target.style.display = "none";
              e.target.nextSibling.style.display = "flex";
            }}
          />
          <div style={{
            display:"none", width:34, height:34, borderRadius:9,
            background: C.gold, alignItems:"center", justifyContent:"center", flexShrink:0,
          }}>
            <Shield size={17} color="#fff" />
          </div>
          <div>
            <div style={{ color: C.textPrimary, fontSize:12, fontWeight:700, lineHeight:"1.3" }}>OpenI Hub</div>
            <div style={{ color: C.gold, fontSize:10, marginTop:1, fontWeight:500 }}>OpenI Platform</div>
          </div>
        </div>

        {/* Nav links */}
        <nav style={{ flex:1, padding:"12px 8px", overflowY:"auto" }}>
          {filteredNav.map(({ to, label, Icon, end, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setSidebarOpen(false)}
              style={({ isActive }) => ({
                display:"flex", alignItems:"center", gap:10,
                padding:"9px 12px", borderRadius:8, marginBottom:2,
                fontSize:13, fontWeight: isActive ? 600 : 500,
                textDecoration:"none",
                transition:"all 0.15s",
                background: isActive ? C.activeBg : "transparent",
                color: isActive ? C.activeText : C.textSecond,
                border: isActive ? `1px solid ${C.activeBorder}` : "1px solid transparent",
              })}
              onMouseEnter={e => {
                if (!e.currentTarget.style.background.includes("0.10")) {
                  e.currentTarget.style.background = C.hoverBg;
                }
              }}
              onMouseLeave={e => {
                if (!e.currentTarget.style.background.includes("0.10")) {
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              <Icon size={15} style={{ flexShrink:0 }} />
              <span style={{ flex:1 }}>{label}</span>
              {badge && (
                <span style={{
                  fontSize:9, fontWeight:700, padding:"2px 6px",
                  background: C.gold, color: "#fff", borderRadius:20,
                }}>
                  {badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom – settings + logout */}
        <div style={{ padding:"8px", flexShrink:0, borderTop: `1px solid ${C.sidebarBorder}` }}>
          <NavLink
            to="/dashboard/settings"
            style={({ isActive }) => ({
              display:"flex", alignItems:"center", gap:10,
              padding:"9px 12px", borderRadius:8, marginBottom:2,
              fontSize:13, fontWeight:500, textDecoration:"none",
              color: isActive ? C.activeText : C.textSecond,
              background: isActive ? C.activeBg : "transparent",
            })}
          >
            <Settings size={15} />
            <span>Settings</span>
          </NavLink>
          <button
            onClick={handleLogout}
            style={{
              display:"flex", alignItems:"center", gap:10,
              padding:"9px 12px", borderRadius:8,
              width:"100%", fontSize:13, fontWeight:500,
              color: C.textMuted, background:"transparent",
              border:"none", cursor:"pointer", transition:"all 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.color="#e53e3e"; e.currentTarget.style.background="rgba(229,62,62,0.07)"; }}
            onMouseLeave={e => { e.currentTarget.style.color=C.textMuted; e.currentTarget.style.background="transparent"; }}
          >
            <LogOut size={15} />
            <span>Logout</span>
          </button>
        </div>

        {/* User pill */}
        {user && (
          <div style={{
            padding:"12px 16px",
            borderTop: `1px solid ${C.sidebarBorder}`,
            display:"flex", alignItems:"center", gap:10,
            flexShrink:0, background:"#fafafa",
          }}>
            <div style={{
              width:32, height:32, borderRadius:"50%",
              background: C.goldLight, color: C.gold,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:13, fontWeight:700, flexShrink:0,
              border: `1.5px solid ${C.goldBorder}`,
            }}>
              {(user.name || user.email)?.[0]?.toUpperCase()}
            </div>
            <div style={{ minWidth:0 }}>
              <div style={{ color: C.textPrimary, fontSize:12, fontWeight:600, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                {user.name || user.email}
              </div>
              <div style={{ color: C.textMuted, fontSize:11, textTransform:"capitalize" }}>
                {PERSONAS[user.role]?.label || user.role || "User"}
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* ── MAIN ─────────────────────────────────────────────────── */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0, overflow:"hidden" }}>
        {/* Top bar */}
        <header style={{
          height:54,
          borderBottom: `1px solid ${C.topbarBorder}`,
          background: C.topbarBg,
          display:"flex", alignItems:"center",
          padding:"0 20px", gap:12, flexShrink:0,
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
        }}>
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="lg:hidden"
            style={{ padding:"6px", color: C.textMuted, background:"transparent", border:"none", cursor:"pointer", borderRadius:8 }}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Breadcrumb */}
          <div style={{ fontSize:12, color: C.textMuted, display:"flex", alignItems:"center", gap:6, flexShrink:0 }} className="hidden md:flex">
            <span style={{ color: C.gold, fontWeight:700 }}>OpenI Hub</span>
            <ChevronRight size={12} />
            <span style={{ color: C.textSecond }}>Dashboard</span>
          </div>

          {/* Global AI Ask search in top bar */}
          <div style={{ flex:1, display:"flex", justifyContent:"center", maxWidth:480, marginLeft:"auto", marginRight:"auto" }} className="hidden md:flex">
            <SearchBar
              onSearch={(term, mode) => {
                const modeParam = mode && mode !== 'keyword' ? `&mode=${mode}` : '';
                navigate(`/search?q=${encodeURIComponent(term)}${modeParam}`);
              }}
              showAiToggle
              placeholder="Ask or search..."
            />
          </div>

          {/* Right side */}
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            {/* Notification bell */}
            <div style={{ position:"relative" }}>
              <button
                onClick={() => setNotifOpen(o => !o)}
                style={{
                  position:"relative", padding:8, color: C.textMuted,
                  background: notifOpen ? C.goldLight : "transparent",
                  border:"none", cursor:"pointer", borderRadius:8,
                  transition:"background 0.15s",
                }}
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span style={{
                    position:"absolute", top:4, right:4,
                    minWidth:16, height:16, borderRadius:8,
                    background: C.gold, color:"#fff",
                    fontSize:9, fontWeight:700,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    padding:"0 4px", lineHeight:1,
                  }}>
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification dropdown */}
              {notifOpen && (
                <>
                  {/* Backdrop to close on outside click */}
                  <div
                    onClick={() => setNotifOpen(false)}
                    style={{ position:"fixed", inset:0, zIndex:40 }}
                  />
                  <div style={{
                    position:"absolute", top:"calc(100% + 8px)", right:0, zIndex:50,
                    width:340, maxHeight:400, overflowY:"auto",
                    background:"#fff", borderRadius:12,
                    border:"1px solid #e8e8e8",
                    boxShadow:"0 8px 30px rgba(0,0,0,0.12)",
                  }}>
                    <div style={{
                      padding:"14px 16px", borderBottom:"1px solid #eee",
                      display:"flex", alignItems:"center", justifyContent:"space-between",
                    }}>
                      <span style={{ fontSize:14, fontWeight:700, color:"#1a1a1a" }}>Notifications</span>
                      {unreadCount > 0 && (
                        <span style={{
                          fontSize:10, fontWeight:600, padding:"2px 8px",
                          background:C.goldLight, color:C.gold, borderRadius:20,
                        }}>
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {notifications.map(n => (
                      <div
                        key={n.id}
                        style={{
                          padding:"12px 16px",
                          display:"flex", alignItems:"flex-start", gap:10,
                          borderBottom:"1px solid #f5f5f5",
                          background: n.read ? "transparent" : "#fffdf7",
                          cursor:"pointer", transition:"background 0.15s",
                        }}
                        onMouseEnter={e => e.currentTarget.style.background="#fafafa"}
                        onMouseLeave={e => e.currentTarget.style.background = n.read ? "transparent" : "#fffdf7"}
                        onClick={() => {
                          setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
                        }}
                      >
                        <span style={{
                          width:8, height:8, borderRadius:"50%", marginTop:5,
                          background: n.color, flexShrink:0,
                        }} />
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:12, color:"#1a1a1a", fontWeight: n.read ? 400 : 600, lineHeight:1.4 }}>
                            {n.title}
                          </div>
                          <div style={{ fontSize:11, color:"#888", marginTop:3 }}>{n.time}</div>
                        </div>
                        {!n.read && (
                          <span style={{
                            width:7, height:7, borderRadius:"50%",
                            background:C.gold, flexShrink:0, marginTop:5,
                          }} />
                        )}
                      </div>
                    ))}
                    <div style={{ padding:"10px 16px", borderTop:"1px solid #eee" }}>
                      <button
                        onClick={() => {
                          setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                        }}
                        style={{
                          width:"100%", padding:"8px",
                          background:"transparent", border:"none",
                          color:C.gold, fontSize:12, fontWeight:600,
                          cursor:"pointer", borderRadius:6,
                          transition:"background 0.15s",
                        }}
                        onMouseEnter={e => e.currentTarget.style.background=C.goldLight}
                        onMouseLeave={e => e.currentTarget.style.background="transparent"}
                      >
                        Mark all as read
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
            {user && (
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{
                  width:28, height:28, borderRadius:"50%",
                  background: C.goldLight, color: C.gold,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:11, fontWeight:700, border: `1.5px solid ${C.goldBorder}`,
                }}>
                  {(user.name || user.email)?.[0]?.toUpperCase()}
                </div>
                <span style={{ color: C.textSecond, fontSize:13 }} className="hidden sm:block">
                  {user.name || user.email}
                </span>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex:1, overflowY:"auto", background: C.pageBg }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
