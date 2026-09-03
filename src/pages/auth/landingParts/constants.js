/**
 * Landing page constants — Phase 167 (W5-4).
 *
 * VERBATIM slices of the pre-split src/pages/auth/Landing.jsx:
 *   16-22  ICON_MAP        (CMS icon-name string -> lucide component)
 *   24-33  brand colours   (Option B Light tokens)
 *   52-96  DEFAULT_*       (fallbacks if /api/public/landing-content fails)
 *
 * The 28 lucide names below are exactly ICON_MAP's keys — nothing else in
 * this file references a component.
 */
import {
  Briefcase, Search, Award, Calendar, MessageSquare, Zap, BarChart3, Globe,
  Shield, Users, Target, Network, Sparkles, FileText, Database, Rocket,
  TrendingUp, Star, UserPlus, Building2, Landmark, GraduationCap, FlaskConical,
  Home, BookOpen, ArrowRight, CheckCircle2, Layers,
} from 'lucide-react';

// ---- BODY START (original lines 16-22) ----
// Icon map for CMS-provided icon names (string → component)
const ICON_MAP = {
  Briefcase, Search, Award, Calendar, MessageSquare, Zap, BarChart3, Globe,
  Shield, Users, Target, Network, Sparkles, FileText, Database, Rocket,
  TrendingUp, Star, UserPlus, Building2, Landmark, GraduationCap, FlaskConical,
  Home, BookOpen, ArrowRight, CheckCircle2, Layers,
};
// ---- BODY END ----

// ---- BODY START (original lines 24-33) ----
// Brand colors — Option B Light tokens (build brief)
const GOLD = '#D3AD5B';                       // brand gold (buttons, accents)
const GOLD_DARK = '#C19A45';                  // darker gold for hover states
const GOLD_DEEP = '#B5872B';                  // deep gold for small text on white
const GOLD_LIGHT = 'rgba(211, 173, 91, 0.12)'; // soft gold tint (icon chips)
const BLUE = '#3b82f6';
const DARK = '#2E2E34';                       // heading text
const GRAY = '#6A6A70';                       // body text
const LIGHT_GRAY = '#F3F0EA';                 // alt section background
const BORDER = '#E8E3D8';                     // default border
// ---- BODY END ----

// ---- BODY START (original lines 52-96) ----
// ── Default content (shown only if /api/public/landing-content fails) ─────────
// Backend normally returns live DB-counted stats which override these defaults.
// Match backend labels so visual layout doesn't shift on hydration.
// Labels are written for the visitor, not for our data model (UX audit,
// 21 Aug 2026). "Personas" is the internal name for the role a user signs up
// as; a corporate innovation lead does not think of themselves as picking a
// persona, and a stat tile is the worst place to teach someone a taxonomy.
// "AI Clusters" stated a mechanism where a benefit belongs — the number only
// means something once you know it is what makes search return peers rather
// than keyword matches. The `Global Startups` label must stay exactly as-is:
// Landing.jsx overlays the live DB count by matching on that string.
const DEFAULT_STATS = [
  { value: '575K+', label: 'Global Startups' },
  // '230+' is a floor claim on purpose: the curated taxonomy grows (239 at
  // s109) and a hardcoded exact count drifts stale — the hero-number
  // incident above is the precedent. Raise the floor only in big jumps.
  { value: '230+', label: 'Innovation Maps' },
  { value: '11', label: 'Roles, One Account' },
  { value: 'ISO 27001', label: 'Certified & Secure' },
];

// Phase 60.7 (s50) — real partners + logo-ready data shape.
// Each entry has a `slug` matching a file in public/partners/<slug>.png (or .svg).
// If the image is missing the rendering falls back to the text name.
const DEFAULT_PARTNERS = [
  { name: 'NAB',                          slug: 'nab' },
  { name: 'Satin',                        slug: 'satin' },
  { name: 'Guru Gobind Singh IP University', slug: 'ggsipu' },
  { name: 'SonderConnect',                slug: 'sonderconnect' },
  { name: 'Diageo',                       slug: 'diageo' },
  { name: 'Aditya Birla Group',           slug: 'aditya-birla' },
  { name: 'Karnataka Digital Economy Mission', slug: 'karnataka-digital-economy' },
  { name: 'Dentsu',                       slug: 'dentsu' },
];

const DEFAULT_FAQS = [
  { q: 'Who can join OpenI?', a: 'Anyone in the innovation ecosystem \u2014 startups, corporates, investors, government bodies, mentors, labs, incubators, accelerators, service providers, students, and academia. All 11 persona types get a tailored dashboard, directory listing, and workflow tools.' },
  { q: 'Is OpenI free to use?', a: 'Yes! The Free tier gives you access to the core platform including keyword search, directory, meetings, messaging, and up to 1 challenge per month. Paid plans are listed exclusive of GST (18% added at checkout, per Indian Tax). Upgrade to Pro for AI Semantic Search, richer limits, and advanced workflows. Enterprise unlocks unlimited everything plus dedicated support.' },
  { q: 'What is AI Ask \u2014 and how is it different from keyword search?', a: 'AI Ask lets you type natural-language queries like \u201cearly-stage deeptech healthcare startups in Bangalore that raised Seed\u201d and our query-parser model translates that into structured filters (sector + stage + city + deeptech flag) then runs it against our FTS + vector search stack. Results come back ranked, with the AI\u2019s interpretation shown above the list so you can verify what it understood. Pro tier and above.' },
  { q: 'What is the 8-Vector Evaluation Framework?', a: 'A proprietary scoring system that evaluates startups across 8 dimensions: Market, Team, Tech, Traction, Financials, IP, Scalability, and Strategic Fit. Investors use it in their deal pipeline; incubators and accelerators run it as time-series checkpoints (Entry \u2192 Mid-program \u2192 Demo Day \u2192 Graduation) to track portfolio progress on a radar chart.' },
  { q: 'Can incubators and accelerators track their portfolio health?', a: 'Yes. The Portfolio Health tab inside each Program or Batch shows an 8-vector radar of your portfolio average, flags at-risk startups (overall score < 3 or red flags set), and tracks each startup\u2019s progression across multiple checkpoints \u2014 so you can intervene early and measure the impact of your mentorship.' },
  { q: 'How does the Challenge Marketplace work?', a: 'Corporates, investors, and government bodies post open innovation challenges with sector tags, budget ranges, data rooms, and FAQs. Startups apply with structured proposals; seekers evaluate, rate (1-5 stars), and move applicants through a drag-and-drop pipeline into active collaborations with milestones, tasks, and budget tracking.' },
  { q: 'Does OpenI support multi-currency for global programs?', a: 'Yes. All monetary fields (funding, investment, ticket sizes, perks, etc.) support both INR and USD natively, with compact locale-appropriate display (\u20B95L, \u20B92Cr, $60K, $1.5M). Users can set their preferred currency in Settings \u2192 Profile. No FX conversion \u2014 each amount keeps its entered currency for honest reporting.' },
  { q: 'I am an investor AND a mentor — do I need two accounts?', a: 'No. One account holds multiple roles. Sign up with your primary role, then add as many additional roles as you need from your dashboard. Each role gets its own dashboard, sidebar, and workflows; switch between them with one click using the role tabs at the top of any dashboard page. One inbox, one watchlist, separate per-role billing if you upgrade to Pro on a specific role.' },
];

// Phase 124 (5 Jul) — Corporate/Enterprise-facing services section, matching the
// backend DEFAULT_LANDING.services fallback shape (icon, title, description).
const DEFAULT_SERVICES = [
  { icon: 'Layers', title: 'Solution Architecture', description: 'We define what needs to be solved, in what sequence, with which capabilities — then assemble the right partners around a blueprint, not a vendor list.' },
  { icon: 'Network', title: 'Startup Fusion', description: 'When no single startup covers your challenge, we engineer a composite — two or more complementary startups fused into one architecture, one integration plan, one accountable delivery.' },
  { icon: 'Shield', title: 'Managed Sandbox', description: 'Isolated, secure test environments purpose-built for innovation pilots — ready in days, with the access controls your IT and compliance teams require.' },
  { icon: 'Database', title: 'Synthetic Data', description: 'Datasets that mirror your real-world conditions so startups can build and you can evaluate — privacy-safe by design, with zero exposure of sensitive records.' },
  { icon: 'Target', title: 'Innovation Project Management', description: 'A dedicated project lead runs the integration — milestones, escalations, and stakeholder alignment — so a promising pilot doesn\u2019t die from orphaned ownership.' },
  { icon: 'FlaskConical', title: 'Stealth-Mode Scouting', description: 'We scout university labs and student innovators in stealth mode, surfacing early prototypes before they appear on any database or a competitor\u2019s radar.' },
];
// ---- BODY END ----

export {
  ICON_MAP,
  GOLD, GOLD_DARK, GOLD_DEEP, GOLD_LIGHT, BLUE, DARK, GRAY, LIGHT_GRAY, BORDER,
  DEFAULT_STATS, DEFAULT_PARTNERS, DEFAULT_FAQS, DEFAULT_SERVICES,
};
