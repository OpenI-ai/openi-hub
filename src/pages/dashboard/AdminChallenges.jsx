import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Megaphone, Search, ChevronLeft, ChevronRight, Star, Trash2, ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import LoadingSkeleton from '../../components/LoadingSkeleton';

const STATUS_COLOR = {
  draft: 'bg-gray-100 text-gray-600', open: 'bg-green-100 text-green-700',
  reviewing: 'bg-yellow-100 text-yellow-700', closed: 'bg-red-100 text-red-600',
  awarded: 'bg-purple-100 text-purple-700',
};
const STATUSES = ['draft','open','reviewing','closed','awarded'];
const TYPES = ['partner','source','invest'];

export default function AdminChallenges() {
  const [challenges, setChallenges] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchChallenges = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 50 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.challenge_type = typeFilter;
      const data = await adminAPI.listChallenges(params);
      setChallenges(data.challenges);
      setTotal(data.total);
    } catch (err) { toast.error(err.message || 'Failed to load challenges'); }
    finally { setLoading(false); }
  }, [page, search, statusFilter, typeFilter]);

  useEffect(() => { fetchChallenges(); }, [fetchChallenges]);

  const handleStatusChange = async (id, status) => {
    try {
      const updated = await adminAPI.updateChallengeStatus(id, status);
      setChallenges(prev => prev.map(c => c.id === id ? { ...c, status: updated.status } : c));
      toast.success(`Status changed to ${status}`);
    } catch (err) { toast.error(err.message); }
  };

  const handleToggleFeature = async (id) => {
    try {
      const updated = await adminAPI.toggleFeature(id);
      setChallenges(prev => prev.map(c => c.id === id ? { ...c, is_featured: updated.is_featured } : c));
      toast.success(updated.is_featured ? 'Challenge featured' : 'Challenge unfeatured');
    } catch (err) { toast.error(err.message); }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete challenge "${title}"? This cannot be undone.`)) return;
    try {
      await adminAPI.deleteChallenge(id);
      setChallenges(prev => prev.filter(c => c.id !== id));
      setTotal(t => t - 1);
      toast.success('Challenge deleted');
    } catch (err) { toast.error(err.message); }
  };

  const totalPages = Math.ceil(total / 50);

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-5 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-center gap-3 mb-1">
          <Link to="/dashboard/admin/console" className="text-gray-400 hover:text-gray-600"><ArrowLeft size={18} /></Link>
          <Megaphone size={20} className="text-orange-500" />
          <h1 className="text-xl font-display font-bold text-gray-900">Challenge Moderation</h1>
          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">{total.toLocaleString()}</span>
        </div>
        <p className="text-sm text-gray-500 ml-9">Manage challenge status, feature challenges, moderate content</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by title or description..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400" />
          </div>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 bg-white">
            <option value="">All Status</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 bg-white">
            <option value="">All Types</option>
            {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {loading ? <LoadingSkeleton type="card" /> : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Challenge</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Creator</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Type</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Apps</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {challenges.map(c => (
                  <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900 truncate max-w-[250px]">{c.title}</p>
                      <p className="text-xs text-gray-400">{c.sectors?.slice(0, 2).join(', ')}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-gray-700">{c.creator_name}</p>
                      <p className="text-[10px] text-gray-400">{c.creator_email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <select value={c.status} onChange={e => handleStatusChange(c.id, e.target.value)}
                        className={`px-2 py-0.5 text-xs font-semibold rounded-full border-0 cursor-pointer ${STATUS_COLOR[c.status] || 'bg-gray-100'}`}>
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">{c.challenge_type || '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs font-bold text-gray-700">{c.app_count}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleToggleFeature(c.id)}
                          className={`p-1.5 transition-colors ${c.is_featured ? 'text-yellow-500 hover:text-yellow-600' : 'text-gray-400 hover:text-yellow-500'}`}
                          title={c.is_featured ? 'Unfeature' : 'Feature'}>
                          <Star size={14} fill={c.is_featured ? 'currentColor' : 'none'} />
                        </button>
                        <button onClick={() => handleDelete(c.id, c.title)}
                          className="p-1.5 text-gray-400 hover:text-red-600 transition-colors" title="Delete">
                          <Trash2 size={14} />
                        </button>
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
                    className="p-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-white disabled:opacity-30">
                    <ChevronLeft size={14} />
                  </button>
                  <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}
                    className="p-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-white disabled:opacity-30">
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
