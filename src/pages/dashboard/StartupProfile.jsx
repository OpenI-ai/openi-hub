/**
 * OpenI Hub - Startup Profile page.
 *
 * Was 1,987 lines. Phase 163 (9 Aug 2026) moved original lines 18-1134 - a
 * private helper library of 47 declarations - into ./startupProfile/, leaving
 * this file as the page component it was always meant to be. The component body
 * below is a verbatim slice of original lines 1135-1987.
 *
 * No shim was needed: src/App.jsx:52 is the only importer and takes the default
 * export, which is unchanged. See ./startupProfile/index.js for the layout, the
 * re-concat verification recipe and the invariants.
 */
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { startupAPI, startupProfileAPI, profileViewAPI, startupProfileShareAPI, watchlistAPI, getToken } from '../../services/api';
import { openProxyFile } from '../../utils/fileAccess';
import { useAuth } from '../../context/AuthContext';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import SimilarStartupsPanel from '../../components/SimilarStartupsPanel';
import LivenessBadge from '../../components/LivenessBadge';
import {
  MapPin, Users, TrendingUp, Award, Shield,
  ExternalLink, Bookmark, BookmarkCheck, Share2, Globe,
  Cpu, Target, Building2, CheckCircle2, AlertCircle,
  Calendar, Briefcase, Sparkles, Flag, Loader2,
  X, Mail, Github, Youtube, FileText,
  Video, Wallet, FileDown,
} from 'lucide-react';
import {
  TRL_TOOLTIP, TechReadinessBadge, formatFunding, amountToDisplay,
  StartupSubSections, EmptySection, ClaimStartupModal, userIsClaimEligible,
} from './startupProfile/index.js';

// --- BODY START (verbatim, do not reformat) ---
// --- lines 1135-1987 ---
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
  // Phase 99q: Watchlist picker modal (bookmark button)
  const [wlOpen, setWlOpen] = useState(false);
  const [wlLists, setWlLists] = useState([]);          // editable lists [{id,name,my_role,contains}]
  const [wlLoading, setWlLoading] = useState(false);
  const [wlBusyId, setWlBusyId] = useState(null);      // list id currently mutating
  const [wlNewName, setWlNewName] = useState('');
  const [wlCreating, setWlCreating] = useState(false);
  // J10 (s50): Claim flow
  const { user } = useAuth();

  // Phase 110: Share modal state (Share button at top of page opens this)
  const [shareOpen, setShareOpen] = useState(false);
  const [shareTab, setShareTab] = useState('pdf'); // 'pdf' | 'link' | 'email'
  const [shareMode] = useState('full'); // for 'link' tab
  const [shareList, setShareList] = useState([]);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareMinting, setShareMinting] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [shareEmailBusy] = useState(false);
  const [shareEmailMessage, setShareEmailMessage] = useState('');

  // Phase 110: Share handlers
  // Phase 99q follow-up: the share endpoints are userId-keyed, and the route
  // :id may be a startup_profiles.id (NOT a user_id) when loaded via ?by=.
  // Always derive ownership + the share-API key from the loaded startup's
  // user_id so the Link/Email tabs appear for the legitimate owner/admin.
  const shareOwnerId = startup?.user_id;
  const shareIsOwner = user && shareOwnerId != null && (user.id === shareOwnerId || user.role === 'admin');
  const LinkIconShare = ({ size }) => <Globe size={size} />;

  const openShareModal = async () => {
    setShareOpen(true);
    setShareTab('pdf');
    // Login-gated invite: any signed-in member can mint a link. Pre-load any
    // existing share links for this profile (keyed by the profile's user_id).
    if (shareOwnerId != null) {
      setShareLoading(true);
      try {
        const r = await startupProfileShareAPI.listShares(shareOwnerId);
        setShareList(Array.isArray(r) ? r : []);
      } catch (err) {
        setShareList([]);
      } finally {
        setShareLoading(false);
      }
    }
  };

  // Phase 99q: Watchlist picker — load my editable lists and flag which already contain this startup.
  // Uses startup.id (= startup_profiles.id), NOT the route :id (which may be a user_id).
  const loadWatchlists = async () => {
    const sid = startup?.id;
    if (!sid) return;
    setWlLoading(true);
    try {
      const lists = await watchlistAPI.list();
      const editable = (Array.isArray(lists) ? lists : []).filter(l => l.my_role !== 'viewer');
      // For each editable list, check membership via full fetch (returns joined startups).
      const withMembership = await Promise.all(editable.map(async (l) => {
        try {
          const full = await watchlistAPI.get(l.id);
          const ids = (full.startups || []).map(s => s.id || s.startup_id || s);
          return { ...l, contains: ids.includes(sid) };
        } catch (_) {
          return { ...l, contains: false };
        }
      }));
      setWlLists(withMembership);
      setWatchlisted(withMembership.some(l => l.contains));
    } catch (err) {
      setWlLists([]);
    } finally {
      setWlLoading(false);
    }
  };

  const openWatchlistModal = async () => {
    setWlOpen(true);
    await loadWatchlists();
  };

  const toggleInList = async (list) => {
    const sid = startup?.id;
    if (!sid) return;
    setWlBusyId(list.id);
    try {
      if (list.contains) {
        await watchlistAPI.removeStartup(list.id, sid);
        toast.success(`Removed from "${list.name}"`);
      } else {
        await watchlistAPI.addStartup(list.id, sid);
        toast.success(`Saved to "${list.name}"`);
      }
      setWlLists(prev => {
        const next = prev.map(l => l.id === list.id ? { ...l, contains: !l.contains } : l);
        setWatchlisted(next.some(l => l.contains));
        return next;
      });
    } catch (err) {
      toast.error(err?.message || 'Could not update watchlist');
    } finally {
      setWlBusyId(null);
    }
  };

  const createAndAdd = async () => {
    const sid = startup?.id;
    const name = wlNewName.trim();
    if (!name || !sid) return;
    setWlCreating(true);
    try {
      const created = await watchlistAPI.create({ name });
      await watchlistAPI.addStartup(created.id, sid);
      toast.success(`Created "${name}" and saved`);
      setWlNewName('');
      await loadWatchlists();
    } catch (err) {
      toast.error(err?.message || 'Could not create list');
    } finally {
      setWlCreating(false);
    }
  };

  const downloadStartupPdf = async () => {
    try {
      const url = startupProfileShareAPI.pdfUrl(shareOwnerId ?? id);
      const res = await fetch(url, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (!res.ok) throw new Error('PDF download failed');
      const blob = await res.blob();
      const dlUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = dlUrl;
      a.download = `startup-profile-${shareOwnerId ?? id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(dlUrl);
      toast.success('PDF downloaded');
    } catch (err) {
      toast.error(err.message || 'Failed to download PDF');
    }
  };

  const mintNewProfileShare = async () => {
    if (shareOwnerId == null) {
      toast.error('Cannot create a share link before the profile finishes loading');
      return;
    }
    setShareMinting(true);
    try {
      const r = await startupProfileShareAPI.createShare(shareOwnerId, { redaction_mode: shareMode });
      setShareList(prev => [r, ...prev]);
      toast.success(`Created ${shareMode} share link`);
    } catch (err) {
      toast.error(err?.message || 'Failed to create share');
    } finally {
      setShareMinting(false);
    }
  };

  const copyShareLink = async (token) => {
    const url = `${window.location.origin}/share/startup/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied');
    } catch {
      toast.error('Copy failed — please select and copy manually');
    }
  };

  const revokeProfileShare = async (shareId) => {
    if (!confirm('Revoke this share link? Anyone who already has it will lose access.')) return;
    try {
      await startupProfileShareAPI.revokeShare(shareId);
      setShareList(prev => prev.map(s => s.id === shareId ? { ...s, revoked_at: new Date().toISOString() } : s));
      toast.success('Share link revoked');
    } catch (err) {
      toast.error(err?.message || 'Failed to revoke');
    }
  };

  const sendProfileEmailInvite = async () => {
    // Uses the pendingInviteService.createPendingInvite endpoint via a new
    // hard-to-find /api/startup-profile/:userId/email-invite handler that
    // doesn't exist YET (deferred to a Phase 110b ship if cohort asks).
    // For now: surface a friendly placeholder.
    toast.error('Email invite path is being wired in a follow-up ship. Use the Public link option for now.');
  };


  const [claimOpen, setClaimOpen] = useState(false);
  const [claimSubmitted, setClaimSubmitted] = useState(false);
  // Phase 87f — child sub-sections (team / products / funding / clients /
  // patents / competitors / news / acquisitions). Read-only render for
  // corporates and other personas evaluating a startup.
  const [childSections, setChildSections] = useState(null);

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

  // Phase 87f — fetch 8 child sub-section tables once we have the user_id.
  // Backend endpoint /api/startup-profile/public/:userId returns parent
  // fields + all 8 child arrays in one shot.
  useEffect(() => {
    const uid = startup?.user_id;
    if (!uid) return;
    startupProfileAPI.getFullProfile(uid)
      .then(full => setChildSections({
        team:         Array.isArray(full?.team)            ? full.team            : [],
        products:     Array.isArray(full?.products)        ? full.products        : [],
        funding:      Array.isArray(full?.funding_rounds)  ? full.funding_rounds  : [],
        clients:      Array.isArray(full?.clients)         ? full.clients         : [],
        patents:      Array.isArray(full?.patents)         ? full.patents         : [],
        competitors:  Array.isArray(full?.competitors)     ? full.competitors     : [],
        news:         Array.isArray(full?.news)            ? full.news            : [],
        acquisitions: Array.isArray(full?.acquisitions)    ? full.acquisitions    : [],
      }))
      .catch(() => setChildSections(null));
  }, [startup?.user_id]);

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
  // Phase 92.3 ship 3/3 (T23 display) - use amountToDisplay helper to render
  // Funding Raised with the new funding_raised_unit + funding_raised_currency.
  // Falls back to formatFunding (Phase 84 bracket label or raw NUMERIC) for
  // legacy startups with no unit set (display heuristic kicks in: NULL unit
  // means INR=Cr, USD=M per amountToDisplay).
  const fundingRow = {
    amount: startup.funding_raised,
    amount_unit: startup.funding_raised_unit,
    currency: startup.funding_raised_currency,
    amount_range: startup.funding_raised_range,  // Phase 84 fallback
  };
  const fundingDisplay = amountToDisplay(fundingRow);
  const funding = fundingDisplay
    ? fundingDisplay.displayLabel
    : formatFunding(startup.funding_raised, startup.funding_raised_currency, startup.funding_raised_range);
  const valuation = formatFunding(startup.valuation, startup.valuation_currency, startup.valuation_range);
  const technologies = Array.isArray(startup.technologies) ? startup.technologies : [];
  const focusAreas = Array.isArray(startup.focus_areas) ? startup.focus_areas : [];
  const investors = Array.isArray(startup.investor_names) ? startup.investor_names : [];
  const awards = Array.isArray(startup.awards) ? startup.awards : (typeof startup.awards === 'string' ? startup.awards.split(',').map(a => a.trim()).filter(Boolean) : []);

  const TABS = ['Overview', 'Technology', 'Financials'];

  return (
    <div id="tour-page-startup-profile" className="bg-gray-50 min-h-screen">
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
                    style={{ background: '#D0A848', color: '#0D2137' }}
                    title="Claim ownership of this profile"
                  >
                    <Flag size={13} /> Claim This Profile
                  </button>
                )
              )}
              <button onClick={() => openWatchlistModal()} title="Save to watchlist" className={`p-2 rounded-lg border transition-all ${watchlisted ? 'border-primary-500 bg-primary-500/20 text-primary-400' : 'border-dark-700 text-dark-400 hover:border-primary-500 hover:text-primary-400'}`}>
                {watchlisted ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
              </button>
              <button onClick={() => openShareModal()} className="p-2 rounded-lg border border-dark-700 text-dark-400 hover:border-primary-500 hover:text-primary-400 transition-all" title="Share this profile">
                <Share2 size={18} />
              </button>
            </div>
          </div>
          {/* s91: liveness advisory — the contact links live on this page, so
              the warning does too. Renders only on adverse verdicts. */}
          <LivenessBadge variant="banner" status={startup.liveness_status} checkedAt={startup.liveness_checked_at} />
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
                  <div className="bg-dark-950 rounded-xl border border-dark-800 p-6">
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
                    startup.last_funding_stage && ['Last Funding Stage', startup.last_funding_stage, 'text-primary-600'],
                    startup.last_funding_year && ['Last Funding Year', startup.last_funding_year, 'text-gray-700'],
                    startup.revenue_range && ['Revenue', /^[<>]?\d/.test(startup.revenue_range) ? `₹ ${startup.revenue_range}` : startup.revenue_range, 'text-accent-600'],
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

            {/* Phase 87f — child sub-sections (team / products / funding /
                clients / patents / competitors / news / acquisitions).
                Read-only render. Silently skipped if backend returns nothing. */}
            <StartupSubSections data={childSections} />
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
                  funding && { label: 'Funding Raised', value: funding, icon: Wallet, color: 'text-yellow-500' },  // Phase 92.4 (T26) - Wallet (currency-agnostic) replaces DollarSign which implied USD
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
                  startup.pitch_deck_proxy_url ? (
                    <button
                      onClick={async () => {
                        try {
                          await openProxyFile(startup.pitch_deck_proxy_url);
                        } catch (err) {
                          toast.error(err.message || 'Failed to open file');
                        }
                      }}
                      className="flex items-center gap-2 text-primary-600 hover:text-primary-700 bg-transparent border-0 p-0 cursor-pointer"
                    >
                      <FileText size={14} /> Pitch Deck
                    </button>
                  ) : (
                    <a href={startup.pitch_deck_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-primary-600 hover:text-primary-700">
                      <FileText size={14} /> Pitch Deck
                    </a>
                  )
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
      {/* Phase 110: Share modal JSX */}
      {shareOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={(e) => { if (e.target === e.currentTarget) setShareOpen(false); }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 560, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>Share this startup profile</h2>
              <button onClick={() => setShareOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6e6e6e', padding: 4 }}>
                <X size={16} />
              </button>
            </div>

            {/* Tab strip */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 18, borderBottom: '1.5px solid #eee' }}>
              {[
                { id: 'pdf',   icon: <FileDown size={13} />, label: 'Download PDF' },
                { id: 'link',  icon: <LinkIconShare size={13} />, label: 'Invite link' },
                { id: 'email', icon: <Mail size={13} />, label: 'Invite by email', ownerOnly: true },
              ].filter(t => !t.ownerOnly || shareIsOwner).map(t => (
                <button key={t.id} onClick={() => setShareTab(t.id)}
                  style={{ padding: '10px 14px', fontSize: 12, fontWeight: 700, background: 'none', border: 'none',
                           borderBottom: shareTab === t.id ? '2.5px solid #D0A848' : '2.5px solid transparent',
                           marginBottom: -1.5, color: shareTab === t.id ? '#D0A848' : '#666', cursor: 'pointer',
                           display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            {/* Tab body */}
            {shareTab === 'pdf' && (
              <div>
                <p style={{ fontSize: 12, color: '#666', margin: '0 0 14px', lineHeight: 1.6 }}>
                  Generate a branded PDF of this startup profile. Anyone with this PDF can read it (no link to manage).
                </p>
                <button onClick={() => downloadStartupPdf()}
                  style={{ width: '100%', padding: '11px 18px', background: '#D0A848', color: '#0D2137', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <FileDown size={14} /> Download startup profile PDF
                </button>
              </div>
            )}

            {shareTab === 'link' && (
              <div>
                <p style={{ fontSize: 12, color: '#666', margin: '0 0 14px', lineHeight: 1.6 }}>
                  Create a link to invite someone to this profile. People who aren&apos;t on OpenI yet will be asked to create a free account (or sign in), then taken straight to the profile.
                </p>
                <button onClick={() => mintNewProfileShare()} disabled={shareMinting}
                  style={{ width: '100%', padding: '10px 16px', background: '#D0A848', color: '#0D2137', border: 'none', borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: shareMinting ? 'not-allowed' : 'pointer', marginBottom: 16, opacity: shareMinting ? 0.6 : 1 }}>
                  {shareMinting ? 'Creating link…' : '+ Create new share link'}
                </button>

                {/* Existing shares list */}
                {shareLoading ? (
                  <p style={{ color: '#5c5c5c', fontSize: 12, textAlign: 'center', margin: '14px 0' }}>Loading existing shares…</p>
                ) : shareList.length === 0 ? (
                  <p style={{ color: '#5c5c5c', fontSize: 12, fontStyle: 'italic', margin: 0, textAlign: 'center', padding: '12px 0' }}>No share links yet. Click above to create one.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto' }}>
                    {shareList.map(s => {
                      const expired = s.expires_at && new Date(s.expires_at) < new Date();
                      const revoked = !!s.revoked_at;
                      const inactive = expired || revoked;
                      const shareUrl = `${window.location.origin}/share/startup/${s.token}`;
                      return (
                        <div key={s.id} style={{ padding: 10, borderRadius: 8, background: inactive ? '#fafafa' : '#fff8ec', border: `1px solid ${inactive ? '#eee' : 'rgba(213,170,91,0.3)'}`, opacity: inactive ? 0.6 : 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: revoked ? '#fef2f2' : (expired ? '#fef9e7' : '#f0fdf4'), color: revoked ? '#dc2626' : (expired ? '#a16207' : '#16a34a') }}>
                              {revoked ? 'REVOKED' : (expired ? 'EXPIRED' : 'ACTIVE')}
                            </span>
                            <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4, background: '#e0e7ff', color: '#3730a3' }}>
                              {s.redaction_mode === 'full' ? 'Full' : s.redaction_mode === 'public_safe' ? 'Public-safe' : 'Pitch-only'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: 6, background: '#fff', borderRadius: 6, border: '1px solid #eee', fontSize: 10, fontFamily: 'monospace' }}>
                            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#555' }}>{shareUrl}</span>
                            {!inactive && (
                              <>
                                <button onClick={() => copyShareLink(s.token)} style={{ padding: '3px 7px', background: '#f3f4f6', border: '1px solid #ddd', borderRadius: 5, fontSize: 9, fontWeight: 600, color: '#555', cursor: 'pointer' }}>Copy</button>
                                <button onClick={() => revokeProfileShare(s.id)} style={{ padding: '3px 7px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 5, fontSize: 9, fontWeight: 600, color: '#b91c1c', cursor: 'pointer' }}>Revoke</button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {shareTab === 'email' && shareIsOwner && (
              <div>
                <p style={{ fontSize: 12, color: '#666', margin: '0 0 14px', lineHeight: 1.6 }}>
                  Send a magic-link invite to a non-OpenI user. They&apos;ll be prompted to create an account, then sign in to view your full profile.
                </p>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>Email address</label>
                <input type="email" value={shareEmail} onChange={e => setShareEmail(e.target.value)}
                  placeholder="recipient@example.com"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', background: '#fafafa', border: '1.5px solid #e0e0e0', borderRadius: 9, fontSize: 16, marginBottom: 10 }} />
                <label style={{ fontSize: 11, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>Personal message (optional)</label>
                <textarea value={shareEmailMessage} onChange={e => setShareEmailMessage(e.target.value)} rows={2}
                  placeholder="Add a note — why you&apos;re sharing this profile."
                  style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', background: '#fafafa', border: '1.5px solid #e0e0e0', borderRadius: 9, fontSize: 16, resize: 'vertical', marginBottom: 14 }} />
                <button onClick={() => sendProfileEmailInvite()} disabled={shareEmailBusy || !shareEmail.trim()}
                  style={{ width: '100%', padding: '10px 16px', background: (!shareEmail.trim() || shareEmailBusy) ? '#ccc' : '#D0A848', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: (!shareEmail.trim() || shareEmailBusy) ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Mail size={14} /> {shareEmailBusy ? 'Sending…' : 'Send invite'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Phase 99q: Watchlist picker modal */}
      {wlOpen && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setWlOpen(false); }}
          style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        >
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 480, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>Save to watchlist</h3>
              <button onClick={() => setWlOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', padding: 4, lineHeight: 0 }}>
                <X size={20} />
              </button>
            </div>
            <p style={{ fontSize: 12, color: '#666', margin: '0 0 18px', lineHeight: 1.6 }}>
              {(startup?.name || 'This startup')} — choose a list to save to, or create a new one.
            </p>

            {wlLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '28px 0', color: '#666', fontSize: 13 }}>
                <Loader2 size={18} className="animate-spin" /> Loading your lists…
              </div>
            ) : wlLists.length === 0 ? (
              <p style={{ fontSize: 13, color: '#5c5c5c', textAlign: 'center', padding: '18px 0' }}>
                You don&apos;t have any watchlists yet. Create one below.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
                {wlLists.map((l) => (
                  <div key={l.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 12px', background: '#fafafa', border: '1.5px solid #eee', borderRadius: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#222', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.name}</span>
                    <button onClick={() => toggleInList(l)} disabled={wlBusyId === l.id}
                      style={{ flexShrink: 0, padding: '6px 14px', background: l.contains ? '#fff' : '#D0A848', color: l.contains ? '#D0A848' : '#fff', border: l.contains ? '1.5px solid #D0A848' : 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: wlBusyId === l.id ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, minWidth: 86, justifyContent: 'center' }}>
                      {wlBusyId === l.id
                        ? <Loader2 size={13} className="animate-spin" />
                        : l.contains
                          ? <><BookmarkCheck size={13} /> Saved</>
                          : <><Bookmark size={13} /> Save</>}
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ borderTop: '1px solid #eee', paddingTop: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>Create a new list</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="text" value={wlNewName} onChange={(e) => setWlNewName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') createAndAdd(); }}
                  placeholder="e.g. Q3 Pipeline"
                  style={{ flex: 1, boxSizing: 'border-box', padding: '9px 12px', background: '#fafafa', border: '1.5px solid #e0e0e0', borderRadius: 9, fontSize: 16 }} />
                <button onClick={() => createAndAdd()} disabled={wlCreating || !wlNewName.trim()}
                  style={{ flexShrink: 0, padding: '9px 16px', background: (!wlNewName.trim() || wlCreating) ? '#ccc' : '#D0A848', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: (!wlNewName.trim() || wlCreating) ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {wlCreating ? <Loader2 size={14} className="animate-spin" /> : 'Create & save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
// --- BODY END ---
