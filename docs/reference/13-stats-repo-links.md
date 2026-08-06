<!-- Verbatim section of OpenI Hub DOCUMENTATION.md (lines 1497-1525 of the pre-split original). -->
<!-- Index: ../../DOCUMENTATION.md · Body starts line 4 (uniform across all parts: tail -n +4). -->

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
*Last updated: 26 Jul 2026 (session 54) — self-serve Audit Log export (§ 6.20) and Bulk Data Export (§ 6.22) added, both as dashboard UI + new Partner API v1 endpoints (§ 6.21, `audit_logs:read`/`data_export:read` scopes); USD billing display fixed.* 🎉
