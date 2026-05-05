/**
 * StateField — Phase 60.10e (s50)
 *
 * Country-aware state/region/province dropdown.
 * - For India: uses bundled INDIAN_STATES (zero network).
 * - For any other ISO country: fetches /api/public/states?country=XX once,
 *   caches in module scope so the second time the user picks the same
 *   country in the same session it's instant.
 * - Falls back to free-text input if the country has no states or the
 *   API call fails.
 */
import { useEffect, useState } from 'react';
import { INDIAN_STATES } from '../config/locations';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Module-scope cache: countryCode -> [{ name, code }] | null (failure)
const stateCache = new Map();

async function fetchStates(country) {
  if (stateCache.has(country)) return stateCache.get(country);
  try {
    const res = await fetch(`${BASE_URL}/public/states?country=${country}`);
    if (!res.ok) throw new Error('failed');
    const data = await res.json();
    const states = (data?.states || []).map(s => s.name);
    stateCache.set(country, states);
    return states;
  } catch {
    stateCache.set(country, null);
    return null;
  }
}

export default function StateField({ value, onChange, country = 'IN', label, required, inputStyle, labelClassName }) {
  const [options, setOptions] = useState(country === 'IN' ? INDIAN_STATES : null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    if (!country || country === 'IN') {
      setOptions(INDIAN_STATES);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    fetchStates(country).then(states => {
      if (!active) return;
      setOptions(states);
      setLoading(false);
    });
    return () => { active = false; };
  }, [country]);

  const lblCls = labelClassName || 'block text-sm font-medium mb-1.5';
  const baseStyle = inputStyle || {
    backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', color: '#1a1a1a',
    width: '100%', borderRadius: 12, padding: '10px 14px', fontSize: 14, outline: 'none',
  };

  // No states for this country (or API failed) -> free-text fallback
  if (options === null || (Array.isArray(options) && options.length === 0)) {
    return (
      <div>
        <label className={lblCls} style={{ color: '#374151' }}>
          {label || 'State / Region / Province'} {required && <span style={{ color: '#ef4444' }}>*</span>}
        </label>
        <input
          type="text"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          style={baseStyle}
          placeholder="State / region / province"
          maxLength={80}
        />
      </div>
    );
  }

  return (
    <div>
      <label className={lblCls} style={{ color: '#374151' }}>
        {label || 'State'} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      <select
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        style={{ ...baseStyle, cursor: loading ? 'wait' : 'pointer' }}
        disabled={loading}
      >
        <option value="">{loading ? 'Loading…' : 'Select state…'}</option>
        {(options || []).map(s => <option key={s} value={s}>{s}</option>)}
      </select>
    </div>
  );
}
