import { useState, useEffect, useRef } from 'react';
import { X, Star } from 'lucide-react';
import { lookupAPI } from '../services/api';

const DEFAULT_INPUT_STYLE = {
  backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', color: '#1a1a1a',
  width: '100%', borderRadius: 10, padding: '10px 14px', fontSize: 13,
};

const DEFAULT_LABEL_CLASS = 'block text-xs font-medium mb-1';

const DEBOUNCE_MS = 250;
const MIN_CHARS = 2;

/**
 * OrgTypeahead — Phase 87b (14 May 2026).
 *
 * Tag input with async typeahead sourced from one of the curated +
 * platform lookup endpoints introduced in Phase 87a:
 *   /api/lookup/investors    -> top global + Indian VCs/PEs
 *   /api/lookup/accelerators -> top accelerators + Indian incubators
 *   /api/lookup/corporates   -> top global + Indian corporates
 *
 * Suggestions show curated (tier-scored) entries first, then live
 * platform profiles. Tier-1 entries (tier_score >= 85) get a gold
 * star badge so users can see they are picking a high-signal match.
 *
 * Free-text fallback on Enter: any string the user types that does
 * not match a suggestion can still be added as a custom chip. We
 * still store the chip in the same text[] column today; Phase 87c
 * will migrate to JSONB so tier_score is persisted per chip.
 *
 * Props mirror TaxonomyTags so the FormField branch in MyProfile.jsx
 * can render OrgTypeahead with the same prop shape.
 */
export default function OrgTypeahead({
  lookup,
  value = [],
  onChange,
  placeholder,
  label,
  required,
  inputStyle = DEFAULT_INPUT_STYLE,
  labelClassName = DEFAULT_LABEL_CLASS,
}) {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);
  const debounceRef = useRef(null);
  const seqRef = useRef(0); // sequence id for race-condition guard

  // Close the dropdown when clicking outside.
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Debounced fetch as the user types.
  useEffect(() => {
    if (input.trim().length < MIN_CHARS) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const mySeq = ++seqRef.current;
      setLoading(true);
      try {
        const data = await lookupAPI.search(lookup, input.trim());
        // Race guard: only commit if no newer query has fired in the meantime.
        if (mySeq !== seqRef.current) return;
        // Filter out any suggestions whose name is already in `value`.
        const taken = new Set(value.map(v => v.toLowerCase()));
        const filtered = (data?.results || []).filter(r => !taken.has(r.name.toLowerCase()));
        setSuggestions(filtered);
      } catch {
        if (mySeq !== seqRef.current) return;
        setSuggestions([]);
      } finally {
        if (mySeq === seqRef.current) setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [input, lookup, value]);

  const addTag = (tag) => {
    const trimmed = (tag || '').trim();
    if (trimmed.length < 2) return; // mirror the Phase 76 lesson
    if (value.some(v => v.toLowerCase() === trimmed.toLowerCase())) return;
    onChange([...value, trimmed]);
    setInput('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const removeTag = (idx) => onChange(value.filter((_, j) => j !== idx));

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <label className={labelClassName} style={{ color: '#374151' }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>

      {/* Existing chips */}
      <div className="flex flex-wrap gap-1.5 mb-1.5">
        {(value || []).map((t, i) => (
          <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
            style={{ background: '#D0A84815', color: '#D0A848', border: '1px solid #D0A84830' }}>
            {t}
            <button type="button" onClick={() => removeTag(i)}><X size={12} /></button>
          </span>
        ))}
      </div>

      {/* Input */}
      <input
        type="text"
        value={input}
        onChange={e => { setInput(e.target.value); setShowSuggestions(true); }}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(input); } }}
        onFocus={() => { if (input.trim().length >= MIN_CHARS) setShowSuggestions(true); }}
        placeholder={placeholder || 'Type to search…'}
        style={inputStyle}
        onBlur={() => {
          // Same Phase 76 rule: no addTag on blur, just delay-close the dropdown.
          setTimeout(() => setShowSuggestions(false), 200);
        }}
      />

      {/* Suggestions dropdown */}
      {showSuggestions && (suggestions.length > 0 || loading) && (
        <div style={{
          position: 'absolute', left: 0, right: 0, zIndex: 50, marginTop: 4,
          background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10,
          boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
          maxHeight: 240, overflowY: 'auto',
        }}>
          {loading && (
            <div style={{ padding: '8px 14px', fontSize: 11, color: '#6e6e6e' }}>Searching…</div>
          )}
          {!loading && suggestions.map((s, i) => {
            const isTopTier = (s.tier_score || 0) >= 85;
            return (
              <div key={`${s.source}-${s.name}-${i}`}
                onMouseDown={e => e.preventDefault()}
                onClick={() => addTag(s.name)}
                style={{
                  padding: '8px 14px',
                  fontSize: 12,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  color: '#1a1a1a',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                  {isTopTier && <Star size={11} fill="#D0A848" color="#D0A848" />}
                  <span style={{ fontWeight: isTopTier ? 600 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.name}
                  </span>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6e6e6e', fontSize: 10 }}>
                  {s.type && <span>{s.type}</span>}
                  {s.country && <span>· {s.country}</span>}
                  {s.source === 'platform' && (
                    <span style={{ background: '#eef2ff', color: '#4f46e5', padding: '1px 6px', borderRadius: 6 }}>OpenI</span>
                  )}
                </span>
              </div>
            );
          })}
          {!loading && input.trim().length >= MIN_CHARS && suggestions.length === 0 && (
            <div style={{ padding: '8px 14px', fontSize: 11, color: '#6e6e6e' }}>
              No matches — press Enter to add &ldquo;{input.trim()}&rdquo; anyway
            </div>
          )}
        </div>
      )}
    </div>
  );
}
