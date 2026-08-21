/**
 * SecurityTab - extracted from Settings.jsx (Phase 166 / W5-3).
 * The body between the sentinels is a VERBATIM slice of the pre-split file,
 * original lines 683-828 of 1507. Nothing inside was reformatted or reindented.
 * Props are the exact set of parent-scope names the slice referenced - they are
 * computed from the slice, never hand-listed, so the signature cannot drift from
 * the call site. Long prop lists are deliberate: grouping them into state/actions
 * objects would force rewriting the body and destroy the verbatim property.
 */
import { G, card } from './constants';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';

export default function SecurityTab({ changePassword, changingPw, confirmPw, currentPw, handleMfaDisable, handleMfaEnable, handleMfaSetupStart, mfaBusy, mfaCode, mfaDisablePw, mfaSetup, mfaStatus, newPw, setConfirmPw, setCurrentPw, setMfaCode, setMfaDisablePw, setMfaSetup, setNewPw, setShowCurrent, setShowMfaDisable, setShowNew, showCurrent, showMfaDisable, showNew }) {
  return (
    // ---- BODY START (original lines 683-828) ----
        <div style={{ ...card, padding: 28 }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>Change Password</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 400 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#444', marginBottom: 6 }}>Current Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showCurrent ? 'text' : 'password'} value={currentPw} onChange={e => setCurrentPw(e.target.value)}
                  placeholder="Enter current password"
                  style={{
                    width: '100%', boxSizing: 'border-box', padding: '10px 40px 10px 14px',
                    background: '#fafafa', border: '1.5px solid #e0e0e0', borderRadius: 9,
                    fontSize: 16, outline: 'none', color: '#1a1a1a',
                  }}
                />
                <button onClick={() => setShowCurrent(!showCurrent)} style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#6e6e6e', padding: 4,
                }}>
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#444', marginBottom: 6 }}>New Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showNew ? 'text' : 'password'} value={newPw} onChange={e => setNewPw(e.target.value)}
                  placeholder="Min 6 characters"
                  style={{
                    width: '100%', boxSizing: 'border-box', padding: '10px 40px 10px 14px',
                    background: '#fafafa', border: '1.5px solid #e0e0e0', borderRadius: 9,
                    fontSize: 16, outline: 'none', color: '#1a1a1a',
                  }}
                />
                <button onClick={() => setShowNew(!showNew)} style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#6e6e6e', padding: 4,
                }}>
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#444', marginBottom: 6 }}>Confirm New Password</label>
              <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                placeholder="Repeat new password"
                style={{
                  width: '100%', boxSizing: 'border-box', padding: '10px 14px',
                  background: '#fafafa', border: '1.5px solid #e0e0e0', borderRadius: 9,
                  fontSize: 16, outline: 'none', color: '#1a1a1a',
                }}
              />
              {confirmPw && newPw !== confirmPw && (
                <div style={{ fontSize: 11, color: '#dc2626', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <AlertCircle size={11} /> Passwords do not match
                </div>
              )}
              {confirmPw && newPw === confirmPw && newPw.length >= 6 && (
                <div style={{ fontSize: 11, color: '#16a34a', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CheckCircle2 size={11} /> Passwords match
                </div>
              )}
            </div>
          </div>

          <button onClick={changePassword} disabled={changingPw} style={{
            marginTop: 24, padding: '11px 28px',
            background: changingPw ? '#ccc' : '#1a1a1a', color: '#fff',
            border: 'none', borderRadius: 9, cursor: changingPw ? 'default' : 'pointer',
            fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <Lock size={14} /> {changingPw ? 'Changing...' : 'Change Password'}
          </button>

          {/* MFA Section — Phase 54 */}
          <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid #eee' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>Multi-Factor Authentication (TOTP)</h3>

            {!mfaStatus && <div style={{ fontSize: 12, color: '#666' }}>Loading…</div>}

            {mfaStatus?.bypass && (
              <div style={{ padding: '12px 16px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 12, color: '#555' }}>
                This account is in the demo/admin bypass list — MFA is never enforced on login. Enrollment is disabled.
              </div>
            )}

            {!mfaStatus?.bypass && mfaStatus?.enabled && !showMfaDisable && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: '#f0fdf4', borderRadius: 10, border: '1px solid #bbf7d0', marginBottom: 12 }}>
                  <CheckCircle2 size={18} color="#16a34a" />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#16a34a' }}>MFA enabled</div>
                    <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>Enrolled {mfaStatus.enrolled_at ? new Date(mfaStatus.enrolled_at).toLocaleDateString() : ''}</div>
                  </div>
                </div>
                <button onClick={() => setShowMfaDisable(true)} style={{ padding: '8px 14px', background: '#fff', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  Disable MFA
                </button>
              </div>
            )}

            {!mfaStatus?.bypass && mfaStatus?.enabled && showMfaDisable && (
              <form onSubmit={handleMfaDisable} style={{ padding: 16, border: '1px solid #fecaca', borderRadius: 10, background: '#fef2f2' }}>
                <div style={{ fontSize: 13, color: '#b91c1c', marginBottom: 12, fontWeight: 600 }}>Confirm disable — requires password + current MFA code</div>
                <input type="password" placeholder="Current password" value={mfaDisablePw} onChange={e => setMfaDisablePw(e.target.value)} style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 8, marginBottom: 8, fontSize: 16 }} />
                <input type="text" placeholder="6-digit code" value={mfaCode} onChange={e => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))} maxLength={6} style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 8, marginBottom: 12, fontSize: 16, letterSpacing: 4, textAlign: 'center' }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="submit" disabled={mfaBusy} style={{ flex: 1, padding: 10, background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: mfaBusy ? 'wait' : 'pointer' }}>
                    {mfaBusy ? 'Disabling…' : 'Disable MFA'}
                  </button>
                  <button type="button" onClick={() => { setShowMfaDisable(false); setMfaCode(''); setMfaDisablePw(''); }} style={{ padding: '10px 14px', background: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                </div>
              </form>
            )}

            {!mfaStatus?.bypass && mfaStatus && !mfaStatus.enabled && !mfaSetup && (
              <div>
                <div style={{ padding: '12px 16px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, fontSize: 12, color: '#92400e', marginBottom: 12 }}>
                  MFA is <strong>not enabled</strong>. We strongly recommend enrolling an authenticator app (Google Authenticator, 1Password, Authy).
                </div>
                <button onClick={handleMfaSetupStart} disabled={mfaBusy} style={{ padding: '10px 18px', background: G, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: mfaBusy ? 'wait' : 'pointer' }}>
                  {mfaBusy ? 'Starting…' : 'Enable MFA'}
                </button>
              </div>
            )}

            {!mfaStatus?.bypass && mfaSetup && (
              <form onSubmit={handleMfaEnable} style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 10, background: '#fafafa' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', marginBottom: 8 }}>1. Scan this QR with your authenticator app</div>
                <div style={{ textAlign: 'center', marginBottom: 12 }}>
                  <img src={mfaSetup.qr_data_url} alt="MFA QR" style={{ width: 180, height: 180 }} />
                </div>
                <div style={{ fontSize: 11, color: '#666', marginBottom: 8 }}>Or enter this secret manually:</div>
                <div style={{ fontFamily: 'monospace', fontSize: 12, padding: 8, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, marginBottom: 12, wordBreak: 'break-all' }}>{mfaSetup.secret_base32}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', marginBottom: 8 }}>2. Enter the current 6-digit code to confirm</div>
                <input type="text" inputMode="numeric" placeholder="123456" value={mfaCode} onChange={e => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))} maxLength={6} style={{ width: '100%', padding: 12, border: '1px solid #ddd', borderRadius: 8, marginBottom: 12, fontSize: 16, letterSpacing: 6, textAlign: 'center' }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="submit" disabled={mfaBusy || mfaCode.length < 6} style={{ flex: 1, padding: 10, background: mfaCode.length < 6 ? '#ccc' : '#16a34a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: (mfaBusy || mfaCode.length < 6) ? 'default' : 'pointer' }}>
                    {mfaBusy ? 'Verifying…' : 'Confirm & Enable'}
                  </button>
                  <button type="button" onClick={() => { setMfaSetup(null); setMfaCode(''); }} style={{ padding: '10px 14px', background: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                </div>
              </form>
            )}
          </div>
        </div>
    // ---- BODY END ----
  );
}
