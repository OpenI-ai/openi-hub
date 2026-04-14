import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import { startupAPI } from '../../services/api';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import {
  MapPin, Users, TrendingUp, Award, Shield, ChevronRight,
  ExternalLink, Bookmark, BookmarkCheck, Share2, Globe, Cpu, Target,
  DollarSign, Building2, CheckCircle2, AlertCircle, Calendar, Briefcase
} from 'lucide-react';

function TRLBadge({ trl }) {
  if (!trl) return null;
  const colors = ['', 'bg-gray-200 text-gray-700', 'bg-gray-300 text-gray-700', 'bg-blue-100 text-blue-700', 'bg-blue-200 text-blue-800', 'bg-yellow-100 text-yellow-800', 'bg-yellow-200 text-yellow-800', 'bg-orange-100 text-orange-800', 'bg-accent-100 text-accent-700', 'bg-accent-200 text-accent-800'];
  return <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${colors[trl] || 'bg-gray-100 text-gray-600'}`}>TRL {trl}</span>;
}

function formatFunding(val) {
  if (!val) return null;
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num) || num === 0) return null;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(0)}K`;
  return `$${num}`;
}

function EmptySection({ message }) {
  return <p className="text-gray-400 text-sm py-4 text-center">{message}</p>;
}

export default function StartupProfile() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [startup, setStartup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  const [watchlisted, setWatchlisted] = useState(false);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    startupAPI.get(id)
      .then(data => {
        const s = data.startup || data;
        setStartup(s);
      })
      .catch(err => {
        toast.error(err.message || 'Failed to load startup profile');
        setStartup(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSkeleton type="card" />;
  if (!startup) return (
    <div className="bg-gray-50 min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Startup not found.</p>
    </div>
  );

  // Derived display values
  const name = startup.company_name || startup.name || '';
  const initials = name.split(' ').map(w => w?.[0]).join('').slice(0, 2).toUpperCase() || '??';
  const location = [startup.city, startup.state, startup.country].filter(Boolean).join(', ');
  const trl = startup.tech_readiness || 0;
  const funding = formatFunding(startup.funding_raised);
  const valuation = formatFunding(startup.valuation);
  const technologies = Array.isArray(startup.technologies) ? startup.technologies : [];
  const focusAreas = Array.isArray(startup.focus_areas) ? startup.focus_areas : [];
  const investors = Array.isArray(startup.investor_names) ? startup.investor_names : [];
  const awards = Array.isArray(startup.awards) ? startup.awards : (typeof startup.awards === 'string' ? startup.awards.split(',').map(a => a.trim()).filter(Boolean) : []);
  const certifications = Array.isArray(startup.certifications) ? startup.certifications : [];

  const TABS = ['Overview', 'Technology', 'Financials'];

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
                  {initials}
                </div>
              )}
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-white text-2xl font-display font-bold">{name}</h1>
                  {startup.is_deeptech && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-primary-500/20 text-primary-400 text-xs font-semibold rounded-full border border-primary-500/30">
                      <Cpu size={11} /> DeepTech
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1.5 text-dark-400 text-sm flex-wrap">
                  {location && <span className="flex items-center gap-1"><MapPin size={13} /> {location}</span>}
                  {startup.sector && <span className="flex items-center gap-1"><Building2 size={13} /> {startup.sector}</span>}
                  {startup.founded_year && <span className="flex items-center gap-1"><Calendar size={13} /> Founded {startup.founded_year}</span>}
                </div>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <TRLBadge trl={trl} />
                  {startup.stage && <span className="px-2.5 py-1 bg-dark-800 text-dark-300 text-xs rounded-lg">{startup.stage}</span>}
                  {startup.business_model && <span className="px-2.5 py-1 bg-dark-800 text-primary-400 text-xs rounded-lg">{startup.business_model}</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <button onClick={() => setWatchlisted(!watchlisted)} className={`p-2 rounded-lg border transition-all ${watchlisted ? 'border-primary-500 bg-primary-500/20 text-primary-400' : 'border-dark-700 text-dark-400 hover:border-primary-500 hover:text-primary-400'}`}>
                {watchlisted ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
              </button>
              <button className="p-2 rounded-lg border border-dark-700 text-dark-400 hover:border-primary-500 hover:text-primary-400 transition-all">
                <Share2 size={18} />
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
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-3.5 text-sm font-medium border-b-2 whitespace-nowrap transition-all ${activeTab === tab ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
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
                {/* About */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="font-display font-bold text-gray-900 mb-3">About</h3>
                  {startup.tagline && startup.tagline !== startup.description && (
                    <p className="text-primary-700 text-sm font-medium mb-2">{startup.tagline}</p>
                  )}
                  <p className="text-gray-700 text-sm leading-relaxed">{startup.description || 'No description available.'}</p>
                  {startup.mission && (
                    <div className="mt-4 p-3 bg-primary-50 rounded-lg border border-primary-100">
                      <span className="text-xs font-semibold text-primary-600 uppercase">Mission</span>
                      <p className="text-sm text-primary-800 mt-1">{startup.mission}</p>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {(technologies.length > 0 || focusAreas.length > 0) && (
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="font-display font-bold text-gray-900 mb-3">Focus Areas & Technologies</h3>
                    <div className="flex gap-2 flex-wrap">
                      {startup.sector && <span className="px-3 py-1 bg-primary-50 text-primary-700 text-xs rounded-full border border-primary-200">{startup.sector}</span>}
                      {technologies.map(t => (
                        <span key={t} className="px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200">{t}</span>
                      ))}
                      {focusAreas.map(f => (
                        <span key={f} className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">{f}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Investors */}
                {investors.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="font-display font-bold text-gray-900 mb-4">Investors</h3>
                    <div className="flex gap-2 flex-wrap">
                      {investors.map((inv, i) => (
                        <span key={i} className="px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg">{typeof inv === 'string' ? inv : inv.name}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Awards */}
                {awards.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="font-display font-bold text-gray-900 mb-4">Awards & Recognition</h3>
                    <div className="space-y-2">
                      {awards.map((a, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <Award size={16} className="text-yellow-600 flex-shrink-0" />
                          <span className="text-sm font-medium text-yellow-800">{typeof a === 'string' ? a : a.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Technology */}
            {activeTab === 'Technology' && (
              <>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="font-display font-bold text-gray-900 mb-4">Technology Profile</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      startup.sector && ['Sector', startup.sector],
                      technologies.length > 0 && ['Technologies', technologies.join(', ')],
                      startup.product_type && ['Product Type', startup.product_type],
                      startup.business_model && ['Business Model', startup.business_model],
                      trl > 0 && ['TRL', `Level ${trl}`],
                      startup.startup_type && ['Startup Type', startup.startup_type],
                    ].filter(Boolean).map(([k, v]) => (
                      <div key={k} className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-xs text-gray-500 mb-0.5">{k}</div>
                        <div className="text-sm font-semibold text-gray-800">{v}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {trl > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="font-display font-bold text-gray-900 mb-3">TRL Progression</h3>
                    <div className="flex gap-1 mt-4">
                      {[1,2,3,4,5,6,7,8,9].map(level => (
                        <div key={level} className="flex-1">
                          <div className={`h-8 rounded flex items-center justify-center text-xs font-bold transition-all ${level <= trl ? 'bg-primary-500 text-dark-950' : 'bg-gray-100 text-gray-400'}`}>{level}</div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 text-sm text-gray-600 text-center">Currently at TRL {trl}</div>
                  </div>
                )}

                {startup.is_deeptech && (
                  <div className="bg-primary-950 rounded-xl border border-primary-800 p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Cpu size={20} className="text-primary-400" />
                      <h3 className="font-display font-bold text-white">DeepTech Classification</h3>
                    </div>
                    <p className="text-dark-300 text-sm">This startup is classified as a DeepTech company. Eligible for priority evaluation and dedicated incubation programs.</p>
                  </div>
                )}
              </>
            )}

            {/* Financials */}
            {activeTab === 'Financials' && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-display font-bold text-gray-900 mb-4">Financial Overview</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  {[
                    funding && ['Total Funding', funding, 'text-primary-600'],
                    valuation && ['Valuation', valuation, 'text-accent-600'],
                    startup.team_size && ['Team Size', startup.team_size || startup.employee_range, 'text-blue-600'],
                    startup.total_funding_rounds && ['Funding Rounds', startup.total_funding_rounds, 'text-gray-700'],
                    startup.total_investors && ['Total Investors', startup.total_investors, 'text-gray-700'],
                    startup.revenue_range && ['Revenue', startup.revenue_range, 'text-accent-600'],
                  ].filter(Boolean).map(([k,v,c]) => (
                    <div key={k} className="p-4 bg-gray-50 rounded-xl text-center border border-gray-100">
                      <div className={`text-xl font-display font-bold ${c}`}>{v}</div>
                      <div className="text-xs text-gray-500 mt-1">{k}</div>
                    </div>
                  ))}
                </div>

                {investors.length > 0 && (
                  <>
                    <h4 className="font-semibold text-gray-800 text-sm mb-3">Investors</h4>
                    <div className="flex gap-2 flex-wrap">
                      {investors.map((inv, i) => (
                        <span key={i} className="px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg">{typeof inv === 'string' ? inv : inv.name}</span>
                      ))}
                    </div>
                  </>
                )}

                {!funding && !valuation && investors.length === 0 && (
                  <EmptySection message="No financial data available for this startup." />
                )}
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
                  trl > 0 && { label: 'TRL', value: `Level ${trl}`, icon: Target, color: 'text-blue-500' },
                  startup.team_size && { label: 'Team Size', value: startup.team_size || startup.employee_range, icon: Users, color: 'text-green-500' },
                  funding && { label: 'Funding Raised', value: funding, icon: DollarSign, color: 'text-yellow-500' },
                  valuation && { label: 'Valuation', value: valuation, icon: TrendingUp, color: 'text-accent-500' },
                  startup.founded_year && { label: 'Founded', value: startup.founded_year, icon: Calendar, color: 'text-gray-500' },
                  startup.stage && { label: 'Stage', value: startup.stage, icon: Briefcase, color: 'text-indigo-500' },
                  startup.dpiit_number && { label: 'DPIIT', value: startup.dpiit_number, icon: Shield, color: 'text-purple-500' },
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

            {/* Verification */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h4 className="font-semibold text-gray-800 text-sm mb-4">Verification</h4>
              <div className="space-y-2">
                {[
                  { label: 'DPIIT Registered', ok: !!startup.dpiit_number },
                  { label: 'GSTIN Verified', ok: !!startup.gstin },
                  { label: 'Profile Complete', ok: !!(startup.description && startup.sector && startup.city) },
                ].map(v => (
                  <div key={v.label} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{v.label}</span>
                    {v.ok ? <CheckCircle2 size={15} className="text-accent-500" /> : <AlertCircle size={15} className="text-yellow-500" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
