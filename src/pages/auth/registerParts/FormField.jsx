// registerParts/FormField.jsx - extracted from Register.jsx (Phase 168, W5-5).
//
// FormField is the per-field renderer that dispatches on field.type (select,
// tags, taxonomy, state, city, money, logo, textarea, number, text, ...) and is
// the sole consumer of the four primitives in ./fields.jsx.
//
// coerceForField shares this module for the same adjacency reason documented in
// ./fields.jsx: its leading comment banner is lines 472-476, which sit at the
// tail of the FormField slice. It is a pure module-scope helper (that is the
// point - it never needs to be a useEffect dependency), and the page calls it
// directly, so it IS re-exported from ./index.js.
//
// Every region between BODY sentinel comments is a VERBATIM slice of the
// pre-split Register.jsx at the stated line range. Do not reformat.

import { COUNTRIES, yearOptions } from '../../../config/locations';
import { SUGGESTION_LISTS } from '../../../config/personas';
import TaxonomySelect from '../../../components/TaxonomySelect';
import TaxonomyTags from '../../../components/TaxonomyTags';
import StateField from '../../../components/StateField';
import CityField from '../../../components/CityField';
import { inputStyle } from './inputStyle.js';
import { TagInput, MultiSelect, MoneyRangeField, LogoField } from './fields.jsx';

// ---- BODY START (original lines 298-476) ----
function FormField({ field, value, onChange }) {
  const { label, type, required, options, placeholder, min, max, suggestions } = field;

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
          onFocus={e => e.target.style.borderColor = '#D0A848'}
          onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
      </div>
    );
  }
  if (type === 'checkbox') {
    return (
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={!!value} onChange={e => onChange(e.target.checked)}
          className="w-4 h-4 rounded" style={{ accentColor: '#D0A848' }} />
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
  // text, number, url, email — with optional curated <datalist> suggestions.
  // The list still accepts free text; an institution not on the list can be typed.
  const suggestionItems = suggestions ? (SUGGESTION_LISTS[suggestions] || []) : [];
  const datalistId = suggestions ? `dl-${field.name}` : undefined;
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      <input
        type={type || 'text'} value={value || ''} onChange={e => onChange(type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)}
        placeholder={placeholder || ''} min={min} max={max}
        list={datalistId}
        style={inputStyle}
        onFocus={e => e.target.style.borderColor = '#D0A848'}
        onBlur={e => e.target.style.borderColor = '#e5e7eb'}
      />
      {datalistId && (
        <datalist id={datalistId}>
          {suggestionItems.map(o => <option key={o} value={o} />)}
        </datalist>
      )}
    </div>
  );
}

// Phase 117c — coerce a prefilled value to match the target field's input type.
// orgMatch.industry / .description are strings, but some personas map "industry"
// onto a `tags`-type field (e.g. student/academia → research_areas, rendered by
// TagInput which expects an array). Wrap the string in an array for tags targets;
// leave text/textarea targets as the raw string. Module-scope (pure) so it never
// needs to be a useEffect dependency.
// ---- BODY END ----

// ---- BODY START (original lines 477-484) ----
function coerceForField(fields, fieldName, value) {
  if (value == null || value === '') return value;
  const def = (fields || []).find(f => f.name === fieldName);
  if (def?.type === 'tags') {
    return Array.isArray(value) ? value : [value];
  }
  return value;
}
// ---- BODY END ----

export { FormField, coerceForField };
