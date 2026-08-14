<!-- Section of OpenI Hub DOCUMENTATION.md (lines 586-651 of the pre-split original). EDITED 14 Aug 2026 (§8 Database Schema — full re-census) — NO LONGER VERBATIM, out of the re-concat recipe. -->
<!-- Index: ../../DOCUMENTATION.md · Body starts line 4 (uniform across all parts: tail -n +4). -->

## 8. Database Schema

### 165 Tables

> **This section was rebuilt on 14 Aug 2026.** It previously listed 28 tables, which was
> the schema as of roughly Feb 2026. The count is derived by grep over `src/migrations/`,
> anchored at statement position (`^\s*CREATE TABLE IF NOT EXISTS`) — an unanchored grep
> matches the phrase inside comments and over-counts. There are **165 unique table names
> and zero duplicates across modules**. Of the 28 originally listed, 27 still exist;
> `sme_experts` was dropped in Phase 71d (11 May 2026) as a duplicate of `mentors` and is
> no longer part of the schema (`src/migrations/001-extensions-and-core.js:383`).

**Per-migration-module breakdown** (`src/migrations/`, in run order):

| Module | Tables |
|--------|--------|
| `001-extensions-and-core.js` | 34 |
| `002-analytics-corporate-marketplace.js` | 26 |
| `003-licensing-and-corporate-enhancements.js` | 19 |
| `004-profiles-and-search.js` | 13 |
| `005-incubator-accelerator.js` | 13 |
| `006-entities-and-organizations.js` | 4 |
| `007-email-infrastructure.js` | 4 |
| `008-persona-tables.js` | 14 |
| `009-onboarding-admin-crawler.js` | 8 |
| `010-ai-pricing-billing.js` | 12 |
| `011-knowledge-hub-and-cross-ecosystem.js` | 6 |
| `012-notifications-subscriptions-partner-api.js` | 3 |
| `013-drift-repair-and-late-patches.js` | 9 |
| `014-evaluation-scoring-diagnostics.js` | 0 (ALTERs only) |
| **Total** | **165** |

Modules are **idempotent but order-dependent** and run with **no surrounding transaction**.
A new migration appends a new `0NN-*.js` module at the end of the directory and a new entry
at the end of the `steps` array in `src/migrations/index.js` — never insert into the middle.

---

**Core & Identity:**
- `users` - Platform users (admin, evaluator, startup, mentor)
- `user_roles` - Per-user role grants (`ON DELETE CASCADE` on `user_id`)
- `organizations` - Organization records
- `org_members` - Organization membership
- `organization_personas` - Persona assignment per organization
- `password_resets` - Password reset tokens
- `email_verifications` - Email verification tokens
- `profile_claims` - Claim requests against imported profiles
- `profile_views` - Profile view tracking
- `user_connections` - User-to-user connections
- `user_onboarding_progress` - Onboarding step state
- `sso_configurations` - Per-tenant SSO config
- `sso_login_states` - SSO login state / nonce store

**Persona Profiles** (12 tables, all with `ON DELETE CASCADE` on `user_id`)**:**
- `academia_profiles`, `accelerator_profiles`, `corporate_profiles`, `directory_profiles`
- `government_profiles`, `incubator_profiles`, `investor_profiles`, `lab_profiles`
- `mentor_profiles`, `service_provider_profiles`, `startup_profiles`, `student_profiles`

**Startups & Company Data:**
- `startups` - Registered startups with full profile data
- `startup_team_members` - Founders and team
- `startup_funding_rounds` - Funding history
- `startup_products` - Product catalogue
- `startup_patents` - Patent records
- `startup_news` - News mentions
- `startup_clients` - Customer references
- `startup_competitors` - Competitive landscape
- `startup_acquisitions` - Acquisition events
- `startup_taxonomies` - Taxonomy tagging join table
- `startup_profile_shares` - Shared profile links

**Taxonomy:**
- `taxonomy_industries`, `taxonomy_sectors`, `taxonomy_technologies`
- `taxonomy_functions`, `taxonomy_usecases`

**Evaluations & Assessments:**
- `evaluations` - 8-vector evaluation records with JSONB criteria
- `corporate_evaluations` - Corporate-side AI evaluations
- `persona_evaluations` - Persona-side AI evaluations
- `investor_evaluations` - Investor evaluations
- `program_portfolio_evaluations` - Program portfolio evaluations
- `program_eval_shares` - Shared program evaluation links
- `eight_vector_self_assessments` - Self-served 8-vector assessments
- `eight_vector_self_shares` - Shared self-assessment links
- `deeptech_assessments` - DeepTech qualification with JSONB answers
- `deeptech_assessment_shares` - Shared assessment links
- `govt_api_logs` - Government API integration logs

**Challenges & Applications:**
- `challenges` - Corporate innovation challenges (public gate is `is_public = true`)
- `challenge_templates` - Reusable challenge templates
- `challenge_applications` - Startup applications to challenges
- `challenge_application_reviews` - Reviewer scoring
- `challenge_members` - Challenge team membership (owner/editor/reviewer/viewer)
- `challenge_collaborators` - Collaborator records
- `challenge_invites` - Invites to registered users
- `application_documents` - Files attached to applications
- `application_notes` - Internal notes on applications
- `entity_application_invites` - Entity-level application invites
- `entity_collaborators` - Entity collaborator records
- `entity_reviews` - Entity-level reviews

**Programs — Incubator & Accelerator:**
- `cohorts` - Incubation cohorts
- `cohort_startups` - Many-to-many cohort membership
- `incubator_programs` - Incubator programmes
- `incubator_program_milestones` - Programme milestones
- `incubator_program_startups` - Programme membership
- `incubator_mentor_pool` - Mentor pool per incubator
- `incubator_mentor_assignments` - Mentor-startup assignment within a programme
- `accelerator_batches` - Accelerator batches
- `accelerator_batch_milestones` - Batch milestones
- `accelerator_batch_startups` - Batch membership
- `accelerator_corporate_partners` - Corporate partners per accelerator
- `accelerator_demo_days` - Demo day events
- `accelerator_investor_network` - Investor network per accelerator
- `program_service_partners` - Service partners attached to programmes

**Mentorship:**
- `mentors` - Mentor profiles with expertise arrays
- `mentor_assignments` - Mentor-startup assignments
- `mentor_availability` - Availability slots
- `mentor_sessions` - Booked / completed sessions
- `student_mentor_requests` - Student-initiated mentor requests

**Investor & Deals:**
- `investor_deals` - Deals tracked by investors
- `investor_deal_requests` - Deal requests raised to the network
- `deal_request_applications` - Applications against a deal request
- `deal_milestones` - Deal milestones
- `deal_tasks` - Deal tasks
- `portfolio_companies` - Investor portfolio companies

**Collaboration & Projects:**
- `projects` - Projects with budget, progress, status
- `project_tasks` - Tasks within projects
- `collaborations` - Cross-persona collaborations
- `collaboration_milestones` - Collaboration milestones
- `collaboration_tasks` - Collaboration tasks
- `meetings` - Scheduled meetings
- `meeting_participants` - Meeting attendance

**Communication:**
- `conversations` - Direct and group conversations
- `conversation_members` - Conversation membership
- `messages` - Chat messages with read status
- `user_notifications` - In-app notifications
- `pending_email_invites` - Invites to non-registered emails (`invited_user_id` IS NULL)

**Email Infrastructure:**
- `email_outbox` - Queued outbound mail
- `email_events` - Delivery / bounce / open events
- `email_suppressions` - Suppression list
- `admin_email_alerts` - Admin alert mail records

**Service Providers:**
- `sp_services` - Services offered
- `sp_clients` - Client references
- `sp_reviews` - Client reviews

**Academia & Students:**
- `academia_research_projects` - Research projects
- `academia_publications` - Publications
- `academia_grants` - Grant records
- `student_projects` - Student project portfolio
- `student_certifications` - Certifications
- `student_portfolio_shares` - Shared portfolio links

**Labs & Infrastructure:**
- `infrastructure` - Labs, test facilities, HPC clusters
- `infrastructure_bookings` - Facility reservations
- `lab_equipment` - Lab equipment inventory
- `lab_bookings` - Lab booking records
- `lab_announcements` - Lab announcements / calls
- `lab_announcement_applications` - Applications to announcements
- `lab_publications` - Lab publications

**IPR & Documents:**
- `ipr_records` - Patents, trademarks, copyrights, designs
- `documents` - Files with access control (public/internal/restricted)

**Watchlists:**
- `watchlists` - Named watchlists with visibility settings
- `watchlist_startups` - Watchlist membership
- `watchlist_collaborators` - Watchlist collaborators
- `watchlist_shares` - Shared watchlist links
- `watchlist_user_alerts` - Per-user watchlist alerts

**Events:**
- `events` - Hackathons, workshops, conferences, webinars
- `event_registrations` - Event registrations

**Knowledge Hub:**
- `knowledge_articles` - Articles, guides, policies
- `knowledge_article_suggestions` - Suggested edits / submissions
- `knowledge_contributor_requests` - Contributor access requests
- `whats_new_entries` - Product changelog entries

**Feedback:**
- `feedback` - Startup feedback with sentiment and response

**AI, Clustering & Recommendations:**
- `ai_usage_log` - Per-call AI usage log
- `ai_credit_packs` - Purchasable credit packs
- `ai_credit_purchases` - Credit purchase records
- `corporate_ai_recommendations` - AI recommendations for corporates
- `persona_ai_recommendations` - AI recommendations per persona
- `recommendation_click_log` - Recommendation click-through log
- `cluster_runs` - Clustering job runs
- `cluster_subgroups` - Derived subgroups (refreshed by cron)
- `cluster_bridge` - Cluster membership bridge
- `cluster_boost_impact_log` - Boost impact measurements

**Billing & Subscriptions:**
- `subscription_plans` - Plan definitions
- `user_subscriptions` - Active subscriptions
- `payment_history` - Payment records
- `billing_addresses` - Billing addresses (mandatory at checkout)
- `invoice_sequences` - Atomic invoice numbering (`pg_advisory_xact_lock`)
- `usage_tracking` - Metered usage
- `api_clients` - Partner API keys and scopes

**Crawling & Enrichment:**
- `crawl_sources` - Web crawl source configurations (`name` is UNIQUE)
- `crawled_startups` - Discovered startups pending review (partial UNIQUE index on `cin`)
- `crawl_jobs` - Crawl job execution history
- `crawl_schedule` - Crawl scheduling
- `directory_crawl_runs` - Directory crawl runs
- `enrichment_queue` - Deep-enrichment work queue
- `user_crawl_requests` - User-submitted crawl requests

**Service Health:**
- `service_uptime_daily`, `service_costs_daily`, `service_errors_daily`
- `service_manual_costs`, `service_alerts_fired`

**Audit:**
- `audit_logs` - Write operation audit trail

---

