/**
 * TagDropdown — extracted from CorporateChallenges.jsx (Phase 165 / W5-2).
 *
 * The body between the sentinels is a VERBATIM slice of the pre-split file,
 * original lines 24-91 of 1721. Nothing inside was reformatted or reindented.
 * Props are the exact set of parent-scope names the slice referenced — they are
 * computed from the slice, never hand-listed, so the signature cannot drift from
 * the call site. Long prop lists are deliberate: grouping them into state/actions
 * objects would force rewriting the body and destroy the verbatim property.
 */

import { useState, useEffect, useRef } from 'react';
import { CheckCircle, ChevronDown, X } from 'lucide-react';
import { G } from './constants';

// ---- BODY START (original lines 24-91) ----
// ── Searchable Multi-Select Dropdown ──────────────────────────
function TagDropdown({ label, options, selected, onChange, colorScheme = { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' } }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = options.filter(o => {
    const name = typeof o === 'string' ? o : o.name;
    return name.toLowerCase().includes(query.toLowerCase());
  });

  const toggle = (val) => {
    onChange(selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val]);
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: '#555', marginBottom: 4, display: 'block' }}>{label}</label>
      {/* Selected pills + input */}
      <div onClick={() => setOpen(true)}
        style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '6px 10px', minHeight: 38, border: `1px solid ${open ? G : '#e5e7eb'}`, borderRadius: 10, background: '#f9fafb', cursor: 'text', alignItems: 'center', transition: 'border-color 0.15s' }}>
        {selected.map(val => (
          <span key={val} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, padding: '2px 8px', borderRadius: 6, background: colorScheme.bg, color: colorScheme.color, fontWeight: 500 }}>
            {val}
            <X size={10} style={{ cursor: 'pointer', opacity: 0.7 }} onClick={e => { e.stopPropagation(); toggle(val); }} />
          </span>
        ))}
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={selected.length === 0 ? `Search ${label.toLowerCase()}...` : ''}
          style={{ flex: 1, minWidth: 80, border: 'none', background: 'transparent', fontSize: 16, padding: '2px 0' }}
        />
        <ChevronDown size={13} style={{ color: '#6e6e6e', flexShrink: 0 }} />
      </div>
      {/* Dropdown */}
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, marginTop: 4, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.10)', maxHeight: 220, overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '12px 14px', fontSize: 12, color: '#666', textAlign: 'center' }}>No matches found</div>
          ) : (
            filtered.map(o => {
              const name = typeof o === 'string' ? o : o.name;
              const sub = typeof o === 'object' && o.level > 0;
              const isSelected = selected.includes(name);
              return (
                <div key={name} onClick={() => { toggle(name); setQuery(''); }}
                  style={{ padding: '8px 14px', paddingLeft: sub ? 28 : 14, fontSize: 12, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isSelected ? colorScheme.bg : 'transparent', color: isSelected ? colorScheme.color : '#333', fontWeight: isSelected ? 600 : 400 }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#f9fafb'; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}>
                  <span>{sub ? '↳ ' : ''}{name}</span>
                  {isSelected && <CheckCircle size={12} />}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
// ---- BODY END ----

export default TagDropdown;
