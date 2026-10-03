import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, Shield, Network, Sparkles, Layers,
} from 'lucide-react';
import { publicAPI } from '../../services/api';
import PublicTour from '../../components/PublicTour';
import SearchBar from '../../components/SearchBar';
import PageTourButton from '../../components/PageTourButton';

// Phase 167 (W5-4): 1,302 lines -> this page + ./landingParts/.
// The '/index.js' suffix is required, not cosmetic: APFS is case-insensitive
// and extension resolution beats directory-index resolution, so a bare
// './landingParts' could still be shadowed by a sibling .jsx file.
import {
  ICON_MAP,
  GOLD, GOLD_DARK, GOLD_DEEP, GOLD_LIGHT, DARK, GRAY, LIGHT_GRAY, BORDER,
  DEFAULT_STATS, DEFAULT_PARTNERS, DEFAULT_FAQS, DEFAULT_SERVICES,
  Section, PartnerLogo, FeatureCard,
  PricingCard, FAQItem,
  LandingHeader, LandingFooter,
} from './landingParts/index.js';
import CardDeck from './landingParts/CardDeck.jsx';
import AgentSection from './landingParts/AgentSection.jsx';
import RoleAgents, { AGENT_FAQS } from './landingParts/RoleAgents.jsx';  // s127 — section 2, an agent for every role
import HeroScreens from './landingParts/HeroScreens.jsx';  // s125 — the hero's right panel: real screens from the demo login  // s125 — the Innovation Agent, right under the hero
import { ON_GOLD, GOLD_TEXT } from './landingParts/contrast.js';  // s127 — readable text on/in the brand gold

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
  // s116k — the fallback is now DERIVED from DEFAULT_STATS rather than written
  // out a second time. It was a literal '575K+' here and a literal '575K+' in
  // constants.js, which is two copies of one fact: correcting either alone
  // recreates the exact drift the 21 Aug audit fixed (hero said 575,000+ while
  // the tile 900px below rendered 576K+). The comment above already promised
  // "every surface here now reads this one binding" — two literals did not
  // deliver that, one binding does.
  const startupCount = liveStartupsValue || statValue(DEFAULT_STATS, 'Global Startups', '');
  // s51 homepage redesign — the stats strip shows a curated 4-stat set
  // (Global Startups / AI Clusters / Personas / ISO 27001) from DEFAULT_STATS,
  // so it stays on-brief regardless of what the CMS stats array contains.
  // We still overlay the live DB "Global Startups" count when available.
  const stats = DEFAULT_STATS.map((s) =>
    s.label === 'Global Startups' && liveStartupsValue
      ? { ...s, value: liveStartupsValue }
      : s
  );
  // s127: the agent questions come first, always (the CMS list follows; a CMS copy of the same question is dropped).
  const faqs = [...AGENT_FAQS, ...(cms?.faqs || DEFAULT_FAQS).filter(f => !AGENT_FAQS.some(a => a.q === f.q))];
  const pricing = cms?.pricing || null;      // CMS pricing or inline fallback
  const hero = null;                         // Inline hero (not CMS-managed)
  const partners = cms?.partners || DEFAULT_PARTNERS;
  // s127: cms.howItWorks is no longer shown — the agents section (#how-it-works) replaced the 3-step block.
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
      {/* s110 landing redesign (3 Sep 2026) — story-first around the Art of the
          Possible. Direction "C + B combined", picked by Rajeev on the design
          canvas: split command-center hero (narrative rail + living map tree),
          then the story in chapters directly below. */}
      <section className="relative px-6 pt-14 pb-16 overflow-hidden" style={{ background: LIGHT_GRAY }}>
        <div className="relative max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-12 items-start">

          {/* ── Left: narrative rail ── */}
          <div className="lg:col-span-2 text-center lg:text-left">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-xs font-bold tracking-wide"
            style={{ background: GOLD_LIGHT, color: GOLD_TEXT }}
          >
            <Sparkles size={14} />
            {hero?.badge_text || 'YOUR INNOVATION AGENT'}
          </div>

          <h1
            id="tour-page-landing"
            className="font-bold tracking-tight mb-6"
            style={{
              color: DARK,
              fontSize: 'clamp(2.3rem, 4.5vw, 3.4rem)',
              lineHeight: 1.08,
              fontFamily: 'Lexend, sans-serif',
            }}
          >
            {/* s125 — headline chosen by Rajeev (1 Oct 2026, option A). The map stays the foundation (right panel). */}
            Your innovation team that works while you sleep.
          </h1>

          <p
            className="mb-3 text-lg leading-relaxed"
            style={{ color: GRAY }}
          >
            {/* s127 — subline chosen by Rajeev (3 Oct 2026; headline kept). Every role named here was verified live. */}
            An agent for every role: companies, investors, government, incubators, universities and startups.
            It checks every match, shows its evidence, and learns from every click.
          </p>
          <p data-testid="landing-proof" className="mb-8 text-sm leading-relaxed" style={{ color: GRAY }}>
            Your agents work across {startupCount} startups and a living family tree of 240+ Innovation Maps.
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

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 mb-8">
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
            {/* s127 (Rajeev: "change it to See what your agent does"): the second hero button opens the role tabs on this
                page; the marketplace stays one click away in the final call to action. */}
            <a
              href="#choose-persona"
              data-testid="hero-see-agent"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg text-base font-bold transition-all"
              style={{ background: '#fff', color: DARK, border: `1.5px solid ${BORDER}`, textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = GOLD}
              onMouseLeave={e => e.currentTarget.style.borderColor = BORDER}
            >
              See what your agent does
            </a>
          </div>

          {/* s110 — the s51 stats strip lives in the hero rail now; same `stats`
              binding, so the live CMS "Global Startups" overlay still applies. */}
          <div className="grid grid-cols-2 gap-3 mb-8 max-w-md mx-auto lg:mx-0">
            {stats.map((stat, i) => (
              <div key={i} className="p-4 rounded-xl text-left" style={{ background: '#fff' }}>
                <div className="text-2xl font-bold" style={{ color: GOLD_DEEP }}>{stat.value}</div>
                <div className="text-xs font-medium mt-0.5" style={{ color: GRAY }}>{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="flex justify-center lg:justify-start mb-6">
            <PageTourButton />
          </div>

          {/* Phase 60.7 (s50) — ISO 27001 trust badge */}
          <a
            href="/openi-iso-27001.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all"
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
            <span style={{ color: GOLD_TEXT }}>View Certificate</span>
          </a>
          </div>

          {/* ── Right: the Innovation Agent at work ──
              s125 — Rajeev: "right hand side image should show the work of Innovation agent not Innovation map", then
              "show the image from our demo login" / "make them the first screenshots": real screens from the demo login.
              Was the living map tree (s110); the maps stay in the proof line and the chapters below. */}
          <HeroScreens />
        </div>
      </section>

      {/* s127 landing rethink (Rajeev approved the 9-section plan, 3 Oct 2026):
          2 roles → 3 how the agents work (+ learning) → 4 you stay in charge → 5 the real map
          → 6 partners → 7 services → 8 pricing + FAQ → 9 call to action. */}
      <RoleAgents />
      <AgentSection />

      {/* ═══════════════════════════════════════════════════════════
          THE REAL MAP (s127) — the s110 chapters 01-03 condensed into one section:
          the data the agents work on, the four lenses, and the platform in action.
          Keeps the #features anchor (footer links to it).
          ═══════════════════════════════════════════════════════════ */}
      <Section bg={DARK} id="features">
        <div data-testid="landing-map" className="max-w-7xl mx-auto">
          <p className="text-xs font-extrabold uppercase tracking-widest mb-3" style={{ color: GOLD }}>What your agents work on</p>
          <h2 className="text-3xl md:text-4xl font-bold mb-10 text-white">
            Not a demo dataset. The real map.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { value: startupCount, label: 'startups, embedded and searchable' },
              { value: '240+', label: 'curated, hierarchical innovation maps' },
              { value: '4', label: 'lenses: sector, technology, function, use case' },
              { value: 'Live', label: 'counts on every map, updated as the database grows' },
            ].map((s, i) => (
              <div key={i} className="pl-5" style={{ borderLeft: `2px solid ${GOLD}` }}>
                <div className="text-4xl font-extrabold mb-1" style={{ color: GOLD }}>{s.value}</div>
                <div className="text-sm" style={{ color: LIGHT_GRAY }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: 'By sector', desc: '“Who is disrupting my industry?” 130 sector maps, FinTech to LegalTech.' },
              { title: 'By technology', desc: '“Who has the GenAI, robotics or IoT capability we lack?”' },
              { title: 'By function', desc: '“What can my finance, HR or security team use today?”' },
              { title: 'By use case', desc: '“Who solves fraud detection or churn, whatever the sector?”' },
            ].map((lens) => (
              <div key={lens.title} className="rounded-xl p-5 min-w-0" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
                <h3 className="text-base font-bold mb-1.5" style={{ color: '#fff' }}>{lens.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: LIGHT_GRAY, margin: 0 }}>{lens.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* s127 (Rajeev: "remove it and add screenshots to each role tab"): the "See it in action" slideshow of older,
          generic dashboards is gone; each "Pick your role" tab now shows that role's own agent, captured live. */}

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
          SERVICES (Corporate/Enterprise-facing) — Phase 124, 5 Jul
          ═══════════════════════════════════════════════════════════ */}
      <Section bg="#fff" id="services">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: GOLD_TEXT }}>
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

        <CardDeck gridClassName="md:grid-cols-2 lg:grid-cols-3" label="Services: swipe or use the arrow keys for more">
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
            style={{ background: GOLD, color: ON_GOLD }}
            onMouseEnter={e => e.currentTarget.style.background = GOLD_DARK}
            onMouseLeave={e => e.currentTarget.style.background = GOLD}
          >
            Get Started for Free <ArrowRight size={16} />
          </Link>
        </div>
      </Section>

      {/* TESTIMONIALS section removed s47 \u2014 no real testimonials yet, will restore once collected. */}

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
            style={{ padding: '10px 24px', fontSize: 14, fontWeight: 600, borderRadius: 10, border: `2px solid ${pricingTab === 'seeker' ? GOLD : '#e5e7eb'}`, background: pricingTab === 'seeker' ? `${GOLD}12` : '#fff', color: pricingTab === 'seeker' ? GOLD_TEXT : GRAY, cursor: 'pointer', transition: 'all 0.15s' }}>
            For Corporates, Investors, Govt & Innovation Seekers
          </button>
          <button onClick={() => setPricingTab('provider')}
            style={{ padding: '10px 24px', fontSize: 14, fontWeight: 600, borderRadius: 10, border: `2px solid ${pricingTab === 'provider' ? GOLD : '#e5e7eb'}`, background: pricingTab === 'provider' ? `${GOLD}12` : '#fff', color: pricingTab === 'provider' ? GOLD_TEXT : GRAY, cursor: 'pointer', transition: 'all 0.15s' }}>
            For Startups, Students & Academia
          </button>
        </div>

        {pricingTab === 'provider' ? (
          <CardDeck gridClassName="md:grid-cols-2 md:gap-6 md:max-w-3xl md:mx-auto" cardClassName="w-[84vw] max-w-[340px]" label="Plans: swipe or use the arrow keys for more">
            <PricingCard
              name="Free"
              price="₹0"
              priceNote="/forever"
              features={[
                'Full profile with all sections',
                'Direct messaging with any active OpenI user',
                '8-Vector self-assessment + share via PDF / link (AI draft: 20 AI credits)',
                'Apply to 5 challenges + 3 deal requests / month',
                'Art of the Possible — 240+ innovation maps + Directory + Find Mentors',
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
                '8-Vector self-evaluation framework (AI draft: 20 AI credits)',
                'Art of the Possible — 240+ innovation maps with drill-down + Directory + keyword search',
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
                'AI Startup Evaluator (auto-fill 8-Vector + red flags; 20 AI credits a draft)',
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
              style={{ background: '#fff', color: GOLD_TEXT }}
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
