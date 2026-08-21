/**
 * TeamModal — extracted from CorporateChallenges.jsx (Phase 165 / W5-2).
 *
 * The body between the sentinels is a VERBATIM slice of the pre-split file,
 * original lines 1184-1280 of 1721. Nothing inside was reformatted or reindented.
 * Props are the exact set of parent-scope names the slice referenced — they are
 * computed from the slice, never hand-listed, so the signature cannot drift from
 * the call site. Long prop lists are deliberate: grouping them into state/actions
 * objects would force rewriting the body and destroy the verbatim property.
 */

import { Trash2, X } from 'lucide-react';
import { G } from './constants';

export default function TeamModal({
  addMemberBusy, addMemberEmail, addMemberRole, addTeamMember, detail, removeTeamMember,
  setAddMemberEmail, setAddMemberRole, setShowTeam, teamLoading, teamMembers,
  updateTeamMemberRole,
}) {
  return (
    // ---- BODY START (original lines 1184-1280) ----
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20,
          }}>
            <div style={{
              background: '#fff', borderRadius: 12, padding: 24, maxWidth: 600, width: '100%',
              maxHeight: '90vh', overflowY: 'auto',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: '#111' }}>Manage Challenge Team</h3>
                <button onClick={() => { setShowTeam(false); setAddMemberEmail(''); setAddMemberRole('reviewer'); }}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}>
                  <X size={18} color="#666" />
                </button>
              </div>
              <p style={{ fontSize: 12, color: '#666', margin: '0 0 16px' }}>
                Add reviewers (rate applications), viewers (read-only), or editors (full access except delete).
                They get notified and can find this challenge in their "Challenges to Review" inbox.
              </p>

              {/* Add Member Form */}
              <div style={{ padding: 14, background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: 10, marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input type="email" value={addMemberEmail}
                    onChange={(e) => setAddMemberEmail(e.target.value)}
                    placeholder="member@example.com"
                    style={{ flex: 1, padding: '8px 12px', fontSize: 16, border: '1.5px solid #e5e7eb', borderRadius: 8, outline: 'none', background: '#fff' }} />
                  <select value={addMemberRole}
                    onChange={(e) => setAddMemberRole(e.target.value)}
                    style={{ padding: '8px 12px', fontSize: 16, border: '1.5px solid #e5e7eb', borderRadius: 8, background: '#fff', cursor: 'pointer' }}>
                    <option value="reviewer">Reviewer</option>
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                  </select>
                  <button onClick={() => addTeamMember(detail.id)}
                    disabled={addMemberBusy || !addMemberEmail.trim()}
                    style={{ padding: '8px 16px', fontSize: 13, fontWeight: 700, background: addMemberBusy || !addMemberEmail.trim() ? '#ccc' : G, color: '#fff', border: 'none', borderRadius: 8, cursor: addMemberBusy || !addMemberEmail.trim() ? 'not-allowed' : 'pointer' }}>
                    {addMemberBusy ? 'Adding...' : 'Add'}
                  </button>
                </div>
                <p style={{ fontSize: 11, color: '#5c5c5c', margin: 0 }}>
                  If they're not on OpenI Hub yet, we'll email them a sign-up invite and add them to your team automatically once they join.
                </p>
              </div>

              {/* Members List */}
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#333', margin: '0 0 10px' }}>
                Team Members ({teamMembers.length})
              </h4>
              {teamLoading && (
                <p style={{ fontSize: 12, color: '#5c5c5c', fontStyle: 'italic', margin: 0 }}>Loading...</p>
              )}
              {!teamLoading && teamMembers.length === 0 && (
                <p style={{ fontSize: 12, color: '#666', fontStyle: 'italic', margin: 0 }}>No team members yet. Add reviewers above.</p>
              )}
              {!teamLoading && teamMembers.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {teamMembers.map(m => (
                    <div key={m.user_id || m.id}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{m.name || m.email}</div>
                        <div style={{ fontSize: 11, color: '#5c5c5c' }}>{m.email}</div>
                      </div>
                      {m.role === 'owner' ? (
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 12, background: '#fff3cd', color: '#6f5629', border: '1px solid #ffeaa7' }}>
                          Owner
                        </span>
                      ) : (
                        <>
                          <select value={m.role}
                            onChange={(e) => updateTeamMemberRole(detail.id, m.user_id || m.id, e.target.value)}
                            style={{ padding: '4px 8px', fontSize: 16, border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff', cursor: 'pointer' }}>
                            <option value="reviewer">Reviewer</option>
                            <option value="viewer">Viewer</option>
                            <option value="editor">Editor</option>
                          </select>
                          <button onClick={() => removeTeamMember(detail.id, m.user_id || m.id)}
                            title="Remove member"
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, color: '#c43c3c' }}>
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                <button onClick={() => { setShowTeam(false); setAddMemberEmail(''); setAddMemberRole('reviewer'); }}
                  style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600, background: '#fff', color: '#666', border: '1.5px solid #ccc', borderRadius: 8, cursor: 'pointer' }}>
                  Close
                </button>
              </div>
            </div>
          </div>
    // ---- BODY END ----
  );
}
