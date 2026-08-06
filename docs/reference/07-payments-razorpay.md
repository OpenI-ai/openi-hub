<!-- Verbatim section of OpenI Hub DOCUMENTATION.md (lines 699-795 of the pre-split original). -->
<!-- Index: ../../DOCUMENTATION.md · Body starts line 4 (uniform across all parts: tail -n +4). -->

## 11. Licensing & Payments (Razorpay)

OpenI Hub uses a **3-tier freemium SaaS model** with Razorpay as the payment gateway for Indian customers (INR). Subscription management, payment capture, and usage gating are fully integrated end-to-end.

### 11.1 Plans

| Plan | Price (Monthly) | Price (Yearly) | Challenges | Applications | Meetings | File Uploads |
|------|-----------------|----------------|------------|--------------|----------|--------------|
| **Free** | INR 0 | INR 0 | 1 / month | 3 / month | 5 / month | 5 / month |
| **Pro** | INR 999 | INR 9,990 | 5 / month | 20 / month | 50 / month | 100 / month |
| **Enterprise** | INR 4,999 | INR 49,990 | Unlimited | Unlimited | Unlimited | Unlimited |

Limits are stored as JSONB in `subscription_plans.features`. A value of `-1` means unlimited. Limits reset at the start of each calendar month.

### 11.2 Database Tables

| Table | Purpose |
|-------|---------|
| `subscription_plans` | Plan catalog (name, display_name, price_monthly, price_yearly, currency, features JSONB) |
| `user_subscriptions` | Active and historical subscriptions per user (plan_id, status, billing_cycle, razorpay_subscription_id, period start/end) |
| `payment_history` | All payment attempts (razorpay_payment_id, razorpay_order_id, razorpay_signature, amount, status) |
| `usage_tracking` | Per-user per-feature monthly counter (user_id, feature, period, count) |
| `users.current_plan` | Column on users table storing the user's current plan name (default `free`) |

### 11.3 Backend API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/subscription/plans` | Bearer | List all active plans |
| GET | `/api/subscription/my-plan` | Bearer | Get current user's plan, subscription, usage, and payment history |
| POST | `/api/subscription/create-order` | Bearer | Create a Razorpay order for a plan upgrade |
| POST | `/api/subscription/verify-payment` | Bearer | Verify Razorpay HMAC-SHA256 signature and activate the subscription (transactional) |
| POST | `/api/subscription/cancel` | Bearer | Cancel active subscription and revert to Free plan |
| POST | `/api/subscription/webhook` | Signature | Razorpay webhook handler for `payment.captured` and `payment.failed` events |

### 11.4 Payment Flow

1. User clicks **Upgrade** on Settings → Billing tab
2. Frontend calls `POST /api/subscription/create-order` with `plan_id` and `billing_cycle`
3. Backend creates a Razorpay order via the Razorpay SDK (amount in paise), returns `order_id`, `amount`, `currency`, and the public `RAZORPAY_KEY_ID`
4. Frontend opens the Razorpay Checkout modal (`window.Razorpay`) with the order details
5. User completes payment in the modal
6. Razorpay returns `razorpay_payment_id`, `razorpay_order_id`, and `razorpay_signature` via the `handler` callback
7. Frontend calls `POST /api/subscription/verify-payment` with those three values
8. Backend verifies the HMAC-SHA256 signature using `RAZORPAY_KEY_SECRET`
9. On success, a database transaction: cancels any existing active subscription, inserts a new `user_subscriptions` row, records the payment in `payment_history`, and updates `users.current_plan`
10. Frontend refreshes the Billing tab and shows the new plan + updated usage meters

### 11.5 Usage Gating Middleware

`src/middleware/subscription.js` exports `checkUsageLimit(feature)` — an Express middleware factory that:

1. Reads the user's `current_plan` from JWT
2. Fetches the plan's `features` JSONB
3. Checks `usage_tracking` for the current month
4. If `currentUsage >= limit`, returns **403** with `{ message, feature, limit, used, plan, upgrade_url }`
5. Otherwise increments the counter via an upsert and calls `next()`
6. Fails open on errors so transient DB issues don't block users

**Gated routes:**
- `POST /api/challenges` — `checkUsageLimit('challenge_create')`
- `POST /api/challenges/:id/apply` — `checkUsageLimit('application_submit')`
- `POST /api/meetings` — `checkUsageLimit('meeting_create')`
- `POST /api/upload` — `checkUsageLimit('file_upload')`

### 11.6 Test Mode (Fallback)

If `RAZORPAY_KEY_ID` or `RAZORPAY_KEY_SECRET` is missing from the environment, the backend lazily skips Razorpay SDK init and returns a fake `order_test_<timestamp>` order. The frontend detects `test_mode: true` and simulates a successful payment by calling verify-payment with placeholder values. This allowed the entire flow (including DB writes) to be built and tested before real keys were issued.

### 11.7 Environment Variables (Backend)

```
RAZORPAY_KEY_ID=rzp_test_xxx        # or rzp_live_xxx for production
RAZORPAY_KEY_SECRET=xxx              # never exposed to frontend
RAZORPAY_WEBHOOK_SECRET=xxx          # optional — for webhook signature verification
```

The public `RAZORPAY_KEY_ID` is returned to the frontend via `create-order` response (never hardcoded).

### 11.8 Frontend Integration

| File | Purpose |
|------|---------|
| `index.html` | Loads Razorpay Checkout SDK: `<script src="https://checkout.razorpay.com/v1/checkout.js"></script>` |
| `src/services/api.js` | `subscriptionAPI` wrapper with `getPlans`, `getMyPlan`, `createOrder`, `verifyPayment`, `cancel` |
| `src/pages/dashboard/Settings.jsx` | Billing tab with plan comparison, usage meters, upgrade/cancel buttons, Razorpay checkout handler |

### 11.9 Webhook Reconciliation (Optional)

The webhook endpoint at `POST /api/subscription/webhook` handles:
- `payment.captured` — logs the event for reconciliation (payment already activated via verify-payment)
- `payment.failed` — marks the corresponding `payment_history` row as `failed`

To enable webhooks, add the endpoint URL in the Razorpay dashboard (Settings → Webhooks) with events `payment.captured` and `payment.failed`, then set `RAZORPAY_WEBHOOK_SECRET` on Railway.

---

