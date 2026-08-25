import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PERSONAS, PROFILE_FIELDS, REGISTER_FIELDS, ORG_NAME_FIELD, PERSONA_INDUSTRY_FIELD, PERSONA_DESCRIPTION_FIELD, PERSONA_HAS_INDUSTRY, PERSONA_HAS_DESCRIPTION } from '../../config/personas';
import { claimAPI, profileAPI, orgAPI } from '../../services/api';
import safeStorage from '../../utils/safeStorage';
import {
  Shield, Eye, EyeOff, AlertCircle, Loader2, ArrowLeft, ArrowRight, Check, Building2,
} from 'lucide-react';
import PublicTour from '../../components/PublicTour';
import PageTourButton from '../../components/PageTourButton';
import { inputStyle, FormField, coerceForField } from './registerParts/index.js';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [params, setParams] = useSearchParams();
  // No silent default — if ?type= is missing, user MUST pick a persona via Step 0.
  const personaType = params.get('type');
  const persona = personaType ? PERSONAS[personaType] : null;
  // Phase 65: Step 2 now shows a short list (~6 fields). Full PROFILE_FIELDS
  // remains the source of truth for My Profile. This unblocks Shameel-style
  // complaints that the signup form is too long.
  // Phase 117c — memoised so the array identity is stable across renders; this lets
  // the Step-2 prefill useEffect depend on it without re-firing every keystroke.
  const profileFields = useMemo(
    () => (personaType ? (REGISTER_FIELDS[personaType] || PROFILE_FIELDS[personaType] || []) : []),
    [personaType],
  );
  const orgField = personaType ? ORG_NAME_FIELD[personaType] : null;

  // Step 0: Choose persona (only when ?type= is missing)
  // Step 1: Account · Step 2: Profile · Step 3: Done
  const [step, setStep] = useState(personaType ? 1 : 0);
  const [name, setName]       = useState('');
  // Phase 108: invite_token + email pre-fill from /invite/accept/<token> magic-link redirect
  const inviteToken = params.get('invite_token') || '';
  const prefilledEmail = (params.get('email') || '').trim().toLowerCase();
  const [email, setEmail]     = useState(prefilledEmail);
  const [password, setPassword] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [profileData, setProfileData] = useState({});
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  // Phase 53: claim detection state
  const [claimCandidates, setClaimCandidates] = useState([]);
  const [claimSubmitting, setClaimSubmitting] = useState(false);
  const [claimResult, setClaimResult] = useState(null);
  // Phase 60.7: mandatory Terms + Privacy acceptance
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Phase 113 — domain-match suggestion at signup
  const [orgMatch, setOrgMatch] = useState(null);          // null | { id, name, slug, logo_url, admin_user_id }
  const [orgMatchHidden, setOrgMatchHidden] = useState(false); // user dismissed the card
  const [orgJoinSubmitting, setOrgJoinSubmitting] = useState(false);
  const [orgJoinResult, setOrgJoinResult] = useState(null); // null | { status, org_name }

  // Phase 113 — debounce email -> domain lookup. Fires 500ms after typing stops.
  // Phase 113b — invite_token takes precedence (don't show competing prompts when
  // user is already on a magic-link entity-invite flow).
  useEffect(() => {
    if (inviteToken) { setOrgMatch(null); return; }
    if (orgMatchHidden) return;
    if (orgJoinResult) return; // already requested; stop polling
    const trimmed = (email || '').trim().toLowerCase();
    const at = trimmed.indexOf('@');
    if (at === -1 || at === trimmed.length - 1) {
      setOrgMatch(null);
      return;
    }
    const domain = trimmed.slice(at + 1);
    if (!/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/i.test(domain)) {
      setOrgMatch(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await orgAPI.lookupByDomain(domain);
        setOrgMatch(res?.org || null);
      } catch {
        setOrgMatch(null);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [email, orgMatchHidden, orgJoinResult, inviteToken]);

  // ─── Phase 117 — Auto-prefill Step 2 from orgMatch (Feedback #6 fix) ───
  // Whenever orgMatch arrives AND user is on Step 2 OR about to advance to it,
  // pre-populate org name + industry + description so colleagues entering the
  // same domain get a consistent profile without re-typing.
  // Bug #1 (26 May) had this firing only on Continue click — that path still
  // works (kept below in the onClick) but is too late: by the time the user
  // sees Step 2 the fields should already be filled. This effect fixes the
  // regression flagged by cohort 28 May.
  useEffect(() => {
    if (!orgMatch || orgJoinResult || !orgField || !personaType) return;
    setProfileData(prev => ({
      ...prev,
      [orgField]: prev[orgField] || orgMatch.name || '',
      ...(orgMatch.industry && PERSONA_HAS_INDUSTRY[personaType]
        ? { [PERSONA_INDUSTRY_FIELD[personaType]]: prev[PERSONA_INDUSTRY_FIELD[personaType]] || coerceForField(profileFields, PERSONA_INDUSTRY_FIELD[personaType], orgMatch.industry) }
        : {}),
      ...(orgMatch.description && PERSONA_HAS_DESCRIPTION[personaType]
        ? { [PERSONA_DESCRIPTION_FIELD[personaType]]: prev[PERSONA_DESCRIPTION_FIELD[personaType]] || coerceForField(profileFields, PERSONA_DESCRIPTION_FIELD[personaType], orgMatch.description) }
        : {}),
    }));
  }, [orgMatch, orgJoinResult, orgField, personaType, profileFields]);

  // Phase 113 — handle "Request to join" click
  const handleRequestJoinOrg = async () => {
    if (!orgMatch || orgJoinSubmitting) return;
    setOrgJoinSubmitting(true);
    try {
      // Note: backend requires authMiddleware. User must first complete signup,
      // then we POST request-join with their fresh token. But at signup time
      // we don't have a token yet — so we stash the org_id and replay after
      // verify-email succeeds (similar to Phase 60.10 profileData stash).
      try {
        safeStorage.setItem('openi_pending_org_join', JSON.stringify({
          org_id: orgMatch.id,
          org_name: orgMatch.name,
        }));
      } catch { /* localStorage may be disabled — not blocking */ }
      setOrgJoinResult({ status: 'pending_signup', org_name: orgMatch.name });
    } finally {
      setOrgJoinSubmitting(false);
    }
  };

  const updateField = (fieldName, value) => {
    setProfileData(prev => ({ ...prev, [fieldName]: value }));
  };

  // Validation
  const step1Valid = name.trim() && email.trim() && password.length >= 6 && password === confirmPwd && termsAccepted;

  const handleRegister = async () => {
    setError('');
    setLoading(true);
    try {
      // Org name now lives in Step 2's persona-specific field (was duplicated
      // as Step 1 "Organization Name"). Pass it through to backend as
      // organization_name for backward-compatible bootstrap.
      const orgFromProfile = orgField ? (profileData[orgField] || '').trim() : '';
      const registerResult = await register(name.trim(), email.trim(), password, personaType, orgFromProfile || undefined, termsAccepted);

      // s49e + s50: most users get verification_required:true and NO session
      // token. We can't PUT /profile/me without a token, so stash profileData
      // and let VerifyEmail flush it after verify succeeds.
      //
      // Phase 60.10 fix: localStorage instead of sessionStorage. sessionStorage
      // is per-tab; Gmail link clicks open verify in a NEW tab where the stash
      // is invisible -> Step 2 data was being silently lost. localStorage is
      // shared across tabs of the same origin so the verify-tab can flush.
      if (registerResult?.verification_required) {
        try {
          safeStorage.setItem('openi_pending_profile', JSON.stringify(profileData));
        } catch { /* localStorage may be disabled — not blocking */ }
        const url = `/verify-email?email=${encodeURIComponent(email.trim().toLowerCase())}`;
        navigate(url, { replace: true });
        return;
      }

      // Bypass-list path — session token already issued by backend; persist Step 2 data.
      const hasProfileData = Object.values(profileData).some(v =>
        Array.isArray(v) ? v.length > 0 : (v !== '' && v !== null && v !== undefined)
      );
      if (hasProfileData) {
        try {
          await profileAPI.updateMyProfile(profileData);
        } catch {
          // Don't block success screen — user can edit profile later
        }
      }
      // Phase 53: after startup registration, detect matching imported startups
      if (personaType === 'startup') {
        try {
          const res = await claimAPI.detect();
          if (Array.isArray(res?.candidates) && res.candidates.length > 0) {
            setClaimCandidates(res.candidates);
          }
        } catch {
          // Silent failure — not blocking the success screen
        }
      }
      setStep(3);
    } catch (err) {
      // Phase 117 — Surface backend FREE_EMAIL_BLOCKED with clear UI hint
      // s88 — same for DISPOSABLE_EMAIL_BLOCKED (temp-mail block, all personas)
      const code = err?.response?.data?.code || err?.code;
      const msg  = err?.response?.data?.message || err?.message;
      if (code === 'FREE_EMAIL_BLOCKED') {
        setError(msg || 'Please use your work email to register as an organization.');
      } else if (code === 'DISPOSABLE_EMAIL_BLOCKED') {
        setError(msg || 'Disposable or temporary email addresses cannot be used to create an account. Please register with a lasting email address.');
      } else {
        setError(msg || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Phase 53: handle claim submission from modal
  const submitClaim = async (candidate) => {
    setClaimSubmitting(true);
    try {
      const res = await claimAPI.request({ target_startup_user_id: candidate.user_id });
      setClaimResult({ success: true, ...res, company_name: candidate.company_name });
    } catch (err) {
      setClaimResult({ success: false, error: err.message });
    } finally {
      setClaimSubmitting(false);
    }
  };

  // Only show "Invalid persona" when an EXPLICIT bad ?type= was supplied
  // (e.g. /register?type=garbage). When type is missing, fall through to Step 0.
  if (personaType && !persona) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f5f5f5' }}>
        <div className="text-center">
          <p className="text-lg font-semibold" style={{ color: '#1a1a1a' }}>Invalid persona type</p>
          <Link to="/landing" className="mt-4 inline-block text-sm font-semibold" style={{ color: '#D0A848' }}>
            Go back
          </Link>
        </div>
      </div>
    );
  }

  // Step 0: persona picker — render dedicated screen, no stepper, no Account/Profile sections
  if (step === 0) {
    // Persona picker split into the SAME two groups the homepage uses
    // ("Innovation Providers" / "Innovation Seekers") so the framing is
    // consistent end-to-end and kills the Startup vs Service Provider mix-up.
    // "Service Provider" = a VENDOR that SELLS support services TO startups
    // (cloud/legal/compliance) — it is a Seeker, NOT a company building a product.
    const PERSONA_GROUPS = [
      {
        title: 'Innovation Providers',
        tag: 'GET DISCOVERED',
        accent: '#D0A848',
        subtitle: 'Showcase your startup, research or technology to get funded, mentored and discovered.',
        items: [
          { key: 'startup',  desc: "You're building a product or company — pick this for challenges" },
          { key: 'student',  desc: 'Student innovator / researcher' },
          { key: 'academia', desc: 'University or research institute' },
        ],
      },
      {
        title: 'Innovation Seekers',
        tag: 'FIND THE RIGHT STARTUP',
        accent: '#3b82f6',
        subtitle: 'Source, fund, host or sell services to startups — not for companies building a product.',
        items: [
          { key: 'corporate',        desc: 'Enterprise seeking innovation' },
          { key: 'government',       desc: 'Government body or PSU' },
          { key: 'investor',         desc: 'Angel, VC, PE, or fund' },
          { key: 'mentor',           desc: 'Industry mentor or advisor' },
          { key: 'lab',              desc: 'Lab offering resources' },
          { key: 'incubator',        desc: 'Startup incubation program' },
          { key: 'accelerator',      desc: 'Growth acceleration program' },
          { key: 'service_provider', desc: 'Vendor selling services TO startups (cloud, legal, compliance) — not a startup' },
        ],
      },
    ];
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#f5f5f5' }}>
        <div className="w-full max-w-3xl">
          {/* Phase 65c: brand mark on persona-picker too. */}
          <div className="text-center mb-6">
            <Link to="/" aria-label="Go to OpenI home" className="inline-block">
              <img
                src="/openi-logo.png"
                alt="OpenI"
                className="mx-auto mb-3"
                style={{ height: 56, width: 'auto', maxWidth: 200, objectFit: 'contain', display: 'block', cursor: 'pointer' }}
                onError={e => { e.target.style.display = 'none'; }}
              />
            </Link>
            <h1 id="tour-page-register" className="text-2xl font-bold" style={{ color: '#1a1a1a' }}>Choose your persona</h1>
            <p className="text-sm mt-2" style={{ color: '#6b7280' }}>
              Pick the role that best describes you. You can always update your profile later.
            </p>
            <div className="mt-4 flex justify-center">
              <PageTourButton />
            </div>
          </div>
          {PERSONA_GROUPS.map((group, gi) => (
            <div key={group.title} className={gi > 0 ? 'mt-7' : ''}>
              {/* Group heading — mirrors the homepage Provider/Seeker split so a
                  startup never scans into the "Service Provider" tile by mistake. */}
              <div className="mb-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-base font-bold" style={{ color: '#1a1a1a' }}>{group.title}</span>
                  <span className="text-[11px] font-semibold tracking-wide" style={{ color: group.accent }}>{group.tag}</span>
                </div>
                <div className="text-xs mt-0.5" style={{ color: '#6e6e6e' }}>{group.subtitle}</div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {group.items.map(p => {
                  const meta = PERSONAS[p.key];
                  if (!meta) return null;
                  return (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => {
                        setParams({ type: p.key }, { replace: true });
                        setStep(1);
                      }}
                      className="rounded-xl p-4 text-center transition-all"
                      style={{ background: '#fff', border: '1px solid #e5e7eb', cursor: 'pointer' }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = meta.color;
                        e.currentTarget.style.boxShadow = `0 4px 16px ${meta.color}20`;
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-lg mx-auto mb-2 flex items-center justify-center"
                        style={{ background: `${meta.color}12` }}
                      >
                        <Building2 size={20} style={{ color: meta.color }} />
                      </div>
                      <div className="text-sm font-bold" style={{ color: '#1a1a1a' }}>{meta.label}</div>
                      <div className="text-xs mt-0.5" style={{ color: '#6b7280' }}>{p.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <div className="text-center mt-8">
            <Link to="/dashboard/login" className="text-sm font-semibold" style={{ color: '#6e6e6e' }}>
              Already have an account? Sign in
            </Link>
          </div>
        </div>
        {/* Page tour — must be mounted here too: Step 0 is a separate early
            `return` from the Step 1-3 JSX below (which has its own
            <PublicTour /> mount), so without this the "Take a tour" button
            on the persona picker dispatches openi-page-tour into a void —
            no PublicTour instance is in the tree yet to catch it. */}
        <PublicTour />
      </div>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4" style={{ background: '#f5f5f5' }}>
      <div className="w-full max-w-lg">
        {/* Header — Phase 65c: OpenI brand mark (matches Login.jsx pattern). The
            persona-color chip below indicates which persona is being registered.
            Logo links to /; Shield in persona-color is the onError fallback. */}
        <div className="text-center mb-6">
          <Link to="/" aria-label="Go to OpenI home" className="inline-block">
            <img
              src="/openi-logo.png"
              alt="OpenI"
              className="mx-auto mb-3"
              style={{ height: 56, width: 'auto', maxWidth: 200, objectFit: 'contain', display: 'block', cursor: 'pointer' }}
              onError={e => {
                e.target.style.display = 'none';
                if (e.target.parentElement && e.target.parentElement.nextSibling) {
                  e.target.parentElement.nextSibling.style.display = 'inline-flex';
                }
              }}
            />
          </Link>
          <div
            className="items-center justify-center w-14 h-14 rounded-2xl mb-3 shadow-md mx-auto"
            style={{ background: persona.color, display: 'none' }}
          >
            <Shield size={26} color="#fff" />
          </div>
          <h1 className="text-xl font-bold" style={{ color: '#1a1a1a' }}>Join as {persona.label}</h1>
          <p className="text-sm mt-1" style={{ color: '#6b7280' }}>{persona.description}</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  background: step >= s ? '#D0A848' : '#e5e7eb',
                  color: step >= s ? '#fff' : '#9ca3af',
                }}>
                {step > s ? <Check size={14} /> : s}
              </div>
              {s < 3 && <div className="w-12 h-0.5" style={{ background: step > s ? '#D0A848' : '#e5e7eb' }} />}
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-8 mb-6">
          <span className="text-xs font-medium" style={{ color: step >= 1 ? '#D0A848' : '#9ca3af' }}>Account</span>
          <span className="text-xs font-medium" style={{ color: step >= 2 ? '#D0A848' : '#9ca3af' }}>Profile</span>
          <span className="text-xs font-medium" style={{ color: step >= 3 ? '#D0A848' : '#9ca3af' }}>Done</span>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-6 shadow-sm" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
          {error && (
            <div className="flex items-center gap-2 text-sm rounded-xl px-4 py-3 mb-5"
              style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c' }}>
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Step 1: Account */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Full Name *</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name"
                  style={inputStyle} onFocus={e => e.target.style.borderColor = '#D0A848'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Email *</label>
                {/* Phase 108 follow-up — lock email when arriving via magic-link to prevent breaking the consume flow */}
                <input
                  type="email"
                  value={email}
                  onChange={e => !inviteToken && setEmail(e.target.value)}
                  readOnly={!!inviteToken}
                  placeholder="you@example.com"
                  style={{
                    ...inputStyle,
                    backgroundColor: inviteToken ? '#f3f4f6' : inputStyle.backgroundColor,
                    cursor: inviteToken ? 'not-allowed' : 'text',
                  }}
                  onFocus={e => { if (!inviteToken) e.target.style.borderColor = '#D0A848'; }}
                  onBlur={e => { if (!inviteToken) e.target.style.borderColor = '#e5e7eb'; }}
                />
                {inviteToken && (
                  <p style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
                    Email is locked because you arrived via an invitation link.
                  </p>
                )}
                {/* Phase 113 — domain-match suggestion card */}
                {orgMatch && !orgMatchHidden && !orgJoinResult && (
                  <div style={{
                    marginTop: 10,
                    padding: 14,
                    background: 'rgba(213, 170, 91, 0.08)',
                    border: '1.5px solid rgba(213, 170, 91, 0.35)',
                    borderRadius: 9,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                  }}>
                    {orgMatch.logo_url && (
                      <img src={orgMatch.logo_url} alt={orgMatch.name}
                        style={{ width: 38, height: 38, borderRadius: 8, objectFit: 'contain', background: '#fff', padding: 3, flexShrink: 0 }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <strong>{orgMatch.name}</strong> is already on OpenI Hub
                        {/* Phase 117c — Platform Operator badge */}
                        {orgMatch.is_platform_owner && (
                          <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', background: '#0D2137', color: '#D0A848', borderRadius: 4, letterSpacing: 0.3 }}>
                            PLATFORM OPERATOR
                          </span>
                        )}
                        {orgMatch.is_verified && !orgMatch.is_platform_owner && (
                          <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', background: '#15803d', color: '#fff', borderRadius: 4, letterSpacing: 0.3 }}>
                            VERIFIED
                          </span>
                        )}
                      </div>
                      {/* Phase 117b — Multi-persona display: show all roles this org plays */}
                      {Array.isArray(orgMatch.personas) && orgMatch.personas.length > 1 && (
                        <div style={{ fontSize: 10, color: '#5c5c5c', marginBottom: 6 }}>
                          Plays {orgMatch.personas.length} roles on OpenI:&nbsp;
                          {orgMatch.personas.map((p, i) => (
                            <span key={p.type} style={{ fontWeight: p.is_primary ? 600 : 400, color: p.is_primary ? '#1a1a1a' : '#888' }}>
                              {p.type.replace(/_/g, ' ')}{i < orgMatch.personas.length - 1 ? ', ' : ''}
                            </span>
                          ))}
                        </div>
                      )}
                      <div style={{ fontSize: 11, color: '#666', marginBottom: 8 }}>
                        Would you like to request to join the existing organization, or create your own?
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={handleRequestJoinOrg}
                          disabled={orgJoinSubmitting}
                          style={{
                            padding: '6px 12px', background: '#D0A848', color: '#0D2137',
                            border: 'none', borderRadius: 7, fontSize: 11, fontWeight: 700,
                            cursor: orgJoinSubmitting ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {orgJoinSubmitting ? 'Submitting…' : 'Request to join'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setOrgMatchHidden(true)}
                          style={{
                            padding: '6px 12px', background: 'transparent', color: '#666',
                            border: '1.5px solid #e5e7eb', borderRadius: 7, fontSize: 11, fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Create my own
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {/* Phase 113 — confirmation banner after user clicks Request to join */}
                {orgJoinResult && (
                  <div style={{
                    marginTop: 10,
                    padding: 12,
                    background: 'rgba(22, 163, 74, 0.06)',
                    border: '1.5px solid rgba(22, 163, 74, 0.25)',
                    borderRadius: 9,
                    fontSize: 12,
                    color: '#16a34a',
                  }}>
                    Your request to join <strong>{orgJoinResult.org_name}</strong> will be sent after you verify your email. The org admin will approve it on their end.
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Password *</label>
                <div className="relative">
                  <input type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Min 6 characters" style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#D0A848'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#6e6e6e' }}>
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Confirm Password *</label>
                <input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)}
                  placeholder="Re-enter password" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#D0A848'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                {confirmPwd && password !== confirmPwd && (
                  <p className="text-xs mt-1" style={{ color: '#ef4444' }}>Passwords do not match</p>
                )}
              </div>

              {/* Phase 60.7 (s50) — Mandatory Terms + Privacy acceptance */}
              <label
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '10px 12px', marginTop: 4,
                  background: termsAccepted ? 'rgba(213,170,91,0.08)' : '#fafafa',
                  border: `1px solid ${termsAccepted ? '#D0A84866' : '#e5e7eb'}`,
                  borderRadius: 10, cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={e => setTermsAccepted(e.target.checked)}
                  style={{ marginTop: 2, accentColor: '#D0A848', cursor: 'pointer', flexShrink: 0 }}
                />
                <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>
                  I have read and agree to the{' '}
                  <a href="/terms" target="_blank" rel="noopener noreferrer"
                     style={{ color: '#1D4ED8', textDecoration: 'underline', fontWeight: 500 }}>
                    Terms of Use
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" target="_blank" rel="noopener noreferrer"
                     style={{ color: '#1D4ED8', textDecoration: 'underline', fontWeight: 500 }}>
                    Privacy Policy
                  </a>.
                </span>
              </label>

              <button onClick={() => {
                  setError('');
                  // Bug #1: pre-populate Step 2 fields from matched org if user picked "Create my own"
                  if (orgMatch && !orgJoinResult && orgField) {
                    setProfileData(prev => ({
                      ...prev,
                      [orgField]: prev[orgField] || orgMatch.name,
                      ...(orgMatch.industry && PERSONA_HAS_INDUSTRY[personaType]
                        ? { [PERSONA_INDUSTRY_FIELD[personaType]]: prev[PERSONA_INDUSTRY_FIELD[personaType]] || coerceForField(profileFields, PERSONA_INDUSTRY_FIELD[personaType], orgMatch.industry) }
                        : {}),
                      ...(orgMatch.description && PERSONA_HAS_DESCRIPTION[personaType]
                        ? { [PERSONA_DESCRIPTION_FIELD[personaType]]: prev[PERSONA_DESCRIPTION_FIELD[personaType]] || coerceForField(profileFields, PERSONA_DESCRIPTION_FIELD[personaType], orgMatch.description) }
                        : {}),
                    }));
                  }
                  setStep(2);
                }} disabled={!step1Valid}
                className="w-full font-semibold py-3 rounded-xl flex items-center justify-center gap-2 text-sm mt-2 transition-all"
                style={{ background: step1Valid ? '#D0A848' : '#e5e7eb', color: step1Valid ? '#fff' : '#9ca3af', cursor: step1Valid ? 'pointer' : 'not-allowed' }}>
                Continue <ArrowRight size={16} />
              </button>
              {!termsAccepted && (name.trim() || email.trim() || password) && (
                <p className="text-xs text-center" style={{ color: '#6e6e6e', marginTop: -4 }}>
                  Please accept the Terms of Use and Privacy Policy to continue.
                </p>
              )}
            </div>
          )}

          {/* Step 2: Profile Details */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Phase 65: short signup form. Nudge users that completing
                  the full profile from MyProfile drives discoverability. */}
              <div className="rounded-xl p-3 mb-2 text-xs flex gap-2 items-start"
                   style={{ background: '#FFF8E6', border: '1px solid #D0A84840', color: '#7C5A1F' }}>
                <Building2 size={14} className="flex-shrink-0 mt-0.5" />
                <div>
                  Just the basics for now — you can complete the rest from{' '}
                  <span className="font-semibold">My Profile</span> after signup. The more you fill in,
                  the better your visibility in search and recommendations.
                </div>
              </div>
              {profileFields.map(field => {
                // Phase 60.10e (s50): inject form-level country into state field, and
                // both country + state into city field, so the autocomplete components
                // can scope their fetches correctly.
                let dependentField = field;
                if (field.type === 'state') {
                  dependentField = { ...field, country: profileData.country || 'IN' };
                } else if (field.type === 'city') {
                  dependentField = { ...field, country: profileData.country || 'IN', state: profileData.state || '' };
                }
                return (
                  <FormField key={field.name} field={dependentField} value={profileData[field.name]}
                    onChange={val => updateField(field.name, val)} />
                );
              })}
              <div className="flex gap-3 mt-4">
                <button onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: '#f3f4f6', color: '#374151' }}>
                  <ArrowLeft size={14} className="inline mr-1" /> Back
                </button>
                <button onClick={handleRegister} disabled={loading}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                  style={{ background: '#D0A848', color: '#0D2137' }}>
                  {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                  {loading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
              {/* Phase 65: promote skip to a real secondary action so people
                  who just want an account can get one in <10s. */}
              <button onClick={handleRegister} disabled={loading}
                className="w-full py-2.5 rounded-xl text-sm font-medium border transition-all"
                style={{ background: '#fff', color: '#6b7280', borderColor: '#e5e7eb' }}>
                Skip for now — finish profile after signup
              </button>
            </div>
          )}

          {/* Step 3: Success + Phase 53 claim detection */}
          {step === 3 && (
            <div className="py-6">
              {/* Phase 53 — Claim candidate modal */}
              {claimCandidates.length > 0 && !claimResult && (
                <div className="mb-4 p-4 rounded-xl border" style={{ background: '#FFF8E6', borderColor: '#D0A84840' }}>
                  <div className="flex items-start gap-3 mb-3">
                    <Building2 size={20} style={{ color: '#D0A848' }} />
                    <div>
                      <h3 className="text-sm font-bold mb-1" style={{ color: '#1a1a1a' }}>Is this your company?</h3>
                      <p className="text-xs" style={{ color: '#6b7280' }}>
                        We found {claimCandidates.length} existing {claimCandidates.length === 1 ? 'listing' : 'listings'} matching your domain. Claim yours to take ownership.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {claimCandidates.slice(0, 3).map((c) => (
                      <div key={c.user_id} className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {c.logo_url && <img src={c.logo_url} alt="" className="w-8 h-8 rounded" onError={e => e.target.style.display = 'none'} />}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate" style={{ color: '#1a1a1a' }}>{c.company_name}</p>
                            <p className="text-xs truncate" style={{ color: '#6e6e6e' }}>{c.website} · {c.sector || 'Unknown sector'}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => submitClaim(c)}
                          disabled={claimSubmitting}
                          className="ml-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex-shrink-0"
                          style={{ background: '#D0A848', color: '#0D2137' }}>
                          {claimSubmitting ? '...' : 'Claim'}
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setClaimCandidates([])}
                    className="w-full text-xs text-center mt-3"
                    style={{ color: '#6e6e6e', background: 'none', border: 'none', cursor: 'pointer' }}>
                    Not my company — skip
                  </button>
                </div>
              )}

              {/* Phase 53 — Claim result feedback */}
              {claimResult && (
                <div className="mb-4 p-4 rounded-xl border" style={{
                  background: claimResult.success ? '#ECFDF5' : '#FEF2F2',
                  borderColor: claimResult.success ? '#10B98140' : '#EF444440',
                }}>
                  {claimResult.success ? (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <Check size={18} style={{ color: '#10B981' }} />
                        <h3 className="text-sm font-bold" style={{ color: '#065F46' }}>Claim submitted</h3>
                      </div>
                      <p className="text-xs" style={{ color: '#047857' }}>{claimResult.next_step}</p>
                      {claimResult.verification_method === 'domain_auto' && (
                        <p className="text-xs mt-2" style={{ color: '#047857' }}>
                          Check <strong>{email}</strong> for a confirmation link (valid 48h).
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle size={18} style={{ color: '#EF4444' }} />
                        <h3 className="text-sm font-bold" style={{ color: '#991B1B' }}>Claim failed</h3>
                      </div>
                      <p className="text-xs" style={{ color: '#B91C1C' }}>{claimResult.error}</p>
                    </>
                  )}
                </div>
              )}

              <div className="text-center">
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: '#D0A84815' }}>
                  <Check size={32} style={{ color: '#D0A848' }} />
                </div>
                <h2 className="text-lg font-bold mb-2" style={{ color: '#1a1a1a' }}>Welcome to OpenI Hub!</h2>
                <p className="text-sm mb-6" style={{ color: '#6b7280' }}>
                  Your {persona.label.toLowerCase()} account has been created. Complete your profile to get discovered by the ecosystem.
                </p>
                <button onClick={() => navigate('/dashboard/profile')}
                  className="w-full py-3 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: '#D0A848', color: '#0D2137' }}>
                  Complete My Profile
                </button>
                <button onClick={() => navigate('/dashboard')}
                  className="w-full py-2 rounded-xl text-sm mt-2" style={{ color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}>
                  Go to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Links */}
        {step < 3 && (
          <div className="text-center mt-4 space-y-2">
            <p className="text-sm" style={{ color: '#6b7280' }}>
              Already have an account?{' '}
              <Link to="/dashboard/login" className="font-semibold" style={{ color: '#D0A848' }}>Sign In</Link>
            </p>
            <p className="text-sm">
              <Link to="/landing" style={{ color: '#6e6e6e' }}>Choose a different persona</Link>
            </p>
          </div>
        )}
      </div>
      {/* Page tour */}
      <PublicTour />
    </main>
  );
}
