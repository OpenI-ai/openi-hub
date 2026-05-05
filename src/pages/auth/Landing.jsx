import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, Shield, Users, Briefcase, Target, Network, Sparkles,
  Search, Calendar, MessageSquare, FileText, Award, Database,
  Zap, TrendingUp, CheckCircle2, Rocket, Building2, Landmark,
  GraduationCap, FlaskConical, Home, BookOpen, ChevronDown, ChevronUp,
  BarChart3, Globe, Star, UserPlus, Menu, X, Layers,
} from 'lucide-react';
import { publicAPI } from '../../services/api';
import SearchBar from '../../components/SearchBar';
import PlatformSlideshow from '../../components/PlatformSlideshow';

// Icon map for CMS-provided icon names (string → component)
const ICON_MAP = {
  Briefcase, Search, Award, Calendar, MessageSquare, Zap, BarChart3, Globe,
  Shield, Users, Target, Network, Sparkles, FileText, Database, Rocket,
  TrendingUp, Star, UserPlus, Building2, Landmark, GraduationCap, FlaskConical,
  Home, BookOpen, ArrowRight, CheckCircle2,
};

// Brand colors
const GOLD = '#D5AA5B';
const GOLD_DARK = '#C9983F';
const GOLD_LIGHT = 'rgba(213, 170, 91, 0.1)';
const BLUE = '#3b82f6';
const DARK = '#1a1a1a';
const GRAY = '#6b7280';
const LIGHT_GRAY = '#f5f5f5';
const BORDER = '#e5e7eb';

// ── Social SVG icons (lucide-react v0.294 doesn't have these) ──
function LinkedInIcon({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

function XIcon({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

// ── Default content (shown only if /api/public/landing-content fails) ─────────
// Backend normally returns live DB-counted stats which override these defaults.
// Match backend labels so visual layout doesn't shift on hydration.
const DEFAULT_STATS = [
  { value: '\u2014', label: 'Global Startups' },
  { value: '\u2014', label: 'Registered Users' },
  { value: '\u2014', label: 'Challenges Posted' },
  { value: '\u2014', label: 'Applications Submitted' },
];

const DEFAULT_PARTNERS = ['DRDO', 'DPIIT', 'iDEX', 'NASSCOM', 'Startup India', 'AIM'];

const DEFAULT_TESTIMONIALS = [
  { quote: 'The AI Ask search cut our startup discovery time by 80%. We just type what we need in plain English and get ranked matches across sector, stage, and deep-tech fit instantly.', name: 'Priya Sharma', role: 'VP Innovation', org: 'Tata Advanced Systems' },
  { quote: 'The 8-vector evaluation framework and deal pipeline transformed how we assess investment opportunities. Data-driven decisions at scale, with full audit trails.', name: 'Rahul Mehta', role: 'Partner', org: 'Kalaari Capital' },
  { quote: 'Portfolio Health tracking changed our incubator\u2019s entire review cadence. We can spot at-risk startups 6 weeks before we used to, and our graduation rates jumped 30%.', name: 'Dr. Anand Kumar', role: 'Program Director', org: 'T-Hub Hyderabad' },
];

const DEFAULT_FAQS = [
  { q: 'Who can join OpenI?', a: 'Anyone in the innovation ecosystem \u2014 startups, corporates, investors, government bodies, mentors, labs, incubators, accelerators, service providers, students, and academia. All 11 persona types get a tailored dashboard, directory listing, and workflow tools.' },
  { q: 'Is OpenI free to use?', a: 'Yes! The Free tier gives you access to the core platform including keyword search, directory, meetings, messaging, and up to 1 challenge per month. Upgrade to Pro (INR 999/mo) for AI Semantic Search, richer limits, and advanced workflows. Enterprise (INR 4,999/mo) unlocks unlimited everything plus dedicated support.' },
  { q: 'What is AI Ask \u2014 and how is it different from keyword search?', a: 'AI Ask lets you type natural-language queries like \u201cearly-stage deeptech healthcare startups in Bangalore that raised Seed\u201d and our query-parser model translates that into structured filters (sector + stage + city + deeptech flag) then runs it against our FTS + vector search stack. Results come back ranked, with the AI\u2019s interpretation shown above the list so you can verify what it understood. Pro tier and above.' },
  { q: 'What is the 8-Vector Evaluation Framework?', a: 'A proprietary scoring system that evaluates startups across 8 dimensions: Market, Team, Tech, Traction, Financials, IP, Scalability, and Strategic Fit. Investors use it in their deal pipeline; incubators and accelerators run it as time-series checkpoints (Entry \u2192 Mid-program \u2192 Demo Day \u2192 Graduation) to track portfolio progress on a radar chart.' },
  { q: 'Can incubators and accelerators track their portfolio health?', a: 'Yes. The Portfolio Health tab inside each Program or Batch shows an 8-vector radar of your portfolio average, flags at-risk startups (overall score < 3 or red flags set), and tracks each startup\u2019s progression across multiple checkpoints \u2014 so you can intervene early and measure the impact of your mentorship.' },
  { q: 'How does the Challenge Marketplace work?', a: 'Corporates, investors, and government bodies post open innovation challenges with sector tags, budget ranges, data rooms, and FAQs. Startups apply with structured proposals; seekers evaluate, rate (1-5 stars), and move applicants through a drag-and-drop pipeline into active collaborations with milestones, tasks, and budget tracking.' },
  { q: 'Does OpenI support multi-currency for global programs?', a: 'Yes. All monetary fields (funding, investment, ticket sizes, perks, etc.) support both INR and USD natively, with compact locale-appropriate display (\u20B95L, \u20B92Cr, $60K, $1.5M). Users can set their preferred currency in Settings \u2192 Profile. No FX conversion \u2014 each amount keeps its entered currency for honest reporting.' },
  { q: 'I am an investor AND a mentor — do I need two accounts?', a: 'No. One account holds multiple roles. Sign up with your primary role, then add as many additional roles as you need from your dashboard. Each role gets its own dashboard, sidebar, and workflows; switch between them with one click using the role tabs at the top of any dashboard page. One inbox, one watchlist, separate per-role billing if you upgrade to Pro on a specific role.' },
];

// ── Reusable section wrapper ───────────────────────────────
function Section({ children, bg = '#fff', className = '', id = '' }) {
  return (
    <section id={id} className={`py-20 px-6 ${className}`} style={{ background: bg }}>
      <div className="max-w-6xl mx-auto">{children}</div>
    </section>
  );
}

// ── Feature card ───────────────────────────────────────────
function FeatureCard({ icon: Icon, title, description }) {
  return (
    <div
      className="p-6 rounded-xl transition-all"
      style={{ background: '#fff', border: `1px solid ${BORDER}` }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = GOLD;
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(213,170,91,0.12)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = BORDER;
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div
        className="w-11 h-11 rounded-lg flex items-center justify-center mb-4"
        style={{ background: GOLD_LIGHT }}
      >
        <Icon size={22} style={{ color: GOLD }} />
      </div>
      <h3 className="text-base font-bold mb-2" style={{ color: DARK }}>{title}</h3>
      <p className="text-sm leading-relaxed" style={{ color: GRAY }}>{description}</p>
    </div>
  );
}

// ── Pricing card ───────────────────────────────────────────
function PricingCard({ name, price, priceNote, features, cta, ctaLink, featured = false }) {
  return (
    <div
      className="rounded-2xl p-8 relative transition-all"
      style={{
        background: '#fff',
        border: featured ? `2px solid ${GOLD}` : `1px solid ${BORDER}`,
        boxShadow: featured ? '0 12px 32px rgba(213,170,91,0.15)' : '0 2px 8px rgba(0,0,0,0.04)',
        transform: featured ? 'scale(1.02)' : 'scale(1)',
      }}
    >
      {featured && (
        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold"
          style={{ background: GOLD, color: '#fff' }}
        >
          MOST POPULAR
        </div>
      )}
      <div className="mb-6">
        <h3 className="text-lg font-bold mb-1" style={{ color: DARK }}>{name}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold" style={{ color: DARK }}>{price}</span>
          {priceNote && <span className="text-sm" style={{ color: GRAY }}>{priceNote}</span>}
        </div>
      </div>
      <ul className="space-y-3 mb-8">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-sm" style={{ color: GRAY }}>
            <CheckCircle2 size={16} style={{ color: GOLD, marginTop: 2, flexShrink: 0 }} />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Link
        to={ctaLink}
        className="block text-center py-3 rounded-lg text-sm font-bold transition-all"
        style={{
          background: featured ? GOLD : '#fff',
          color: featured ? '#fff' : GOLD,
          border: featured ? 'none' : `1.5px solid ${GOLD}`,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = featured ? GOLD_DARK : GOLD_LIGHT;
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = featured ? GOLD : '#fff';
        }}
      >
        {cta}
      </Link>
    </div>
  );
}

// ── How It Works step ──────────────────────────────────────
function Step({ number, title, description }) {
  return (
    <div className="text-center">
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold"
        style={{ background: GOLD_LIGHT, color: GOLD }}
      >
        {number}
      </div>
      <h3 className="text-base font-bold mb-2" style={{ color: DARK }}>{title}</h3>
      <p className="text-sm leading-relaxed max-w-xs mx-auto" style={{ color: GRAY }}>{description}</p>
    </div>
  );
}

// ── Persona list item ───────────────────────────────────────
function PersonaListItem({ icon: Icon, label, color }) {
  return (
    <li className="flex items-center gap-2 text-sm" style={{ color: DARK }}>
      <Icon size={14} style={{ color }} />
      <span>{label}</span>
    </li>
  );
}

// ── Testimonial card ────────────────────────────────────────
function TestimonialCard({ quote, name, role, org }) {
  return (
    <div
      className="p-6 rounded-xl transition-all"
      style={{ background: '#fff', border: `1px solid ${BORDER}` }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = GOLD;
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(213,170,91,0.08)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = BORDER;
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div className="flex gap-1 mb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={14} fill={GOLD} style={{ color: GOLD }} />
        ))}
      </div>
      <p className="text-sm leading-relaxed mb-4" style={{ color: GRAY, fontStyle: 'italic' }}>
        &ldquo;{quote}&rdquo;
      </p>
      <div>
        <div className="text-sm font-bold" style={{ color: DARK }}>{name}</div>
        <div className="text-xs" style={{ color: GRAY }}>{role}, {org}</div>
      </div>
    </div>
  );
}

// ── FAQ item ────────────────────────────────────────────────
function FAQItem({ question, answer, isOpen, onToggle }) {
  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden' }}>
      <button onClick={onToggle} className="w-full flex justify-between items-center p-5 text-left"
        style={{ background: isOpen ? GOLD_LIGHT : '#fff', border: 'none', cursor: 'pointer' }}>
        <span className="text-sm font-semibold pr-4" style={{ color: DARK }}>{question}</span>
        {isOpen ? <ChevronUp size={18} style={{ color: GOLD, flexShrink: 0 }} /> : <ChevronDown size={18} style={{ color: GRAY, flexShrink: 0 }} />}
      </button>
      {isOpen && (
        <div className="px-5 pb-5 text-sm leading-relaxed" style={{ color: GRAY }}>{answer}</div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// LANDING PAGE
// ═══════════════════════════════════════════════════════════════
// Look up a live stat value by label substring from cms.stats array.
// cms.stats is shaped: [{value: '583K+', label: 'Global Startups'}, ...]
function statValue(cmsStats, labelSubstr, fallback = '') {
  if (!Array.isArray(cmsStats)) return fallback;
  const hit = cmsStats.find(s => s.label?.toLowerCase().includes(labelSubstr.toLowerCase()));
  return hit?.value || fallback;
}

export default function Landing() {
  const [openFaq, setOpenFaq] = useState(null);
  const [cms, setCms] = useState(null);
  const [pricingTab, setPricingTab] = useState('seeker');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    publicAPI.getLandingContent()
      .then(data => setCms(data))
      .catch(() => {}); // silently use defaults
  }, []);

  // Header search navigates to /search with AI mode support
  const handleHeaderSearch = (term, mode) => {
    const modeParam = mode && mode !== 'keyword' ? `&mode=${mode}` : '';
    navigate(`/search?q=${encodeURIComponent(term)}${modeParam}`);
  };

  // Phase 17c: CMS re-seeded with Phase 10-21 content. CMS is now canonical source.
  // Backend /landing-content already injects live DB counts into cms.stats[].
  const stats = cms?.stats || DEFAULT_STATS;
  // s47: Hero subtitle pulls the live "Global Startups" count from cms.stats by label match.
  // Fallback string used until cms loads (avoids hardcoding stale numbers in the bundle).
  const liveStartupsValue = statValue(cms?.stats, 'Global Startups', '');
  const liveSectorsText = liveStartupsValue
    ? `AI-Powered \u00b7 ${liveStartupsValue} Startups \u00b7 11 Personas \u00b7 200 AI Clusters \u00b7 Deep-Tech`
    : 'AI-Powered \u00b7 11 Personas \u00b7 200 AI Clusters \u00b7 Deep-Tech \u00b7 Real-Time Search';
  const testimonials = cms?.testimonials || DEFAULT_TESTIMONIALS;
  const faqs = cms?.faqs || DEFAULT_FAQS;
  const features = null;                     // Inline 12-card grid (not CMS-managed)
  const pricing = cms?.pricing || null;      // CMS pricing or inline fallback
  const hero = null;                         // Inline hero (not CMS-managed)
  const partners = cms?.partners || DEFAULT_PARTNERS;
  const howItWorks = cms?.howItWorks || null;
  const ctaContent = cms?.cta || null;
  const footerTagline = cms?.footer_tagline || null;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#fff' }}>
      {/* ═══════════════════════════════════════════════════════════
          HEADER (sticky)
          ═══════════════════════════════════════════════════════════ */}
      <header
        className="sticky top-0 z-50 px-6 py-4 border-b backdrop-blur"
        style={{ background: 'rgba(255,255,255,0.92)', borderColor: BORDER }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/openi-logo.png"
              alt="OpenI"
              style={{ height: 38, width: 'auto', maxWidth: 140, objectFit: 'contain' }}
              onError={e => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div
              className="w-10 h-10 rounded-xl items-center justify-center"
              style={{ background: GOLD, display: 'none' }}
            >
              <Shield size={20} color="#fff" />
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium" style={{ color: GRAY }}>
            <Link to="/marketplace" className="hover:text-gray-900 transition-colors">Marketplace</Link>
            <Link to="/reports" className="hover:text-gray-900 transition-colors">Reports</Link>
            <a href="#how-it-works" className="hover:text-gray-900 transition-colors">How It Works</a>
            <a href="#pricing" className="hover:text-gray-900 transition-colors">Pricing</a>
          </nav>

          {/* Global header search — AI Ask enabled */}
          <div className="hidden lg:block flex-1 max-w-md">
            <SearchBar
              onSearch={handleHeaderSearch}
              showAiToggle
              placeholder="Ask or search..."
            />
          </div>

          <div className="flex items-center gap-3">
            <a href="https://www.linkedin.com/company/openi-partners/" target="_blank" rel="noopener noreferrer"
               className="hidden sm:inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all"
               style={{ color: GRAY }}
               onMouseEnter={e => e.currentTarget.style.color = GOLD}
               onMouseLeave={e => e.currentTarget.style.color = GRAY}>
              <LinkedInIcon size={18} />
            </a>
            <a href="https://x.com/OpenIPartners" target="_blank" rel="noopener noreferrer"
               className="hidden sm:inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all"
               style={{ color: GRAY }}
               onMouseEnter={e => e.currentTarget.style.color = GOLD}
               onMouseLeave={e => e.currentTarget.style.color = GRAY}>
              <XIcon size={18} />
            </a>
            <Link
              to="/dashboard/login"
              className="hidden sm:inline text-sm font-semibold px-4 py-2 transition-colors"
              style={{ color: DARK }}
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-5 py-2 rounded-lg text-sm font-bold transition-all"
              style={{ background: GOLD, color: '#fff' }}
              onMouseEnter={e => e.currentTarget.style.background = GOLD_DARK}
              onMouseLeave={e => e.currentTarget.style.background = GOLD}
            >
              Get Started
            </Link>
            {/* Mobile hamburger — only visible below md breakpoint */}
            <button
              type="button"
              aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen(o => !o)}
              className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg transition-colors"
              style={{ color: DARK }}
            >
              {mobileNavOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile nav drawer — visible only below md breakpoint when open */}
        {mobileNavOpen && (
          <div
            className="md:hidden border-t"
            style={{ background: '#fff', borderColor: BORDER }}
          >
            <nav className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-1 text-sm font-medium">
              <Link
                to="/marketplace"
                onClick={() => setMobileNavOpen(false)}
                className="py-2.5 rounded-md transition-colors"
                style={{ color: DARK }}
              >
                Marketplace
              </Link>
              <Link
                to="/reports"
                onClick={() => setMobileNavOpen(false)}
                className="py-2.5 rounded-md transition-colors"
                style={{ color: DARK }}
              >
                Reports
              </Link>
              <a
                href="#how-it-works"
                onClick={() => setMobileNavOpen(false)}
                className="py-2.5 rounded-md transition-colors"
                style={{ color: DARK }}
              >
                How It Works
              </a>
              <a
                href="#pricing"
                onClick={() => setMobileNavOpen(false)}
                className="py-2.5 rounded-md transition-colors"
                style={{ color: DARK }}
              >
                Pricing
              </a>
              <Link
                to="/dashboard/login"
                onClick={() => setMobileNavOpen(false)}
                className="py-2.5 rounded-md transition-colors font-semibold"
                style={{ color: DARK }}
              >
                Sign In
              </Link>
              <div className="flex items-center gap-3 pt-3 mt-2 border-t" style={{ borderColor: BORDER }}>
                <a
                  href="https://www.linkedin.com/company/openi-partners/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="inline-flex items-center justify-center w-9 h-9 rounded-lg"
                  style={{ color: GRAY }}
                >
                  <LinkedInIcon size={18} />
                </a>
                <a
                  href="https://x.com/OpenIPartners"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="X"
                  className="inline-flex items-center justify-center w-9 h-9 rounded-lg"
                  style={{ color: GRAY }}
                >
                  <XIcon size={18} />
                </a>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* ═══════════════════════════════════════════════════════════
          HERO
          ═══════════════════════════════════════════════════════════ */}
      <section
        className="relative px-6 pt-20 pb-24 overflow-hidden"
        style={{
          background: `linear-gradient(180deg, ${LIGHT_GRAY} 0%, #fff 100%)`,
        }}
      >
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-20 pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${GOLD} 0%, transparent 70%)`,
            filter: 'blur(80px)',
          }}
        />

        <div className="relative max-w-5xl mx-auto text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-xs font-bold tracking-wide"
            style={{ background: GOLD_LIGHT, color: GOLD_DARK }}
          >
            <Sparkles size={14} />
            {hero?.badge_text || 'AI-NATIVE INNOVATION PLATFORM'}
          </div>

          <h1
            className="font-bold tracking-tight mb-6"
            style={{
              color: DARK,
              fontSize: 'clamp(2.5rem, 6vw, 5rem)',
              lineHeight: 1.05,
              fontFamily: 'Plus Jakarta Sans, Inter, sans-serif',
            }}
          >
            Partner. Source. <span style={{ color: GOLD }}>Invest.</span>
          </h1>

          <p
            className="max-w-3xl mx-auto mb-10 text-lg leading-relaxed"
            style={{ color: GRAY }}
          >
            The AI-native open innovation platform connecting <strong style={{ color: DARK }}>11 ecosystem personas</strong> —
            startups, corporates, investors, incubators, accelerators, students, academia, and more.
            <br/>
            <strong style={{ color: DARK }}>Investor and mentor? Corporate and incubator?</strong> Hold multiple roles on a single account
            and switch between them in one click. AI evaluates startups, narrates recommendations, and advises on challenges with one click.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg text-base font-bold transition-all shadow-lg"
              style={{ background: GOLD, color: '#fff', boxShadow: '0 8px 24px rgba(213,170,91,0.3)' }}
              onMouseEnter={e => {
                e.currentTarget.style.background = GOLD_DARK;
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = GOLD;
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Get Started — It&apos;s Free
              <ArrowRight size={18} />
            </Link>
            <Link
              to="/marketplace"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg text-base font-bold transition-all"
              style={{ background: '#fff', color: DARK, border: `1.5px solid ${BORDER}` }}
              onMouseEnter={e => e.currentTarget.style.borderColor = GOLD}
              onMouseLeave={e => e.currentTarget.style.borderColor = BORDER}
            >
              Browse Challenges
            </Link>
          </div>

          <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: GRAY }}>
            {hero?.sectors_text || liveSectorsText}
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          STATS / SOCIAL PROOF
          ═══════════════════════════════════════════════════════════ */}
      <Section bg="#fff">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: DARK }}>
            Trusted by the Global Innovation Ecosystem
          </h2>
          <p className="text-base max-w-xl mx-auto" style={{ color: GRAY }}>
            A growing network of startups, corporates, and institutions building the global Innovation ecosystem together.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((stat, i) => (
            <div key={i} className="p-6 rounded-xl" style={{ background: LIGHT_GRAY }}>
              <div className="text-3xl md:text-4xl font-bold mb-1" style={{ color: GOLD }}>{stat.value}</div>
              <div className="text-sm font-medium" style={{ color: GRAY }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════════
          PARTNER / TRUST LOGOS
          ═══════════════════════════════════════════════════════════ */}
      <section className="py-10 px-6" style={{ background: LIGHT_GRAY }}>
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-xs uppercase tracking-wider font-semibold mb-6" style={{ color: GRAY }}>
            Ecosystem Partners &amp; Supporters
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {partners.map((name, i) => (
              <span key={i} className="text-base md:text-lg font-bold tracking-wide" style={{ color: '#bbb' }}>{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          HOW IT WORKS
          ═══════════════════════════════════════════════════════════ */}
      <Section bg="#fff" id="how-it-works">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: DARK }}>
            How OpenI Works
          </h2>
          <p className="text-base max-w-xl mx-auto" style={{ color: GRAY }}>
            Three simple steps to join the open innovation ecosystem.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {(howItWorks || [
            { number: '1', title: 'Register Your Persona', description: 'Pick from 11 persona types — startup, corporate, investor, government, mentor, lab, and more. Each persona has a tailored profile and dashboard.' },
            { number: '2', title: 'Discover & Connect', description: 'Browse the directory, explore challenges, and use the 8-vector evaluation framework to find the right partners, investments, or innovations.' },
            { number: '3', title: 'Collaborate & Grow', description: 'Schedule meetings, submit proposals, track projects, and manage the full innovation lifecycle from first contact to successful pilot.' },
          ]).map((step, i) => (
            <Step key={i} number={step.number || String(i + 1)} title={step.title} description={step.description} />
          ))}
        </div>

        {/* Platform Slideshow */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold mb-2" style={{ color: DARK }}>See It In Action</h3>
          <p className="text-sm mb-8" style={{ color: GRAY }}>Explore the platform across different persona dashboards</p>
          <PlatformSlideshow />
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════════
          FOR PROVIDERS / FOR SEEKERS
          ═══════════════════════════════════════════════════════════ */}
      <Section bg={LIGHT_GRAY}>
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: DARK }}>
            Built for Every Stakeholder
          </h2>
          <p className="text-base max-w-xl mx-auto" style={{ color: GRAY }}>
            Whether you have innovation to offer or innovation to find, OpenI connects you to the right people.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Innovation Providers */}
          <div
            className="rounded-2xl p-8 transition-all"
            style={{ background: '#fff', border: `1px solid ${BORDER}` }}
            onMouseEnter={e => e.currentTarget.style.borderColor = GOLD}
            onMouseLeave={e => e.currentTarget.style.borderColor = BORDER}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: GOLD_LIGHT }}>
                <Rocket size={22} style={{ color: GOLD }} />
              </div>
              <div>
                <h3 className="text-xl font-bold" style={{ color: DARK }}>Innovation Providers</h3>
                <p className="text-xs font-semibold" style={{ color: GOLD }}>GET DISCOVERED</p>
              </div>
            </div>
            <p className="text-sm mb-5 leading-relaxed" style={{ color: GRAY }}>
              Showcase your startup, research, or technology. Get funded, mentored, and connected to corporates looking for your innovation.
            </p>
            <ul className="space-y-2 mb-6">
              <PersonaListItem icon={Rocket} label="Startups — Deep-tech, SaaS, healthtech, defence tech" color={GOLD} />
              <PersonaListItem icon={GraduationCap} label="Students — Research projects, theses, internships" color={GOLD} />
              <PersonaListItem icon={BookOpen} label="Academia — University labs, research centres, IP licensing" color={GOLD} />
            </ul>
            <a
              href="#choose-persona"
              className="inline-flex items-center gap-2 text-sm font-bold transition-all"
              style={{ color: GOLD }}
              onMouseEnter={e => e.currentTarget.style.color = GOLD_DARK}
              onMouseLeave={e => e.currentTarget.style.color = GOLD}
            >
              Join as Provider <ArrowRight size={16} />
            </a>
          </div>

          {/* Innovation Seekers */}
          <div
            className="rounded-2xl p-8 transition-all"
            style={{ background: '#fff', border: `1px solid ${BORDER}` }}
            onMouseEnter={e => e.currentTarget.style.borderColor = BLUE}
            onMouseLeave={e => e.currentTarget.style.borderColor = BORDER}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                <Target size={22} style={{ color: BLUE }} />
              </div>
              <div>
                <h3 className="text-xl font-bold" style={{ color: DARK }}>Innovation Seekers</h3>
                <p className="text-xs font-semibold" style={{ color: BLUE }}>FIND THE RIGHT STARTUP</p>
              </div>
            </div>
            <p className="text-sm mb-5 leading-relaxed" style={{ color: GRAY }}>
              Source, evaluate, and partner with high-potential startups. Solve strategic challenges with the next generation of innovators.
            </p>
            <ul className="space-y-2 mb-6">
              <PersonaListItem icon={Building2} label="Corporates — Find startups for PoCs, pilots, acquisitions" color={BLUE} />
              <PersonaListItem icon={Landmark} label="Government — iDEX, defence, e-governance tech providers" color={BLUE} />
              <PersonaListItem icon={TrendingUp} label="Investors — Pre-seed to Series C deeptech opportunities" color={BLUE} />
              <PersonaListItem icon={Users} label="Mentors — Industry advisors and domain experts" color={BLUE} />
              <PersonaListItem icon={FlaskConical} label="Labs — Research labs and testing facilities" color={BLUE} />
              <PersonaListItem icon={Home} label="Incubators & Accelerators — Growth programs" color={BLUE} />
              <PersonaListItem icon={Briefcase} label="Service Providers — Cloud credits, legal, compliance, HR" color={BLUE} />
            </ul>
            <a
              href="#choose-persona"
              className="inline-flex items-center gap-2 text-sm font-bold transition-all"
              style={{ color: BLUE }}
              onMouseEnter={e => e.currentTarget.style.color = '#2563eb'}
              onMouseLeave={e => e.currentTarget.style.color = BLUE}
            >
              Join as Seeker <ArrowRight size={16} />
            </a>
          </div>
        </div>

        {/* ── Persona Picker Grid ──────────────────────────────────── */}
        <div id="choose-persona" className="mt-14 scroll-mt-20">
          <h3 className="text-2xl font-bold text-center mb-2" style={{ color: DARK }}>Choose Your Persona</h3>
          <p className="text-sm text-center mb-8" style={{ color: GRAY }}>Click a persona to create your free account</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              { key: 'startup',          label: 'Startup',          icon: Rocket,        color: '#D5AA5B', desc: 'Tech startup or early-stage' },
              { key: 'student',          label: 'Student',          icon: GraduationCap, color: '#3b82f6', desc: 'Student innovator / researcher' },
              { key: 'academia',         label: 'Academia',         icon: BookOpen,      color: '#7c3aed', desc: 'University or research institute' },
              { key: 'corporate',        label: 'Corporate',        icon: Building2,     color: '#16a34a', desc: 'Enterprise seeking innovation' },
              { key: 'government',       label: 'Government',       icon: Landmark,      color: '#0ea5e9', desc: 'Government body or PSU' },
              { key: 'investor',         label: 'Investor',         icon: TrendingUp,    color: '#f59e0b', desc: 'Angel, VC, PE, or fund' },
              { key: 'mentor',           label: 'Mentor',           icon: Users,         color: '#ec4899', desc: 'Industry mentor or advisor' },
              { key: 'lab',              label: 'Lab',              icon: FlaskConical,  color: '#14b8a6', desc: 'Lab offering resources' },
              { key: 'incubator',        label: 'Incubator',        icon: Home,          color: '#8b5cf6', desc: 'Startup incubation program' },
              { key: 'accelerator',      label: 'Accelerator',      icon: Zap,           color: '#ef4444', desc: 'Growth acceleration program' },
              { key: 'service_provider', label: 'Service Provider', icon: Briefcase,     color: '#0d9488', desc: 'Cloud, legal, compliance services' },
            ].map(p => (
              <Link
                key={p.key}
                to={`/register?type=${p.key}`}
                className="rounded-xl p-4 text-center transition-all group"
                style={{ background: '#fff', border: `1px solid ${BORDER}` }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = p.color; e.currentTarget.style.boxShadow = `0 4px 16px ${p.color}20`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div
                  className="w-10 h-10 rounded-lg mx-auto mb-2 flex items-center justify-center"
                  style={{ background: `${p.color}12` }}
                >
                  <p.icon size={20} style={{ color: p.color }} />
                </div>
                <div className="text-sm font-bold" style={{ color: DARK }}>{p.label}</div>
                <div className="text-xs mt-0.5" style={{ color: GRAY }}>{p.desc}</div>
              </Link>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════════
          FEATURES
          ═══════════════════════════════════════════════════════════ */}
      <Section bg="#fff" id="features">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: DARK }}>
            AI-Native Innovation Intelligence
          </h2>
          <p className="text-base max-w-xl mx-auto" style={{ color: GRAY }}>
            From startup discovery to AI-powered evaluation and deal closure — native intelligence for every stage of the innovation lifecycle.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {(features || [
            { icon: 'Sparkles', title: 'AI Intelligence Engine', description: 'Native AI powers every persona. 8-vector startup evaluation with explanations and red flags. AI-narrated recommendations with fit scores. Challenge advisor auto-suggests sectors, tech, and budget. Batch application analyzer ranks applicants with strengths and weaknesses.' },
            { icon: 'Search', title: 'AI Ask + Semantic Search', description: `Natural language search powered by GPT-4o-mini translates queries like "Series A deeptech healthcare in Bangalore" into structured filters. pgvector embeddings enable cosine-similarity matching across ${liveStartupsValue || '500K+'} startups grouped into 200 AI clusters.` },
            { icon: 'Briefcase', title: 'Challenge Marketplace', description: 'Post partner, source, or invest challenges with RFI forms, data rooms, FAQs, templates, and public share links. AI evaluates and ranks applicants automatically. Used by corporates, government, and investors.' },
            { icon: 'Award', title: '8-Vector AI Evaluation', description: 'AI scores startups across Solution Fit, Tech Maturity, Scalability, Integration, Team, Cost, Innovation, and Strategic Alignment. Human-overridable scores with explanation, red flags, and recommended actions.' },
            { icon: 'Rocket', title: 'Global Startup Database', description: `${liveStartupsValue || '500K+'} enriched startup profiles with AI-powered nightly crawling from 25 RSS feeds. Unified AI pipeline extracts company names, classifies sectors, detects funding, and enriches with country, city, and DeepTech flags.` },
            { icon: 'TrendingUp', title: 'Investor Deal Pipeline', description: '7-stage deal workflow with AI-powered evaluation. Deal sourcing marketplace, portfolio management, exit tracking. AI advisor helps design deal requests and analyze applicant startups.' },
            { icon: 'Home', title: 'Incubator & Accelerator Programs', description: 'Manage cohorts and batches with AI-assisted startup evaluation. Mentor pools, demo days, corporate partners, auto-seeded milestones. AI advisor helps design programs and rank applicants.' },
            { icon: 'BarChart3', title: 'Source Innovation Talent', description: 'Discover startups, students, and academia in one platform. Source student talent for internships and projects. Connect with universities and researchers for R&D collaborations. Filter by skills, research areas, and location.' },
            { icon: 'Network', title: 'Service Partner Network', description: 'Incubators and accelerators link registered Service Providers for cloud credits, legal, financial, HR, and compliance perks. Startups redeem directly. Over 12 service categories supported.' },
            { icon: 'Globe', title: 'Token-Based AI Credits', description: 'Pay-as-you-go AI intelligence. Pro plan includes 100 AI tokens/month. Enterprise gets unlimited. Every AI evaluation, recommendation, and analysis costs tokens, tracked transparently in your dashboard.' },
            { icon: 'Calendar', title: 'Meetings + Messaging', description: 'Schedule 1:1, group, and demo meetings with RSVP tracking. Cross-persona direct and group chat keeps collaborations moving between external stakeholders.' },
            { icon: 'Zap', title: 'DeepTech Assessment', description: '16-question qualification framework across 5 dimensions (Tech Readiness, IP Depth, Research Base, Team, Market). Standardized scoring to verify true deep-tech status.' },
          ]).map((f, i) => (
            <FeatureCard key={i} icon={ICON_MAP[f.icon] || Zap} title={f.title} description={f.description} />
          ))}
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════════
          WHAT'S NEW (s47) — recently shipped capabilities
          ═══════════════════════════════════════════════════════════ */}
      <Section bg={LIGHT_GRAY} id="whats-new">
        <div className="text-center mb-14">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 text-xs font-bold tracking-wide"
            style={{ background: GOLD_LIGHT, color: GOLD_DARK }}
          >
            <Sparkles size={14} />
            WHAT&apos;S NEW
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: DARK }}>
            Recently Shipped
          </h2>
          <p className="text-base max-w-2xl mx-auto" style={{ color: GRAY }}>
            The platform shipped major upgrades in April-May 2026. Live numbers, AI-curated recommendations, multi-role accounts, and a 39× larger startup database.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-6 rounded-xl" style={{ background: '#fff', border: `1px solid ${BORDER}` }}>
            <div
              className="w-11 h-11 rounded-lg flex items-center justify-center mb-4"
              style={{ background: GOLD_LIGHT }}
            >
              <Database size={22} style={{ color: GOLD }} />
            </div>
            <h3 className="text-base font-bold mb-2" style={{ color: DARK }}>{liveStartupsValue || '500K+'} Startup Database</h3>
            <p className="text-sm leading-relaxed" style={{ color: GRAY }}>
              Bulk-imported and AI-clustered into 200 semantic groups. Every profile has a 1536-dim embedding for cosine-similarity search across the full corpus.
            </p>
          </div>
          {/* Phase 60.6 (s50) — multi-role feature card */}
          <div className="p-6 rounded-xl" style={{ background: '#fff', border: `1px solid ${BORDER}` }}>
            <div
              className="w-11 h-11 rounded-lg flex items-center justify-center mb-4"
              style={{ background: GOLD_LIGHT }}
            >
              <Layers size={22} style={{ color: GOLD }} />
            </div>
            <h3 className="text-base font-bold mb-2" style={{ color: DARK }}>Multiple Roles, One Account</h3>
            <p className="text-sm leading-relaxed" style={{ color: GRAY }}>
              Mentor a startup AND fund another. Add Investor, Mentor, Corporate, or any of 11 roles to your account anytime. Switch in one click. One inbox, one watchlist, separate dashboards.
            </p>
          </div>
          <div className="p-6 rounded-xl" style={{ background: '#fff', border: `1px solid ${BORDER}` }}>
            <div
              className="w-11 h-11 rounded-lg flex items-center justify-center mb-4"
              style={{ background: GOLD_LIGHT }}
            >
              <Network size={22} style={{ color: GOLD }} />
            </div>
            <h3 className="text-base font-bold mb-2" style={{ color: DARK }}>Multi-Space Cluster Bridge</h3>
            <p className="text-sm leading-relaxed" style={{ color: GRAY }}>
              Students and academics get personalized startup matches by bridging their persona-space cluster (e.g. Robotics, Hypersonics) to relevant startup clusters — with measurable boost lift on every recommendation.
            </p>
          </div>
          <div className="p-6 rounded-xl" style={{ background: '#fff', border: `1px solid ${BORDER}` }}>
            <div
              className="w-11 h-11 rounded-lg flex items-center justify-center mb-4"
              style={{ background: GOLD_LIGHT }}
            >
              <BarChart3 size={22} style={{ color: GOLD }} />
            </div>
            <h3 className="text-base font-bold mb-2" style={{ color: DARK }}>Click-Impact Analytics</h3>
            <p className="text-sm leading-relaxed" style={{ color: GRAY }}>
              Every recommendation surface tracks impressions, clicks, and per-cluster CTR. Admins can see which AI matches actually convert — closing the loop on recommendation quality.
            </p>
          </div>
        </div>
      </Section>

      {/* TESTIMONIALS section removed s47 \u2014 no real testimonials yet, will restore once collected. */}

      {/* ═══════════════════════════════════════════════════════════
          FAQ
          ═══════════════════════════════════════════════════════════ */}
      <Section bg="#fff" id="faq">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: DARK }}>
            Frequently Asked Questions
          </h2>
          <p className="text-base max-w-xl mx-auto" style={{ color: GRAY }}>
            Everything you need to know about OpenI.
          </p>
        </div>
        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((faq, i) => (
            <FAQItem
              key={i}
              question={faq.q}
              answer={faq.a}
              isOpen={openFaq === i}
              onToggle={() => setOpenFaq(openFaq === i ? null : i)}
            />
          ))}
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════════
          PRICING
          ═══════════════════════════════════════════════════════════ */}
      <Section bg={LIGHT_GRAY} id="pricing">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: DARK }}>
            {pricing?.title || 'Simple, Transparent Pricing'}
          </h2>
          <p className="text-base max-w-xl mx-auto" style={{ color: GRAY }}>
            {pricing?.subtitle || 'Start free. Upgrade when you need more. No credit card required.'}
          </p>
          <p className="text-sm max-w-2xl mx-auto mt-3" style={{ color: GRAY }}>
            <strong style={{ color: DARK }}>Per-role plans:</strong> hold multiple roles on one account and pay only for the roles where you want Pro features. Mentor on Free + Investor on Pro? No problem.
          </p>
        </div>

        {/* Phase 37: Tabbed pricing — Provider vs Seeker */}
        <div className="flex justify-center gap-2 mb-10">
          <button onClick={() => setPricingTab('seeker')}
            style={{ padding: '10px 24px', fontSize: 14, fontWeight: 600, borderRadius: 10, border: `2px solid ${pricingTab === 'seeker' ? GOLD : '#e5e7eb'}`, background: pricingTab === 'seeker' ? `${GOLD}12` : '#fff', color: pricingTab === 'seeker' ? GOLD : GRAY, cursor: 'pointer', transition: 'all 0.15s' }}>
            For Corporates, Investors, Govt & Innovation Seekers
          </button>
          <button onClick={() => setPricingTab('provider')}
            style={{ padding: '10px 24px', fontSize: 14, fontWeight: 600, borderRadius: 10, border: `2px solid ${pricingTab === 'provider' ? GOLD : '#e5e7eb'}`, background: pricingTab === 'provider' ? `${GOLD}12` : '#fff', color: pricingTab === 'provider' ? GOLD : GRAY, cursor: 'pointer', transition: 'all 0.15s' }}>
            For Startups, Students & Academia
          </button>
        </div>

        {pricingTab === 'provider' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <PricingCard
              name="Free"
              price="₹0"
              priceNote="/forever"
              features={[
                'Full profile with all sections',
                'Apply to 5 challenges / month',
                'Apply to 3 investor deal requests / month',
                '5 conversations, 3 meetings / month',
                '3 file uploads, 10 connection requests / month',
                'Standard search ranking',
                'Basic dashboard & profile builder',
              ]}
              cta="Start Free"
              ctaLink="/register"
            />
            <PricingCard
              name="Growth"
              price="₹499"
              priceNote="/month"
              featured
              features={[
                'Everything in Free, plus:',
                'Unlimited applications & connections',
                'Featured badge + priority search ranking',
                'Who viewed my profile (last 30 days)',
                'Watchlist alerts — know when you are shortlisted',
                'Application insights (seen / shortlisted / rejected)',
                'AI profile score recommendations',
                '25 meetings + 50 file uploads / month',
                'Unlimited messaging',
              ]}
              cta="Upgrade to Growth"
              ctaLink="/register"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <PricingCard
              name="Free"
              price="₹0"
              priceNote="/forever"
              features={[
                'Full directory + keyword search (FTS)',
                'Find startups, students, and academia',
                '1 active challenge / month',
                'Deal pipeline (3 deals max)',
                '5 application reviews / month',
                '10 messages, 5 meetings / month',
                '5 file uploads / month',
              ]}
              cta="Start Free"
              ctaLink="/register"
            />
            <PricingCard
              name="Pro"
              price="₹2,499"
              priceNote="/month"
              featured
              features={[
                'Everything in Free, plus:',
                '200 AI tokens/month for AI Intelligence',
                'AI Startup Evaluator (8-vector scoring)',
                'AI Smart Recommendations + Challenge Advisor',
                'AI Ask — 50 natural-language searches/day',
                'Semantic search (pgvector matching)',
                '10 active challenges, full deal pipeline',
                '50 app reviews, unlimited messaging & meetings',
                '100 file uploads / month',
              ]}
              cta="Upgrade to Pro"
              ctaLink="/register"
            />
            <PricingCard
              name="Enterprise"
              price="₹9,999"
              priceNote="/month"
              features={[
                'Everything in Pro, plus:',
                'Unlimited AI tokens + AI Ask searches',
                'Unlimited challenges, reviews, uploads',
                'Multi-seat organization admin',
                'Service Partner network access',
                'Multi-currency (INR + USD)',
                'SSO, audit logs, SLA guarantees',
                'API access + data export',
                'Dedicated account manager',
              ]}
              cta="Contact Sales"
              ctaLink="/register"
            />
          </div>
        )}

        <p className="text-center text-sm mt-8" style={{ color: GRAY }}>
          All plans include SSL encryption, daily backups, and access to all 11 persona types. Annual billing saves ~17%.
        </p>
      </Section>

      {/* ═══════════════════════════════════════════════════════════
          FINAL CTA
          ═══════════════════════════════════════════════════════════ */}
      <section
        className="py-20 px-6"
        style={{
          background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_DARK} 100%)`,
        }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <Network size={40} color="#fff" className="mx-auto mb-5 opacity-90" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            {ctaContent?.title || 'Ready to Join the Ecosystem?'}
          </h2>
          <p className="text-base mb-8 max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.9)' }}>
            {ctaContent?.description || 'Join thousands of innovators, investors, and enterprises building the future of deep-tech in India.'}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-lg text-base font-bold transition-all shadow-lg"
              style={{ background: '#fff', color: GOLD_DARK }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              Get Started — It&apos;s Free
              <ArrowRight size={18} />
            </Link>
            <Link
              to="/marketplace"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-lg text-base font-bold transition-all"
              style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.3)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
            >
              Browse Marketplace
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          FOOTER
          ═══════════════════════════════════════════════════════════ */}
      <footer className="px-6 py-12" style={{ background: DARK, color: '#9ca3af' }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            {/* Logo & tagline */}
            <div className="col-span-2">
              <img
                src="/openi-logo.png"
                alt="OpenI"
                style={{ height: 36, width: 'auto', maxWidth: 120, objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
              />
              <p className="text-sm mt-4 max-w-xs leading-relaxed">
                {footerTagline || 'The open innovation platform connecting India\u2019s deep-tech ecosystem. Partner. Source. Invest.'}
              </p>
              {/* Social Links */}
              <div className="flex items-center gap-4 mt-4">
                <a href="https://www.linkedin.com/company/openi-partners/" target="_blank" rel="noopener noreferrer"
                   className="transition-colors"
                   onMouseEnter={e => e.currentTarget.querySelector('svg').setAttribute('fill', GOLD)}
                   onMouseLeave={e => e.currentTarget.querySelector('svg').setAttribute('fill', '#9ca3af')}>
                  <LinkedInIcon size={20} color="#9ca3af" />
                </a>
                <a href="https://x.com/OpenIPartners" target="_blank" rel="noopener noreferrer"
                   className="transition-colors"
                   onMouseEnter={e => e.currentTarget.querySelector('svg').setAttribute('fill', GOLD)}
                   onMouseLeave={e => e.currentTarget.querySelector('svg').setAttribute('fill', '#9ca3af')}>
                  <XIcon size={20} color="#9ca3af" />
                </a>
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-sm font-bold mb-4 text-white">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/marketplace" className="hover:text-white transition-colors">Marketplace</Link></li>
                <li><Link to="/reports" className="hover:text-white transition-colors">Startup Reports</Link></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><Link to="/register" className="hover:text-white transition-colors">Get Started</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-sm font-bold mb-4 text-white">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/dashboard/login" className="hover:text-white transition-colors">Sign In</Link></li>
                <li><a href="mailto:info@openi.ai" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t pt-8 flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderColor: '#333' }}>
            <p className="text-xs">
              &copy; 2026 OpenI Hub &middot; Built for Startup and Innovation Ecosystem
            </p>
            <p className="text-xs">
              <span style={{ color: GOLD }}>openi.tech</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
