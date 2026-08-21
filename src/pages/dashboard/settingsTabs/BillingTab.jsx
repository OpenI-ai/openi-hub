/**
 * BillingTab - extracted from Settings.jsx (Phase 166 / W5-3).
 * The body between the sentinels is a VERBATIM slice of the pre-split file,
 * original lines 833-1320 of 1507. Nothing inside was reformatted or reindented.
 * Props are the exact set of parent-scope names the slice referenced - they are
 * computed from the slice, never hand-listed, so the signature cannot drift from
 * the call site. Long prop lists are deliberate: grouping them into state/actions
 * objects would force rewriting the body and destroy the verbatim property.
 */
import { G, card, FEATURE_LABELS, BOOLEAN_FEATURES, USAGE_FEATURES } from './constants';
import { Loader2, Check, Crown, Zap, X, Download } from 'lucide-react';
import { subscriptionAPI } from '../../../services/api';
import toast from 'react-hot-toast';

export default function BillingTab({ autoRenewSelected, billingAddress, billingCycleSelected, billingLoading, buyingPackId, creditBalance, creditPacks, creditPurchases, displayCurrency, handleBuyCredits, handleCancel, handleToggleAutoRenew, handleUpgrade, loadBilling, myPlan, plans, plansAnchorRef, setAutoRenewSelected, setBillingCycleSelected, setBillingModalOpen, togglingAutoRenew, upgrading, user }) {
  // ---- BODY START (original lines 833-1320) ----
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
                <div id="tour-page-settings-current-plan" style={{ ...card, padding: 24, marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 11, color: '#666', marginBottom: 2 }}>Current Plan</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: 8 }}>
                        {currentPlan === 'enterprise' ? <Crown size={20} style={{ color: '#f59e0b' }} /> : currentPlan === 'pro' ? <Zap size={20} style={{ color: G }} /> : null}
                        {myPlan?.plan?.display_name || 'Free Plan'}
                      </div>
                    </div>
                    {currentPlan !== 'free' && myPlan?.subscription && (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 11, color: '#666' }}>
                          {myPlan.subscription.auto_renew ? 'Next auto-charge' : 'Next billing'}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>
                          {myPlan.subscription.current_period_end ? new Date(myPlan.subscription.current_period_end).toLocaleDateString() : '—'}
                        </div>
                        {/* Phase 123 — recurring auto-renew status + opt-out */}
                        {myPlan.subscription.auto_renew ? (
                          <>
                            <div style={{ fontSize: 11, fontWeight: 600, color: '#16a34a', marginTop: 4 }}>
                              Auto-renew is ON
                            </div>
                            <button onClick={handleToggleAutoRenew} disabled={togglingAutoRenew}
                              style={{ marginTop: 4, fontSize: 11, color: '#dc2626', background: 'none', border: 'none', cursor: togglingAutoRenew ? 'wait' : 'pointer', textDecoration: 'underline' }}>
                              {togglingAutoRenew ? 'Turning off…' : 'Turn off auto-renew'}
                            </button>
                          </>
                        ) : null}
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
                            <div style={{ height: '100%', borderRadius: 3, width: `${Math.min(((usage['ai_search'] || 0) / planFeatures.ai_search_daily_cap) * 100, 100)}%`, background: '#D0A848', transition: 'width 0.3s' }} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Feature Access (boolean flags) */}
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 8, marginTop: 16 }}>Feature Access</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 6 }}>
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
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8 }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>{myPlan.ai_consumption.queries_this_month || 0}</div>
                          <div style={{ fontSize: 10, color: '#5c5c5c' }}>Queries</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>{((myPlan.ai_consumption.tokens_this_month || 0) / 1000).toFixed(1)}K</div>
                          <div style={{ fontSize: 10, color: '#5c5c5c' }}>Tokens</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>${(myPlan.ai_consumption.cost_this_month_usd || 0).toFixed(4)}</div>
                          <div style={{ fontSize: 10, color: '#5c5c5c' }}>Est. Cost</div>
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
                      <p style={{ fontSize: 12, color: '#5c5c5c', margin: '3px 0 0 0' }}>
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
                      <p style={{ fontSize: 12, color: '#5c5c5c', margin: '3px 0 0 0' }}>
                        Top up extra AI credits that never expire. Used after your monthly quota runs out.
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: '#666' }}>Your balance</div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: creditBalance > 0 ? G : '#aaa' }}>
                        {creditBalance ?? 0} <span style={{ fontSize: 11, fontWeight: 400, color: '#5c5c5c' }}>credits</span>
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
                          <p style={{ fontSize: 11, color: '#5c5c5c', margin: '4px 0 12px 0', minHeight: 28 }}>
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
                <span id="tour-page-settings-plans-grid" style={{ position: 'absolute' }} />
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
                  <div id="tour-page-settings-cycle" style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
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

                  {/* Phase 123 — self-serve recurring auto-renew opt-in checkbox.
                     Default unchecked; applies to whichever plan card's Upgrade
                     button is clicked next. */}
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#555', cursor: 'pointer' }}>
                      <input type="checkbox" checked={autoRenewSelected}
                        onChange={(e) => setAutoRenewSelected(e.target.checked)}
                        style={{ width: 15, height: 15, cursor: 'pointer', accentColor: G }} />
                      Enable auto-renew (card charged automatically each {billingCycleSelected === 'yearly' ? 'year' : 'month'} — cancel anytime)
                    </label>
                  </div>

                  {/* Mobile Ship 4 (27 May 2026): plan cards stack on mobile */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 14 }}>
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
                          {/* A.5 USD: cycle + currency-aware price */}
                          {(() => {
                            const isAnnual = billingCycleSelected === 'yearly';
                            const isUsd = displayCurrency === 'USD';
                            const priceCol = isUsd
                              ? (isAnnual ? p.price_yearly_usd : p.price_monthly_usd)
                              : (isAnnual ? p.price_yearly : p.price_monthly);
                            const monthlyCol = isUsd ? p.price_monthly_usd : p.price_monthly;
                            const yearlyCol = isUsd ? p.price_yearly_usd : p.price_yearly;
                            const basePrice = parseFloat(priceCol || 0);
                            const monthlyEquiv = isAnnual && basePrice > 0 ? basePrice / 12 : null;
                            const monthlyFull = parseFloat(monthlyCol || 0);
                            const yearlyFull = monthlyFull * 12;
                            const annualSavings = yearlyFull > 0 ? yearlyFull - parseFloat(yearlyCol || 0) : 0;
                            const sym = isUsd ? '$' : '₹';
                            const locale = isUsd ? 'en-US' : 'en-IN';
                            const fmt = (n) => Math.round(n).toLocaleString(locale);
                            const fmt2 = (n) => n.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                            return (
                              <>
                                <div style={{ fontSize: 22, fontWeight: 700, color: G, marginBottom: 4 }}>
                                  {basePrice === 0 ? 'Free' : `${sym}${isUsd ? fmt2(basePrice) : fmt(basePrice)}`}
                                  {basePrice > 0 && (
                                    <span style={{ fontSize: 12, fontWeight: 400, color: '#666' }}>
                                      {isAnnual ? '/yr' : '/mo'}
                                    </span>
                                  )}
                                </div>
                                {isAnnual && monthlyEquiv > 0 && (
                                  <div style={{ fontSize: 11, color: '#5c5c5c', marginBottom: 4 }}>
                                    ≈ {sym}{isUsd ? fmt2(monthlyEquiv) : fmt(monthlyEquiv)}/mo equivalent
                                  </div>
                                )}
                                {isAnnual && annualSavings > 0 && (
                                  <div style={{ fontSize: 11, fontWeight: 600, color: '#16a34a', marginBottom: 4 }}>
                                    Save {sym}{isUsd ? fmt2(annualSavings) : fmt(annualSavings)}/year
                                  </div>
                                )}
                                {basePrice > 0 && (
                                  <div style={{ fontSize: 11, fontWeight: 500, color: '#666', marginBottom: 12 }}>
                                    {isUsd
                                      ? 'IGST 0% (Export under LUT)'
                                      : `+ 18% GST · ₹${(basePrice * 1.18).toLocaleString('en-IN', { maximumFractionDigits: 2 })} total`
                                    }
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
                            // Phase 128: mid-tier downgrade from a top-tier plan (eg Enterprise → Pro)
                            // now goes through the same prorated changePlan/verifyPlanChange flow as
                            // upgrades — handleUpgrade is direction-agnostic (billing-address gate + runUpgrade).
                            <button onClick={() => handleUpgrade(p.id, p.display_name)} disabled={upgrading}
                              style={{ width: '100%', padding: '10px 16px', fontSize: 13, fontWeight: 600, borderRadius: 10,
                                background: '#fff', color: '#666', border: '1px solid #ddd', cursor: upgrading ? 'wait' : 'pointer' }}>
                              {upgrading ? 'Processing...' : `Downgrade to ${p.display_name}`}
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
                            <div style={{ fontSize: 11, color: '#666' }}>{new Date(p.created_at).toLocaleDateString()}</div>
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
  // ---- BODY END ----
}
