import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI, subscriptionAPI, creditAPI, mfaAPI, billingAddressAPI } from '../../services/api';
import BillingAddressModal from '../../components/BillingAddressModal';
import toast from 'react-hot-toast';
import {
  User, Shield, Lock, Save, Eye, EyeOff,
  CheckCircle2, AlertCircle, Bell,
  CreditCard, Loader2, Check, Crown, Zap, X, Download,
} from 'lucide-react';

const G = '#D5AA5B';
const GH = '#C9983F';

const card = {
  background: '#ffffff',
  border: '1px solid #eeeeee',
  borderRadius: 14,
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
};

const FEATURE_LABELS = {
  // Usage-counted features
  challenge_create: 'Challenges Created',
  application_submit: 'Applications Submitted',
  application_review: 'Applications Reviewed',
  deal_request_apply: 'Deal Request Applications',
  conversation_create: 'Conversations Started',
  connection_request: 'Connection Requests',
  meeting_create: 'Meetings Scheduled',
  file_upload: 'Files Uploaded',
  ai_search_daily_cap: 'AI Ask (daily)',
  // Boolean flags
  semantic_search: 'Semantic Search',
  can_access_portfolio_health: 'Portfolio Health',
  can_access_deal_pipeline: 'Deal Pipeline',
  can_access_service_partners: 'Service Partners',
  rich_profile_sections_unlocked: 'Rich Profile Sections',
  multi_currency_enabled: 'Multi-Currency',
  can_create_programs_batches: 'Programs & Batches',
  eight_vector_evaluation: '8-Vector Evaluation',
  // Provider Growth features
  featured_badge: 'Featured Badge',
  search_ranking_boost: 'Priority Search Ranking',
  who_viewed_profile: 'Who Viewed My Profile',
  watchlist_alerts: 'Watchlist Add Alerts',
  application_insights: 'Application Insights',
  profile_score_ai: 'AI Profile Recommendations',
  multi_seat_org_admin: 'Multi-Seat Org Admin',
  api_access: 'API Access',
  sso_audit_logs: 'SSO & Audit Logs',
};
// Features that are boolean flags (not counted usage)
const PROVIDER_BOOLEAN = ['featured_badge', 'search_ranking_boost', 'who_viewed_profile', 'watchlist_alerts', 'application_insights', 'profile_score_ai'];
const SEEKER_BOOLEAN = ['semantic_search', 'can_access_deal_pipeline', 'can_access_portfolio_health', 'can_access_service_partners', 'eight_vector_evaluation', 'can_create_programs_batches', 'rich_profile_sections_unlocked', 'multi_seat_org_admin', 'api_access', 'sso_audit_logs'];
const PROVIDER_USAGE = ['application_submit', 'deal_request_apply', 'conversation_create', 'connection_request', 'meeting_create', 'file_upload'];
const SEEKER_USAGE = ['challenge_create', 'application_review', 'conversation_create', 'meeting_create', 'file_upload'];

// Legacy compat
const BOOLEAN_FEATURES = [...new Set([...PROVIDER_BOOLEAN, ...SEEKER_BOOLEAN])];
const USAGE_FEATURES = ['challenge_create', 'application_submit', 'meeting_create', 'file_upload'];

export default function Settings() {
  const { user, logout, updateUser } = useAuth();
  const [searchParams] = useSearchParams();
  // Phase 68: deep-link support for plan visibility surfaces.
  // Other pages link to /dashboard/settings?tab=billing or
  // ?tab=billing&focus=plans so users land directly on the right tab and,
  // optionally, scroll the plan-comparison grid into view.
  const initialTab = ['profile', 'security', 'billing', 'notifications'].includes(searchParams.get('tab'))
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

  // Phase 60.11 — Billing address (mandatory before checkout)
  const [billingAddress, setBillingAddress] = useState(null);
  const [billingModalOpen, setBillingModalOpen] = useState(false);
  // Pending checkout deferred until the billing-address modal is satisfied.
  const [pendingUpgrade, setPendingUpgrade] = useState(null); // { planId, planName }

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

      if (orderData.test_mode || !window.Razorpay) {
        await finish({
          razorpay_payment_id: `pay_test_${Date.now()}`,
          razorpay_order_id: orderData.order_id,
          razorpay_signature: 'test_signature',
          pack_id: pack.id,
        });
      } else {
        const rzp = new window.Razorpay({
          key: orderData.key,
          order_id: orderData.order_id,
          amount: orderData.amount,
          currency: orderData.currency || 'INR',
          name: 'OpenI Hub',
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
      } else {
        // New subscription OR plan change — standard createOrder
        orderData = await subscriptionAPI.createOrder({ plan_id: planId, billing_cycle: cycle });
      }

      if (orderData.test_mode || !window.Razorpay) {
        // Test mode or no Razorpay SDK — simulate payment
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
      } else {
        // Real Razorpay checkout
        const rzp = new window.Razorpay({
          key: orderData.key,
          order_id: orderData.order_id,
          amount: orderData.amount,
          currency: orderData.currency || 'INR',
          name: 'OpenI Hub',
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

  const saveProfile = async () => {
    if (!name.trim()) return toast.error('Name is required');
    setSaving(true);
    try {
      const res = await authAPI.updateProfile({
        name: name.trim(),
        preferred_currency: preferredCurrency,
      });
      // Update localStorage
      const stored = JSON.parse(localStorage.getItem('openi_user') || '{}');
      stored.name = res.user?.name || name.trim();
      stored.preferred_currency = res.user?.preferred_currency || preferredCurrency;
      localStorage.setItem('openi_user', JSON.stringify(stored));
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
        <div style={{ ...card, padding: 28 }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>Profile Information</h2>

          {/* Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'rgba(213,170,91,0.12)', color: G,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, fontWeight: 700, border: '2px solid rgba(213,170,91,0.3)',
            }}>
              {(name || user?.email)?.[0]?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>{name || user?.email}</div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Shield size={11} color={G} />
                <span style={{ textTransform: 'capitalize' }}>{user?.role || 'User'}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#444', marginBottom: 6 }}>Full Name</label>
              <input value={name} onChange={e => setName(e.target.value)} style={{
                width: '100%', boxSizing: 'border-box', padding: '10px 14px',
                background: '#fafafa', border: '1.5px solid #e0e0e0', borderRadius: 9,
                fontSize: 14, outline: 'none', color: '#1a1a1a', transition: 'border-color 0.15s',
              }}
                onFocus={e => e.target.style.borderColor = G}
                onBlur={e => e.target.style.borderColor = '#e0e0e0'}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#444', marginBottom: 6 }}>Email</label>
              <div style={{
                padding: '10px 14px', background: '#f5f5f5', border: '1.5px solid #e0e0e0',
                borderRadius: 9, fontSize: 14, color: '#888',
              }}>
                {user?.email} <span style={{ fontSize: 11, color: '#aaa' }}>(cannot be changed)</span>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#444', marginBottom: 6 }}>Role</label>
              <div style={{
                padding: '10px 14px', background: '#f5f5f5', border: '1.5px solid #e0e0e0',
                borderRadius: 9, fontSize: 14, color: '#888', textTransform: 'capitalize',
              }}>
                {user?.role} <span style={{ fontSize: 11, color: '#aaa' }}>(assigned by admin)</span>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#444', marginBottom: 6 }}>Preferred Currency</label>
              <select value={preferredCurrency} onChange={e => setPreferredCurrency(e.target.value)} style={{
                width: '100%', boxSizing: 'border-box', padding: '10px 14px',
                background: '#fafafa', border: '1.5px solid #e0e0e0', borderRadius: 9,
                fontSize: 14, outline: 'none', color: '#1a1a1a', cursor: 'pointer',
              }}>
                <option value="INR">₹ Indian Rupee (INR)</option>
                <option value="USD">$ US Dollar (USD)</option>
              </select>
              <div style={{ fontSize: 11, color: '#888', marginTop: 5 }}>
                Default currency used when creating new programs, batches, and partnerships. Existing records keep their original currency.
              </div>
            </div>
          </div>

          <button onClick={saveProfile} disabled={saving} style={{
            marginTop: 24, padding: '11px 28px', background: saving ? '#ccc' : G, color: '#fff',
            border: 'none', borderRadius: 9, cursor: saving ? 'default' : 'pointer',
            fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: saving ? 'none' : '0 2px 10px rgba(213,170,91,0.3)',
          }}>
            <Save size={14} /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}

      {/* Security Tab */}
      {tab === 'security' && (
        <div style={{ ...card, padding: 28 }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>Change Password</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 400 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#444', marginBottom: 6 }}>Current Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showCurrent ? 'text' : 'password'} value={currentPw} onChange={e => setCurrentPw(e.target.value)}
                  placeholder="Enter current password"
                  style={{
                    width: '100%', boxSizing: 'border-box', padding: '10px 40px 10px 14px',
                    background: '#fafafa', border: '1.5px solid #e0e0e0', borderRadius: 9,
                    fontSize: 14, outline: 'none', color: '#1a1a1a',
                  }}
                />
                <button onClick={() => setShowCurrent(!showCurrent)} style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: 4,
                }}>
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#444', marginBottom: 6 }}>New Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showNew ? 'text' : 'password'} value={newPw} onChange={e => setNewPw(e.target.value)}
                  placeholder="Min 6 characters"
                  style={{
                    width: '100%', boxSizing: 'border-box', padding: '10px 40px 10px 14px',
                    background: '#fafafa', border: '1.5px solid #e0e0e0', borderRadius: 9,
                    fontSize: 14, outline: 'none', color: '#1a1a1a',
                  }}
                />
                <button onClick={() => setShowNew(!showNew)} style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: 4,
                }}>
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#444', marginBottom: 6 }}>Confirm New Password</label>
              <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                placeholder="Repeat new password"
                style={{
                  width: '100%', boxSizing: 'border-box', padding: '10px 14px',
                  background: '#fafafa', border: '1.5px solid #e0e0e0', borderRadius: 9,
                  fontSize: 14, outline: 'none', color: '#1a1a1a',
                }}
              />
              {confirmPw && newPw !== confirmPw && (
                <div style={{ fontSize: 11, color: '#dc2626', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <AlertCircle size={11} /> Passwords do not match
                </div>
              )}
              {confirmPw && newPw === confirmPw && newPw.length >= 6 && (
                <div style={{ fontSize: 11, color: '#16a34a', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CheckCircle2 size={11} /> Passwords match
                </div>
              )}
            </div>
          </div>

          <button onClick={changePassword} disabled={changingPw} style={{
            marginTop: 24, padding: '11px 28px',
            background: changingPw ? '#ccc' : '#1a1a1a', color: '#fff',
            border: 'none', borderRadius: 9, cursor: changingPw ? 'default' : 'pointer',
            fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <Lock size={14} /> {changingPw ? 'Changing...' : 'Change Password'}
          </button>

          {/* MFA Section — Phase 54 */}
          <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid #eee' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>Multi-Factor Authentication (TOTP)</h3>

            {!mfaStatus && <div style={{ fontSize: 12, color: '#666' }}>Loading…</div>}

            {mfaStatus?.bypass && (
              <div style={{ padding: '12px 16px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 12, color: '#555' }}>
                This account is in the demo/admin bypass list — MFA is never enforced on login. Enrollment is disabled.
              </div>
            )}

            {!mfaStatus?.bypass && mfaStatus?.enabled && !showMfaDisable && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: '#f0fdf4', borderRadius: 10, border: '1px solid #bbf7d0', marginBottom: 12 }}>
                  <CheckCircle2 size={18} color="#16a34a" />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#16a34a' }}>MFA enabled</div>
                    <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>Enrolled {mfaStatus.enrolled_at ? new Date(mfaStatus.enrolled_at).toLocaleDateString() : ''}</div>
                  </div>
                </div>
                <button onClick={() => setShowMfaDisable(true)} style={{ padding: '8px 14px', background: '#fff', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  Disable MFA
                </button>
              </div>
            )}

            {!mfaStatus?.bypass && mfaStatus?.enabled && showMfaDisable && (
              <form onSubmit={handleMfaDisable} style={{ padding: 16, border: '1px solid #fecaca', borderRadius: 10, background: '#fef2f2' }}>
                <div style={{ fontSize: 13, color: '#b91c1c', marginBottom: 12, fontWeight: 600 }}>Confirm disable — requires password + current MFA code</div>
                <input type="password" placeholder="Current password" value={mfaDisablePw} onChange={e => setMfaDisablePw(e.target.value)} style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 8, marginBottom: 8, fontSize: 13 }} />
                <input type="text" placeholder="6-digit code" value={mfaCode} onChange={e => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))} maxLength={6} style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 8, marginBottom: 12, fontSize: 13, letterSpacing: 4, textAlign: 'center' }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="submit" disabled={mfaBusy} style={{ flex: 1, padding: 10, background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: mfaBusy ? 'wait' : 'pointer' }}>
                    {mfaBusy ? 'Disabling…' : 'Disable MFA'}
                  </button>
                  <button type="button" onClick={() => { setShowMfaDisable(false); setMfaCode(''); setMfaDisablePw(''); }} style={{ padding: '10px 14px', background: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                </div>
              </form>
            )}

            {!mfaStatus?.bypass && mfaStatus && !mfaStatus.enabled && !mfaSetup && (
              <div>
                <div style={{ padding: '12px 16px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, fontSize: 12, color: '#92400e', marginBottom: 12 }}>
                  MFA is <strong>not enabled</strong>. We strongly recommend enrolling an authenticator app (Google Authenticator, 1Password, Authy).
                </div>
                <button onClick={handleMfaSetupStart} disabled={mfaBusy} style={{ padding: '10px 18px', background: G, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: mfaBusy ? 'wait' : 'pointer' }}>
                  {mfaBusy ? 'Starting…' : 'Enable MFA'}
                </button>
              </div>
            )}

            {!mfaStatus?.bypass && mfaSetup && (
              <form onSubmit={handleMfaEnable} style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 10, background: '#fafafa' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', marginBottom: 8 }}>1. Scan this QR with your authenticator app</div>
                <div style={{ textAlign: 'center', marginBottom: 12 }}>
                  <img src={mfaSetup.qr_data_url} alt="MFA QR" style={{ width: 180, height: 180 }} />
                </div>
                <div style={{ fontSize: 11, color: '#666', marginBottom: 8 }}>Or enter this secret manually:</div>
                <div style={{ fontFamily: 'monospace', fontSize: 12, padding: 8, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, marginBottom: 12, wordBreak: 'break-all' }}>{mfaSetup.secret_base32}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', marginBottom: 8 }}>2. Enter the current 6-digit code to confirm</div>
                <input type="text" inputMode="numeric" placeholder="123456" value={mfaCode} onChange={e => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))} maxLength={6} style={{ width: '100%', padding: 12, border: '1px solid #ddd', borderRadius: 8, marginBottom: 12, fontSize: 16, letterSpacing: 6, textAlign: 'center' }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="submit" disabled={mfaBusy || mfaCode.length < 6} style={{ flex: 1, padding: 10, background: mfaCode.length < 6 ? '#ccc' : '#16a34a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: (mfaBusy || mfaCode.length < 6) ? 'default' : 'pointer' }}>
                    {mfaBusy ? 'Verifying…' : 'Confirm & Enable'}
                  </button>
                  <button type="button" onClick={() => { setMfaSetup(null); setMfaCode(''); }} style={{ padding: '10px 14px', background: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Billing Tab */}
      {tab === 'billing' && (() => {
        if (!myPlan && !billingLoading) loadBilling();
        const currentPlan = myPlan?.plan_name || user?.current_plan || 'free';
        const planFeatures = myPlan?.plan?.features || {};
        const usage = myPlan?.usage || {};

        return (
          <div>
            {billingLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Loader2 size={28} className="animate-spin" style={{ color: G }} /></div>
            ) : (
              <>
                {/* Current Plan */}
                <div style={{ ...card, padding: 24, marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 11, color: '#999', marginBottom: 2 }}>Current Plan</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: 8 }}>
                        {currentPlan === 'enterprise' ? <Crown size={20} style={{ color: '#f59e0b' }} /> : currentPlan === 'pro' ? <Zap size={20} style={{ color: G }} /> : null}
                        {myPlan?.plan?.display_name || 'Free Plan'}
                      </div>
                    </div>
                    {currentPlan !== 'free' && myPlan?.subscription && (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 11, color: '#999' }}>Next billing</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>
                          {myPlan.subscription.current_period_end ? new Date(myPlan.subscription.current_period_end).toLocaleDateString() : '—'}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Usage Meters (monthly counters only) */}
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 }}>Usage This Month</h3>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {USAGE_FEATURES.map(feature => {
                      const limit = planFeatures[feature];
                      if (limit === undefined || limit === null) return null;
                      const used = usage[feature] || 0;
                      const isUnlimited = limit === -1;
                      const pct = isUnlimited ? 10 : (limit > 0 ? Math.min((used / limit) * 100, 100) : 0);
                      const isNearLimit = !isUnlimited && limit > 0 && used >= limit * 0.8;
                      return (
                        <div key={feature}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#555', marginBottom: 3 }}>
                            <span>{FEATURE_LABELS[feature] || feature}</span>
                            <span style={{ fontWeight: 600, color: isNearLimit ? '#dc2626' : '#333' }}>
                              {used} / {isUnlimited ? '∞' : limit}
                            </span>
                          </div>
                          <div style={{ height: 6, borderRadius: 3, background: '#f3f4f6' }}>
                            <div style={{ height: '100%', borderRadius: 3, width: `${pct}%`,
                              background: isUnlimited ? '#16a34a' : isNearLimit ? '#dc2626' : pct > 50 ? '#f59e0b' : '#16a34a',
                              transition: 'width 0.3s' }} />
                          </div>
                        </div>
                      );
                    })}
                    {/* AI Ask daily quota */}
                    {planFeatures.ai_search_daily_cap !== undefined && (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#555', marginBottom: 3 }}>
                          <span>AI Ask (today)</span>
                          <span style={{ fontWeight: 600, color: planFeatures.ai_search_daily_cap === 0 ? '#999' : '#333' }}>
                            {planFeatures.ai_search_daily_cap === 0 ? 'Locked' : planFeatures.ai_search_daily_cap === -1 ? 'Unlimited' : `${usage['ai_search'] || 0} / ${planFeatures.ai_search_daily_cap}/day`}
                          </span>
                        </div>
                        {planFeatures.ai_search_daily_cap > 0 && (
                          <div style={{ height: 6, borderRadius: 3, background: '#f3f4f6' }}>
                            <div style={{ height: '100%', borderRadius: 3, width: `${Math.min(((usage['ai_search'] || 0) / planFeatures.ai_search_daily_cap) * 100, 100)}%`, background: '#D5AA5B', transition: 'width 0.3s' }} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Feature Access (boolean flags) */}
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 8, marginTop: 16 }}>Feature Access</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {BOOLEAN_FEATURES.map(feature => {
                      const enabled = planFeatures[feature] === true;
                      return (
                        <div key={feature} style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, color: enabled ? '#16a34a' : '#999' }}>
                          <span style={{ fontSize: 14 }}>{enabled ? '✓' : '✗'}</span>
                          {FEATURE_LABELS[feature] || feature}
                        </div>
                      );
                    })}
                  </div>

                  {/* AI Consumption (Phase 25 — for paid users) */}
                  {currentPlan !== 'free' && myPlan?.ai_consumption && (
                    <div style={{ marginTop: 16, padding: 12, background: '#fffbeb', borderRadius: 10, border: '1px solid #fde68a' }}>
                      <h3 style={{ fontSize: 12, fontWeight: 700, color: '#92400e', marginBottom: 8 }}>AI Usage This Month</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>{myPlan.ai_consumption.queries_this_month || 0}</div>
                          <div style={{ fontSize: 10, color: '#888' }}>Queries</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>{((myPlan.ai_consumption.tokens_this_month || 0) / 1000).toFixed(1)}K</div>
                          <div style={{ fontSize: 10, color: '#888' }}>Tokens</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>${(myPlan.ai_consumption.cost_this_month_usd || 0).toFixed(4)}</div>
                          <div style={{ fontSize: 10, color: '#888' }}>Est. Cost</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentPlan !== 'free' && (
                    <button onClick={handleCancel} style={{ marginTop: 16, fontSize: 12, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}>
                      Cancel subscription
                    </button>
                  )}
                </div>

                {/* Billing Details (Phase 60.11) — required for GST-compliant invoices */}
                <div style={{ ...card, padding: 24, marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>Billing Details</h3>
                      <p style={{ fontSize: 12, color: '#888', margin: '3px 0 0 0' }}>
                        Required on every GST tax invoice. Your saved details are reused for all future payments.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setBillingModalOpen(true)}
                      style={{
                        padding: '8px 16px', borderRadius: 10, border: '1px solid #e5e7eb',
                        background: '#fff', color: '#374151', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                      }}
                    >
                      {billingAddress ? 'Edit' : 'Add Billing Details'}
                    </button>
                  </div>
                  {billingAddress ? (
                    <div style={{ marginTop: 8, fontSize: 13, color: '#374151', lineHeight: 1.6 }}>
                      <div style={{ fontWeight: 600, color: '#1a1a1a' }}>{billingAddress.legal_name}</div>
                      <div>{billingAddress.line1}</div>
                      {billingAddress.line2 && <div>{billingAddress.line2}</div>}
                      <div>
                        {[billingAddress.city, billingAddress.state, billingAddress.postal_code].filter(Boolean).join(', ')}
                      </div>
                      <div>{billingAddress.country}</div>
                      {billingAddress.gstin && (
                        <div style={{ marginTop: 4, fontFamily: 'monospace', fontSize: 12, color: '#6b7280' }}>
                          GSTIN: {billingAddress.gstin}
                        </div>
                      )}
                      {String(billingAddress.country || '').toLowerCase() !== 'india' && (
                        <div style={{
                          marginTop: 10, padding: '8px 12px', borderRadius: 8,
                          background: '#fef9c3', border: '1px solid #fde68a',
                          color: '#854d0e', fontSize: 12, lineHeight: 1.5,
                        }}>
                          International billing — invoices show the export-under-LUT declaration; GST is not collected.
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{
                      marginTop: 8, padding: '12px 14px', borderRadius: 10,
                      background: '#fef3c7', border: '1px solid #fde68a',
                      color: '#92400e', fontSize: 13, lineHeight: 1.5,
                    }}>
                      No billing details on file. You'll be prompted to add them the first time you upgrade.
                    </div>
                  )}
                </div>

                {/* AI Credit Packs (Phase 26) */}
                <div id="credits" style={{ ...card, padding: 24, marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Zap size={16} style={{ color: G }} />
                        AI Credit Packs
                      </h3>
                      <p style={{ fontSize: 12, color: '#888', margin: '3px 0 0 0' }}>
                        Top up extra AI credits that never expire. Used after your monthly quota runs out.
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: '#999' }}>Your balance</div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: creditBalance > 0 ? G : '#aaa' }}>
                        {creditBalance ?? 0} <span style={{ fontSize: 11, fontWeight: 400, color: '#888' }}>credits</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(creditPacks.length || 1, 3)}, 1fr)`, gap: 12, marginTop: 14 }}>
                    {creditPacks.map(pack => {
                      const isBestValue = creditPacks.length > 0 && pack.price_per_credit === Math.min(...creditPacks.map(x => x.price_per_credit));
                      const isBuying = buyingPackId === pack.id;
                      return (
                        <div key={pack.id} style={{ border: isBestValue ? `2px solid ${G}` : '1px solid #eee', borderRadius: 12, padding: 16, position: 'relative', background: isBestValue ? '#fffbeb' : '#fff' }}>
                          {isBestValue && <div style={{ position: 'absolute', top: -9, right: 12, fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: G, color: '#fff', letterSpacing: 0.4 }}>BEST VALUE</div>}
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 2 }}>{pack.name}</div>
                          <div style={{ fontSize: 20, fontWeight: 700, color: G, marginBottom: 2 }}>₹{pack.price_inr}</div>
                          <div style={{ fontSize: 11, color: '#666', marginBottom: 8 }}>
                            <strong style={{ color: '#1a1a1a' }}>{pack.credits}</strong> credits · ₹{pack.price_per_credit}/credit
                          </div>
                          <p style={{ fontSize: 11, color: '#777', margin: '4px 0 12px 0', minHeight: 28 }}>
                            {pack.description}
                          </p>
                          <button
                            onClick={() => handleBuyCredits(pack)}
                            disabled={isBuying || buyingPackId !== null}
                            style={{
                              width: '100%', padding: '8px 12px', borderRadius: 8,
                              background: isBuying || buyingPackId !== null ? '#ddd' : G,
                              color: '#fff', border: 'none', fontSize: 12, fontWeight: 600,
                              cursor: isBuying || buyingPackId !== null ? 'not-allowed' : 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                            }}
                          >
                            {isBuying ? <><Loader2 size={11} className="animate-spin" /> Processing…</> : 'Buy'}
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {creditPurchases.length > 0 && (
                    <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #f3f4f6' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#666', marginBottom: 6 }}>Recent purchases</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {creditPurchases.slice(0, 5).map(p => (
                          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#666' }}>
                            <span>{p.pack_name || `${p.credits} credits`} · {new Date(p.created_at).toLocaleDateString()}</span>
                            <span style={{
                              fontWeight: 600,
                              color: p.status === 'paid' ? '#16a34a' : p.status === 'failed' ? '#dc2626' : '#999',
                            }}>
                              {p.status === 'paid' ? `+${p.credits} · ₹${p.amount_inr}` : p.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Plan Comparison (anchor for ?focus=plans deep links) */}
                <div ref={plansAnchorRef} id="plans" style={{ ...card, padding: 24, scrollMarginTop: 80 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 16 }}>Plans</h3>
                  {/* Phase 70: rank-aware plan comparison.
                     Plan rank lets the comparison tell upgrade from downgrade
                     correctly. Free=0, mid tier=1 (provider_growth, seeker_pro,
                     legacy "pro"), top tier=2 (seeker_enterprise, legacy
                     "enterprise"). Anything unknown sorts to 0 so the user
                     never gets a misleading Upgrade prompt. */}
                  {(() => null)()}

                  {/* A.5: Monthly/Annual toggle pill */}
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
                    <div style={{ display: 'inline-flex', background: '#f3f4f6', borderRadius: 999, padding: 4, position: 'relative' }}>
                      <button onClick={() => setBillingCycleSelected('monthly')}
                        style={{
                          padding: '8px 22px', fontSize: 13, fontWeight: 600, borderRadius: 999, border: 'none',
                          background: billingCycleSelected === 'monthly' ? '#fff' : 'transparent',
                          color: billingCycleSelected === 'monthly' ? '#1a1a1a' : '#888',
                          cursor: 'pointer',
                          boxShadow: billingCycleSelected === 'monthly' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                        }}>
                        Monthly
                      </button>
                      <button onClick={() => setBillingCycleSelected('yearly')}
                        style={{
                          padding: '8px 22px', fontSize: 13, fontWeight: 600, borderRadius: 999, border: 'none',
                          background: billingCycleSelected === 'yearly' ? '#fff' : 'transparent',
                          color: billingCycleSelected === 'yearly' ? '#1a1a1a' : '#888',
                          cursor: 'pointer', position: 'relative',
                          boxShadow: billingCycleSelected === 'yearly' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                        }}>
                        Annual
                        <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 999, background: '#16a34a', color: '#fff' }}>
                          Save 20%
                        </span>
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                    {plans.map(p => {
                      const isCurrent = p.name === currentPlan;
                      const features = p.features || {};
                      const planRank = (n) => {
                        if (n === 'free') return 0;
                        if (n === 'seeker_enterprise' || n === 'enterprise') return 2;
                        return 1; // provider_growth, seeker_pro, legacy 'pro'
                      };
                      const targetRank = planRank(p.name);
                      const currentRank = planRank(currentPlan);
                      const direction = targetRank > currentRank ? 'upgrade' : targetRank < currentRank ? 'downgrade' : 'same';

                      // Phase 70: feature row rendering — boolean flags should
                      // not show "true/mo" / "false/mo". Tell quota features
                      // (numeric monthly caps) from boolean flags by typeof.
                      const renderFeatureValue = (limit) => {
                        if (limit === -1) return 'Unlimited';
                        if (typeof limit === 'boolean') return limit ? 'Included' : 'Not included';
                        if (typeof limit === 'number') return `${limit}/mo`;
                        // Fallback for unexpected shapes (string, null, undefined): just stringify.
                        return String(limit);
                      };
                      const featureColor = (limit) => {
                        if (typeof limit === 'boolean' && !limit) return '#9ca3af';
                        return '#16a34a';
                      };
                      const FeatureIcon = (limit) =>
                        typeof limit === 'boolean' && !limit ? X : Check;

                      return (
                        <div key={p.id} style={{ border: isCurrent ? `2px solid ${G}` : '1px solid #eee', borderRadius: 14, padding: 20, background: isCurrent ? '#fffbeb' : '#fff', position: 'relative' }}>
                          {isCurrent && <div style={{ position: 'absolute', top: -10, right: 14, fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 20, background: G, color: '#fff' }}>Current</div>}
                          <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>{p.display_name}</div>
                          {/* A.5: cycle-aware price display */}
                          {(() => {
                            const isAnnual = billingCycleSelected === 'yearly';
                            const basePrice = isAnnual ? parseFloat(p.price_yearly || 0) : parseFloat(p.price_monthly || 0);
                            const monthlyEquiv = isAnnual && basePrice > 0 ? basePrice / 12 : null;
                            const monthlyFull = parseFloat(p.price_monthly || 0);
                            const yearlyFull = monthlyFull * 12;
                            const annualSavings = yearlyFull > 0 ? yearlyFull - parseFloat(p.price_yearly || 0) : 0;
                            return (
                              <>
                                <div style={{ fontSize: 22, fontWeight: 700, color: G, marginBottom: 4 }}>
                                  {basePrice === 0 ? 'Free' : `₹${parseInt(basePrice).toLocaleString('en-IN')}`}
                                  {basePrice > 0 && (
                                    <span style={{ fontSize: 12, fontWeight: 400, color: '#999' }}>
                                      {isAnnual ? '/yr' : '/mo'}
                                    </span>
                                  )}
                                </div>
                                {isAnnual && monthlyEquiv > 0 && (
                                  <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>
                                    ≈ ₹{Math.round(monthlyEquiv).toLocaleString('en-IN')}/mo equivalent
                                  </div>
                                )}
                                {isAnnual && annualSavings > 0 && (
                                  <div style={{ fontSize: 11, fontWeight: 600, color: '#16a34a', marginBottom: 4 }}>
                                    Save ₹{Math.round(annualSavings).toLocaleString('en-IN')}/year
                                  </div>
                                )}
                                {basePrice > 0 && (
                                  <div style={{ fontSize: 11, fontWeight: 500, color: '#999', marginBottom: 12 }}>
                                    + 18% GST · ₹{(basePrice * 1.18).toLocaleString('en-IN', { maximumFractionDigits: 2 })} total
                                  </div>
                                )}
                              </>
                            );
                          })()}
                          <div style={{ display: 'grid', gap: 6, marginBottom: 16 }}>
                            {Object.entries(features).map(([f, limit]) => {
                              const Icon = FeatureIcon(limit);
                              return (
                                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#555' }}>
                                  <Icon size={12} style={{ color: featureColor(limit) }} />
                                  {FEATURE_LABELS[f] || f}: {renderFeatureValue(limit)}
                                </div>
                              );
                            })}
                          </div>
                          {/* Direction-aware action button */}
                          {!isCurrent && direction === 'upgrade' && (
                            <button onClick={() => handleUpgrade(p.id, p.display_name)} disabled={upgrading}
                              style={{ width: '100%', padding: '10px 16px', fontSize: 13, fontWeight: 600, borderRadius: 10,
                                background: G, color: '#fff', border: 'none', cursor: upgrading ? 'wait' : 'pointer' }}>
                              {/* A.5: cycle-aware upgrade button */}
                              {upgrading ? 'Processing...' : `Upgrade to ${p.display_name} (${billingCycleSelected === 'yearly' ? 'Annual' : 'Monthly'})`}
                            </button>
                          )}
                          {!isCurrent && direction === 'downgrade' && p.name === 'free' && (
                            <button onClick={handleCancel}
                              style={{ width: '100%', padding: '10px 16px', fontSize: 13, fontWeight: 600, borderRadius: 10,
                                background: '#fff', color: '#666', border: '1px solid #ddd', cursor: 'pointer' }}>
                              Downgrade to Free
                            </button>
                          )}
                          {!isCurrent && direction === 'downgrade' && p.name !== 'free' && (
                            // Mid-tier downgrade from a top-tier plan (eg Enterprise → Pro).
                            // The current backend has no direct mid-tier downgrade endpoint,
                            // so route the user to a contact link rather than firing a
                            // misleading "Upgrade" CTA. Plain neutral button.
                            <a
                              href={`mailto:support@openi.ai?subject=Downgrade%20request%20to%20${encodeURIComponent(p.display_name)}&body=I%20would%20like%20to%20downgrade%20my%20OpenI%20Hub%20subscription%20from%20${encodeURIComponent(myPlan?.plan?.display_name || currentPlan)}%20to%20${encodeURIComponent(p.display_name)}.`}
                              style={{ width: '100%', display: 'block', textAlign: 'center', textDecoration: 'none', padding: '10px 16px', fontSize: 13, fontWeight: 600, borderRadius: 10,
                                background: '#fff', color: '#666', border: '1px solid #ddd', cursor: 'pointer' }}>
                              Downgrade to {p.display_name}
                            </a>
                          )}
                          {isCurrent && (
                            <div style={{ textAlign: 'center', fontSize: 12, color: G, fontWeight: 600 }}>Your current plan</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Payment History */}
                {(myPlan?.payments || []).length > 0 && (
                  <div style={{ ...card, padding: 24, marginTop: 16 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 }}>Payment History</h3>
                    <div style={{ display: 'grid', gap: 8 }}>
                      {(myPlan.payments || []).map(p => (
                        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f5f5f5', fontSize: 12 }}>
                          <div>
                            <div style={{ fontWeight: 600, color: '#333' }}>₹{parseInt(p.amount)}</div>
                            <div style={{ fontSize: 11, color: '#999' }}>{new Date(p.created_at).toLocaleDateString()}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                              background: p.status === 'captured' ? '#f0fdf4' : p.status === 'failed' ? '#fef2f2' : '#fefce8',
                              color: p.status === 'captured' ? '#16a34a' : p.status === 'failed' ? '#dc2626' : '#ca8a04' }}>
                              {p.status === 'captured' ? 'Paid' : p.status}
                            </span>
                            {p.status === 'captured' && (
                              <button onClick={async () => {
                                try {
                                  const blob = await subscriptionAPI.downloadInvoice(p.id);
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement('a'); a.href = url; a.download = `OpenI-Invoice-${p.id}.pdf`;
                                  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
                                } catch (err) { toast.error('Failed to download invoice'); }
                              }} title="Download GST Invoice (PDF)"
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 4,
                                  background: '#fff', border: `1px solid ${G}`, color: G,
                                  fontSize: 11, fontWeight: 600, padding: '4px 10px',
                                  borderRadius: 6, cursor: 'pointer',
                                }}>
                                <Download size={12} />
                                <span>Invoice</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        );
      })()}

      {/* Notifications Tab */}
      {tab === 'notifications' && (
        <div style={{ ...card, padding: 28 }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>Notification Preferences</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { label: 'Email Notifications', desc: 'Receive updates via email for evaluations, feedback, and events', value: emailNotif, toggle: setEmailNotif },
              { label: 'Push Notifications', desc: 'Browser push notifications for messages and alerts', value: pushNotif, toggle: setPushNotif },
            ].map(({ label, desc, value, toggle }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', background: '#fafafa', borderRadius: 10, border: '1px solid #f0f0f0' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>{label}</div>
                  <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{desc}</div>
                </div>
                <button onClick={() => toggle(!value)} style={{
                  width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: value ? G : '#e0e0e0', position: 'relative', transition: 'background 0.2s',
                }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%', background: '#fff',
                    position: 'absolute', top: 3, left: value ? 23 : 3,
                    transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }} />
                </button>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24, padding: '14px 18px', background: '#fff8ec', borderRadius: 10, border: '1px solid rgba(213,170,91,0.3)', fontSize: 12, color: '#888' }}>
            <strong style={{ color: G }}>Note:</strong> Notification preferences are stored locally and will be synced to the server in a future update.
          </div>
        </div>
      )}

      {/* Account Info */}
      <div style={{ ...card, padding: 20, marginTop: 20 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>Account Information</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { label: 'User ID', value: user?.id || '—' },
            { label: 'Role', value: user?.role || '—' },
            { label: 'Email', value: user?.email || '—' },
            { label: 'Platform', value: 'OpenI Hub v1.0' },
          ].map(({ label, value }) => (
            <div key={label} style={{ padding: '8px 0' }}>
              <div style={{ fontSize: 10, color: '#aaa', marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 12, color: '#1a1a1a', fontWeight: 500, textTransform: label === 'Role' ? 'capitalize' : 'none' }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

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
