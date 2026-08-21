// MyProfile — small field primitives (tag input, multi-select, money range).
//
// Extracted from src/pages/dashboard/MyProfile.jsx (Phase 169). Every line
// between the BODY sentinel comments is a VERBATIM slice of the pre-split
// file at the stated original line range — do not reformat or re-order.

import { useState } from 'react';
import { X } from 'lucide-react';
import { MONEY_RANGES, TICKET_SIZE_RANGES } from '../../../config/locations';
import { inputStyle } from './constants.js';

// ---- BODY START (original lines 59-83) ----
function TagInput({ value = [], onChange, placeholder, inputId }) {
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
            style={{ background: '#D0A84815', color: '#D0A848', border: '1px solid #D0A84830' }}>
            {t}
            <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))}><X size={12} /></button>
          </span>
        ))}
      </div>
      <input id={inputId} type="text" value={input} onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
        placeholder={placeholder} style={inputStyle}
        onFocus={e => e.target.style.borderColor = '#D0A848'}
        onBlur={e => { e.target.style.borderColor = '#e5e7eb'; add(); }} />
    </div>
  );
}
// ---- BODY END ----

// ---- BODY START (original lines 85-105) ----
function MultiSelect({ options = [], value = [], onChange, labelledBy }) {
  const toggle = (opt) => {
    if (value.includes(opt)) onChange(value.filter(v => v !== opt));
    else onChange([...value, opt]);
  };
  return (
    <div role="group" aria-labelledby={labelledBy} className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button type="button" key={opt} onClick={() => toggle(opt)}
          className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
          style={{
            background: value.includes(opt) ? '#D0A848' : '#f9fafb',
            color: value.includes(opt) ? '#fff' : '#555',
            border: `1px solid ${value.includes(opt) ? '#D0A848' : '#e5e7eb'}`,
          }}>
          {opt}
        </button>
      ))}
    </div>
  );
}
// ---- BODY END ----

// ---- BODY START (original lines 107-172) ----
// Phase 85d - money_range renderer extracted so currency can live in
// local useState. Fixes the USD-tab-not-selectable bug.
function MoneyRange({ field, value, onChange, label, required }) {
  // Parse incoming value once on mount to seed the local currency state.
  // Same multi-shape parser as Phase 84 for backward compatibility.
  function parseInitial(val) {
    if (val && typeof val === 'object') {
      return { range: val.range || '', currency: val.currency || 'INR' };
    }
    if (typeof val === 'string' && val) {
      const m = val.match(/^(INR|USD|EUR|GBP)\s+(.+)$/);
      if (m) return { range: m[2], currency: m[1] };
      if (val.startsWith('{')) {
        try { const o = JSON.parse(val); return { range: o.range || '', currency: o.currency || 'INR' }; }
        catch { return { range: '', currency: 'INR' }; }
      }
      return { range: val, currency: 'INR' };
    }
    return { range: '', currency: 'INR' };
  }
  const init = parseInitial(value);
  const [currency, setCurrency] = useState(init.currency);
  const ranges = field.variant === 'ticket' ? TICKET_SIZE_RANGES : MONEY_RANGES;
  const opts = ranges[currency] || [];
  // Derive the current range from the stored value re-parsed against the
  // currently-selected currency. If the user just switched currencies, the
  // stored value will not match the new currency's bracket list, so the
  // dropdown shows "Select a range...".
  const parsed = parseInitial(value);
  const currentRange = parsed.currency === currency ? parsed.range : '';
  const setRange = (range) => {
    if (!range) onChange('');
    else onChange(`${currency} ${range}`);
  };
  const switchCurrency = (next) => {
    setCurrency(next);
    // If a range was already chosen, clear it because the bracket lists
    // differ between currencies. The user picks a new range from the new list.
    if (currentRange) onChange('');
  };
  const tabBtn = (active) => ({
    flex: 1, padding: '6px 8px', fontSize: 11, fontWeight: active ? 600 : 500,
    border: 'none', background: active ? '#fff' : 'transparent',
    color: active ? '#1a1a1a' : '#6b7280',
    borderBottom: `2px solid ${active ? '#D0A848' : 'transparent'}`,
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
        <button type="button" onClick={() => switchCurrency('INR')} style={tabBtn(currency === 'INR')}>INR (₹)</button>
        <button type="button" onClick={() => switchCurrency('USD')} style={tabBtn(currency === 'USD')}>USD ($)</button>
      </div>
      <select value={currentRange} onChange={e => setRange(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
        <option value="">Select a range…</option>
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
// ---- BODY END ----

export { TagInput, MultiSelect, MoneyRange };

