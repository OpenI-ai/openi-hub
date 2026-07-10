# OpenI Hub - Project Documentation

## OpenI Assessment Platform

**Version:** 5.55

**Last Updated:** 10 Jul 2026 — Session 40 (per-application review permissions BE `77088ec` + review toggle/pitch helper text FE `5acefa6`). Full session-by-session history (sessions 1-40) archived verbatim in `DOCUMENTATION_ARCHIVE_part1.md` (split 10 Jul 2026, nothing deleted — straight cut at the legacy/living-doc boundary). See that file for the complete narrative changelog.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Multi-Persona System](#2-multi-persona-system)
3. [Architecture](#3-architecture)
4. [Technology Stack](#4-technology-stack)
5. [Getting Started](#5-getting-started)
6. [Frontend Modules](#6-frontend-modules)
7. [Backend API Reference](#7-backend-api-reference)
8. [Database Schema](#8-database-schema)
9. [Authentication & Authorization](#9-authentication--authorization)
10. [Security Features](#10-security-features)
11. [Licensing & Payments (Razorpay)](#11-licensing--payments-razorpay)
12. [Deployment](#12-deployment)
13. [Test Accounts](#13-test-accounts)
14. [Production Go-Live (openi.ai) — COMPLETE](#14-production-go-live-openiai--complete)
15. [Marketing Landing Page](#15-marketing-landing-page)
16. [Public Pages (v2.5)](#16-public-pages-v25)
17. [Multi-Persona V2 (`activeRole`, Phase 60.2–60.4)](#17-multi-persona-v2-activerole-phase-602604)
18. [Email Verification, Password Reset, Terms-of-Use Gate](#18-email-verification-password-reset-terms-of-use-gate)
19. [GST-Compliant Invoicing (OpenI Partners LLP)](#19-gst-compliant-invoicing-openi-partners-llp)

---

## 1. Project Overview

OpenI Hub is a **multi-persona open innovation platform** that connects the entire startup ecosystem. It divides stakeholders into **Innovation Providers** (startups, students, academia) and **Innovation Seekers** (corporates, government, investors, mentors, labs, incubators, accelerators), giving each persona a dedicated registration, profile, and navigation experience on a single platform.

The platform enables discovery, evaluation, incubation, and tracking of deep-tech startups across AI/ML, Cybersecurity, Quantum Technology, UAV Systems, Space Tech, and more.

### Key Capabilities

- **Multi-Persona Ecosystem** - 10 distinct persona types with self-service registration, dedicated profiles, and tailored navigation
- **Cross-Persona Communication** - All personas can message each other and (Phase 2) schedule meetings
- **Startup Discovery & Registration** - Browse, filter, and register defence-tech startups
- **8-Vector Evaluation Framework** - Score startups across 103 criteria in 8 vectors (People, Strategy, Revenue, Technology, Financials, Info Visibility, GRC, Step Change)
- **Pipeline Management** - Track startups through 7 stages: Application > Screening > Evaluation > Selection > Onboarding > Incubation > Graduation
- **Project & Task Management** - Track projects, milestones, budgets, and tasks per startup
- **Messaging System** - Real-time internal communications with conversation threading
- **IPR Database** - Track patents, trademarks, copyrights, and designs
- **Infrastructure Booking** - Reserve labs, test facilities, and HPC clusters
- **DeepTech Qualification** - Score startups on a 16-question deep-tech framework
- **Government API Integrations** - Connect to DPIIT, MCA, GST, UDYAM, MeitY, DigiLocker
- **Web Crawling** - Discover startups from government portals and incubators
- **Knowledge Base** - Articles, guides, policies, and training materials
- **Document Repository** - Centralised document storage with access controls
- **Watchlists** - Curated startup lists for tracking
- **Events Management** - Hackathons, workshops, demo days, conferences
- **Feedback System** - Collect and act on startup feedback with analytics
- **SME Management** - Subject matter expert directory and mentoring assignments
- **Cohort Management** - Manage incubation cohorts with startup membership
- **Audit Logging** - Track all write operations for compliance

---

## 2. Multi-Persona System

### Persona Categories

| Category | Personas | Description |
|----------|----------|-------------|
| **Innovation Providers** | Startup, Student, Academia | People/orgs with innovations to offer |
| **Innovation Seekers** | Corporate, Government, Investor, Mentor, Lab, Incubator, Accelerator | People/orgs looking for innovations |
| **Platform Admins** | Admin, Evaluator | Platform operators (not self-register) |

### Registration Flow

1. User visits `/landing` and selects their persona type
2. Redirected to `/register?type=<persona>` (e.g., `?type=investor`)
3. **Step 1:** Account setup (name, email, password, organization)
4. **Step 2:** Persona-specific profile fields (auto-generated from `personas.js` config)
5. **Step 3:** Success — redirected to dashboard or profile editor
6. Backend creates: user record + persona profile row + directory_profiles entry

### Persona Profile Tables

Each persona has a dedicated profile table with type-specific fields:

| Persona | Table | Key Fields |
|---------|-------|------------|
| Startup | `startup_profiles` | company_name, sector, stage, funding_raised, tech_readiness, technologies[] |
| Student | `student_profiles` | institution, degree, research_areas[], skills[], looking_for[] |
| Academia | `academia_profiles` | institution_name, institution_type, publications_count, offerings[] |
| Corporate | `corporate_profiles` | company_name, industry, company_size, innovation_areas[], looking_for[] |
| Government | `government_profiles` | body_name, body_type, focus_areas[], programs[] |
| Investor | `investor_profiles` | firm_name, investor_type, fund_size, ticket_size_min/max, focus_sectors[] |
| Mentor | `mentor_profiles` | designation, expertise[], years_experience, offering[], max_mentees |
| Lab | `lab_profiles` | lab_name, lab_type, equipment[], capabilities[], hourly_rate |
| Incubator | `incubator_profiles` | incubator_name, focus_sectors[], cohort_size, equity_taken, services[] |
| Accelerator | `accelerator_profiles` | accelerator_name, batch_size, demo_day, corporate_partners[] |

### Directory Profiles (Search Layer)

The `directory_profiles` table is a denormalized search layer that aggregates key fields from all persona profiles for fast cross-persona search. Updated automatically when a user saves their profile.

### Persona-Aware Navigation

Each persona type sees a different sidebar navigation. Configured in `src/config/personas.js` via the `PERSONA_NAV` object. Admin/evaluator users see the full legacy navigation (21 items).

### Profile Fields Configuration

All form fields for registration and profile editing are defined in `PROFILE_FIELDS` in `personas.js`. This drives both the Register page and MyProfile page dynamically, supporting field types: text, number, url, select, textarea, checkbox, tags (array), multiselect.

---

## 3. Architecture

```
Frontend (React + Vite)          Backend (Node.js + Express)        Database
========================         ============================       ==========
Vercel (auto-deploy)             Railway (auto-deploy)              Railway PostgreSQL

src/                             src/
  config/personas.js               startup.js (entry point)
  context/AuthContext.jsx          server.js (Express app)
  services/api.js (20 modules)    db/
  components/LoadingSkeleton         pool.js (pg connection)
  pages/auth/ (2 pages)             migrate.js (42+ tables)
  pages/dashboard/ (27 pages)        seed.js (demo data)
                                   middleware/
                                     auth.js (JWT + persona fields)
                                     audit.js (audit logging)
                                   controllers/ (20 controllers)
                                   routes/index.js (~58 endpoints)
```

### Data Flow

1. User logs in via Login page > AuthContext stores JWT in localStorage
2. Frontend pages call api.js modules > Bearer token attached to all requests
3. Backend middleware verifies JWT > Controller queries PostgreSQL > Returns JSON
4. Audit middleware logs write operations asynchronously

---

## 4. Technology Stack

### Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18.2.0 | UI framework |
| React Router | 6.20.0 | Client-side routing |
| Vite | 5.0.0 | Build tool & dev server |
| Tailwind CSS | 3.3.6 | Utility-first CSS |
| Lucide React | 0.294.0 | Icon library (200+ icons) |
| react-hot-toast | 2.6.0 | Toast notifications |

### Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| Node.js | 18+ | Runtime |
| Express | 5.2.1 | Web framework |
| PostgreSQL | 16 | Database |
| pg | 8.20.0 | PostgreSQL client |
| jsonwebtoken | 9.0.3 | JWT authentication |
| bcryptjs | 3.0.3 | Password hashing |
| helmet | 8.1.0 | Security headers |
| cors | 2.8.6 | Cross-origin resource sharing |
| express-rate-limit | 8.3.1 | Rate limiting |
| morgan | 1.10.1 | HTTP request logging |
| dotenv | 17.3.1 | Environment variables |

### Infrastructure

| Service | Purpose |
|---------|---------|
| Vercel | Frontend hosting (auto-deploy from GitHub) |
| Railway | Backend hosting + PostgreSQL database |
| GitHub | Source code (2 repositories) |

---

## 5. Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ (or Railway database)
- Git

### Frontend Setup

```bash
cd openi-hub
npm install
cp .env.example .env    # Set VITE_API_URL
npm run dev             # http://localhost:5173
```

### Backend Setup

```bash
cd openi-hub-backend
npm install
cp .env.example .env    # Set DATABASE_URL, JWT_SECRET, etc.
npm run db:migrate      # Create tables
npm run db:seed         # Load demo data
npm run dev             # http://localhost:5000
```

### Environment Variables

**Frontend (.env):**
```
VITE_API_URL=http://localhost:5000/api
```

**Backend (.env):**
```
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
CLIENT_URL=https://openi.ai
```

> ⚠️ **`CLIENT_URL` audit checklist** (8 May 2026 lesson learned): `CLIENT_URL` MUST match the canonical user-facing origin where users register. It is concatenated by `emailVerificationController.js`, `claimController.js`, and the password-reset flow into the user-clickable links inside outbound emails. If `CLIENT_URL` ever drifts from the registration origin (e.g. you change canonical domain or accidentally leave a preview hostname here), email-link landings will arrive on a different origin from registration, **localStorage will be partitioned per-origin**, and the Step 2 profile stash will silently fail to flush. Run `railway variables | grep CLIENT_URL` after any DNS / domain rename to confirm. Same applies to `VITE_API_URL` on Vercel for API origin.

---

## 6. Frontend Modules

### 5.1 Pages (26 total)

| # | Page | Route | Description |
|---|------|-------|-------------|
| 1 | Login | `/dashboard/login` | Email + password with MFA OTP |
| 2 | DashboardHome | `/dashboard` | Stats, charts, evaluations, quick actions |
| 3 | StartupDiscovery | `/dashboard/startups` | Browse & filter startups with scores |
| 4 | StartupProfile | `/dashboard/startup-profile/:id` | Full startup detail (9 tabs) |
| 5 | StartupPipeline | `/dashboard/pipeline` | Kanban view by pipeline stage |
| 6 | RegisterStartup | `/dashboard/register` | 6-step registration wizard |
| 7 | StartupWatchlist | `/dashboard/watchlist` | Curated startup lists |
| 8 | StartupEvaluation | `/dashboard/evaluate` | 8-vector scoring form (103 criteria) |
| 9 | Evaluations | `/dashboard/evaluations` | Program evaluations with stages |
| 10 | Cohorts | `/dashboard/cohorts` | Incubation cohort management |
| 11 | Mentors | `/dashboard/mentors` | Mentor directory & assignments |
| 12 | ProjectManagement | `/dashboard/projects` | Projects with tasks & milestones |
| 13 | Messaging | `/dashboard/messaging` | Real-time messaging (5s polling) |
| 14 | EventsRepository | `/dashboard/events` | Hackathons, workshops, conferences |
| 15 | StartupFeedback | `/dashboard/feedback` | Feedback with analytics & sentiment |
| 16 | SMEManagement | `/dashboard/sme` | Subject matter experts directory |
| 17 | StartupCrawling | `/dashboard/crawling` | Web crawler for startup discovery |
| 18 | IPRDatabase | `/dashboard/ipr` | Patents, trademarks, copyrights |
| 19 | Infrastructure | `/dashboard/infrastructure` | Labs & facility booking |
| 20 | Knowledge | `/dashboard/knowledge` | Articles, guides, policies |
| 21 | DocumentRepository | `/dashboard/documents` | File management with access control |
| 22 | DeepTechQualification | `/dashboard/deeptech` | 16-question DeepTech assessment |
| 23 | GovtAPIIntegrations | `/dashboard/govt-apis` | Government API connections |
| 24 | Settings | `/dashboard/settings` | Profile, password, notifications |
| 25 | DashboardLayout | (shell) | Sidebar, topbar, notification bell |
| 26 | LoadingSkeleton | (component) | Shimmer loading animation |

### 5.2 API Service Modules (19 total)

Located in `src/services/api.js`:

| Module | Methods |
|--------|---------|
| authAPI | login, me, changePassword, updateProfile |
| dashboardAPI | stats |
| startupAPI | list, get, create, update, delete, getEvaluations |
| evaluationAPI | list, create, update |
| cohortAPI | list, get, create, addStartup |
| mentorAPI | list, get, create, assign |
| projectAPI | list, get, create, update, createTask |
| messageAPI | listConversations, createConversation, getMessages, sendMessage |
| eventAPI | list, get, create, register |
| feedbackAPI | list, create, respond, analytics |
| smeAPI | list, get, create, update |
| iprAPI | list, get, create, update |
| infrastructureAPI | list, get, create, createBooking |
| knowledgeAPI | list, get, create, update |
| documentAPI | list, get, create, update, remove |
| watchlistAPI | list, get, create, remove, addStartup, removeStartup |
| deeptechAPI | list, get, create |
| govtIntegrationAPI | list, sync, logs |
| crawlAPI | stats, listSources, createSource, toggleSource, triggerCrawl, listStartups, getStartup, approveStartup, rejectStartup, listJobs |

### 5.3 Shared Components

| Component | Location | Purpose |
|-----------|----------|---------|
| LoadingSkeleton | `src/components/LoadingSkeleton.jsx` | Shimmer loading with card/table/list variants |
| AuthContext | `src/context/AuthContext.jsx` | Auth state, JWT persistence, MFA flow |

### 5.4 UI Features

- **Toast Notifications** - react-hot-toast on all 20 pages (error + success)
- **Loading Skeletons** - Gold shimmer animation replacing "Loading..." text
- **Role-Based Sidebar** - Admin sees 21 items, other roles see relevant subset
- **Notification Bell** - Dropdown with 6 notifications, unread count, mark-as-read
- **Responsive Design** - Mobile padding/gap fixes via CSS media query
- **Real-time Messaging** - 5s message polling, 15s conversation polling
- **Charts** - CSS donut chart (score dist.) + horizontal bar chart (sectors)
- **Quick Actions** - 4 action cards on dashboard linking to key pages

---

## 7. Backend API Reference

### 6.1 Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | Public | Login with email + password |
| GET | `/api/auth/me` | Bearer | Get current user |
| PUT | `/api/auth/change-password` | Bearer | Change password |
| PUT | `/api/auth/profile` | Bearer | Update name/avatar |

### 6.2 Dashboard

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/dashboard/stats` | Bearer | Platform statistics |

### 6.3 Startups

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/startups` | Bearer | List with filters (sector, stage, status, pipeline_stage, search) + pagination |
| POST | `/api/startups` | Bearer | Create startup |
| GET | `/api/startups/:id` | Bearer | Get startup detail |
| PUT | `/api/startups/:id` | Bearer | Update startup |
| DELETE | `/api/startups/:id` | Admin | Delete startup |
| GET | `/api/startups/:id/evaluations` | Bearer | Get startup's evaluations |

### 6.4 Evaluations

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/evaluations` | Bearer | List with filters + pagination |
| POST | `/api/evaluations` | Admin/Evaluator | Create evaluation |
| PUT | `/api/evaluations/:id` | Admin/Evaluator | Update evaluation |

### 6.5 Cohorts

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/cohorts` | Bearer | List all cohorts |
| POST | `/api/cohorts` | Admin | Create cohort |
| GET | `/api/cohorts/:id` | Bearer | Get cohort with startups |
| POST | `/api/cohorts/:id/startups` | Admin | Add startup to cohort |

### 6.6 Mentors

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/mentors` | Bearer | List mentors |
| POST | `/api/mentors` | Admin | Create mentor |
| GET | `/api/mentors/:id` | Bearer | Get mentor detail |
| POST | `/api/mentors/:id/assign` | Admin | Assign mentor to startup |

### 6.7 Projects

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/projects` | Bearer | List with task counts |
| POST | `/api/projects` | Bearer | Create project |
| GET | `/api/projects/:id` | Bearer | Get project with tasks |
| PUT | `/api/projects/:id` | Bearer | Update project |
| POST | `/api/projects/:id/tasks` | Bearer | Create task |

### 6.8 Messaging

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/conversations` | Bearer | List conversations with unread count |
| POST | `/api/conversations` | Bearer | Create conversation |
| GET | `/api/conversations/:id/messages` | Bearer | Get messages (marks as read) |
| POST | `/api/conversations/:id/messages` | Bearer | Send message |

### 6.9 Events

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/events` | Bearer | List with type/status filters + pagination |
| POST | `/api/events` | Admin | Create event |
| GET | `/api/events/:id` | Bearer | Get event detail |
| POST | `/api/events/:id/register` | Bearer | Register for event |

### 6.10 Feedback

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/feedback` | Bearer | List with filters + pagination |
| POST | `/api/feedback` | Bearer | Submit feedback (auto-calculates sentiment) |
| PUT | `/api/feedback/:id/respond` | Admin/Evaluator | Respond to feedback |
| GET | `/api/feedback/analytics` | Bearer | Aggregated analytics |

### 6.11 SME Experts

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/sme` | Bearer | List with filters + pagination |
| POST | `/api/sme` | Admin | Create expert |
| GET | `/api/sme/:id` | Bearer | Get expert detail |
| PUT | `/api/sme/:id` | Admin | Update expert |

### 6.12 Crawling

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/crawl/stats` | Bearer | Crawl statistics |
| GET | `/api/crawl/sources` | Bearer | List crawl sources |
| POST | `/api/crawl/sources` | Admin | Create source |
| PUT | `/api/crawl/sources/:id/toggle` | Admin | Toggle source active/paused |
| POST | `/api/crawl/sources/:id/trigger` | Bearer | Trigger crawl |
| GET | `/api/crawl/startups` | Bearer | List crawled startups |
| GET | `/api/crawl/startups/:id` | Bearer | Get crawled startup |
| PUT | `/api/crawl/startups/:id/approve` | Admin/Evaluator | Approve startup |
| PUT | `/api/crawl/startups/:id/reject` | Admin/Evaluator | Reject startup |
| GET | `/api/crawl/jobs` | Bearer | List crawl jobs |

### 6.13 IPR Records

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/ipr` | Bearer | List with filters + pagination |
| POST | `/api/ipr` | Admin | Create IPR record |
| GET | `/api/ipr/:id` | Bearer | Get record detail |
| PUT | `/api/ipr/:id` | Admin | Update record |

### 6.14 Infrastructure

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/infrastructure` | Bearer | List facilities |
| POST | `/api/infrastructure` | Admin | Create facility |
| GET | `/api/infrastructure/:id` | Bearer | Get facility with bookings |
| POST | `/api/infrastructure/:id/bookings` | Bearer | Create booking |

### 6.15 Knowledge Base

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/knowledge` | Bearer | List articles + pagination |
| POST | `/api/knowledge` | Admin | Create article |
| GET | `/api/knowledge/:id` | Bearer | Get article (increments views) |
| PUT | `/api/knowledge/:id` | Admin | Update article |

### 6.16 Documents

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/documents` | Bearer | List with filters + pagination |
| POST | `/api/documents` | Bearer | Create document |
| GET | `/api/documents/:id` | Bearer | Get document detail |
| PUT | `/api/documents/:id` | Bearer | Update document |
| DELETE | `/api/documents/:id` | Admin | Delete document |

### 6.17 Watchlists

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/watchlists` | Bearer | List with startup counts |
| POST | `/api/watchlists` | Bearer | Create watchlist |
| GET | `/api/watchlists/:id` | Bearer | Get watchlist with startups |
| DELETE | `/api/watchlists/:id` | Bearer | Delete watchlist |
| POST | `/api/watchlists/:id/startups` | Bearer | Add startup |
| DELETE | `/api/watchlists/:id/startups/:startupId` | Bearer | Remove startup |

### 6.18 DeepTech Assessments

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/deeptech` | Bearer | List assessments + pagination |
| POST | `/api/deeptech` | Bearer | Create assessment |
| GET | `/api/deeptech/:id` | Bearer | Get assessment detail |

### 6.19 Government API Integrations

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/integrations` | Bearer | List all integrations |
| POST | `/api/integrations/:id/sync` | Admin | Trigger manual sync |
| GET | `/api/integrations/logs` | Bearer | View sync logs |

### 6.20 Audit Logs

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/audit` | Admin | List audit logs with filters + pagination |

---

## 8. Database Schema

### 28 Tables

**Core:**
- `users` - Platform users (admin, evaluator, startup, mentor)
- `startups` - Registered startups with full profile data
- `evaluations` - 8-vector evaluation records with JSONB criteria

**Pipeline & Cohorts:**
- `cohorts` - Incubation cohorts
- `cohort_startups` - Many-to-many cohort membership

**Mentorship:**
- `mentors` - Mentor profiles with expertise arrays
- `mentor_assignments` - Mentor-startup assignments

**Projects:**
- `projects` - Projects with budget, progress, status
- `project_tasks` - Tasks within projects

**Communication:**
- `conversations` - Direct and group conversations
- `conversation_members` - Conversation membership
- `messages` - Chat messages with read status

**IPR:**
- `ipr_records` - Patents, trademarks, copyrights, designs

**Documents:**
- `documents` - Files with access control (public/internal/restricted)

**Watchlists:**
- `watchlists` - Named watchlists with visibility settings
- `watchlist_startups` - Watchlist membership

**Events:**
- `events` - Hackathons, workshops, conferences, webinars

**Experts:**
- `sme_experts` - Subject matter experts with domains array

**Feedback:**
- `feedback` - Startup feedback with sentiment and response

**Assessments:**
- `deeptech_assessments` - DeepTech qualification with JSONB answers
- `govt_api_logs` - Government API integration logs

**Infrastructure:**
- `infrastructure` - Labs, test facilities, HPC clusters
- `infrastructure_bookings` - Facility reservations

**Knowledge:**
- `knowledge_articles` - Articles, guides, policies

**Crawling:**
- `crawl_sources` - Web crawl source configurations
- `crawled_startups` - Discovered startups pending review
- `crawl_jobs` - Crawl job execution history

**Audit:**
- `audit_logs` - Write operation audit trail

---

## 9. Authentication & Authorization

### Authentication Flow

1. User submits email + password to `POST /api/auth/login`
2. Backend validates credentials, returns JWT + user object
3. Frontend triggers MFA step (demo OTP: `123456`)
4. On success, JWT stored in `localStorage` as `openi_token`
5. All subsequent API calls include `Authorization: Bearer <token>`
6. Token expires after 7 days (`JWT_EXPIRES_IN`)

### Role-Based Access Control

| Role | Description | Sidebar Items | Special Permissions |
|------|-------------|---------------|-------------------|
| `admin` | Platform administrator | All 21 items | Full CRUD on all entities |
| `evaluator` | Startup evaluator | 14 items | Create evaluations, respond to feedback |
| `startup` | Registered startup | 8 items | View own data, submit feedback |
| `mentor` | Assigned mentor | 9 items | View mentees, messaging |

### Sidebar Visibility by Role

- **All roles:** Overview, Startups, Messaging, Events, Knowledge, Documents
- **Admin only:** Register, Crawling, Infrastructure, Cohorts, Govt. APIs
- **Admin + Evaluator:** Evaluation, Programs, Pipeline, Projects, IPR, DeepTech, SME, Feedback
- **Admin + Evaluator + Mentor:** Mentors
- **Admin + Startup:** Watchlists

---

## 10. Security Features

| Feature | Implementation |
|---------|---------------|
| **Password Hashing** | bcryptjs with 10 salt rounds |
| **JWT Authentication** | RS256 tokens with 7-day expiry |
| **MFA** | OTP-based second factor (demo: 123456) |
| **Rate Limiting** | 500 req/15min (general), 20 req/15min (auth) |
| **CORS** | Restricted to Vercel + localhost origins |
| **Security Headers** | helmet.js (XSS, CSP, HSTS, etc.) |
| **Input Validation** | String length (500/5000), numeric ranges, required fields |
| **Parameterised Queries** | All SQL uses $N params (no injection) |
| **Audit Logging** | 10 write routes logged with user, action, IP |
| **Role-Based Access** | requireRole middleware on sensitive endpoints |

---

## 11. Licensing & Payments (Razorpay)

OpenI Hub uses a **3-tier freemium SaaS model** with Razorpay as the payment gateway for Indian customers (INR). Subscription management, payment capture, and usage gating are fully integrated end-to-end.

### 11.1 Plans

| Plan | Price (Monthly) | Price (Yearly) | Challenges | Applications | Meetings | File Uploads |
|------|-----------------|----------------|------------|--------------|----------|--------------|
| **Free** | INR 0 | INR 0 | 1 / month | 3 / month | 5 / month | 5 / month |
| **Pro** | INR 999 | INR 9,990 | 5 / month | 20 / month | 50 / month | 100 / month |
| **Enterprise** | INR 4,999 | INR 49,990 | Unlimited | Unlimited | Unlimited | Unlimited |

Limits are stored as JSONB in `subscription_plans.features`. A value of `-1` means unlimited. Limits reset at the start of each calendar month.

### 11.2 Database Tables

| Table | Purpose |
|-------|---------|
| `subscription_plans` | Plan catalog (name, display_name, price_monthly, price_yearly, currency, features JSONB) |
| `user_subscriptions` | Active and historical subscriptions per user (plan_id, status, billing_cycle, razorpay_subscription_id, period start/end) |
| `payment_history` | All payment attempts (razorpay_payment_id, razorpay_order_id, razorpay_signature, amount, status) |
| `usage_tracking` | Per-user per-feature monthly counter (user_id, feature, period, count) |
| `users.current_plan` | Column on users table storing the user's current plan name (default `free`) |

### 11.3 Backend API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/subscription/plans` | Bearer | List all active plans |
| GET | `/api/subscription/my-plan` | Bearer | Get current user's plan, subscription, usage, and payment history |
| POST | `/api/subscription/create-order` | Bearer | Create a Razorpay order for a plan upgrade |
| POST | `/api/subscription/verify-payment` | Bearer | Verify Razorpay HMAC-SHA256 signature and activate the subscription (transactional) |
| POST | `/api/subscription/cancel` | Bearer | Cancel active subscription and revert to Free plan |
| POST | `/api/subscription/webhook` | Signature | Razorpay webhook handler for `payment.captured` and `payment.failed` events |

### 11.4 Payment Flow

1. User clicks **Upgrade** on Settings → Billing tab
2. Frontend calls `POST /api/subscription/create-order` with `plan_id` and `billing_cycle`
3. Backend creates a Razorpay order via the Razorpay SDK (amount in paise), returns `order_id`, `amount`, `currency`, and the public `RAZORPAY_KEY_ID`
4. Frontend opens the Razorpay Checkout modal (`window.Razorpay`) with the order details
5. User completes payment in the modal
6. Razorpay returns `razorpay_payment_id`, `razorpay_order_id`, and `razorpay_signature` via the `handler` callback
7. Frontend calls `POST /api/subscription/verify-payment` with those three values
8. Backend verifies the HMAC-SHA256 signature using `RAZORPAY_KEY_SECRET`
9. On success, a database transaction: cancels any existing active subscription, inserts a new `user_subscriptions` row, records the payment in `payment_history`, and updates `users.current_plan`
10. Frontend refreshes the Billing tab and shows the new plan + updated usage meters

### 11.5 Usage Gating Middleware

`src/middleware/subscription.js` exports `checkUsageLimit(feature)` — an Express middleware factory that:

1. Reads the user's `current_plan` from JWT
2. Fetches the plan's `features` JSONB
3. Checks `usage_tracking` for the current month
4. If `currentUsage >= limit`, returns **403** with `{ message, feature, limit, used, plan, upgrade_url }`
5. Otherwise increments the counter via an upsert and calls `next()`
6. Fails open on errors so transient DB issues don't block users

**Gated routes:**
- `POST /api/challenges` — `checkUsageLimit('challenge_create')`
- `POST /api/challenges/:id/apply` — `checkUsageLimit('application_submit')`
- `POST /api/meetings` — `checkUsageLimit('meeting_create')`
- `POST /api/upload` — `checkUsageLimit('file_upload')`

### 11.6 Test Mode (Fallback)

If `RAZORPAY_KEY_ID` or `RAZORPAY_KEY_SECRET` is missing from the environment, the backend lazily skips Razorpay SDK init and returns a fake `order_test_<timestamp>` order. The frontend detects `test_mode: true` and simulates a successful payment by calling verify-payment with placeholder values. This allowed the entire flow (including DB writes) to be built and tested before real keys were issued.

### 11.7 Environment Variables (Backend)

```
RAZORPAY_KEY_ID=rzp_test_xxx        # or rzp_live_xxx for production
RAZORPAY_KEY_SECRET=xxx              # never exposed to frontend
RAZORPAY_WEBHOOK_SECRET=xxx          # optional — for webhook signature verification
```

The public `RAZORPAY_KEY_ID` is returned to the frontend via `create-order` response (never hardcoded).

### 11.8 Frontend Integration

| File | Purpose |
|------|---------|
| `index.html` | Loads Razorpay Checkout SDK: `<script src="https://checkout.razorpay.com/v1/checkout.js"></script>` |
| `src/services/api.js` | `subscriptionAPI` wrapper with `getPlans`, `getMyPlan`, `createOrder`, `verifyPayment`, `cancel` |
| `src/pages/dashboard/Settings.jsx` | Billing tab with plan comparison, usage meters, upgrade/cancel buttons, Razorpay checkout handler |

### 11.9 Webhook Reconciliation (Optional)

The webhook endpoint at `POST /api/subscription/webhook` handles:
- `payment.captured` — logs the event for reconciliation (payment already activated via verify-payment)
- `payment.failed` — marks the corresponding `payment_history` row as `failed`

To enable webhooks, add the endpoint URL in the Razorpay dashboard (Settings → Webhooks) with events `payment.captured` and `payment.failed`, then set `RAZORPAY_WEBHOOK_SECRET` on Railway.

---

## 12. Deployment

### Frontend (Vercel)

- **Project:** openi-hub
- **GitHub:** RajeevBanduni/openi-hub (public)
- **Auto-deploy:** On push to `main` branch
- **Build Command:** `npm run build`
- **Output:** `dist/`
- **Deploy manually:** `cd openi-hub && npx vercel --prod --yes`

### Backend (Railway)

- **Project:** capable-energy
- **GitHub:** RajeevBanduni/openi-hub-backend (private)
- **Auto-deploy:** On push to `main` branch
- **Entry Point:** `src/startup.js` (runs migrate + seed, then starts server)

### Database (Railway PostgreSQL)

- **Auto-migration:** Runs on every deploy via `startup.js`
- **Seed Data:** 10 startups, 5 projects, 10 tasks, 6 evaluations, 7 messages, 5 feedback, 7 IPR records, 6 infrastructure, 10 documents, 3 watchlists, 4 assessments, 4 knowledge articles, 8 crawl sources, 8 crawled startups, 5 crawl jobs

---

## 13. Test Accounts

### Legacy Accounts (MFA OTP: 123456)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@drdo.gov.in | Admin@123 |
| Evaluator | ananya@drdo.gov.in | Eval@123 |
| Startup | contact@armortech.in | Start@123 |
| Mentor | suresh@iitd.ac.in | Mentor@123 |

### Multi-Persona V2 Demo Accounts (all password: Demo@123)

All `*@demo.openi.ai` accounts skip MFA via the `mfa_bypass_login` short-circuit in the auth flow (no OTP needed). 11 personas total as of v2.6:

| Persona | Email | Notes |
|---------|-------|-------|
| Startup | startup@demo.openi.ai | Innovation Provider |
| Student | student@demo.openi.ai | Innovation Provider |
| Academia | academia@demo.openi.ai | Innovation Provider |
| Corporate | corporate@demo.openi.ai | Innovation Seeker |
| Government | govt@demo.openi.ai | Innovation Seeker |
| Investor | investor@demo.openi.ai | Innovation Seeker |
| Lab | lab@demo.openi.ai | Innovation Seeker |
| Incubator | incubator@demo.openi.ai | Innovation Seeker |
| Accelerator | accelerator@demo.openi.ai | Innovation Seeker |
| **Service Provider** | serviceprovider@demo.openi.ai | New in v2.6 |
| **Mentor** | mentor@demo.openi.ai | New in v2.6 (V2 mentor flow with persona category) |

The quick-login demo panel on `/dashboard/login` is gated by `?demo=1` to keep the legacy admin/evaluator credentials out of public exposure while preserving testing convenience. Source: `DEMO_ACCOUNTS` const in `src/pages/dashboard/Login.jsx`.

### Razorpay Test Cards (for Pro/Enterprise upgrade testing)

| Card Number | Type | CVV | Expiry |
|-------------|------|-----|--------|
| 4111 1111 1111 1111 | Visa (Success) | any 3 digits | any future date |
| 5267 3181 8797 5449 | Mastercard (Success) | any 3 digits | any future date |
| 4000 0000 0000 0002 | Card declined | any 3 digits | any future date |

For UPI test mode, use `success@razorpay` (success) or `failure@razorpay` (failure).

---

## 14. Production Go-Live (openi.ai) — COMPLETE

**Status (6 May 2026):** ✅ Production cutover from `openi.tech` to `openi.ai` is complete. All three production hostnames are LIVE with valid SSL. The `.tech` domain is preserved as **perpetual staging** — both stacks point at the same Railway PostgreSQL, but new traffic and marketing URLs go to `.ai`. The original step-by-step go-live playbook is preserved in §14.3–14.11 below for reference and for future cutovers.

### 14.1 Current Production Architecture

```
Users
  │
  ▼
https://openi.ai                ← Vercel (openi-hub frontend, production)
https://www.openi.ai            ← Vercel (apex 308 → www, both serve)
https://app.openi.ai            ← Vercel (reserved, in allowedOrigins)
  │
  │ API calls (VITE_API_URL = https://api.openi.ai/api)
  ▼
https://api.openi.ai            ← Railway (openi-hub-backend, SSL provisioned)
  │
  ▼
Railway PostgreSQL              ← shared with .tech staging stack

Staging on the same backend instance:
  https://openi.tech / www.openi.tech / app.openi.tech / api (legacy URL)
```

### 14.0 Production Hostname Reference

| Hostname | Resolves to | Role |
|---|---|---|
| `openi.ai` | `216.198.79.1` (Vercel apex) | Production apex (308 → www) |
| `www.openi.ai` | `4d8d9078365453ff.vercel-dns-017.com` | Production frontend |
| `app.openi.ai` | Vercel | Reserved (in CORS allowlist) |
| `api.openi.ai` | `2eugdac7.up.railway.app` | Production backend |
| `openi.tech` / `www.openi.tech` / `app.openi.tech` | Vercel | Perpetual staging |
| `openi-hub.vercel.app` | Vercel | Preview-deploy fallback |

### 14.2 Pre-Work Completed

| Item | Status |
|---|---|
| Razorpay integration end-to-end (test mode) | Done |
| Razorpay checkout.js SDK loaded in `index.html` | Done |
| Backend `CORS` whitelist updated to include `openi.tech`, `www.openi.tech` in `src/server.js` | Done (local only, not yet committed) |
| Backend package renamed `drdo-hub-backend` → `openi-hub-backend` | Done + pushed |
| Documentation migrated to version control (repo `DOCUMENTATION.md`) | Done |

### 14.3 Execution Steps

| # | Step | Owner | Platform | Est. Time |
|---|------|-------|----------|-----------|
| 1 | Add `openi.tech` and `www.openi.tech` as custom domains | User | Vercel | 5 min |
| 2 | Add `api.openi.tech` as custom domain | User (Claude can navigate) | Railway | 3 min |
| 3 | Configure DNS records (A + CNAME × 2) | User | GoDaddy | 5 min |
| 4 | Wait for DNS propagation + automatic SSL provisioning | Automatic | Vercel + Railway | 5–30 min |
| 5 | Update `VITE_API_URL=https://api.openi.tech/api` | User (Claude can guide) | Vercel | 2 min |
| 6 | Update `CLIENT_URL=https://openi.tech` | User (Claude can navigate) | Railway | 2 min |
| 7 | Commit + push CORS whitelist update | Claude | GitHub | 2 min |
| 8 | Submit Razorpay KYC (in parallel with 1–4) | User | Razorpay | 10 min + 1–3 day review |
| 9 | After KYC approval: generate `rzp_live_xxx` keys | User | Razorpay | 5 min |
| 10 | Update `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` to live values | User (Claude can navigate) | Railway | 2 min |
| 11 | Configure Razorpay webhook → `https://api.openi.tech/api/subscription/webhook` | User | Razorpay | 5 min |
| 12 | Add `RAZORPAY_WEBHOOK_SECRET` to Railway | User | Railway | 2 min |
| 13 | Wait for Vercel + Railway redeploys (automatic on env var change) | Automatic | Both | 2–5 min |
| 14 | End-to-end smoke test: register → login → upgrade to Pro → real payment | Claude + User | Live site | 10 min |
| 15 | Update this documentation with final URLs | Claude | GitHub | 3 min |

### 14.4 DNS Records for GoDaddy

Once Vercel and Railway have been added, the following records go into **GoDaddy → My Products → openi.tech → DNS**:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | `@` | `76.76.21.21` (confirm from Vercel) | 600 |
| CNAME | `www` | `cname.vercel-dns.com` | 600 |
| CNAME | `api` | `<Railway CNAME target>` (e.g. `xyz.up.railway.app`) | 600 |

**Important:** Delete any existing GoDaddy default/parked A records for `@` or `www`. Leave all NS records untouched — do not change nameservers.

Verification commands (run locally after propagation):
```bash
dig openi.tech +short
dig www.openi.tech +short
dig api.openi.tech +short
curl -sI https://openi.tech | head -5
curl -sI https://api.openi.tech/health | head -5
```

### 14.5 Environment Variables — Before vs After

**Vercel (frontend):**

| Variable | Before | After |
|----------|--------|-------|
| `VITE_API_URL` | `https://openi-hub-production.up.railway.app/api` | `https://api.openi.tech/api` |

**Railway (backend):**

| Variable | Before | After |
|----------|--------|-------|
| `CLIENT_URL` | `https://openi-hub.vercel.app` | `https://openi.tech` |
| `RAZORPAY_KEY_ID` | `rzp_test_xxx` | `rzp_live_xxx` (after KYC) |
| `RAZORPAY_KEY_SECRET` | test secret | live secret (after KYC) |
| `RAZORPAY_WEBHOOK_SECRET` | *(not set)* | new secret from Razorpay webhook config |

### 14.6 CORS Whitelist Update

`src/server.js` has been updated locally (not yet committed) to include:

```javascript
const allowedOrigins = [
  // Production custom domain
  'https://openi.tech',
  'https://www.openi.tech',
  // Vercel fallback (kept for transition + preview deploys)
  'https://openi-hub.vercel.app',
  // Local dev
  'http://localhost:3000',
  'http://localhost:5173',
];
if (process.env.CLIENT_URL && !allowedOrigins.includes(process.env.CLIENT_URL)) {
  allowedOrigins.push(process.env.CLIENT_URL);
}
```

Commit message ready: *"Add openi.tech custom domain to CORS whitelist"*

### 14.7 Razorpay KYC Requirements

Submit at https://dashboard.razorpay.com → **Account & Settings → KYC**. Required documents:

| Document | Purpose |
|----------|---------|
| PAN card | Business or personal PAN (business PAN preferred for companies) |
| Business proof | One of: GST certificate, Shop & Establishment license, Certificate of Incorporation, Partnership deed |
| Bank account details | Current account strongly preferred; savings account accepted for sole proprietors |
| Authorized signatory ID | Aadhaar, passport, or driving license of the person signing |
| Address proof | Recent utility bill, rental agreement, or bank statement |

**Review time:** 1–3 business days typically. Razorpay will email on approval. After approval, the "Live Mode" toggle becomes available in the dashboard and API Keys page.

**Test vs Live keys:**
- Test keys start with `rzp_test_` — safe, no real money moves
- Live keys start with `rzp_live_` — real transactions, real money
- Keys are shown **once** at generation — save them immediately in a password manager

### 14.8 Razorpay Webhook Configuration

Once live keys are active:

1. Razorpay dashboard → **Settings → Webhooks → Add New Webhook**
2. URL: `https://api.openi.tech/api/subscription/webhook`
3. Alert email: your admin email
4. Secret: auto-generate or provide one — **save it**
5. Events to subscribe to:
   - `payment.captured` (reconciliation confirmation)
   - `payment.failed` (mark payment_history as failed)
   - `subscription.charged` (optional, for recurring billing)
   - `subscription.cancelled` (optional)
6. Click **Create Webhook**
7. Add the secret to Railway as `RAZORPAY_WEBHOOK_SECRET`

Backend webhook handler at `src/controllers/subscriptionController.js` already verifies HMAC-SHA256 signatures when `RAZORPAY_WEBHOOK_SECRET` is set.

### 14.9 Smoke Test Checklist (Post Go-Live)

Run through these on the live domain `https://openi.tech`:

- [ ] Landing page loads at `https://openi.tech`
- [ ] `www.openi.tech` redirects to `openi.tech` (308)
- [ ] SSL padlock green on all three domains (apex, www, api)
- [ ] Registration flow: pick persona → fill form → account created
- [ ] Login with demo account (`startup@demo.openi.ai` / `Demo@123`)
- [ ] MFA OTP (123456) accepted, dashboard loads
- [ ] API calls visible in browser dev tools hit `api.openi.tech` (not the old Railway URL)
- [ ] CORS: no errors in console
- [ ] Settings → Billing tab loads with current plan + usage meters
- [ ] Click Upgrade on Pro — Razorpay **live** checkout modal opens (not test mode)
- [ ] Complete a small real payment with a personal card (INR 999)
- [ ] Verify `users.current_plan = 'pro'` in DB
- [ ] Verify new row in `payment_history` with real Razorpay IDs (not `pay_test_*`)
- [ ] Razorpay dashboard shows the captured payment
- [ ] **Refund the test payment** from Razorpay dashboard (Payments → refund)
- [ ] Webhook log shows `payment.captured` event received and processed
- [ ] Downgrade/cancel flow works and reverts to Free plan

### 14.10 Rollback Plan

If anything goes wrong on the live domain:

1. **DNS rollback (fastest)** — In GoDaddy, delete the A/CNAME records for `openi.tech`. Users will fall back to the error page; nothing is broken, just inaccessible on the custom domain.
2. **Frontend rollback** — In Vercel, remove the custom domain. Users can still access `https://openi-hub.vercel.app` as before.
3. **Env var rollback** — In Vercel, change `VITE_API_URL` back to the Railway URL; in Railway, change `CLIENT_URL` back to the Vercel URL. Both platforms auto-redeploy on env var change.
4. **Razorpay rollback** — Switch `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` back to test keys on Railway. Existing captured payments are not affected, but no new real payments will be processed.
5. **Code rollback** — `git revert` the CORS commit if needed.

No database changes are involved in the go-live — the same Railway Postgres instance serves both old and new URLs. Rollback is fully reversible.

### 14.11 Resume Points

If this session pauses and resumes later, here's the state at each phase:

- **Phase A (DNS):** Check if `dig openi.tech` resolves. If yes, DNS is propagated. If no, wait longer.
- **Phase B (SSL):** Check `curl -sI https://openi.tech`. If 200, SSL is provisioned. If SSL errors, wait 5 more minutes.
- **Phase C (Env vars):** Check Vercel + Railway env var values directly in dashboards.
- **Phase D (Razorpay KYC):** Check Razorpay dashboard → Settings → KYC for status.
- **Phase E (Go-live):** Run smoke test checklist 14.9.

---

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

## 17. Multi-Persona V2 (`activeRole`, Phase 60.2–60.4)

OpenI Hub originally bound a user to a single persona. v2.6 generalises this so one account can hold **multiple persona roles** and switch between them. The platform behaviour (sidebar, dashboard, redirects, billing limits) is driven by the user's **`activeRole`** rather than a single legacy `role` field.

### 17.1 Roles Schema

| Table / Column | Purpose |
|---|---|
| `user_roles` (user_id, role, is_primary, added_at) | One row per role a user holds. Exactly one is `is_primary=TRUE`. |
| `users.persona_category` | Cached "provider" / "seeker" category for the primary role |
| `users.profile_completed` | Whether Step 2 of registration is done for the primary persona |
| `users.onboarding_step` | Onboarding progress counter |

`SELF_REGISTER_ROLES` (defined in `authController.js`) is the allow-list of roles a user can self-add — admin/evaluator are excluded.

### 17.2 Role Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/auth/roles` | Lists current user's roles + `available_to_add` (the SELF_REGISTER_ROLES they don't yet hold) |
| `POST` | `/api/auth/roles/add` | Adds a `user_roles` row (`is_primary=FALSE`) + creates an empty persona profile in the role's profile table + sends a welcome email. Body: `{ role, profile? }`. |
| `POST` | `/api/auth/roles/set-primary` | Flips `is_primary` flags so the named role becomes primary. |
| `POST` | `/api/auth/roles/remove` | Removes a role; refused if it's the user's only role. If the removed role was primary, the oldest remaining role auto-becomes primary. |

### 17.3 `activeRole` Resolution

On every authenticated request, `middleware/auth.js` resolves the user's roles via subquery on `user_roles` and exposes them on `req.user.roles[]` with `is_primary` flags. The active role used for billing, sidebar, and persona-aware queries is stored client-side and sent through the request layer; backend controllers (`subscriptionController`, `personaDashboardController`, `profileController`, `enrichController`, `onboardingController`, `challengeApplyController`, `portfolioEvalsController`, `programPartnersController`, `profileViewController`, `claimController`) consume it.

### 17.4 Per-Role Billing (Phase 60.4a)

`user_subscriptions` rows now include the `role` column so a user with multiple personas gets independent billing limits per role. This means a user can have a Pro plan as Mentor while remaining Free as Investor. The `checkUsageLimit` middleware (`middleware/subscription.js`) keys on `(user_id, role, feature, period)`.

### 17.5 Frontend Behaviour

- **Login / restore:** `roles[]` is refreshed from `/auth/me` on session restore so newly added roles show up across tabs.
- **Add role:** After `POST /roles/add` succeeds, the local cache is refreshed and the new tab appears in the role switcher.
- **Active role honoured everywhere:** Dashboard role-based redirects use `activeRole`, not legacy `user.role` (commit `53c5041`).

---

## 18. Email Verification, Password Reset, Terms-of-Use Gate

### 18.1 Email Verification (s49e)

| Schema | Description |
|---|---|
| `users.email_verified_at TIMESTAMPTZ NULL` | Set when a user successfully verifies via link or OTP |
| `email_verifications` | Pending verification rows: `(id, user_id, code, token_hash, purpose, expires_at, consumed_at)` |
| `idx_email_verifications_user_id_active` | Partial index on un-consumed rows for the active lookup |
| `idx_email_verifications_token_hash` | Lookup index for magic-link tokens |

Two co-equal verification paths:

1. **Magic link:** `https://openi.ai/verify-email?token=<long-token>` — token is hashed in DB; on click, frontend POSTs the token, backend verifies + marks consumed.
2. **OTP:** A 6-digit code displayed in the email body; user pastes into the verify page and submits. Same row, different surface.

**Gmail link-prefetch defeat:**
- The verify landing page requires an explicit button click (no auto-verify on page load) — Gmail's bot-prefetch hits the page but doesn't click.
- Cross-tab `localStorage` sync: when a user verifies in tab B, tab A picks up the success and continues the registration flow.
- Step 2 profile data is stashed in `localStorage` (not just React state) so it survives Gmail's "open in new tab" behaviour where the original tab is replaced.

**Gated actions:** Four sensitive actions return `EMAIL_NOT_VERIFIED` from the API if the user hasn't verified, and the frontend redirects to `/verify-email?email=<addr>`. Backend re-issues a fresh code on the redirect so the user always gets a working OTP.

### 18.2 Password Reset

Same email-token mechanism, with `purpose='password_reset'` on the `email_verifications` row. User clicks link → enters new password → row is consumed and the password is bcrypted.

### 18.3 Terms of Use Gate (Phase 60.7)

| Field | Purpose |
|---|---|
| `users.terms_version_accepted` | The `TERMS_VERSION` string the user has accepted |
| `TERMS_VERSION` constant | Currently `'1.1'` (bumped with the partners refresh) |

`POST /api/auth/register` requires `terms_accepted: true` in the body (returns 400 otherwise). When `TERMS_VERSION` is bumped, users with stale `terms_version_accepted` are routed to a re-accept gate before they can use gated actions.

---

## 19. GST-Compliant Invoicing (OpenI Partners LLP)

OpenI Hub issues **real Indian GST tax invoices** for paid subscriptions. Generated as PDFs (PDFKit) and auto-attached to subscription receipt emails. Phase 60.11 (v2.7) makes the system fully compliant with Indian GST law: sequential gap-free numbering, mandatory billing address, and zero-rated export under LUT.

### 19.1 Legal Entity

| Field | Value |
|---|---|
| Legal name | OpenI Partners LLP |
| Place of business | Maharashtra, India |
| GSTIN | `27AAIFO6836A1ZA` (in `services/pdfService.js` `COMPANY` constant) |
| PAN / CIN | `AAIFO6836A` / `ACD-1299` |
| HSN/SAC | `9983` (Other professional, technical and business services) |
| GST rate | 18% (standard SaaS rate) |

GST treatment by customer location:
- **Intrastate** (customer state code `27` = Maharashtra) → **CGST 9% + SGST 9%**
- **Interstate** (any other Indian state) → **IGST 18%**
- **Export** (country ≠ India) → **IGST 0%** + LUT declaration (zero-rated under CGST Rule 96A)

### 19.2 Schema (Phase 60.11)

```sql
-- Canonical billing address per (user, role). Multi-persona users can hold
-- separate billing entities for separate subscriptions.
CREATE TABLE billing_addresses (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role            VARCHAR(40) NOT NULL,
  legal_name      VARCHAR(300) NOT NULL,
  line1           VARCHAR(300) NOT NULL,
  line2           VARCHAR(300),
  city            VARCHAR(100) NOT NULL,
  state           VARCHAR(100) NOT NULL,
  state_code      VARCHAR(2),                -- NULL outside India
  country         VARCHAR(100) NOT NULL DEFAULT 'India',
  postal_code     VARCHAR(20) NOT NULL,
  gstin           VARCHAR(20),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, role)
);

-- Per-fiscal-year invoice sequence counter. INSERT ON CONFLICT DO UPDATE
-- under pg_advisory_xact_lock for atomic, gap-free increment.
CREATE TABLE invoice_sequences (
  fiscal_year     VARCHAR(7) PRIMARY KEY,    -- 'FY25-26'
  last_number     INTEGER NOT NULL DEFAULT 0,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Audit-grade frozen snapshot at invoice time. Editing the live
-- billing_addresses row never mutates historical invoices.
ALTER TABLE payment_history ADD COLUMN invoice_number VARCHAR(40);
ALTER TABLE payment_history ADD COLUMN billing_address_snapshot JSONB;
ALTER TABLE payment_history ADD COLUMN gst_breakdown JSONB;             -- closed v2.6 schema drift
ALTER TABLE payment_history ADD COLUMN is_legacy_inclusive BOOLEAN;     -- closed v2.6 schema drift
CREATE UNIQUE INDEX idx_payment_history_invoice_number
  ON payment_history(invoice_number) WHERE invoice_number IS NOT NULL;
```

### 19.3 Invoice Number Generation

**File:** `src/services/invoiceNumberService.js`

```js
const { invoice_number, fiscal_year, sequence } = await nextInvoiceNumber(client, supplyDate);
// → { invoice_number: 'OPENI/FY25-26/0001', fiscal_year: 'FY25-26', sequence: 1 }
```

- `computeFiscalYear(date)` returns `FYxx-yy` for the Indian fiscal year (Apr–Mar) of the given date
- `pg_advisory_xact_lock(hashFiscalYearForLock(fy))` serialises concurrent callers on the same FY counter for the duration of the open transaction
- The lock auto-releases on `COMMIT` or `ROLLBACK` so a failed verifyPayment doesn't burn an invoice number
- Format: `OPENI/{FYxx-yy}/{NNNN}` (4-digit zero-padded sequence, resets each fiscal year)

**MUST be called inside an open transaction** (`client.query('BEGIN')`). Currently invoked in `subscriptionController.verifyPayment` after Razorpay signature verification succeeds.

### 19.4 Indian States Map

**File:** `src/services/indianStates.js`

Canonical map of all 36 Indian states + UTs to their 2-digit GST state codes (e.g., Maharashtra → 27, Karnataka → 29, Delhi → 07). Includes common aliases (e.g., `pondicherry` → 34, `orissa` → 21). Single source of truth across:
- `billingAddressController` — server-side validation rejects unknown states
- `subscriptionController` — derives intra/inter-state classification for GST math
- `pdfService` — Place of Supply line on the invoice

`resolveStateCode(name)` and `listStates()` exported.

### 19.5 Billing Address Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/billing-address` | Bearer | Current user's billing address for active role; `404 BILLING_ADDRESS_NOT_FOUND` if none |
| `PUT` | `/api/billing-address` | Bearer | Upsert. Validates: legal_name/line1/city/state/country/postal_code required; Indian pincode regex `^[1-9][0-9]{5}$`; GSTIN regex `^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$`; state_code resolved server-side from `indianStates.js` |

### 19.6 Checkout Hard Gate

`subscriptionController.createOrder` calls `fetchBillingAddress(userId, role)`. If no row or any mandatory field empty:
```json
{
  "code": "BILLING_ADDRESS_REQUIRED",
  "message": "Billing address required. Please save your billing details before checkout."
}
```
HTTP 400. Razorpay order is never created. `verifyPayment` repeats the same check defensively (in case a malicious or stale client bypasses `createOrder`).

### 19.7 Invoice Generator

**File:** `src/services/pdfService.js`

`generateInvoicePdf(data)` renders a one-page A4 PDF. Validates the four mandatory fields up-front (`user_name`, `customer_address` or `customer_line1`, `customer_state_name`, `customer_country`) and **throws** `Error('Invoice missing required billing fields')` if absent — no silent blank invoices.

Layout:
- **Header bar** (dark, gold logo + `openi.ai` URL)
- **Title block** (TAX INVOICE) + meta block (Invoice Number, Invoice Date, Place of Supply)
- **FROM** (supplier) and **BILL TO** (recipient) two-column blocks. BILL TO renders structured snapshot fields: legal_name, contact (if differs), email, line1, optional line2, `city, state (code), postal_code`, country, optional GSTIN
- **Line item table** — Description (210px) | HSN/SAC (60px) | Qty (40px) | Rate (90px) | Amount (95px)
- **Tax summary** — Taxable Value, then either `CGST @ 9% + SGST @ 9%` (intrastate), `IGST @ 18%` (interstate), or `IGST @ 0% (Export under LUT)` (export). Right-aligned with consistent 6 px gutter inside the gold TOTAL rectangle (Phase 60.11 clipping fix)
- **Grand TOTAL** in gold rectangle + **Total in words** (Indian-English, paise included for non-whole amounts)
- **Mandatory declaration** — domestic: `Tax payable on reverse charge: No`; export: `Supply meant for export under Letter of Undertaking (LUT) without payment of integrated tax. (LUT ARN: <if LUT_ARN env var set>)`
- **Payment Details** — Razorpay payment ID, order ID, status, date, method
- **Footer** — copyright, `openi.ai`, page number

### 19.8 GST Math (`computeGstBreakdown`)

```js
computeGstBreakdown(amount, customerStateCode, opts)
// opts: { isLegacyInclusive?: bool, isExport?: bool }
// returns: { taxable, cgst, sgst, igst, total, isIntraState, isExport, gstRate }
```

Three branches:
- `isExport=true` → `taxable=amount, cgst=sgst=igst=0, total=amount, gstRate=0`
- `isLegacyInclusive=true` → amount IS the total; back-compute base + tax
- Default → amount IS the base; total = base + 18% GST split appropriately

### 19.9 Audit-Grade Snapshot

Inside `verifyPayment`'s transaction:
1. `nextInvoiceNumber(client)` → mints `OPENI/FYxx-yy/NNNN`
2. JSONB billing snapshot built from the live `billing_addresses` row
3. `INSERT INTO payment_history (..., invoice_number, billing_address_snapshot) VALUES (..., $9, $10)`
4. `COMMIT`

`downloadInvoice` reads `payment_history.billing_address_snapshot` for the historical address — **never** the live `billing_addresses` row. Editing your address later only affects future invoices; old invoices reproduce identically.

Legacy `payment_history` rows from before Phase 60.11 still produce a downloadable PDF: filename `OpenI-Invoice-LEGACY-<id>.pdf`, invoice meta `INV-LEGACY-<payment_id>`, address synthesised from persona profile (`fetchCustomerBillingDetails` fallback).

### 19.10 Frontend / UX

- **`components/BillingAddressModal.jsx`** — 7-field modal. **Country, State, City all dropdowns**. Reuses `StateField` + `CityField` (Phase 60.10). Country defaults to India. Non-India hides GSTIN and shows the export-under-LUT notice. Client-side validation mirrors backend.
- **`pages/dashboard/Settings.jsx`** —
  - `handleUpgrade` first calls `billingAddressAPI.get()`; if missing/404, opens the modal and remembers the pending plan in `pendingUpgrade` state. After save, automatically resumes the upgrade flow.
  - Defence-in-depth: `runUpgrade` catches `BILLING_ADDRESS_REQUIRED` from the backend and re-opens the modal.
  - New "Billing Details" card on the Billing tab showing the saved address with an Edit button. International rows show the LUT notice inline.
- **Pricing cards** show `+ 18% GST · total` annotation (commit `72cb519`)
- **Settings → Billing → Payment History** has a discoverable **Download Invoice** button per row (commit `2210b10`)

### 19.11 Email Delivery

GST invoice PDF is buffered in-memory and auto-attached to `paymentConfirmationEmail` (in `services/emailService.js`). Filename derived from the canonical invoice number, e.g. `OpenI-Invoice-OPENI-FY26-27-0001.pdf`. Fire-and-forget; if the email send fails, the invoice number stays committed and the user can still download from the Billing tab.

### 19.12 Production Validation

The first GST-compliant invoice issued to a real customer was `OPENI/FY26-27/0001` (Vanessa Banduni, corporate persona, Bengaluru → IGST 18% interstate, Rs. 2,499.00 total). Verified line-by-line against GST Tax Invoice Rules. Re-rendered after the TOTAL row clipping fix landed, audit clean.

### 19.13 Optional Configuration

- `LUT_ARN` env var on Railway — when set, appended to the export declaration (e.g., "(LUT ARN: AD2706240000123)"). Optional; declaration renders without it.

### 19.14 Out of Scope

- **E-invoice (IRN) generation** — required only when aggregate turnover crosses the GSTN-mandated threshold (₹5 Cr). Will be a separate phase.
- **Multi-rate GST** — currently SaaS @ 18% is the only line item.
- **Backfilling historical invoice numbers** for pre-Phase-60.11 `payment_history` rows. Vanessa was a one-off backfill via `src/scripts/backfill-vanessa-invoice.js` because she paid the same day as the migration.

---

## Project Statistics

| Metric | Count |
|--------|-------|
| Frontend Pages | 60+ |
| Backend Controllers | 63 (added `billingAddressController` in Phase 60.11) |
| Backend API Routes | ~482 (+`GET`/`PUT /api/billing-address`) |
| Database Tables | 64 (added `billing_addresses` and `invoice_sequences` in Phase 60.11; `audit_logs` materialised in prod in Phase 63) |
| Persona Types | 11 V2 personas |
| Subscription Plans | 3 per role (Free / Pro / Enterprise), independent per persona |
| Public Pages | 3 (Landing, Marketplace, Reports) |
| Lines of Seed Data | ~300 |
| Frontend repo total commits | 200 |
| Backend repo total commits | 261 |
| First GST-compliant invoice | `OPENI/FY26-27/0001` (6 May 2026) |

---

## Repository Links

- **Frontend:** https://github.com/RajeevBanduni/openi-hub
- **Backend:** https://github.com/RajeevBanduni/openi-hub-backend
- **LinkedIn:** https://www.linkedin.com/company/openi-partners/
- **X (Twitter):** https://x.com/OpenIPartners

---

*Documentation for OpenI Hub — Multi-Persona Open Innovation Platform*
*Last updated: 8 May 2026 evening (v3.2 — added v2.8.1 Phase 63 backfill section, corrected Database Tables count 63 → 64). Active phase chain shipped 7-8 May: Phase 63 (`audit_logs` backfill, 7 May), then 8 phases on 8 May (64, 65 #1-#4, 65b, 65c, 65d, 65e) covering all 11 personas where applicable.* 🎉
