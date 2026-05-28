import { useState, useEffect } from "react";
import { Outlet, NavLink, Link as RouterLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
// Phase 101 Sub-D: notificationAPI for live notification bell
import { connectionAPI, whatsNewAPI, notificationAPI, orgAPI } from "../../services/api";
import {
  LayoutDashboard, Rocket, ClipboardCheck, BookOpen,
  Shield, Settings, LogOut, Menu, X,
  Bell, HelpCircle, GraduationCap, ChevronRight, Database,
  Users, Building2, Globe, FileText,
  FolderKanban, MessageSquare, GitBranch, FolderOpen,
  Star, Zap, Calendar, UserCheck, ThumbsUp, Link2,
  Search, User, CalendarCheck, TrendingUp, Landmark,
  FlaskConical, Home, Target, Link, Map, Sparkles, Briefcase, Clock,
  BarChart3, Megaphone, CreditCard, BadgeCheck, DollarSign,
} from "lucide-react";
import { PERSONA_NAV, PERSONAS, SECONDARY_NAV } from "../../config/personas";
import { PAGE_TOURS } from "../../config/tours";  // Ship #12 (22 May 2026)
import SearchBar from "../../components/SearchBar";
import RoleTabs from "../../components/RoleTabs";  // Phase 60.3 (s50)
import PlanBadge from "../../components/PlanBadge"; // Phase 68 — plan visibility

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
  Map, Sparkles, Briefcase, Clock, BarChart3, BadgeCheck,
  Handshake: Link, // Handshake not in lucide-react 0.294 — alias to Link
};

// roles: undefined = visible to all, array = only listed roles see it
const NAV = [
  { to: "/dashboard",                label: "My Dashboard",     Icon: LayoutDashboard, end: true },
  // ── Admin Console (Phase 28) — top of nav for admin users ──
  { to: "/dashboard/admin/console",   label: "Admin Console",  Icon: Shield,          roles: ["admin"], badge: "NEW" },
  { to: "/dashboard/admin/users",     label: "User Mgmt",      Icon: Users,           roles: ["admin"] },
  { to: "/dashboard/admin/challenges",label: "Mod. Challenges", Icon: Megaphone,      roles: ["admin"] },
  { to: "/dashboard/admin/startups",  label: "Startup Data",   Icon: Building2,       roles: ["admin"] },
  { to: "/dashboard/admin/licenses",  label: "Licenses",       Icon: CreditCard,      roles: ["admin"] },
  { to: "/dashboard/admin/analytics", label: "Analytics",      Icon: BarChart3,       roles: ["admin"] },
  /* Phase 102-3: admin cost dashboard nav entry */
  { to: "/dashboard/admin/costs",     label: "Service Costs",  Icon: DollarSign,      roles: ["admin"] },
  /* A: Admin Platform-Health dashboard nav entry */
  { to: "/dashboard/admin/platform-health", label: "Platform Health", Icon: TrendingUp,      roles: ["admin"] },
  // ── Legacy admin + shared items ──
  { to: "/dashboard/evaluate",       label: "8-Vector Eval",    Icon: ClipboardCheck,  roles: ["admin","evaluator"] },
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
  { to: "/dashboard/messaging",      label: "Messaging",        Icon: MessageSquare },
  { to: "/dashboard/documents",      label: "Documents",        Icon: FolderOpen },
  { to: "/dashboard/watchlist",      label: "Watchlists",       Icon: Star,            roles: ["admin","startup"] },
  { to: "/dashboard/deeptech",       label: "DeepTech Qual.",   Icon: Zap,             roles: ["admin","evaluator"] },
  { to: "/dashboard/events",         label: "Events",           Icon: Calendar },
  { to: "/dashboard/feedback",       label: "Feedback",         Icon: ThumbsUp,        roles: ["admin","evaluator"] },
  { to: "/dashboard/govt-apis",      label: "Govt. APIs",       Icon: Link2,           roles: ["admin"] },
];

// Notifications — empty until platform has a real notification system

export default function DashboardLayout() {
  const { user, logout, activeRole } = useAuth();  // Phase 60.3 (s50): read activeRole
  const navigate = useNavigate();
  const location = useLocation();  // Ship #12 — for PAGE_TOURS lookup
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Mobile Ship 1 (27 May 2026): mobile search bar visibility (slide-down panel)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  // Phase 74 — sidebar unread badge for What's New.
  const [whatsNewUnread, setWhatsNewUnread] = useState(0);
  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      whatsNewAPI.unreadCount()
        .then((data) => {
          if (cancelled) return;
          setWhatsNewUnread(Number(data?.unread_count) || 0);
        })
        .catch(() => { /* keep stale value; we'll retry on next mount */ });
    };
    refresh();
    const onSeen = () => setWhatsNewUnread(0);
    window.addEventListener('whatsnew:seen', onSeen);
    return () => { cancelled = true; window.removeEventListener('whatsnew:seen', onSeen); };
  }, []);

  // Phase 113-Tier-B5 — sidebar badge: count of pending org-join requests
  // visible to admin of the org. Mirrors the Phase 74 pattern.
  const [orgPendingInvites, setOrgPendingInvites] = useState(0);
  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      orgAPI.pendingInvitesCount()
        .then((data) => {
          if (cancelled) return;
          setOrgPendingInvites(Number(data?.count) || 0);
        })
        .catch(() => { /* user may not be in any org; keep at 0 */ });
    };
    refresh();
    const id = setInterval(refresh, 60_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const unreadCount = notifications.filter(n => !n.read).length;
  const [pendingConns, setPendingConns] = useState(0);

  // Fetch pending connection requests count
  useEffect(() => {
    connectionAPI.stats().then(d => setPendingConns(d.pending_incoming || 0)).catch(() => {});
  }, []);

  // Phase 101 Sub-D: load notifications on mount + refresh every 60s
  // Backend returns {id, kind, title, body, link, related_id, read_at, created_at}.
  // Normalize `read` from `read_at` so the existing unreadCount filter still works.
  useEffect(() => {
    let cancelled = false;
    const load = () => {
      notificationAPI.list()
        .then((data) => {
          if (cancelled) return;
          const rows = (data?.notifications || []).map(n => ({
            ...n,
            read: !!n.read_at,
            message: n.body || n.title,
            time: n.created_at,
          }));
          setNotifications(rows);
        })
        .catch(() => { /* keep stale list on transient failure */ });
    };
    load();
    const id = setInterval(load, 60000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  // Phase 60.3 (s50): nav filtering keyed on activeRole, NOT primary role.
  // Single-role users see identical behaviour because activeRole === user.role.
  // Multi-role users see the sidebar repaint when they switch tabs in <RoleTabs>.
  const navRole = activeRole || user?.role;
  const isLegacyRole = navRole === 'admin' || navRole === 'evaluator';

  // Phase 71d — PERSONA_NAV is now a { groups: [{key, items: []}] } shape.
  // Map every item to inject the resolved icon + pending-count badge once,
  // then keep the group structure so DashboardLayout can render dividers.
  const decorate = (item) => ({
    ...item,
    Icon: ICON_MAP[item.icon] || LayoutDashboard,
    badge: item.to === '/dashboard/network' && pendingConns > 0 ? String(pendingConns) : item.badge,
  });

  const personaGroups = isLegacyRole
    ? null
    : (() => {
        const cfg = PERSONA_NAV[navRole] || PERSONA_NAV.startup;
        return cfg.groups.map((g) => ({ key: g.key, items: g.items.map(decorate) }));
      })();

  const legacyNav = isLegacyRole
    ? NAV.filter(item => !item.roles || item.roles.includes(navRole))
    : null;

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
          /* Phase 122: position removed — let Tailwind className `fixed lg:static` win.
             Inline position:"relative" was overriding the Tailwind `fixed` on mobile,
             causing sidebar to reserve 240px in the flex container even when
             transformed off-screen, shifting main content right + clipping off right edge. */
          zIndex:30, overflow:"hidden",
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
          <RouterLink to="/dashboard" aria-label="Go to dashboard home" style={{ display:"inline-flex", alignItems:"center" }}>
            <img
              src="/openi-logo.png"
              alt="OpenI"
              style={{ height:34, width:"auto", maxWidth:100, objectFit:"contain", cursor:"pointer" }}
              onError={e => {
                e.target.style.display = "none";
                // Logo is now wrapped in <RouterLink>; fallback is the link's next sibling.
                if (e.target.parentElement && e.target.parentElement.nextSibling) {
                  e.target.parentElement.nextSibling.style.display = "flex";
                }
              }}
            />
          </RouterLink>
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
          {/* Phase 71d — persona nav renders as canonical 5 groups with
              subtle dividers; legacy roles (admin / evaluator) keep the
              flat NAV list so admin tools are not forced into the same
              shape. renderNavItem keeps both paths visually identical. */}
          {(() => {
            const renderNavItem = ({ to, label, Icon, end, badge }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                id={`tour-nav-${(label || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`}
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
            );

            const divider = (key) => (
              <div key={`div-${key}`} style={{
                margin: "10px 6px 6px",
                height: 1,
                background: C.sidebarBorder,
              }} />
            );

            if (isLegacyRole) {
              return legacyNav.map(renderNavItem);
            }

            return personaGroups.flatMap((g, idx) => {
              const items = g.items.map(renderNavItem);
              return idx === 0 ? items : [divider(g.key), ...items];
            });
          })()}

          {/* Phase 69 — meta nav block (Organization / Features / What's New).
              Separator above; same NavLink visual language but rendered from
              the persona-agnostic SECONDARY_NAV array so every persona sees
              these regardless of how they build their primary nav. */}
          {/* SECONDARY_NAV: visible to all personas including admin/evaluator (carry-forward fix 21 May 2026) */}
          {true && (
            <>
              <div style={{
                margin: "10px 6px 6px",
                height: 1,
                background: C.sidebarBorder,
              }} />
              {SECONDARY_NAV.map(({ to, label, icon, end }) => {
                const Icon = ICON_MAP[icon] || LayoutDashboard;
                const isWhatsNew = to === '/dashboard/whats-new';
                return (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    id={`tour-nav-${(label || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`}
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
                    {/* Phase 74 — unread-count chip on What's New only */}
                    {isWhatsNew && whatsNewUnread > 0 && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, lineHeight: 1,
                        padding: '3px 7px', borderRadius: 10,
                        background: C.gold, color: '#fff',
                        minWidth: 16, textAlign: 'center',
                      }}>
                        {whatsNewUnread > 99 ? '99+' : whatsNewUnread}
                      </span>
                    )}
                    {/* Phase 113-Tier-B5 — pending invites chip on Organization only */}
                    {to === '/dashboard/organization' && orgPendingInvites > 0 && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, lineHeight: 1,
                        padding: '3px 7px', borderRadius: 10,
                        background: C.gold, color: '#fff',
                        minWidth: 16, textAlign: 'center',
                      }}>
                        {orgPendingInvites > 99 ? '99+' : orgPendingInvites}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </>
          )}
        </nav>

        {/* Bottom – plan badge + settings + logout */}
        <div style={{ padding:"8px", flexShrink:0, borderTop: `1px solid ${C.sidebarBorder}` }}>
          {/* Phase 68 — plan visibility on every dashboard page */}
          <PlanBadge variant="sidebar" />
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
              padding:"10px 12px", borderRadius:8,
              marginTop:6,
              width:"100%", fontSize:13, fontWeight:600,
              color:"#c53030",
              background:"rgba(229,62,62,0.06)",
              border:"1px solid rgba(229,62,62,0.18)",
              cursor:"pointer", transition:"all 0.15s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color="#fff";
              e.currentTarget.style.background="#e53e3e";
              e.currentTarget.style.borderColor="#e53e3e";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color="#c53030";
              e.currentTarget.style.background="rgba(229,62,62,0.06)";
              e.currentTarget.style.borderColor="rgba(229,62,62,0.18)";
            }}
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
          <div style={{ fontSize:12, color: C.textMuted, alignItems:"center", gap:6, flexShrink:0 }} className="hidden md:flex">  {/* Phase 123: removed inline display:"flex" — was overriding Tailwind `hidden` on mobile */}
            <span style={{ color: C.gold, fontWeight:700 }}>OpenI Hub</span>
            <ChevronRight size={12} />
            <span style={{ color: C.textSecond }}>Dashboard</span>
          </div>

          {/* Global AI Ask search in top bar */}
          <div style={{ flex:1, justifyContent:"center", maxWidth:480, marginLeft:"auto", marginRight:"auto" }} className="hidden md:flex">  {/* Phase 123: removed inline display:"flex" — was overriding Tailwind `hidden` on mobile */}
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
            {/* P4 — Take a tour replay button */}
            <button
              id="tour-topbar-take-tour"
              onClick={() => window.dispatchEvent(new CustomEvent('openi-replay-tour'))}
              title="Take a tour"
              style={{
                padding:8, color: C.textMuted,
                background: "transparent", border:"none", cursor:"pointer",
                borderRadius:8, transition:"background 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = C.goldLight}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <HelpCircle size={16} />
            </button>
            {/* Ship #12 (22 May 2026) — Tour this page button (visible only when PAGE_TOURS covers current route) */}
            {PAGE_TOURS && PAGE_TOURS[location.pathname] && (
              <button
                id="tour-topbar-page-tour"
                onClick={() => window.dispatchEvent(new CustomEvent('openi-page-tour'))}
                title={`Tour: ${PAGE_TOURS[location.pathname].title || 'this page'}`}
                aria-label="Tour this page"
                style={{
                  marginLeft: 6,
                  padding: '4px 10px',
                  background: '#fff8ec',
                  color: '#92700a',
                  border: '1px solid rgba(213,170,91,0.3)',
                  borderRadius: 7,
                  cursor: 'pointer',
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                Tour this page
              </button>
            )}

            {/* Mobile Ship 1 (27 May 2026): mobile-only search icon button (hidden md+) */}
            <button
              onClick={() => setMobileSearchOpen(o => !o)}
              className="md:hidden"
              aria-label="Search"
              style={{
                padding:8, color: C.textMuted,
                background: mobileSearchOpen ? C.goldLight : "transparent",
                border:"none", cursor:"pointer", borderRadius:8,
              }}
            >
              <Search size={16} />
            </button>
            {/* Notification bell */}
            <div style={{ position:"relative" }}>
              <button
                id="tour-topbar-bell"
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
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        {unreadCount > 0 && (
                          <>
                            <span style={{
                              fontSize:10, fontWeight:600, padding:"2px 8px",
                              background:C.goldLight, color:C.gold, borderRadius:20,
                            }}>
                              {unreadCount} new
                            </span>
                            {/* Phase 101 Sub-D: Mark all as read link */}
                            <button onClick={async () => {
                              try { await notificationAPI.markAllRead(); } catch (e) { /* non-fatal */ }
                              setNotifications(prev => prev.map(x => ({...x, read: true, read_at: x.read_at || new Date().toISOString()})));
                            }} style={{ fontSize:10, color:"#666", background:"transparent", border:"none", cursor:"pointer", textDecoration:"underline" }}>
                              Mark all read
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    {/* Phase 101 Sub-D: mark-read on row click + navigate to link */}
                    {notifications.length === 0 && (
                      <div style={{ padding:"24px 16px", textAlign:"center", fontSize:12, color:"#999" }}>
                        No notifications yet.
                      </div>
                    )}
                    {notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={async () => {
                          try {
                            if (!n.read) await notificationAPI.markRead(n.id);
                            setNotifications(prev => prev.map(x => x.id === n.id ? {...x, read: true, read_at: x.read_at || new Date().toISOString()} : x));
                          } catch (e) { /* non-fatal */ }
                          if (n.link) { setNotifOpen(false); navigate(n.link); }
                        }}
                        style={{
                          padding:"12px 16px",
                          display:"flex", alignItems:"flex-start", gap:10,
                          borderBottom:"1px solid #f5f5f5",
                          cursor: n.link ? "pointer" : "default",
                          background: n.read ? "transparent" : "#fffdf7",
                          transition:"background 0.15s",
                        }}
                        onMouseEnter={e => e.currentTarget.style.background="#fafafa"}
                        onMouseLeave={e => e.currentTarget.style.background = n.read ? "transparent" : "#fffdf7"}
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
                {/* Phase 68 — compact plan pill, hidden on small screens to
                    keep the topbar uncluttered. Sidebar PlanBadge is the
                    primary surface; this is a glance-affordance for users
                    on a wide screen. */}
                <div className="hidden md:block">
                  <PlanBadge variant="topbar" />
                </div>
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

        {/* Mobile Ship 1 (27 May 2026): slide-down search panel for mobile */}
        {mobileSearchOpen && (
          <div className="md:hidden" style={{
            padding:"12px 16px",
            background: C.topbarBg,
            borderBottom: `1px solid ${C.topbarBorder}`,
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}>
            <SearchBar
              onSearch={(term, mode) => {
                const modeParam = mode && mode !== 'keyword' ? `&mode=${mode}` : '';
                setMobileSearchOpen(false);
                navigate(`/search?q=${encodeURIComponent(term)}${modeParam}`);
              }}
              showAiToggle
              placeholder="Ask or search..."
            />
          </div>
        )}

        {/* Page content */}
        <main style={{ flex:1, overflowY:"auto", background: C.pageBg }}>
          {/* Phase 60.3 (s50): persistent role tabs at top of every dashboard page.
              Hidden for admin/evaluator (single-role legacy personas) inside RoleTabs itself. */}
          <RoleTabs />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
