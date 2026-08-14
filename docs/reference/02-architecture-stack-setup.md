<!-- Section of OpenI Hub DOCUMENTATION.md (lines 116-233 of the pre-split original). EDITED 14 Aug 2026 (§3 Architecture, §5 Backend Setup) — NO LONGER VERBATIM, out of the re-concat recipe. -->
<!-- Index: ../../DOCUMENTATION.md · Body starts line 4 (uniform across all parts: tail -n +4). -->

## 3. Architecture

```
Frontend (React + Vite)          Backend (Node.js + Express)        Database
========================         ============================       ==========
Vercel (auto-deploy)             Railway (auto-deploy)              Railway PostgreSQL

src/                             src/
  config/personas.js               startup.js (82-line re-export shim)
  context/AuthContext.jsx          server.js (Express app)
  services/                        db/
    api.js + apiDomains/ (10)        pool.js (pg connection)
    clusterAPI.js, tourService.js    seed.js (demo data)
  components/LoadingSkeleton       migrations/ (14 modules + index,
  pages/auth/ (10 pages)             165 tables)
  pages/dashboard/ (86 pages)      seed/index.js
  (146 page components total)      middleware/
                                     auth.js (JWT + persona fields)
                                     audit.js (audit logging)
                                   controllers/ (81 top-level + 5 dirs:
                                     corporate/ enrich/ profile/
                                     public/ subscription/)
                                   routes/index.js (116 L aggregator —
                                     mounts 14 router modules, defines
                                     no endpoints of its own)
```

> **Both entrypoints are now shims, not implementations.** `startup.js` was 5,332 lines until 6 Aug 2026, when it was split into `src/migrations/` + `src/seed/`; it now only re-exports. `routes/index.js` defines zero routes — every endpoint lives in one of the 14 router modules it mounts (`admin`, `auth`, `billing`, `core`, `corporate`, `crawl`, `ecosystem`, `investor`, `misc`, `personaAI`, `platform`, `programs`, `public`, plus `index` itself). Several large controllers followed the same pattern in the 12 Aug W6 split — `publicController.js` and `profileController.js` are re-export shims over `controllers/public/` and `controllers/profile/`. **Edit the leaf module, never the shim.**

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
cp .env.example .env      # Set DATABASE_URL, JWT_SECRET, etc.
npm run migrate:bootstrap # Create tables (165) — the ONLY migration entrypoint
npm run db:seed           # Load demo data
npm run dev               # http://localhost:5000
```

> ⚠️ **`npm run db:migrate` no longer exists.** It was deleted on 12 Aug 2026 (`fb0b9f1`) along with `src/db/migrate.js`. That script was a three-month-stale strict subset of `src/migrations/` but still opened a connection from whatever `DATABASE_URL` was in scope, so running it against production would have replayed obsolete DDL there. `npm run migrate:bootstrap` is the replacement and the only supported path, locally and in production. `npm run db:seed` is unaffected and still valid.

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

