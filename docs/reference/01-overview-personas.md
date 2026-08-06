<!-- Verbatim section of OpenI Hub DOCUMENTATION.md (lines 35-115 of the pre-split original). -->
<!-- Index: ../../DOCUMENTATION.md · Body starts line 4 (uniform across all parts: tail -n +4). -->

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

