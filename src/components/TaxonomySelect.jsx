import { useState, useEffect, useRef } from 'react';
import { ChevronDown, CheckCircle } from 'lucide-react';
import { publicAPI } from '../services/api';

// ── Taxonomy data cache (loaded once per session, shared across all callers) ──
let _taxonomyCache = null;
let _taxonomyPromise = null;
export function useTaxonomy() {
  const [data, setData] = useState(_taxonomyCache);
  useEffect(() => {
    if (_taxonomyCache) { setData(_taxonomyCache); return; }
    if (!_taxonomyPromise) {
      _taxonomyPromise = publicAPI.getTaxonomy().then(d => { _taxonomyCache = d; return d; }).catch(() => null);
    }
    _taxonomyPromise.then(d => { if (d) setData(d); });
  }, []);
  return data;
}

const DEFAULT_INPUT_STYLE = {
  backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', color: '#1a1a1a',
  width: '100%', borderRadius: 10, padding: '10px 14px', fontSize: 13,
};

const DEFAULT_LABEL_CLASS = 'block text-xs font-medium mb-1';

/**
 * TaxonomySelect — searchable dropdown for taxonomy items (sectors, industries, etc).
 *
 * Props:
 *   taxonomy   — string key into the /api/public/taxonomy response (e.g. 'sectors', 'industries')
 *   value      — currently selected name (string)
 *   onChange   — (name) => void
 *   label      — visible label
 *   required   — if true, append red asterisk
 *   inputStyle — optional style override for the trigger box (matches calling form's input style)
 *   labelClassName — optional className for the label (default: block text-xs font-medium mb-1)
 */
export default function TaxonomySelect({
  taxonomy,
  value,
  onChange,
  label,
  required,
  inputStyle = DEFAULT_INPUT_STYLE,
  labelClassName = DEFAULT_LABEL_CLASS,
}) {
  const tax = useTaxonomy();
  const items = tax?.[taxonomy] || [];
  const parents = items.filter(i => !i.parent_id);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Build flat display list: parent → children grouped
  const displayList = [];
  parents.forEach(p => {
    displayList.push({ name: p.name, level: 0 });
    items.filter(c => c.parent_id === p.id).forEach(c => {
      displayList.push({ name: c.name, level: 1 });
    });
  });

  const filtered = displayList.filter(o => o.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <label className={labelClassName} style={{ color: '#374151' }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      <div onClick={() => setOpen(true)}
        style={{ ...inputStyle, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: value ? '#1a1a1a' : '#9ca3af', fontSize: inputStyle.fontSize || 13 }}>{value || 'Select...'}</span>
        <ChevronDown size={13} style={{ color: '#6e6e6e' }} />
      </div>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, marginTop: 4, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.10)', maxHeight: 260, overflowY: 'auto' }}>
          <div style={{ padding: '6px 10px', borderBottom: '1px solid #f3f4f6' }}>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search..."
              autoFocus style={{ width: '100%', border: 'none', fontSize: 12, padding: '4px 0', background: 'transparent' }} />
          </div>
          {filtered.length === 0 ? (
            <div style={{ padding: '12px 14px', fontSize: 12, color: '#666', textAlign: 'center' }}>No matches</div>
          ) : filtered.map((o, idx) => {
            const isSelected = value === o.name;
            return (
              <div key={`${o.name}-${idx}`}
                onClick={() => { onChange(o.name); setOpen(false); setQuery(''); }}
                style={{ padding: '8px 14px', paddingLeft: o.level > 0 ? 28 : 14, fontSize: 12, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isSelected ? '#D0A84810' : 'transparent', color: isSelected ? '#D0A848' : (o.level === 0 ? '#1a1a1a' : '#555'), fontWeight: o.level === 0 ? 600 : 400 }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#f9fafb'; }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isSelected ? '#D0A84810' : 'transparent'; }}>
                <span>{o.level > 0 ? '↳ ' : ''}{o.name}</span>
                {isSelected && <CheckCircle size={12} style={{ color: '#D0A848' }} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
