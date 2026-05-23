import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { DASHBOARD_STATS, STARTUPS, PROJECTS, NOTIFICATIONS } from '../../data/mockData';
import { Users, FolderOpen, DollarSign, Shield, BarChart3,
  ArrowUpRight, AlertCircle, Cpu, Award, Target, Building2, Zap, Globe, BookOpen
} from 'lucide-react';

function StatCard({ label, value, sub, icon: Icon, color, to }) {
  const content = (
    <div className={`bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-all group ${to ? 'cursor-pointer' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
          <Icon size={20} className="text-white" />
        </div>
        {to && <ArrowUpRight size={16} className="text-gray-300 group-hover:text-primary-500 transition-colors" />}
      </div>
      <div className="text-2xl font-display font-bold text-gray-900 mb-0.5">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
  return to ? <Link to={to}>{content}</Link> : content;
}

function HealthDot({ color }) {
  const cls = { green: 'bg-accent-500', amber: 'bg-yellow-500', red: 'bg-red-500' };
  return <span className={`inline-block w-2 h-2 rounded-full ${cls[color]}`} />;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [sector, setSector] = useState(null);
  const s = DASHBOARD_STATS;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Welcome */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">{greeting()}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-gray-500 text-sm mt-0.5">Here's the latest from OpenI Hub · {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <Link to="/dashboard/register-startup" className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-dark-950 rounded-lg text-sm font-semibold hover:bg-primary-400 transition-all">
            <Zap size={15} /> Quick Actions
          </Link>
        </div>
      </div>

      {/* Urgent alerts */}
      {NOTIFICATIONS.filter(n => n.urgent && !n.read).map(notif => (
        <div key={notif.id} className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="text-sm font-semibold text-red-800">{notif.title}: </span>
            <span className="text-sm text-red-700">{notif.message}</span>
          </div>
          <Link to="/dashboard/projects" className="text-xs text-red-600 font-semibold hover:underline flex-shrink-0">View →</Link>
        </div>
      ))}

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Registered Startups" value={s.totalStartups.toLocaleString()} sub="+42 this month" icon={Users} color="bg-primary-500" to="/dashboard/startups" />
        <StatCard label="Active Projects" value={s.activeProjects} sub="Across 12 labs" icon={FolderOpen} color="bg-blue-500" to="/dashboard/projects" />
        <StatCard label="Total Grants Disbursed" value={`₹${(s.totalGrant / 10000000).toFixed(0)}Cr`} sub="FY24 total" icon={DollarSign} color="bg-accent-600" to="/dashboard/projects" />
        <StatCard label="DeepTech Startups" value={s.deeptechStartups} sub="Qualified entities" icon={Cpu} color="bg-purple-500" to="/dashboard/startups" />
        <StatCard label="Startups Incubated" value={s.startupsCohorted} sub="Across 8 cohorts" icon={Building2} color="bg-orange-500" to="/dashboard/cohorts" />
        <StatCard label="IPR Filed" value={s.iprFiled} sub="Patents + Trademarks" icon={Shield} color="bg-indigo-500" to="/dashboard/ipr" />
        <StatCard label="Expert Mentors" value={s.mentors} sub="Academia, Industry, OpenI" icon={Award} color="bg-yellow-500" to="/dashboard/mentors" />
        <StatCard label="Avg. Tech Readiness" value={s.avgTRL} sub="Across active projects" icon={Target} color="bg-teal-500" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Applications trend */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-gray-900">Monthly Applications</h3>
            <BarChart3 size={18} className="text-gray-400" />
          </div>
          <div className="flex items-end gap-2 h-32">
            {s.monthlyApplications.map(m => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                <div className="text-xs text-gray-500 font-medium">{m.count}</div>
                <div className="w-full bg-primary-500/20 rounded-t" style={{ height: `${(m.count / 42) * 100}%`, minHeight: 4 }}>
                  <div className="w-full bg-primary-500 rounded-t" style={{ height: '100%' }} />
                </div>
                <div className="text-xs text-gray-400">{m.month}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top sectors */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-gray-900">Top Sectors</h3>
            <Globe size={18} className="text-gray-400" />
          </div>
          <div className="space-y-2.5">
            {s.topSectors.slice(0, 6).map(sec => (
              <div key={sec.name} className="flex items-center gap-3">
                <span className="text-xs text-gray-600 w-36 flex-shrink-0 truncate">{sec.name}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full bg-primary-500" style={{ width: `${(sec.count / 287) * 100}%` }} />
                </div>
                <span className="text-xs font-semibold text-gray-700 w-8 text-right">{sec.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Project health */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-gray-900">Project Health</h3>
            <Target size={18} className="text-gray-400" />
          </div>
          <div className="flex items-center justify-center gap-6 py-4">
            {[
              { label: 'On Track', count: s.projectHealth.green, color: 'bg-accent-500', border: 'border-accent-400', text: 'text-accent-700' },
              { label: 'At Risk', count: s.projectHealth.amber, color: 'bg-yellow-400', border: 'border-yellow-400', text: 'text-yellow-700' },
              { label: 'Critical', count: s.projectHealth.red, color: 'bg-red-500', border: 'border-red-400', text: 'text-red-700' },
            ].map(h => (
              <div key={h.label} className="text-center">
                <div className={`w-14 h-14 rounded-full ${h.color} flex items-center justify-center text-white text-2xl font-display font-bold mx-auto`}>{h.count}</div>
                <div className={`text-xs font-medium mt-2 ${h.text}`}>{h.label}</div>
              </div>
            ))}
          </div>
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs text-red-700"><span className="font-semibold">{s.projectHealth.red} critical projects</span> require immediate attention. View in Projects module.</p>
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent startups */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-gray-900">High-Potential Startups</h3>
            <Link to="/dashboard/startups" className="text-xs text-primary-600 font-semibold hover:underline">View all →</Link>
          </div>
          <div className="space-y-3">
            {STARTUPS.slice(0, 4).map(startup => (
              <Link to="/dashboard/startup-profile" key={startup.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-all cursor-pointer group">
                <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center text-dark-950 font-bold text-sm flex-shrink-0">{startup.logo}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800 text-sm">{startup.name}</span>
                    {startup.deeptech && <Cpu size={11} className="text-primary-500" />}
                  </div>
                  <div className="text-xs text-gray-500 truncate">{startup.sector} · {startup.location}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">{startup.score}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${startup.status === 'Active' ? 'bg-accent-100 text-accent-700' : startup.status === 'Incubated' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>{startup.status}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Active projects */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-gray-900">Active Projects</h3>
            <Link to="/dashboard/projects" className="text-xs text-primary-600 font-semibold hover:underline">View all →</Link>
          </div>
          <div className="space-y-3">
            {PROJECTS.map(project => {
              const progress = Math.round((project.disbursed / project.grant) * 100);
              return (
                <Link to="/dashboard/projects" key={project.id} className="block p-4 rounded-xl border border-gray-100 hover:border-primary-200 hover:bg-gray-50 transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <HealthDot color={project.health} />
                        <span className="font-semibold text-gray-800 text-sm truncate">{project.title}</span>
                      </div>
                      <div className="text-xs text-gray-500">{project.startup} · {project.lab}</div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${project.status === 'Active' ? 'bg-accent-100 text-accent-700' : project.status === 'Near Completion' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{project.status}</span>
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Grant utilisation</span>
                      <span>₹{(project.disbursed / 1000000).toFixed(1)}Cr / ₹{(project.grant / 1000000).toFixed(1)}Cr</span>
                    </div>
                    <div className="bg-gray-100 rounded-full h-1.5">
                      <div className="bg-primary-500 h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom quick actions */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Startup Discovery', desc: 'Find relevant startups', icon: Users, path: '/dashboard/startups', bg: 'from-primary-50 to-primary-100 border-primary-200' },
          { label: 'New Evaluation', desc: 'Launch a program', icon: Target, path: '/dashboard/evaluations', bg: 'from-blue-50 to-blue-100 border-blue-200' },
          { label: 'Knowledge Hub', desc: 'Reports & Resources', icon: BookOpen, path: '/dashboard/knowledge', bg: 'from-purple-50 to-purple-100 border-purple-200' },
          { label: 'Infrastructure', desc: 'Book test facilities', icon: Building2, path: '/dashboard/infrastructure', bg: 'from-green-50 to-green-100 border-green-200' },
        ].map(action => (
          <Link key={action.path} to={action.path} className={`bg-gradient-to-br ${action.bg} border rounded-xl p-4 hover:shadow-md transition-all group`}>
            <action.icon size={20} className="text-gray-700 mb-2 group-hover:scale-110 transition-transform" />
            <div className="font-semibold text-gray-800 text-sm">{action.label}</div>
            <div className="text-xs text-gray-500 mt-0.5">{action.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
