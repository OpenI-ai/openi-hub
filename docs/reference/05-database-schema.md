<!-- Verbatim section of OpenI Hub DOCUMENTATION.md (lines 586-651 of the pre-split original). -->
<!-- Index: ../../DOCUMENTATION.md · Body starts line 4 (uniform across all parts: tail -n +4). -->

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

