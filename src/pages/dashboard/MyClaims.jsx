/**
 * Phase 53 — MyClaims
 * Shows a user's own profile claim history: pending, approved, rejected, rolled_back.
 * Accessed from startup dashboard nav under "My Claims".
 */
import { useEffect, useState } from 'react';
import { claimAPI } from '../../services/api';
import { Building2, Loader2, CheckCircle2, XCircle, Clock, Mail, RotateCcw, Info } from 'lucide-react';

const G = '#D5AA5B';

function StatusBadge({ status }) {
  const map = {
    pending:       { bg: '#FFF8E6', fg: '#B45309', Icon: Clock,        label: 'Pending Review' },
    email_sent:    { bg: '#EFF6FF', fg: '#1D4ED8', Icon: Mail,         label: 'Email Sent' },
    verified:      { bg: '#F0FDF4', fg: '#047857', Icon: CheckCircle2, label: 'Verified' },
    approved:      { bg: '#F0FDF4', fg: '#047857', Icon: CheckCircle2, label: 'Approved' },
    rejected:      { bg: '#FEF2F2', fg: '#B91C1C', Icon: XCircle,      label: 'Rejected' },
    rolled_back:   { bg: '#F3F4F6', fg: '#4B5563', Icon: RotateCcw,    label: 'Rolled Back' },
    expired:       { bg: '#F3F4F6', fg: '#6B7280', Icon: Clock,        label: 'Expired' },
  };
  const s = map[status] || map.pending;
  const Icon = s.Icon;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold"
      style={{ background: s.bg, color: s.fg }}>
      <Icon size={12} />
      {s.label}
    </span>
  );
}

function ClaimCard({ claim }) {
  const isPastClaim = ['rejected', 'rolled_back', 'expired'].includes(claim.status);
  return (
    <div className="rounded-xl p-4 mb-3 border transition-all"
      style={{
        background: isPastClaim ? '#fafafa' : '#fff',
        borderColor: '#e5e7eb',
        opacity: isPastClaim ? 0.75 : 1,
      }}>
      <div className="flex items-start gap-3">
        {claim.target_logo_url ? (
          <img src={claim.target_logo_url} alt="" className="w-12 h-12 rounded"
            onError={e => e.target.style.display = 'none'} />
        ) : (
          <div className="w-12 h-12 rounded flex items-center justify-center" style={{ background: '#F3F4F6' }}>
            <Building2 size={20} style={{ color: '#9CA3AF' }} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-sm font-bold truncate" style={{ color: '#1a1a1a' }}>
              {claim.target_company_name || 'Unknown company'}
            </h3>
            <StatusBadge status={claim.status} />
          </div>
          <p className="text-xs mb-2" style={{ color: '#6B7280' }}>
            {claim.target_sector || 'Unknown sector'} · Claimed on {new Date(claim.requested_at).toLocaleDateString()}
          </p>
          {claim.admin_note && (
            <div className="mt-2 p-2 rounded text-xs flex items-start gap-2"
              style={{ background: '#F3F4F6', color: '#4B5563' }}>
              <Info size={14} className="mt-0.5 flex-shrink-0" />
              <span><strong>Admin note:</strong> {claim.admin_note}</span>
            </div>
          )}
          {claim.status === 'email_sent' && (
            <p className="text-xs mt-2" style={{ color: '#1D4ED8' }}>
              <Mail size={12} className="inline mr-1" />
              Confirmation email sent. Click the link to complete your claim (valid 48h).
            </p>
          )}
          {claim.status === 'pending' && claim.verification_method === 'admin_manual' && (
            <p className="text-xs mt-2" style={{ color: '#B45309' }}>
              <Clock size={12} className="inline mr-1" />
              Awaiting admin review. We'll email you when a decision is made.
            </p>
          )}
          {claim.merged_fields?.length > 0 && claim.status === 'approved' && (
            <p className="text-xs mt-2" style={{ color: '#047857' }}>
              <CheckCircle2 size={12} className="inline mr-1" />
              Merged {claim.merged_fields.length} field{claim.merged_fields.length === 1 ? '' : 's'} from the imported profile.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MyClaims() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await claimAPI.mine();
        setClaims(res?.claims || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin" style={{ color: G }} />
      </div>
    );
  }

  if (error) {
    return <div className="p-4 rounded text-sm" style={{ background: '#FEF2F2', color: '#991B1B' }}>{error}</div>;
  }

  const active = claims.filter(c => !['rejected', 'rolled_back', 'expired'].includes(c.status));
  const past = claims.filter(c => ['rejected', 'rolled_back', 'expired'].includes(c.status));

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-xl font-bold mb-1" style={{ color: '#1a1a1a' }}>My Profile Claims</h1>
        <p className="text-sm" style={{ color: '#6B7280' }}>
          Track the status of any imported startup profiles you've claimed.
        </p>
      </div>

      {claims.length === 0 ? (
        <div className="text-center py-12 rounded-xl" style={{ background: '#fafafa', border: '1px dashed #e5e7eb' }}>
          <Building2 size={40} className="mx-auto mb-3" style={{ color: '#9CA3AF' }} />
          <p className="text-sm font-semibold mb-1" style={{ color: '#1a1a1a' }}>No claims yet</p>
          <p className="text-xs" style={{ color: '#6B7280' }}>
            If your company is already listed in our directory, we'll help you claim it when you sign up.
          </p>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <>
              <h2 className="text-sm font-bold uppercase mb-3" style={{ color: '#6B7280', letterSpacing: 0.5 }}>
                Active ({active.length})
              </h2>
              {active.map(c => <ClaimCard key={c.id} claim={c} />)}
            </>
          )}
          {past.length > 0 && (
            <>
              <h2 className="text-sm font-bold uppercase mb-3 mt-6" style={{ color: '#6B7280', letterSpacing: 0.5 }}>
                Past Claims ({past.length})
              </h2>
              {past.map(c => <ClaimCard key={c.id} claim={c} />)}
            </>
          )}
        </>
      )}
    </div>
  );
}
