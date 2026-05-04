import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PERSONAS, PROFILE_FIELDS, ORG_NAME_FIELD } from '../../config/personas';
import { claimAPI, profileAPI } from '../../services/api';
import TaxonomySelect from '../../components/TaxonomySelect';
import TaxonomyTags from '../../components/TaxonomyTags';
import {
  Shield, Eye, EyeOff, AlertCircle, Loader2, ArrowLeft, ArrowRight, Check, X, Building2,
} from 'lucide-react';

const inputStyle = {
  backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', color: '#1a1a1a',
  width: '100%', borderRadius: 12, padding: '10px 14px', fontSize: 14, outline: 'none',
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
  const profileFields = personaType ? (PROFILE_FIELDS[personaType] || []) : [];
  const orgField = personaType ? ORG_NAME_FIELD[personaType] : null;

  // Step 0: Choose persona (only when ?type= is missing)
  // Step 1: Account · Step 2: Profile · Step 3: Done
  const [step, setStep] = useState(personaType ? 1 : 0);
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
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

  const updateField = (fieldName, value) => {
    setProfileData(prev => ({ ...prev, [fieldName]: value }));
  };

  // Validation
  const step1Valid = name.trim() && email.trim() && password.length >= 6 && password === confirmPwd;

  const handleRegister = async () => {
    setError('');
    setLoading(true);
    try {
      // Org name now lives in Step 2's persona-specific field (was duplicated
      // as Step 1 "Organization Name"). Pass it through to backend as
      // organization_name for backward-compatible bootstrap.
      const orgFromProfile = orgField ? (profileData[orgField] || '').trim() : '';
      await register(name.trim(), email.trim(), password, personaType, orgFromProfile || undefined);
      // Persist Step 2 profile data (was previously collected but discarded)
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
          <div className="text-center mb-8">
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
            <Link to="/login" className="text-sm font-semibold" style={{ color: '#9ca3af' }}>
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
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3 shadow-md" style={{ background: persona.color }}>
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
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                  style={inputStyle} onFocus={e => e.target.style.borderColor = '#D5AA5B'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
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
              <button onClick={() => { setError(''); setStep(2); }} disabled={!step1Valid}
                className="w-full font-semibold py-3 rounded-xl flex items-center justify-center gap-2 text-sm mt-2 transition-all"
                style={{ background: step1Valid ? '#D5AA5B' : '#e5e7eb', color: step1Valid ? '#fff' : '#9ca3af', cursor: step1Valid ? 'pointer' : 'not-allowed' }}>
                Continue <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* Step 2: Profile Details */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm mb-2" style={{ color: '#6b7280' }}>
                Fill in your {persona.label.toLowerCase()} details. You can also complete this later from your profile page.
              </p>
              {profileFields.map(field => (
                <FormField key={field.name} field={field} value={profileData[field.name]}
                  onChange={val => updateField(field.name, val)} />
              ))}
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
              <button onClick={handleRegister} disabled={loading}
                className="w-full text-xs text-center mt-1" style={{ color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer' }}>
                Skip profile details — I'll complete later
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
