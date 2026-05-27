import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PERSONAS, PROFILE_FIELDS, REGISTER_FIELDS, ORG_NAME_FIELD, PERSONA_INDUSTRY_FIELD, PERSONA_DESCRIPTION_FIELD, PERSONA_HAS_INDUSTRY, PERSONA_HAS_DESCRIPTION } from '../../config/personas';
import { COUNTRIES, MONEY_RANGES, TICKET_SIZE_RANGES, yearOptions } from '../../config/locations';
import { claimAPI, profileAPI, publicUploadAPI, orgAPI } from '../../services/api';
import TaxonomySelect from '../../components/TaxonomySelect';
import TaxonomyTags from '../../components/TaxonomyTags';
import StateField from '../../components/StateField';
import CityField from '../../components/CityField';
import {
  Shield, Eye, EyeOff, AlertCircle, Loader2, ArrowLeft, ArrowRight, Check, X, Building2,
} from 'lucide-react';

// Mobile Ship 6 (27 May 2026, PROF8) — fontSize bumped 14 -> 16 to suppress
// iOS Safari auto-zoom on focus. Inputs below 16px trigger Safari's input
// zoom which doesn't auto-unzoom after blur. Every new user fills this
// form on mobile; the bump fixes signup UX for all personas.
const inputStyle = {
  backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', color: '#1a1a1a',
  width: '100%', borderRadius: 12, padding: '10px 14px', fontSize: 16, outline: 'none',
};

function TagInput({ value = [], onChange, placeholder }) {
  const [input, setInput] = useState('');
  const add = () => {
    const tag = input.trim();
    if (tag && !value.includes(tag)) {
      onChange([...value, tag]);
      setInput('');
    }
  };
  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-1.5">
        {(value || []).map((t, i) => (
          <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
            style={{ background: '#D5AA5B15', color: '#D5AA5B', border: '1px solid #D5AA5B30' }}>
            {t}
            <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="hover:opacity-70">
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      <input
        type="text" value={input} onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
        placeholder={placeholder || 'Type and press Enter'}
        style={inputStyle}
        onFocus={e => e.target.style.borderColor = '#D5AA5B'}
        onBlur={e => { e.target.style.borderColor = '#e5e7eb'; add(); }}
      />
    </div>
  );
}

function MultiSelect({ options = [], value = [], onChange }) {
  const toggle = (opt) => {
    if (value.includes(opt)) onChange(value.filter(v => v !== opt));
    else onChange([...value, opt]);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button type="button" key={opt} onClick={() => toggle(opt)}
          className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
          style={{
            background: value.includes(opt) ? '#D5AA5B' : '#f9fafb',
            color: value.includes(opt) ? '#fff' : '#555',
            border: `1px solid ${value.includes(opt) ? '#D5AA5B' : '#e5e7eb'}`,
          }}>
          {opt}
        </button>
      ))}
    </div>
  );
}

// Phase 60.10 (s50) — MoneyRangeField: bracket dropdown + currency toggle.
// Stored value shape: { range: '<bracket label>', currency: 'INR' | 'USD' }.
// Two variants: 'revenue' (general money brackets) and 'ticket' (smaller ranges
// suited to investor ticket sizes). Default INR for India-first audience.
function MoneyRangeField({ label, required, value, onChange, variant = 'revenue' }) {
  const ranges = variant === 'ticket' ? TICKET_SIZE_RANGES : MONEY_RANGES;
  const v = (value && typeof value === 'object') ? value : { range: '', currency: 'INR' };
  const cur = v.currency || 'INR';
  const opts = ranges[cur] || [];

  const setRange = (range) => onChange({ ...v, range, currency: cur });
  const setCur = (currency) => {
    // Reset bracket when currency changes since the labels differ between INR/USD.
    onChange({ ...v, range: '', currency });
  };

  const tabBtn = (active) => ({
    flex: 1,
    padding: '7px 10px',
    fontSize: 12,
    fontWeight: active ? 600 : 500,
    border: 'none',
    background: active ? '#fff' : 'transparent',
    color: active ? '#1a1a1a' : '#6b7280',
    borderBottom: `2px solid ${active ? '#D5AA5B' : 'transparent'}`,
    cursor: 'pointer',
    transition: 'all 0.15s',
  });

  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      {/* Currency toggle */}
      <div style={{
        display: 'flex',
        background: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: 10,
        marginBottom: 6,
        overflow: 'hidden',
        maxWidth: 240,
      }}>
        <button type="button" onClick={() => setCur('INR')} style={tabBtn(cur === 'INR')}>
          INR (₹)
        </button>
        <button type="button" onClick={() => setCur('USD')} style={tabBtn(cur === 'USD')}>
          USD ($)
        </button>
      </div>
      {/* Range dropdown */}
      <select value={v.range || ''} onChange={e => setRange(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
        <option value="">Select a range…</option>
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

// Phase 60.8 (s50) — LogoField: dual-mode logo input.
// User can either UPLOAD a file from their computer (preferred) or PASTE a URL.
// Uploads hit POST /api/public/logo-upload (no auth, 2MB image-only) and the
// returned Cloudinary URL replaces the value, so the parent form sees a
// normal string URL either way.
function LogoField({ label, required, value, onChange, placeholder }) {
  const [mode, setMode] = useState(value ? 'url' : 'upload'); // upload | url
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file (PNG, JPG, GIF, WEBP, or SVG).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Image too large. Maximum size is 2 MB.');
      return;
    }
    setUploading(true);
    try {
      const res = await publicUploadAPI.uploadLogo(file);
      onChange(res.url);
    } catch (err) {
      setError(err.message || 'Upload failed. You can paste a URL instead.');
    } finally {
      setUploading(false);
    }
  };

  const tabBtn = (active) => ({
    flex: 1,
    padding: '8px 10px',
    fontSize: 12,
    fontWeight: active ? 600 : 500,
    border: 'none',
    background: active ? '#fff' : 'transparent',
    color: active ? '#1a1a1a' : '#6b7280',
    borderBottom: `2px solid ${active ? '#D5AA5B' : 'transparent'}`,
    cursor: 'pointer',
    transition: 'all 0.15s',
  });

  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>

      {/* Mode toggle */}
      <div style={{
        display: 'flex',
        background: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: 10,
        marginBottom: 8,
        overflow: 'hidden',
      }}>
        <button type="button" onClick={() => setMode('upload')} style={tabBtn(mode === 'upload')}>
          Upload from computer
        </button>
        <button type="button" onClick={() => setMode('url')} style={tabBtn(mode === 'url')}>
          Paste URL
        </button>
      </div>

      {/* Upload mode */}
      {mode === 'upload' && (
        <div>
          <label
            htmlFor={`logo-upload-${label}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 6,
              padding: '20px 16px',
              border: '2px dashed #e5e7eb',
              borderRadius: 12,
              background: '#fafafa',
              cursor: uploading ? 'wait' : 'pointer',
              transition: 'all 0.15s',
              minHeight: 100,
            }}
            onMouseEnter={e => { if (!uploading) e.currentTarget.style.borderColor = '#D5AA5B'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
          >
            {value ? (
              <>
                <img src={value} alt="logo preview"
                     style={{ maxHeight: 56, maxWidth: 120, objectFit: 'contain' }}
                     onError={e => { e.target.style.display = 'none'; }} />
                <span style={{ fontSize: 11, color: '#6b7280' }}>
                  {uploading ? 'Uploading…' : 'Click to replace'}
                </span>
              </>
            ) : (
              <>
                <span style={{ fontSize: 24, color: '#9ca3af' }}>📷</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>
                  {uploading ? 'Uploading…' : 'Click to choose an image'}
                </span>
                <span style={{ fontSize: 11, color: '#9ca3af' }}>
                  PNG, JPG, GIF, WEBP, SVG · max 2 MB
                </span>
              </>
            )}
          </label>
          <input
            id={`logo-upload-${label}`}
            type="file"
            accept="image/*"
            onChange={onFile}
            disabled={uploading}
            style={{ display: 'none' }}
          />
          {value && (
            <button
              type="button"
              onClick={() => { onChange(''); setError(''); }}
              style={{
                marginTop: 6, fontSize: 12, color: '#dc2626',
                background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
              }}
            >
              Remove logo
            </button>
          )}
        </div>
      )}

      {/* URL mode */}
      {mode === 'url' && (
        <input
          type="url"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder || 'https://yoursite.com/logo.png'}
          style={inputStyle}
          onFocus={e => e.target.style.borderColor = '#D5AA5B'}
          onBlur={e => e.target.style.borderColor = '#e5e7eb'}
        />
      )}

      {error && (
        <p style={{ fontSize: 12, color: '#dc2626', marginTop: 6 }}>{error}</p>
      )}
    </div>
  );
}

function FormField({ field, value, onChange }) {
  const { name, label, type, required, options, placeholder, min, max } = field;

  if (type === 'select') {
    return (
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
          {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
        </label>
        <select value={value || ''} onChange={e => onChange(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="">Select...</option>
          {(options || []).map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    );
  }
  if (type === 'textarea') {
    return (
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>{label}</label>
        <textarea value={value || ''} onChange={e => onChange(e.target.value)} rows={3}
          style={{ ...inputStyle, resize: 'vertical' }}
          onFocus={e => e.target.style.borderColor = '#D5AA5B'}
          onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
      </div>
    );
  }
  if (type === 'checkbox') {
    return (
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={!!value} onChange={e => onChange(e.target.checked)}
          className="w-4 h-4 rounded" style={{ accentColor: '#D5AA5B' }} />
        <span className="text-sm font-medium" style={{ color: '#374151' }}>{label}</span>
      </label>
    );
  }
  if (type === 'tags') {
    return (
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>{label}</label>
        <TagInput value={value || []} onChange={onChange} placeholder={placeholder} />
      </div>
    );
  }
  if (type === 'multiselect') {
    return (
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>{label}</label>
        <MultiSelect options={options || []} value={value || []} onChange={onChange} />
      </div>
    );
  }
  if (type === 'taxonomy_select') {
    return (
      <TaxonomySelect
        taxonomy={field.taxonomy}
        value={value}
        onChange={onChange}
        label={label}
        required={required}
        inputStyle={inputStyle}
        labelClassName="block text-sm font-medium mb-1.5"
      />
    );
  }
  if (type === 'taxonomy_tags') {
    return (
      <TaxonomyTags
        taxonomy={field.taxonomy}
        value={value || []}
        onChange={onChange}
        placeholder={placeholder}
        label={label}
        inputStyle={inputStyle}
        labelClassName="block text-sm font-medium mb-1.5"
      />
    );
  }
  if (type === 'logo') {
    return (
      <LogoField label={label} required={required} value={value} onChange={onChange} placeholder={placeholder} />
    );
  }
  // Phase 60.10 (s50) — country select. Default India, full ISO list.
  if (type === 'country') {
    return (
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
          {label || 'Country'} {required && <span style={{ color: '#ef4444' }}>*</span>}
        </label>
        <select value={value || 'IN'} onChange={e => onChange(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
          {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
        </select>
      </div>
    );
  }
  // Phase 60.10e (s50) — state via shared StateField component.
  // Country comes from the form via dependentField injection at FormField call site.
  if (type === 'state') {
    return (
      <StateField
        value={value}
        onChange={onChange}
        country={field.country || 'IN'}
        label={label}
        required={required}
        inputStyle={inputStyle}
      />
    );
  }
  // Phase 60.10e (s50) — city via shared CityField component (debounced autocomplete).
  // Country + state come from form via dependentField injection.
  if (type === 'city') {
    return (
      <CityField
        value={value}
        onChange={onChange}
        country={field.country || 'IN'}
        state={field.state || ''}
        label={label}
        required={required}
        placeholder={placeholder}
        inputStyle={inputStyle}
      />
    );
  }
  // Phase 60.10 — year select. Forward-fill 1970..currentYear.
  if (type === 'year') {
    const opts = yearOptions(field.min || 1970);
    return (
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
          {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
        </label>
        <select value={value || ''} onChange={e => onChange(e.target.value === '' ? '' : Number(e.target.value))}
                style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="">Select year…</option>
          {opts.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
    );
  }
  // Phase 60.10 — money_range. Bracket dropdown + INR/USD currency toggle.
  // Stored as object {range: '<bracket label>', currency: 'INR' | 'USD'}.
  if (type === 'money_range') {
    return <MoneyRangeField label={label} required={required} value={value} onChange={onChange} variant={field.variant || 'revenue'} />;
  }
  // text, number, url, email
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      <input
        type={type || 'text'} value={value || ''} onChange={e => onChange(type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)}
        placeholder={placeholder || ''} min={min} max={max}
        style={inputStyle}
        onFocus={e => e.target.style.borderColor = '#D5AA5B'}
        onBlur={e => e.target.style.borderColor = '#e5e7eb'}
      />
    </div>
  );
}

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
  const profileFields = personaType ? (REGISTER_FIELDS[personaType] || PROFILE_FIELDS[personaType] || []) : [];
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
        localStorage.setItem('openi_pending_org_join', JSON.stringify({
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
          localStorage.setItem('openi_pending_profile', JSON.stringify(profileData));
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
      setError(err.message);
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
          <Link to="/landing" className="mt-4 inline-block text-sm font-semibold" style={{ color: '#D5AA5B' }}>
            Go back
          </Link>
        </div>
      </div>
    );
  }

  // Step 0: persona picker — render dedicated screen, no stepper, no Account/Profile sections
  if (step === 0) {
    const PERSONA_PICKER_LIST = [
      { key: 'startup',          desc: 'Tech startup or early-stage' },
      { key: 'student',          desc: 'Student innovator / researcher' },
      { key: 'academia',         desc: 'University or research institute' },
      { key: 'corporate',        desc: 'Enterprise seeking innovation' },
      { key: 'government',       desc: 'Government body or PSU' },
      { key: 'investor',         desc: 'Angel, VC, PE, or fund' },
      { key: 'mentor',           desc: 'Industry mentor or advisor' },
      { key: 'lab',              desc: 'Lab offering resources' },
      { key: 'incubator',        desc: 'Startup incubation program' },
      { key: 'accelerator',      desc: 'Growth acceleration program' },
      { key: 'service_provider', desc: 'Cloud, legal, compliance services' },
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
            <h1 className="text-2xl font-bold" style={{ color: '#1a1a1a' }}>Choose your persona</h1>
            <p className="text-sm mt-2" style={{ color: '#6b7280' }}>
              Pick the role that best describes you. You can always update your profile later.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {PERSONA_PICKER_LIST.map(p => {
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
          <div className="text-center mt-8">
            <Link to="/dashboard/login" className="text-sm font-semibold" style={{ color: '#9ca3af' }}>
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#f5f5f5' }}>
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
                  background: step >= s ? '#D5AA5B' : '#e5e7eb',
                  color: step >= s ? '#fff' : '#9ca3af',
                }}>
                {step > s ? <Check size={14} /> : s}
              </div>
              {s < 3 && <div className="w-12 h-0.5" style={{ background: step > s ? '#D5AA5B' : '#e5e7eb' }} />}
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-8 mb-6">
          <span className="text-xs font-medium" style={{ color: step >= 1 ? '#D5AA5B' : '#9ca3af' }}>Account</span>
          <span className="text-xs font-medium" style={{ color: step >= 2 ? '#D5AA5B' : '#9ca3af' }}>Profile</span>
          <span className="text-xs font-medium" style={{ color: step >= 3 ? '#D5AA5B' : '#9ca3af' }}>Done</span>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-6 shadow-sm" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
          {error && (
            <div className="flex items-center gap-2 text-sm rounded-xl px-4 py-3 mb-5"
              style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
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
                  style={inputStyle} onFocus={e => e.target.style.borderColor = '#D5AA5B'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
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
                  onFocus={e => { if (!inviteToken) e.target.style.borderColor = '#D5AA5B'; }}
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
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', marginBottom: 3 }}>
                        <strong>{orgMatch.name}</strong> is already on OpenI Hub
                      </div>
                      <div style={{ fontSize: 11, color: '#666', marginBottom: 8 }}>
                        Would you like to request to join the existing organization, or create your own?
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={handleRequestJoinOrg}
                          disabled={orgJoinSubmitting}
                          style={{
                            padding: '6px 12px', background: '#D5AA5B', color: '#fff',
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
                    onFocus={e => e.target.style.borderColor = '#D5AA5B'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#9ca3af' }}>
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Confirm Password *</label>
                <input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)}
                  placeholder="Re-enter password" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#D5AA5B'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
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
                  border: `1px solid ${termsAccepted ? '#D5AA5B66' : '#e5e7eb'}`,
                  borderRadius: 10, cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={e => setTermsAccepted(e.target.checked)}
                  style={{ marginTop: 2, accentColor: '#D5AA5B', cursor: 'pointer', flexShrink: 0 }}
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
                        ? { [PERSONA_INDUSTRY_FIELD[personaType]]: prev[PERSONA_INDUSTRY_FIELD[personaType]] || orgMatch.industry }
                        : {}),
                      ...(orgMatch.description && PERSONA_HAS_DESCRIPTION[personaType]
                        ? { [PERSONA_DESCRIPTION_FIELD[personaType]]: prev[PERSONA_DESCRIPTION_FIELD[personaType]] || orgMatch.description }
                        : {}),
                    }));
                  }
                  setStep(2);
                }} disabled={!step1Valid}
                className="w-full font-semibold py-3 rounded-xl flex items-center justify-center gap-2 text-sm mt-2 transition-all"
                style={{ background: step1Valid ? '#D5AA5B' : '#e5e7eb', color: step1Valid ? '#fff' : '#9ca3af', cursor: step1Valid ? 'pointer' : 'not-allowed' }}>
                Continue <ArrowRight size={16} />
              </button>
              {!termsAccepted && (name.trim() || email.trim() || password) && (
                <p className="text-xs text-center" style={{ color: '#9ca3af', marginTop: -4 }}>
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
                   style={{ background: '#FFF8E6', border: '1px solid #D5AA5B40', color: '#7C5A1F' }}>
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
                  style={{ background: '#D5AA5B', color: '#fff' }}>
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
                <div className="mb-4 p-4 rounded-xl border" style={{ background: '#FFF8E6', borderColor: '#D5AA5B40' }}>
                  <div className="flex items-start gap-3 mb-3">
                    <Building2 size={20} style={{ color: '#D5AA5B' }} />
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
                            <p className="text-xs truncate" style={{ color: '#9ca3af' }}>{c.website} · {c.sector || 'Unknown sector'}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => submitClaim(c)}
                          disabled={claimSubmitting}
                          className="ml-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex-shrink-0"
                          style={{ background: '#D5AA5B', color: '#fff' }}>
                          {claimSubmitting ? '...' : 'Claim'}
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setClaimCandidates([])}
                    className="w-full text-xs text-center mt-3"
                    style={{ color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer' }}>
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
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: '#D5AA5B15' }}>
                  <Check size={32} style={{ color: '#D5AA5B' }} />
                </div>
                <h2 className="text-lg font-bold mb-2" style={{ color: '#1a1a1a' }}>Welcome to OpenI Hub!</h2>
                <p className="text-sm mb-6" style={{ color: '#6b7280' }}>
                  Your {persona.label.toLowerCase()} account has been created. Complete your profile to get discovered by the ecosystem.
                </p>
                <button onClick={() => navigate('/dashboard/profile')}
                  className="w-full py-3 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: '#D5AA5B', color: '#fff' }}>
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
              <Link to="/dashboard/login" className="font-semibold" style={{ color: '#D5AA5B' }}>Sign In</Link>
            </p>
            <p className="text-sm">
              <Link to="/landing" style={{ color: '#9ca3af' }}>Choose a different persona</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
