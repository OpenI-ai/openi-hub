<!-- Verbatim section of OpenI Hub DOCUMENTATION.md (lines 1073-1240 of the pre-split original). -->
<!-- Index: ../../DOCUMENTATION.md · Body starts line 4 (uniform across all parts: tail -n +4). -->

## 15. Marketing Landing Page

**File:** `src/pages/auth/Landing.jsx`
**Route:** `/` (for unauthenticated users) and `/landing` (legacy alias)
**Added:** 5 April 2026 (v2.4)

### 15.1 Purpose

The landing page is the first impression for visitors typing `openi.tech` into a browser. It replaces the earlier version that dumped visitors straight onto a persona picker with no context. The new page tells the OpenI story first and moves persona selection into the registration flow where it logically belongs.

### 15.2 Value Proposition

- **Headline:** "Partner. Source. Invest." (with the word "Invest" highlighted in brand gold)
- **Subheadline:** "OpenI is the open innovation platform where corporates, investors, and governments connect with India's most promising startups — discover, evaluate, and collaborate on one platform."
- **Eyebrow tag:** "INDIA'S OPEN INNOVATION PLATFORM"
- **Micro trust line:** "Built for Deep-Tech · AI · Quantum · Defence · Cybersecurity"

### 15.3 Page Structure (12 sections — updated v2.5)

| # | Section | Background | Purpose |
|---|---------|------------|---------|
| 1 | **Sticky Header** | White with backdrop blur | Logo, nav (Marketplace / Reports / How It Works / Features / Pricing), LinkedIn + X icons, Sign In + Get Started CTAs |
| 2 | **Hero** | Gradient (light gray → white) with gold orb glow | Big headline, subheadline, dual CTA ("Get Started" + "Browse Challenges"), trust line |
| 3 | **Stats / Social Proof** | White | 4-column grid: 500+ Registered Startups, 50+ Corporate Partners, 120+ Challenges Posted, 25 Cr+ Investments Facilitated |
| 4 | **Partner / Trust Logos** | Light gray | Ecosystem partners: DRDO, DPIIT, iDEX, NASSCOM, Startup India, AIM (text placeholders, swappable with logos) |
| 5 | **How It Works** | White | 3-step numbered explainer: Register Your Persona → Discover & Connect → Collaborate & Grow |
| 6 | **Built for Every Stakeholder** | Light gray | Two-column Providers/Seekers split. Gold accent for Providers, blue for Seekers |
| 7 | **Features Grid** | White | 8 feature cards: Challenge Marketplace, Directory Search, 8-Vector Evaluation, Meetings & RSVPs, Real-time Messaging, DeepTech Assessment, Recommendations Engine, Public Marketplace |
| 8 | **Testimonials** | Light gray | 3 testimonial cards with 5-star ratings from corporates, investors, and startups |
| 9 | **FAQ Accordion** | White | 6 expandable questions covering: who can join, pricing, evaluation framework, marketplace, defence-tech, recommendations |
| 10 | **Simple, Transparent Pricing** | Light gray | 3-tier pricing cards: Free ₹0, **Pro ₹999/mo (featured)**, Enterprise ₹4,999/mo |
| 11 | **Final CTA** | Gold gradient | "Ready to Join the Ecosystem?" + dual CTA ("Get Started" + "Browse Marketplace") |
| 12 | **Footer** | Dark (#1a1a1a) | Logo, tagline, LinkedIn + X social icons, Product links (Marketplace, Reports, How It Works, Features, Pricing), Company links, copyright |

### 15.4 CTA Routing

All CTAs route to one of two destinations:

| CTA | Destination | Purpose |
|-----|-------------|---------|
| "Get Started" / "Get Started — It's Free" / "Join as Provider" / "Join as Seeker" | `/register` | Existing persona picker (10 persona types) |
| "Sign In" | `/dashboard/login` | Existing login form |

The persona picker page at `/register` was preserved as-is — just moved out of the first-impression slot.

### 15.5 Design System

- **Brand gold:** `#D5AA5B` (primary), `#C9983F` (dark hover), `rgba(213,170,91,0.1)` (tint)
- **Seeker blue:** `#3b82f6` (used only for the Innovation Seekers card accent)
- **Dark text:** `#1a1a1a`
- **Body gray:** `#6b7280`
- **Light gray bg:** `#f5f5f5`
- **Border:** `#e5e7eb`
- **Typography:** Plus Jakarta Sans for headlines, Inter for body (already imported in index.html)
- **Hero headline:** `clamp(2.5rem, 6vw, 5rem)` for fluid scaling across devices

### 15.6 Mobile Responsiveness

- Grid sections use Tailwind's `md:` and `lg:` breakpoints
- Hero headline scales fluidly via CSS `clamp()`
- Header nav collapses to logo + CTA only on mobile
- Feature grid: 1 col mobile → 2 cols tablet → 4 cols desktop
- Provider/Seeker split: stacked on mobile, side-by-side on desktop

### 15.7 Fallback Behavior

- **Logo fallback:** Each `<img src="/openi-logo.png">` has an `onError` handler that hides the broken image and shows a gold Shield icon instead. Prevents "broken image" placeholders if the asset is ever missing.
- **Unauthenticated root (`/`):** `RootRoute` component in `App.jsx` renders `<Landing />`. If `user` is present from `AuthContext`, redirects to `/dashboard` instead — so signed-in users never see the landing page when navigating to the root.

### 15.8 Dependencies

No new dependencies were added. Uses existing packages only:
- `react-router-dom` v6.20.0 (Link, Navigate)
- `lucide-react` v0.294.0 (icons: ArrowRight, Shield, Users, Briefcase, Target, Network, Sparkles, Search, Calendar, MessageSquare, FileText, Award, Database, Zap, TrendingUp, CheckCircle2, Rocket, Building2, Landmark, GraduationCap, FlaskConical, Home, BookOpen)
- `tailwindcss` v3.3.6 (responsive grid utilities and spacing)

### 15.9 Future Enhancements

Ideas captured here for when they're needed:
- ~~Real social proof (partner logos, usage stats, testimonials)~~ ✅ Added in v2.5
- Blog/changelog section for content marketing and SEO
- Customer case studies for each persona type
- Video/animation in the hero showing the product in action
- SEO meta tags, Open Graph tags, and a sitemap
- Analytics integration (Google Analytics, Plausible, PostHog)
- A/B testing of hero headlines and CTA copy

---

## 16. Public Pages (v2.5)

Three new public pages accessible without authentication, designed to drive organic traffic and conversions.

### 16.1 Public Marketplace (`/marketplace`)

**File:** `src/pages/public/PublicMarketplace.jsx` (433 lines)
**Route:** `/marketplace` (public, no auth required)
**Backend:** `GET /api/public/challenges` + `GET /api/public/challenges/:id`

**Features:**
- Hero banner: "Explore Innovation Challenges"
- Search bar with full-text search across title, description, problem statement
- Sector and technology filter dropdowns (populated from API response)
- 12-card grid with: company logo, title, problem snippet, sector/tech tags, budget, deadline, applicant count
- Click card → full detail view with problem statement, description, requirements, FAQs accordion, taxonomy tags, meta cards
- "Register to Apply" CTA on detail view → redirects to `/register`
- Pagination (Previous/Next with page counter)
- Bottom CTA section: "Ready to Innovate?"
- Loading skeleton animation during fetch
- Empty state for no results

### 16.2 Startup Reports (`/reports`)

**File:** `src/pages/public/PublicReports.jsx` (303 lines)
**Route:** `/reports` (public, no auth required)
**Backend:** `GET /api/public/reports`

**Features:**
- Hero: "Curated Insights for Innovators"
- Sector filter pill buttons (All, DeepTech, AI/ML, Defence, CleanTech, HealthTech, Cybersecurity, Quantum, Semiconductor)
- Report cards with: sector-colored cover gradient, sector icon, status badge (Available/Coming Soon), title, description, date, author, page count
- Download button → register modal for unauthenticated users
- "Why OpenI Reports?" section (3 value prop cards: Platform Data, Expert Curated, Actionable Insights)
- Bottom CTA: "Want Full Access?"
- 8 hardcoded reports (CMS-ready structure)

### 16.3 PublicLayout Component

**File:** `src/components/PublicLayout.jsx` (186 lines)
**Used by:** PublicMarketplace, PublicReports

Shared layout wrapper for all public pages:
- **Header:** Logo, nav (Marketplace, Reports, How It Works, Features, Pricing) with active state highlighting, LinkedIn + X social icons, Sign In + Get Started buttons
- **Footer:** Logo with inverted filter, tagline, social links with gold hover, Product links (Marketplace, Reports, How It Works, Features, Pricing, Get Started), Company links (Sign In, Contact, Privacy, Terms), copyright

### 16.4 Public API Controller

**File:** `src/controllers/publicController.js` (131 lines, backend)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/public/challenges` | GET | List open public challenges with search, sector, technology, usecase filters + pagination. Returns challenges array + filter options (distinct sectors, technologies, usecases) |
| `/api/public/challenges/:id` | GET | Single challenge detail (limited fields, no RFI questions or internal data) |
| `/api/public/reports` | GET | Startup ecosystem reports with sector filter. Hardcoded data, CMS-ready |
| `/api/public/stats` | GET | Platform statistics (startup count, corporate count, challenge count, application count). Uses real DB counts with minimum thresholds |

All endpoints have **no authentication middleware** — fully public access.

### 16.5 CMS Migration Plan

All public page content is structured for easy CMS migration:

| Content Type | Current Location | CMS Type (Strapi) |
|---|---|---|
| Stats (landing) | `STATS` const array in Landing.jsx | Single type: `platform-stats` |
| Partners (landing) | `PARTNERS` const array in Landing.jsx | Collection type: `partner-logo` |
| Testimonials (landing) | `TESTIMONIALS` const array in Landing.jsx | Collection type: `testimonial` |
| FAQs (landing) | `FAQS` const array in Landing.jsx | Collection type: `faq` |
| Reports (reports page) | Hardcoded in publicController.js | Collection type: `report` |

**Migration steps (when Strapi is deployed):**
1. Deploy Strapi on Railway
2. Create content types matching the arrays above
3. Add `VITE_CMS_URL` env var to Vercel
4. Replace const arrays with `useEffect` + `fetch` calls, with const arrays as fallback

---

