/**
 * NotificationsTab - extracted from Settings.jsx (Phase 166 / W5-3).
 * The body between the sentinels is a VERBATIM slice of the pre-split file,
 * original lines 1325-1355 of 1507. Nothing inside was reformatted or reindented.
 * Props are the exact set of parent-scope names the slice referenced - they are
 * computed from the slice, never hand-listed, so the signature cannot drift from
 * the call site. Long prop lists are deliberate: grouping them into state/actions
 * objects would force rewriting the body and destroy the verbatim property.
 */
import { G, card } from './constants';

export default function NotificationsTab({ emailNotif, pushNotif, setEmailNotif, setPushNotif }) {
  return (
    // ---- BODY START (original lines 1325-1355) ----
        <div style={{ ...card, padding: 28 }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>Notification Preferences</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { label: 'Email Notifications', desc: 'Receive updates via email for evaluations, feedback, and events', value: emailNotif, toggle: setEmailNotif },
              { label: 'Push Notifications', desc: 'Browser push notifications for messages and alerts', value: pushNotif, toggle: setPushNotif },
            ].map(({ label, desc, value, toggle }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', background: '#fafafa', borderRadius: 10, border: '1px solid #f0f0f0' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>{label}</div>
                  <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{desc}</div>
                </div>
                <button onClick={() => toggle(!value)} style={{
                  width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: value ? G : '#e0e0e0', position: 'relative', transition: 'background 0.2s',
                }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%', background: '#fff',
                    position: 'absolute', top: 3, left: value ? 23 : 3,
                    transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }} />
                </button>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24, padding: '14px 18px', background: '#fff8ec', borderRadius: 10, border: '1px solid rgba(213,170,91,0.3)', fontSize: 12, color: '#888' }}>
            <strong style={{ color: G }}>Note:</strong> Notification preferences are stored locally and will be synced to the server in a future update.
          </div>
        </div>
    // ---- BODY END ----
  );
}
