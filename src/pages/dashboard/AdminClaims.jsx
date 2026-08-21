/**
 * Phase 53 — AdminClaims
 * Admin console for reviewing, approving, rejecting, and rolling back profile claims.
 */
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { claimAPI } from '../../services/api';
import { Building2, Loader2, CheckCircle2, XCircle, RotateCcw, Eye, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const G = '#D0A848';

const STATUS_TABS = [
  { key: 'pending',     label: 'Pending' },
  { key: 'email_sent',  label: 'Email Sent' },
  { key: 'approved',    label: 'Approved' },
  { key: 'rejected',    label: 'Rejected' },
  { key: 'rolled_back', label: 'Rolled Back' },
  { key: '',            label: 'All' },
];

const STATUS_STYLE = {
  pending:     { bg: '#FFF8E6', fg: '#B45309', label: 'Pending' },
  email_sent:  { bg: '#EFF6FF', fg: '#1D4ED8', label: 'Email Sent' },
  verified:    { bg: '#F0FDF4', fg: '#047857', label: 'Verified' },
  approved:    { bg: '#F0FDF4', fg: '#047857', label: 'Approved' },
  rejected:    { bg: '#FEF2F2', fg: '#B91C1C', label: 'Rejected' },
  rolled_back: { bg: '#F3F4F6', fg: '#4B5563', label: 'Rolled Back' },
  expired:     { bg: '#F3F4F6', fg: '#6B7280', label: 'Expired' },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.pending;
  return (
    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold"
      style={{ background: s.bg, color: s.fg }}>
      {s.label}
    </span>
  );
}

export default function AdminClaims() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('pending');
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchClaims = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (status) params.status = status;
      const res = await claimAPI.list(params);
      setClaims(res?.claims || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load claims');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { fetchClaims(); }, [fetchClaims]);

  const handleApprove = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const res = await claimAPI.approve(selected.id, note);
      toast.success(`Approved. ${res.merged_fields?.length || 0} fields merged.`);
      setSelected(null); setNote('');
      fetchClaims();
    } catch (err) {
      toast.error(err.message);
    } finally { setSubmitting(false); }
  };

  const handleReject = async () => {
    if (!selected || !note) { toast.error('Admin note is required to reject'); return; }
    setSubmitting(true);
    try {
      await claimAPI.reject(selected.id, note);
      toast.success('Claim rejected');
      setSelected(null); setNote('');
      fetchClaims();
    } catch (err) {
      toast.error(err.message);
    } finally { setSubmitting(false); }
  };

  const handleRollback = async () => {
    if (!selected || !note) { toast.error('Admin note is required to roll back'); return; }
    if (!confirm('This will restore the imported placeholder profile. Continue?')) return;
    setSubmitting(true);
    try {
      await claimAPI.rollback(selected.id, note);
      toast.success('Claim rolled back');
      setSelected(null); setNote('');
      fetchClaims();
    } catch (err) {
      toast.error(err.message);
    } finally { setSubmitting(false); }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Link to="/dashboard/admin" className="inline-flex items-center gap-1 text-sm mb-4" style={{ color: '#6B7280' }}>
        <ArrowLeft size={14} /> Back to Admin Console
      </Link>

      <div id="tour-page-admin-claims" className="mb-6">
        <h1 className="text-2xl font-bold mb-1" style={{ color: '#1a1a1a' }}>Profile Claims</h1>
        <p className="text-sm" style={{ color: '#6B7280' }}>
          Review and decide on founder claims to imported startup profiles.
        </p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {STATUS_TABS.map(tab => (
          <button key={tab.key}
            onClick={() => setStatus(tab.key)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={{
              background: status === tab.key ? G : '#fff',
              color: status === tab.key ? '#fff' : '#4B5563',
              border: `1px solid ${status === tab.key ? G : '#e5e7eb'}`,
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* List + detail panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* List */}
        <div className="lg:col-span-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin" style={{ color: G }} />
            </div>
          ) : claims.length === 0 ? (
            <div className="text-center py-8 rounded-xl" style={{ background: '#fafafa', border: '1px dashed #e5e7eb' }}>
              <Building2 size={28} className="mx-auto mb-2" style={{ color: '#9CA3AF' }} />
              <p className="text-sm" style={{ color: '#6B7280' }}>No claims in this status.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {claims.map(c => (
                <button key={c.id}
                  onClick={() => { setSelected(c); setNote(''); }}
                  className="w-full text-left p-3 rounded-lg transition-all"
                  style={{
                    background: selected?.id === c.id ? '#FFF8E6' : '#fff',
                    border: `1px solid ${selected?.id === c.id ? '#D0A848' : '#e5e7eb'}`,
                  }}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-semibold truncate" style={{ color: '#1a1a1a' }}>
                      {c.target_company_name || 'Unknown'}
                    </p>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="text-xs mb-1" style={{ color: '#6B7280' }}>
                    Claimer: {c.new_user_email}
                  </p>
                  <p className="text-xs" style={{ color: '#9CA3AF' }}>
                    {new Date(c.requested_at).toLocaleDateString()} · conf {c.match_confidence || '0'}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Detail */}
        <div className="lg:col-span-2">
          {!selected ? (
            <div className="text-center py-12 rounded-xl" style={{ background: '#fafafa', border: '1px dashed #e5e7eb' }}>
              <Eye size={32} className="mx-auto mb-2" style={{ color: '#9CA3AF' }} />
              <p className="text-sm" style={{ color: '#6B7280' }}>Select a claim to review.</p>
            </div>
          ) : (
            <div className="rounded-xl p-4" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold" style={{ color: '#1a1a1a' }}>
                  Claim #{selected.id}
                </h2>
                <StatusBadge status={selected.status} />
              </div>

              {/* Claimer vs Target side-by-side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-lg" style={{ background: '#F9FAFB' }}>
                  <p className="text-xs font-bold uppercase mb-2" style={{ color: '#6B7280', letterSpacing: 0.5 }}>Claimer (New User)</p>
                  <p className="text-sm font-semibold mb-1" style={{ color: '#1a1a1a' }}>{selected.new_user_name}</p>
                  <p className="text-xs mb-2" style={{ color: '#6B7280' }}>{selected.new_user_email}</p>
                </div>
                <div className="p-3 rounded-lg" style={{ background: '#FFF8E6' }}>
                  <p className="text-xs font-bold uppercase mb-2" style={{ color: '#B45309', letterSpacing: 0.5 }}>Target (Imported)</p>
                  <p className="text-sm font-semibold mb-1" style={{ color: '#1a1a1a' }}>{selected.target_company_name}</p>
                  <p className="text-xs mb-1" style={{ color: '#6B7280' }}>{selected.target_website}</p>
                  <p className="text-xs" style={{ color: '#9CA3AF' }}>{selected.target_sector}</p>
                </div>
              </div>

              {/* Metadata */}
              <div className="mb-4 text-xs space-y-1" style={{ color: '#4B5563' }}>
                <p><strong>Method:</strong> {selected.verification_method}</p>
                <p><strong>Match confidence:</strong> {selected.match_confidence} ({selected.match_reason})</p>
                <p><strong>Requested:</strong> {new Date(selected.requested_at).toLocaleString()}</p>
                {selected.decided_at && <p><strong>Decided:</strong> {new Date(selected.decided_at).toLocaleString()}</p>}
                {selected.verification_evidence && (
                  <div className="mt-2 p-2 rounded" style={{ background: '#F9FAFB' }}>
                    <p className="font-semibold mb-1">Evidence:</p>
                    <p style={{ color: '#6B7280' }}>{selected.verification_evidence}</p>
                  </div>
                )}
                {selected.admin_note && (
                  <div className="mt-2 p-2 rounded" style={{ background: '#F9FAFB' }}>
                    <p className="font-semibold mb-1">Admin note:</p>
                    <p style={{ color: '#6B7280' }}>{selected.admin_note}</p>
                  </div>
                )}
                {selected.merged_fields?.length > 0 && (
                  <p className="mt-2"><strong>Merged fields:</strong> {selected.merged_fields.join(', ')}</p>
                )}
              </div>

              {/* Actions */}
              {['pending', 'email_sent', 'verified'].includes(selected.status) && (
                <div className="mt-4 pt-4 border-t" style={{ borderColor: '#e5e7eb' }}>
                  <textarea value={note} onChange={e => setNote(e.target.value)}
                    placeholder="Admin note (required for reject/rollback, optional for approve)"
                    rows={2}
                    className="w-full p-2 rounded text-sm mb-3"
                    style={{ border: '1px solid #e5e7eb', background: '#fff' }} />
                  <div className="flex gap-2">
                    <button onClick={handleApprove} disabled={submitting}
                      className="flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1"
                      style={{ background: '#047857', color: '#fff' }}>
                      <CheckCircle2 size={14} /> Approve
                    </button>
                    <button onClick={handleReject} disabled={submitting}
                      className="flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1"
                      style={{ background: '#dc2626', color: '#fff' }}>
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                </div>
              )}
              {selected.status === 'approved' && (
                <div className="mt-4 pt-4 border-t" style={{ borderColor: '#e5e7eb' }}>
                  <textarea value={note} onChange={e => setNote(e.target.value)}
                    placeholder="Rollback reason (required)"
                    rows={2}
                    className="w-full p-2 rounded text-sm mb-3"
                    style={{ border: '1px solid #e5e7eb', background: '#fff' }} />
                  <button onClick={handleRollback} disabled={submitting}
                    className="w-full py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1"
                    style={{ background: '#6B7280', color: '#fff' }}>
                    <RotateCcw size={14} /> Rollback Claim
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
