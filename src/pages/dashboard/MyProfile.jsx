import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PERSONAS, PROFILE_FIELDS } from '../../config/personas';
import { profileAPI, startupProfileAPI } from '../../services/api';
import { User, Save, Loader2, AlertCircle, Check, X, Plus, Trash2, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import FileUpload from '../../components/FileUpload';
import AutoFillMyProfile from '../../components/AutoFillMyProfile';
import TaxonomySelect, { useTaxonomy } from '../../components/TaxonomySelect';
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

// ── TaxonomyTags — tag input with taxonomy autocomplete ────────
function TaxonomyTags({ taxonomy, value = [], onChange, placeholder, label }) {
  const tax = useTaxonomy();
  const items = tax?.[taxonomy] || [];
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setShowSuggestions(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const addTag = (tag) => {
    const trimmed = tag.trim();
    if (trimmed && !value.includes(trimmed)) { onChange([...value, trimmed]); }
    setInput(''); setShowSuggestions(false);
  };

  const suggestions = input.length >= 1
    ? items.filter(i => i.name.toLowerCase().includes(input.toLowerCase()) && !value.includes(i.name)).slice(0, 12)
    : [];

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>{label}</label>
      <div className="flex flex-wrap gap-1.5 mb-1.5">
        {(value || []).map((t, i) => (
          <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
            style={{ background: '#D5AA5B15', color: '#D5AA5B', border: '1px solid #D5AA5B30' }}>
            {t}
            <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))}><X size={12} /></button>
          </span>
        ))}
      </div>
      <input type="text" value={input}
        onChange={e => { setInput(e.target.value); setShowSuggestions(true); }}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(input); } }}
        onFocus={() => { if (input.length >= 1) setShowSuggestions(true); }}
        placeholder={placeholder} style={inputStyle}
        onBlur={() => { setTimeout(() => setShowSuggestions(false), 200); if (input.trim()) addTag(input); }} />
      {showSuggestions && suggestions.length > 0 && (
        <div style={{ position: 'absolute', left: 0, right: 0, zIndex: 50, marginTop: 4, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.10)', maxHeight: 200, overflowY: 'auto' }}>
          {suggestions.map(s => (
            <div key={s.id}
              onClick={() => addTag(s.name)}
              style={{ padding: '8px 14px', paddingLeft: s.level > 0 ? 24 : 14, fontSize: 12, cursor: 'pointer', color: s.level === 0 ? '#1a1a1a' : '#555', fontWeight: s.level === 0 ? 600 : 400 }}
              onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              {s.level > 0 ? '↳ ' : ''}{s.name}
            </div>
          ))}
        </div>
      )}
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
  if (FILE_UPLOAD_FIELDS[name]) {
    const cfg = FILE_UPLOAD_FIELDS[name];
    return (
      <FileUpload value={value || ''} onChange={onChange} folder={cfg.folder} accept={cfg.accept} label={label} />
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

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await profileAPI.getMyProfile();
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

  // Calculate profile completeness
  const filledCount = fields.filter(f => {
    const v = profileData[f.name];
    if (Array.isArray(v)) return v.length > 0;
    return v !== undefined && v !== null && v !== '';
  }).length;
  const completeness = fields.length ? Math.round((filledCount / fields.length) * 100) : 0;

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
          {fields.map(field => (
            <div key={field.name} className={field.type === 'textarea' || field.type === 'tags' || field.type === 'multiselect' || field.type === 'taxonomy_tags' ? 'md:col-span-2' : ''}>
              <FormField field={field} value={profileData[field.name]}
                onChange={val => updateField(field.name, val)} />
            </div>
          ))}
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

  const load = async () => {
    try { const d = await startupProfileAPI.list(section); setItems(d); }
    catch { /* silent */ }
  };

  useEffect(() => { if (expanded) load(); }, [expanded]);

  const handleAdd = async () => {
    const requiredField = fields.find(f => f.required);
    if (requiredField && !form[requiredField.name]) { toast.error(`${requiredField.label} is required`); return; }
    setLoading(true);
    try {
      await startupProfileAPI.create(section, form);
      setForm({}); setShowAdd(false); load();
      toast.success('Added');
    } catch (err) { toast.error(err.message || 'Failed to add'); }
    finally { setLoading(false); }
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
          <button onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-1 text-xs font-semibold mb-3"
            style={{ color: G, background: 'none', border: 'none', cursor: 'pointer' }}>
            <Plus size={12} /> Add {title.split(' ')[0]}
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
                      {(f.options || []).map(o => <option key={o} value={o}>{o}</option>)}
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
                <button onClick={handleAdd} disabled={loading}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold" style={{ background: G, color: '#fff', border: 'none', cursor: 'pointer' }}>
                  {loading ? 'Adding...' : 'Add'}
                </button>
                <button onClick={() => { setShowAdd(false); setForm({}); }}
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
                        <button onClick={() => handleDelete(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ddd' }}>
                          <Trash2 size={12} />
                        </button>
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
