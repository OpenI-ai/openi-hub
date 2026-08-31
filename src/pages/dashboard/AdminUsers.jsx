import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Users, Search, ChevronLeft, ChevronRight, Edit3, Power, Trash2, XCircle, Check, ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import ConfirmDialog from '../../components/ConfirmDialog';
import { planColor, planOptions, planOptionLabel, useAssignablePlans } from '../../utils/plans';

const ROLES = ['admin','evaluator','startup','student','academia','corporate','government','investor','lab','incubator','accelerator','service_provider','mentor'];
// Plans are FETCHED, never hardcoded — see src/utils/plans.js for why.
const STATUS_COLOR = { true: 'bg-green-100 text-green-700', false: 'bg-red-100 text-red-600' };

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [pendingDelete, setPendingDelete] = useState(null);  // s83
  const [deleting, setDeleting] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [importedFilter, setImportedFilter] = useState('');
  // s100 — flag=spam_name surfaces accounts whose display name contains a
  // link (bot registrations, the TL-bonus incident).
  const [flagFilter, setFlagFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const plans = useAssignablePlans();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 50 };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      if (planFilter) params.plan = planFilter;
      if (activeFilter) params.active = activeFilter;
      if (importedFilter) params.imported = importedFilter;
      if (flagFilter) params.flag = flagFilter;
      const data = await adminAPI.listUsers(params);
      setUsers(data.users);
      setTotal(data.total);
    } catch (err) { toast.error(err.message || 'Failed to load users'); }
    finally { setLoading(false); }
  }, [page, search, roleFilter, planFilter, activeFilter, importedFilter, flagFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleToggleActive = async (id) => {
    try {
      const updated = await adminAPI.toggleActive(id);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: updated.is_active } : u));
      toast.success(updated.is_active ? 'User enabled' : 'User disabled');
    } catch (err) { toast.error(err.message); }
  };

  const handleOverridePlan = async (id, plan) => {
    try {
      await adminAPI.overridePlan(id, plan);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, current_plan: plan } : u));
      toast.success(`Plan updated to ${plan}`);
    } catch (err) { toast.error(err.message); }
  };

  // s83 — was `window.confirm('Delete user "X"? This cannot be undone.')`. That was
  // TRUE but told an admin nothing. adminController.deleteUser performs ~59 table
  // operations: hard deletes across ~24 tables, FK NULL-outs across ~35 more, and —
  // the part nobody could guess from the old string — it can delete the user's whole
  // ORGANISATION, because organizations.admin_user_id cascades. The controller has an
  // explicit guard for when that is BLOCKED by remaining members; when it is not
  // blocked, the org simply goes. Naming the blast radius is the point here; the
  // dialog component is incidental.
  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await adminAPI.deleteUser(pendingDelete.id);
      setUsers(prev => prev.filter(u => u.id !== pendingDelete.id));
      setTotal(t => t - 1);
      toast.success('User deleted');
      setPendingDelete(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveEdit = async () => {
    try {
      const updated = await adminAPI.updateUser(editUser.id, editForm);
      setUsers(prev => prev.map(u => u.id === editUser.id ? { ...u, ...updated } : u));
      setEditUser(null);
      toast.success('User updated');
    } catch (err) { toast.error(err.message); }
  };

  const openEdit = (user) => {
    setEditUser(user);
    setEditForm({ name: user.name, email: user.email, role: user.role });
  };

  const totalPages = Math.ceil(total / 50);

  return (
    <div className="flex flex-col h-full">
      <div id="tour-page-admin-users" className="px-6 py-5 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-center gap-3 mb-1">
          <Link to="/dashboard/admin/console" className="text-gray-400 hover:text-gray-600"><ArrowLeft size={18} /></Link>
          <Users size={20} className="text-blue-500" />
          <h1 className="text-xl font-display font-bold text-gray-900">User Management</h1>
          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">{total.toLocaleString()}</span>
        </div>
        <p className="text-sm text-gray-500 ml-9">View, edit roles, override plans, disable or delete users</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name or email..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400" />
          </div>
          <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 bg-white">
            <option value="">All Roles</option>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={planFilter} onChange={e => { setPlanFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 bg-white">
            <option value="">All Plans</option>
            {plans.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={activeFilter} onChange={e => { setActiveFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 bg-white">
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <select value={importedFilter} onChange={e => { setImportedFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 bg-white">
            <option value="">All Sources</option>
            <option value="false">Organic</option>
            <option value="true">Imported</option>
          </select>
          <select value={flagFilter} onChange={e => { setFlagFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 bg-white">
            <option value="">No Flag Filter</option>
            <option value="spam_name">Spam suspects (link in name)</option>
          </select>
        </div>

        {loading ? <LoadingSkeleton type="card" /> : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">User</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Role</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Plan</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Last Login</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{u.name}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                      {u.is_imported && <span className="text-[10px] px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded font-medium">imported</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">{u.role}</span>
                    </td>
                    <td className="px-4 py-3">
                      {/* The user's OWN plan is always an option, even when it
                          is not assignable (a deprecated tier they are validly
                          still on). Without this the <select> falls back to
                          rendering its first option and reports a plan the
                          user is not on — which is the whole bug this fixes. */}
                      <select value={u.current_plan || 'free'} onChange={e => handleOverridePlan(u.id, e.target.value)}
                        className={`px-2 py-0.5 text-xs font-semibold rounded-full border-0 cursor-pointer ${planColor(u.current_plan)}`}>
                        {planOptions(plans, u.current_plan).map(p => (
                          <option key={p} value={p}>{planOptionLabel(plans, p)}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${STATUS_COLOR[u.is_active]}`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {u.last_login ? new Date(u.last_login).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : 'Never'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(u)} className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors" title="Edit">
                          <Edit3 size={14} />
                        </button>
                        <button onClick={() => handleToggleActive(u.id)}
                          className={`p-1.5 transition-colors ${u.is_active ? 'text-gray-400 hover:text-red-500' : 'text-gray-400 hover:text-green-500'}`}
                          title={u.is_active ? 'Disable' : 'Enable'}>
                          <Power size={14} />
                        </button>
                        <button onClick={() => setPendingDelete({ id: u.id, name: u.name })}
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

      {/* Edit Modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setEditUser(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-gray-900">Edit User</h3>
              <button onClick={() => setEditUser(null)} className="text-gray-400 hover:text-gray-600"><XCircle size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500">Name</label>
                <input value={editForm.name || ''} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">Email</label>
                <input value={editForm.email || ''} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">Role</label>
                <select value={editForm.role || ''} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary-400">
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setEditUser(null)} className="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSaveEdit} className="flex-1 py-2 bg-primary-500 text-white rounded-xl text-sm font-semibold hover:bg-primary-600">
                <Check size={14} className="inline -mt-0.5 mr-1" /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        busy={deleting}
        title={`Delete user "${pendingDelete?.name ?? ''}"?`}
        confirmLabel="Delete user"
        tone="danger"
        onConfirm={handleDelete}
        onClose={() => setPendingDelete(null)}
        body={(
          <>
            <p><strong className="text-gray-900">This is permanent and wide-reaching.</strong> It removes their
            profile, subscription, connections, usage history and onboarding, and strips their
            authorship from startups, projects, documents and watchlists they created.</p>
            <p className="text-red-600">
              <strong>If this user is the admin of an organisation, that organisation is deleted too.</strong>{' '}
              The delete is refused only when other members still belong to it.
            </p>
            <p className="text-gray-500">There is no restore. Consider deactivating the account instead.</p>
          </>
        )}
      />
    </div>
  );
}
