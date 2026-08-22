/**
 * useFormDraft — keep a half-filled form alive across navigation.
 *
 * WHY THIS EXISTS
 * ---------------
 * Reported 22 Aug 2026, against the Knowledge Hub report upload: "if you move
 * away from the page after populating the data and report, everything gets
 * deleted." That was true, and it was not specific to that form — before this
 * hook there was no unsaved-work protection anywhere in the app. A grep for
 * `beforeunload`, `useBlocker` and `usePrompt` across src/ returned nothing;
 * MyProfile.jsx had a dirty *indicator* (`isDirty`, "You have unsaved changes")
 * but nothing that acted on it. Every form in the product was one stray click
 * from losing its contents:
 *
 *   - eight modals close on a backdrop click, most of them straight into a
 *     state reset, so a misclick beside the dialog wiped the form with no
 *     confirmation and no undo
 *   - any route change unmounts the component and takes its useState with it
 *   - a tab close, a crash or a dead battery did the same
 *
 * A router-level "are you sure you want to leave?" prompt would only address
 * the second of those, and it makes the user defend their work instead of
 * simply keeping it. Persisting the draft addresses all three, and it needs no
 * confirmation dialogs: leaving is no longer destructive, so leaving can stay
 * free.
 *
 * SCOPING IS NOT OPTIONAL
 * -----------------------
 * The key is namespaced with the signed-in user's id, read from AuthContext
 * here rather than accepted as an argument. A caller that forgot to pass it
 * would leak one person's unsent pitch into the next person's form on a shared
 * machine, and that is not a mistake worth leaving available. On logout the
 * id changes, so the previous user's drafts stop resolving.
 *
 * WHAT IT DELIBERATELY DOES NOT PERSIST
 * -------------------------------------
 * File objects. They are not serializable and a File handle would not survive
 * a reload even if they were. `fileHint` lets a caller record the *name* of a
 * pending attachment so the restore notice can say what needs re-attaching,
 * rather than silently dropping it.
 *
 * Storage goes through safeStorage: in-app WebViews and private mode expose
 * localStorage and then throw on access (Sentry OPENI-HUB-FRONTEND-F). A
 * draft is a convenience, so every failure path here degrades to "no draft"
 * rather than surfacing an error.
 *
 * WHAT MUST NEVER BE DRAFTED
 * --------------------------
 * localStorage is readable by any script on the origin and survives logout.
 * Do NOT attach this hook to a form carrying a password, a current/new
 * credential pair, an SSO client secret, an API key, or card details. The
 * convenience is not worth writing a secret to disk. Login, the password tab
 * in Settings, the SSO configuration form and the registration password step
 * are deliberately left alone for this reason; the rule matters more than any
 * individual form, because the next person to add a form will copy a
 * neighbour.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import safeStorage from '../utils/safeStorage';

const PREFIX = 'openi_draft';
const WRITE_DEBOUNCE_MS = 400;

/** Drafts older than this are ignored and swept on next access. */
export const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * @param {object}   opts
 * @param {string}   opts.key       Stable id for this form, e.g. 'knowledge:new'
 *                                  or `challenge-apply:${challengeId}`. Namespaced
 *                                  per user internally — do not add the user id.
 * @param {object}   opts.value     The current form state (must be JSON-safe).
 * @param {function} opts.onRestore Called once with a recovered draft, if any.
 * @param {boolean}  opts.enabled   Suspend persistence (e.g. modal closed).
 * @param {boolean}  opts.pristine  True when `value` is untouched. A pristine
 *                                  form never overwrites a stored draft, which
 *                                  is what lets a caller reset its state on
 *                                  close without destroying the recovery copy.
 * @param {string}   opts.fileHint  Name of a pending, unpersistable attachment.
 * @returns {{restored: boolean, restoredFileName: string|null,
 *            clearDraft: function, discardDraft: function}}
 */
export default function useFormDraft({
  key,
  value,
  onRestore,
  enabled = true,
  pristine = false,
  fileHint = null,
}) {
  const { user } = useAuth();
  const storageKey = user?.id && key ? `${PREFIX}:${user.id}:${key}` : null;

  const [restored, setRestored] = useState(false);
  const [restoredFileName, setRestoredFileName] = useState(null);

  // Read once per key. Refs, not state: re-running the restore after the user
  // has started typing would clobber what they just wrote.
  const restoreAttempted = useRef(null);
  const onRestoreRef = useRef(onRestore);
  onRestoreRef.current = onRestore;

  const clearDraft = useCallback(() => {
    if (storageKey) safeStorage.removeItem(storageKey);
    setRestored(false);
    setRestoredFileName(null);
  }, [storageKey]);

  // Restore. Separate from clearDraft only in that the caller is expected to
  // reset its own form state afterwards — "I don't want this back".
  const discardDraft = useCallback(() => { clearDraft(); }, [clearDraft]);

  useEffect(() => {
    if (!enabled || !storageKey) return;
    if (restoreAttempted.current === storageKey) return;
    restoreAttempted.current = storageKey;

    const raw = safeStorage.getItem(storageKey);
    if (!raw) return;

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Corrupt or hand-edited. Nothing to recover, and leaving it would make
      // every future load re-parse the same garbage.
      safeStorage.removeItem(storageKey);
      return;
    }

    if (!parsed || typeof parsed !== 'object' || !parsed.data) {
      safeStorage.removeItem(storageKey);
      return;
    }
    if (typeof parsed.savedAt !== 'number' || Date.now() - parsed.savedAt > DRAFT_TTL_MS) {
      safeStorage.removeItem(storageKey);
      return;
    }

    onRestoreRef.current?.(parsed.data);
    setRestored(true);
    setRestoredFileName(parsed.fileName || null);
  }, [enabled, storageKey]);

  // Write, debounced. A pristine form is skipped rather than written: that is
  // what makes "close the modal, which resets state" non-destructive.
  useEffect(() => {
    if (!enabled || !storageKey || pristine) return;
    const t = setTimeout(() => {
      try {
        safeStorage.setItem(storageKey, JSON.stringify({
          savedAt: Date.now(),
          fileName: fileHint || null,
          data: value,
        }));
      } catch {
        // JSON.stringify can throw on a cycle or a BigInt. A draft is a
        // convenience; a form that cannot be serialized simply does not get one.
      }
    }, WRITE_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [enabled, storageKey, pristine, value, fileHint]);

  return { restored, restoredFileName, clearDraft, discardDraft };
}


/**
 * useDraftForm — useState plus a persisted draft, in one call.
 *
 * Exists so that adding this protection to an existing form is a one-line
 * change rather than a bespoke edit: the app has roughly forty forms, and a
 * pattern that has to be re-derived at each one gets applied inconsistently
 * and then rots.
 *
 *   - const [form, setForm] = useState(EMPTY);
 *   + const [form, setForm, draft] = useDraftForm('iprs:new', EMPTY);
 *
 * Two things the caller still owes:
 *   1. draft.clearDraft() once the data reaches the server, or the form keeps
 *      offering back something already submitted.
 *   2. <DraftRestoredNotice /> somewhere visible, so a restored draft is not a
 *      surprise — particularly on an edit form, where recovered values would
 *      otherwise read as the saved ones.
 *
 * And one that only some callers owe: draft.rebaseline(next). Several pages in
 * this app drive both "create" and "edit" through ONE piece of form state,
 * re-seeding it from the loaded row when you hit Edit. Plain setForm() there
 * would leave the baseline pointing at the empty-create shape, so the form
 * would read as dirty the instant Edit opened and the untouched row would be
 * written out as a draft. rebaseline() sets the values and moves the baseline
 * with them, so the form is dirty only once a human changes something.
 *
 * @param {string} key      Form id, namespaced per user internally.
 * @param {object} initial  Initial state. Doubles as the pristine baseline and
 *                          as what resetForm() restores.
 * @returns {[object, function, object]} [value, setValue, draft]
 */
export function useDraftForm(key, initial, { enabled = true, fileHint = null } = {}) {
  const [value, setValue] = useState(initial);

  // Captured once. `initial` is an object literal at most call sites, so
  // comparing against the live prop would re-baseline on every render and the
  // form would never look dirty.
  const initialRef = useRef(initial);
  const baseline = useRef(JSON.stringify(initial));

  const pristine = useMemo(() => JSON.stringify(value) === baseline.current, [value]);

  const draft = useFormDraft({ key, value, onRestore: setValue, enabled, pristine, fileHint });

  const resetForm = useCallback(() => {
    draft.discardDraft();
    setValue(initialRef.current);
  }, [draft]);

  const submitted = useCallback(() => {
    draft.clearDraft();
    setValue(initialRef.current);
  }, [draft]);

  // Seed the form AND move the pristine baseline to match — see the header.
  const rebaseline = useCallback((next) => {
    baseline.current = JSON.stringify(next);
    setValue(next);
  }, []);

  return [value, setValue, { ...draft, resetForm, submitted, rebaseline }];
}
