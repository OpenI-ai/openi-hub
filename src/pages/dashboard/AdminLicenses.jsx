import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  CreditCard, ArrowLeft, ChevronLeft, ChevronRight, RotateCcw, Building2, Users
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import LoadingSkeleton from '../../components/LoadingSkeleton';

const PLANS = ['free','pro','enterprise'];
const PLAN_COLOR = { free: 'bg-gray-100 text-gray-600', pro: 'bg-primary-100 text-primary-700', enterprise: 'bg-purple-100 text-purple-700' };

export default function AdminLicenses() {
  const [data, setData] = useState({ users: [], organizations: [], plan_summary: [], total: 0 });
  const [page, setPage] = useState(1);
  const [planFilter, setPlanFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = { page, limit: 50 };
    if (planFilter) params.plan = planFilter;
    adminAPI.listLicenses(params)
      .then(d => setData(d))
      .catch(err => toast.error(err.message || 'Failed'))
      .finally(() => setLoading(false));
  }, [page, planFilter]);

  const handleOverridePlan = async (userId, plan) => {
    try {
      await adminAPI.overridePlan(userId, plan);
      setData(prev => ({
        ...prev,
        users: prev.users.map(u => u.id === userId ? { ...u, current_plan: plan } : u),
      }));
      toast.success(`Plan updated to ${plan}`);
    } catch (err) { toast.error(err.message); }
  };

  const handleResetUsage = async (userId, feature) => {
    try {
      await adminAPI.resetUsage(userId, feature);
      toast.success(`Usage reset for ${feature}`);
    } catch (err) { toast.error(err.message); }
  };

  const totalPages = Math.ceil(data.total / 50);

  return (
    <div className="flex flex-col h-full">
      <div id="tour-page-admin-licenses" className="px-6 py-5 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-center gap-3 mb-1">
          <Link to="/dashboard/admin/console" className="text-gray-400 hover:text-gray-600"><ArrowLeft size={18} /></Link>
          <CreditCard size={20} className="text-purple-500" />
          <h1 className="text-xl font-display font-bold text-gray-900">License Management</h1>
        </div>
        <p className="text-sm text-gray-500 ml-9">Override subscription plans, manage organizations, reset usage quotas</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? <LoadingSkeleton type="card" /> : (
          <>
            {/* Plan summary */}
            <div className="flex gap-4 mb-6">
              {data.plan_summary.map(p => (
                <div key={p.current_plan} className="bg-white rounded-2xl border border-gray-200 p-4 flex-1 text-center">
                  <p className="text-2xl font-display font-bold text-gray-900">{parseInt(p.count).toLocaleString()}</p>
                  <p className={`text-xs font-semibold uppercase mt-1 px-2 py-0.5 rounded-full inline-block ${PLAN_COLOR[p.current_plan] || PLAN_COLOR.free}`}>{p.current_plan}</p>
                </div>
              ))}
            </div>

            {/* Organizations */}
            {data.organizations?.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Building2 size={14} /> Organizations</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {data.organizations.map(o => (
                    <div key={o.id} className="bg-white rounded-2xl border border-gray-200 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{o.name}</h3>
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${PLAN_COLOR[o.plan_name?.toLowerCase()] || PLAN_COLOR.free}`}>
                          {o.plan_name || 'free'}
                        </span>
                      </div>
                      <div className="flex gap-4 text-xs text-gray-500">
                        <span><span className="font-semibold text-gray-700">{o.member_count}</span> / {o.seat_limit} seats</span>
                        <span>Admin: {o.admin_name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* User subscriptions */}
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Users size={14} /> User Plans</h2>
              <select value={planFilter} onChange={e => { setPlanFilter(e.target.value); setPage(1); }}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 bg-white">
                <option value="">All Plans</option>
                {PLANS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">User</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Role</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Plan</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Since</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">Reset Usage</th>
                  </tr>
                </thead>
                <tbody>
                  {data.users.map(u => (
                    <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900">{u.name}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">{u.role}</span>
                      </td>
                      <td className="px-4 py-3">
                        <select value={u.current_plan || 'free'} onChange={e => handleOverridePlan(u.id, e.target.value)}
                          className={`px-2 py-0.5 text-xs font-semibold rounded-full border-0 cursor-pointer ${PLAN_COLOR[u.current_plan] || PLAN_COLOR.free}`}>
                          {PLANS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {u.subscription_started ? new Date(u.subscription_started).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => handleResetUsage(u.id, 'ai_search')}
                          className="p-1.5 text-gray-400 hover:text-orange-500 transition-colors" title="Reset AI usage">
                          <RotateCcw size={14} />
                        </button>
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
          </>
        )}
      </div>
    </div>
  );
}
