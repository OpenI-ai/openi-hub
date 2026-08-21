import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { personaDashboardAPI } from '../../services/api';
import { PERSONAS } from '../../config/personas';
import WhoViewedProfile from '../../components/WhoViewedProfile';
import MfaBanner from '../../components/MfaBanner';
import ProfileScoreAiCard from '../../components/ProfileScoreAiCard';
import PlanHeroTile from '../../components/PlanHeroTile'; // Phase 68 — plan visibility
import {
  Rocket, GraduationCap, BookOpen, Building2, Landmark, TrendingUp, Users,
  FlaskConical, Home, Zap, ArrowRight, Loader2, Target, Star, FolderKanban,
  Shield, Search, MessageSquare, CalendarCheck, Calendar, Clock, Video,
  FileText, ThumbsUp, MapPin, BarChart2, Briefcase, Eye, DollarSign, Award, Link2,
} from 'lucide-react';
import toast from 'react-hot-toast';

const G = '#D0A848';
const card = { background: '#fff', border: '1px solid #eee', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' };

const ICON_MAP = {
  Rocket, GraduationCap, BookOpen, Building2, Landmark, TrendingUp, Users,
  FlaskConical, Home, Zap, Target, Star, FolderKanban, Shield, Search,
  MessageSquare, CalendarCheck, Calendar, FileText, ThumbsUp, MapPin,
  BarChart2, Briefcase, Eye, Clock, Video,
};

// ── Per-persona config: stats, quick actions ─────────────────
const DASHBOARD_CONFIG = {
  startup: {
    subtitle: 'Startup Innovation Dashboard',
    stats: [
      { key: 'applications', label: 'My Applications', icon: Target, color: '#2563eb', to: '/dashboard/marketplace' },
      { key: 'projects', label: 'Projects', icon: FolderKanban, color: '#16a34a', to: '/dashboard/projects' },
      { key: 'mentors', label: 'Mentors', icon: Users, color: '#ec4899', to: '/dashboard/mentors' },
      { key: 'deeptech_assessments', label: 'DeepTech', icon: Zap, color: '#f59e0b', to: '/dashboard/deeptech' },
    ],
    quickActions: [
      { label: 'Browse Challenges', desc: 'Find corporate innovation challenges', icon: Target, to: '/dashboard/marketplace', color: G },
      { label: 'Find Investors', desc: 'Connect with VCs and angel investors', icon: TrendingUp, to: '/dashboard/directory', color: '#f59e0b' },
      { label: 'Find Corporates', desc: 'Explore corporate partnerships', icon: Building2, to: '/dashboard/directory', color: '#16a34a' },
      { label: 'Find Labs', desc: 'Book equipment and lab facilities', icon: FlaskConical, to: '/dashboard/infrastructure', color: '#14b8a6' },
      { label: 'Find Mentors', desc: 'Get guidance from industry experts', icon: Users, to: '/dashboard/mentors', color: '#ec4899' },
    ],
  },
  student: {
    subtitle: 'Student Innovation Dashboard',
    stats: [
      { key: 'projects', label: 'My Projects', icon: FolderKanban, color: G, to: '/dashboard/student/portfolio' },
      { key: 'certifications', label: 'Certifications', icon: Award, color: '#16a34a', to: '/dashboard/student/portfolio' },
      { key: 'applications', label: 'Applications', icon: Target, color: '#2563eb', to: '/dashboard/marketplace' },
      { key: 'active_mentorships', label: 'Active Mentorships', icon: Users, color: '#ec4899', to: '/dashboard/student/mentorships' },
      { key: 'connections', label: 'Connections', icon: Link2, color: '#7c3aed', to: '/dashboard/network' },
    ],
    quickActions: [
      { label: 'Add Project', desc: 'Showcase your research or hackathon project', icon: FolderKanban, to: '/dashboard/student/portfolio', color: G },
      { label: 'Browse Challenges', desc: 'Apply to innovation challenges', icon: Target, to: '/dashboard/marketplace', color: '#2563eb' },
      { label: 'Find Mentors', desc: 'Connect with experienced mentors', icon: Users, to: '/dashboard/directory', color: '#ec4899' },
      { label: 'Track Mentorship', desc: 'Log your mentorship journey', icon: CalendarCheck, to: '/dashboard/student/mentorships', color: '#f59e0b' },
      { label: 'Explore Directory', desc: 'Discover innovators, labs, and startups', icon: Search, to: '/dashboard/directory', color: '#3b82f6' },
      { label: 'Browse Startups', desc: 'Find internship & collaboration opportunities', icon: Rocket, to: '/dashboard/startups', color: '#16a34a' },
    ],
  },
  academia: {
    subtitle: 'Academic Innovation Dashboard',
    stats: [
      { key: 'research_projects', label: 'Research Projects', icon: FlaskConical, color: G, to: '/dashboard/academia/research' },
      { key: 'publications', label: 'Publications', icon: BookOpen, color: '#7c3aed', to: '/dashboard/academia/publications' },
      { key: 'grants_active', label: 'Active Grants', icon: DollarSign, color: '#16a34a', to: '/dashboard/academia/grants' },
      { key: 'applications', label: 'Applications', icon: Target, color: '#2563eb', to: '/dashboard/marketplace' },
      { key: 'connections', label: 'Connections', icon: Link2, color: '#ec4899', to: '/dashboard/network' },
      { key: 'lab_bookings', label: 'Lab Bookings', icon: FlaskConical, color: '#14b8a6', to: '/dashboard/infrastructure' },
    ],
    quickActions: [
      { label: 'Add Research', desc: 'Track your research projects and collaborations', icon: FlaskConical, to: '/dashboard/academia/research', color: G },
      { label: 'Add Publication', desc: 'Journal papers, conference proceedings, preprints', icon: BookOpen, to: '/dashboard/academia/publications', color: '#7c3aed' },
      { label: 'Track Grants', desc: 'Manage grant applications and funding', icon: DollarSign, to: '/dashboard/academia/grants', color: '#16a34a' },
      { label: 'Browse Challenges', desc: 'Apply to innovation challenges', icon: Target, to: '/dashboard/marketplace', color: '#2563eb' },
      { label: 'Explore Directory', desc: 'Find collaborators, startups, and labs', icon: Search, to: '/dashboard/directory', color: '#3b82f6' },
      { label: 'Browse Startups', desc: 'Find collaboration opportunities', icon: Rocket, to: '/dashboard/startups', color: '#f59e0b' },
    ],
  },
  government: {
    subtitle: 'Government Innovation Dashboard',
    stats: [
      { key: 'startups_tracked', label: 'Startups Tracked', icon: Rocket, color: G, to: '/dashboard/startups' },
      { key: 'deeptech_startups', label: 'DeepTech Startups', icon: Zap, color: '#7c3aed', to: '/dashboard/startups' },
      { key: 'programs', label: 'Programs', icon: FileText, color: '#0ea5e9', to: '/dashboard/evaluations' },
      { key: 'total_challenges', label: 'Challenges', icon: Target, color: '#16a34a', to: '/dashboard/corporate/challenges' },
      { key: 'unicorn_candidates', label: 'Unicorn Candidates', icon: Star, color: '#f59e0b', to: '/dashboard/startups' },
    ],
    quickActions: [
      { label: 'Post Challenge/RFP', desc: 'Post innovation challenges for startups', icon: Target, to: '/dashboard/corporate/challenges', color: G },
      { label: 'Discover Startups', desc: 'Browse the startup ecosystem', icon: Rocket, to: '/dashboard/startups', color: '#f59e0b' },
      { label: 'Manage Programs', desc: 'Track evaluation programs', icon: FileText, to: '/dashboard/evaluations', color: '#0ea5e9' },
      { label: 'View Cohorts', desc: 'Monitor incubation cohorts', icon: GraduationCap, to: '/dashboard/cohorts', color: '#7c3aed' },
      { label: 'Govt APIs', desc: 'Integration with govt databases', icon: Landmark, to: '/dashboard/govt-apis', color: '#16a34a' },
      { label: 'Explore Directory', desc: 'Find startups, mentors, labs', icon: Search, to: '/dashboard/directory', color: '#3b82f6' },
    ],
  },
  investor: {
    subtitle: 'Investor Dashboard',
    stats: [
      { key: 'total_deals', label: 'Active Deals', icon: Target, color: '#f59e0b', to: '/dashboard/investor/deals' },
      { key: 'watchlists', label: 'Watchlists', icon: Star, color: '#2563eb', to: '/dashboard/watchlist' },
      { key: 'watched_startups', label: 'Tracked Startups', icon: Eye, color: '#7c3aed', to: '/dashboard/watchlist' },
    ],
    quickActions: [
      { label: 'Deal Pipeline', desc: 'Manage your investment pipeline', icon: Target, to: '/dashboard/investor/deals', color: G },
      { label: 'Portfolio', desc: 'Track portfolio companies', icon: Briefcase, to: '/dashboard/investor/portfolio', color: '#16a34a' },
      { label: 'Discover Startups', desc: 'Find high-potential startups', icon: Rocket, to: '/dashboard/startups', color: '#f59e0b' },
      { label: 'My Watchlists', desc: 'Curated startup lists', icon: Star, to: '/dashboard/watchlist', color: '#2563eb' },
      { label: 'DeepTech Scores', desc: 'Technology readiness assessments', icon: Zap, to: '/dashboard/deeptech', color: '#7c3aed' },
      { label: 'Explore Directory', desc: 'Find co-investors and labs', icon: Search, to: '/dashboard/directory', color: '#3b82f6' },
    ],
  },
  mentor: {
    subtitle: 'Mentor Dashboard',
    stats: [
      { key: 'active_mentees', label: 'Active Mentees', icon: Users, color: '#ec4899', to: '/dashboard/startups' },
      { key: 'total_sessions', label: 'Total Sessions', icon: CalendarCheck, color: '#16a34a', to: '/dashboard/meetings' },
      { key: 'projects', label: 'Projects', icon: FolderKanban, color: '#3b82f6', to: '/dashboard/projects' },
      { key: 'feedback_given', label: 'Feedback Given', icon: ThumbsUp, color: '#f59e0b', to: '/dashboard/feedback' },
    ],
    quickActions: [
      { label: 'Browse Startups', desc: 'Find startups to mentor', icon: Rocket, to: '/dashboard/startups', color: G },
      { label: 'My Projects', desc: 'Track mentorship projects', icon: FolderKanban, to: '/dashboard/projects', color: '#3b82f6' },
      { label: 'Give Feedback', desc: 'Share evaluations and notes', icon: ThumbsUp, to: '/dashboard/feedback', color: '#f59e0b' },
      { label: 'Explore Directory', desc: 'Connect with other mentors', icon: Search, to: '/dashboard/directory', color: '#ec4899' },
    ],
  },
  lab: {
    subtitle: 'Lab Management Dashboard',
    stats: [
      { key: 'equipment_count', label: 'Equipment', icon: FlaskConical, color: '#14b8a6', to: '/dashboard/infrastructure' },
      { key: 'active_bookings', label: 'Active Bookings', icon: CalendarCheck, color: '#2563eb', to: '/dashboard/infrastructure' },
      { key: 'capacity', label: 'Capacity', icon: Users, color: '#f59e0b', to: '/dashboard/infrastructure' },
    ],
    quickActions: [
      { label: 'Manage Infrastructure', desc: 'Equipment and facility management', icon: Building2, to: '/dashboard/infrastructure', color: '#14b8a6' },
      { label: 'Browse Startups', desc: 'Find startups needing lab access', icon: Rocket, to: '/dashboard/startups', color: G },
      { label: 'Explore Directory', desc: 'Connect with researchers', icon: Search, to: '/dashboard/directory', color: '#3b82f6' },
    ],
  },
  incubator: {
    subtitle: 'Incubator Dashboard',
    stats: [
      { key: 'total_programs', label: 'Total Programs', icon: GraduationCap, color: '#8b5cf6', to: '/dashboard/incubator/programs' },
      { key: 'active_programs', label: 'Active Programs', icon: Target, color: '#16a34a', to: '/dashboard/incubator/programs' },
      { key: 'pipeline_total', label: 'Pipeline Startups', icon: Rocket, color: '#3b82f6', to: '/dashboard/incubator/programs' },
      { key: 'applications_pending', label: 'Pending Apps', icon: Clock, color: '#f59e0b', to: '/dashboard/incubator/programs' },
      { key: 'graduated_count', label: 'Graduated', icon: Star, color: '#ca8a04', to: '/dashboard/incubator/programs' },
      { key: 'mentor_pool_active', label: 'Active Mentors', icon: Users, color: '#ec4899', to: '/dashboard/incubator/mentors' },
    ],
    quickActions: [
      { label: 'Manage Programs', desc: 'Create and run incubation programs', icon: GraduationCap, to: '/dashboard/incubator/programs', color: G },
      { label: 'Mentor Pool', desc: 'Manage mentors associated with your incubator', icon: Users, to: '/dashboard/incubator/mentors', color: '#ec4899' },
      { label: 'Discover Startups', desc: 'Scout startups for incubation', icon: Rocket, to: '/dashboard/startups', color: '#3b82f6' },
      { label: 'My Projects', desc: 'Track startup projects', icon: FolderKanban, to: '/dashboard/projects', color: '#16a34a' },
      { label: 'Explore Directory', desc: 'Connect with ecosystem players', icon: Search, to: '/dashboard/directory', color: '#f59e0b' },
    ],
  },
  accelerator: {
    subtitle: 'Accelerator Dashboard',
    stats: [
      { key: 'total_batches', label: 'Total Batches', icon: GraduationCap, color: '#ef4444', to: '/dashboard/accelerator/batches' },
      { key: 'active_batches', label: 'Active Batches', icon: Target, color: '#16a34a', to: '/dashboard/accelerator/batches' },
      { key: 'pipeline_total', label: 'Pipeline Startups', icon: Rocket, color: '#3b82f6', to: '/dashboard/accelerator/batches' },
      { key: 'graduated_count', label: 'Graduated', icon: Star, color: '#ca8a04', to: '/dashboard/accelerator/batches' },
      { key: 'corporate_partners_active', label: 'Corp Partners', icon: Briefcase, color: '#8b5cf6', to: '/dashboard/accelerator/partners' },
      { key: 'investor_network_active', label: 'Investors', icon: DollarSign, color: '#f59e0b', to: '/dashboard/accelerator/partners' },
    ],
    quickActions: [
      { label: 'Manage Batches', desc: 'Create and run accelerator batches', icon: GraduationCap, to: '/dashboard/accelerator/batches', color: G },
      { label: 'Partners & Network', desc: 'Corporate partners, investors, demo days', icon: Briefcase, to: '/dashboard/accelerator/partners', color: '#8b5cf6' },
      { label: 'Discover Startups', desc: 'Find startups for acceleration', icon: Rocket, to: '/dashboard/startups', color: '#3b82f6' },
      { label: 'My Watchlists', desc: 'Curated startup lists', icon: Star, to: '/dashboard/watchlist', color: '#f59e0b' },
      { label: 'Explore Directory', desc: 'Connect with ecosystem players', icon: Search, to: '/dashboard/directory', color: '#ec4899' },
    ],
  },
  service_provider: {
    subtitle: 'Service Provider Dashboard',
    stats: [
      { key: 'services_offered', label: 'Services Offered', icon: Briefcase, color: '#0d9488', to: '/dashboard/profile' },
      { key: 'startup_connections', label: 'Startup Connections', icon: Rocket, color: '#f59e0b', to: '/dashboard/directory' },
      { key: 'certifications_count', label: 'Certifications', icon: Shield, color: '#7c3aed', to: '/dashboard/profile' },
    ],
    quickActions: [
      { label: 'Browse Challenges', desc: 'Find corporate challenges to support', icon: Target, to: '/dashboard/marketplace', color: G },
      { label: 'Discover Startups', desc: 'Find startups that need your services', icon: Rocket, to: '/dashboard/startups', color: '#f59e0b' },
      { label: 'Find Mentors', desc: 'Connect with mentors in your domain', icon: Users, to: '/dashboard/mentors', color: '#ec4899' },
      { label: 'Explore Directory', desc: 'Connect with the ecosystem', icon: Search, to: '/dashboard/directory', color: '#3b82f6' },
      { label: 'Schedule Meeting', desc: 'Set up meetings with potential clients', icon: CalendarCheck, to: '/dashboard/meetings', color: '#16a34a' },
    ],
  },
};

const fmtDate = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
};
const fmtTime = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

export default function PersonaDashboard() {
  const { user, activeRole } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Phase 60.3 (s50): honor activeRole for multi-persona accounts; fall back
  // to legacy user.role for back-compat with old caches.
  const role = activeRole || user?.role;
  const config = DASHBOARD_CONFIG[role];
  const persona = PERSONAS[role] || {};
  const PersonaIcon = ICON_MAP[persona.icon] || Rocket;

  useEffect(() => { loadDashboard(); }, []);

  const loadDashboard = async () => {
    try {
      const d = await personaDashboardAPI.dashboard();
      setData(d);
    } catch (err) { toast.error('Failed to load dashboard'); }
    finally { setLoading(false); }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Loader2 size={28} className="animate-spin" style={{ color: G }} /></div>;

  if (!config) return <div style={{ padding: 24, textAlign: 'center', color: '#666' }}>Dashboard not available for this role</div>;

  const stats = (config.stats || []).map(s => ({
    ...s,
    value: data?.stats?.[s.key] ?? 0,
  }));

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      {/* Phase 54: MFA enrollment nudge (hidden for demo/admin + already-enrolled users) */}
      <MfaBanner />

      {/* Welcome Card */}
      <div id="tour-welcome" style={{ ...card, padding: '20px 24px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: `${persona.color || G}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <PersonaIcon size={22} style={{ color: persona.color || G }} />
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>
            Welcome, {user?.organization_name || user?.name}
          </h1>
          <p style={{ fontSize: 13, color: '#666', margin: 0 }}>{config.subtitle}</p>
        </div>
        {/* Profile score */}
        {data?.profile_score != null && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: '#666', marginBottom: 2 }}>Profile</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 80, height: 6, borderRadius: 3, background: '#f3f4f6' }}>
                <div style={{ height: '100%', borderRadius: 3, width: `${data.profile_score}%`,
                  background: data.profile_score >= 70 ? '#16a34a' : data.profile_score >= 40 ? '#f59e0b' : '#ef4444' }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#555' }}>{data.profile_score}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Phase 68 — current plan + Upgrade affordance, all 11 personas */}
      <PlanHeroTile />

      {/* Who viewed your profile — providers only (Phase 37) */}
      <div style={{ marginBottom: 16 }}>
        <WhoViewedProfile />
      </div>

      {/* Phase 7 (P7) — AI Profile Insights (s24 P7b: enabled for all personas with scoring config) */}
      <div id="tour-profile-score">
        <ProfileScoreAiCard completenessScore={data?.profile_score ?? null} />
      </div>


      {/* Common mini-stats row */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Meetings', value: data?.upcoming_meetings || 0, icon: CalendarCheck, color: G, to: '/dashboard/meetings' },
          { label: 'Messages', value: data?.unread_messages || 0, icon: MessageSquare, color: '#3b82f6', to: '/dashboard/messaging' },
          { label: 'Events', value: data?.upcoming_events || 0, icon: Calendar, color: '#16a34a', to: '/dashboard/events' },
        ].map(s => (
          <div key={s.label} onClick={() => navigate(s.to)}
            style={{ ...card, padding: '10px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 140px' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = s.color}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#eee'}>
            <s.icon size={16} style={{ color: s.color }} />
            <span style={{ fontSize: 12, color: '#666' }}>{s.label}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginLeft: 'auto' }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Stat Cards */}
      <div id="tour-stat-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 20 }}>
        {stats.map(s => (
          <div key={s.key} style={{ ...card, padding: 18, cursor: 'pointer' }} onClick={() => navigate(s.to)}
            onMouseEnter={e => e.currentTarget.style.borderColor = s.color}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#eee'}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: `${s.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.icon size={18} style={{ color: s.color }} />
              </div>
              <span style={{ fontSize: 12, color: '#5c5c5c', fontWeight: 500 }}>{s.label}</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#1a1a1a' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Two column: Quick Actions + Upcoming Meetings */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
        {/* Quick Actions */}
        <div id="tour-quick-actions">
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 }}>Quick Actions</h2>
          <div style={{ display: 'grid', gap: 10 }}>
            {(config.quickActions || []).map(a => (
              <div key={a.label} style={{ ...card, padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
                onClick={() => navigate(a.to)}
                onMouseEnter={e => { e.currentTarget.style.borderColor = a.color; e.currentTarget.style.background = '#fafafa'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#eee'; e.currentTarget.style.background = '#fff'; }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: `${a.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <a.icon size={17} style={{ color: a.color }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{a.label}</div>
                  <div style={{ fontSize: 11, color: '#5c5c5c' }}>{a.desc}</div>
                </div>
                <ArrowRight size={14} style={{ color: '#ccc' }} />
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Meetings */}
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 }}>Upcoming Meetings</h2>
          <div style={{ ...card, padding: 0 }}>
            {(data?.recent_meetings || []).length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center' }}>
                <CalendarCheck size={28} style={{ color: '#ddd', marginBottom: 8 }} />
                <div style={{ fontSize: 13, color: '#666' }}>No upcoming meetings</div>
                <button onClick={() => navigate('/dashboard/meetings')}
                  style={{ marginTop: 8, fontSize: 12, fontWeight: 600, color: G, background: 'none', border: 'none', cursor: 'pointer' }}>
                  Schedule a Meeting
                </button>
              </div>
            ) : (
              (data?.recent_meetings || []).map((m, i) => (
                <div key={m.id} onClick={() => navigate('/dashboard/meetings')}
                  style={{ padding: '12px 16px', borderBottom: i < (data.recent_meetings.length - 1) ? '1px solid #f5f5f5' : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                  onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: '#fff8ec', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <CalendarCheck size={16} style={{ color: G }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.title}</div>
                    <div style={{ fontSize: 11, color: '#5c5c5c' }}>
                      {fmtDate(m.start_time)} at {fmtTime(m.start_time)}
                      {m.participant_count && <span> · {m.participant_count} participants</span>}
                    </div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                    background: m.status === 'confirmed' ? '#f0fdf4' : '#fefce8',
                    color: m.status === 'confirmed' ? '#16a34a' : '#ca8a04' }}>
                    {m.status === 'confirmed' ? 'Confirmed' : 'Proposed'}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Directory CTA */}
          <div style={{ ...card, padding: '16px 18px', marginTop: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
            onClick={() => navigate('/dashboard/directory')}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.background = '#fafafa'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#eee'; e.currentTarget.style.background = '#fff'; }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Search size={17} style={{ color: '#3b82f6' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>Explore the Ecosystem</div>
              <div style={{ fontSize: 11, color: '#5c5c5c' }}>Discover innovators, mentors, investors & more</div>
            </div>
            <ArrowRight size={14} style={{ color: '#ccc' }} />
          </div>
        </div>
      </div>

      {/* Recommended Challenges — startup only */}
      {role === 'startup' && (data?.stats?.recommended_challenges || []).length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>
              <Target size={15} style={{ verticalAlign: -3, marginRight: 6, color: G }} />Recommended Challenges
            </h2>
            <button onClick={() => navigate('/dashboard/marketplace')}
              style={{ fontSize: 11, fontWeight: 600, color: G, background: 'none', border: 'none', cursor: 'pointer' }}>
              Browse all →
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {(data.stats.recommended_challenges).slice(0, 4).map(c => (
              <div key={c.id} style={{ ...card, padding: 14, cursor: 'pointer' }}
                onClick={() => navigate('/dashboard/marketplace')}
                onMouseEnter={e => e.currentTarget.style.borderColor = G}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#eee'}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.title}</div>
                <div style={{ fontSize: 11, color: '#5c5c5c', marginBottom: 8 }}>
                  {c.company_name || 'Corporate'}{c.budget_range ? ` · ${c.budget_range}` : ''}
                  {c.deadline ? ` · Due ${new Date(c.deadline).toLocaleDateString()}` : ''}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                  {(c.sectors || []).slice(0, 2).map(t => <span key={t} style={{ fontSize: 9, padding: '2px 7px', borderRadius: 20, background: '#eff6ff', color: '#2563eb' }}>{t}</span>)}
                  {(c.technologies || []).slice(0, 2).map(t => <span key={t} style={{ fontSize: 9, padding: '2px 7px', borderRadius: 20, background: '#fefce8', color: '#a16207' }}>{t}</span>)}
                  {parseInt(c.match_score) > 0 && <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 20, background: '#fff7ed', color: '#c2410c', fontWeight: 600 }}>{c.match_score}pt match</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Partners — startup only (investors, mentors, incubators, accelerators) */}
      {role === 'startup' && (data?.stats?.recommended_partners || []).length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>
              <Users size={15} style={{ verticalAlign: -3, marginRight: 6, color: '#8b5cf6' }} />Recommended for You
            </h2>
            <button onClick={() => navigate('/dashboard/directory')}
              style={{ fontSize: 11, fontWeight: 600, color: '#8b5cf6', background: 'none', border: 'none', cursor: 'pointer' }}>
              Explore directory →
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
            {(data.stats.recommended_partners).slice(0, 6).map(p => {
              const persona = PERSONAS[p.persona_type] || {};
              return (
                <div key={p.user_id} style={{ ...card, padding: 14, cursor: 'pointer' }}
                  onClick={() => navigate('/dashboard/directory')}
                  onMouseEnter={e => e.currentTarget.style.borderColor = persona.color || '#999'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#eee'}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 6 }}>
                    {p.logo_url || p.avatar ? (
                      <img src={p.logo_url || p.avatar} alt="" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover', border: '1px solid #eee' }} />
                    ) : (
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#666' }}>
                        {(p.display_name || p.organization || '?')[0]}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.display_name || p.organization}</div>
                      <div style={{ fontSize: 10, color: '#5c5c5c' }}>{p.organization}{p.city ? ` · ${p.city}` : ''}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: `${persona.color || '#999'}14`, color: persona.color || '#999' }}>
                    {persona.label || p.persona_type}
                  </span>
                  {(p.sectors || []).length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 6 }}>
                      {p.sectors.slice(0, 3).map(t => <span key={t} style={{ fontSize: 9, padding: '2px 7px', borderRadius: 20, background: '#eff6ff', color: '#2563eb' }}>{t}</span>)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
