/**
 * AccountInfoCard - extracted from Settings.jsx (Phase 166 / W5-3).
 * The body between the sentinels is a VERBATIM slice of the pre-split file,
 * original lines 1479-1494 of 1507. Nothing inside was reformatted or reindented.
 * Props are the exact set of parent-scope names the slice referenced - they are
 * computed from the slice, never hand-listed, so the signature cannot drift from
 * the call site. Long prop lists are deliberate: grouping them into state/actions
 * objects would force rewriting the body and destroy the verbatim property.
 */
import { card } from './constants';

export default function AccountInfoCard({ user }) {
  return (
    // ---- BODY START (original lines 1479-1494) ----
      <div style={{ ...card, padding: 20, marginTop: 20 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>Account Information</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          {[
            { label: 'User ID', value: user?.id || '—' },
            { label: 'Role', value: user?.role || '—' },
            { label: 'Email', value: user?.email || '—' },
            { label: 'Platform', value: 'OpenI Hub v1.0' },
          ].map(({ label, value }) => (
            <div key={label} style={{ padding: '8px 0' }}>
              <div style={{ fontSize: 10, color: '#aaa', marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 12, color: '#1a1a1a', fontWeight: 500, textTransform: label === 'Role' ? 'capitalize' : 'none' }}>{value}</div>
            </div>
          ))}
        </div>
      </div>
    // ---- BODY END ----
  );
}
