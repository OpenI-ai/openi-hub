import { useState, useEffect } from 'react';
import { useDraftForm } from '../hooks/useFormDraft';
import DraftRestoredNotice from '../components/DraftRestoredNotice';
import toast from 'react-hot-toast';
import { startupAddAPI } from '../services/api';
import { X, Plus } from 'lucide-react';

// "Add Startup" — lets a scout (OpenI staff + seeker personas + mentors +
// service providers) add a startup they met that isn't in the Hub yet. Creates
// a claimable imported stub in startup_profiles. On a dedup hit the backend
// returns 409 with { recourse, startup } and we show an inline "already in the
// database" panel instead of a dead-end error.
//
// `initialName` lets the caller prefill the company name — e.g. from the
// Discover Startups empty-state ("no results for X — add it?") so a scout
// doesn't retype what they just searched.
export default function AddStartupModal({ open, onClose, onAdded, initialName = '' }) {
  const empty = { company_name: '', website: '', sector: '', description: '' };
  const [form, setForm, formDraft] = useDraftForm('add-startup:new', empty);
  const [saving, setSaving] = useState(false);
  const [dupInfo, setDupInfo] = useState(null); // { recourse, startup, error }

  // Seed the company name from initialName each time the modal opens.
  useEffect(() => {
    if (open) setForm({ ...empty, company_name: initialName || '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed on open only
  }, [open, initialName]);

  if (!open) return null;

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const reset = () => { setForm(empty); setDupInfo(null); setSaving(false); };
  // Dismissing is not discarding — the draft outlives the close, and the
  // restore notice's "Start over" is the explicit way to drop it.
  const close = () => { setDupInfo(null); setSaving(false); onClose?.(); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const company_name = form.company_name.trim();
    const website = form.website.trim();
    if (!company_name) { toast.error('Company name is required'); return; }
    if (!website) { toast.error('Website is required'); return; }
    // Light URL sanity check — the backend re-derives the domain authoritatively.
    if (!/\.[a-z]{2,}/i.test(website)) { toast.error('Please enter a valid website (e.g. example.com)'); return; }

    setSaving(true);
    setDupInfo(null);
    try {
      const created = await startupAddAPI.add({
        company_name,
        website,
        sector: form.sector.trim() || undefined,
        description: form.description.trim() || undefined,
      });
      toast.success('Startup added to the database');
      formDraft.clearDraft();
      onAdded?.(created);
      close();
    } catch (err) {
      if (err.status === 409) {
        setDupInfo({ recourse: err.recourse, startup: err.startup, error: err.error || err.message });
      } else {
        toast.error(err.message || 'Failed to add startup');
      }
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={close}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-display font-bold text-gray-900">Submit a startup to the database</h2>
            <p className="text-xs text-gray-500 mt-1">
              Adds the company to the OpenI catalogue for discovery. The founder can later claim and complete the profile.
            </p>
          </div>
          <button onClick={close} className="p-1 text-gray-400 hover:text-gray-700 flex-shrink-0" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Duplicate panel (409) */}
        {dupInfo && (
          <div className="mx-5 mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
            <p className="text-sm font-semibold text-yellow-800">
              {dupInfo.startup?.company_name || 'This startup'} is already in the database
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              {dupInfo.recourse === 'claim'
                ? 'It exists as an unclaimed imported profile — the founder can claim it to complete the listing.'
                : 'It already has an active profile in the catalogue.'}
            </p>
            {dupInfo.startup?.website && (
              <p className="text-xs text-yellow-700 mt-1 truncate">{dupInfo.startup.website}</p>
            )}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <DraftRestoredNotice draft={formDraft} onStartOver={() => { formDraft.discardDraft(); reset(); }} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.company_name}
              onChange={set('company_name')}
              placeholder="e.g. Acme Robotics"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-400 focus:border-primary-400 outline-none"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Website <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.website}
              onChange={set('website')}
              placeholder="e.g. acmerobotics.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-400 focus:border-primary-400 outline-none"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Used to keep the database precise and avoid duplicates.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sector</label>
            <input
              type="text"
              value={form.sector}
              onChange={set('sector')}
              placeholder="Optional — e.g. Robotics, Fintech"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-400 focus:border-primary-400 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">One-line description</label>
            <textarea
              value={form.description}
              onChange={set('description')}
              placeholder="Optional — what does the startup do?"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-400 focus:border-primary-400 outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={close}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-500 text-dark-950 font-semibold text-sm rounded-lg hover:bg-primary-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={15} /> {saving ? 'Adding…' : 'Add Startup'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
