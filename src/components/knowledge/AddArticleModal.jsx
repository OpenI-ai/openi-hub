import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { knowledgeAPI, uploadAPI } from '../../services/api';
import { X, Plus } from 'lucide-react';
import TaxonomySelect from '../TaxonomySelect';

// Phase 121 — shared "Add Knowledge Hub content" modal. Used from both
// Knowledge.jsx (contributor/admin/evaluator "Add Article" button) and
// AdminKnowledge.jsx (admin console "Add Article" tab). Supports rich-text
// content, an optional file attachment (reuses the generic POST /upload
// endpoint, folder=knowledge_articles), and an is_public toggle that also
// publishes the item to openi.ai/reports + semantic search.
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

// Phase 130c — optional initialValues (title/content/category/sector/file_url)
// lets callers pre-fill this form, e.g. converting a Knowledge Hub suggestion
// into an article.
export default function AddArticleModal({ open, onClose, onCreated, initialValues }) {
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ ...emptyForm, ...initialValues });
      setFile(null);
      setSaving(false);
      setUploading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const reset = () => { setForm(emptyForm); setFile(null); setSaving(false); setUploading(false); };
  const close = () => { reset(); onClose?.(); };

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
      const created = await knowledgeAPI.create({
        title,
        content: form.content.trim() || undefined,
        category: form.category,
        tags,
        sector: form.sector || undefined,
        file_url,
        file_name,
        is_public: form.is_public,
      });
      toast.success('Content added to the Knowledge Hub');
      onCreated?.(created);
      close();
    } catch (err) {
      toast.error(err.message || 'Failed to add content');
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
            <h2 className="text-lg font-display font-bold text-gray-900">Add Knowledge Hub content</h2>
            <p className="text-xs text-gray-500 mt-1">
              Publish a report, article, SOP, training module, or case study — with an optional file attachment.
            </p>
          </div>
          <button onClick={close} className="p-1 text-gray-400 hover:text-gray-700 flex-shrink-0" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Attach file (optional)</label>
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
              <Plus size={15} /> {uploading ? 'Uploading…' : saving ? 'Saving…' : 'Add Content'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
