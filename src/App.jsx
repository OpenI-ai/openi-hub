import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AuthProvider } from './context/AuthContext';

// Pages — Auth
import Landing           from './pages/auth/Landing';
import Register          from './pages/auth/Register';

// Pages — Public
import PublicMarketplace from './pages/public/PublicMarketplace';
import PublicReports     from './pages/public/PublicReports';
import SharedChallenge   from './pages/public/SharedChallenge';
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
import IncubatorPrograms        from './pages/dashboard/IncubatorPrograms';
import IncubatorProgramDetail   from './pages/dashboard/IncubatorProgramDetail';
import IncubatorMentorPool      from './pages/dashboard/IncubatorMentorPool';
import AcceleratorBatches       from './pages/dashboard/AcceleratorBatches';
import AcceleratorBatchDetail   from './pages/dashboard/AcceleratorBatchDetail';
import AcceleratorPartners      from './pages/dashboard/AcceleratorPartners';
import ProgramServicePartners   from './pages/dashboard/ProgramServicePartners';
import StartupEvaluation from './pages/dashboard/StartupEvaluation';
import StartupDiscovery  from './pages/dashboard/StartupDiscovery';
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
import SMEManagement        from './pages/dashboard/SMEManagement';
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
import Onboarding           from './pages/dashboard/Onboarding';
import WhatsNew             from './pages/dashboard/WhatsNew';
import FeatureMap           from './pages/dashboard/FeatureMap';
import AdminAnalytics       from './pages/dashboard/AdminAnalytics';
import StudentPortfolio    from './pages/dashboard/StudentPortfolio';
import StudentMentorships  from './pages/dashboard/StudentMentorships';

// ── Guard: redirect to login if not authenticated ─────────────
function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/dashboard/login" replace />;
}

// ── Root route: show Landing for guests, Dashboard for logged-in users ────
function RootRoute() {
  const { user } = useAuth();
  return user ? <Navigate to="/dashboard" replace /> : <Landing />;
}

// ── App ───────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Root → Landing for guests, Dashboard for authenticated users */}
          <Route path="/" element={<RootRoute />} />

          {/* Public auth pages */}
          <Route path="/landing"         element={<Landing />} />
          <Route path="/register"        element={<Register />} />
          <Route path="/marketplace"       element={<PublicMarketplace />} />
          <Route path="/reports"            element={<PublicReports />} />
          <Route path="/challenges/share/:token" element={<SharedChallenge />} />
          <Route path="/search"                  element={<GlobalSearch />} />
          <Route path="/dashboard/login" element={<Login />} />

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
            <Route path="corporate/challenges" element={<CorporateChallenges />} />
            <Route path="corporate/collabs"  element={<CorporateCollaborations />} />
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
            <Route path="startup-profile"     element={<StartupProfile />} />
            <Route path="startup-profile/:id" element={<StartupProfile />} />
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
            <Route path="sme"                 element={<SMEManagement />} />
            <Route path="feedback"            element={<StartupFeedback />} />
            <Route path="govt-apis"           element={<GovtAPIIntegrations />} />
            <Route path="marketplace"         element={<Marketplace />} />
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
            <Route path="lab/publications"   element={<LabPublications />} />
            <Route path="student/portfolio"      element={<StudentPortfolio />} />
            <Route path="student/certifications" element={<StudentPortfolio />} />
            <Route path="student/mentorships"    element={<StudentMentorships />} />
            <Route path="onboarding"         element={<Onboarding />} />
            <Route path="whats-new"          element={<WhatsNew />} />
            <Route path="features"           element={<FeatureMap />} />
            <Route path="admin/analytics"    element={<AdminAnalytics />} />
            <Route path="settings"            element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
