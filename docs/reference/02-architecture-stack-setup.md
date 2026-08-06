<!-- Verbatim section of OpenI Hub DOCUMENTATION.md (lines 116-233 of the pre-split original). -->
<!-- Index: ../../DOCUMENTATION.md · Body starts line 4 (uniform across all parts: tail -n +4). -->

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

