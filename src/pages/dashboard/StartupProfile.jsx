import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { startupAPI, profileViewAPI, claimAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import SimilarStartupsPanel from '../../components/SimilarStartupsPanel';
import {
  MapPin, Users, TrendingUp, Award, Shield, ChevronRight,
  ExternalLink, Bookmark, BookmarkCheck, Share2, Globe, Cpu, Target,
  DollarSign, Building2, CheckCircle2, AlertCircle, Calendar, Briefcase, Sparkles,
  Flag, Loader2, X, Mail, Github, Youtube, FileText, Video
} from 'lucide-react';

// Phase 69: TRL renamed to "Tech Readiness" everywhere visible. Tooltip
// explains the 1-9 NASA scale for users who do not know the term.
const TRL_TOOLTIP =
  'Tech Readiness Level (TRL): NASA standard 1–9 scale.\n' +
  '1 = basic concept · 4 = lab demo · 6 = prototype in relevant environment · 9 = proven in production.';

function TechReadinessBadge({ trl }) {
  if (!trl) return null;
  const colors = ['', 'bg-gray-200 text-gray-700', 'bg-gray-300 text-gray-700', 'bg-blue-100 text-blue-700', 'bg-blue-200 text-blue-800', 'bg-yellow-100 text-yellow-800', 'bg-yellow-200 text-yellow-800', 'bg-orange-100 text-orange-800', 'bg-accent-100 text-accent-700', 'bg-accent-200 text-accent-800'];
  return (
    <span
      title={TRL_TOOLTIP}
      className={`px-2.5 py-1 rounded-lg text-xs font-bold ${colors[trl] || 'bg-gray-100 text-gray-600'}`}
    >
      Tech Readiness {trl}
    </span>
  );
}

// Phase 84 - formatFunding prefers the human-readable bracket label when
// available. Falls back to formatting the legacy numeric column with the
// companion _currency.
const MONEY_SYMBOLS = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
function formatFunding(val, currency, rangeText) {
  if (rangeText && typeof rangeText === 'string') return rangeText;
  if (!val) return null;
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num) || num === 0) return null;
  const sym = MONEY_SYMBOLS[currency || 'INR'] || (currency || '');
  if (num >= 1e9) return `${sym}${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `${sym}${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${sym}${(num / 1e3).toFixed(0)}K`;
  return `${sym}${num}`;
}

function EmptySection({ message }) {
  return <p className="text-gray-400 text-sm py-4 text-center">{message}</p>;
}

/**
 * J10 (s50): Claim Startup Modal
 *
 * - Fires `POST /claims/request` with { target_startup_user_id, verification_evidence }.
 * - Backend auto-detects domain match: matching email domain -> domain_auto path
 *   (sends confirmation email); non-matching -> admin_manual path (admin reviews).
 * - Both paths surface in MyClaims at /dashboard/my-claims.
 * - User must explain their relationship to the startup (founder/employee/etc) so an
 *   admin reviewer can decide on the admin_manual path. The text is also retained as
 *   audit trail on the domain_auto path.
 */
function ClaimStartupModal({ open, onClose, startup, onSuccess }) {
  const [evidence, setEvidence] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const submit = async () => {
    if (evidence.trim().length < 20) {
      toast.error('Please describe your relationship to this startup (at least 20 characters)');
      return;
    }
    setSubmitting(true);
    try {
      const res = await claimAPI.request({
        target_startup_user_id: startup.user_id,
        verification_evidence: evidence.trim(),
      });
      // Backend returns { claim_id, status, verification_method, next_step }
      // Status will be 'email_sent' on domain-auto path or 'pending' on admin-manual path.
      if (res?.status === 'email_sent') {
        toast.success('Claim submitted — check your email to confirm');
      } else {
        toast.success('Claim submitted — awaiting admin review');
      }
      onSuccess?.(res);
      onClose();
    } catch (err) {
      // 409 duplicate or already-claimed; 403 not eligible
      toast.error(err?.message || 'Failed to submit claim');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(13,33,55,0.55)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: '#FFF8E6' }}>
              <Flag size={18} style={{ color: '#B45309' }} />
            </div>
            <div>
              <h2 className="text-base font-display font-bold text-gray-900">
                Claim {startup.company_name || 'this startup'}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Tell us how you&rsquo;re affiliated with this profile
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Info strip */}
        <div className="rounded-lg p-3 mb-4 text-xs flex gap-2 items-start"
             style={{ background: '#EFF6FF', color: '#1E40AF', border: '1px solid #BFDBFE' }}>
          <Mail size={14} className="flex-shrink-0 mt-0.5" />
          <div>
            If your email domain matches the startup&rsquo;s website, we&rsquo;ll email you a
            confirmation link. Otherwise, an admin will review your request manually.
          </div>
        </div>

        {/* Evidence */}
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
          Your relationship to this startup <span className="text-red-500">*</span>
        </label>
        <textarea
          value={evidence}
          onChange={e => setEvidence(e.target.value)}
          rows={5}
          placeholder="e.g. I'm the founder/CTO/employee of this company. My LinkedIn: https://… Press mention: https://…"
          className="w-full text-sm border rounded-lg p-3 outline-none focus:ring-2 focus:ring-amber-200"
          style={{ borderColor: '#E5E7EB' }}
          maxLength={2000}
          disabled={submitting}
        />
        <div className="flex justify-between text-[11px] text-gray-400 mt-1 mb-4">
          <span>Include role, LinkedIn URL, press cross-references where possible</span>
          <span>{evidence.length}/2000</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={submitting || evidence.trim().length < 20}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            style={{ background: '#D5AA5B', color: '#fff' }}
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Flag size={14} />}
            {submitting ? 'Submitting…' : 'Submit Claim'}
          </button>
        </div>
      </div>
    </div>
  );
}

const CLAIM_ELIGIBLE_ROLES = new Set(['startup', 'student', 'academia']);
function userIsClaimEligible(user) {
  if (!user) return false;
  const roles = Array.isArray(user.roles) && user.roles.length ? user.roles : (user.role ? [user.role] : []);
  return roles.some(r => CLAIM_ELIGIBLE_ROLES.has(r));
}

export default function StartupProfile() {
  const navigate = useNavigate();
  const { id } = useParams();
  // s50 (J10 follow-up): callers can pass ?by=user_id to disambiguate the
  // id-vs-user_id collision (independent SERIAL sequences in startup_profiles).
  const [searchParams] = useSearchParams();
  const lookupBy = searchParams.get('by') || undefined;
  const [startup, setStartup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  const [watchlisted, setWatchlisted] = useState(false);
  // J10 (s50): Claim flow
  const { user } = useAuth();
  const [claimOpen, setClaimOpen] = useState(false);
  const [claimSubmitted, setClaimSubmitted] = useState(false);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    startupAPI.get(id, { by: lookupBy })
      .then(data => {
        const s = data.startup || data;
        setStartup(s);
        // Record profile view (fire-and-forget, server dedups per day)
        if (s?.user_id) {
          profileViewAPI.recordView(s.user_id).catch(() => {});
        }
      })
      .catch(err => {
        toast.error(err.message || 'Failed to load startup profile');
        setStartup(null);
      })
      .finally(() => setLoading(false));
  }, [id, lookupBy]);

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
  const funding = formatFunding(startup.funding_raised, startup.funding_raised_currency, startup.funding_raised_range);
  const valuation = formatFunding(startup.valuation, startup.valuation_currency, startup.valuation_range);
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
                  <TechReadinessBadge trl={trl} />
                  {startup.stage && <span className="px-2.5 py-1 bg-dark-800 text-dark-300 text-xs rounded-lg">{startup.stage}</span>}
                  {startup.business_model && <span className="px-2.5 py-1 bg-dark-800 text-primary-400 text-xs rounded-lg">{startup.business_model}</span>}
                  {startup.import_metadata?.cluster_label && (
                    <span
                      title="Auto-assigned semantic cluster (s21 K=100)"
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-dark-800 text-amber-300 text-xs rounded-lg border border-amber-500/20"
                    >
                      <Sparkles size={11} />
                      <span className="font-mono">{startup.import_metadata.cluster_label}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* J10 (s50): Claim CTA — visible only if startup is imported, unclaimed,
                  not the viewer's own row, and viewer has a claim-eligible role.
                  Submitted state shows a static "Claim Pending" pill. */}
              {claimSubmitted ? (
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold"
                  style={{ background: '#FFF8E6', borderColor: '#FCD34D', color: '#B45309' }}
                  title="We received your claim — check My Claims for status"
                >
                  <CheckCircle2 size={13} /> Claim Submitted
                </span>
              ) : (
                user
                && startup.is_imported
                && !startup.claimed_at
                && startup.user_id !== user.id
                && userIsClaimEligible(user)
                && (
                  <button
                    onClick={() => setClaimOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{ background: '#D5AA5B', color: '#0D2137' }}
                    title="Claim ownership of this profile"
                  >
                    <Flag size={13} /> Claim This Profile
                  </button>
                )
              )}
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
                      trl > 0 && ['Tech Readiness', `Level ${trl}`],
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
                    <h3 className="font-display font-bold text-gray-900 mb-3" title={TRL_TOOLTIP}>Tech Readiness Progression</h3>
                    <div className="flex gap-1 mt-4">
                      {[1,2,3,4,5,6,7,8,9].map(level => (
                        <div key={level} className="flex-1">
                          <div className={`h-8 rounded flex items-center justify-center text-xs font-bold transition-all ${level <= trl ? 'bg-primary-500 text-dark-950' : 'bg-gray-100 text-gray-400'}`}>{level}</div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 text-sm text-gray-600 text-center" title={TRL_TOOLTIP}>Currently at Tech Readiness Level {trl}</div>
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
                    (startup.employee_range || startup.team_size) && ['Team Size', startup.employee_range || startup.team_size, 'text-blue-600'],
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
                  trl > 0 && { label: 'Tech Readiness', value: `Level ${trl}`, icon: Target, color: 'text-blue-500', tooltip: TRL_TOOLTIP },
                  (startup.employee_range || startup.team_size) && { label: 'Team Size', value: startup.employee_range || startup.team_size, icon: Users, color: 'text-green-500' },
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
                {/* Phase 80 — surface the full set of stored URLs so corporates
                    reviewing the profile can reach GitHub / Crunchbase /
                    Product Hunt / YouTube / pitch deck / demo video. */}
                {startup.github_url && (
                  <a href={startup.github_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-primary-600 hover:text-primary-700">
                    <Github size={14} /> GitHub
                  </a>
                )}
                {startup.crunchbase_url && (
                  <a href={startup.crunchbase_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-primary-600 hover:text-primary-700">
                    <ExternalLink size={14} /> Crunchbase
                  </a>
                )}
                {startup.product_hunt_url && (
                  <a href={startup.product_hunt_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-primary-600 hover:text-primary-700">
                    <ExternalLink size={14} /> Product Hunt
                  </a>
                )}
                {startup.youtube_url && (
                  <a href={startup.youtube_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-primary-600 hover:text-primary-700">
                    <Youtube size={14} /> YouTube
                  </a>
                )}
                {startup.pitch_deck_url && (
                  <a href={startup.pitch_deck_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-primary-600 hover:text-primary-700">
                    <FileText size={14} /> Pitch Deck
                  </a>
                )}
                {startup.video_url && (
                  <a href={startup.video_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-primary-600 hover:text-primary-700">
                    <Video size={14} /> Demo Video
                  </a>
                )}
                {!startup.website && !startup.linkedin_url && !startup.twitter_url && !startup.github_url && !startup.crunchbase_url && !startup.product_hunt_url && !startup.youtube_url && !startup.pitch_deck_url && !startup.video_url && (
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

        {/* Q3 (s21): Similar Startups via cluster-mate discovery */}
        <SimilarStartupsPanel startupId={startup.user_id || startup.id} limit={8} />
      </div>

      {/* J10 (s50): Claim modal */}
      <ClaimStartupModal
        open={claimOpen}
        onClose={() => setClaimOpen(false)}
        startup={startup}
        onSuccess={() => setClaimSubmitted(true)}
      />
    </div>
  );
}
