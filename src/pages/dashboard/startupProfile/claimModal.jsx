/**
 * OpenI Hub - claimModal.jsx
 *
 * the claim-this-profile modal + its role eligibility gate
 *
 * VERBATIM slice of src/pages/dashboard/StartupProfile.jsx lines 1000-1134 as it
 * stood before the Phase 163 split (9 Aug 2026). Do NOT reformat the body -
 * see ./index.js for the re-concat verification recipe and the invariants.
 */

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Flag, Loader2, Mail, X } from 'lucide-react';
import { claimAPI } from '../../../services/api';

// --- BODY START (verbatim, do not reformat) ---
// --- lines 1000-1134 ---
/**
 * J10 (s50): Claim Startup Modal
 *
 * - Fires `POST /claims/request` with { target_startup_user_id, verification_evidence }.
 * - Backend auto-detects domain match: matching email domain -> domain_auto path
 *   (sends confirmation email); non-matching -> admin_manual path (admin reviews).
 * - Both paths surface in MyClaims at /dashboard/my-claims.
 * - User must explain their relationship to the startup (founder/employee/etc) so an
 *   admin reviewer can decide on the admin_manual path. The text is also retained as
 *   audit trail on the domain_auto path.
 */
function ClaimStartupModal({ open, onClose, startup, onSuccess }) {
  const [evidence, setEvidence] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const submit = async () => {
    if (evidence.trim().length < 20) {
      toast.error('Please describe your relationship to this startup (at least 20 characters)');
      return;
    }
    setSubmitting(true);
    try {
      const res = await claimAPI.request({
        target_startup_user_id: startup.user_id,
        verification_evidence: evidence.trim(),
      });
      // Backend returns { claim_id, status, verification_method, next_step }
      // Status will be 'email_sent' on domain-auto path or 'pending' on admin-manual path.
      if (res?.status === 'email_sent') {
        toast.success('Claim submitted — check your email to confirm');
      } else {
        toast.success('Claim submitted — awaiting admin review');
      }
      onSuccess?.(res);
      onClose();
    } catch (err) {
      // 409 duplicate or already-claimed; 403 not eligible
      toast.error(err?.message || 'Failed to submit claim');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(13,33,55,0.55)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: '#FFF8E6' }}>
              <Flag size={18} style={{ color: '#B45309' }} />
            </div>
            <div>
              <h2 className="text-base font-display font-bold text-gray-900">
                Claim {startup.company_name || 'this startup'}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Tell us how you&rsquo;re affiliated with this profile
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Info strip */}
        <div className="rounded-lg p-3 mb-4 text-xs flex gap-2 items-start"
             style={{ background: '#EFF6FF', color: '#1E40AF', border: '1px solid #BFDBFE' }}>
          <Mail size={14} className="flex-shrink-0 mt-0.5" />
          <div>
            If your email domain matches the startup&rsquo;s website, we&rsquo;ll email you a
            confirmation link. Otherwise, an admin will review your request manually.
          </div>
        </div>

        {/* Evidence */}
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
          Your relationship to this startup <span className="text-red-500">*</span>
        </label>
        <textarea
          value={evidence}
          onChange={e => setEvidence(e.target.value)}
          rows={5}
          placeholder="e.g. I'm the founder/CTO/employee of this company. My LinkedIn: https://… Press mention: https://…"
          className="w-full text-sm border rounded-lg p-3 outline-none focus:ring-2 focus:ring-amber-200"
          style={{ borderColor: '#E5E7EB' }}
          maxLength={2000}
          disabled={submitting}
        />
        <div className="flex justify-between text-[11px] text-gray-400 mt-1 mb-4">
          <span>Include role, LinkedIn URL, press cross-references where possible</span>
          <span>{evidence.length}/2000</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={submitting || evidence.trim().length < 20}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            style={{ background: '#D0A848', color: '#0D2137' }}
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Flag size={14} />}
            {submitting ? 'Submitting…' : 'Submit Claim'}
          </button>
        </div>
      </div>
    </div>
  );
}

const CLAIM_ELIGIBLE_ROLES = new Set(['startup', 'student', 'academia']);
function userIsClaimEligible(user) {
  if (!user) return false;
  const roles = Array.isArray(user.roles) && user.roles.length ? user.roles : (user.role ? [user.role] : []);
  return roles.some(r => CLAIM_ELIGIBLE_ROLES.has(r));
}

// --- BODY END ---

export {
  ClaimStartupModal,
  userIsClaimEligible,
};
