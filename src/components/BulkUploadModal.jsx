import { useState } from 'react';
import toast from 'react-hot-toast';
import { startupBulkUploadAPI } from '../services/api';
import { X, Upload, Download } from 'lucide-react';

// "Bulk Upload" — CSV counterpart to AddStartupModal. Lets a scout add many
// startups at once via a 4-column CSV (company_name, website, sector,
// description). Same claimable-imported-stub creation per row on the
// backend, processed synchronously (results returned in one response, no
// polling). Shows a downloadable template, a file picker, and — after a
// successful upload — a per-row results summary (created/duplicate/error).
export default function BulkUploadModal({ open, onClose, onUploaded }) {
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null); // { summary, results }
  const [downloading, setDownloading] = useState(false);

  const reset = () => { setFile(null); setSaving(false); setResult(null); setDownloading(false); };
  const close = () => { reset(); onClose?.(); };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0] || null;
    if (f && !f.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please select a .csv file');
      e.target.value = '';
      setFile(null);
      return;
    }
    setFile(f);
  };

  const handleDownloadTemplate = async () => {
    setDownloading(true);
    try {
      const blob = await startupBulkUploadAPI.downloadTemplate();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'startup_bulk_upload_template.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err.message || 'Failed to download template');
    } finally {
      setDownloading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { toast.error('Please choose a CSV file'); return; }

    setSaving(true);
    setResult(null);
    try {
      const res = await startupBulkUploadAPI.upload(file);
      setResult(res);
      const { created = 0, duplicate = 0, error = 0 } = res.summary || {};
      toast.success(`${created} added, ${duplicate} duplicate, ${error} failed`);
      onUploaded?.(res.summary);
    } catch (err) {
      toast.error(err.message || 'Failed to upload CSV');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const statusColor = {
    created: 'text-green-700',
    duplicate: 'text-yellow-700',
    error: 'text-red-700',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={close}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-display font-bold text-gray-900">Bulk upload startups</h2>
            <p className="text-xs text-gray-500 mt-1">
              Upload a CSV to add multiple startups at once. Founders can later claim and complete each profile.
            </p>
          </div>
          <button onClick={close} className="p-1 text-gray-400 hover:text-gray-700 flex-shrink-0" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {!result && (
            <>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                disabled={downloading}
                className="inline-flex items-center gap-1.5 text-sm text-primary-700 hover:text-primary-800 font-medium disabled:opacity-50"
              >
                <Download size={15} /> {downloading ? 'Downloading…' : 'Download CSV template'}
              </button>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CSV file <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Required columns: company_name, website. Optional: sector, description. Max 1000 rows, 5MB.
                  </p>
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
                    disabled={saving || !file}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-500 text-dark-950 font-semibold text-sm rounded-lg hover:bg-primary-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Upload size={15} /> {saving ? 'Uploading…' : 'Upload'}
                  </button>
                </div>
              </form>
            </>
          )}

          {result && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-center">
                  <p className="text-lg font-bold text-green-700">{result.summary?.created ?? 0}</p>
                  <p className="text-[11px] text-green-700">Created</p>
                </div>
                <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-center">
                  <p className="text-lg font-bold text-yellow-700">{result.summary?.duplicate ?? 0}</p>
                  <p className="text-[11px] text-yellow-700">Duplicate</p>
                </div>
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-center">
                  <p className="text-lg font-bold text-red-700">{result.summary?.error ?? 0}</p>
                  <p className="text-[11px] text-red-700">Error</p>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left px-2 py-1.5 font-medium text-gray-500">Row</th>
                      <th className="text-left px-2 py-1.5 font-medium text-gray-500">Company</th>
                      <th className="text-left px-2 py-1.5 font-medium text-gray-500">Status</th>
                      <th className="text-left px-2 py-1.5 font-medium text-gray-500">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(result.results || []).map((r) => (
                      <tr key={r.row} className="border-t border-gray-100">
                        <td className="px-2 py-1.5 text-gray-500">{r.row}</td>
                        <td className="px-2 py-1.5 text-gray-800 truncate max-w-[120px]">{r.company_name || '—'}</td>
                        <td className={`px-2 py-1.5 font-medium ${statusColor[r.status] || 'text-gray-600'}`}>
                          {r.status}
                        </td>
                        <td className="px-2 py-1.5 text-gray-500 truncate max-w-[160px]">{r.reason || ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={reset}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  Upload another
                </button>
                <button
                  type="button"
                  onClick={close}
                  className="px-4 py-2 bg-primary-500 text-dark-950 font-semibold text-sm rounded-lg hover:bg-primary-400"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
