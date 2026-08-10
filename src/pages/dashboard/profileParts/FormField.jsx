// MyProfile — the top-level per-field renderer.
//
// Extracted from src/pages/dashboard/MyProfile.jsx (Phase 169). Every line
// between the BODY sentinel comments is a VERBATIM slice of the pre-split
// file at the stated original line range — do not reformat or re-order.

import { COUNTRIES, yearOptions, resolveCountryCode } from '../../../config/locations';
import FileUpload from '../../../components/FileUpload';
import TaxonomySelect from '../../../components/TaxonomySelect';
import TaxonomyTags from '../../../components/TaxonomyTags';
import OrgTypeahead from '../../../components/OrgTypeahead';
import StateField from '../../../components/StateField';
import CityField from '../../../components/CityField';
import { inputStyle } from './constants.js';
import { TagInput, MultiSelect, MoneyRange } from './fields.jsx';

// ---- BODY START (original lines 174-404) ----
function FormField({ field, value, onChange }) {
  const { name, label, type, required, options, placeholder, min, max } = field;
  // Phase 92.3 hotfix — select_dependent in top-level FormField. Mirrors the
  // ProfileSection inline branch from Phase 92.1.4. Reads field.__parentValue
  // (injected by the fields.map below) and resolves options from
  // field.optionsBy[parentValue]. Auto-clears current value if no longer valid
  // for the new parent.
  if (type === 'select_dependent') {
    const parentVal = field.__parentValue;
    const opts = (field.optionsBy && field.optionsBy[parentVal]) || [];
    const currentVal = value || '';
    const isValid = opts.includes(currentVal);
    const displayVal = isValid ? currentVal : '';
    return (
      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>
          {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
        </label>
        <select value={displayVal} onChange={e => onChange(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
          {/* Title-case dependsOn for friendlier placeholder text (carry-forward fix 21 May 2026) */}
          <option value="">{parentVal ? 'Select...' : `Pick ${field.dependsOn.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} first`}</option>
          {opts.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    );
  }
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
          onFocus={e => e.target.style.borderColor = '#D0A848'}
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
          onFocus={e => e.target.style.borderColor = '#D0A848'}
          onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
      </div>
    );
  }
  if (type === 'checkbox') {
    return (
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={!!value} onChange={e => onChange(e.target.checked)}
          style={{ accentColor: '#D0A848' }} />
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
  // Phase 60.10 / Phase 84 / Phase 85d - money_range. Bracket dropdown +
  // INR/USD toggle. Storage shape is a single canonical string
  // 'INR <bracket label>' or 'USD <bracket label>' so it round-trips
  // cleanly through VARCHAR columns.
  //
  // Phase 85d fix: the previous renderer derived `cur` directly from the
  // stored value on every render. Clicking USD called setCur('USD') which
  // emitted '' (because no range was picked yet), and the next render parsed
  // '' back to the INR default — making the USD tab visually revert. Now we
  // delegate to a small sub-component that owns the currency tab state in
  // useState, so the tab survives until a range is also chosen.
  if (type === 'money_range') {
    return <MoneyRange field={field} value={value} onChange={onChange} label={label} required={required} />;
  }
  // Phase 87b/87c — org_typeahead. Component takes string[] in/out; the
  // backend resolves each chip to {name, tier_score, source} JSONB on
  // write (Phase 87c-2 dual-write hook). On read, prefer the enriched
  // _v2 column when populated, fall back to the legacy text[].
  if (type === 'org_typeahead') {
    let v = value;
    // If parent passed an array of {name,...} objects (JSONB shape from _v2),
    // flatten to a plain string array for the component. Component output is
    // always string[]; the backend re-enriches on save.
    if (Array.isArray(v) && v.length > 0 && typeof v[0] === 'object' && v[0] !== null) {
      v = v.map(x => x?.name).filter(Boolean);
    }
    return (
      <OrgTypeahead
        lookup={field.lookup}
        value={v || []}
        onChange={onChange}
        placeholder={field.placeholder}
        label={label}
        required={required}
      />
    );
  }
  return (
    <div>
      <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      <input type={type || 'text'} value={value ?? ''} onChange={e => onChange(type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)}
        placeholder={placeholder || ''} min={min} max={max} style={inputStyle}
        onFocus={e => e.target.style.borderColor = '#D0A848'}
        onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
    </div>
  );
}
// ---- BODY END ----

export default FormField;

