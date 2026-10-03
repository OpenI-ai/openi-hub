import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { useAuth } from './context/AuthContext';
import useDocumentTitle from './hooks/useDocumentTitle';
import { trackPageView } from './utils/analytics';
import { AuthProvider } from './context/AuthContext';

// Pages — Auth
import Landing           from './pages/auth/Landing';
const Register          = lazy(() => import('./pages/auth/Register'));
const VerifyEmail       = lazy(() => import('./pages/auth/VerifyEmail'));
const ForgotPassword    = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword     = lazy(() => import('./pages/auth/ResetPassword'));
const Terms             = lazy(() => import('./pages/auth/Terms'));      // Phase 60.7 (s50)
const Privacy           = lazy(() => import('./pages/auth/Privacy'));    // Phase 60.7 (s50)

// Pages — Public
const PublicMarketplace = lazy(() => import('./pages/public/PublicMarketplace'));
const PublicReports     = lazy(() => import('./pages/public/PublicReports'));
const PublicFAQ         = lazy(() => import('./pages/public/PublicFAQ'));
const SharedChallenge   = lazy(() => import('./pages/public/SharedChallenge'));
const SharedWatchlist   = lazy(() => import('./pages/public/SharedWatchlist'));
const SharedStartupProfile = lazy(() => import('./pages/public/SharedStartupProfile'));  // Phase 110
const SharedStudentPortfolio = lazy(() => import('./pages/public/SharedStudentPortfolio'));  // 17 Jun 2026 — public student portfolio share
const SharedDeepTech = lazy(() => import('./pages/public/SharedDeepTech'));  // Phase 111 Ship 2a
const SharedEightVectorSelf = lazy(() => import('./pages/public/SharedEightVectorSelf'));  // Phase 111 Ship 2c
const SharedProgramEval = lazy(() => import('./pages/public/SharedProgramEval'));  // Phase 111 Ship 2d
const SharedDealRequest = lazy(() => import('./pages/public/SharedDealRequest'));  // Phase 131 — blank-page fix
const GlobalSearch      = lazy(() => import('./pages/public/GlobalSearch'));

// Pages — Dashboard
const Login             = lazy(() => import('./pages/dashboard/Login'));
const DashboardLayout   = lazy(() => import('./pages/dashboard/DashboardLayout'));
const DashboardHome     = lazy(() => import('./pages/dashboard/DashboardHome'));
const MyProfile         = lazy(() => import('./pages/dashboard/MyProfile'));
const CorporateDashboard       = lazy(() => import('./pages/dashboard/CorporateDashboard'));
const CorporateStartupSearch   = lazy(() => import('./pages/dashboard/CorporateStartupSearch'));
const CorporateChallenges      = lazy(() => import('./pages/dashboard/CorporateChallenges'));
const CorporateCollaborations  = lazy(() => import('./pages/dashboard/CorporateCollaborations'));
const InvestorDeals            = lazy(() => import('./pages/dashboard/InvestorDeals'));
const InvestorPortfolio        = lazy(() => import('./pages/dashboard/InvestorPortfolio'));
const InvestorDealRequests     = lazy(() => import('./pages/dashboard/InvestorDealRequests'));
const IncubatorPrograms        = lazy(() => import('./pages/dashboard/IncubatorPrograms'));
const IncubatorProgramDetail   = lazy(() => import('./pages/dashboard/IncubatorProgramDetail'));
const IncubatorMentorPool      = lazy(() => import('./pages/dashboard/IncubatorMentorPool'));
const AcceleratorBatches       = lazy(() => import('./pages/dashboard/AcceleratorBatches'));
const AcceleratorBatchDetail   = lazy(() => import('./pages/dashboard/AcceleratorBatchDetail'));
const AcceleratorPartners      = lazy(() => import('./pages/dashboard/AcceleratorPartners'));
const ProgramServicePartners   = lazy(() => import('./pages/dashboard/ProgramServicePartners'));
const StartupEvaluation = lazy(() => import('./pages/dashboard/StartupEvaluation'));
const StartupDiscovery  = lazy(() => import('./pages/dashboard/StartupDiscovery'));
const StudentDiscovery  = lazy(() => import('./pages/dashboard/StudentDiscovery'));
const AcademiaDiscovery = lazy(() => import('./pages/dashboard/AcademiaDiscovery'));
const StartupProfile    = lazy(() => import('./pages/dashboard/StartupProfile'));
const RegisterStartup   = lazy(() => import('./pages/dashboard/RegisterStartup'));
const Evaluations       = lazy(() => import('./pages/dashboard/Evaluations'));
const Cohorts           = lazy(() => import('./pages/dashboard/Cohorts'));
const Mentors           = lazy(() => import('./pages/dashboard/Mentors'));
const IPRDatabase       = lazy(() => import('./pages/dashboard/IPRDatabase'));
const Infrastructure    = lazy(() => import('./pages/dashboard/Infrastructure'));
const Knowledge         = lazy(() => import('./pages/dashboard/Knowledge'));
const StartupCrawling   = lazy(() => import('./pages/dashboard/StartupCrawling'));
const ProjectManagement = lazy(() => import('./pages/dashboard/ProjectManagement'));
const Messaging         = lazy(() => import('./pages/dashboard/Messaging'));
const StartupPipeline   = lazy(() => import('./pages/dashboard/StartupPipeline'));
const DocumentRepository   = lazy(() => import('./pages/dashboard/DocumentRepository'));
const StartupWatchlist     = lazy(() => import('./pages/dashboard/StartupWatchlist'));
const DeepTechQualification = lazy(() => import('./pages/dashboard/DeepTechQualification'));
const EventsRepository     = lazy(() => import('./pages/dashboard/EventsRepository'));
const CorporateRecommendedStartups = lazy(() => import('./pages/dashboard/CorporateRecommendedStartups'));
const InnovationBrief = lazy(() => import('./pages/dashboard/InnovationBrief'));  // s121e
const AdminBriefPreview = lazy(() => import('./pages/dashboard/AdminBriefPreview'));  // s121g
const AdminAgentRuns = lazy(() => import('./pages/dashboard/AdminAgentRuns'));  // s122
const AdminSectorRecheck = lazy(() => import('./pages/dashboard/AdminSectorRecheck'));  // s124
const StartupFeedback      = lazy(() => import('./pages/dashboard/StartupFeedback'));
const GovtAPIIntegrations  = lazy(() => import('./pages/dashboard/GovtAPIIntegrations'));
const GrantsDisburse       = lazy(() => import('./pages/dashboard/government/GrantsDisburse'));  // s127
const MyGrants             = lazy(() => import('./pages/dashboard/MyGrants'));  // s127
const Marketplace          = lazy(() => import('./pages/dashboard/Marketplace'));
const Directory            = lazy(() => import('./pages/dashboard/Directory'));
const Meetings             = lazy(() => import('./pages/dashboard/Meetings'));
const PersonaDashboard     = lazy(() => import('./pages/dashboard/PersonaDashboard'));
const Settings             = lazy(() => import('./pages/dashboard/Settings'));
const MyNetwork            = lazy(() => import('./pages/dashboard/MyNetwork'));
const UserProfile          = lazy(() => import('./pages/dashboard/UserProfile'));
const OrgAdmin             = lazy(() => import('./pages/dashboard/OrgAdmin'));
const SPServices           = lazy(() => import('./pages/dashboard/SPServices'));
const MentorSessions       = lazy(() => import('./pages/dashboard/MentorSessions'));
const MentorAvailability   = lazy(() => import('./pages/dashboard/MentorAvailability'));
const LabEquipment         = lazy(() => import('./pages/dashboard/LabEquipment'));
const LabPublications      = lazy(() => import('./pages/dashboard/LabPublications'));
const LabAnnouncements     = lazy(() => import('./pages/dashboard/LabAnnouncements'));
const BrowseLabFacilities  = lazy(() => import('./pages/dashboard/BrowseLabFacilities'));
const FindMentees          = lazy(() => import('./pages/dashboard/FindMentees'));
const Onboarding           = lazy(() => import('./pages/dashboard/Onboarding'));
const WhatsNew             = lazy(() => import('./pages/dashboard/WhatsNew'));
// T32-99c: ChallengeInvites import
const ChallengeInvites     = lazy(() => import('./pages/dashboard/ChallengeInvites'));
const ApplicationInvites   = lazy(() => import('./pages/dashboard/ApplicationInvites'));
const FeatureMap           = lazy(() => import('./pages/dashboard/FeatureMap'));
// s48 — lazy-loaded so recharts (~121 KB gz) is only fetched
// when user navigates to one of these admin/portfolio surfaces.
const AdminAnalytics       = lazy(() => import('./pages/dashboard/AdminAnalytics'));
// Phase 102-3: AdminCosts (lazy — uses recharts)
const AdminCosts           = lazy(() => import('./pages/dashboard/AdminCosts'));
// A: Admin Platform-Health dashboard (lazy - uses recharts)
const AdminPlatformHealth = lazy(() => import('./pages/dashboard/AdminPlatformHealth'));
const ChallengesToReview   = lazy(() => import('./pages/dashboard/ChallengesToReview'));
const AdminConsole         = lazy(() => import('./pages/dashboard/AdminConsole'));
const AdminUsers           = lazy(() => import('./pages/dashboard/AdminUsers'));
const AdminChallenges      = lazy(() => import('./pages/dashboard/AdminChallenges'));
const AdminStartups        = lazy(() => import('./pages/dashboard/AdminStartups'));
const AdminLicenses        = lazy(() => import('./pages/dashboard/AdminLicenses'));
const AdminClaims          = lazy(() => import('./pages/dashboard/AdminClaims'));
const AdminKnowledge       = lazy(() => import('./pages/dashboard/AdminKnowledge'));
const MyClaims             = lazy(() => import('./pages/dashboard/MyClaims'));
const ClaimVerify          = lazy(() => import('./pages/auth/ClaimVerify'));
const AcceptInvite        = lazy(() => import('./pages/auth/AcceptInvite'));   // Phase 108
const SSOCallback         = lazy(() => import('./pages/auth/SSOCallback'));    // Phase 127
const AddRole              = lazy(() => import('./pages/dashboard/AddRole'));     // Phase 60.4b (s50)
const StudentPortfolio    = lazy(() => import('./pages/dashboard/StudentPortfolio'));
const StudentMentorships  = lazy(() => import('./pages/dashboard/StudentMentorships'));
const AcademiaPortfolio   = lazy(() => import('./pages/dashboard/AcademiaPortfolio'));
const Clusters            = lazy(() => import('./pages/dashboard/Clusters'));
const ClusterDetail       = lazy(() => import('./pages/dashboard/ClusterDetail'));
// s106 — standalone Innovation Maps (one micro-focused map per curated term)
const InnovationMaps      = lazy(() => import('./pages/dashboard/InnovationMaps'));
// s108b — Art of Possible umbrella: Recommended-for-You + Innovation Maps as tabs
const ArtOfPossible       = lazy(() => import('./pages/dashboard/ArtOfPossible'));
const MapDetail           = lazy(() => import('./pages/dashboard/MapDetail'));
// s32 P1.4 — Discovery surfaces consuming cluster-bridge endpoints
const StudentRecommendedStartups    = lazy(() => import('./pages/dashboard/StudentRecommendedStartups'));
const AcademiaRecommendedStartups   = lazy(() => import('./pages/dashboard/AcademiaRecommendedStartups'));
// s36 — Discovery surfaces for investor/incubator/accelerator
const InvestorRecommendedStartups    = lazy(() => import('./pages/dashboard/InvestorRecommendedStartups'));
const IncubatorRecommendedStartups   = lazy(() => import('./pages/dashboard/IncubatorRecommendedStartups'));
const AcceleratorRecommendedStartups = lazy(() => import('./pages/dashboard/AcceleratorRecommendedStartups'));

// s38's ComingSoonPlaceholder was removed in s127 when its last user (Disburse Grants) was wired up.

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

// Sets <title> on every location change. Rendered inside BrowserRouter (the
// hook calls useLocation) and returns null — it is behaviour, not UI. Mounting
// it once here beats calling a hook in 124 page components: a route added later
// gets a sensible title automatically instead of silently inheriting the
// marketing one. See src/hooks/useDocumentTitle.js for why this is needed at
// all and why three of its strings must stay identical to prerender.js.
function DocumentTitle() {
  useDocumentTitle();
  return null;
}

// Analytics (7 Sep 2026) — one GA4 page_view per location change. Mounted
// AFTER <DocumentTitle /> so its effect runs after the title is updated and
// the page_view carries the right page_title. Vercel Web Analytics does its
// own page views via <Analytics /> below. See src/utils/analytics.js.
function PageViewTracker() {
  const location = useLocation();
  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location.pathname, location.search]);
  return null;
}

// ── App ───────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <EmailVerifyBridge />
        <DocumentTitle />
        <PageViewTracker />
        {/* Vercel Web Analytics — inert until enabled on the Vercel project
            (openi-hub → Analytics → Enable). Same-origin script, no CSP change. */}
        <Analytics mode={import.meta.env.PROD ? 'production' : 'development'} />
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
          <Route path="/public/deal-requests/share/:token" element={<SharedDealRequest />} />  {/* Phase 131 — blank-page fix */}
          <Route path="/claims/verify/:token"    element={<ClaimVerify />} />
          <Route path="/search"                  element={<GlobalSearch />} />
          <Route path="/dashboard/login" element={<LoginRoute />} />
          {/* s87 — /login is the most guessable URL on the site and it rendered
              a BLANK PAGE: the only login route is /dashboard/login and there
              was no catch-all, so React Router matched nothing and painted
              nothing. This is what the 22 Aug "blank slide 01 capture" and the
              24 Aug guard refusal were photographing — not a headless-rendering
              bug, a URL that never existed. Alias it. */}
          <Route path="/login" element={<Navigate to="/dashboard/login" replace />} />

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
            {/* s127 — Disburse Grants (record-only: the body's treasury pays, OpenI records); the startup's side is my-grants */}
            <Route path="government/grants"   element={<GrantsDisburse />} />
            <Route path="my-grants"           element={<MyGrants />} />
            <Route path="marketplace"         element={<Marketplace />} />
            <Route path="search"              element={<GlobalSearch inDashboard />} />  {/* s125 — logged-in search stays in the dashboard */}
            <Route path="marketplace/:id"     element={<Marketplace />} />  {/* Phase 120 — route-based detail */}
            <Route path="directory"           element={<Directory />} />
            <Route path="meetings"            element={<Meetings />} />
            <Route path="meetings/:id"        element={<Meetings />} />  {/* s124 — notification links open the meeting */}
            <Route path="home"                element={<PersonaDashboard />} />
            <Route path="brief"               element={<InnovationBrief />} />  {/* s121e — every persona */}
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
            <Route path="admin/brief-preview" element={<AdminRoute><AdminBriefPreview /></AdminRoute>} />  {/* s121g */}
            <Route path="admin/agent-runs" element={<AdminRoute><AdminAgentRuns /></AdminRoute>} />  {/* s122 */}
            <Route path="admin/sector-recheck" element={<AdminRoute><AdminSectorRecheck /></AdminRoute>} />  {/* s124 */}
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
            <Route path="art-of-possible"     element={<ArtOfPossible />} />    {/* s108b */}
            <Route path="maps"                element={<InnovationMaps />} />   {/* s106 */}
            <Route path="maps/:dimension/:slug" element={<MapDetail />} />      {/* s106 */}
            <Route path="settings"            element={<Settings />} />
          </Route>

          {/* s87 — catch-all: an unmatched URL used to render literally
              nothing (blank white page, no error, no redirect) because
              <Routes> with no match paints no element. Send strays to the
              homepage rather than a void. */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
