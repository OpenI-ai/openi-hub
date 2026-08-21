// ApplicantInvitePanel — Cross-Ecosystem Phase F (generic applicant-invite UI)
// One shared, write-once panel for the 4 "call for applications" personas:
//   investor (deal requests) / incubator (programs) / accelerator (batches) / lab (announcements)
// Mounts inside an owner dashboard once an entity (deal/program/batch/announcement)
// is selected. Owners can invite startups/applicants by existing-user-id OR by email
// (magic-link to non-OpenI users). Mirrors the corporate challenge-invite UX.
//
// Props:
//   entityType  — 'investor' | 'incubator' | 'accelerator' | 'lab'  (the persona key)
//   entityId    — numeric id of the deal/program/batch/announcement
//   entityLabel — optional human label for the entity (heading), e.g. the deal title
//   user        — current user object (for invited_by_user_id revoke gate)
import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Plus, X, Mail, Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import { applicantInviteAPI, meetingAPI } from '../services/api';

const G = '#D0A848'; // brand gold

const STATUS_COLORS = (status) =>
  status === 'pending'   ? { bg: '#fef3c7', fg: '#92400e' }   // pending email invite
  : status === 'invited' ? { bg: '#e0f2fe', fg: '#075985' }   // registered, awaiting response
  : status === 'accepted'? { bg: '#dcfce7', fg: '#15803d' }
  : status === 'declined'? { bg: '#fee2e2', fg: '#b91c1c' }
  : status === 'revoked' ? { bg: '#f3f4f6', fg: '#6b7280' }
  : { bg: '#f3f4f6', fg: '#6b7280' };

const EMAIL_RE = /\S+@\S+\.\S+/;

export default function ApplicantInvitePanel({ entityType, entityId, entityLabel, user }) {
  const [open, setOpen]               = useState(false);
  const [search, setSearch]           = useState('');
  const [results, setResults]         = useState([]);
  const [selected, setSelected]       = useState([]);     // [{id, name, organization_name}]
  const [emails, setEmails]           = useState([]);     // ['a@b.com', ...]
  const [emailDraft, setEmailDraft]   = useState('');
  const [message, setMessage]         = useState('');
  const [list, setList]               = useState([]);     // existing invites
  const [busy, setBusy]               = useState(false);
  const [loading, setLoading]         = useState(false);
  const seqRef                        = useRef(0);

  const loadList = useCallback(async () => {
    if (!entityType || !entityId) return;
    setLoading(true);
    try {
      const r = await applicantInviteAPI.list(entityType, entityId);
      setList(r.invites || []);
    } catch (err) {
      console.error('[applicant-invite list]', err);
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    if (open) loadList();
  }, [open, loadList]);

  const onSearch = async (q) => {
    setSearch(q);
    if (q.trim().length < 2) { setResults([]); return; }
    const mySeq = ++seqRef.current;
    try {
      const r = await meetingAPI.searchUsers(q);
      if (mySeq !== seqRef.current) return;
      const selectedIds = new Set(selected.map(s => s.id));
      const alreadyInvited = new Set(list.map(i => i.invited_user_id).filter(Boolean));
      setResults((r.users || []).filter(u => !selectedIds.has(u.id) && !alreadyInvited.has(u.id)));
    } catch (err) {
      console.error('[applicant-invite search]', err);
    }
  };

  const promoteEmailDraft = () => {
    const draft = emailDraft.trim().toLowerCase().replace(/,$/, '');
    if (EMAIL_RE.test(draft) && !emails.includes(draft)) {
      setEmails(prev => [...prev, draft]);
      setEmailDraft('');
      return true;
    }
    return false;
  };

  const canSend = selected.length > 0 || emails.length > 0 || EMAIL_RE.test(emailDraft.trim());

  const handleSend = async () => {
    setBusy(true);
    // Promote any valid draft email to a chip before sending (matches corporate UX).
    let emailsToSend = emails.slice();
    const draft = emailDraft.trim().toLowerCase().replace(/,$/, '');
    if (EMAIL_RE.test(draft) && !emailsToSend.includes(draft)) emailsToSend.push(draft);
    try {
      const r = await applicantInviteAPI.create(entityType, entityId, {
        userIds: selected.map(u => u.id),
        emails: emailsToSend,
        message: message.trim() || undefined,
      });
      const pendingCount = (r.pending_email_invites || []).length;
      const parts = [];
      if (r.created > 0)   parts.push(`${r.created} in-app invite${r.created === 1 ? '' : 's'} sent`);
      if (pendingCount > 0) parts.push(`${pendingCount} email invite${pendingCount === 1 ? '' : 's'} sent`);
      toast.success(parts.join(' · ') || 'Invites sent');
      setSelected([]); setEmails([]); setEmailDraft(''); setMessage(''); setSearch(''); setResults([]);
      await loadList();
    } catch (err) {
      console.error('[applicant-invite send]', err);
      toast.error(err?.message || 'Failed to send invites');
    } finally {
      setBusy(false);
    }
  };

  const handleRevoke = async (inv) => {
    if (!window.confirm(`Revoke invite for ${inv.invitee_name}?`)) return;
    try {
      await applicantInviteAPI.revoke(inv.id, entityType, entityId, inv.source);
      await loadList();
      toast.success('Invite revoked');
    } catch (err) {
      toast.error(err?.message || 'Failed to revoke');
    }
  };

  const handleRemind = async (inv) => {
    try {
      await applicantInviteAPI.remind(inv.id, entityType, entityId);
      toast.success(`Reminder re-sent to ${inv.invitee_email || inv.invitee_name}`);
    } catch (err) {
      toast.error(err?.message || 'Failed to remind');
    }
  };

  if (!entityId) return null;

  return (
    <div style={{ border: '1px solid #eee', borderRadius: 12, marginTop: 16, background: '#fff' }}>
      {/* Header / toggle */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', background: 'transparent', border: 'none', cursor: 'pointer' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: '#152838' }}>
          <Mail size={16} color={G} /> Invite applicants
          {entityLabel && <span style={{ color: '#5c5c5c', fontWeight: 500 }}> · {entityLabel}</span>}
        </span>
        <span style={{ fontSize: 12, color: '#5c5c5c' }}>{open ? 'Hide' : 'Show'}</span>
      </button>

      {open && (
        <div style={{ padding: '0 16px 16px' }}>
          {/* Typeahead user search */}
          <label style={{ fontSize: 12, fontWeight: 600, color: '#444', display: 'block', marginBottom: 4 }}>
            Search existing users
          </label>
          <input type="text" value={search} onChange={(e) => onSearch(e.target.value)}
            placeholder="Type at least 2 characters (name, email, or org)"
            style={{ width: '100%', padding: '10px 12px', fontSize: 15, border: '1.5px solid #e5e7eb',
              borderRadius: 10, background: '#f9fafb', marginBottom: 8 }} />

          {results.length > 0 && (
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, maxHeight: 180, overflow: 'auto', marginBottom: 12 }}>
              {results.map(u => (
                <div key={u.id}
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => { setSelected(prev => [...prev, u]); setResults(prev => prev.filter(x => x.id !== u.id)); }}
                  style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fef9e8'}
                  onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                  <span><strong>{u.name}</strong>{u.organization_name && <span style={{ color: '#5c5c5c' }}> · {u.organization_name}</span>}</span>
                  <Plus size={14} color={G} />
                </div>
              ))}
            </div>
          )}
          {search.trim().length >= 2 && results.length === 0 && (
            <p style={{ fontSize: 12, color: '#666', marginBottom: 12, fontStyle: 'italic' }}>No matching users found.</p>
          )}

          {/* Selected user chips */}
          {selected.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {selected.map(u => (
                <span key={u.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 8px',
                  background: '#fef9e8', borderRadius: 16, fontSize: 12, fontWeight: 600, color: '#7a5c12' }}>
                  {u.name}
                  <X size={12} style={{ cursor: 'pointer' }} onClick={() => setSelected(prev => prev.filter(x => x.id !== u.id))} />
                </span>
              ))}
            </div>
          )}

          {/* Email invite (non-OpenI users) */}
          <label style={{ fontSize: 12, fontWeight: 600, color: '#444', display: 'block', marginBottom: 4 }}>
            Or invite by email (magic-link for non-OpenI users)
          </label>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            <input type="email" value={emailDraft}
              onChange={(e) => setEmailDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); promoteEmailDraft(); } }}
              placeholder="name@example.com"
              style={{ flex: 1, padding: '10px 12px', fontSize: 15, border: '1.5px solid #e5e7eb',
                borderRadius: 10, background: '#f9fafb' }} />
            <button type="button" onClick={promoteEmailDraft} disabled={!EMAIL_RE.test(emailDraft.trim())}
              style={{ padding: '0 14px', fontSize: 13, fontWeight: 600, background: EMAIL_RE.test(emailDraft.trim()) ? '#fff' : '#f3f4f6',
                color: '#444', border: '1.5px solid #ccc', borderRadius: 10,
                cursor: EMAIL_RE.test(emailDraft.trim()) ? 'pointer' : 'not-allowed' }}>
              Add
            </button>
          </div>
          {emails.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {emails.map(em => (
                <span key={em} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 8px',
                  background: '#eef2ff', borderRadius: 16, fontSize: 12, fontWeight: 600, color: '#3730a3' }}>
                  {em}
                  <X size={12} style={{ cursor: 'pointer' }} onClick={() => setEmails(prev => prev.filter(x => x !== em))} />
                </span>
              ))}
            </div>
          )}

          {/* Optional message */}
          <textarea value={message} onChange={(e) => setMessage(e.target.value)}
            placeholder="Optional message to applicants…" rows={2}
            style={{ width: '100%', padding: '10px 12px', fontSize: 14, border: '1.5px solid #e5e7eb',
              borderRadius: 10, background: '#f9fafb', marginBottom: 12, resize: 'vertical' }} />

          {/* Send */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 18 }}>
            <button disabled={busy || !canSend} onClick={handleSend}
              style={{ padding: '9px 18px', fontSize: 13, fontWeight: 700,
                background: (!canSend || busy) ? '#ccc' : G, color: '#fff', border: 'none', borderRadius: 8,
                cursor: (!canSend || busy) ? 'not-allowed' : 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Send size={14} /> {busy ? 'Sending…' : 'Send Invites'}
            </button>
          </div>

          {/* Existing invites */}
          <div style={{ borderTop: '1px solid #eee', paddingTop: 14 }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: '#333', margin: '0 0 10px' }}>
              Invited ({list.length})
            </h4>
            {loading ? (
              <p style={{ fontSize: 12, color: '#666', margin: 0 }}>Loading…</p>
            ) : list.length === 0 ? (
              <p style={{ fontSize: 12, color: '#666', fontStyle: 'italic', margin: 0 }}>No invites sent yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {list.map(inv => {
                  const colors = STATUS_COLORS(inv.status);
                  const canManage = Number(inv.invited_by_user_id) === Number(user?.id) || user?.role === 'admin';
                  const isPendingEmail = inv.source === 'pending_email';
                  const isOpen = inv.status === 'pending' || inv.status === 'invited';
                  return (
                    <div key={`${inv.source}-${inv.id}`} style={{ display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', padding: '8px 10px', background: '#fafafa', borderRadius: 8, fontSize: 12 }}>
                      <div>
                        <strong>{inv.invitee_name}</strong>
                        {inv.invitee_org && <span style={{ color: '#5c5c5c' }}> · {inv.invitee_org}</span>}
                        {isPendingEmail && <span style={{ color: '#a16207' }}> · email invite</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ padding: '2px 8px', borderRadius: 12, background: colors.bg, color: colors.fg, fontSize: 11, fontWeight: 600 }}>
                          {inv.status}
                        </span>
                        {isOpen && canManage && isPendingEmail && (
                          <button onClick={() => handleRemind(inv)}
                            style={{ padding: '3px 8px', fontSize: 11, fontWeight: 600, background: 'transparent',
                              color: '#075985', border: '1px solid #07598540', borderRadius: 6, cursor: 'pointer',
                              display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Bell size={11} /> Remind
                          </button>
                        )}
                        {isOpen && canManage && (
                          <button onClick={() => handleRevoke(inv)}
                            style={{ padding: '3px 8px', fontSize: 11, fontWeight: 600, background: 'transparent',
                              color: '#c43c3c', border: '1px solid #c43c3c40', borderRadius: 6, cursor: 'pointer' }}>
                            Revoke
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
