import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { cohortAPI } from '../../services/api';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import { GraduationCap, Users, Calendar, Building2, Plus, CheckCircle2, Clock, Award } from 'lucide-react';

const STATUS_COLORS = {
  Active: 'bg-accent-100 text-accent-700 border-accent-200',
  Graduated: 'bg-blue-100 text-blue-700 border-blue-200',
  Forming: 'bg-yellow-100 text-yellow-700 border-yellow-200',
};

function CohortDetail({ cohort, onClose }) {
  const members = cohort.members || [];
  const mentors = cohort.mentors || [];
  const [tab, setTab] = useState('members');

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-sm">← Cohorts</button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="font-display font-bold text-gray-900">{cohort.name}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_COLORS[cohort.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>{cohort.status}</span>
            </div>
            <p className="text-gray-500 text-xs mt-0.5">{cohort.lab} · Incubator: {cohort.incubator} · {cohort.start} to {cohort.end}</p>
          </div>
          <div className="flex gap-2">
            {['members', 'mentors', 'milestones', 'progress'].map(t => (
              <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize ${tab === t ? 'bg-primary-500 text-dark-950' : 'bg-gray-100 text-gray-600'}`}>{t}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 max-w-5xl mx-auto">
        {tab === 'members' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-gray-900">Cohort Members ({members.length}/{cohort.maxStartups})</h2>
              <button className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-dark-950 rounded-lg text-sm font-semibold"><Plus size={15} /> Add Startup</button>
            </div>
            {members.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Users size={40} className="mx-auto mb-3 text-gray-200" />
                <p>No active members. This cohort has {cohort.graduated} graduated startups.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {members.map(startup => (
                  <div key={startup.id} className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center text-dark-950 font-bold">{startup.logo}</div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900">{startup.name}</h3>
                        <p className="text-xs text-gray-500 mt-0.5" title="Tech Readiness Level (1=concept · 9=proven in production)">{startup.sector} · Tech Readiness {startup.trl}</p>
                        <div className="flex gap-2 mt-2">
                          <span className="px-2 py-0.5 bg-accent-100 text-accent-700 text-xs rounded-full">Active</span>
                          {startup.deeptech && <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">DeepTech</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-primary-600">{startup.score}</div>
                        <div className="text-xs text-gray-400">Score</div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="text-xs text-gray-500 mb-1">Cohort Progress</div>
                      <div className="bg-gray-100 rounded-full h-2">
                        <div className="bg-primary-500 h-2 rounded-full" style={{ width: `${Math.floor(Math.random() * 40) + 40}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'mentors' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-gray-900">Assigned Mentors</h2>
              <button className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-dark-950 rounded-lg text-sm font-semibold"><Plus size={15} /> Assign Mentor</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mentors.map(mentor => (
                <div key={mentor.id} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-dark-700 rounded-xl flex items-center justify-center text-white font-bold">{mentor.avatar}</div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900">{mentor.name}</h3>
                      <p className="text-xs text-gray-500">{mentor.designation} · {mentor.org}</p>
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {mentor.expertise.map(e => <span key={e} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">{e}</span>)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-yellow-600">⭐ {mentor.rating}</div>
                      <div className="text-xs text-gray-400">{mentor.sessions} sessions</div>
                    </div>
                  </div>
                </div>
              ))}
              {mentors.length === 0 && (
                <div className="col-span-2 text-center py-8 text-gray-400">No mentors assigned yet.</div>
              )}
            </div>
          </div>
        )}

        {tab === 'milestones' && (
          <div>
            <h2 className="font-display font-bold text-gray-900 mb-4">Cohort Milestones</h2>
            <div className="space-y-3">
              {[
                { title: 'Onboarding & Orientation', date: cohort.start, status: 'completed' },
                { title: 'Business Plan Submission', date: '2024-01-31', status: 'completed' },
                { title: 'Prototype Demo Day', date: '2024-04-30', status: 'active' },
                { title: 'Mid-term Review', date: '2024-06-30', status: 'upcoming' },
                { title: 'Pilot Deployment', date: '2024-08-31', status: 'upcoming' },
                { title: 'Graduation Demo Day', date: cohort.end, status: 'upcoming' },
              ].map((m, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
                  <div>{m.status === 'completed' ? <CheckCircle2 size={20} className="text-accent-500" /> : m.status === 'active' ? <Clock size={20} className="text-blue-500" /> : <Clock size={20} className="text-gray-300" />}</div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800 text-sm">{m.title}</div>
                    <div className="text-xs text-gray-500">{m.date}</div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize ${m.status === 'completed' ? 'bg-accent-100 text-accent-700' : m.status === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>{m.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'progress' && (
          <div>
            <h2 className="font-display font-bold text-gray-900 mb-4">Cohort Progress Dashboard</h2>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Enrolled', value: members.length, icon: Users, color: 'text-primary-600' },
                { label: 'On Track', value: members.length, icon: CheckCircle2, color: 'text-accent-600' },
                { label: 'Graduated', value: cohort.graduated, icon: Award, color: 'text-yellow-600' },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5 text-center">
                  <s.icon size={24} className={`${s.color} mx-auto mb-2`} />
                  <div className={`text-3xl font-display font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-gray-500 text-sm mt-1">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-800 mb-4">Individual Startup Progress</h3>
              {members.map(startup => (
                <div key={startup.id} className="flex items-center gap-4 mb-3">
                  <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center text-dark-950 text-xs font-bold">{startup.logo}</div>
                  <span className="text-sm font-medium text-gray-700 w-36 truncate">{startup.name}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                    <div className="bg-primary-500 h-2.5 rounded-full" style={{ width: `${Math.floor(Math.random() * 40) + 40}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-gray-600 w-8 text-right">{Math.floor(Math.random() * 40) + 40}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Cohorts() {
  const [cohorts, setCohorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    cohortAPI.list()
      .then(data => setCohorts(data.cohorts || data || []))
      .catch(err => toast.error(err.message || 'Failed to load cohorts'))
      .finally(() => setLoading(false));
  }, []);

  if (selected) return <CohortDetail cohort={selected} onClose={() => setSelected(null)} />;

  if (loading) return <LoadingSkeleton type="card" />;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div id="tour-page-cohorts-header" className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Incubation Cohorts</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage startup incubation batches across DIA-CoEs and partner incubators</p>
        </div>
        <button id="tour-page-cohorts-create" onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-dark-950 rounded-lg font-semibold text-sm hover:bg-primary-400">
          <Plus size={16} /> New Cohort
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Active Cohorts',     value: cohorts.filter(c => c.status === 'Active').length,               color: 'text-accent-600' },
          { label: 'Total Startups',     value: cohorts.reduce((s, c) => s + (c.members || []).length, 0),       color: 'text-primary-600' },
          { label: 'Graduated Startups', value: cohorts.reduce((s, c) => s + (c.graduated || 0), 0),             color: 'text-blue-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className={`text-3xl font-display font-bold ${s.color}`}>{s.value}</div>
            <div className="text-gray-500 text-sm mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {cohorts.map(cohort => {
          const members = cohort.members || [];
          const maxStartups = cohort.max_startups || cohort.maxStartups || 1;
          return (
          <div key={cohort.id} onClick={() => setSelected(cohort)} className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-all cursor-pointer group">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-primary-500/20 rounded-xl flex items-center justify-center">
                <GraduationCap size={20} className="text-primary-600" />
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_COLORS[cohort.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>{cohort.status}</span>
            </div>
            <h3 className="font-display font-bold text-gray-900 text-sm mb-2 leading-snug">{cohort.name}</h3>
            <div className="space-y-1.5 text-xs text-gray-500 mb-4">
              <div className="flex items-center gap-1.5"><Building2 size={12} /> {cohort.lab}</div>
              <div className="flex items-center gap-1.5"><GraduationCap size={12} /> {cohort.incubator}</div>
              <div className="flex items-center gap-1.5"><Calendar size={12} /> {cohort.start_date || cohort.start} to {cohort.end_date || cohort.end}</div>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { label: 'Enrolled',  value: members.length },
                { label: 'Capacity',  value: maxStartups },
                { label: 'Graduated', value: cohort.graduated || 0 },
              ].map(s => (
                <div key={s.label} className="text-center bg-gray-50 rounded-lg py-2">
                  <div className="font-bold text-gray-800">{s.value}</div>
                  <div className="text-xs text-gray-500">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="bg-gray-100 rounded-full h-1.5">
              <div className="bg-primary-500 h-1.5 rounded-full" style={{ width: `${Math.min((members.length / maxStartups) * 100, 100)}%` }} />
            </div>
            <div className="text-xs text-gray-400 mt-1">{Math.round((members.length / maxStartups) * 100)}% capacity used</div>
          </div>
          );
        })}
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg">
            <h3 className="font-display font-bold text-gray-900 text-lg mb-5">Create New Cohort</h3>
            <div className="space-y-4">
              {[['Cohort Name', 'e.g., DIA-CoE Delhi Cohort 4 – AI & Robotics'], ['OpenI Lab', ''], ['Partner Incubator', ''], ['Start Date', ''], ['End Date', ''], ['Max Startups', '']].map(([label, placeholder]) => (
                <div key={label}>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">{label}</label>
                  <input className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary-400" placeholder={placeholder} />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 border border-gray-300 text-gray-600 rounded-lg text-sm">Cancel</button>
              <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 bg-primary-500 text-dark-950 rounded-lg text-sm font-semibold">Create Cohort</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
