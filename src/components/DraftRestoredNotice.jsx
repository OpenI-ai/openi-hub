/**
 * DraftRestoredNotice — "we kept what you were typing".
 *
 * One component rather than a banner re-written per form, so the wording and
 * the escape hatch are identical everywhere. Silent restoration is worse than
 * no restoration: on an edit form, recovered values look exactly like the
 * saved ones, and the user has no way to tell which they are looking at or to
 * get back to the saved version. This says which, and offers the way back.
 *
 * Inline styles, not Tailwind classes: this drops into both style systems in
 * the codebase (the dashboard pages are almost entirely inline-styled) and
 * must not depend on which one the host form uses.
 */
import { RotateCcw } from 'lucide-react';

const G = '#D0A848';

export default function DraftRestoredNotice({ draft, onStartOver, editing = false, style }) {
  if (!draft?.restored) return null;

  const startOver = onStartOver || draft.resetForm;

  return (
    <div
      role="status"
      style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        gap: 12, padding: '9px 12px', borderRadius: 10,
        border: `1px solid ${G}55`, background: 'rgba(208,168,72,0.10)',
        ...style,
      }}
    >
      <p style={{ fontSize: 12, color: '#4b5563', margin: 0, lineHeight: 1.5 }}>
        <strong style={{ color: '#1a1a1a' }}>Unsaved draft restored.</strong>{' '}
        {editing
          ? 'These are your unsaved edits, not the saved version.'
          : 'This has not been submitted yet.'}
        {draft.restoredFileName && (
          <>
            {' '}The attachment <strong>{draft.restoredFileName}</strong> could not be kept — re-attach it below.
          </>
        )}
      </p>
      {startOver && (
        <button
          type="button"
          onClick={startOver}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0,
            background: 'none', border: 'none', padding: 0, fontSize: 12,
            fontWeight: 600, color: '#6b7280', cursor: 'pointer',
          }}
        >
          <RotateCcw size={12} /> {editing ? 'Revert' : 'Start over'}
        </button>
      )}
    </div>
  );
}
