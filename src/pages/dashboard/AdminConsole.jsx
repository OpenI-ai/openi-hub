import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield, Users, Megaphone, Building2, CreditCard, BarChart3, Globe, Database, TrendingUp, BadgeCheck, BookOpen, DollarSign, Activity
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import LoadingSkeleton from '../../components/LoadingSkeleton';

function StatCard({ label, value, sub, icon: Icon, color, to }) {
  const content = (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={18} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-display font-bold text-gray-900">{typeof value === 'number' ? value.toLocaleString() : value}</p>
        <p className="text-sm text-gray-500">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
  return to ? <Link to={to}>{content}</Link> : content;
}

export default function AdminConsole() {
  const [health, setHealth] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [loading, setLoading] = useState(true);

  // s97 wiring audit: analyticsAPI.overview() was fetched on every mount and
  // never rendered (its setter was discarded) — dropped. And a swallowed
  // failure used to render every StatCard as a confident 0; surface it instead.
  useEffect(() => {
    adminAPI.systemHealth()
      .then(h => setHealth(h))
      .catch(e => setLoadError(e?.message || 'Failed to load system health'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSkeleton type="card" />;

  const tc = health?.table_counts || {};

  const modules = [
    { to: '/dashboard/admin/users', label: 'User Management', desc: 'View, edit, disable users. Override plans and roles.', icon: Users, color: 'bg-blue-500' },
    { to: '/dashboard/admin/challenges', label: 'Challenge Moderation', desc: 'Review, approve, feature, or block challenges.', icon: Megaphone, color: 'bg-orange-500' },
    { to: '/dashboard/admin/startups', label: 'Startup Data', desc: 'Manage startup profiles. Find and merge duplicates.', icon: Building2, color: 'bg-green-500' },
    { to: '/dashboard/admin/licenses', label: 'Licenses & Plans', desc: 'Override subscription plans. Reset usage quotas.', icon: CreditCard, color: 'bg-purple-500' },
    { to: '/dashboard/admin/claims', label: 'Profile Claims', desc: 'Review founder claims on imported startup profiles.', icon: BadgeCheck, color: 'bg-amber-500' },
    { to: '/dashboard/admin/analytics', label: 'Analytics', desc: 'Platform metrics, funnel, feature adoption.', icon: BarChart3, color: 'bg-primary-500' },
    { to: '/dashboard/crawling', label: 'Crawling & Imports', desc: 'Review imported startups and directory crawl runs.', icon: Globe, color: 'bg-indigo-500' },
    { to: '/dashboard/admin/knowledge', label: 'Knowledge Hub', desc: 'Manage articles, reports, and contributor access.', icon: BookOpen, color: 'bg-teal-500' },
    { to: '/dashboard/admin/costs', label: 'Service Costs', desc: 'Provider spend, uptime, Sentry errors, email outbox.', icon: DollarSign, color: 'bg-yellow-500' },
    { to: '/dashboard/admin/platform-health', label: 'Platform Health', desc: 'Revenue, signups, churn, embeddings and clusters.', icon: Activity, color: 'bg-rose-500' },
  ];

  return (
    <div className="flex flex-col h-full">
      <div id="tour-page-admin-console" className="px-6 py-5 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <Shield size={20} className="text-primary-500" />
          <h1 className="text-xl font-display font-bold text-gray-900">Admin Console</h1>
        </div>
        <p className="text-sm text-gray-500">Platform management dashboard</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loadError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            Failed to load system health: {loadError}. The counts below are not real zeros.
          </div>
        )}
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Users" value={tc.users || 0} sub={`${health?.active_organic_users || 0} active organic`} icon={Users} color="bg-blue-500" to="/dashboard/admin/users" />
          <StatCard label="Imported Startups" value={health?.imported_users || 0} icon={Database} color="bg-indigo-500" to="/dashboard/admin/startups" />
          <StatCard label="Total Challenges" value={tc.challenges || 0} icon={Megaphone} color="bg-orange-500" to="/dashboard/admin/challenges" />
          <StatCard label="Connections" value={tc.user_connections || 0} icon={TrendingUp} color="bg-green-500" />
        </div>

        {/* Role breakdown */}
        {health?.roles?.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-8">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Users by Role</h2>
            <div className="flex flex-wrap gap-2">
              {health.roles.filter(r => r.role !== 'startup' || parseInt(r.count) < 1000).map(r => (
                <span key={r.role} className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg">
                  {r.role} <span className="font-bold text-gray-900 ml-1">{parseInt(r.count).toLocaleString()}</span>
                </span>
              ))}
              {health.roles.filter(r => r.role === 'startup' && parseInt(r.count) >= 1000).map(r => (
                <span key={r.role} className="px-3 py-1.5 bg-primary-50 text-primary-700 text-xs font-medium rounded-lg">
                  {r.role} <span className="font-bold ml-1">{parseInt(r.count).toLocaleString()}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Modules grid */}
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Admin Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map(m => (
            <Link key={m.to} to={m.to}
              className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md hover:border-primary-200 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${m.color}`}>
                  <m.icon size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">{m.label}</h3>
                  <p className="text-xs text-gray-500 mt-1">{m.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
