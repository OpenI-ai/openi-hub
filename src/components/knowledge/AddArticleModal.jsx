import { useState, useEffect, useRef, useMemo } from 'react';
import toast from 'react-hot-toast';
import { knowledgeAPI, uploadAPI } from '../../services/api';
import { X, Plus, Save, RotateCcw } from 'lucide-react';
import TaxonomySelect from '../TaxonomySelect';
import useFormDraft from '../../hooks/useFormDraft';

// Phase 121 — shared "Add Knowledge Hub content" modal. Used from both
// Knowledge.jsx (contributor/admin/evaluator "Add Article" button) and
// AdminKnowledge.jsx (admin console "Add Article" tab). Supports rich-text
// content, an optional file attachment (reuses the generic POST /upload
// endpoint, folder=knowledge_articles), and an is_public toggle that also
// publishes the item to openi.ai/reports + semantic search.
//
// 22 Aug 2026 — this modal now also EDITS. Reported: once a report was
// uploaded the only things you could do to it were Take down and Delete, so
// fixing a typo in a title meant deleting the report, losing its view count,
// and re-uploading the file. PUT /api/knowledge/:id already existed and
// already carried the right gate (author or admin, knowledgeController.js:108)
// — nothing but the UI was missing.
//
// Same date, same report: filling this form in and navigating away lost
// everything. Two separate causes, both fixed here:
//   1. `close()` called `reset()`, so dismissing the dialog — including by
//      clicking the backdrop, one stray click away from the form — wiped the
//      fields outright. Closing now leaves the form intact.
//   2. Leaving the route unmounts the component. useFormDraft persists the
//      in-progress values per user and restores them on return.
const CATEGORIES = [
  { value: 'report', label: 'Report' },
  { value: 'article', label: 'Article' },
  { value: 'sop', label: 'SOP / Guide' },
  { value: 'training_module', label: 'Training Module' },
  { value: 'case_study', label: 'Case Study' },
];

// Phase 130c — exported so callers (e.g. AdminKnowledge's Convert-to-Article
// flow) can validate a freeform value against the known category set without
// duplicating this list.
export const CATEGORY_VALUES = CATEGORIES.map((c) => c.value);

const emptyForm = { title: '', content: '', category: 'article', tags: '', sector: '', is_public: false, file_url: '' };

/**
 * knowledge_articles row -> this form's shape. tags is text[] on the server.
 *
 * Accepts EITHER shape a row travels in. The API returns `content`/`category`
 * (knowledgeController.list is a plain `SELECT ka.*`), but Knowledge.jsx
 * renames those to `summary`/`type` when it normalizes rows for display, and
 * the Edit button hands that display row straight to this modal.
 *
 * Reading only the API names there was silent data loss, not just a blank
 * field: Content rendered empty and Category fell back to 'article', and
 * because an edit deliberately PUTs '' rather than undefined so that clearing
 * a field sticks (see the payload below), saving a title fix then wrote both
 * of those blanks over the stored row.
 */
function formFromArticle(article) {
  return {
    title: article.title || '',
    // ?? not ||: content that the user genuinely cleared is '' and must stay
    // '', rather than falling through to the other name for the same field.
    content: article.content ?? article.summary ?? '',
    category: article.category || article.type || 'article',
    tags: Array.isArray(article.tags) ? article.tags.join(', ') : (article.tags || ''),
    sector: article.sector || '',
    is_public: article.is_public === true,
    file_url: article.file_url || '',
  };
}

// Phase 130c — optional initialValues (title/content/category/sector/file_url)
// lets callers pre-fill this form, e.g. converting a Knowledge Hub suggestion
// into an article.
//
// `article` (22 Aug 2026) switches the modal into edit mode: same fields, PUT
// instead of POST, and onUpdated instead of onCreated.
export default function AddArticleModal({ open, onClose, onCreated, onUpdated, initialValues, article }) {
  const isEdit = !!article?.id;
  const baseForm = useMemo(
    () => (isEdit ? formFromArticle(article) : { ...emptyForm, ...initialValues }),
    // initialValues is a fresh object literal at most call sites, so depending
    // on the reference itself would re-baseline on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isEdit, article?.id, JSON.stringify(initialValues || null)]
  );

  const [form, setForm] = useState(baseForm);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // What the form is currently populated FROM. Previously this effect keyed off
  // `open` alone and re-seeded on every open, which is why reopening the dialog
  // threw away whatever had been typed before it was dismissed. It now re-seeds
  // only when the modal is pointed at a different target.
  const loadedFor = useRef(null);
  const target = isEdit ? `edit:${article.id}` : `new:${JSON.stringify(initialValues || null)}`;

  useEffect(() => {
    if (!open || loadedFor.current === target) return;
    loadedFor.current = target;
    setForm(baseForm);
    setFile(null);
    setSaving(false);
    setUploading(false);
  }, [open, target, baseForm]);

  // Declared AFTER the seeding effect on purpose: effects run in declaration
  // order, so a recovered draft is applied on top of the freshly-seeded values
  // rather than being overwritten by them.
  const pristine = useMemo(
    () => !file && JSON.stringify(form) === JSON.stringify(baseForm),
    [form, baseForm, file]
  );
  const { restored, restoredFileName, clearDraft, discardDraft } = useFormDraft({
    key: isEdit ? `knowledge:edit:${article.id}` : 'knowledge:new',
    value: form,
    onRestore: setForm,
    enabled: open,
    pristine,
    fileHint: file?.name || null,
  });

  if (!open) return null;

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  // Note what is NOT here any more: this used to reset the form. Dismissing the
  // dialog is not a decision to throw work away — the backdrop is clickable and
  // sits directly beside the fields.
  const close = () => { onClose?.(); };

  const revertToSaved = () => {
    discardDraft();
    setForm(baseForm);
    setFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const title = form.title.trim();
    if (!title) { toast.error('Title is required'); return; }
    setSaving(true);
    try {
      let file_url = form.file_url || undefined;
      let file_name;
      if (file) {
        setUploading(true);
        const uploaded = await uploadAPI.upload(file, 'knowledge_articles');
        file_url = uploaded.url;
        file_name = uploaded.original_filename || file.name;
        setUploading(false);
      }
      const tags = form.tags.split(',').map((t) => t.trim()).filter(Boolean);

      // On create, an absent optional field is simply omitted. On edit it has
      // to be sent as '' instead: the UPDATE is built out of COALESCE($n, col)
      // (knowledgeController.js:127-133), so undefined/null means "leave as
      // was" and clearing a summary or a sector would silently not stick.
      const payload = {
        title,
        content: isEdit ? form.content.trim() : (form.content.trim() || undefined),
        category: form.category,
        tags,
        sector: isEdit ? (form.sector || '') : (form.sector || undefined),
        file_url,
        file_name,
        is_public: form.is_public,
      };

      if (isEdit) {
        const updated = await knowledgeAPI.update(article.id, payload);
        toast.success('Changes saved');
        clearDraft();
        onUpdated?.(updated);
      } else {
        const created = await knowledgeAPI.create(payload);
        toast.success('Content added to the Knowledge Hub');
        clearDraft();
        setForm(emptyForm);
        setFile(null);
        loadedFor.current = null;
        onCreated?.(created);
      }
      close();
    } catch (err) {
      toast.error(err.message || (isEdit ? 'Failed to save changes' : 'Failed to add content'));
      setSaving(false);
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={close}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 p-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-display font-bold text-gray-900">
              {isEdit ? 'Edit Knowledge Hub content' : 'Add Knowledge Hub content'}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              {isEdit
                ? 'Update the details below. The item keeps its id, its view count and its existing file unless you attach a new one.'
                : 'Publish a report, article, SOP, training module, or case study — with an optional file attachment.'}
            </p>
          </div>
          <button onClick={close} className="p-1 text-gray-400 hover:text-gray-700 flex-shrink-0" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {restored && (
            <div
              role="status"
              className="flex items-start justify-between gap-3 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2"
            >
              <p className="text-xs text-gray-700">
                <span className="font-semibold">Unsaved draft restored.</span>{' '}
                {isEdit ? 'These are your unsaved edits, not the saved version.' : 'Picking up where you left off.'}
                {restoredFileName && (
                  <>
                    {' '}The attachment <span className="font-medium">{restoredFileName}</span> could not be kept — re-attach it below.
                  </>
                )}
              </p>
              <button
                type="button"
                onClick={revertToSaved}
                className="inline-flex items-center gap-1 flex-shrink-0 text-xs font-semibold text-gray-600 hover:text-gray-900"
              >
                <RotateCcw size={12} /> {isEdit ? 'Revert' : 'Start over'}
              </button>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={set('title')}
              maxLength={500}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-400 focus:border-primary-400 outline-none"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={form.category}
              onChange={set('category')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-400 focus:border-primary-400 outline-none bg-white"
            >
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
            <textarea
              value={form.content}
              onChange={set('content')}
              maxLength={5000}
              rows={5}
              placeholder="Optional — text content shown inline on the Knowledge Hub"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-400 focus:border-primary-400 outline-none resize-none"
            />
          </div>

          <div>
            {/* s82 (19 Aug 2026): was taxonomy="sectors". The label says
                "Industry / Sector", and taxonomy_industries is the tree that
                actually matches its seed (287 items / 30 parents, zero diffs),
                whereas taxonomy_sectors has drifted — 33 parents against the
                seed's 48, with seven near-duplicate pairs. Reported symptom:
                no Semiconductor option when uploading a report; it is present
                under industries, and absent from sectors.
                Safe to switch because knowledge_articles.sector is free text
                (max 100 chars, knowledgeController.js:127) rendered as a display
                tag (:14) — no FK, no join, nothing filters on it. Articles
                created before today keep their old sector strings; they are
                labels, so a mixed vocabulary displays fine. */}
            <TaxonomySelect
              taxonomy="industries"
              value={form.sector}
              onChange={(name) => setForm((p) => ({ ...p, sector: name }))}
              label="Industry / Sector"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
            <input
              type="text"
              value={form.tags}
              onChange={set('tags')}
              placeholder="Comma-separated, e.g. FinTech, AI"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-400 focus:border-primary-400 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isEdit ? 'Replace file (optional)' : 'Attach file (optional)'}
            </label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
            {file && <p className="text-[11px] text-gray-400 mt-1">{file.name}</p>}
            {!file && form.file_url && (
              <p className="text-[11px] text-gray-400 mt-1 truncate">
                Reference link from suggestion: <span className="text-gray-500">{form.file_url}</span>
              </p>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.is_public}
              onChange={(e) => setForm((p) => ({ ...p, is_public: e.target.checked }))}
              className="rounded border-gray-300"
            />
            Publish publicly on openi.ai/reports (and make it searchable)
          </label>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button type="button" onClick={close} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-500 text-dark-950 font-semibold text-sm rounded-lg hover:bg-primary-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isEdit ? <Save size={15} /> : <Plus size={15} />}{' '}
              {uploading ? 'Uploading…' : saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Content'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
