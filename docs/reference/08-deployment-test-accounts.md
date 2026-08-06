<!-- Verbatim section of OpenI Hub DOCUMENTATION.md (lines 796-863 of the pre-split original). -->
<!-- Index: ../../DOCUMENTATION.md · Body starts line 4 (uniform across all parts: tail -n +4). -->

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

