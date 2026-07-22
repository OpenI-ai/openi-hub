import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AuthProvider } from './context/AuthContext';

// Pages — Auth
import Landing           from './pages/auth/Landing';
import Register          from './pages/auth/Register';
import VerifyEmail       from './pages/auth/VerifyEmail';
import ForgotPassword    from './pages/auth/ForgotPassword';
import ResetPassword     from './pages/auth/ResetPassword';
import Terms             from './pages/auth/Terms';      // Phase 60.7 (s50)
import Privacy           from './pages/auth/Privacy';    // Phase 60.7 (s50)

// Pages — Public
import PublicMarketplace from './pages/public/PublicMarketplace';
import PublicReports     from './pages/public/PublicReports';
import PublicFAQ         from './pages/public/PublicFAQ';
import SharedChallenge   from './pages/public/SharedChallenge';
import SharedWatchlist   from './pages/public/SharedWatchlist';
import SharedStartupProfile from './pages/public/SharedStartupProfile';  // Phase 110
import SharedStudentPortfolio from './pages/public/SharedStudentPortfolio';  // 17 Jun 2026 — public student portfolio share
import SharedDeepTech from './pages/public/SharedDeepTech';  // Phase 111 Ship 2a
import SharedEightVectorSelf from './pages/public/SharedEightVectorSelf';  // Phase 111 Ship 2c
import SharedProgramEval from './pages/public/SharedProgramEval';  // Phase 111 Ship 2d
import GlobalSearch      from './pages/public/GlobalSearch';

// Pages — Dashboard
import Login             from './pages/dashboard/Login';
import DashboardLayout   from './pages/dashboard/DashboardLayout';
import DashboardHome     from './pages/dashboard/DashboardHome';
import MyProfile         from './pages/dashboard/MyProfile';
import CorporateDashboard       from './pages/dashboard/CorporateDashboard';
import CorporateStartupSearch   from './pages/dashboard/CorporateStartupSearch';
import CorporateChallenges      from './pages/dashboard/CorporateChallenges';
import CorporateCollaborations  from './pages/dashboard/CorporateCollaborations';
import InvestorDeals            from './pages/dashboard/InvestorDeals';
import InvestorPortfolio        from './pages/dashboard/InvestorPortfolio';
import InvestorDealRequests     from './pages/dashboard/InvestorDealRequests';
import IncubatorPrograms        from './pages/dashboard/IncubatorPrograms';
const IncubatorProgramDetail   = lazy(() => import('./pages/dashboard/IncubatorProgramDetail'));
import IncubatorMentorPool      from './pages/dashboard/IncubatorMentorPool';
import AcceleratorBatches       from './pages/dashboard/AcceleratorBatches';
const AcceleratorBatchDetail   = lazy(() => import('./pages/dashboard/AcceleratorBatchDetail'));
import AcceleratorPartners      from './pages/dashboard/AcceleratorPartners';
import ProgramServicePartners   from './pages/dashboard/ProgramServicePartners';
import StartupEvaluation from './pages/dashboard/StartupEvaluation';
import StartupDiscovery  from './pages/dashboard/StartupDiscovery';
import StudentDiscovery  from './pages/dashboard/StudentDiscovery';
import AcademiaDiscovery from './pages/dashboard/AcademiaDiscovery';
import StartupProfile    from './pages/dashboard/StartupProfile';
import RegisterStartup   from './pages/dashboard/RegisterStartup';
import Evaluations       from './pages/dashboard/Evaluations';
import Cohorts           from './pages/dashboard/Cohorts';
import Mentors           from './pages/dashboard/Mentors';
import IPRDatabase       from './pages/dashboard/IPRDatabase';
import Infrastructure    from './pages/dashboard/Infrastructure';
import Knowledge         from './pages/dashboard/Knowledge';
import StartupCrawling   from './pages/dashboard/StartupCrawling';
import ProjectManagement from './pages/dashboard/ProjectManagement';
import Messaging         from './pages/dashboard/Messaging';
import StartupPipeline   from './pages/dashboard/StartupPipeline';
import DocumentRepository   from './pages/dashboard/DocumentRepository';
import StartupWatchlist     from './pages/dashboard/StartupWatchlist';
import DeepTechQualification from './pages/dashboard/DeepTechQualification';
import EventsRepository     from './pages/dashboard/EventsRepository';
import CorporateRecommendedStartups from './pages/dashboard/CorporateRecommendedStartups';
import StartupFeedback      from './pages/dashboard/StartupFeedback';
import GovtAPIIntegrations  from './pages/dashboard/GovtAPIIntegrations';
import Marketplace          from './pages/dashboard/Marketplace';
import Directory            from './pages/dashboard/Directory';
import Meetings             from './pages/dashboard/Meetings';
import PersonaDashboard     from './pages/dashboard/PersonaDashboard';
import Settings             from './pages/dashboard/Settings';
import MyNetwork            from './pages/dashboard/MyNetwork';
import UserProfile          from './pages/dashboard/UserProfile';
import OrgAdmin             from './pages/dashboard/OrgAdmin';
import SPServices           from './pages/dashboard/SPServices';
import MentorSessions       from './pages/dashboard/MentorSessions';
import MentorAvailability   from './pages/dashboard/MentorAvailability';
import LabEquipment         from './pages/dashboard/LabEquipment';
import LabPublications      from './pages/dashboard/LabPublications';
import LabAnnouncements     from './pages/dashboard/LabAnnouncements';
import BrowseLabFacilities  from './pages/dashboard/BrowseLabFacilities';
import FindMentees          from './pages/dashboard/FindMentees';
import Onboarding           from './pages/dashboard/Onboarding';
import WhatsNew             from './pages/dashboard/WhatsNew';
// T32-99c: ChallengeInvites import
import ChallengeInvites     from './pages/dashboard/ChallengeInvites';
import ApplicationInvites   from './pages/dashboard/ApplicationInvites';
import FeatureMap           from './pages/dashboard/FeatureMap';
// s48 — lazy-loaded so recharts (~121 KB gz) is only fetched
// when user navigates to one of these admin/portfolio surfaces.
const AdminAnalytics       = lazy(() => import('./pages/dashboard/AdminAnalytics'));
// Phase 102-3: AdminCosts (lazy — uses recharts)
const AdminCosts           = lazy(() => import('./pages/dashboard/AdminCosts'));
// A: Admin Platform-Health dashboard (lazy - uses recharts)
const AdminPlatformHealth = lazy(() => import('./pages/dashboard/AdminPlatformHealth'));
const ChallengesToReview   = lazy(() => import('./pages/dashboard/ChallengesToReview'));
import AdminConsole         from './pages/dashboard/AdminConsole';
import AdminUsers           from './pages/dashboard/AdminUsers';
import AdminChallenges      from './pages/dashboard/AdminChallenges';
import AdminStartups        from './pages/dashboard/AdminStartups';
import AdminLicenses        from './pages/dashboard/AdminLicenses';
import AdminClaims          from './pages/dashboard/AdminClaims';
import AdminKnowledge       from './pages/dashboard/AdminKnowledge';
import MyClaims             from './pages/dashboard/MyClaims';
import ClaimVerify          from './pages/auth/ClaimVerify';
import AcceptInvite        from './pages/auth/AcceptInvite';   // Phase 108
import SSOCallback         from './pages/auth/SSOCallback';    // Phase 127
import AddRole              from './pages/dashboard/AddRole';     // Phase 60.4b (s50)
import StudentPortfolio    from './pages/dashboard/StudentPortfolio';
import StudentMentorships  from './pages/dashboard/StudentMentorships';
import AcademiaPortfolio   from './pages/dashboard/AcademiaPortfolio';
import Clusters            from './pages/dashboard/Clusters';
import ClusterDetail       from './pages/dashboard/ClusterDetail';
// s32 P1.4 — Discovery surfaces consuming cluster-bridge endpoints
import StudentRecommendedStartups    from './pages/dashboard/StudentRecommendedStartups';
import AcademiaRecommendedStartups   from './pages/dashboard/AcademiaRecommendedStartups';
// s36 — Discovery surfaces for investor/incubator/accelerator
import InvestorRecommendedStartups    from './pages/dashboard/InvestorRecommendedStartups';
import IncubatorRecommendedStartups   from './pages/dashboard/IncubatorRecommendedStartups';
import AcceleratorRecommendedStartups from './pages/dashboard/AcceleratorRecommendedStartups';

// s38 — minimal inline placeholder for nav targets whose backend is not yet wired
function ComingSoonPlaceholder({ title, note }) {
  return (
    <div style={{ padding: '48px 24px', maxWidth: 640 }}>
      <h1 style={{ color: '#152838', fontSize: 24, fontWeight: 700, marginBottom: 12 }}>{title}</h1>
      <p style={{ color: '#585858', fontSize: 15, lineHeight: 1.6 }}>{note}</p>
      <p style={{ color: '#D0A848', fontSize: 13, marginTop: 16, fontWeight: 600 }}>Coming soon</p>
    </div>
  );
}

// ── Guard: redirect to login if not authenticated ─────────────
function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/dashboard/login" replace />;
}

// ── Guard: admin-only routes (s49 fix) ────────────────────────
// Sidebar already hides admin nav for non-admins (DashboardLayout
// roles filter) and backend rejects API calls with 401, but direct-URL
// access landed users on an empty admin shell that looked broken.
// This guard sends non-admin users back to the dashboard root.
function AdminRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/dashboard/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

// ── Root route: show Landing for guests, Dashboard for logged-in users ────
function RootRoute() {
  const { user } = useAuth();
  return user ? <Navigate to="/dashboard" replace /> : <Landing />;
}

// ── Login route: redirect to dashboard if already authenticated ────
// Defense in depth alongside Login.jsx's post-success navigate. Handles the
// case where AuthContext state lifts before the imperative navigate runs.
function LoginRoute() {
  const { user } = useAuth();
  return user ? <Navigate to="/dashboard" replace /> : <Login />;
}

// s49e — global handler: when ANY API call rejects with 403 EMAIL_NOT_VERIFIED,
// route the user to /verify-email and show a toast. Must be a child of
// BrowserRouter to access useNavigate.
function EmailVerifyBridge() {
  const navigate = useNavigate();
  useEffect(() => {
    const handler = (e) => {
      // Avoid loop if we're already on the verify page
      if (window.location.pathname.startsWith('/verify-email')) return;
      try {
        const stored = localStorage.getItem('openi_user');
        const u = stored ? JSON.parse(stored) : null;
        const target = u?.email
          ? `/verify-email?email=${encodeURIComponent(u.email)}`
          : '/verify-email';
        // Lazy import toast to avoid cycle; if missing, navigate is enough.
        import('react-hot-toast').then(({ default: toast }) => {
          toast.error(e?.detail?.message || 'Please verify your email to perform this action.');
        }).catch(() => {});
        navigate(target);
      } catch { /* swallow — best-effort UX */ }
    };
    window.addEventListener('openi:email-not-verified', handler);
    return () => window.removeEventListener('openi:email-not-verified', handler);
  }, [navigate]);
  return null;
}

// ── App ───────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <EmailVerifyBridge />
        {/* s48 — Suspense boundary for lazy-loaded routes (recharts surfaces) */}
        <Suspense fallback={<div style={{ minHeight: '100vh' }} />}>
        <Routes>
          {/* Root → Landing for guests, Dashboard for authenticated users */}
          <Route path="/" element={<RootRoute />} />

          {/* Public auth pages */}
          <Route path="/landing"         element={<Landing />} />
          <Route path="/register"        element={<Register />} />
          <Route path="/terms"           element={<Terms />} />     {/* Phase 60.7 (s50) */}
          <Route path="/privacy"         element={<Privacy />} />   {/* Phase 60.7 (s50) */}
          <Route path="/verify-email"        element={<VerifyEmail />} />
          <Route path="/verify-email/:token" element={<VerifyEmail />} />
          <Route path="/forgot-password"       element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/invite/accept/:token"  element={<AcceptInvite />} />  {/* Phase 108 */}
          <Route path="/sso/callback" element={<SSOCallback />} />  {/* Phase 127 */}
          <Route path="/marketplace"       element={<PublicMarketplace />} />
          <Route path="/marketplace/:id"   element={<PublicMarketplace />} />  {/* Phase 120 — route-based detail */}
          <Route path="/reports"            element={<PublicReports />} />
          <Route path="/faq"                element={<PublicFAQ />} />
          <Route path="/challenges/share/:token" element={<SharedChallenge />} />
          <Route path="/watchlists/share/:token" element={<SharedWatchlist />} />
          <Route path="/share/startup/:token" element={<SharedStartupProfile />} />  {/* Phase 110 */}
          <Route path="/share/student-portfolio/:token" element={<SharedStudentPortfolio />} />  {/* 17 Jun 2026 */}
          <Route path="/share/deeptech/:token" element={<SharedDeepTech />} />  {/* Phase 111 Ship 2a */}
          <Route path="/share/eight-vector-self/:token" element={<SharedEightVectorSelf />} />  {/* Phase 111 Ship 2c */}
          <Route path="/share/program-evals/:token" element={<SharedProgramEval />} />  {/* Phase 111 Ship 2d */}
          <Route path="/claims/verify/:token"    element={<ClaimVerify />} />
          <Route path="/search"                  element={<GlobalSearch />} />
          <Route path="/dashboard/login" element={<LoginRoute />} />

          {/* Protected dashboard shell */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index                      element={<DashboardHome />} />
            <Route path="profile"             element={<MyProfile />} />
            <Route path="corporate"          element={<CorporateDashboard />} />
            <Route path="corporate/search"   element={<CorporateStartupSearch />} />
            <Route path="corporate/recommended-startups" element={<CorporateRecommendedStartups />} />
            <Route path="corporate/challenges" element={<CorporateChallenges />} />
            <Route path="corporate/challenges/:id" element={<CorporateChallenges />} />  {/* Phase 120 — route-based detail */}
            <Route path="corporate/collabs"  element={<CorporateCollaborations />} />
            <Route path="investor/deal-requests" element={<InvestorDealRequests />} />
            <Route path="investor/deals"     element={<InvestorDeals />} />
            <Route path="investor/portfolio" element={<InvestorPortfolio />} />
            <Route path="incubator/programs"          element={<IncubatorPrograms />} />
            <Route path="incubator/programs/:id"      element={<IncubatorProgramDetail />} />
            <Route path="incubator/mentors"           element={<IncubatorMentorPool />} />
            <Route path="accelerator/batches"         element={<AcceleratorBatches />} />
            <Route path="accelerator/batches/:id"     element={<AcceleratorBatchDetail />} />
            <Route path="accelerator/partners"        element={<AcceleratorPartners />} />
            <Route path="program/service-partners"    element={<ProgramServicePartners />} />
            <Route path="evaluate"            element={<StartupEvaluation />} />
            <Route path="startups"            element={<StartupDiscovery />} />
            <Route path="students"            element={<StudentDiscovery />} />
            <Route path="academia"            element={<AcademiaDiscovery />} />
            <Route path="startup-profile"     element={<StartupProfile />} />
            <Route path="startup-profile/:id" element={<StartupProfile />} />
            {/* s50 (J10): alias /dashboard/startups/:id -> startup-profile/:id so
                external/copy-pasted deep links to startup detail render the
                profile + claim CTA instead of falling through to a blank page. */}
            <Route path="startups/:id"        element={<StartupProfile />} />
            <Route path="register"            element={<RegisterStartup />} />
            <Route path="evaluations"         element={<Evaluations />} />
            <Route path="cohorts"             element={<Cohorts />} />
            <Route path="mentors"             element={<Mentors />} />
            <Route path="ipr"                 element={<IPRDatabase />} />
            <Route path="infrastructure"      element={<Infrastructure />} />
            <Route path="knowledge"           element={<Knowledge />} />
            <Route path="crawling"            element={<StartupCrawling />} />
            <Route path="projects"            element={<ProjectManagement />} />
            <Route path="messaging"           element={<Messaging />} />
            <Route path="pipeline"            element={<StartupPipeline />} />
            <Route path="documents"           element={<DocumentRepository />} />
            <Route path="watchlist"           element={<StartupWatchlist />} />
            <Route path="deeptech"            element={<DeepTechQualification />} />
            <Route path="events"              element={<EventsRepository />} />
            <Route path="feedback"            element={<StartupFeedback />} />
            <Route path="govt-apis"           element={<GovtAPIIntegrations />} />
            {/* s38 — Disburse Grants placeholder; government grant-disbursement backend wires this later */}
            <Route path="government/grants"   element={<ComingSoonPlaceholder title="Disburse Grants" note="Disburse investment grants to startups. This surface is being wired up." />} />
            <Route path="marketplace"         element={<Marketplace />} />
            <Route path="marketplace/:id"     element={<Marketplace />} />  {/* Phase 120 — route-based detail */}
            <Route path="directory"           element={<Directory />} />
            <Route path="meetings"            element={<Meetings />} />
            <Route path="home"                element={<PersonaDashboard />} />
            <Route path="network"             element={<MyNetwork />} />
            <Route path="profile/:id"        element={<UserProfile />} />
            <Route path="organization"       element={<OrgAdmin />} />
            <Route path="sp/services"        element={<SPServices />} />
            <Route path="sp/clients"         element={<SPServices />} />
            <Route path="sp/reviews"         element={<SPServices />} />
            <Route path="mentor/sessions"    element={<MentorSessions />} />
            <Route path="mentor/availability" element={<MentorAvailability />} />
            <Route path="lab/equipment"      element={<LabEquipment />} />
            <Route path="lab/bookings"       element={<LabEquipment />} />
            <Route path="lab/announcements"  element={<LabAnnouncements />} />
            <Route path="lab/publications"   element={<LabPublications />} />
            <Route path="browse-facilities"     element={<BrowseLabFacilities />} />
            <Route path="browse-facilities/:id" element={<BrowseLabFacilities />} />  {/* Phase C — route-based detail */}
            <Route path="find-mentees"     element={<FindMentees />} />
            <Route path="find-mentees/:id" element={<FindMentees />} />  {/* Phase E — route-based detail */}
            <Route path="student/portfolio"      element={<StudentPortfolio />} />
            <Route path="student/certifications" element={<StudentPortfolio />} />
            <Route path="student/mentorships"    element={<StudentMentorships />} />
            {/* s32 P1.4 — Discovery surface consuming cluster-bridge endpoint */}
            <Route path="student/recommended-startups"  element={<StudentRecommendedStartups />} />
            <Route path="academia/research"      element={<AcademiaPortfolio />} />
            <Route path="academia/publications"  element={<AcademiaPortfolio />} />
            <Route path="academia/grants"        element={<AcademiaPortfolio />} />
            <Route path="academia/recommended-startups" element={<AcademiaRecommendedStartups />} />
            {/* s36 — Discovery surfaces for investor/incubator/accelerator */}
            <Route path="investor/recommended-startups"    element={<InvestorRecommendedStartups />} />
            <Route path="incubator/recommended-startups"   element={<IncubatorRecommendedStartups />} />
            <Route path="accelerator/recommended-startups" element={<AcceleratorRecommendedStartups />} />
            <Route path="onboarding"         element={<Onboarding />} />
            <Route path="whats-new"          element={<WhatsNew />} />
            {/* T32-99c: ChallengeInvites route */}
            <Route path="challenge-invites"  element={<ChallengeInvites />} />
            {/* Bug B fix: applicant-invite acceptance UI (investor/incubator/accelerator/lab) */}
            <Route path="application-invites" element={<ApplicationInvites />} />
            <Route path="challenges-to-review" element={<ChallengesToReview />} />
            <Route path="features"           element={<FeatureMap />} />
            <Route path="admin/analytics"    element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
            {/* Phase 102-3: AdminCosts route */}
            <Route path="admin/costs"        element={<AdminRoute><AdminCosts /></AdminRoute>} />
            {/* A: Admin Platform-Health route */}
            <Route path="admin/platform-health" element={<AdminRoute><AdminPlatformHealth /></AdminRoute>} />
            <Route path="admin/console"      element={<AdminRoute><AdminConsole /></AdminRoute>} />
            <Route path="admin/users"        element={<AdminRoute><AdminUsers /></AdminRoute>} />
            <Route path="admin/challenges"   element={<AdminRoute><AdminChallenges /></AdminRoute>} />
            <Route path="admin/startups"     element={<AdminRoute><AdminStartups /></AdminRoute>} />
            <Route path="admin/licenses"     element={<AdminRoute><AdminLicenses /></AdminRoute>} />
            <Route path="admin/claims"       element={<AdminRoute><AdminClaims /></AdminRoute>} />
            <Route path="admin/knowledge"    element={<AdminRoute><AdminKnowledge /></AdminRoute>} />
            <Route path="claims"              element={<MyClaims />} />
            <Route path="roles/add"           element={<AddRole />} />     {/* Phase 60.4b (s50) */}
            <Route path="clusters"            element={<Clusters />} />
            <Route path="clusters/:id"        element={<ClusterDetail />} />
            <Route path="settings"            element={<Settings />} />
          </Route>
        </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
