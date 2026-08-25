import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, Shield, Users, Briefcase, Target, Network, Sparkles,
  Database,
  Zap, TrendingUp, Rocket, Building2, Landmark,
  GraduationCap, FlaskConical, Home, BookOpen,
  BarChart3, Layers,
} from 'lucide-react';
import { publicAPI } from '../../services/api';
import PlatformSlideshow from '../../components/PlatformSlideshow';
import PublicTour from '../../components/PublicTour';
import SearchBar from '../../components/SearchBar';
import PageTourButton from '../../components/PageTourButton';

// Phase 167 (W5-4): 1,302 lines -> this page + ./landingParts/.
// The '/index.js' suffix is required, not cosmetic: APFS is case-insensitive
// and extension resolution beats directory-index resolution, so a bare
// './landingParts' could still be shadowed by a sibling .jsx file.
import {
  ICON_MAP,
  GOLD, GOLD_DARK, GOLD_DEEP, GOLD_LIGHT, BLUE, DARK, GRAY, LIGHT_GRAY, BORDER,
  DEFAULT_STATS, DEFAULT_PARTNERS, DEFAULT_FAQS, DEFAULT_SERVICES,
  Section, PartnerLogo, FeatureCard,
  PricingCard, Step, PersonaListItem, FAQItem,
  LandingHeader, LandingFooter,
} from './landingParts/index.js';
import CardDeck from './landingParts/CardDeck.jsx';

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
  // s47: Hero subtitle pulls the live "Global Startups" count from cms.stats by label match.
  // Fallback string used until cms loads (avoids hardcoding stale numbers in the bundle).
  const liveStartupsValue = statValue(cms?.stats, 'Global Startups', '');
  // ONE startup count, ONE format, everywhere on this page (UX audit, 21 Aug 2026).
  // The hero subheadline hardcoded "575,000+" while the stats tile 900px below
  // rendered the live CMS value as "576K+". Two different numbers for the same
  // fact on the same page, and it is the primary proof-of-scale claim — it read
  // as carelessness rather than as a counter ticking up. Every surface here now
  // reads this one binding, so the hero and the tile cannot drift apart again:
  // when the live count moves, all of them move together.
  const startupCount = liveStartupsValue || '575K+';
  // s51 homepage redesign — the stats strip shows a curated 4-stat set
  // (Global Startups / AI Clusters / Personas / ISO 27001) from DEFAULT_STATS,
  // so it stays on-brief regardless of what the CMS stats array contains.
  // We still overlay the live DB "Global Startups" count when available.
  const stats = DEFAULT_STATS.map((s) =>
    s.label === 'Global Startups' && liveStartupsValue
      ? { ...s, value: liveStartupsValue }
      : s
  );
  const faqs = cms?.faqs || DEFAULT_FAQS;
  const features = null;                     // Inline 12-card grid (not CMS-managed)
  const pricing = cms?.pricing || null;      // CMS pricing or inline fallback
  const hero = null;                         // Inline hero (not CMS-managed)
  const partners = cms?.partners || DEFAULT_PARTNERS;
  const howItWorks = cms?.howItWorks || null;
  const services = cms?.services || null;
  const ctaContent = cms?.cta || null;
  const footerTagline = cms?.footer_tagline || null;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#fff' }}>
      {/* ═══════════════════════════════════════════════════════════
          HEADER (sticky)
          ═══════════════════════════════════════════════════════════ */}
      <LandingHeader
        mobileNavOpen={mobileNavOpen}
        setMobileNavOpen={setMobileNavOpen}
        handleHeaderSearch={handleHeaderSearch}
      />

      <main>

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
            {hero?.badge_text || 'THE OPEN INNOVATION MARKETPLACE'}
          </div>

          <h1
            id="tour-page-landing"
            className="font-bold tracking-tight mb-6"
            style={{
              color: DARK,
              fontSize: 'clamp(2.5rem, 6vw, 5rem)',
              lineHeight: 1.05,
              fontFamily: 'Lexend, sans-serif',
            }}
          >
            Find your next innovation partner <span style={{ color: GOLD }}>—</span> in one open ecosystem.
          </h1>

          <p
            className="max-w-3xl mx-auto mb-10 text-lg leading-relaxed"
            style={{ color: GRAY }}
          >
            Search {startupCount} startups, post a challenge, and connect directly. Free to start, no credit card.
          </p>

          {/* Hero search — shown BELOW xl only (UX audit, 21 Aug 2026).
              At 390px the header collapsed to logo + Get Started + hamburger,
              so the product's actual differentiator — asking a question across
              575k startups in plain English — was not on the first mobile
              screen at all. It was reachable only by opening the menu, and a
              menu is where people look for navigation, not for the core action.

              The breakpoint is `xl:hidden`, NOT `lg:hidden`, and that is
              load-bearing: LandingHeader.jsx:52 reveals its SearchBar at
              `hidden xl:block` (deliberately xl, so the field never contends
              with the nav in the 1024-1279px band). Hiding this one at `lg`
              would leave 1024-1279px with no search field anywhere on the page.
              `xl:hidden` here is exactly complementary to the header's
              `xl:block`: one search field on screen at every width, never two
              and never zero.

              No onSearch prop needed — SearchBar's own default (SearchBar.jsx:74)
              navigates to /search?q=…&mode=…, which is character-for-character
              what Landing.handleHeaderSearch does for the header instance. */}
          <div className="xl:hidden max-w-xl mx-auto mb-6 text-left">
            <SearchBar showAiToggle placeholder={`Ask or search ${startupCount} startups...`} />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg text-base font-bold transition-all shadow-lg"
              style={{ background: GOLD, color: '#2A2A2E', boxShadow: '0 8px 24px rgba(211,173,91,0.3)' }}
              onMouseEnter={e => {
                e.currentTarget.style.background = GOLD_DARK;
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = GOLD;
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Get Started for Free
              <ArrowRight size={18} />
            </Link>
            <Link
              to="/marketplace"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg text-base font-bold transition-all"
              style={{ background: '#fff', color: DARK, border: `1.5px solid ${BORDER}` }}
              onMouseEnter={e => e.currentTarget.style.borderColor = GOLD}
              onMouseLeave={e => e.currentTarget.style.borderColor = BORDER}
            >
              Browse Marketplace
            </Link>
          </div>

          <div className="flex justify-center mb-8">
            <PageTourButton />
          </div>

          <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: GRAY }}>
            {hero?.sectors_text || `AI-powered search · ${startupCount} startups · ISO/IEC 27001 certified`}
          </p>

          {/* Phase 60.7 (s50) — ISO 27001 trust badge */}
          <a
            href="/openi-iso-27001.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-6 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={{
              background: '#fff',
              border: `1px solid ${BORDER}`,
              color: GRAY,
              textDecoration: 'none',
            }}
            title="View ISO/IEC 27001:2022 certificate (PDF)"
            onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.color = DARK; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = GRAY; }}
          >
            <Shield size={13} style={{ color: GOLD }} />
            <span>ISO/IEC 27001:2022 Certified</span>
            <span style={{ color: BORDER }}>&middot;</span>
            <span style={{ color: GOLD }}>View Certificate</span>
          </a>
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
            A growing network of startups, corporates, and institutions building the open innovation ecosystem together.
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
          Phase 60.7 (s50): renders <img> from public/partners/<slug>.png
          when entry has a slug; text fallback if image fails to load OR
          if entry is a plain string (back-compat with CMS string-array).
          ═══════════════════════════════════════════════════════════ */}
      {/* s50 redesign — continuous right-to-left marquee. Logos render in a
          single row that auto-scrolls; the partners list renders TWICE so the
          loop animates seamlessly (translateX 0 -> -50%). Keeps logos on one
          row regardless of viewport width. Animation pauses on hover for a11y. */}
      <section className="py-14 px-6" style={{ background: '#fff', borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`, overflow: 'hidden' }}>
        <div className="max-w-6xl mx-auto">
          <p className="text-xs uppercase tracking-wider font-semibold mb-8 text-center" style={{ color: GRAY, letterSpacing: 1.2 }}>
            Ecosystem Partners &amp; Supporters
          </p>
          <div className="partner-marquee">
            <div className="partner-marquee-track">
              {[...partners, ...partners].map((p, i) => {
                const isObject = typeof p === 'object' && p !== null;
                const name = isObject ? p.name : p;
                const slug = isObject ? p.slug : null;
                return (
                  <PartnerLogo key={i} name={name} slug={slug} />
                );
              })}
            </div>
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
            { number: '1', title: 'Register your role', description: 'Choose from 11 roles — startup, corporate, investor, government, mentor, lab, and more. Each gets a tailored profile and dashboard.' },
            { number: '2', title: 'Discover & connect', description: `Search ${startupCount} startups, browse challenges, and use the 8-vector evaluation framework to find the right partners, investments, and innovations.` },
            { number: '3', title: 'Collaborate & grow', description: 'Schedule meetings, submit proposals, and track projects — manage the full journey from first contact to successful pilot.' },
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

        <CardDeck gridClassName="md:grid-cols-2 md:gap-6" cardClassName="w-[86vw] max-w-[360px]">
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
        </CardDeck>

        {/* ── Persona Picker Grid ──────────────────────────────────── */}
        <div id="choose-persona" className="mt-14 scroll-mt-20">
          <h3 className="text-2xl font-bold text-center mb-2" style={{ color: DARK }}>Choose Your Persona</h3>
          <p className="text-sm text-center mb-8" style={{ color: GRAY }}>Click a persona to create your free account</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              { key: 'startup',          label: 'Startup',          icon: Rocket,        color: '#D0A848', desc: 'Tech startup or early-stage' },
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
          SERVICES (Corporate/Enterprise-facing) — Phase 124, 5 Jul
          ═══════════════════════════════════════════════════════════ */}
      <Section bg={LIGHT_GRAY} id="services">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: GOLD }}>
            For Corporates & Enterprises
          </p>
          <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: DARK }}>
            Services
          </h2>
          <p className="text-lg font-semibold mb-4" style={{ color: DARK }}>
            The platform finds your partner. Our services deliver your solution.
          </p>
          <p className="text-base max-w-2xl mx-auto" style={{ color: GRAY }}>
            Discovery and evaluation get you to the right startups. Our hands-on services take you the
            rest of the way — from architecture to fusion to a pilot that actually runs. Delivered by
            the OpenI team, inside one ecosystem.
          </p>
        </div>

        <CardDeck gridClassName="md:grid-cols-2 lg:grid-cols-3">
          {(services || DEFAULT_SERVICES).map((s, i) => {
            const Icon = ICON_MAP[s.icon] || Layers;
            return <FeatureCard key={i} icon={Icon} title={s.title} description={s.description} />;
          })}
        </CardDeck>

        <div className="text-center mt-14">
          <h3 className="text-xl font-bold mb-2" style={{ color: DARK }}>
            Every service. One ecosystem.
          </h3>
          <p className="text-sm mb-6 max-w-xl mx-auto" style={{ color: GRAY }}>
            Evaluation, architecture, fusion, sandbox, data, delivery — you don't need six vendors.
            You need one ecosystem that composes them.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all"
            style={{ background: GOLD, color: '#fff' }}
            onMouseEnter={e => e.currentTarget.style.background = GOLD_DARK}
            onMouseLeave={e => e.currentTarget.style.background = GOLD}
          >
            Get Started for Free <ArrowRight size={16} />
          </Link>
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

        <CardDeck gridClassName="md:grid-cols-2 lg:grid-cols-4">
          {(features || [
            { icon: 'Award', title: '8-Vector AI Evaluation', description: 'Score startups across Solution Fit, Tech Maturity, Scalability, Integration, Team, Cost, Innovation, and Strategic Alignment — with clear explanations, red flags, and recommended next steps.' },
            { icon: 'Search', title: 'Semantic AI Search', description: `Search in plain English — "Series A deeptech healthcare in Bangalore" — and get matched across ${startupCount} startups grouped into 200 AI clusters.` },
            { icon: 'Briefcase', title: 'Challenge Marketplace', description: 'Post partner, source, or invest challenges with RFI forms, data rooms, and public share links. AI evaluates and ranks applicants automatically.' },
            { icon: 'Rocket', title: 'Global Startup Database', description: `${startupCount} enriched startup profiles, kept current by AI — sectors classified, funding detected, and location and DeepTech flags added automatically.` },
          ]).map((f, i) => (
            <FeatureCard key={i} icon={ICON_MAP[f.icon] || Zap} title={f.title} description={f.description} />
          ))}
        </CardDeck>

        <div className="text-center mt-12">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 text-sm font-semibold transition-colors"
            style={{ color: GOLD_DEEP }}
          >
            Explore all platform capabilities
            <ArrowRight size={16} />
          </Link>
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
        <CardDeck gridClassName="md:grid-cols-2 lg:grid-cols-4">
          <div className="p-6 rounded-xl h-full" style={{ background: '#fff', border: `1px solid ${BORDER}` }}>
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
        </CardDeck>
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
          <CardDeck gridClassName="md:grid-cols-2 md:gap-6 md:max-w-3xl md:mx-auto" cardClassName="w-[84vw] max-w-[340px]">
            <PricingCard
              name="Free"
              price="₹0"
              priceNote="/forever"
              features={[
                'Full profile with all sections',
                'Direct messaging with any active OpenI user',
                '8-Vector self-assessment + share via PDF / link',
                'Apply to 5 challenges + 3 deal requests / month',
                'Innovation Map + Directory + Find Mentors',
                'Notifications bell + Watchlist (saved searches)',
                '5 meetings, 3 file uploads / month',
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
                'Unlimited applications, connections, and messaging',
                'Featured badge + priority search ranking',
                'Who viewed my profile (last 30 days)',
                'Share profile / IPR / DeepTech assessment via magic-link',
                'Watchlist alerts — know when you are shortlisted',
                'AI profile coach + application insights',
                '25 meetings + 50 file uploads / month',
              ]}
              cta="Upgrade to Growth"
              ctaLink="/register"
            />
          </CardDeck>
        ) : (
          <CardDeck gridClassName="md:grid-cols-3 md:gap-6 md:max-w-5xl md:mx-auto" cardClassName="w-[84vw] max-w-[340px]">
            <PricingCard
              name="Free"
              price="₹0"
              priceNote="/forever"
              features={[
                'Direct messaging with startups + any active OpenI user',
                '8-Vector self-evaluation framework',
                'Innovation Map + Directory + keyword search',
                '1 active challenge / month + review queue',
                'Watchlist + Notifications bell',
                'Deal pipeline (3 deals max)',
                '5 meetings, 5 file uploads / month',
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
                'AI Startup Evaluator (auto-fill 8-Vector + red flags)',
                'AI Ask — 50 natural-language searches/day',
                'AI Smart Recommendations + Challenge Advisor',
                'AI semantic search — find startups by meaning, not keywords',
                'Invite-only challenges + invite-by-email (signup magic-link)',
                'Watchlist collaborators (editor / viewer roles)',
                'Share watchlist / startup profile / IPR via magic-link',
                'Add reviewers to your challenge review queue',
                '10 challenges + 50 app reviews + 100 uploads / month',
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
                'Unlimited AI usage + AI Ask + challenges + reviews',
                'Multi-seat organization admin with role controls',
                'USD billing for international / export customers',
                'Annual cycle with ~17% savings',
                'Service Partner network access',
                'SSO, audit logs, SLA guarantees',
                'API access + data export',
                'Dedicated account manager',
              ]}
              cta="Contact Sales"
              ctaLink="/register"
            />
          </CardDeck>
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
            {ctaContent?.title || 'Ready to find your next partner?'}
          </h2>
          <p className="text-base mb-8 max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.9)' }}>
            {ctaContent?.description || 'Join innovators, investors, and enterprises building what\u2019s next. Free to start \u2014 no credit card required.'}
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

      </main>

      {/* ═══════════════════════════════════════════════════════════
          FOOTER
          ═══════════════════════════════════════════════════════════ */}
      <LandingFooter footerTagline={footerTagline} />

      {/* Page tour (auto-start-once for guests + manual replay) */}
      <PublicTour />
    </div>
  );
}
