/**
 * SsoTab - extracted from Settings.jsx (Phase 166 / W5-3).
 * The body between the sentinels is a VERBATIM slice of the pre-split file,
 * original lines 1390-1415 of 1507. Nothing inside was reformatted or reindented.
 * Props are the exact set of parent-scope names the slice referenced - they are
 * computed from the slice, never hand-listed, so the signature cannot drift from
 * the call site. Long prop lists are deliberate: grouping them into state/actions
 * objects would force rewriting the body and destroy the verbatim property.
 */
import { G, card } from './constants';
import { Shield, Loader2 } from 'lucide-react';
import SettingsSSO from '../../../components/SettingsSSO';

export default function SsoTab({ billingLoading, loadBilling, myPlan, setTab }) {
  // ---- BODY START (original lines 1390-1415) ----
        if (!myPlan && !billingLoading) loadBilling();
        const planFeatures = myPlan?.plan?.features || {};

        return (
          <div>
            {billingLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Loader2 size={28} className="animate-spin" style={{ color: G }} /></div>
            ) : planFeatures.sso_oidc ? (
              <SettingsSSO />
            ) : (
              <div style={{ ...card, padding: 28, textAlign: 'center' }}>
                <Shield size={28} style={{ color: '#ccc', marginBottom: 12 }} />
                <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>Single Sign-On is an Enterprise feature</h3>
                <p style={{ margin: '0 0 16px', fontSize: 13, color: '#5c5c5c' }}>
                  Upgrade to Enterprise to let your team sign in with your identity provider.
                </p>
                <button onClick={() => setTab('billing')} style={{
                  padding: '9px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  border: 'none', cursor: 'pointer', background: G, color: '#fff',
                }}>
                  View Plans
                </button>
              </div>
            )}
          </div>
        );
  // ---- BODY END ----
}
