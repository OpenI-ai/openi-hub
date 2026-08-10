import { Globe, Mail, Plus, Search, UserPlus, Users, X } from 'lucide-react';
import Modal from './Modal';
import { G } from './styles';

export default function SharesModal({
  addCollabEmail, changeCollaboratorRole, collabBusy, collabEmailDraft, collabEmails,
  collabList, collabLoading, collabMessage, collabResults, collabRole, collabSearch,
  collabSelected, copyShareUrl, mintNewShare, minting, removeOneCollaborator,
  revokeOneShare, selectedList, sendCollaboratorInvites, setCollabEmailDraft,
  setCollabEmails, setCollabMessage, setCollabResults, setCollabRole, setCollabSearch,
  setCollabSelected, setSharesTab, setShowSharesModal, sharesList, sharesLoading,
  sharesTab,
}) {
  return (
        <Modal title={`Share "${selectedList.name}"`} onClose={() => setShowSharesModal(false)} wide>
          {/* Tab strip */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 18, borderBottom: '1.5px solid #eee' }}>
            <button onClick={() => setSharesTab('link')}
              style={{ padding: '10px 16px', fontSize: 13, fontWeight: 700, background: 'none',
                       border: 'none', borderBottom: sharesTab === 'link' ? `2.5px solid ${G}` : '2.5px solid transparent',
                       marginBottom: -1.5, color: sharesTab === 'link' ? G : '#777', cursor: 'pointer',
                       display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Globe size={13} /> Public link
            </button>
            <button onClick={() => setSharesTab('collab')}
              style={{ padding: '10px 16px', fontSize: 13, fontWeight: 700, background: 'none',
                       border: 'none', borderBottom: sharesTab === 'collab' ? `2.5px solid ${G}` : '2.5px solid transparent',
                       marginBottom: -1.5, color: sharesTab === 'collab' ? G : '#777', cursor: 'pointer',
                       display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Users size={13} /> Collaborators {collabList.length > 0 && <span style={{ background: '#fff8ec', color: G, padding: '1px 6px', borderRadius: 10, fontSize: 10 }}>{collabList.length}</span>}
            </button>
          </div>

          {sharesTab === 'link' && (<>
          <p style={{ fontSize: 12, color: '#666', margin: '0 0 14px', lineHeight: 1.5 }}>
            Create a link that anyone can use to view this watchlist (no OpenI account needed). Links default to a 30-day expiry and can be revoked at any time.
          </p>
          <button
            onClick={mintNewShare}
            disabled={minting}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16,
              padding: '8px 16px', background: G, color: '#fff', border: 'none',
              borderRadius: 9, cursor: minting ? 'not-allowed' : 'pointer',
              fontSize: 13, fontWeight: 700,
              opacity: minting ? 0.5 : 1,
            }}
          >
            <Plus size={13} /> {minting ? 'Creating…' : 'Create new share link'}
          </button>

          {sharesLoading ? (
            <p style={{ color: '#888', fontSize: 13, textAlign: 'center', margin: '20px 0' }}>
              Loading existing share links…
            </p>
          ) : sharesList.length === 0 ? (
            <p style={{ color: '#888', fontSize: 13, textAlign: 'center', margin: '20px 0', fontStyle: 'italic' }}>
              No share links yet. Click the button above to create one.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 320, overflowY: 'auto' }}>
              {sharesList.map(s => {
                const expired = s.expires_at && new Date(s.expires_at) < new Date();
                const revoked = !!s.revoked_at;
                const inactive = expired || revoked;
                const shareUrl = `${window.location.origin}/watchlists/share/${s.token}`;
                return (
                  <div key={s.id} style={{
                    padding: 12, borderRadius: 9,
                    background: inactive ? '#fafafa' : '#fff8ec',
                    border: `1px solid ${inactive ? '#eee' : 'rgba(213,170,91,0.3)'}`,
                    opacity: inactive ? 0.6 : 1,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: revoked ? '#fef2f2' : (expired ? '#fef9e7' : '#f0fdf4'), color: revoked ? '#dc2626' : (expired ? '#a16207' : '#16a34a') }}>
                        {revoked ? 'REVOKED' : (expired ? 'EXPIRED' : 'ACTIVE')}
                      </span>
                      <span style={{ fontSize: 11, color: '#888', flex: 1 }}>
                        Created {new Date(s.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        {s.expires_at && !revoked && !expired && (
                          <> · Expires {new Date(s.expires_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</>
                        )}
                      </span>
                    </div>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: 8,
                      background: '#fff', borderRadius: 7, border: '1px solid #eee',
                      fontSize: 11, color: '#555', fontFamily: 'monospace',
                      overflow: 'hidden',
                    }}>
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shareUrl}</span>
                      {!inactive && (
                        <>
                          <button onClick={() => copyShareUrl(s.token)} style={{ padding: '4px 8px', background: '#f3f4f6', border: '1px solid #ddd', borderRadius: 6, fontSize: 10, fontWeight: 600, color: '#555', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                            Copy
                          </button>
                          <button onClick={() => revokeOneShare(s.id)} style={{ padding: '4px 8px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, fontSize: 10, fontWeight: 600, color: '#dc2626', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                            Revoke
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          </>)}

          {/* Phase 109: end of Public-link tab, start Collaborators tab */}
          {sharesTab === 'collab' && (<>
          <p style={{ fontSize: 12, color: '#666', margin: '0 0 14px', lineHeight: 1.5 }}>
            Invite OpenI users (or any email) as collaborators on this watchlist. Editors can add/remove startups; viewers have read-only access.
          </p>

          {/* Role picker */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {['viewer', 'editor'].map(r => (
              <button key={r} onClick={() => setCollabRole(r)}
                style={{ flex: 1, padding: '9px 12px', fontSize: 12, fontWeight: 700,
                         background: collabRole === r ? G : '#f5f5f5',
                         color: collabRole === r ? '#fff' : '#666',
                         border: `1.5px solid ${collabRole === r ? G : '#e5e7eb'}`,
                         borderRadius: 8, cursor: 'pointer', textTransform: 'capitalize',
                         display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {r === 'editor' ? <UserPlus size={12} /> : <Users size={12} />}
                {r === 'viewer' ? 'Viewer (read-only)' : 'Editor (can mutate startups)'}
              </button>
            ))}
          </div>

          {/* User typeahead */}
          <label style={{ fontSize: 12, fontWeight: 600, color: '#444', display: 'block', marginBottom: 4 }}>Search OpenI users by name or email</label>
          <div style={{ position: 'relative', marginBottom: 8 }}>
            <input value={collabSearch} onChange={e => setCollabSearch(e.target.value)}
              placeholder="Start typing a name or email…"
              style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', background: '#fafafa', border: '1.5px solid #e0e0e0', borderRadius: 9, fontSize: 16, outline: 'none' }} />
            {collabResults.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: '#fff', border: '1.5px solid #e0e0e0', borderRadius: 9, boxShadow: '0 4px 16px rgba(0,0,0,0.08)', zIndex: 50, maxHeight: 240, overflowY: 'auto' }}>
                {collabResults.map(u => (
                  <button key={u.id} type="button" onClick={() => {
                    setCollabSelected(prev => [...prev, { id: u.id, name: u.name, email: u.email }]);
                    setCollabSearch(''); setCollabResults([]);
                  }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '9px 12px', background: 'transparent', border: 'none', borderBottom: '1px solid #f3f4f6', cursor: 'pointer', fontSize: 12 }}>
                    <div style={{ fontWeight: 600, color: '#1a1a1a' }}>{u.name}</div>
                    <div style={{ color: '#888', fontSize: 11 }}>{u.email}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected user chips */}
          {collabSelected.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {collabSelected.map(u => (
                <span key={u.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff8ec', border: '1.5px solid rgba(213,170,91,0.4)', borderRadius: 14, padding: '4px 10px', fontSize: 11, color: '#5a4715' }}>
                  {u.name}
                  <button onClick={() => setCollabSelected(prev => prev.filter(x => x.id !== u.id))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                    <X size={11} color="#5a4715" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Email field (non-OpenI invites) */}
          <label style={{ fontSize: 12, fontWeight: 600, color: '#444', display: 'block', marginBottom: 4, marginTop: 6 }}>Or invite by email (non-OpenI users)</label>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            <input value={collabEmailDraft} onChange={e => setCollabEmailDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCollabEmail(); } }}
              placeholder="founder@startup.com — press Enter"
              style={{ flex: 1, padding: '9px 12px', background: '#fafafa', border: '1.5px solid #e0e0e0', borderRadius: 9, fontSize: 16, outline: 'none' }} />
            <button type="button" onClick={addCollabEmail}
              style={{ padding: '9px 14px', background: '#f5f5f5', border: '1.5px solid #e0e0e0', borderRadius: 9, fontSize: 12, fontWeight: 600, color: '#555', cursor: 'pointer' }}>
              Add
            </button>
          </div>
          {collabEmails.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {collabEmails.map(em => (
                <span key={em} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: 14, padding: '4px 10px', fontSize: 11, color: '#1e40af' }}>
                  <Mail size={10} /> {em}
                  <button onClick={() => setCollabEmails(prev => prev.filter(x => x !== em))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                    <X size={11} color="#1e40af" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Personal message */}
          <label style={{ fontSize: 12, fontWeight: 600, color: '#444', display: 'block', marginBottom: 4 }}>Personal message (optional)</label>
          <textarea value={collabMessage} onChange={e => setCollabMessage(e.target.value)} rows={2}
            placeholder="Add context — what excites you about sharing this watchlist?"
            style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', background: '#fafafa', border: '1.5px solid #e0e0e0', borderRadius: 9, fontSize: 16, outline: 'none', resize: 'vertical', marginBottom: 14 }} />

          {/* Send button */}
          <button onClick={sendCollaboratorInvites}
            disabled={collabBusy || (collabSelected.length === 0 && collabEmails.length === 0)}
            style={{ width: '100%', padding: '10px 16px', fontSize: 13, fontWeight: 700,
                     background: (collabSelected.length === 0 && collabEmails.length === 0) || collabBusy ? '#ccc' : G,
                     color: '#fff', border: 'none', borderRadius: 9,
                     cursor: (collabSelected.length === 0 && collabEmails.length === 0) || collabBusy ? 'not-allowed' : 'pointer',
                     marginBottom: 18,
                     display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <UserPlus size={14} /> {collabBusy ? 'Sending…' : 'Send Invites'}
          </button>

          {/* Existing collaborators list */}
          <div style={{ borderTop: '1px solid #eee', paddingTop: 14 }}>
            <h4 style={{ fontSize: 12, fontWeight: 700, color: '#333', margin: '0 0 10px' }}>Collaborators ({collabList.length})</h4>
            {collabLoading ? (
              <p style={{ color: '#888', fontSize: 12, textAlign: 'center', margin: '14px 0' }}>Loading…</p>
            ) : collabList.length === 0 ? (
              <p style={{ color: '#888', fontSize: 12, fontStyle: 'italic', margin: 0 }}>No collaborators yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 240, overflowY: 'auto' }}>
                {collabList.map(c => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: '#fafafa', borderRadius: 7 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                      <div style={{ fontSize: 10, color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.email}{c.organization_name ? ` · ${c.organization_name}` : ''}</div>
                    </div>
                    <select value={c.role} onChange={e => changeCollaboratorRole(c.id, e.target.value)}
                      style={{ fontSize: 16, padding: '4px 8px', background: '#fff', border: '1px solid #e0e0e0', borderRadius: 6, color: '#555' }}>
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                    </select>
                    <button onClick={() => removeOneCollaborator(c.id)}
                      style={{ padding: '4px 8px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, fontSize: 10, fontWeight: 600, color: '#dc2626', cursor: 'pointer' }}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          </>)}
        </Modal>
  );
}
