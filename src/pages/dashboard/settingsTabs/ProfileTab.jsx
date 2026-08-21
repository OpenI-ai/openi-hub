/**
 * ProfileTab - extracted from Settings.jsx (Phase 166 / W5-3).
 * The body between the sentinels is a VERBATIM slice of the pre-split file,
 * original lines 602-678 of 1507. Nothing inside was reformatted or reindented.
 * Props are the exact set of parent-scope names the slice referenced - they are
 * computed from the slice, never hand-listed, so the signature cannot drift from
 * the call site. Long prop lists are deliberate: grouping them into state/actions
 * objects would force rewriting the body and destroy the verbatim property.
 */
import { G, card } from './constants';
import { Shield, Save } from 'lucide-react';

export default function ProfileTab({ name, preferredCurrency, saveProfile, saving, setName, setPreferredCurrency, user }) {
  return (
    // ---- BODY START (original lines 602-678) ----
        <div style={{ ...card, padding: 28 }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>Profile Information</h2>

          {/* Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'rgba(213,170,91,0.12)', color: G,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, fontWeight: 700, border: '2px solid rgba(213,170,91,0.3)',
            }}>
              {(name || user?.email)?.[0]?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>{name || user?.email}</div>
              <div style={{ fontSize: 12, color: '#5c5c5c', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Shield size={11} color={G} />
                <span style={{ textTransform: 'capitalize' }}>{user?.role || 'User'}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#444', marginBottom: 6 }}>Full Name</label>
              <input value={name} onChange={e => setName(e.target.value)} style={{
                width: '100%', boxSizing: 'border-box', padding: '10px 14px',
                background: '#fafafa', border: '1.5px solid #e0e0e0', borderRadius: 9,
                fontSize: 16, color: '#1a1a1a', transition: 'border-color 0.15s',
              }}
                onFocus={e => e.target.style.borderColor = G}
                onBlur={e => e.target.style.borderColor = '#e0e0e0'}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#444', marginBottom: 6 }}>Email</label>
              <div style={{
                padding: '10px 14px', background: '#f5f5f5', border: '1.5px solid #e0e0e0',
                borderRadius: 9, fontSize: 14, color: '#5c5c5c',
              }}>
                {user?.email} <span style={{ fontSize: 11, color: '#6e6e6e' }}>(cannot be changed)</span>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#444', marginBottom: 6 }}>Role</label>
              <div style={{
                padding: '10px 14px', background: '#f5f5f5', border: '1.5px solid #e0e0e0',
                borderRadius: 9, fontSize: 14, color: '#5c5c5c', textTransform: 'capitalize',
              }}>
                {user?.role} <span style={{ fontSize: 11, color: '#6e6e6e' }}>(assigned by admin)</span>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#444', marginBottom: 6 }}>Preferred Currency</label>
              <select value={preferredCurrency} onChange={e => setPreferredCurrency(e.target.value)} style={{
                width: '100%', boxSizing: 'border-box', padding: '10px 14px',
                background: '#fafafa', border: '1.5px solid #e0e0e0', borderRadius: 9,
                fontSize: 16, color: '#1a1a1a', cursor: 'pointer',
              }}>
                <option value="INR">₹ Indian Rupee (INR)</option>
                <option value="USD">$ US Dollar (USD)</option>
              </select>
              <div style={{ fontSize: 11, color: '#5c5c5c', marginTop: 5 }}>
                Default currency used when creating new programs, batches, and partnerships. Existing records keep their original currency.
              </div>
            </div>
          </div>

          <button onClick={saveProfile} disabled={saving} style={{
            marginTop: 24, padding: '11px 28px', background: saving ? '#ccc' : G, color: '#fff',
            border: 'none', borderRadius: 9, cursor: saving ? 'default' : 'pointer',
            fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: saving ? 'none' : '0 2px 10px rgba(213,170,91,0.3)',
          }}>
            <Save size={14} /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
    // ---- BODY END ----
  );
}
