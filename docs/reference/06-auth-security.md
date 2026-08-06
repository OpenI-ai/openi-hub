<!-- Verbatim section of OpenI Hub DOCUMENTATION.md (lines 652-698 of the pre-split original). -->
<!-- Index: ../../DOCUMENTATION.md · Body starts line 4 (uniform across all parts: tail -n +4). -->

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

