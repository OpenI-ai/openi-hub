import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Building2, Search, ChevronLeft, ChevronRight, Edit3, Trash2, ArrowLeft,
  XCircle, Check, Zap, Copy, ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import LoadingSkeleton from '../../components/LoadingSkeleton';

export default function AdminStartups() {
  const [startups, setStartups] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [importedFilter, setImportedFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [editStartup, setEditStartup] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [duplicates, setDuplicates] = useState(null);
  const [dupsLoading, setDupsLoading] = useState(false);

  const fetchStartups = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 50 };
      if (search) params.search = search;
      if (sectorFilter) params.sector = sectorFilter;
      if (countryFilter) params.country = countryFilter;
      if (importedFilter) params.imported = importedFilter;
      const data = await adminAPI.listStartups(params);
      setStartups(data.startups);
      setTotal(data.total);
    } catch (err) { toast.error(err.message || 'Failed to load startups'); }
    finally { setLoading(false); }
  }, [page, search, sectorFilter, countryFilter, importedFilter]);

  useEffect(() => { fetchStartups(); }, [fetchStartups]);

  const handleDelete = async (userId, name) => {
    if (!window.confirm(`Delete startup "${name}"? This cannot be undone.`)) return;
    try {
      await adminAPI.deleteStartup(userId);
      setStartups(prev => prev.filter(s => s.user_id !== userId));
      setTotal(t => t - 1);
      toast.success('Startup deleted');
    } catch (err) { toast.error(err.message); }
  };

  const handleSaveEdit = async () => {
    try {
      await adminAPI.updateStartup(editStartup.user_id, editForm);
      setStartups(prev => prev.map(s => s.user_id === editStartup.user_id ? { ...s, ...editForm } : s));
      setEditStartup(null);
      toast.success('Startup updated');
    } catch (err) { toast.error(err.message); }
  };

  const handleFindDuplicates = async () => {
    setDupsLoading(true);
    try {
      const data = await adminAPI.findDuplicates();
      setDuplicates(data.duplicates);
      toast.success(`Found ${data.total} duplicate groups`);
    } catch (err) { toast.error(err.message); }
    finally { setDupsLoading(false); }
  };

  const openEdit = (s) => {
    setEditStartup(s);
    setEditForm({ company_name: s.company_name, sector: s.sector, stage: s.stage, country: s.country, city: s.city, tagline: s.tagline });
  };

  const totalPages = Math.ceil(total / 50);

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-5 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Link to="/dashboard/admin/console" className="text-gray-400 hover:text-gray-600"><ArrowLeft size={18} /></Link>
              <Building2 size={20} className="text-green-500" />
              <h1 className="text-xl font-display font-bold text-gray-900">Startup Data</h1>
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">{total.toLocaleString()}</span>
            </div>
            <p className="text-sm text-gray-500 ml-9">Edit profiles, manage imported data, find duplicates</p>
          </div>
          <button onClick={handleFindDuplicates} disabled={dupsLoading}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-xl text-sm font-semibold hover:bg-yellow-100 transition-colors disabled:opacity-50">
            <Copy size={14} /> {dupsLoading ? 'Scanning...' : 'Find Duplicates'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Duplicates panel */}
        {duplicates && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-yellow-800">{duplicates.length} Duplicate Groups Found</h3>
              <button onClick={() => setDuplicates(null)} className="text-yellow-600 hover:text-yellow-800"><XCircle size={16} /></button>
            </div>
            {duplicates.length === 0 ? (
              <p className="text-xs text-yellow-600">No duplicates detected.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {duplicates.slice(0, 20).map((d, i) => (
                  <div key={i} className="bg-white rounded-lg p-3 text-xs">
                    <p className="font-semibold text-gray-700 mb-1">"{d.norm_name}" ({d.count} entries)</p>
                    <div className="flex flex-wrap gap-2">
                      {d.entries.map((e, j) => (
                        <span key={j} className={`px-2 py-0.5 rounded-full ${e.imported ? 'bg-indigo-50 text-indigo-600' : 'bg-green-50 text-green-600'}`}>
                          {e.company_name} ({e.country || '?'})
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name, sector, tagline..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400" />
          </div>
          <select value={importedFilter} onChange={e => { setImportedFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 bg-white">
            <option value="">All Sources</option>
            <option value="false">Organic</option>
            <option value="true">Imported</option>
          </select>
        </div>

        {loading ? <LoadingSkeleton type="card" /> : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Company</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Sector</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Location</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Stage</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Source</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {startups.map(s => (
                  <tr key={s.user_id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900 truncate max-w-[200px]">{s.company_name}</p>
                      {s.tagline && <p className="text-xs text-gray-400 truncate max-w-[200px]">{s.tagline}</p>}
                    </td>
                    <td className="px-4 py-3">
                      {s.sector ? <span className="px-2 py-0.5 bg-primary-50 text-primary-700 text-xs font-medium rounded-full">{s.sector}</span> : '—'}
                      {s.is_deeptech && <span className="ml-1 text-[10px] px-1 py-0.5 bg-purple-100 text-purple-600 rounded"><Zap size={8} className="inline" /></span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{[s.city, s.country].filter(Boolean).join(', ') || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{s.stage || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${s.is_imported ? 'bg-indigo-50 text-indigo-600' : 'bg-green-50 text-green-600'}`}>
                        {s.is_imported ? 'Imported' : 'Organic'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {s.website && (
                          <a href={s.website.startsWith('http') ? s.website : `https://${s.website}`} target="_blank" rel="noreferrer"
                            className="p-1.5 text-gray-400 hover:text-primary-600 transition-colors"><ExternalLink size={14} /></a>
                        )}
                        <button onClick={() => openEdit(s)} className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"><Edit3 size={14} /></button>
                        <button onClick={() => handleDelete(s.user_id, s.company_name)}
                          className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200">
                <p className="text-xs text-gray-500">Page {page} of {totalPages}</p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                    className="p-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-white disabled:opacity-30"><ChevronLeft size={14} /></button>
                  <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}
                    className="p-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-white disabled:opacity-30"><ChevronRight size={14} /></button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editStartup && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setEditStartup(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-gray-900">Edit Startup</h3>
              <button onClick={() => setEditStartup(null)} className="text-gray-400 hover:text-gray-600"><XCircle size={18} /></button>
            </div>
            <div className="space-y-3">
              {['company_name','sector','stage','country','city','tagline'].map(field => (
                <div key={field}>
                  <label className="text-xs font-semibold text-gray-500 capitalize">{field.replace('_',' ')}</label>
                  <input value={editForm[field] || ''} onChange={e => setEditForm(f => ({ ...f, [field]: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400" />
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setEditStartup(null)} className="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSaveEdit} className="flex-1 py-2 bg-primary-500 text-white rounded-xl text-sm font-semibold hover:bg-primary-600">
                <Check size={14} className="inline -mt-0.5 mr-1" /> Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
