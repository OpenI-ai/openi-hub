import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI, subscriptionAPI, creditAPI, mfaAPI, billingAddressAPI } from '../../services/api';
import safeStorage from '../../utils/safeStorage';
import BillingAddressModal from '../../components/BillingAddressModal';
import toast from 'react-hot-toast';
import {
  User, Shield, Lock, Bell, Key, CreditCard, Download, FileText,
} from 'lucide-react';
// Phase 166 (W5-3): 1,507 lines -> this page + ./settingsTabs/.
// The '/index.js' suffix is required, not cosmetic: on case-insensitive APFS
// a bare './settingsTabs' could still be shadowed by extension resolution.
import {
  G,
  ProfileTab, SecurityTab, BillingTab, NotificationsTab,
  ApiKeysTab, SsoTab, AuditLogsTab, DataExportTab, AccountInfoCard,
} from './settingsTabs/index.js';

export default function Settings() {
  const { user, updateUser } = useAuth();
  const [searchParams] = useSearchParams();
  // Phase 68: deep-link support for plan visibility surfaces.
  // Other pages link to /dashboard/settings?tab=billing or
  // ?tab=billing&focus=plans so users land directly on the right tab and,
  // optionally, scroll the plan-comparison grid into view.
  const initialTab = ['profile', 'security', 'billing', 'notifications', 'api-keys', 'sso', 'audit-logs', 'data-export'].includes(searchParams.get('tab'))
    ? searchParams.get('tab')
    : 'profile';
  const [tab, setTab] = useState(initialTab);
  const plansAnchorRef = useRef(null);

  // Profile form
  const [name, setName] = useState(user?.name || '');
  const [preferredCurrency, setPreferredCurrency] = useState(user?.preferred_currency || 'INR');
  const [saving, setSaving] = useState(false);

  // Password form
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  // Notification prefs (local only)
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);

  // Billing state
  const [plans, setPlans] = useState([]);
  const [myPlan, setMyPlan] = useState(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  // A.5: monthly/annual toggle state. Read from URL ?cycle=annual on mount
  // (deep-link from Phase 113 renewal reminder email for monthly subscribers).
  const [billingCycleSelected, setBillingCycleSelected] = useState(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      return sp.get('cycle') === 'annual' ? 'yearly' : 'monthly';
    } catch { return 'monthly'; }
  });
  // Phase 123 — self-serve recurring auto-renew opt-in (Razorpay Subscriptions
  // API). Default OFF: existing customers keep today's manual-renewal flow
  // unless they explicitly opt in at checkout.
  const [autoRenewSelected, setAutoRenewSelected] = useState(false);
  const [togglingAutoRenew, setTogglingAutoRenew] = useState(false);
  // Phase 60.11 — Billing address (mandatory before checkout)
  const [billingAddress, setBillingAddress] = useState(null);
  const [billingModalOpen, setBillingModalOpen] = useState(false);
  // Pending checkout deferred until the billing-address modal is satisfied.
  const [pendingUpgrade, setPendingUpgrade] = useState(null); // { planId, planName }

  // A.5 USD: derive displayCurrency from billing-address country
  // India -> INR (default until address loads). Anything else -> USD.
  // Matches backend createOrder logic at subscriptionController.js line ~154.
  // NOTE: must stay below the billingAddress useState declaration — referencing
  // the const before init throws a TDZ ReferenceError that crashes the page.
  const displayCurrency = (() => {
    if (!billingAddress?.country) return 'INR'; // safe default while loading
    return String(billingAddress.country).trim().toLowerCase() === 'india' ? 'INR' : 'USD';
  })();

  // AI credit packs state (Phase 26)
  const [creditPacks, setCreditPacks] = useState([]);
  const [creditBalance, setCreditBalance] = useState(null);
  const [creditPurchases, setCreditPurchases] = useState([]);
  const [buyingPackId, setBuyingPackId] = useState(null);

  // MFA state (Phase 54)
  const [mfaStatus, setMfaStatus]         = useState(null);   // { enabled, enrolled_at, pending, bypass }
  const [mfaSetup, setMfaSetup]           = useState(null);   // { qr_data_url, secret_base32 }
  const [mfaCode, setMfaCode]             = useState('');
  const [mfaBusy, setMfaBusy]             = useState(false);
  const [mfaDisablePw, setMfaDisablePw]   = useState('');
  const [showMfaDisable, setShowMfaDisable] = useState(false);

  // Phase 68: deep-link to plan comparison.
  // When the user lands here via ?tab=billing&focus=plans, scroll the
  // plan-comparison block into view as soon as it has rendered. Fires
  // once `myPlan` loads (which is what triggers the billing tab content
  // to render its full DOM tree).
  useEffect(() => {
    if (tab !== 'billing') return;
    if (searchParams.get('focus') !== 'plans') return;
    if (!myPlan) return; // wait for billing data to populate
    // setTimeout 0 to land after the browser has painted the new DOM.
    const t = setTimeout(() => {
      plansAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
    return () => clearTimeout(t);
  }, [tab, myPlan, searchParams]);

  useEffect(() => {
    if (tab === 'security') {
      mfaAPI.status().then(setMfaStatus).catch(() => setMfaStatus({ enabled: false, bypass: false }));
    }
  }, [tab]);

  const handleMfaSetupStart = async () => {
    setMfaBusy(true);
    try {
      const data = await mfaAPI.setup();
      setMfaSetup(data);
    } catch (e) { toast.error(e.message || 'Setup failed'); }
    finally { setMfaBusy(false); }
  };

  const handleMfaEnable = async (e) => {
    e.preventDefault();
    if (mfaCode.length < 6) return;
    setMfaBusy(true);
    try {
      await mfaAPI.enable(mfaCode);
      toast.success('Multi-factor authentication is now enabled.');
      setMfaSetup(null);
      setMfaCode('');
      const st = await mfaAPI.status();
      setMfaStatus(st);
    } catch (e) { toast.error(e.message || 'Invalid code'); }
    finally { setMfaBusy(false); }
  };

  const handleMfaDisable = async (e) => {
    e.preventDefault();
    if (!mfaDisablePw || mfaCode.length < 6) return;
    setMfaBusy(true);
    try {
      await mfaAPI.disable(mfaDisablePw, mfaCode);
      toast.success('MFA disabled.');
      setShowMfaDisable(false);
      setMfaCode('');
      setMfaDisablePw('');
      const st = await mfaAPI.status();
      setMfaStatus(st);
    } catch (e) { toast.error(e.message || 'Invalid credentials'); }
    finally { setMfaBusy(false); }
  };

  const loadBilling = async () => {
    setBillingLoading(true);
    try {
      const [plansData, myData, featureData, packsData, balanceData, billingAddrData] = await Promise.all([
        subscriptionAPI.getPlans(),
        subscriptionAPI.getMyPlan(),
        subscriptionAPI.featureAccess().catch(() => null),
        creditAPI.listPacks().catch(() => ({ packs: [] })),
        creditAPI.myBalance().catch(() => ({ balance: 0, purchases: [] })),
        // 404 (no row yet) is normal — swallow to null.
        billingAddressAPI.get().catch(() => null),
      ]);
      setPlans(plansData.plans || []);
      setMyPlan({ ...myData, ai_consumption: featureData?.ai_consumption || null });
      setCreditPacks(packsData.packs || []);
      setCreditBalance(typeof balanceData.balance === 'number' ? balanceData.balance : 0);
      setCreditPurchases(balanceData.purchases || []);
      setBillingAddress(billingAddrData?.billing_address || null);
    } catch (err) { toast.error('Failed to load billing info'); }
    finally { setBillingLoading(false); }
  };

  const handleBuyCredits = async (pack) => {
    setBuyingPackId(pack.id);
    try {
      const orderData = await creditAPI.createOrder(pack.id);

      const finish = async (verifyPayload) => {
        const result = await creditAPI.verifyPayment(verifyPayload);
        toast.success(`+${result.credits_added} AI credits added`);
        setCreditBalance(result.balance);
        // Refresh purchase history
        const bal = await creditAPI.myBalance();
        setCreditPurchases(bal.purchases || []);
      };

      if (orderData.test_mode) {
        await finish({
          razorpay_payment_id: `pay_test_${Date.now()}`,
          razorpay_order_id: orderData.order_id,
          razorpay_signature: 'test_signature',
          pack_id: pack.id,
        });
      } else if (!window.Razorpay) {
        toast.error('Payment gateway failed to load. Please refresh the page and try again.');
      } else {
        const rzp = new window.Razorpay({
          key: orderData.key,
          order_id: orderData.order_id,
          amount: orderData.amount,
          currency: orderData.currency || 'INR',
          name: 'OpenI Hub',
          image: 'https://www.openi.ai/openi-logo.png',
          description: `${pack.name} — ${pack.credits} AI credits`,
          prefill: { email: user?.email, name: user?.name },
          handler: async (response) => {
            try {
              await finish({ ...response, pack_id: pack.id });
            } catch (err) { toast.error(err.message || 'Payment verification failed'); }
          },
          modal: { ondismiss: () => setBuyingPackId(null) },
        });
        rzp.open();
      }
    } catch (err) {
      toast.error(err.message || 'Purchase failed');
    } finally {
      setBuyingPackId(null);
    }
  };

  // Phase 60.11: hard-gate Razorpay checkout on a complete billing address.
  // If we don't have one cached, refresh from the server (defence against
  // stale frontend state). If still missing, open the modal and remember the
  // pending plan so we can resume the checkout once the user saves.
  const handleUpgrade = async (planId, planName) => {
    let addr = billingAddress;
    if (!addr) {
      try {
        const r = await billingAddressAPI.get();
        addr = r?.billing_address || null;
        setBillingAddress(addr);
      } catch (_) { /* 404 — no row yet */ }
    }
    if (!addr) {
      setPendingUpgrade({ planId, planName });
      setBillingModalOpen(true);
      return;
    }
    return runUpgrade(planId, planName);
  };

  // Called by the modal's onSaved callback. Closes the modal and, if there
  // was a pending upgrade waiting on the address, resumes it.
  const handleBillingSaved = (saved) => {
    setBillingAddress(saved);
    setBillingModalOpen(false);
    if (pendingUpgrade) {
      const { planId, planName } = pendingUpgrade;
      setPendingUpgrade(null);
      runUpgrade(planId, planName);
    }
  };

  // A.5: cycle-aware upgrade flow — branches between createOrder (new sub or plan change)
  // and changeBillingCycle (existing sub, same plan, different cycle with proration).
  const runUpgrade = async (planId, planName) => {
    setUpgrading(true);
    const cycle = billingCycleSelected; // 'monthly' or 'yearly'
    const cycleLabel = cycle === 'yearly' ? 'Annual' : 'Monthly';
    try {
      // Detect mid-period cycle change: same plan, active sub, different cycle
      const isCycleChange =
        myPlan?.subscription?.billing_cycle &&
        myPlan?.plan_name !== 'free' &&
        myPlan?.plan?.id === planId &&
        myPlan?.subscription?.billing_cycle !== cycle;

      // Phase 128: mid-period plan-tier change (upgrade or downgrade) — different
      // plan_id on an existing active paid sub, proration handled server-side.
      const isPlanChange =
        myPlan?.subscription?.billing_cycle &&
        myPlan?.plan_name !== 'free' &&
        myPlan?.plan?.id !== planId;

      // Phase 123: recurring auto-renew only applies to a fresh subscription
      // checkout, never to a mid-period cycle or plan change on an existing sub.
      const wantsRecurring = autoRenewSelected && !isCycleChange && !isPlanChange;

      let orderData;
      if (isCycleChange) {
        // Mid-period change — Razorpay order with prorated amount
        orderData = await subscriptionAPI.changeBillingCycle({ new_cycle: cycle });
        if (orderData.status === 'switched') {
          // Backend flipped cycle directly (no payment needed)
          toast.success(`Switched to ${cycleLabel.toLowerCase()} billing`);
          loadBilling();
          return;
        }
      } else if (isPlanChange) {
        // Mid-period plan-tier change — Razorpay order with prorated amount
        orderData = await subscriptionAPI.changePlan({ plan_id: planId, billing_cycle: cycle });
        if (orderData.status === 'switched') {
          // Backend switched plan directly (credit covered the new plan, no payment needed)
          toast.success(`Switched to ${planName}`);
          loadBilling();
          return;
        }
      } else if (wantsRecurring) {
        // Phase 123 — real recurring auto-renew (Razorpay Subscriptions API)
        orderData = await subscriptionAPI.createRecurringOrder({ plan_id: planId, billing_cycle: cycle });
      } else {
        // New subscription OR plan change — standard one-off createOrder
        orderData = await subscriptionAPI.createOrder({ plan_id: planId, billing_cycle: cycle });
      }

      if (orderData.test_mode) {
        // Test mode — simulate payment
        if (wantsRecurring) {
          const result = await subscriptionAPI.verifyRecurringPayment({
            razorpay_payment_id: `pay_test_${Date.now()}`,
            razorpay_subscription_id: orderData.subscription_id,
            razorpay_signature: 'test_signature',
            plan_id: planId,
            billing_cycle: cycle,
          });
          if (result.success) {
            toast.success(`Upgraded to ${result.display_name} (${cycleLabel}, auto-renew on)!`);
            updateUser({ current_plan: result.plan });
            loadBilling();
          }
        } else if (isPlanChange) {
          const result = await subscriptionAPI.verifyPlanChange({
            razorpay_payment_id: `pay_test_${Date.now()}`,
            razorpay_order_id: orderData.order_id,
            razorpay_signature: 'test_signature',
            plan_id: planId,
            billing_cycle: cycle,
          });
          if (result.success) {
            toast.success(`Switched to ${result.display_name}!`);
            updateUser({ current_plan: result.plan });
            loadBilling();
          }
        } else {
          const result = await subscriptionAPI.verifyPayment({
            razorpay_payment_id: `pay_test_${Date.now()}`,
            razorpay_order_id: orderData.order_id,
            razorpay_signature: 'test_signature',
            plan_id: planId,
            billing_cycle: cycle,
          });
          if (result.success) {
            toast.success(`Upgraded to ${result.display_name} (${cycleLabel})!`);
            updateUser({ current_plan: result.plan });
            loadBilling();
          }
        }
      } else if (!window.Razorpay) {
        toast.error('Payment gateway failed to load. Please refresh the page and try again.');
      } else if (wantsRecurring) {
        // Real Razorpay recurring checkout — subscription_id instead of order_id
        const rzp = new window.Razorpay({
          key: orderData.key,
          subscription_id: orderData.subscription_id,
          currency: orderData.currency || 'INR',
          name: 'OpenI Hub',
          image: 'https://www.openi.ai/openi-logo.png',
          description: `${planName} - ${cycleLabel} (auto-renew)`,
          prefill: { email: user?.email, name: user?.name },
          handler: async (response) => {
            try {
              const result = await subscriptionAPI.verifyRecurringPayment({
                ...response,
                plan_id: planId,
                billing_cycle: cycle,
              });
              if (result.success) {
                toast.success(`Upgraded to ${result.display_name} (${cycleLabel}, auto-renew on)!`);
                updateUser({ current_plan: result.plan });
                loadBilling();
              }
            } catch (err) { toast.error(err.message); }
          },
          theme: { color: G },
        });
        rzp.open();
      } else if (isPlanChange) {
        // Real Razorpay one-off checkout for the prorated plan-change amount
        const rzp = new window.Razorpay({
          key: orderData.key,
          order_id: orderData.order_id,
          amount: orderData.amount,
          currency: orderData.currency || 'INR',
          name: 'OpenI Hub',
          image: 'https://www.openi.ai/openi-logo.png',
          description: `${planName} - plan change`,
          prefill: { email: user?.email, name: user?.name },
          handler: async (response) => {
            try {
              const result = await subscriptionAPI.verifyPlanChange({
                ...response,
                plan_id: planId,
                billing_cycle: cycle,
              });
              if (result.success) {
                toast.success(`Switched to ${result.display_name}!`);
                updateUser({ current_plan: result.plan });
                loadBilling();
              }
            } catch (err) { toast.error(err.message); }
          },
          theme: { color: G },
        });
        rzp.open();
      } else {
        // Real Razorpay one-off checkout
        const rzp = new window.Razorpay({
          key: orderData.key,
          order_id: orderData.order_id,
          amount: orderData.amount,
          currency: orderData.currency || 'INR',
          name: 'OpenI Hub',
          image: 'https://www.openi.ai/openi-logo.png',
          description: `${planName} - ${cycleLabel}`,
          prefill: { email: user?.email, name: user?.name },
          handler: async (response) => {
            try {
              const result = await subscriptionAPI.verifyPayment({
                ...response,
                plan_id: planId,
                billing_cycle: cycle,
              });
              if (result.success) {
                toast.success(`Upgraded to ${result.display_name} (${cycleLabel})!`);
                updateUser({ current_plan: result.plan });
                loadBilling();
              }
            } catch (err) { toast.error(err.message); }
          },
          theme: { color: G },
        });
        rzp.open();
      }
    } catch (err) {
      // Defence-in-depth: backend can refuse with BILLING_ADDRESS_REQUIRED if
      // the row was deleted/corrupted between our local check and createOrder.
      if (err?.code === 'BILLING_ADDRESS_REQUIRED') {
        setPendingUpgrade({ planId, planName });
        setBillingModalOpen(true);
        toast('Please complete your billing details first.');
      } else {
        toast.error(err.message);
      }
    }
    finally { setUpgrading(false); }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will be reverted to the Free plan.')) return;
    try {
      await subscriptionAPI.cancel();
      toast.success('Subscription cancelled');
      updateUser({ current_plan: 'free' });
      loadBilling();
    } catch (err) { toast.error(err.message); }
  };

  // Phase 123 — turn off recurring auto-renew. Access + the already-charged
  // period are retained until current_period_end (Razorpay cancel_at_cycle_end);
  // this does NOT downgrade the account immediately.
  const handleToggleAutoRenew = async () => {
    if (!confirm('Turn off auto-renew? You will keep access until your current billing period ends, then no further charges will be made.')) return;
    setTogglingAutoRenew(true);
    try {
      await subscriptionAPI.toggleAutoRenew({ enabled: false });
      toast.success('Auto-renew turned off');
      loadBilling();
    } catch (err) { toast.error(err.message); }
    finally { setTogglingAutoRenew(false); }
  };

  const saveProfile = async () => {
    if (!name.trim()) return toast.error('Name is required');
    setSaving(true);
    try {
      const res = await authAPI.updateProfile({
        name: name.trim(),
        preferred_currency: preferredCurrency,
      });
      // Update localStorage
      const stored = JSON.parse(safeStorage.getItem('openi_user') || '{}');
      stored.name = res.user?.name || name.trim();
      stored.preferred_currency = res.user?.preferred_currency || preferredCurrency;
      safeStorage.setItem('openi_user', JSON.stringify(stored));
      // Also update auth context so downstream components see the new preference
      if (updateUser) updateUser({ preferred_currency: stored.preferred_currency });
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (!currentPw) return toast.error('Enter current password');
    if (newPw.length < 6) return toast.error('New password must be at least 6 characters');
    if (newPw !== confirmPw) return toast.error('Passwords do not match');
    setChangingPw(true);
    try {
      await authAPI.changePassword(currentPw, newPw);
      toast.success('Password changed successfully');
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
    } catch (err) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setChangingPw(false);
    }
  };

  const TABS = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'api-keys', label: 'API Keys', icon: Key },
    { id: 'sso', label: 'SSO', icon: Shield },
    { id: 'audit-logs', label: 'Audit Logs', icon: FileText },
    { id: 'data-export', label: 'Data Export', icon: Download },
  ];

  return (
    <div style={{ padding: 28, maxWidth: 800, background: '#f5f5f5', minHeight: '100%' }}>
      <h1 style={{ margin: '0 0 4px', color: '#1a1a1a', fontSize: 22, fontWeight: 700 }}>Settings</h1>
      <p style={{ margin: '0 0 24px', color: '#888', fontSize: 13 }}>Manage your profile, security and preferences</p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: '#fff', border: '1px solid #eee', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)} style={{
            padding: '8px 18px', borderRadius: 7, fontSize: 13, fontWeight: 600,
            border: 'none', cursor: 'pointer',
            background: tab === id ? G : 'transparent',
            color: tab === id ? '#fff' : '#666',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <Icon size={14} />{label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {tab === 'profile' && (
        <ProfileTab name={name} preferredCurrency={preferredCurrency} saveProfile={saveProfile}
          saving={saving} setName={setName} setPreferredCurrency={setPreferredCurrency} user={user}
        />
      )}

      {/* Security Tab */}
      {tab === 'security' && (
        <SecurityTab changePassword={changePassword} changingPw={changingPw} confirmPw={confirmPw}
          currentPw={currentPw} handleMfaDisable={handleMfaDisable} handleMfaEnable={handleMfaEnable}
          handleMfaSetupStart={handleMfaSetupStart} mfaBusy={mfaBusy} mfaCode={mfaCode}
          mfaDisablePw={mfaDisablePw} mfaSetup={mfaSetup} mfaStatus={mfaStatus} newPw={newPw}
          setConfirmPw={setConfirmPw} setCurrentPw={setCurrentPw} setMfaCode={setMfaCode}
          setMfaDisablePw={setMfaDisablePw} setMfaSetup={setMfaSetup} setNewPw={setNewPw}
          setShowCurrent={setShowCurrent} setShowMfaDisable={setShowMfaDisable} setShowNew={setShowNew}
          showCurrent={showCurrent} showMfaDisable={showMfaDisable} showNew={showNew}
        />
      )}

      {/* Billing Tab */}
      {tab === 'billing' && (
        <BillingTab autoRenewSelected={autoRenewSelected} billingAddress={billingAddress}
          billingCycleSelected={billingCycleSelected} billingLoading={billingLoading}
          buyingPackId={buyingPackId} creditBalance={creditBalance} creditPacks={creditPacks}
          creditPurchases={creditPurchases} displayCurrency={displayCurrency}
          handleBuyCredits={handleBuyCredits} handleCancel={handleCancel}
          handleToggleAutoRenew={handleToggleAutoRenew} handleUpgrade={handleUpgrade}
          loadBilling={loadBilling} myPlan={myPlan} plans={plans} plansAnchorRef={plansAnchorRef}
          setAutoRenewSelected={setAutoRenewSelected}
          setBillingCycleSelected={setBillingCycleSelected} setBillingModalOpen={setBillingModalOpen}
          togglingAutoRenew={togglingAutoRenew} upgrading={upgrading} user={user}
        />
      )}

      {/* Notifications Tab */}
      {tab === 'notifications' && (
        <NotificationsTab emailNotif={emailNotif} pushNotif={pushNotif} setEmailNotif={setEmailNotif}
          setPushNotif={setPushNotif}
        />
      )}

      {/* API Keys Tab */}
      {tab === 'api-keys' && (
        <ApiKeysTab billingLoading={billingLoading} loadBilling={loadBilling} myPlan={myPlan}
          setTab={setTab}
        />
      )}

      {/* SSO Tab */}
      {tab === 'sso' && (
        <SsoTab billingLoading={billingLoading} loadBilling={loadBilling} myPlan={myPlan} setTab={setTab}
        />
      )}

      {/* Audit Logs Tab */}
      {tab === 'audit-logs' && (
        <AuditLogsTab billingLoading={billingLoading} loadBilling={loadBilling} myPlan={myPlan}
          setTab={setTab}
        />
      )}

      {/* Data Export Tab */}
      {tab === 'data-export' && (
        <DataExportTab billingLoading={billingLoading} loadBilling={loadBilling} myPlan={myPlan}
          setTab={setTab}
        />
      )}

      {/* Account Info */}
      <AccountInfoCard user={user} />

      {/* Billing Address Modal (Phase 60.11) — opens before checkout if no row,
          and from the Edit button in the Billing Details card. */}
      <BillingAddressModal
        open={billingModalOpen}
        onClose={() => { setBillingModalOpen(false); setPendingUpgrade(null); }}
        onSaved={handleBillingSaved}
        initial={billingAddress}
        defaults={{ legal_name: user?.organization_name || user?.name || '' }}
      />
    </div>
  );
}
