import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useTaxonomy } from './TaxonomySelect';

const DEFAULT_INPUT_STYLE = {
  backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', color: '#1a1a1a',
  width: '100%', borderRadius: 10, padding: '10px 14px', fontSize: 13, outline: 'none',
};

const DEFAULT_LABEL_CLASS = 'block text-xs font-medium mb-1';

/**
 * TaxonomyTags — tag input with autocomplete sourced from a taxonomy list.
 *
 * Used for fields like startup.technologies, startup.focus_areas,
 * corporate.innovation_areas where users pick multiple values from a
 * canonical taxonomy (with optional free-text fallback).
 *
 * Props:
 *   taxonomy        — string key into /api/public/taxonomy (e.g. 'technologies')
 *   value           — array of currently selected names
 *   onChange        — (newArray) => void
 *   placeholder     — input placeholder
 *   label           — visible label
 *   inputStyle      — optional style override for the text input
 *   labelClassName  — optional className for the label
 */
export default function TaxonomyTags({
  taxonomy,
  value = [],
  onChange,
  placeholder,
  label,
  inputStyle = DEFAULT_INPUT_STYLE,
  labelClassName = DEFAULT_LABEL_CLASS,
}) {
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
    // Phase 76 — reject sub-2-char tags. Real taxonomy values are always
    // ≥2 chars; this blocks the fat-finger Enter-on-first-letter commit
    // that was producing ['D','H','F','P'] chip fragments alongside the
    // real selections.
    if (trimmed.length >= 2 && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInput(''); setShowSuggestions(false);
  };

  const suggestions = input.length >= 1
    ? items.filter(i => i.name.toLowerCase().includes(input.toLowerCase()) && !value.includes(i.name)).slice(0, 12)
    : [];

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <label className={labelClassName} style={{ color: '#374151' }}>{label}</label>
      <div className="flex flex-wrap gap-1.5 mb-1.5">
        {(value || []).map((t, i) => (
          <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
            style={{ background: '#D0A84815', color: '#D0A848', border: '1px solid #D0A84830' }}>
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
        onBlur={() => {
          // Phase 76 — drop the addTag-on-blur. The original "if (input.trim())
          // addTag(input)" fired synchronously when the user clicked a
          // dropdown suggestion (because clicking the suggestion blurs the
          // input), beating the suggestion's own onClick handler and
          // injecting a partial-typed fragment ('D' or 'AI') as a chip
          // before the real suggestion ('DeepTech') landed. Removing this
          // means clicking away abandons partial input — the correct
          // mental model for an autocomplete with suggestions.
          setTimeout(() => setShowSuggestions(false), 200);
        }} />
      {showSuggestions && suggestions.length > 0 && (
        <div style={{ position: 'absolute', left: 0, right: 0, zIndex: 50, marginTop: 4, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.10)', maxHeight: 200, overflowY: 'auto' }}>
          {suggestions.map(s => (
            <div key={s.id}
              onMouseDown={e => e.preventDefault()}
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
