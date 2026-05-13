import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PERSONAS, PROFILE_FIELDS } from '../../config/personas';
import { COUNTRIES, MONEY_RANGES, TICKET_SIZE_RANGES, yearOptions, resolveCountryCode } from '../../config/locations';
import { profileAPI, startupProfileAPI } from '../../services/api';
import { User, Save, Loader2, AlertCircle, Check, X, Plus, Trash2, ChevronDown, ChevronUp, CheckCircle, Pencil } from 'lucide-react';
import FileUpload from '../../components/FileUpload';
import AutoFillMyProfile from '../../components/AutoFillMyProfile';
import TaxonomySelect from '../../components/TaxonomySelect';
import TaxonomyTags from '../../components/TaxonomyTags';
import StateField from '../../components/StateField';
import CityField from '../../components/CityField';
import toast from 'react-hot-toast';

const inputStyle = {
  backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', color: '#1a1a1a',
  width: '100%', borderRadius: 10, padding: '10px 14px', fontSize: 13, outline: 'none',
};

function TagInput({ value = [], onChange, placeholder }) {
  const [input, setInput] = useState('');
  const add = () => {
    const tag = input.trim();
    if (tag && !value.includes(tag)) { onChange([...value, tag]); setInput(''); }
  };
  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-1.5">
        {(value || []).map((t, i) => (
          <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
            style={{ background: '#D5AA5B15', color: '#D5AA5B', border: '1px solid #D5AA5B30' }}>
            {t}
            <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))}><X size={12} /></button>
          </span>
        ))}
      </div>
      <input type="text" value={input} onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
        placeholder={placeholder} style={inputStyle}
        onFocus={e => e.target.style.borderColor = '#D5AA5B'}
        onBlur={e => { e.target.style.borderColor = '#e5e7eb'; add(); }} />
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
        <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>
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
        <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>{label}</label>
        <textarea value={value || ''} onChange={e => onChange(e.target.value)} rows={3}
          style={{ ...inputStyle, resize: 'vertical' }}
          onFocus={e => e.target.style.borderColor = '#D5AA5B'}
          onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
      </div>
    );
  }
  // Phase 75 — explicit date branch. <input type="date"> requires
  // YYYY-MM-DD; pg returns DATE columns as Date objects or ISO timestamps
  // like '2020-01-15T00:00:00.000Z' which the browser silently rejects.
  // Without this branch, dates appear blank on reload even though the DB
  // has the value, leading users to think the field didn't save.
  if (type === 'date') {
    let formatted = '';
    if (value) {
      if (typeof value === 'string') {
        formatted = value.slice(0, 10);
      } else if (value instanceof Date && !Number.isNaN(value.getTime())) {
        formatted = value.toISOString().slice(0, 10);
      }
    }
    return (
      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>
          {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
        </label>
        <input type="date" value={formatted} onChange={e => onChange(e.target.value)}
          min={min} max={max} style={inputStyle}
          onFocus={e => e.target.style.borderColor = '#D5AA5B'}
          onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
      </div>
    );
  }
  if (type === 'checkbox') {
    return (
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={!!value} onChange={e => onChange(e.target.checked)}
          style={{ accentColor: '#D5AA5B' }} />
        <span className="text-xs font-medium" style={{ color: '#374151' }}>{label}</span>
      </label>
    );
  }
  if (type === 'tags') {
    return (
      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>{label}</label>
        <TagInput value={value || []} onChange={onChange} placeholder={placeholder} />
      </div>
    );
  }
  if (type === 'multiselect') {
    return (
      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>{label}</label>
        <MultiSelect options={options || []} value={value || []} onChange={onChange} />
      </div>
    );
  }
  if (type === 'taxonomy_select') {
    return <TaxonomySelect taxonomy={field.taxonomy} value={value} onChange={onChange} label={label} required={required} />;
  }
  if (type === 'taxonomy_tags') {
    return <TaxonomyTags taxonomy={field.taxonomy} value={value || []} onChange={onChange} placeholder={placeholder} label={label} />;
  }
  // File upload fields: logo, pitch deck, portfolio, resume
  const FILE_UPLOAD_FIELDS = {
    logo_url:       { folder: 'logos',       accept: 'image/*' },
    pitch_deck_url: { folder: 'pitch_decks', accept: '.pdf,.ppt,.pptx' },
    portfolio_url:  { folder: 'portfolios',  accept: '.pdf,.doc,.docx' },
    resume_url:     { folder: 'resumes',     accept: '.pdf,.doc,.docx' },
  };
  if (FILE_UPLOAD_FIELDS[name] || type === 'logo') {
    const cfg = FILE_UPLOAD_FIELDS[name] || { folder: 'logos', accept: 'image/*' };
    return (
      <FileUpload value={value || ''} onChange={onChange} folder={cfg.folder} accept={cfg.accept} label={label} />
    );
  }
  // Phase 60.10 (s50): country select. Default India, full ISO list.
  if (type === 'country') {
    // Phase 83 — handle both 'IN' (ISO code) and 'India' (long-form) shapes
    // in stored data. Normalise to code for the <select> binding.
    const resolved = resolveCountryCode(value) || 'IN';
    return (
      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>
          {label || 'Country'} {required && <span style={{ color: '#ef4444' }}>*</span>}
        </label>
        <select value={resolved} onChange={e => onChange(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
          {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
        </select>
      </div>
    );
  }
  // Phase 60.10e (s50) — state via shared StateField component.
  if (type === 'state') {
    return (
      <StateField
        value={value}
        onChange={onChange}
        country={field.country || 'IN'}
        label={label}
        required={required}
        inputStyle={inputStyle}
        labelClassName="block text-xs font-medium mb-1"
      />
    );
  }
  // Phase 60.10e (s50) — city via shared CityField component (debounced autocomplete).
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
        labelClassName="block text-xs font-medium mb-1"
      />
    );
  }
  // Phase 60.10 — year select. Forward-fill 1970..currentYear.
  if (type === 'year') {
    const opts = yearOptions(field.min || 1970);
    return (
      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>
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
  // Phase 60.10 / Phase 84 - money_range. Bracket dropdown + INR/USD toggle.
  // Phase 84: storage shape canonicalised to a single string
  // 'INR <bracket label>' or 'USD <bracket label>' so it round-trips
  // cleanly through VARCHAR columns (the legacy {range, currency} object
  // shape got JSON-stringified by pg and silently broke on read).
  if (type === 'money_range') {
    const ranges = field.variant === 'ticket' ? TICKET_SIZE_RANGES : MONEY_RANGES;
    // Parse the stored value. Accepts:
    //   - new canonical text 'INR ₹1 Cr - ₹10 Cr'
    //   - legacy {range, currency} JS object
    //   - legacy JSON string '{"range":"...","currency":"INR"}'
    //   - bare bracket text without currency prefix
    let v = { range: '', currency: 'INR' };
    if (value && typeof value === 'object') {
      v = { range: value.range || '', currency: value.currency || 'INR' };
    } else if (typeof value === 'string' && value) {
      const m = value.match(/^(INR|USD|EUR|GBP)\s+(.+)$/);
      if (m) {
        v = { range: m[2], currency: m[1] };
      } else if (value.startsWith('{')) {
        try { const o = JSON.parse(value); v = { range: o.range || '', currency: o.currency || 'INR' }; }
        catch { v = { range: '', currency: 'INR' }; }
      } else {
        v = { range: value, currency: 'INR' };
      }
    }
    const cur = v.currency || 'INR';
    const opts = ranges[cur] || [];
    const emit = (next) => {
      if (!next.range) onChange('');
      else onChange(`${next.currency || 'INR'} ${next.range}`);
    };
    const setRange = (range) => emit({ range, currency: cur });
    const setCur = (currency) => emit({ range: '', currency });
    const tabBtn = (active) => ({
      flex: 1, padding: '6px 8px', fontSize: 11, fontWeight: active ? 600 : 500,
      border: 'none', background: active ? '#fff' : 'transparent',
      color: active ? '#1a1a1a' : '#6b7280',
      borderBottom: `2px solid ${active ? '#D5AA5B' : 'transparent'}`,
      cursor: 'pointer', transition: 'all 0.15s',
    });
    return (
      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>
          {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
        </label>
        <div style={{
          display: 'flex', background: '#f9fafb', border: '1px solid #e5e7eb',
          borderRadius: 8, marginBottom: 6, overflow: 'hidden', maxWidth: 200,
        }}>
          <button type="button" onClick={() => setCur('INR')} style={tabBtn(cur === 'INR')}>INR (₹)</button>
          <button type="button" onClick={() => setCur('USD')} style={tabBtn(cur === 'USD')}>USD ($)</button>
        </div>
        <select value={v.range || ''} onChange={e => setRange(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="">Select a range…</option>
          {opts.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    );
  }
  return (
    <div>
      <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      <input type={type || 'text'} value={value ?? ''} onChange={e => onChange(type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)}
        placeholder={placeholder || ''} min={min} max={max} style={inputStyle}
        onFocus={e => e.target.style.borderColor = '#D5AA5B'}
        onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
    </div>
  );
}

export default function MyProfile() {
  const { user, updateUser } = useAuth();
  const persona = PERSONAS[user?.role];
  const fields = PROFILE_FIELDS[user?.role] || [];

  const [profileData, setProfileData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // Auto-trigger auto-fill when arriving from registration: /dashboard/profile?autofill=1
  const autoStart = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('autofill') === '1';
  // Phase 65d (8 May): VerifyEmail.jsx redirects post-verify to
  // /dashboard/profile?fresh=1 so we know the row was just-now written by
  // flushPendingProfile. If the first GET returns an emptier-looking row
  // than the stash had, retry once with a short delay so the post-PUT
  // search-vector / profile-score recompute has settled.
  const isPostVerifyFresh = typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('fresh') === '1';

  useEffect(() => {
    loadProfile();
    // After first load on a post-verify fresh redirect, strip the query so
    // a hard refresh by the user does NOT re-trigger the retry behaviour.
    if (isPostVerifyFresh && typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('fresh');
      window.history.replaceState({}, '', url.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Phase 60.10 (s50) — retry path for the Step 2 stash. If VerifyEmail.jsx's
  // flushPendingProfile failed (e.g. token race, transient 500), the stash
  // stays in localStorage. On every MyProfile mount we retry the PUT and
  // remove the stash on success. Empty stash + clean clear on parse error.
  async function retryPendingStash() {
    try {
      const raw = localStorage.getItem('openi_pending_profile')
               || sessionStorage.getItem('openi_pending_profile');
      if (!raw) return false;
      const data = JSON.parse(raw);
      const hasData = Object.values(data || {}).some(v =>
        Array.isArray(v) ? v.length > 0 : (v !== '' && v !== null && v !== undefined)
      );
      if (!hasData) {
        localStorage.removeItem('openi_pending_profile');
        sessionStorage.removeItem('openi_pending_profile');
        return false;
      }
      await profileAPI.updateMyProfile(data);
      localStorage.removeItem('openi_pending_profile');
      sessionStorage.removeItem('openi_pending_profile');
      toast.success('Welcome! We finished saving your registration details.');
      return true;
    } catch (err) {
      console.warn('[my-profile] pending-stash retry failed:', err?.message || err);
      return false;
    }
  }

  // Phase 65d helper — on a post-verify fresh mount, the first GET may race
  // with the search_vector rebuild / profile_score recompute that fires
  // after PUT /profile/me. We treat any plain-text-only row with most
  // persona fields blank as "looks empty" and retry once.
  function looksEmpty(profile) {
    if (!profile) return true;
    // Count persona-relevant non-empty fields beyond the registration defaults.
    const skip = new Set(['id','user_id','created_at','updated_at','search_vector','embedding']);
    let populated = 0;
    for (const [k, v] of Object.entries(profile)) {
      if (skip.has(k)) continue;
      if (v === null || v === undefined || v === '') continue;
      if (Array.isArray(v) && v.length === 0) continue;
      populated++;
    }
    return populated < 3;
  }

  const loadProfile = async () => {
    try {
      // Try to flush any leftover registration stash first so the GET below
      // returns the fully-populated profile instead of a half-empty one.
      const flushed = await retryPendingStash();

      let data = await profileAPI.getMyProfile();

      // Phase 65d: post-verify fresh-load retry. If we're arriving via
      // /dashboard/profile?fresh=1, the row was just written by
      // flushPendingProfile() in VerifyEmail.jsx — but the GET can race
      // with the post-PUT cleanup. Retry once after 500ms if the first
      // response looks empty.
      if ((isPostVerifyFresh || flushed) && looksEmpty(data?.profile)) {
        await new Promise(r => setTimeout(r, 500));
        try {
          const retry = await profileAPI.getMyProfile();
          if (retry?.profile && !looksEmpty(retry.profile)) data = retry;
        } catch { /* fall through with original data */ }
      }

      if (data.profile) {
        setProfileData(data.profile);
      }
    } catch (err) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Only send fields that have values
      const payload = {};
      for (const field of fields) {
        const val = profileData[field.name];
        if (val !== undefined && val !== null && val !== '') {
          payload[field.name] = val;
        }
      }
      const data = await profileAPI.updateMyProfile(payload);
      setProfileData(data.profile);
      updateUser({ profile_completed: true });
      toast.success('Profile saved successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (fieldName, value) => {
    setProfileData(prev => ({ ...prev, [fieldName]: value }));
  };

  // Phase 79 — sub-section presence tracking. For the startup persona, the
  // 8 child-table repeaters (Team / Products / Funding / Clients / Patents /
  // Competitors / News / Acquisitions) contribute up to 20pts to the
  // completeness bar; top-level fields contribute up to 80pts. Backend
  // profileScoreService.js uses the same weights so the bar matches
  // directory_profiles.profile_score.
  const [sectionPresence, setSectionPresence] = useState({});
  const SUBSECTION_WEIGHTS = {
    team:          3,
    products:      3,
    funding:       3,
    clients:       2,
    patents:       3,
    competitors:   2,
    news:          2,
    acquisitions:  2,
  };
  const SUBSECTION_TOTAL = Object.values(SUBSECTION_WEIGHTS).reduce((a, b) => a + b, 0); // 20

  useEffect(() => {
    if (user?.role !== 'startup') return;
    let cancelled = false;
    (async () => {
      const sections = Object.keys(SUBSECTION_WEIGHTS);
      const results = await Promise.all(
        sections.map(s => startupProfileAPI.list(s).then(r => Array.isArray(r) && r.length > 0).catch(() => false))
      );
      if (cancelled) return;
      const presence = {};
      sections.forEach((s, i) => { presence[s] = results[i]; });
      setSectionPresence(presence);
    })();
    return () => { cancelled = true; };
  }, [user?.role]);

  // Phase 79 — completeness for startup uses 80/20 split; other personas
  // unchanged (top-level fields only, 100% scale).
  let completeness;
  if (user?.role === 'startup') {
    // top-level out of 80
    const filledTopLevel = fields.filter(f => {
      const v = profileData[f.name];
      if (Array.isArray(v)) return v.length > 0;
      return v !== undefined && v !== null && v !== '';
    }).length;
    const topLevelMax = fields.length || 1;
    const topLevelPts = Math.round((filledTopLevel / topLevelMax) * 80);
    let subPts = 0;
    for (const [section, weight] of Object.entries(SUBSECTION_WEIGHTS)) {
      if (sectionPresence[section]) subPts += weight;
    }
    completeness = Math.min(100, topLevelPts + subPts);
  } else {
    const filledCount = fields.filter(f => {
      const v = profileData[f.name];
      if (Array.isArray(v)) return v.length > 0;
      return v !== undefined && v !== null && v !== '';
    }).length;
    completeness = fields.length ? Math.round((filledCount / fields.length) * 100) : 0;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin" style={{ color: '#D5AA5B' }} />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: 800, margin: '0 auto' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: persona?.color ? `${persona.color}15` : '#D5AA5B15' }}>
            <User size={20} style={{ color: persona?.color || '#D5AA5B' }} />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: '#1a1a1a' }}>My Profile</h1>
            <p className="text-xs" style={{ color: '#6b7280' }}>
              {persona?.label || user?.role} Profile
            </p>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
          style={{ background: '#D5AA5B', color: '#fff' }}
          onMouseEnter={e => e.currentTarget.style.background = '#c49a4a'}
          onMouseLeave={e => e.currentTarget.style.background = '#D5AA5B'}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>

      {/* Completeness bar */}
      <div className="rounded-xl p-4 mb-6" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium" style={{ color: '#374151' }}>Profile Completeness</span>
          <span className="text-xs font-bold" style={{ color: completeness === 100 ? '#16a34a' : '#D5AA5B' }}>
            {completeness}%
          </span>
        </div>
        <div className="w-full h-2 rounded-full" style={{ background: '#f3f4f6' }}>
          <div className="h-2 rounded-full transition-all" style={{
            width: `${completeness}%`,
            background: completeness === 100 ? '#16a34a' : '#D5AA5B',
          }} />
        </div>
        {completeness < 100 && (
          <p className="text-xs mt-2" style={{ color: '#9ca3af' }}>
            Complete your profile to get discovered by the ecosystem.
          </p>
        )}
      </div>

      {/* Phase 38: Self-service auto-fill — startups only. autoStart triggered after registration. */}
      {user?.role === 'startup' && !loading && (
        <AutoFillMyProfile currentProfile={profileData} onApplied={loadProfile} autoStart={autoStart} />
      )}

      {/* Profile form */}
      <div className="rounded-xl p-6" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map(field => {
            // Phase 60.10e (s50): inject form-level country into state field, and
            // both country + state into city field, so the autocomplete components
            // can scope their fetches correctly.
            let dependentField = field;
            if (field.type === 'state') {
              // Phase 83 — legacy rows may store the long-form country name
              // ('India'). Normalise to ISO code so StateField shows the dropdown.
              dependentField = { ...field, country: resolveCountryCode(profileData.country) || 'IN' };
            } else if (field.type === 'city') {
              dependentField = { ...field, country: resolveCountryCode(profileData.country) || 'IN', state: profileData.state || '' };
            }
            return (
              <div key={field.name} className={field.type === 'textarea' || field.type === 'tags' || field.type === 'multiselect' || field.type === 'taxonomy_tags' ? 'md:col-span-2' : ''}>
                <FormField field={dependentField} value={profileData[field.name]}
                  onChange={val => updateField(field.name, val)} />
              </div>
            );
          })}
        </div>

        {/* Bottom save */}
        <div className="flex justify-end mt-6 pt-4" style={{ borderTop: '1px solid #f3f4f6' }}>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all"
            style={{ background: '#D5AA5B', color: '#fff' }}
            onMouseEnter={e => e.currentTarget.style.background = '#c49a4a'}
            onMouseLeave={e => e.currentTarget.style.background = '#D5AA5B'}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>

      {/* ── Startup Profile Sections (child tables) ─────────────── */}
      {user?.role === 'startup' && (
        <div className="mt-6 space-y-4">
          <ProfileSection section="team" title="Team & Management" fields={[
            { name: 'name', label: 'Name', required: true },
            { name: 'designation', label: 'Designation' },
            { name: 'role', label: 'Role (CEO, CTO, etc.)' },
            { name: 'bio', label: 'Bio', type: 'textarea' },
            { name: 'linkedin_url', label: 'LinkedIn URL' },
            { name: 'twitter_url', label: 'X (Twitter) URL' },
            { name: 'is_founder', label: 'Founder?', type: 'checkbox' },
            { name: 'is_advisory', label: 'Advisory Board?', type: 'checkbox' },
          ]} displayCols={['name','designation','role','is_founder']} />

          <ProfileSection section="products" title="Products & Services" fields={[
            { name: 'name', label: 'Product Name', required: true },
            { name: 'description', label: 'Description', type: 'textarea' },
            { name: 'launch_date', label: 'Launch Date', type: 'date' },
            { name: 'pricing_model', label: 'Pricing Model' },
            { name: 'url', label: 'Product URL' },
          ]} displayCols={['name','pricing_model','launch_date']} />

          <ProfileSection section="funding" title="Funding Rounds" fields={[
            { name: 'round_type', label: 'Round Type', required: true, type: 'select', options: ['Pre-seed','Seed','Angel','Series A','Series B','Series C','Series D','Debt','Grant','Bridge'] },
            { name: 'amount', label: 'Amount', type: 'number' },
            { name: 'currency', label: 'Currency', type: 'select', options: ['INR','USD','EUR','GBP'] },
            { name: 'round_date', label: 'Date', type: 'date' },
            { name: 'lead_investor', label: 'Lead Investor' },
            { name: 'valuation_at_round', label: 'Valuation at Round', type: 'number' },
          ]} displayCols={['round_type','amount','currency','lead_investor','round_date']} />

          <ProfileSection section="clients" title="Clients / Customers" fields={[
            { name: 'client_name', label: 'Client Name', required: true },
            { name: 'industry', label: 'Industry' },
            { name: 'logo_url', label: 'Logo URL' },
          ]} displayCols={['client_name','industry']} />

          <ProfileSection section="patents" title="Patents / IP" fields={[
            { name: 'title', label: 'Patent Title', required: true },
            { name: 'status', label: 'Status', type: 'select', options: ['Applied','Granted','Pending'] },
            { name: 'patent_number', label: 'Patent Number' },
            { name: 'filing_date', label: 'Filing Date', type: 'date' },
            { name: 'abstract', label: 'Abstract', type: 'textarea' },
            { name: 'url', label: 'URL' },
          ]} displayCols={['title','status','patent_number','filing_date']} />

          <ProfileSection section="competitors" title="Competitors" fields={[
            { name: 'competitor_name', label: 'Competitor Name', required: true },
            { name: 'description', label: 'Description', type: 'textarea' },
            { name: 'country', label: 'Country' },
            { name: 'sector', label: 'Sector' },
            { name: 'website', label: 'Website' },
          ]} displayCols={['competitor_name','country','sector']} />

          <ProfileSection section="news" title="Latest News" fields={[
            { name: 'title', label: 'Title', required: true },
            { name: 'url', label: 'URL' },
            { name: 'published_date', label: 'Date', type: 'date' },
            { name: 'source', label: 'Source' },
          ]} displayCols={['title','source','published_date']} />

          <ProfileSection section="acquisitions" title="Acquisitions" fields={[
            { name: 'acquired_company', label: 'Acquired Company', required: true },
            { name: 'acquisition_date', label: 'Date', type: 'date' },
            { name: 'amount', label: 'Amount', type: 'number' },
            { name: 'currency', label: 'Currency', type: 'select', options: ['INR','USD','EUR'] },
          ]} displayCols={['acquired_company','acquisition_date','amount']} />
        </div>
      )}
    </div>
  );
}

// ── Generic Profile Section Component ───────────────────────
function ProfileSection({ section, title, fields, displayCols }) {
  const [items, setItems] = useState([]);
  const [expanded, setExpanded] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  // Phase 78 — when set, the form below acts as an edit form for that item id.
  const [editingId, setEditingId] = useState(null);

  const load = async () => {
    try { const d = await startupProfileAPI.list(section); setItems(d); }
    catch { /* silent */ }
  };

  useEffect(() => { if (expanded) load(); }, [expanded]);

  // Phase 78 — unified save handler. Branches on editingId: if set, PUT
  // the existing row; otherwise POST a new row. The Add button below
  // reuses the same handler so create + update share validation + UX.
  const handleSave = async () => {
    const requiredField = fields.find(f => f.required);
    if (requiredField && !form[requiredField.name]) { toast.error(`${requiredField.label} is required`); return; }
    setLoading(true);
    try {
      if (editingId) {
        await startupProfileAPI.update(section, editingId, form);
        toast.success('Updated');
      } else {
        await startupProfileAPI.create(section, form);
        toast.success('Added');
      }
      setForm({}); setShowAdd(false); setEditingId(null); load();
    } catch (err) { toast.error(err.message || 'Failed to save'); }
    finally { setLoading(false); }
  };

  // Phase 78 — pre-fill the form with an existing item's values and
  // switch the form into edit mode.
  const handleEdit = (item) => {
    const initial = {};
    for (const f of fields) {
      const raw = item[f.name];
      // Dates come as ISO timestamps from pg; coerce to YYYY-MM-DD so
      // <input type="date"> can display them (same trick as Phase 75).
      if (f.type === 'date' && raw) {
        initial[f.name] = typeof raw === 'string' ? raw.slice(0, 10) : '';
      } else if (raw !== null && raw !== undefined) {
        initial[f.name] = raw;
      }
    }
    setForm(initial);
    setEditingId(item.id);
    setShowAdd(true);
  };

  const handleCancelEdit = () => {
    setShowAdd(false);
    setForm({});
    setEditingId(null);
  };

  const handleDelete = async (id) => {
    try { await startupProfileAPI.remove(section, id); load(); toast.success('Deleted'); }
    catch { toast.error('Failed to delete'); }
  };

  const G = '#D5AA5B';

  return (
    <div className="rounded-xl" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between p-4"
        style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
        <span className="text-sm font-bold" style={{ color: '#1a1a1a' }}>{title} {items.length > 0 && `(${items.length})`}</span>
        {expanded ? <ChevronUp size={16} style={{ color: '#999' }} /> : <ChevronDown size={16} style={{ color: '#999' }} />}
      </button>

      {expanded && (
        <div className="px-4 pb-4">
          {/* Add button */}
          <button onClick={() => {
              // Phase 78 — if closing while in edit mode, clear edit state too.
              if (showAdd) { setShowAdd(false); setForm({}); setEditingId(null); }
              else { setShowAdd(true); setEditingId(null); setForm({}); }
            }}
            className="flex items-center gap-1 text-xs font-semibold mb-3"
            style={{ color: G, background: 'none', border: 'none', cursor: 'pointer' }}>
            <Plus size={12} /> {editingId ? 'Cancel Edit' : `Add ${title.split(' ')[0]}`}
          </button>

          {/* Add form */}
          {showAdd && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 p-3 rounded-lg" style={{ background: '#f9fafb' }}>
              {fields.map(f => (
                <div key={f.name} className={f.type === 'textarea' ? 'md:col-span-2' : ''}>
                  <label className="block text-xs font-medium mb-1" style={{ color: '#555' }}>{f.label}</label>
                  {f.type === 'textarea' ? (
                    <textarea value={form[f.name] || ''} onChange={e => setForm(p => ({ ...p, [f.name]: e.target.value }))} rows={2}
                      style={{ width: '100%', padding: '6px 10px', fontSize: 12, border: '1px solid #ddd', borderRadius: 8, outline: 'none', resize: 'vertical' }} />
                  ) : f.type === 'select' ? (
                    <select value={form[f.name] || ''} onChange={e => setForm(p => ({ ...p, [f.name]: e.target.value }))}
                      style={{ width: '100%', padding: '6px 10px', fontSize: 12, border: '1px solid #ddd', borderRadius: 8, outline: 'none' }}>
                      <option value="">Select...</option>
                      {(f.options || []).map(o => {
                        const opt = normalizeOption(o);
                        return <option key={opt.value} value={opt.value}>{opt.label}</option>;
                      })}
                    </select>
                  ) : f.type === 'checkbox' ? (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={!!form[f.name]} onChange={e => setForm(p => ({ ...p, [f.name]: e.target.checked }))} style={{ accentColor: G }} />
                      <span className="text-xs" style={{ color: '#555' }}>Yes</span>
                    </label>
                  ) : (
                    <input type={f.type || 'text'} value={form[f.name] || ''} onChange={e => setForm(p => ({ ...p, [f.name]: f.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value }))}
                      style={{ width: '100%', padding: '6px 10px', fontSize: 12, border: '1px solid #ddd', borderRadius: 8, outline: 'none' }} />
                  )}
                </div>
              ))}
              <div className="md:col-span-2 flex gap-2">
                <button onClick={handleSave} disabled={loading}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold" style={{ background: G, color: '#fff', border: 'none', cursor: 'pointer' }}>
                  {loading ? (editingId ? 'Saving...' : 'Adding...') : (editingId ? 'Save Changes' : 'Add')}
                </button>
                <button onClick={handleCancelEdit}
                  className="px-4 py-1.5 rounded-lg text-xs" style={{ background: '#f3f4f6', color: '#666', border: 'none', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Items table */}
          {items.length === 0 ? (
            <div className="text-center py-4 text-xs" style={{ color: '#ccc' }}>No items yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>
                    {displayCols.map(col => (
                      <th key={col} style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 600, color: '#555', borderBottom: '1px solid #f0f0f0', fontSize: 11 }}>
                        {col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </th>
                    ))}
                    <th style={{ width: 40 }} />
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f8f8f8' }}>
                      {displayCols.map(col => (
                        <td key={col} style={{ padding: '6px 10px', color: '#333' }}>
                          {item[col] === true ? 'Yes' : item[col] === false ? 'No' : (item[col] != null ? String(item[col]).slice(0, 50) : '-')}
                        </td>
                      ))}
                      <td>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                          <button onClick={() => handleEdit(item)}
                            title="Edit"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#888' }}
                            onMouseEnter={e => e.currentTarget.style.color = G}
                            onMouseLeave={e => e.currentTarget.style.color = '#888'}>
                            <Pencil size={12} />
                          </button>
                          <button onClick={() => handleDelete(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ddd' }}>
                          <Trash2 size={12} />
                        </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
