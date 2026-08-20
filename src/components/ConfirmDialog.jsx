import { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

/**
 * s83 (20 Aug 2026) — a real confirmation dialog, replacing `window.confirm()`.
 *
 * WHY THIS EXISTS
 * ---------------
 * `window.confirm()` is the last thing a user sees before a destructive action,
 * and it is the worst possible surface for it:
 *   - unstyleable, so it looks like a browser error rather than our product;
 *   - it renders the ORIGIN ("openi.ai says…"), which reads like a warning
 *     about the site instead of a question from it;
 *   - it cannot show structure — no emphasis on what is kept vs what is lost,
 *     which is exactly the distinction that matters for a delete;
 *   - it BLOCKS the renderer synchronously. Nothing else on the page can paint,
 *     and any automation driving the page (ours included) hangs until it is
 *     dismissed.
 *
 * USAGE — state-driven, not promise-driven, so the caller stays declarative:
 *
 *   const [confirm, setConfirm] = useState(null);
 *   ...
 *   <button onClick={() => setConfirm({ id, title })}>Delete</button>
 *   <ConfirmDialog
 *     open={!!confirm}
 *     title={`Delete "${confirm?.title}"?`}
 *     body={<p>…</p>}
 *     confirmLabel="Delete"
 *     tone="danger"
 *     onConfirm={() => doDelete(confirm.id)}
 *     onClose={() => setConfirm(null)}
 *   />
 *
 * ACCESSIBILITY: focus moves to the dialog on open and Escape cancels, because
 * a keyboard user must be able to back out of a destructive prompt as easily as
 * a mouse user. The confirm button is deliberately NOT autofocused — for a
 * destructive action the safe default should be the one a stray Enter hits.
 */
export default function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',          // 'danger' | 'neutral'
  busy = false,
  onConfirm,
  onClose,
}) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    panelRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape' && !busy) onClose?.(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, busy, onClose]);

  if (!open) return null;

  const confirmClasses = tone === 'danger'
    ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
    : 'bg-primary-600 hover:bg-primary-700 focus:ring-primary-500';

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      onClick={() => { if (!busy) onClose?.(); }}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="alertdialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : 'Confirm action'}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 p-5 border-b border-gray-100">
          {tone === 'danger' && (
            <span className="flex-shrink-0 mt-0.5 p-2 rounded-full bg-red-50 text-red-600">
              <AlertTriangle size={18} />
            </span>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-display font-bold text-gray-900 break-words">{title}</h2>
          </div>
          <button
            onClick={() => { if (!busy) onClose?.(); }}
            className="p-1 text-gray-400 hover:text-gray-700 flex-shrink-0"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {body && <div className="p-5 text-sm text-gray-600 space-y-2">{body}</div>}

        <div className="flex items-center justify-end gap-2 p-5 pt-0">
          <button
            onClick={() => { if (!busy) onClose?.(); }}
            disabled={busy}
            className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className={`px-4 py-2 text-sm font-semibold text-white rounded-xl transition-colors disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-offset-1 ${confirmClasses}`}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
