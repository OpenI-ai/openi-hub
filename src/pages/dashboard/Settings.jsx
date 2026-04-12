import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authAPI, subscriptionAPI } from '../../services/api';
import toast from 'react-hot-toast';
import {
  User, Mail, Shield, Lock, Save, Eye, EyeOff,
  CheckCircle2, AlertCircle, Bell, Moon, Sun,
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
  challenge_create: 'Challenges Created',
  application_submit: 'Applications Submitted',
  meeting_create: 'Meetings Scheduled',
  file_upload: 'Files Uploaded',
  ai_search_daily_cap: 'AI Ask (daily)',
  semantic_search: 'Semantic Search',
  can_access_portfolio_health: 'Portfolio Health',
  can_access_deal_pipeline: 'Deal Pipeline',
  can_access_service_partners: 'Service Partners',
  rich_profile_sections_unlocked: 'Rich Profile Sections',
  multi_currency_enabled: 'Multi-Currency',
  can_create_programs_batches: 'Programs & Batches',
  eight_vector_evaluation: '8-Vector Evaluation',
};
// Features that are boolean flags (not counted usage)
const BOOLEAN_FEATURES = ['semantic_search', 'can_access_portfolio_health', 'can_access_deal_pipeline', 'can_access_service_partners', 'rich_profile_sections_unlocked', 'multi_currency_enabled', 'can_create_programs_batches', 'eight_vector_evaluation'];
const USAGE_FEATURES = ['challenge_create', 'application_submit', 'meeting_create', 'file_upload'];

export default function Settings() {
  const { user, logout, updateUser } = useAuth();
  const [tab, setTab] = useState('profile');

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

  const loadBilling = async () => {
    setBillingLoading(true);
    try {
      const [plansData, myData] = await Promise.all([
        subscriptionAPI.getPlans(),
        subscriptionAPI.getMyPlan(),
      ]);
      setPlans(plansData.plans || []);
      setMyPlan(myData);
    } catch (err) { toast.error('Failed to load billing info'); }
    finally { setBillingLoading(false); }
  };

  const handleUpgrade = async (planId, planName) => {
    setUpgrading(true);
    try {
      const orderData = await subscriptionAPI.createOrder({ plan_id: planId, billing_cycle: 'monthly' });

      if (orderData.test_mode || !window.Razorpay) {
        // Test mode or no Razorpay SDK — simulate payment
        const result = await subscriptionAPI.verifyPayment({
          razorpay_payment_id: `pay_test_${Date.now()}`,
          razorpay_order_id: orderData.order_id,
          razorpay_signature: 'test_signature',
          plan_id: planId,
          billing_cycle: 'monthly',
        });
        if (result.success) {
          toast.success(`Upgraded to ${result.display_name}!`);
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
          description: `${planName} - Monthly`,
          prefill: { email: user?.email, name: user?.name },
          handler: async (response) => {
            try {
              const result = await subscriptionAPI.verifyPayment({
                ...response,
                plan_id: planId,
                billing_cycle: 'monthly',
              });
              if (result.success) {
                toast.success(`Upgraded to ${result.display_name}!`);
                updateUser({ current_plan: result.plan });
                loadBilling();
              }
            } catch (err) { toast.error(err.message); }
          },
          theme: { color: G },
        });
        rzp.open();
      }
    } catch (err) { toast.error(err.message); }
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

          {/* MFA Section */}
          <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid #eee' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>Multi-Factor Authentication</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: '#f0fdf4', borderRadius: 10, border: '1px solid #bbf7d0' }}>
              <CheckCircle2 size={18} color="#16a34a" />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#16a34a' }}>MFA Enabled</div>
                <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>OTP-based verification is active on your account</div>
              </div>
            </div>
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

                  {currentPlan !== 'free' && (
                    <button onClick={handleCancel} style={{ marginTop: 16, fontSize: 12, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}>
                      Cancel subscription
                    </button>
                  )}
                </div>

                {/* Plan Comparison */}
                <div style={{ ...card, padding: 24 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 16 }}>Plans</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                    {plans.map(p => {
                      const isCurrent = p.name === currentPlan;
                      const features = p.features || {};
                      return (
                        <div key={p.id} style={{ border: isCurrent ? `2px solid ${G}` : '1px solid #eee', borderRadius: 14, padding: 20, background: isCurrent ? '#fffbeb' : '#fff', position: 'relative' }}>
                          {isCurrent && <div style={{ position: 'absolute', top: -10, right: 14, fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 20, background: G, color: '#fff' }}>Current</div>}
                          <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>{p.display_name}</div>
                          <div style={{ fontSize: 22, fontWeight: 700, color: G, marginBottom: 12 }}>
                            {parseFloat(p.price_monthly) === 0 ? 'Free' : `₹${parseInt(p.price_monthly)}`}
                            {parseFloat(p.price_monthly) > 0 && <span style={{ fontSize: 12, fontWeight: 400, color: '#999' }}>/mo</span>}
                          </div>
                          <div style={{ display: 'grid', gap: 6, marginBottom: 16 }}>
                            {Object.entries(features).map(([f, limit]) => (
                              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#555' }}>
                                <Check size={12} style={{ color: '#16a34a' }} />
                                {FEATURE_LABELS[f] || f}: {limit === -1 ? 'Unlimited' : `${limit}/mo`}
                              </div>
                            ))}
                          </div>
                          {!isCurrent && p.name !== 'free' && (
                            <button onClick={() => handleUpgrade(p.id, p.display_name)} disabled={upgrading}
                              style={{ width: '100%', padding: '10px 16px', fontSize: 13, fontWeight: 600, borderRadius: 10,
                                background: G, color: '#fff', border: 'none', cursor: upgrading ? 'wait' : 'pointer' }}>
                              {upgrading ? 'Processing...' : `Upgrade to ${p.display_name}`}
                            </button>
                          )}
                          {!isCurrent && p.name === 'free' && currentPlan !== 'free' && (
                            <button onClick={handleCancel}
                              style={{ width: '100%', padding: '10px 16px', fontSize: 13, fontWeight: 600, borderRadius: 10,
                                background: '#fff', color: '#666', border: '1px solid #ddd', cursor: 'pointer' }}>
                              Downgrade to Free
                            </button>
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
                              }} title="Download Invoice"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: G }}>
                                <Download size={13} />
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
    </div>
  );
}
