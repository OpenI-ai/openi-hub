<!-- Verbatim section of OpenI Hub DOCUMENTATION.md (lines 1319-1496 of the pre-split original). -->
<!-- Index: ../../DOCUMENTATION.md · Body starts line 4 (uniform across all parts: tail -n +4). -->

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

