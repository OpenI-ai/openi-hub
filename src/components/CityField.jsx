/**
 * CityField — Phase 60.10e (s50)
 *
 * Country/state-aware city autocomplete.
 * - User types -> debounced 250ms -> GET /api/public/cities?country&state&q=
 * - Suggestions render in a dropdown; clicking commits the chosen city.
 * - User can also type a city name not in the suggestions; the value is
 *   accepted as free text (covers villages, new neighbourhoods, etc.)
 * - Empty search shows the top 20 cities for the selected state.
 *
 * Module-scope debounce cache keyed by country:state:q reduces network
 * round-trips when the user types and deletes the same string.
 */
import { useEffect, useRef, useState } from 'react';
// Phase 83 — accept either ISO code or long-form country name from callers.
import { resolveCountryCode } from '../config/locations';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Module-scope cache: `${country}:${state}:${q}` -> cities[]
const cityCache = new Map();
const CACHE_MAX = 200;

async function fetchCities({ country, state, q, limit = 20 }) {
  const key = `${country}:${state || ''}:${(q || '').toLowerCase()}`;
  if (cityCache.has(key)) return cityCache.get(key);
  const params = new URLSearchParams({ country, limit: String(limit) });
  if (state) params.set('state', state);
  if (q)     params.set('q', q);
  try {
    const res = await fetch(`${BASE_URL}/public/cities?${params}`);
    if (!res.ok) throw new Error('failed');
    const data = await res.json();
    const cities = data?.cities || [];
    if (cityCache.size > CACHE_MAX) {
      // Drop oldest half to bound memory
      const keys = Array.from(cityCache.keys()).slice(0, CACHE_MAX / 2);
      keys.forEach(k => cityCache.delete(k));
    }
    cityCache.set(key, cities);
    return cities;
  } catch {
    return [];
  }
}

export default function CityField({ value, onChange, country: rawCountry = 'IN', state = '', label, required, placeholder, inputStyle, labelClassName }) {
  // Phase 83 — accept either ISO code or long-form country name.
  const country = resolveCountryCode(rawCountry) || 'IN';
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);
  const wrapRef = useRef(null);

  // Sync external value changes back into the input
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Debounced fetch on query change while focused
  useEffect(() => {
    if (!open) return undefined;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const cities = await fetchCities({ country, state, q: query.trim() });
      setSuggestions(cities);
      setLoading(false);
    }, 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, country, state, open]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function onDoc(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const lblCls = labelClassName || 'block text-sm font-medium mb-1.5';
  const baseStyle = inputStyle || {
    backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', color: '#1a1a1a',
    width: '100%', borderRadius: 12, padding: '10px 14px', fontSize: 14, outline: 'none',
  };

  const pick = (c) => {
    onChange(c.name);
    setQuery(c.name);
    setOpen(false);
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <label className={lblCls} style={{ color: '#374151' }}>
        {label || 'City'} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      <input
        type="text"
        value={query}
        onChange={e => {
          const v = e.target.value;
          setQuery(v);
          onChange(v); // commit raw input as the value (free-text fallback)
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder || 'Start typing your city…'}
        style={baseStyle}
        autoComplete="off"
        maxLength={80}
      />
      {open && (suggestions.length > 0 || loading) && (
        <div
          style={{
            position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
            background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10,
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)', zIndex: 30,
            maxHeight: 240, overflowY: 'auto',
          }}
        >
          {loading && (
            <div style={{ padding: '10px 14px', fontSize: 13, color: '#9ca3af' }}>
              Searching…
            </div>
          )}
          {!loading && suggestions.map((c, i) => (
            <button
              key={`${c.name}-${c.state}-${i}`}
              type="button"
              onMouseDown={e => { e.preventDefault(); pick(c); }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '8px 14px', border: 'none', background: 'transparent',
                fontSize: 13.5, color: '#374151', cursor: 'pointer',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {c.name}
              {c.state && <span style={{ color: '#9ca3af', fontSize: 11, marginLeft: 8 }}>{c.state}</span>}
            </button>
          ))}
          {!loading && suggestions.length === 0 && query.trim() && (
            <div style={{ padding: '10px 14px', fontSize: 12, color: '#9ca3af' }}>
              No matches. Your typed value will be saved as-is.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
