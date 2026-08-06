<!-- Verbatim section of OpenI Hub DOCUMENTATION.md (lines 234-312 of the pre-split original). -->
<!-- Index: ../../DOCUMENTATION.md · Body starts line 4 (uniform across all parts: tail -n +4). -->

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

