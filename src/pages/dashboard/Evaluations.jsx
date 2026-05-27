import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { evaluationAPI, startupAPI } from '../../services/api';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import { ChevronRight, Plus, Filter, Search, Star, Calendar, CheckCircle2, Clock, AlertCircle, BarChart3, Lock, Eye } from 'lucide-react';

const STATUS_CONFIG = {
  Open: { color: 'bg-accent-100 text-accent-700 border-accent-200', dot: 'bg-accent-500' },
  'Under Review': { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', dot: 'bg-yellow-500' },
  Completed: { color: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400' },
};

function ProgramCard({ program, onClick }) {
  const cfg = STATUS_CONFIG[program.status] || STATUS_CONFIG.Completed;
  const totalWeight = program.criteria.reduce((s, c) => s + c.weight, 0);
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-all cursor-pointer group" onClick={onClick}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full border ${cfg.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} /> {program.status}
            </span>
            <span className="px-2 py-0.5 bg-dark-100 text-dark-600 text-xs rounded-full">{program.type}</span>
          </div>
          <h3 className="font-display font-bold text-gray-900 text-sm leading-tight">{program.name}</h3>
        </div>
        <ChevronRight size={16} className="text-gray-400 group-hover:text-primary-500 flex-shrink-0 mt-1" />
      </div>
      <p className="text-gray-500 text-xs mb-4 leading-relaxed">{program.description}</p>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Applications', value: program.applications },
          { label: 'Shortlisted', value: program.shortlisted },
          { label: 'Selected', value: program.selected },
        ].map(s => (
          <div key={s.label} className="text-center bg-gray-50 rounded-lg p-2">
            <div className="text-lg font-display font-bold text-gray-800">{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>
      <div>
        <div className="text-xs text-gray-500 mb-2 font-medium">Evaluation Criteria (Weightages)</div>
        <div className="space-y-1.5">
          {program.criteria.map(c => (
            <div key={c.name} className="flex items-center gap-2">
              <span className="text-xs text-gray-600 flex-1 truncate">{c.name}</span>
              <div className="w-24 bg-gray-100 rounded-full h-1.5">
                <div className="h-1.5 rounded-full bg-primary-500" style={{ width: `${c.weight}%` }} />
              </div>
              <span className="text-xs font-semibold text-gray-700 w-8 text-right">{c.weight}%</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
        <Calendar size={12} />
        <span>Closes: {program.closes}</span>
        <span className="ml-auto">{program.lab}</span>
      </div>
    </div>
  );
}

function EvaluationDetail({ program, onClose, allStartups = [] }) {
  const [activeStage, setActiveStage] = useState('applications');
  const [scores, setScores] = useState({});
  const [revealed, setRevealed] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);

  const applicants = allStartups.slice(0, Math.min(program.applications || 5, allStartups.length || 5));

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-sm flex items-center gap-1">← Back</button>
          <div className="flex-1">
            <h1 className="font-display font-bold text-gray-900">{program.name}</h1>
            <p className="text-gray-500 text-xs">{program.lab} · {program.type}</p>
          </div>
          <div className="flex gap-2">
            {['applications', 'shortlisting', 'scoring', 'committee'].map(stage => (
              <button key={stage} onClick={() => setActiveStage(stage)} className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${activeStage === stage ? 'bg-primary-500 text-dark-950' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {stage}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Applications Stage */}
        {activeStage === 'applications' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-gray-900">Applications ({program.applications})</h2>
              <div className="flex gap-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input className="pl-8 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-400" placeholder="Search applicants..." />
                </div>
                <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                  <Filter size={14} /> Filter
                </button>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Startup</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Sector</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500" title="Tech Readiness Level (1=concept · 9=proven in production)">Tech Readiness</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">AI Score</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Stage</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {applicants.map((startup, i) => {
                    // Phase 69 jargon sweep: rename L1/L2/L3 to plain-English review tiers.
                    const stages = ['Initial Screening', 'Technical Review', 'Committee Review', 'Selected', 'Waitlisted'];
                    const stg = stages[Math.min(i, stages.length - 1)];
                    const stgColor = { Selected: 'text-accent-700 bg-accent-100', 'Committee Review': 'text-blue-700 bg-blue-100', Waitlisted: 'text-yellow-700 bg-yellow-100' };
                    return (
                      <tr key={startup.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center text-dark-950 text-xs font-bold">{startup.logo}</div>
                            <div>
                              <div className="font-semibold text-gray-800 text-sm">{startup.name}</div>
                              <div className="text-xs text-gray-400">{startup.location}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs text-gray-600">{startup.sector}</td>
                        <td className="py-3 px-4 text-xs font-bold text-blue-600" title="Tech Readiness Level (1=concept · 9=proven in production)">Level {startup.trl}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <Star size={12} className="text-primary-500" />
                            <span className="text-sm font-bold text-gray-800">{startup.score}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${stgColor[stg] || 'text-gray-600 bg-gray-100'}`}>{stg}</span>
                        </td>
                        <td className="py-3 px-4">
                          <button onClick={() => setSelectedApp(startup)} className="text-xs text-primary-600 font-semibold hover:underline">Review</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Scoring Stage */}
        {activeStage === 'scoring' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display font-bold text-gray-900">Sealed Scoring Interface</h2>
                <p className="text-gray-500 text-xs mt-0.5">Scores are sealed and hidden from other evaluators until admin reveals them.</p>
              </div>
              <button onClick={() => setRevealed(!revealed)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${revealed ? 'bg-red-100 text-red-700' : 'bg-primary-500 text-dark-950'}`}>
                {revealed ? <><Lock size={14} /> Seal Scores</> : <><Eye size={14} /> Reveal All Scores</>}
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {allStartups.slice(0, 3).map(startup => (
                <div key={startup.id} className="bg-white rounded-2xl border border-gray-200 p-5">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center text-dark-950 font-bold">{startup.logo}</div>
                    <div>
                      <div className="font-bold text-gray-900">{startup.name}</div>
                      <div className="text-xs text-gray-500">{startup.sector}</div>
                    </div>
                    {revealed && <div className="ml-auto text-2xl font-display font-bold text-primary-600">{startup.score}/100</div>}
                    {!revealed && <div className="ml-auto w-16 h-8 bg-gray-100 rounded-lg flex items-center justify-center"><Lock size={14} className="text-gray-400" /></div>}
                  </div>
                  <div className="space-y-3">
                    {program.criteria.map(criterion => {
                      const key = `${startup.id}-${criterion.name}`;
                      const val = scores[key] || 0;
                      return (
                        <div key={criterion.name}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-gray-700">{criterion.name}</span>
                            <span className="text-xs text-gray-500">Weight: {criterion.weight}%</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <input type="range" min="0" max="10" value={val} onChange={e => setScores(prev => ({ ...prev, [key]: +e.target.value }))} className="flex-1 accent-primary-500" />
                            <span className="w-8 text-sm font-bold text-gray-800">{val}/10</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                    <div>
                      <span className="text-xs text-gray-500">Weighted Score: </span>
                      <span className="text-sm font-bold text-primary-600">
                        {revealed ? `${startup.score}/100` : '—'}
                      </span>
                    </div>
                    <button className="px-3 py-1.5 bg-primary-500 text-dark-950 rounded-lg text-xs font-semibold hover:bg-primary-400">
                      Submit Score
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shortlisting */}
        {activeStage === 'shortlisting' && (
          <div>
            <h2 className="font-display font-bold text-gray-900 mb-4">AI-Assisted Shortlisting</h2>
            <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 mb-5">
              <div className="flex items-start gap-3">
                <BarChart3 size={20} className="text-primary-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-primary-800">Automated Pre-screening Complete</p>
                  <p className="text-xs text-primary-700 mt-0.5">AI has pre-screened all {program.applications} applications against this program's criteria. {program.shortlisted} startups have been recommended for Technical Review based on sector match, Tech Readiness, and startup score.</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {allStartups.slice(0, program.shortlisted || 3).map((startup, i) => (
                <div key={startup.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
                  <div className="text-sm font-bold text-gray-400 w-5">#{i + 1}</div>
                  <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center text-dark-950 font-bold flex-shrink-0">{startup.logo}</div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800 text-sm">{startup.name}</div>
                    <div className="text-xs text-gray-500" title="Tech Readiness Level (1=concept · 9=proven in production)">{startup.sector} · Tech Readiness {startup.trl} · {startup.location}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-lg font-display font-bold text-primary-600">{startup.score}</div>
                      <div className="text-xs text-gray-400">AI Score</div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button className="px-3 py-1 bg-accent-500 text-white rounded text-xs font-semibold hover:bg-accent-600">Approve</button>
                      <button className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold hover:bg-red-200">Reject</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Committee Review */}
        {activeStage === 'committee' && (
          <div>
            <h2 className="font-display font-bold text-gray-900 mb-4">Committee Review Panel</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 space-y-4">
                {allStartups.slice(0, 3).map(startup => (
                  <div key={startup.id} className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center text-dark-950 font-bold">{startup.logo}</div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900">{startup.name}</h3>
                        <p className="text-xs text-gray-500">{startup.description.slice(0, 80)}...</p>
                        <div className="flex gap-2 mt-2">
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded" title="Tech Readiness Level (1=concept · 9=proven in production)">Tech Readiness {startup.trl}</span>
                          <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded">Score: {startup.score}</span>
                          {startup.deeptech && <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">DeepTech</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-display font-bold text-primary-600">{startup.score}</div>
                        <div className="text-xs text-gray-400">Overall</div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <textarea className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-400" placeholder="Committee notes & decision rationale..." rows={2} />
                    </div>
                    <div className="mt-3 flex gap-2 justify-end">
                      <button className="px-4 py-2 bg-accent-500 text-white rounded-lg text-xs font-semibold hover:bg-accent-600 flex items-center gap-1.5"><CheckCircle2 size={13} /> Select</button>
                      <button className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg text-xs font-semibold hover:bg-yellow-200 flex items-center gap-1.5"><Clock size={13} /> Waitlist</button>
                      <button className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-200 flex items-center gap-1.5"><AlertCircle size={13} /> Reject</button>
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-24">
                  <h4 className="font-semibold text-gray-800 mb-4">Selection Summary</h4>
                  <div className="space-y-3">
                    {[['Total Reviewed', '8'], ['Selected', '2'], ['Waitlisted', '1'], ['Rejected', '5']].map(([k, v]) => (
                      <div key={k} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{k}</span>
                        <span className="font-bold text-gray-800">{v}</span>
                      </div>
                    ))}
                  </div>
                  <button className="w-full mt-4 py-2.5 bg-primary-500 text-dark-950 rounded-lg text-sm font-semibold hover:bg-primary-400">
                    Finalise Selection
                  </button>
                  <button className="w-full mt-2 py-2.5 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50">
                    Export Results (PDF)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Startup detail modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center text-dark-950 font-bold">{selectedApp.logo}</div>
                <div>
                  <h3 className="font-bold text-gray-900">{selectedApp.name}</h3>
                  <p className="text-xs text-gray-500">{selectedApp.sector}</p>
                </div>
              </div>
              <button onClick={() => setSelectedApp(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
            </div>
            <p className="text-sm text-gray-600 mb-4">{selectedApp.description}</p>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[['Tech Readiness', selectedApp.trl], ['Score', selectedApp.score], ['Patents', selectedApp.patents]].map(([k, v]) => (
                <div key={k} className="text-center bg-gray-50 rounded-lg p-3">
                  <div className="font-bold text-gray-800 text-lg">{v}</div>
                  <div className="text-xs text-gray-500">{k}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button className="flex-1 py-2.5 bg-accent-500 text-white rounded-lg text-sm font-semibold">Shortlist</button>
              <button className="flex-1 py-2.5 bg-red-100 text-red-700 rounded-lg text-sm font-semibold">Reject</button>
              <button onClick={() => setSelectedApp(null)} className="flex-1 py-2.5 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Evaluations() {
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [programs, setPrograms] = useState([]);
  const [allStartups, setAllStartups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([evaluationAPI.list(), startupAPI.list()])
      .then(([evalData, startData]) => {
        const evals = evalData.evaluations || evalData || [];
        // Group evaluations by startup or treat as program-like entries
        // Since backend stores evaluations per startup, we build program cards from them
        const programMap = {};
        evals.forEach(ev => {
          const key = ev.program_name || ev.cohort_name || 'General Evaluation';
          if (!programMap[key]) {
            programMap[key] = {
              id: ev.id,
              name: key,
              description: ev.notes || ev.description || 'OpenI evaluation program',
              status: ev.status === 'completed' ? 'Completed' : 'Open',
              type: ev.type || 'Challenge',
              lab: ev.lab || 'OpenI HQ',
              applications: 0,
              shortlisted: 0,
              selected: 0,
              closes: ev.created_at ? new Date(ev.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'TBD',
              criteria: [
                { name: 'Technical Innovation', weight: 25 },
                { name: 'Defence Relevance', weight: 20 },
                { name: 'Team Capability', weight: 20 },
                { name: 'Market Potential', weight: 15 },
                { name: 'Tech Readiness', weight: 20 },
              ],
            };
          }
          programMap[key].applications += 1;
          if (ev.status === 'shortlisted' || ev.status === 'selected') programMap[key].shortlisted += 1;
          if (ev.status === 'selected') programMap[key].selected += 1;
        });
        let programList = Object.values(programMap);
        // If no evaluations, create a placeholder
        if (programList.length === 0) {
          programList = [{
            id: 1, name: 'OpenI Startup Evaluation', description: 'General startup evaluation program',
            status: 'Open', type: 'Challenge', lab: 'OpenI HQ', applications: evals.length,
            shortlisted: 0, selected: 0, closes: 'Ongoing',
            criteria: [
              { name: 'Technical Innovation', weight: 25 }, { name: 'Defence Relevance', weight: 20 },
              { name: 'Team Capability', weight: 20 }, { name: 'Market Potential', weight: 15 },
              { name: 'Tech Readiness', weight: 20 },
            ],
          }];
        }
        setPrograms(programList);

        const startups = startData.startups || startData || [];
        setAllStartups(startups.map(s => ({
          id: s.id,
          name: s.name || '',
          logo: s.logo || (s.name ? s.name.split(' ').map(w => w[0]).join('').slice(0, 2) : '??'),
          sector: s.sector || '',
          trl: s.trl || 0,
          score: s.score || 0,
          location: s.location || '',
          description: s.description || '',
          deeptech: s.deeptech || false,
          patents: s.patents || 0,
        })));
      })
      .catch(err => { toast.error(err.message || 'Failed to load evaluations'); setPrograms([]); setAllStartups([]); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSkeleton type="card" />;

  if (selectedProgram) return <EvaluationDetail program={selectedProgram} onClose={() => setSelectedProgram(null)} allStartups={allStartups} />;

  const filtered = programs.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || (p.lab || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div id="tour-page-evaluations-header" className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Evaluation Programs</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage challenges, incubation calls, and startup evaluation workflows</p>
        </div>
        <button id="tour-page-evaluations-create" onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-dark-950 rounded-lg font-semibold text-sm hover:bg-primary-400">
          <Plus size={16} /> New Program
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Active Programs', value: programs.filter(p => p.status === 'Open').length, color: 'text-accent-600' },
          { label: 'Total Applications', value: programs.reduce((s, p) => s + (p.applications || 0), 0), color: 'text-primary-600' },
          { label: 'Startups Selected', value: programs.reduce((s, p) => s + (p.selected || 0), 0), color: 'text-blue-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className={`text-3xl font-display font-bold ${s.color}`}>{s.value}</div>
            <div className="text-gray-500 text-sm mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-primary-400 text-sm" placeholder="Search programs..." />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map(prog => <ProgramCard key={prog.id} program={prog} onClick={() => setSelectedProgram(prog)} />)}
      </div>

      {/* Create program modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xl shadow-2xl">
            <h3 className="font-display font-bold text-gray-900 text-lg mb-5">Create New Evaluation Program</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Program Name *</label>
                <input className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary-400" placeholder="e.g., OpenI AI Challenge Round 6" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Program Type</label>
                  <select className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary-400">
                    <option>Challenge</option><option>Incubation</option><option>Grant</option><option>Recognition</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Owning Lab</label>
                  <select className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary-400">
                    <option>OpenI HQ</option><option>DRDO CAIR</option><option>DRDO DRDL</option><option>DRDO IRDE</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Opens</label>
                  <input type="date" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary-400" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Closes</label>
                  <input type="date" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary-400" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Description</label>
                <textarea className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary-400" rows={3} placeholder="Describe the program scope and objectives..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium">Cancel</button>
                <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 bg-primary-500 text-dark-950 rounded-lg text-sm font-semibold hover:bg-primary-400">Create Program</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
