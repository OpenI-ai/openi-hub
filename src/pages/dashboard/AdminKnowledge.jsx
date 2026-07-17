/**
 * Phase 121 — AdminKnowledge
 * Admin console module for the Knowledge Hub: review/approve/reject contributor
 * requests, and add articles/reports directly (mirrors AdminClaims.jsx shell).
 */
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { knowledgeAdminAPI } from '../../services/api';
import { BookOpen, Loader2, CheckCircle2, XCircle, Eye, ArrowLeft, Plus } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import AddArticleModal from '../../components/knowledge/AddArticleModal';

const G = '#D0A848';

const STATUS_TABS = [
  { key: 'pending',  label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: '',         label: 'All' },
];

const SUGGESTION_STATUS_TABS = [
  { key: 'pending',   label: 'Pending' },
  { key: 'approved',  label: 'Approved' },
  { key: 'rejected',  label: 'Rejected' },
  { key: 'dismissed', label: 'Dismissed' },
  { key: '',          label: 'All' },
];

const STATUS_STYLE = {
  pending:   { bg: '#FFF8E6', fg: '#B45309', label: 'Pending' },
  approved:  { bg: '#F0FDF4', fg: '#047857', label: 'Approved' },
  rejected:  { bg: '#FEF2F2', fg: '#B91C1C', label: 'Rejected' },
  dismissed: { bg: '#F3F4F6', fg: '#4B5563', label: 'Dismissed' },
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

const TABS = [
  { key: 'requests',    label: 'Contributor Requests' },
  { key: 'suggestions', label: 'Suggestions' },
  { key: 'add',         label: 'Add Article' },
];

export default function AdminKnowledge() {
  const [searchParams] = useSearchParams();
  const initialTab = TABS.some(t => t.key === searchParams.get('tab')) ? searchParams.get('tab') : 'requests';
  const [tab, setTab] = useState(initialTab);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('pending');
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Phase 122 — Suggestions tab state
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);
  const [suggestionStatus, setSuggestionStatus] = useState('pending');
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [suggestionNote, setSuggestionNote] = useState('');
  const [suggestionSubmitting, setSuggestionSubmitting] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (status) params.status = status;
      const res = await knowledgeAdminAPI.listRequests(params);
      // Backend returns a plain array (res.json(rows)) — not {requests:[]}/{data:[]}.
      setRequests(Array.isArray(res) ? res : (res?.requests || res?.data || []));
    } catch (err) {
      toast.error(err.message || 'Failed to load contributor requests');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { if (tab === 'requests') fetchRequests(); }, [tab, fetchRequests]);

  const fetchSuggestions = useCallback(async () => {
    setSuggestionsLoading(true);
    try {
      const params = {};
      if (suggestionStatus) params.status = suggestionStatus;
      const res = await knowledgeAdminAPI.listSuggestions(params);
      setSuggestions(Array.isArray(res) ? res : (res?.suggestions || res?.data || []));
    } catch (err) {
      toast.error(err.message || 'Failed to load suggestions');
    } finally {
      setSuggestionsLoading(false);
    }
  }, [suggestionStatus]);

  useEffect(() => { if (tab === 'suggestions') fetchSuggestions(); }, [tab, fetchSuggestions]);

  const handleApprove = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await knowledgeAdminAPI.approve(selected.id, note);
      toast.success('Contributor request approved');
      setSelected(null); setNote('');
      fetchRequests();
    } catch (err) {
      toast.error(err.message || 'Failed to approve');
    } finally { setSubmitting(false); }
  };

  const handleReject = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await knowledgeAdminAPI.reject(selected.id, note);
      toast.success('Contributor request rejected');
      setSelected(null); setNote('');
      fetchRequests();
    } catch (err) {
      toast.error(err.message || 'Failed to reject');
    } finally { setSubmitting(false); }
  };

  const handleApproveSuggestion = async () => {
    if (!selectedSuggestion) return;
    setSuggestionSubmitting(true);
    try {
      await knowledgeAdminAPI.approveSuggestion(selectedSuggestion.id, suggestionNote);
      toast.success('Suggestion approved');
      setSelectedSuggestion(null); setSuggestionNote('');
      fetchSuggestions();
    } catch (err) {
      toast.error(err.message || 'Failed to approve suggestion');
    } finally { setSuggestionSubmitting(false); }
  };

  const handleRejectSuggestion = async () => {
    if (!selectedSuggestion) return;
    setSuggestionSubmitting(true);
    try {
      await knowledgeAdminAPI.rejectSuggestion(selectedSuggestion.id, suggestionNote);
      toast.success('Suggestion rejected');
      setSelectedSuggestion(null); setSuggestionNote('');
      fetchSuggestions();
    } catch (err) {
      toast.error(err.message || 'Failed to reject suggestion');
    } finally { setSuggestionSubmitting(false); }
  };

  const handleDismissSuggestion = async () => {
    if (!selectedSuggestion) return;
    setSuggestionSubmitting(true);
    try {
      await knowledgeAdminAPI.dismissSuggestion(selectedSuggestion.id, suggestionNote);
      toast.success('Suggestion dismissed');
      setSelectedSuggestion(null); setSuggestionNote('');
      fetchSuggestions();
    } catch (err) {
      toast.error(err.message || 'Failed to dismiss suggestion');
    } finally { setSuggestionSubmitting(false); }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Link to="/dashboard/admin" className="inline-flex items-center gap-1 text-sm mb-4" style={{ color: '#6B7280' }}>
        <ArrowLeft size={14} /> Back to Admin Console
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen size={20} style={{ color: G }} />
            <h1 className="text-2xl font-bold" style={{ color: '#1a1a1a' }}>Knowledge Hub</h1>
          </div>
          <p className="text-sm" style={{ color: '#6B7280' }}>
            Approve contributor access requests, and add reports, articles, and other content directly.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {TABS.map(t => (
          <button key={t.key}
            onClick={() => setTab(t.key)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={{
              background: tab === t.key ? G : '#fff',
              color: tab === t.key ? '#fff' : '#4B5563',
              border: `1px solid ${tab === t.key ? G : '#e5e7eb'}`,
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'requests' ? (
        <>
          {/* Status sub-tabs */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {STATUS_TABS.map(s => (
              <button key={s.key}
                onClick={() => setStatus(s.key)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={{
                  background: status === s.key ? '#1a1a1a' : '#fff',
                  color: status === s.key ? '#fff' : '#4B5563',
                  border: `1px solid ${status === s.key ? '#1a1a1a' : '#e5e7eb'}`,
                }}>
                {s.label}
              </button>
            ))}
          </div>

          {/* List + detail panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={24} className="animate-spin" style={{ color: G }} />
                </div>
              ) : requests.length === 0 ? (
                <div className="text-center py-8 rounded-xl" style={{ background: '#fafafa', border: '1px dashed #e5e7eb' }}>
                  <BookOpen size={28} className="mx-auto mb-2" style={{ color: '#9CA3AF' }} />
                  <p className="text-sm" style={{ color: '#6B7280' }}>No requests in this status.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {requests.map(r => (
                    <button key={r.id}
                      onClick={() => { setSelected(r); setNote(''); }}
                      className="w-full text-left p-3 rounded-lg transition-all"
                      style={{
                        background: selected?.id === r.id ? '#FFF8E6' : '#fff',
                        border: `1px solid ${selected?.id === r.id ? G : '#e5e7eb'}`,
                      }}>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-sm font-semibold truncate" style={{ color: '#1a1a1a' }}>
                          {r.user_name || r.name || 'Unknown user'}
                        </p>
                        <StatusBadge status={r.status} />
                      </div>
                      <p className="text-xs mb-1" style={{ color: '#6B7280' }}>{r.user_email || r.email}</p>
                      <p className="text-xs" style={{ color: '#9CA3AF' }}>
                        {r.requested_at ? new Date(r.requested_at).toLocaleDateString() : ''}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="lg:col-span-2">
              {!selected ? (
                <div className="text-center py-12 rounded-xl" style={{ background: '#fafafa', border: '1px dashed #e5e7eb' }}>
                  <Eye size={32} className="mx-auto mb-2" style={{ color: '#9CA3AF' }} />
                  <p className="text-sm" style={{ color: '#6B7280' }}>Select a request to review.</p>
                </div>
              ) : (
                <div className="rounded-xl p-4" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold" style={{ color: '#1a1a1a' }}>Request #{selected.id}</h2>
                    <StatusBadge status={selected.status} />
                  </div>

                  <div className="p-3 rounded-lg mb-4" style={{ background: '#F9FAFB' }}>
                    <p className="text-sm font-semibold mb-1" style={{ color: '#1a1a1a' }}>
                      {selected.user_name || selected.name}
                    </p>
                    <p className="text-xs" style={{ color: '#6B7280' }}>{selected.user_email || selected.email}</p>
                  </div>

                  <div className="mb-4 text-xs space-y-1" style={{ color: '#4B5563' }}>
                    {selected.message && (
                      <div className="mt-2 p-2 rounded" style={{ background: '#F9FAFB' }}>
                        <p className="font-semibold mb-1">Message:</p>
                        <p style={{ color: '#6B7280' }}>{selected.message}</p>
                      </div>
                    )}
                    <p className="mt-2"><strong>Requested:</strong> {selected.requested_at ? new Date(selected.requested_at).toLocaleString() : '—'}</p>
                    {selected.decided_at && <p><strong>Decided:</strong> {new Date(selected.decided_at).toLocaleString()}</p>}
                    {selected.admin_note && (
                      <div className="mt-2 p-2 rounded" style={{ background: '#F9FAFB' }}>
                        <p className="font-semibold mb-1">Admin note:</p>
                        <p style={{ color: '#6B7280' }}>{selected.admin_note}</p>
                      </div>
                    )}
                  </div>

                  {selected.status === 'pending' && (
                    <div className="mt-4 pt-4 border-t" style={{ borderColor: '#e5e7eb' }}>
                      <textarea value={note} onChange={e => setNote(e.target.value)}
                        placeholder="Admin note (optional for approve, recommended for reject)"
                        rows={2}
                        className="w-full p-2 rounded text-sm mb-3"
                        style={{ border: '1px solid #e5e7eb', background: '#fff' }} />
                      <div className="flex gap-2">
                        <button onClick={handleApprove} disabled={submitting}
                          className="flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1"
                          style={{ background: '#10B981', color: '#fff' }}>
                          <CheckCircle2 size={14} /> Approve
                        </button>
                        <button onClick={handleReject} disabled={submitting}
                          className="flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1"
                          style={{ background: '#EF4444', color: '#fff' }}>
                          <XCircle size={14} /> Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      ) : tab === 'suggestions' ? (
        <>
          {/* Status sub-tabs */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {SUGGESTION_STATUS_TABS.map(s => (
              <button key={s.key}
                onClick={() => setSuggestionStatus(s.key)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={{
                  background: suggestionStatus === s.key ? '#1a1a1a' : '#fff',
                  color: suggestionStatus === s.key ? '#fff' : '#4B5563',
                  border: `1px solid ${suggestionStatus === s.key ? '#1a1a1a' : '#e5e7eb'}`,
                }}>
                {s.label}
              </button>
            ))}
          </div>

          {/* List + detail panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1">
              {suggestionsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={24} className="animate-spin" style={{ color: G }} />
                </div>
              ) : suggestions.length === 0 ? (
                <div className="text-center py-8 rounded-xl" style={{ background: '#fafafa', border: '1px dashed #e5e7eb' }}>
                  <BookOpen size={28} className="mx-auto mb-2" style={{ color: '#9CA3AF' }} />
                  <p className="text-sm" style={{ color: '#6B7280' }}>No suggestions in this status.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {suggestions.map(s => (
                    <button key={s.id}
                      onClick={() => { setSelectedSuggestion(s); setSuggestionNote(''); }}
                      className="w-full text-left p-3 rounded-lg transition-all"
                      style={{
                        background: selectedSuggestion?.id === s.id ? '#FFF8E6' : '#fff',
                        border: `1px solid ${selectedSuggestion?.id === s.id ? G : '#e5e7eb'}`,
                      }}>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-sm font-semibold truncate" style={{ color: '#1a1a1a' }}>
                          {s.title || 'Untitled suggestion'}
                        </p>
                        <StatusBadge status={s.status} />
                      </div>
                      <p className="text-xs mb-1" style={{ color: '#6B7280' }}>{s.suggested_by_name || s.suggested_by_email || ''}</p>
                      <p className="text-xs" style={{ color: '#9CA3AF' }}>
                        {s.requested_at ? new Date(s.requested_at).toLocaleDateString() : ''}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="lg:col-span-2">
              {!selectedSuggestion ? (
                <div className="text-center py-12 rounded-xl" style={{ background: '#fafafa', border: '1px dashed #e5e7eb' }}>
                  <Eye size={32} className="mx-auto mb-2" style={{ color: '#9CA3AF' }} />
                  <p className="text-sm" style={{ color: '#6B7280' }}>Select a suggestion to review.</p>
                </div>
              ) : (
                <div className="rounded-xl p-4" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold" style={{ color: '#1a1a1a' }}>Suggestion #{selectedSuggestion.id}</h2>
                    <StatusBadge status={selectedSuggestion.status} />
                  </div>

                  <div className="p-3 rounded-lg mb-4" style={{ background: '#F9FAFB' }}>
                    <p className="text-sm font-semibold mb-1" style={{ color: '#1a1a1a' }}>
                      {selectedSuggestion.title}
                    </p>
                    {selectedSuggestion.suggested_url && (
                      <a href={selectedSuggestion.suggested_url} target="_blank" rel="noreferrer"
                        className="text-xs break-all" style={{ color: '#2563EB' }}>
                        {selectedSuggestion.suggested_url}
                      </a>
                    )}
                  </div>

                  <div className="mb-4 text-xs space-y-1" style={{ color: '#4B5563' }}>
                    {selectedSuggestion.suggested_type && (
                      <p><strong>Type:</strong> {selectedSuggestion.suggested_type}</p>
                    )}
                    <p><strong>Suggested by:</strong> {selectedSuggestion.suggested_by_name || selectedSuggestion.suggested_by_email || '—'}</p>
                    {selectedSuggestion.summary && (
                      <div className="mt-2 p-2 rounded" style={{ background: '#F9FAFB' }}>
                        <p className="font-semibold mb-1">Summary:</p>
                        <p style={{ color: '#6B7280' }}>{selectedSuggestion.summary}</p>
                      </div>
                    )}
                    <p className="mt-2"><strong>Requested:</strong> {selectedSuggestion.requested_at ? new Date(selectedSuggestion.requested_at).toLocaleString() : '—'}</p>
                    {selectedSuggestion.decided_at && <p><strong>Decided:</strong> {new Date(selectedSuggestion.decided_at).toLocaleString()}</p>}
                    {selectedSuggestion.admin_note && (
                      <div className="mt-2 p-2 rounded" style={{ background: '#F9FAFB' }}>
                        <p className="font-semibold mb-1">Admin note:</p>
                        <p style={{ color: '#6B7280' }}>{selectedSuggestion.admin_note}</p>
                      </div>
                    )}
                  </div>

                  {selectedSuggestion.status === 'pending' && (
                    <div className="mt-4 pt-4 border-t" style={{ borderColor: '#e5e7eb' }}>
                      <textarea value={suggestionNote} onChange={e => setSuggestionNote(e.target.value)}
                        placeholder="Admin note (optional for approve, recommended for reject/dismiss)"
                        rows={2}
                        className="w-full p-2 rounded text-sm mb-3"
                        style={{ border: '1px solid #e5e7eb', background: '#fff' }} />
                      <div className="flex gap-2">
                        <button onClick={handleApproveSuggestion} disabled={suggestionSubmitting}
                          className="flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1"
                          style={{ background: '#10B981', color: '#fff' }}>
                          <CheckCircle2 size={14} /> Approve
                        </button>
                        <button onClick={handleRejectSuggestion} disabled={suggestionSubmitting}
                          className="flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1"
                          style={{ background: '#EF4444', color: '#fff' }}>
                          <XCircle size={14} /> Reject
                        </button>
                        <button onClick={handleDismissSuggestion} disabled={suggestionSubmitting}
                          className="flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1"
                          style={{ background: '#6B7280', color: '#fff' }}>
                          Dismiss
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-xl p-8 text-center" style={{ background: '#fafafa', border: '1px dashed #e5e7eb' }}>
          <BookOpen size={32} className="mx-auto mb-3" style={{ color: '#9CA3AF' }} />
          <p className="text-sm mb-4" style={{ color: '#6B7280' }}>
            Add a report, article, SOP, training module, or case study to the Knowledge Hub.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold text-sm text-white"
            style={{ background: G }}
          >
            <Plus size={15} /> Add Article
          </button>
        </div>
      )}

      <AddArticleModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreated={() => { setShowAddModal(false); toast.success('Content published to the Knowledge Hub'); }}
      />
    </div>
  );
}
