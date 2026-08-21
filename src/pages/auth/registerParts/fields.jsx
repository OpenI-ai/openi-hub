// registerParts/fields.jsx - extracted from Register.jsx (Phase 168, W5-5).
//
// The four field primitives that FormField composes: TagInput, MultiSelect,
// MoneyRangeField, LogoField. They are kept in ONE module, in original source
// order, deliberately: each block's leading comment banner sits at the TAIL of
// the previous block's slice (the Phase 60.10 banner introducing
// MoneyRangeField is lines 83-86, inside the MultiSelect slice; the Phase 60.8
// banner introducing LogoField is lines 143-147, inside the MoneyRangeField
// slice). Splitting these into separate files would file each banner under the
// wrong component, so adjacency and order are load-bearing here.
//
// None of these four is referenced by the Register page - only by FormField -
// so they are NOT re-exported from ./index.js.
//
// Every region between BODY sentinel comments is a VERBATIM slice of the
// pre-split Register.jsx at the stated line range. Do not reformat.

import { useState } from 'react';
import { X } from 'lucide-react';
import { MONEY_RANGES, TICKET_SIZE_RANGES } from '../../../config/locations';
import { publicUploadAPI } from '../../../services/api';
import { inputStyle } from './inputStyle.js';

// ---- BODY START (original lines 27-59) ----
function TagInput({ value = [], onChange, placeholder }) {
  const [input, setInput] = useState('');
  const add = () => {
    const tag = input.trim();
    if (tag && !value.includes(tag)) {
      onChange([...value, tag]);
      setInput('');
    }
  };
  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-1.5">
        {(value || []).map((t, i) => (
          <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
            style={{ background: '#D0A84815', color: '#D0A848', border: '1px solid #D0A84830' }}>
            {t}
            <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="hover:opacity-70">
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      <input
        type="text" value={input} onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
        placeholder={placeholder || 'Type and press Enter'}
        style={inputStyle}
        onFocus={e => e.target.style.borderColor = '#D0A848'}
        onBlur={e => { e.target.style.borderColor = '#e5e7eb'; add(); }}
      />
    </div>
  );
}
// ---- BODY END ----

// ---- BODY START (original lines 61-86) ----
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

// Phase 60.10 (s50) — MoneyRangeField: bracket dropdown + currency toggle.
// Stored value shape: { range: '<bracket label>', currency: 'INR' | 'USD' }.
// Two variants: 'revenue' (general money brackets) and 'ticket' (smaller ranges
// suited to investor ticket sizes). Default INR for India-first audience.
// ---- BODY END ----

// ---- BODY START (original lines 87-147) ----
function MoneyRangeField({ label, required, value, onChange, variant = 'revenue' }) {
  const ranges = variant === 'ticket' ? TICKET_SIZE_RANGES : MONEY_RANGES;
  const v = (value && typeof value === 'object') ? value : { range: '', currency: 'INR' };
  const cur = v.currency || 'INR';
  const opts = ranges[cur] || [];

  const setRange = (range) => onChange({ ...v, range, currency: cur });
  const setCur = (currency) => {
    // Reset bracket when currency changes since the labels differ between INR/USD.
    onChange({ ...v, range: '', currency });
  };

  const tabBtn = (active) => ({
    flex: 1,
    padding: '7px 10px',
    fontSize: 12,
    fontWeight: active ? 600 : 500,
    border: 'none',
    background: active ? '#fff' : 'transparent',
    color: active ? '#1a1a1a' : '#6b7280',
    borderBottom: `2px solid ${active ? '#D0A848' : 'transparent'}`,
    cursor: 'pointer',
    transition: 'all 0.15s',
  });

  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      {/* Currency toggle */}
      <div style={{
        display: 'flex',
        background: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: 10,
        marginBottom: 6,
        overflow: 'hidden',
        maxWidth: 240,
      }}>
        <button type="button" onClick={() => setCur('INR')} style={tabBtn(cur === 'INR')}>
          INR (₹)
        </button>
        <button type="button" onClick={() => setCur('USD')} style={tabBtn(cur === 'USD')}>
          USD ($)
        </button>
      </div>
      {/* Range dropdown */}
      <select value={v.range || ''} onChange={e => setRange(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
        <option value="">Select a range…</option>
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

// Phase 60.8 (s50) — LogoField: dual-mode logo input.
// User can either UPLOAD a file from their computer (preferred) or PASTE a URL.
// Uploads hit POST /api/public/logo-upload (no auth, 2MB image-only) and the
// returned Cloudinary URL replaces the value, so the parent form sees a
// normal string URL either way.
// ---- BODY END ----

// ---- BODY START (original lines 148-296) ----
function LogoField({ label, required, value, onChange, placeholder }) {
  const [mode, setMode] = useState(value ? 'url' : 'upload'); // upload | url
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file (PNG, JPG, GIF, WEBP, or SVG).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Image too large. Maximum size is 2 MB.');
      return;
    }
    setUploading(true);
    try {
      const res = await publicUploadAPI.uploadLogo(file);
      onChange(res.url);
    } catch (err) {
      setError(err.message || 'Upload failed. You can paste a URL instead.');
    } finally {
      setUploading(false);
    }
  };

  const tabBtn = (active) => ({
    flex: 1,
    padding: '8px 10px',
    fontSize: 12,
    fontWeight: active ? 600 : 500,
    border: 'none',
    background: active ? '#fff' : 'transparent',
    color: active ? '#1a1a1a' : '#6b7280',
    borderBottom: `2px solid ${active ? '#D0A848' : 'transparent'}`,
    cursor: 'pointer',
    transition: 'all 0.15s',
  });

  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>

      {/* Mode toggle */}
      <div style={{
        display: 'flex',
        background: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: 10,
        marginBottom: 8,
        overflow: 'hidden',
      }}>
        <button type="button" onClick={() => setMode('upload')} style={tabBtn(mode === 'upload')}>
          Upload from computer
        </button>
        <button type="button" onClick={() => setMode('url')} style={tabBtn(mode === 'url')}>
          Paste URL
        </button>
      </div>

      {/* Upload mode */}
      {mode === 'upload' && (
        <div>
          <label
            htmlFor={`logo-upload-${label}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 6,
              padding: '20px 16px',
              border: '2px dashed #e5e7eb',
              borderRadius: 12,
              background: '#fafafa',
              cursor: uploading ? 'wait' : 'pointer',
              transition: 'all 0.15s',
              minHeight: 100,
            }}
            onMouseEnter={e => { if (!uploading) e.currentTarget.style.borderColor = '#D0A848'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
          >
            {value ? (
              <>
                <img src={value} alt="logo preview"
                     style={{ maxHeight: 56, maxWidth: 120, objectFit: 'contain' }}
                     onError={e => { e.target.style.display = 'none'; }} />
                <span style={{ fontSize: 11, color: '#6b7280' }}>
                  {uploading ? 'Uploading…' : 'Click to replace'}
                </span>
              </>
            ) : (
              <>
                <span style={{ fontSize: 24, color: '#6e6e6e' }}>📷</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>
                  {uploading ? 'Uploading…' : 'Click to choose an image'}
                </span>
                <span style={{ fontSize: 11, color: '#6e6e6e' }}>
                  PNG, JPG, GIF, WEBP, SVG · max 2 MB
                </span>
              </>
            )}
          </label>
          <input
            id={`logo-upload-${label}`}
            type="file"
            accept="image/*"
            onChange={onFile}
            disabled={uploading}
            style={{ display: 'none' }}
          />
          {value && (
            <button
              type="button"
              onClick={() => { onChange(''); setError(''); }}
              style={{
                marginTop: 6, fontSize: 12, color: '#dc2626',
                background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
              }}
            >
              Remove logo
            </button>
          )}
        </div>
      )}

      {/* URL mode */}
      {mode === 'url' && (
        <input
          type="url"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder || 'https://yoursite.com/logo.png'}
          style={inputStyle}
          onFocus={e => e.target.style.borderColor = '#D0A848'}
          onBlur={e => e.target.style.borderColor = '#e5e7eb'}
        />
      )}

      {error && (
        <p style={{ fontSize: 12, color: '#dc2626', marginTop: 6 }}>{error}</p>
      )}
    </div>
  );
}
// ---- BODY END ----

export { TagInput, MultiSelect, MoneyRangeField, LogoField };
