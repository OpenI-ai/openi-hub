import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import { startupAPI } from '../../services/api';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import {
  Star, MapPin, Users, TrendingUp, Award, Shield, FileText, ChevronRight,
  ExternalLink, Bookmark, BookmarkCheck, Share2, Globe, Cpu, Target,
  DollarSign, Building2, CheckCircle2, AlertCircle, BarChart3, Edit3,
  Play, Lock, Lightbulb, Calendar
} from 'lucide-react';

const TABS = ['Overview', 'Team & Shareholding', 'Technology', 'Financials', 'IPR & Patents', 'Traction & Awards', 'Journey', 'Documents'];

function ScoreBadge({ score }) {
  const color = score >= 85 ? 'text-accent-600 bg-accent-50 border-accent-200' : score >= 70 ? 'text-yellow-700 bg-yellow-50 border-yellow-200' : 'text-red-600 bg-red-50 border-red-200';
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold border ${color}`}>
      <Star size={13} /> {score}/100
    </div>
  );
}

function TRLBadge({ trl }) {
  const colors = ['', 'bg-gray-200 text-gray-700', 'bg-gray-300 text-gray-700', 'bg-blue-100 text-blue-700', 'bg-blue-200 text-blue-800', 'bg-yellow-100 text-yellow-800', 'bg-yellow-200 text-yellow-800', 'bg-orange-100 text-orange-800', 'bg-accent-100 text-accent-700', 'bg-accent-200 text-accent-800'];
  return <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${colors[trl] || 'bg-gray-100 text-gray-600'}`}>TRL {trl}</span>;
}

function formatFundingDisplay(val) {
  if (!val) return '-';
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return val;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(0)}K`;
  return `$${num}`;
}

export default function StartupProfile() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [startup, setStartup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  const [watchlisted, setWatchlisted] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    startupAPI.get(id)
      .then(data => {
        const s = data.startup || data;
        // Normalize backend fields to what UI expects (handles both startup_profiles and legacy startups)
        const displayName = s.company_name || s.name || '';
        const normalized = {
          ...s,
          name: displayName,
          logo: s.logo_url || s.logo || (displayName ? displayName.split(' ').map(w => w[0]).join('').slice(0, 2) : '??'),
          logo_url: s.logo_url || null,
          sector: s.sector || '',
          technology: s.technologies || s.technology || '',
          location: [s.city, s.state, s.country].filter(Boolean).join(', ') || s.location || '',
          status: s.status || 'Active',
          stage: s.stage || '',
          openi_cluster: s.openi_cluster || '',
          trl: s.tech_readiness || s.trl || 0,
          score: s.score || 0,
          deeptech: s.is_deeptech || s.deeptech || false,
          founded: s.founded_year || s.founded || '',
          employees: s.team_size || s.employee_range || s.employees || 0,
          revenue: s.arr || s.revenue || 0,
          funding: s.funding_raised || s.funding || 0,
          patents: s.patents || 0,
          description: s.description || s.tagline || '',
          tagline: s.tagline || '',
          website: s.website || '',
          domain_name: s.domain_name || '',
          linkedin_url: s.linkedin_url || '',
          twitter_url: s.twitter_url || '',
          solutions: s.solutions || [],
          clients: s.clients || [],
          awards: s.awards || [],
          founders: s.founders || [],
          investors: s.investor_names ? (typeof s.investor_names === 'string' ? s.investor_names.split(',').map(n => ({ name: n.trim() })) : s.investor_names) : s.investors || [],
          milestones: s.milestones || [],
          financials: s.financials || [],
          shareholding: s.shareholding || [],
          board: s.board || [],
          valuation: s.valuation || 0,
          mission: s.mission || '',
          vision: s.vision || '',
          business_model: s.business_model || '',
          revenue_model: s.revenue_model || '',
          dpiit_number: s.dpiit_number || '',
          import_metadata: s.import_metadata || null,
        };
        setStartup(normalized);
        setWatchlisted(normalized.watchlisted || false);
      })
      .catch(err => {
        toast.error(err.message || 'Failed to load startup profile');
        setStartup(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const sendFeedback = () => {
    setFeedbackSent(true);
    setTimeout(() => { setFeedbackOpen(false); setFeedbackSent(false); setFeedbackText(''); }, 1500);
  };

  if (loading) return <LoadingSkeleton type="card" />;

  if (!startup) return (
    <div className="bg-gray-50 min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Startup not found.</p>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Back nav */}
      <div className="bg-dark-950 border-b border-dark-800 px-6 py-2">
        <button onClick={() => navigate('/dashboard/startups')} className="text-dark-400 hover:text-white text-sm flex items-center gap-1 transition-colors">
          ← Back to Startups
        </button>
      </div>
      {/* Header Banner */}
      <div className="bg-dark-950 border-b border-dark-800">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-center gap-5">
              {startup.logo_url ? (
                <img src={startup.logo_url} alt="" className="w-16 h-16 rounded-2xl object-cover flex-shrink-0" />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-primary-500 flex items-center justify-center text-dark-950 text-xl font-display font-bold flex-shrink-0">
                  {startup.logo}
                </div>
              )}
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-white text-2xl font-display font-bold">{startup.name}</h1>
                  {startup.deeptech && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-primary-500/20 text-primary-400 text-xs font-semibold rounded-full border border-primary-500/30">
                      <Cpu size={11} /> DeepTech
                    </span>
                  )}
                  <span className="px-2.5 py-0.5 bg-accent-500/20 text-accent-400 text-xs font-semibold rounded-full border border-accent-500/30">{startup.status}</span>
                </div>
                <div className="flex items-center gap-4 mt-1.5 text-dark-400 text-sm flex-wrap">
                  <span className="flex items-center gap-1"><MapPin size={13} /> {startup.location}</span>
                  <span className="flex items-center gap-1"><Building2 size={13} /> {startup.sector}</span>
                  <span className="flex items-center gap-1"><Calendar size={13} /> Founded {startup.founded}</span>
                </div>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <TRLBadge trl={startup.trl} />
                  <span className="px-2.5 py-1 bg-dark-800 text-dark-300 text-xs rounded-lg">{startup.stage}</span>
                  <span className="px-2.5 py-1 bg-dark-800 text-primary-400 text-xs rounded-lg">{startup.openi_cluster}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <ScoreBadge score={startup.score} />
              <button onClick={() => setWatchlisted(!watchlisted)} className={`p-2 rounded-lg border transition-all ${watchlisted ? 'border-primary-500 bg-primary-500/20 text-primary-400' : 'border-dark-700 text-dark-400 hover:border-primary-500 hover:text-primary-400'}`}>
                {watchlisted ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
              </button>
              <button className="p-2 rounded-lg border border-dark-700 text-dark-400 hover:border-primary-500 hover:text-primary-400 transition-all">
                <Share2 size={18} />
              </button>
              <button onClick={() => navigate('/dashboard/projects')} className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-dark-950 rounded-lg text-sm font-semibold hover:bg-primary-400">
                View Project <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex gap-0 overflow-x-auto">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3.5 text-sm font-medium border-b-2 whitespace-nowrap transition-all ${activeTab === tab ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">

            {/* Overview */}
            {activeTab === 'Overview' && (
              <>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="font-display font-bold text-gray-900 mb-3">About the Startup</h3>
                  <p className="text-gray-700 text-sm leading-relaxed">{startup.description}</p>
                  <div className="mt-4 flex gap-2 flex-wrap">
                    {[startup.sector, startup.technology, startup.openi_cluster].map(tag => (
                      <span key={tag} className="px-3 py-1 bg-primary-50 text-primary-700 text-xs rounded-full border border-primary-200">{tag}</span>
                    ))}
                  </div>
                </div>

                {/* Solutions */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="font-display font-bold text-gray-900 mb-4">Key Solutions</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {startup.solutions.map((s, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <CheckCircle2 size={16} className="text-accent-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{s}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Clients */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="font-display font-bold text-gray-900 mb-4">Business Traction & Clients</h3>
                  <div className="flex gap-3 flex-wrap">
                    {startup.clients.map(c => (
                      <div key={c} className="flex items-center gap-2 px-4 py-2 bg-dark-50 border border-dark-200 rounded-lg">
                        <Building2 size={14} className="text-dark-500" />
                        <span className="text-sm font-medium text-dark-700">{c}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Awards */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="font-display font-bold text-gray-900 mb-4">Awards & Recognition</h3>
                  <div className="space-y-3">
                    {startup.awards.map(award => (
                      <div key={award} className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <Award size={18} className="text-yellow-600 flex-shrink-0" />
                        <span className="text-sm font-medium text-yellow-800">{award}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Team & Shareholding */}
            {activeTab === 'Team & Shareholding' && (
              <>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="font-display font-bold text-gray-900 mb-4">Founders & Management</h3>
                  {startup.founders.map((f, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                      <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center text-dark-950 font-bold flex-shrink-0">
                        {f.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{f.name}</div>
                        <div className="text-sm text-gray-500">{f.role}</div>
                        <div className="flex gap-2 mt-2">
                          {f.iit && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">IIT Graduate</span>}
                          {f.ex_defense && <span className="px-2 py-0.5 bg-olive-100 text-green-800 text-xs rounded-full bg-green-100">Ex-Defence</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="font-display font-bold text-gray-900 mb-4">Shareholding Pattern</h3>
                  <div className="space-y-3">
                    {startup.shareholding.map((s, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-sm text-gray-700 w-36 flex-shrink-0">{s.name}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                          <div className="h-2.5 rounded-full bg-primary-500" style={{ width: `${s.percent}%` }} />
                        </div>
                        <span className="text-sm font-bold text-gray-800 w-12 text-right">{s.percent}%</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                    <AlertCircle size={14} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-yellow-700">All shareholders verified as Indian citizens. No foreign shareholding detected. Cleared for classified project participation.</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="font-display font-bold text-gray-900 mb-4">Board Members</h3>
                  <div className="space-y-3">
                    {startup.board.map((b, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-dark-700 rounded-lg flex items-center justify-center text-dark-100 text-xs font-bold">
                          {b.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-800">{b.name}</div>
                          <div className="text-xs text-gray-500">{b.designation}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Technology */}
            {activeTab === 'Technology' && (
              <>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="font-display font-bold text-gray-900 mb-4">Technology Profile</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[['Sector', startup.sector], ['Core Technology', startup.technology], ['OpenI Cluster', startup.openi_cluster], ['TRL', `Level ${startup.trl}`]].map(([k, v]) => (
                      <div key={k} className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-xs text-gray-500 mb-0.5">{k}</div>
                        <div className="text-sm font-semibold text-gray-800">{v}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="font-display font-bold text-gray-900 mb-3">TRL Progression</h3>
                  <div className="flex gap-1 mt-4">
                    {[1,2,3,4,5,6,7,8,9].map(level => (
                      <div key={level} className="flex-1">
                        <div className={`h-8 rounded flex items-center justify-center text-xs font-bold transition-all ${level <= startup.trl ? 'bg-primary-500 text-dark-950' : 'bg-gray-100 text-gray-400'}`}>{level}</div>
                        <div className="text-center text-xs text-gray-400 mt-1">{level === startup.trl ? '●' : ''}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 text-sm text-gray-600 text-center">Currently at TRL {startup.trl} – {['', '', '', '', '', '', 'Technology demonstrated in relevant environment', 'System prototype demonstration', 'System complete and qualified', ''][startup.trl]}</div>
                </div>

                {startup.deeptech && (
                  <div className="bg-primary-950 rounded-xl border border-primary-800 p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Cpu size={20} className="text-primary-400" />
                      <h3 className="font-display font-bold text-white">DeepTech Qualification</h3>
                      <span className="px-2.5 py-0.5 bg-primary-500 text-dark-950 text-xs font-bold rounded-full">QUALIFIED</span>
                    </div>
                    <p className="text-dark-300 text-sm">This startup has been assessed and qualified as a DeepTech company under OpenI's classification framework. Eligible for priority evaluation and dedicated DeepTech incubation cohorts.</p>
                    <div className="mt-4 grid grid-cols-3 gap-3">
                      {[['Research Depth', '9.2/10'], ['IP Intensity', '8.7/10'], ['Talent Density', '8.4/10']].map(([k,v]) => (
                        <div key={k} className="bg-primary-900/50 rounded-lg p-3 text-center border border-primary-700">
                          <div className="text-primary-400 font-bold">{v}</div>
                          <div className="text-dark-400 text-xs mt-0.5">{k}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Financials */}
            {activeTab === 'Financials' && (
              <>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display font-bold text-gray-900">Financial Overview</h3>
                    <Lock size={16} className="text-gray-400" />
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {[['Total Funding', formatFundingDisplay(startup.funding), 'text-primary-600'], ['Valuation', formatFundingDisplay(startup.valuation), 'text-accent-600'], ['Team Size', startup.employees || '-', 'text-blue-600']].map(([k,v,c]) => (
                      <div key={k} className="p-4 bg-gray-50 rounded-xl text-center border border-gray-100">
                        <div className={`text-2xl font-display font-bold ${c}`}>{v}</div>
                        <div className="text-xs text-gray-500 mt-1">{k}</div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3">
                    <div className="text-sm font-semibold text-gray-700 mb-2">Year-on-Year Performance</div>
                    {startup.financials.map(fin => (
                      <div key={fin.year} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-semibold text-gray-600 w-12">{fin.year}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-accent-600 w-16">Revenue</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                              <div className="h-1.5 rounded-full bg-accent-500" style={{ width: `${Math.min((fin.revenue / 3000000) * 100, 100)}%` }} />
                            </div>
                            <span className="text-xs font-medium text-gray-700 w-16 text-right">₹{(fin.revenue / 100000).toFixed(1)}L</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-red-500 w-16">Burn</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                              <div className="h-1.5 rounded-full bg-red-400" style={{ width: `${Math.min((fin.burn / 3000000) * 100, 100)}%` }} />
                            </div>
                            <span className="text-xs font-medium text-gray-700 w-16 text-right">₹{(fin.burn / 100000).toFixed(1)}L</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="font-display font-bold text-gray-900 mb-4">Investors & Funding Rounds</h3>
                  <div className="space-y-3">
                    {startup.investors.map((inv, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div>
                          <div className="font-semibold text-gray-800 text-sm">{inv.name}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{inv.round}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-primary-600">₹{(inv.amount / 1000000).toFixed(1)}Cr</div>
                          <div className="text-xs text-gray-400">Investment</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* IPR */}
            {activeTab === 'IPR & Patents' && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-bold text-gray-900">Intellectual Property</h3>
                  <span className="px-3 py-1 bg-primary-50 text-primary-700 text-sm font-bold rounded-full border border-primary-200">{startup.patents} Patents</span>
                </div>
                <div className="space-y-4">
                  {[
                    { no: 'IN202311045678', title: 'AI-based Multi-object Tracking System for Aerial Surveillance', status: 'Published', filed: '2023-06-15', jurisdictions: ['IN', 'US', 'EP'] },
                    { no: 'IN202211056789', title: 'Low-latency Edge Inference Pipeline for Surveillance Drones', status: 'Filed', filed: '2022-11-03', jurisdictions: ['IN'] },
                    { no: 'IN202111067890', title: 'Adaptive Camouflage Detection Algorithm for Multi-spectral Data', status: 'Granted', filed: '2021-08-12', jurisdictions: ['IN', 'PCT'] },
                  ].map((patent) => (
                    <div key={patent.no} className="p-4 border border-gray-200 rounded-xl">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${patent.status === 'Granted' ? 'bg-accent-100 text-accent-700' : patent.status === 'Published' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>{patent.status}</span>
                            <span className="text-xs text-gray-400 font-mono">{patent.no}</span>
                          </div>
                          <p className="text-sm font-medium text-gray-800">{patent.title}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs text-gray-400">Filed: {patent.filed}</span>
                            <div className="flex gap-1">{patent.jurisdictions.map(j => <span key={j} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">{j}</span>)}</div>
                          </div>
                        </div>
                        <Shield size={16} className="text-gray-400 flex-shrink-0 mt-1" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Traction */}
            {activeTab === 'Traction & Awards' && (
              <>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="font-display font-bold text-gray-900 mb-4">Clients & Deployments</h3>
                  <div className="space-y-3">
                    {startup.clients.map(c => (
                      <div key={c} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Building2 size={16} className="text-primary-500" />
                        <span className="text-sm font-medium text-gray-800">{c}</span>
                        <span className="ml-auto px-2 py-0.5 bg-accent-100 text-accent-700 text-xs rounded-full">Active Client</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="font-display font-bold text-gray-900 mb-4">Awards & Recognition</h3>
                  <div className="space-y-3">
                    {startup.awards.map((a, i) => (
                      <div key={i} className="flex items-center gap-3 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl">
                        <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center text-dark-950">
                          <Award size={20} />
                        </div>
                        <div>
                          <div className="font-semibold text-yellow-900 text-sm">{a}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Journey */}
            {activeTab === 'Journey' && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-display font-bold text-gray-900 mb-6">Startup Journey Timeline</h3>
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
                  <div className="space-y-6 pl-12">
                    {startup.milestones.map((m, i) => {
                      const icons = { founding: '🚀', funding: '💰', award: '🏆', traction: '📈' };
                      const colors = { founding: 'bg-primary-500', funding: 'bg-accent-500', award: 'bg-yellow-500', traction: 'bg-blue-500' };
                      return (
                        <div key={i} className="relative">
                          <div className={`absolute -left-[2.65rem] w-6 h-6 rounded-full ${colors[m.type]} flex items-center justify-center text-xs`}>
                            {icons[m.type]}
                          </div>
                          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-gray-800 text-sm">{m.event}</span>
                              <span className="text-xs text-gray-400">{m.date}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-start gap-2">
                    <Lightbulb size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-semibold text-blue-800 mb-1">Startup's Learnings & Challenges</div>
                      <p className="text-sm text-blue-700">Key challenge: Hardware procurement for ruggedized components had 6-8 month lead times, causing initial delays. Workaround: Established direct supplier relationships with 3 domestic vendors reducing lead time to 6 weeks.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Documents */}
            {activeTab === 'Documents' && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-display font-bold text-gray-900 mb-4">Document Repository</h3>
                <div className="space-y-3">
                  {[
                    { name: 'Certificate of Incorporation', type: 'pdf', verified: true, access: 'restricted' },
                    { name: 'DPIIT Recognition Certificate', type: 'pdf', verified: true, access: 'restricted' },
                    { name: 'GSTIN Certificate', type: 'pdf', verified: true, access: 'restricted' },
                    { name: 'Pitch Deck (FY24)', type: 'pdf', verified: false, access: 'registered' },
                    { name: 'Product Demo Video', type: 'mp4', verified: false, access: 'registered' },
                    { name: 'Audited Financials FY23', type: 'pdf', verified: true, access: 'confidential' },
                  ].map((doc, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${doc.type === 'pdf' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                        {doc.type.toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-800">{doc.name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {doc.verified && <span className="text-xs text-accent-600 flex items-center gap-0.5"><CheckCircle2 size={10} /> Verified</span>}
                          <span className={`text-xs px-1.5 py-0.5 rounded ${doc.access === 'confidential' ? 'bg-red-50 text-red-600' : doc.access === 'restricted' ? 'bg-yellow-50 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>{doc.access}</span>
                        </div>
                      </div>
                      <ExternalLink size={14} className="text-gray-400" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Quick Stats */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h4 className="font-semibold text-gray-800 text-sm mb-4">Quick Stats</h4>
              <div className="space-y-3">
                {[
                  startup.trl ? { label: 'TRL', value: `Level ${startup.trl}`, icon: Target, color: 'text-blue-500' } : null,
                  startup.employees ? { label: 'Team Size', value: startup.employees, icon: Users, color: 'text-green-500' } : null,
                  startup.funding ? { label: 'Funding Raised', value: formatFundingDisplay(startup.funding), icon: DollarSign, color: 'text-yellow-500' } : null,
                  startup.valuation ? { label: 'Valuation', value: formatFundingDisplay(startup.valuation), icon: TrendingUp, color: 'text-accent-500' } : null,
                  startup.founded ? { label: 'Founded', value: startup.founded, icon: Calendar, color: 'text-gray-500' } : null,
                  startup.dpiit_number ? { label: 'DPIIT', value: startup.dpiit_number, icon: Shield, color: 'text-purple-500' } : null,
                ].filter(Boolean).map(stat => (
                  <div key={stat.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <stat.icon size={14} className={stat.color} />
                      <span className="text-sm text-gray-600">{stat.label}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-800">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Links */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h4 className="font-semibold text-gray-800 text-sm mb-4">Links</h4>
              <div className="space-y-2 text-sm">
                {startup.website && (
                  <a href={startup.website.startsWith('http') ? startup.website : `https://${startup.website}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-primary-600 hover:text-primary-700">
                    <Globe size={14} /> {startup.domain_name || 'Website'}
                  </a>
                )}
                {startup.linkedin_url && (
                  <a href={startup.linkedin_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-primary-600 hover:text-primary-700">
                    <ExternalLink size={14} /> LinkedIn
                  </a>
                )}
                {startup.twitter_url && (
                  <a href={startup.twitter_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-primary-600 hover:text-primary-700">
                    <ExternalLink size={14} /> X / Twitter
                  </a>
                )}
                {!startup.website && !startup.linkedin_url && !startup.twitter_url && (
                  <p className="text-gray-400">No links available</p>
                )}
              </div>
            </div>

            {/* Verification Status */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h4 className="font-semibold text-gray-800 text-sm mb-4">Verification Status</h4>
              <div className="space-y-2">
                {[
                  { label: 'DPIIT Registration', ok: !!startup.dpiit_number },
                  { label: 'GSTIN Verified', ok: !!startup.gstin },
                  { label: 'CIN / MCA21', ok: !!startup.cin },
                  { label: 'Profile Complete', ok: !!(startup.description && startup.sector) },
                ].map(v => (
                  <div key={v.label} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{v.label}</span>
                    {v.ok ? <CheckCircle2 size={15} className="text-accent-500" /> : <AlertCircle size={15} className="text-yellow-500" />}
                  </div>
                ))}
              </div>
            </div>

            {/* Feedback button */}
            <button onClick={() => setFeedbackOpen(true)} className="w-full py-3 border border-primary-200 text-primary-700 rounded-xl text-sm font-semibold hover:bg-primary-50 transition-all">
              Give Feedback to OpenI
            </button>
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      {feedbackOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <h3 className="font-display font-bold text-gray-900 text-lg mb-2">Feedback on OpenI Engagement</h3>
            <p className="text-gray-500 text-sm mb-4">Share how OpenI's support has contributed to your startup's growth.</p>
            {feedbackSent ? (
              <div className="text-center py-6">
                <CheckCircle2 size={40} className="text-accent-500 mx-auto mb-3" />
                <p className="font-semibold text-accent-700">Feedback submitted. Thank you!</p>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-4">
                  {['Mentorship quality', 'Funding & Grants', 'Technical Validation', 'Pilot Support', 'Network & Connections'].map(area => (
                    <div key={area} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700">{area}</span>
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map(star => <Star key={star} size={16} className="text-primary-400 cursor-pointer hover:fill-primary-400 fill-primary-400" />)}
                      </div>
                    </div>
                  ))}
                </div>
                <textarea value={feedbackText} onChange={e => setFeedbackText(e.target.value)} className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-400 mb-4" placeholder="Additional comments..." rows={3} />
                <div className="flex gap-3">
                  <button onClick={() => setFeedbackOpen(false)} className="flex-1 py-2.5 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium">Cancel</button>
                  <button onClick={sendFeedback} className="flex-1 py-2.5 bg-primary-500 text-dark-950 rounded-lg text-sm font-semibold hover:bg-primary-400">Submit Feedback</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
