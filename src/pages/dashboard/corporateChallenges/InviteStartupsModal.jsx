/**
 * InviteStartupsModal — extracted from CorporateChallenges.jsx (Phase 165 / W5-2).
 *
 * The body between the sentinels is a VERBATIM slice of the pre-split file,
 * original lines 953-1179 of 1721. Nothing inside was reformatted or reindented.
 * Props are the exact set of parent-scope names the slice referenced — they are
 * computed from the slice, never hand-listed, so the signature cannot drift from
 * the call site. Long prop lists are deliberate: grouping them into state/actions
 * objects would force rewriting the body and destroy the verbatim property.
 */

import { corporateAPI, meetingAPI } from '../../../services/api';
import { Plus, X, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { G } from './constants';
import { canInviteToChallenge } from '../../../utils/challengeGate';

export default function InviteStartupsModal({
  detail, inviteBusy, inviteEmailDraft, inviteEmails, inviteList, inviteMessage, inviteResults,
  inviteSearch, inviteSelected, inviteSeqRef, setInviteBusy, setInviteEmailDraft,
  setInviteEmails, setInviteList, setInviteMessage, setInviteResults, setInviteSearch,
  setInviteSelected, setShowInvite, user,
}) {
  // s81 (Dentsu) — refuse BEFORE the user builds a list of invitees. The backend
  // 409 is the real gate and its message already reaches the toast via
  // core.js:96; this only moves the answer earlier, from after-Send to on-open.
  //
  // Deliberately placed OUTSIDE the verbatim sentinels below. That body is a
  // byte-identical slice of the pre-split CorporateChallenges.jsx (W5-2) and the
  // file header forbids reformatting it — an early return costs nothing and
  // keeps the slice provable, where threading a conditional through the JSX
  // would not.
  const gate = canInviteToChallenge(detail);
  if (!gate.ok) {
    return (
      <div role="dialog" aria-modal="true"
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}>
        <div style={{ background: '#fff', borderRadius: 14, padding: 24, maxWidth: 460, width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: '#111' }}>Invite Startups</h3>
            <button onClick={() => setShowInvite(false)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }} aria-label="Close">
              <X size={20} color="#666" />
            </button>
          </div>
          <div data-testid="invite-blocked"
            style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '12px 14px', fontSize: 13, color: '#991B1B', lineHeight: 1.5 }}>
            {gate.message}
          </div>
          <p style={{ fontSize: 12, color: '#666', margin: '12px 0 0' }}>
            Reopen the challenge or extend its deadline to invite more startups.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <button onClick={() => setShowInvite(false)}
              style={{ padding: '8px 18px', fontSize: 13, fontWeight: 700, background: G, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    // ---- BODY START (original lines 953-1179) ----
          <div role="dialog" aria-modal="true"
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}>
            <div style={{ background: '#fff', borderRadius: 14, padding: 24, maxWidth: 640, width: '100%', maxHeight: '85vh', overflow: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: '#111' }}>Invite Startups</h3>
                  <p style={{ fontSize: 12, color: '#666', margin: '4px 0 0' }}>Pick startups to invite. They will see this challenge under Invited Challenges.</p>
                </div>
                <button onClick={() => { setShowInvite(false); setInviteSearch(''); setInviteResults([]); setInviteSelected([]); setInviteMessage(''); setInviteEmails([]); setInviteEmailDraft(''); }}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}>
                  <X size={20} color="#666" />
                </button>
              </div>

              {/* Typeahead search */}
              <label style={{ fontSize: 12, fontWeight: 600, color: '#444', display: 'block', marginBottom: 4 }}>Search startups</label>
              <input type="text" autoFocus value={inviteSearch}
                onChange={async (e) => {
                  const q = e.target.value;
                  setInviteSearch(q);
                  if (q.trim().length < 2) { setInviteResults([]); return; }
                  const mySeq = ++inviteSeqRef.current;
                  try {
                    const r = await meetingAPI.searchUsers(q);
                    if (mySeq !== inviteSeqRef.current) return;
                    const startups = (r.users || []).filter(u => u.role === 'startup');
                    const selectedIds = new Set(inviteSelected.map(s => s.id));
                    const alreadyInvited = new Set(inviteList.map(i => i.invited_user_id));
                    setInviteResults(startups.filter(u => !selectedIds.has(u.id) && !alreadyInvited.has(u.id)));
                  } catch (err) { console.error('[invite-search]', err); }
                }}
                placeholder="Type at least 2 characters (name, email, or org)"
                style={{ width: '100%', padding: '10px 12px', fontSize: 16, border: '1.5px solid #e5e7eb', borderRadius: 10, background: '#f9fafb', marginBottom: 8 }} />

              {/* Results */}
              {inviteResults.length > 0 && (
                <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, maxHeight: 180, overflow: 'auto', marginBottom: 12 }}>
                  {inviteResults.map(u => (
                    <div key={u.id}
                      onClick={() => {
                        setInviteSelected(prev => [...prev, u]);
                        setInviteResults(prev => prev.filter(x => x.id !== u.id));
                      }}
                      style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}
                      onMouseDown={e => e.preventDefault()}
                      onMouseEnter={e => e.currentTarget.style.background = '#fef9e8'}
                      onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                      <span><strong>{u.name}</strong>{u.organization_name && <span style={{ color: '#5c5c5c' }}> · {u.organization_name}</span>}</span>
                      <Plus size={14} color={G} />
                    </div>
                  ))}
                </div>
              )}
              {inviteSearch.trim().length >= 2 && inviteResults.length === 0 && (
                <p style={{ fontSize: 12, color: '#666', marginBottom: 12, fontStyle: 'italic' }}>No matching startups found.</p>
              )}

              {/* Selected chips */}
              {inviteSelected.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#444', display: 'block', marginBottom: 6 }}>Selected ({inviteSelected.length})</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {inviteSelected.map(u => (
                      <span key={u.id}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', fontSize: 12, borderRadius: 20, background: `${G}15`, color: '#5a4715', border: `1px solid ${G}` }}>
                        {u.name}
                        <button type="button" onClick={() => setInviteSelected(prev => prev.filter(x => x.id !== u.id))}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, marginLeft: 2 }}>
                          <X size={12} color="#5a4715" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Phase 108: Or invite by email (non-OpenI users) */}
              <div style={{ marginBottom: 12, paddingTop: 12, borderTop: '1px solid #eee' }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#444', display: 'block', marginBottom: 4 }}>
                  Or invite by email
                </label>
                <p style={{ fontSize: 11, color: '#5c5c5c', margin: '0 0 6px' }}>
                  Not yet on OpenI? Add an email — they'll get a signup invite. Press Enter or comma to add.
                </p>
                <input type="email" value={inviteEmailDraft}
                  onChange={(e) => setInviteEmailDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      const em = inviteEmailDraft.trim().toLowerCase().replace(/,$/, '');
                      // Dedupe INSIDE the functional updater so it reads fresh
                      // `prev`, never the stale closed-over `inviteEmails` (which
                      // lagged after ~2 adds and silently dropped later chips).
                      if (/\S+@\S+\.\S+/.test(em)) {
                        setInviteEmails(prev => prev.includes(em) ? prev : [...prev, em]);
                        setInviteEmailDraft('');
                      }
                    }
                  }}
                  onBlur={() => {
                    const em = inviteEmailDraft.trim().toLowerCase().replace(/,$/, '');
                    if (/\S+@\S+\.\S+/.test(em)) {
                      setInviteEmails(prev => prev.includes(em) ? prev : [...prev, em]);
                      setInviteEmailDraft('');
                    }
                  }}
                  placeholder="vanessa@example.com"
                  style={{ width: '100%', padding: '8px 12px', fontSize: 16, border: '1.5px solid #e5e7eb', borderRadius: 8, background: '#f9fafb' }} />
                {inviteEmails.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {inviteEmails.map(em => (
                      <span key={em}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', fontSize: 12, borderRadius: 20, background: `${G}15`, color: '#5a4715', border: `1px solid ${G}` }}>
                        {em}
                        <button type="button" onClick={() => setInviteEmails(prev => prev.filter(x => x !== em))}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, marginLeft: 2 }}>
                          <X size={12} color="#5a4715" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Message field */}
              <label style={{ fontSize: 12, fontWeight: 600, color: '#444', display: 'block', marginBottom: 4 }}>Personal message (optional)</label>
              <textarea value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                placeholder="Add context for the invitee — what excites you about this challenge for them?"
                rows={3}
                style={{ width: '100%', padding: '10px 12px', fontSize: 16, border: '1.5px solid #e5e7eb', borderRadius: 10, background: '#f9fafb', resize: 'vertical', marginBottom: 16 }} />

              {/* Send + Cancel */}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginBottom: 20 }}>
                <button onClick={() => { setShowInvite(false); setInviteSearch(''); setInviteResults([]); setInviteSelected([]); setInviteMessage(''); setInviteEmails([]); setInviteEmailDraft(''); }}
                  style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600, background: '#fff', color: '#666', border: '1.5px solid #ccc', borderRadius: 8, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button
                  disabled={inviteBusy || (
                    inviteSelected.length === 0 &&
                    inviteEmails.length === 0 &&
                    !(/\S+@\S+\.\S+/.test(inviteEmailDraft.trim()))
                  )}
                  onClick={async () => {
                    setInviteBusy(true);
                    // Phase C2 (28 May, feedback #3 fix) — Promote any pending
                    // draft email to chip before sending. Cohort screenshot
                    // showed Send disabled with valid email typed but not
                    // Enter-promoted. This makes the Send click promote-then-send.
                    let emailsToSend = inviteEmails.slice();
                    const draft = inviteEmailDraft.trim().toLowerCase().replace(/,$/, '');
                    if (/\S+@\S+\.\S+/.test(draft) && !emailsToSend.includes(draft)) {
                      emailsToSend.push(draft);
                    }
                    try {
                      const r = await corporateAPI.sendInvites(detail.id, {
                        user_ids: inviteSelected.map(u => u.id),
                        emails: emailsToSend,   // Phase 108 + Phase C2 chip-promote
                        message: inviteMessage.trim() || undefined,
                      });
                      const pendingCount = (r.pending_email_invites || []).length;
                      const msgParts = [];
                      if (r.created > 0) msgParts.push(`${r.created} in-app invite${r.created === 1 ? '' : 's'} sent`);
                      if (pendingCount > 0) msgParts.push(`${pendingCount} email invite${pendingCount === 1 ? '' : 's'} sent to non-OpenI user${pendingCount === 1 ? '' : 's'}`);
                      if (r.skipped_existing) msgParts.push(`${r.skipped_existing} already invited`);
                      toast.success(msgParts.join(' · ') || 'Done');
                      setInviteEmails([]); setInviteEmailDraft('');
                      setInviteSelected([]); setInviteMessage(''); setInviteSearch(''); setInviteResults([]);
                      const list = await corporateAPI.listInvites(detail.id);
                      setInviteList(list.invites || []);
                    } catch (err) {
                      console.error('[send-invites]', err);
                      toast.error(err?.message || 'Failed to send invites');
                    } finally {
                      setInviteBusy(false);
                    }
                  }}
                  style={{ padding: '8px 18px', fontSize: 13, fontWeight: 700, background: (inviteSelected.length === 0 && inviteEmails.length === 0 && !(/\S+@\S+\.\S+/.test(inviteEmailDraft.trim()))) || inviteBusy ? '#ccc' : G, color: '#fff', border: 'none', borderRadius: 8, cursor: (inviteSelected.length === 0 && inviteEmails.length === 0 && !(/\S+@\S+\.\S+/.test(inviteEmailDraft.trim()))) || inviteBusy ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Send size={14} /> Send Invites
                </button>
              </div>

              {/* Existing invites */}
              <div style={{ borderTop: '1px solid #eee', paddingTop: 14 }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: '#333', margin: '0 0 10px' }}>Invited ({inviteList.length})</h4>
                {inviteList.length === 0 ? (
                  <p style={{ fontSize: 12, color: '#666', fontStyle: 'italic', margin: 0 }}>No invites sent yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {inviteList.map(inv => {
                      const colors = inv.status === 'pending' ? { bg: '#fef3c7', fg: '#92400e' }
                        : inv.status === 'accepted' ? { bg: '#dcfce7', fg: '#15803d' }
                        : inv.status === 'declined' ? { bg: '#fee2e2', fg: '#b91c1c' }
                        : { bg: '#f3f4f6', fg: '#6b7280' };
                      return (
                        <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#fafafa', borderRadius: 8, fontSize: 12 }}>
                          <div>
                            <strong>{inv.invitee_name}</strong>
                            {inv.invitee_org && <span style={{ color: '#5c5c5c' }}> · {inv.invitee_org}</span>}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ padding: '2px 8px', borderRadius: 12, background: colors.bg, color: colors.fg, fontSize: 11, fontWeight: 600 }}>{inv.status}</span>
                            {inv.status === 'pending'
                              && (Number(inv.invited_by_user_id) === Number(user?.id) || user?.role === 'admin') && (
                              <button onClick={async () => {
                                if (!window.confirm(`Revoke invite for ${inv.invitee_name}?`)) return;
                                try {
                                  await corporateAPI.revokeInvite(detail.id, inv.id, inv.source);
                                  const list = await corporateAPI.listInvites(detail.id);
                                  setInviteList(list.invites || []);
                                  toast.success('Invite revoked');
                                } catch (err) { toast.error(err?.message || 'Failed'); }
                              }}
                                style={{ padding: '3px 8px', fontSize: 11, fontWeight: 600, background: 'transparent', color: '#c43c3c', border: '1px solid #c43c3c40', borderRadius: 6, cursor: 'pointer' }}>
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
          </div>
    // ---- BODY END ----
  );
}
