// MyProfile — generic repeater section (team, products, funding, ...).
//
// Extracted from src/pages/dashboard/MyProfile.jsx (Phase 169). Every line
// between the BODY sentinel comments is a VERBATIM slice of the pre-split
// file at the stated original line range — do not reformat or re-order.

import { useState, useEffect } from 'react';
import { COUNTRIES } from '../../../config/locations';
import { startupProfileAPI } from '../../../services/api';
import { Plus, Trash2, ChevronDown, ChevronUp, Pencil } from 'lucide-react';
import FileUpload from '../../../components/FileUpload';
import OrgTypeahead from '../../../components/OrgTypeahead';
import toast from 'react-hot-toast';
import { normalizeOption } from './constants.js';

// ---- BODY START (original lines 935-1213) ----
// ── Generic Profile Section Component ───────────────────────
function ProfileSection({ section, title, fields, displayCols }) {
  const [items, setItems] = useState([]);
  const [expanded, setExpanded] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  // Phase 78 — when set, the form below acts as an edit form for that item id.
  const [editingId, setEditingId] = useState(null);

  const load = async () => {
    try { const d = await startupProfileAPI.list(section); setItems(d); }
    catch { /* silent */ }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional load when section expands; `load` is a stable inline closure
  useEffect(() => { if (expanded) load(); }, [expanded]);

  // Phase 78 — unified save handler. Branches on editingId: if set, PUT
  // the existing row; otherwise POST a new row. The Add button below
  // reuses the same handler so create + update share validation + UX.
  const handleSave = async () => {
    const requiredField = fields.find(f => f.required);
    if (requiredField && !form[requiredField.name]) { toast.error(`${requiredField.label} is required`); return; }
    setLoading(true);
    try {
      if (editingId) {
        await startupProfileAPI.update(section, editingId, form);
        toast.success('Updated');
      } else {
        await startupProfileAPI.create(section, form);
        toast.success('Added');
      }
      setForm({}); setShowAdd(false); setEditingId(null); load();
    } catch (err) { toast.error(err.message || 'Failed to save'); }
    finally { setLoading(false); }
  };

  // Phase 78 — pre-fill the form with an existing item's values and
  // switch the form into edit mode.
  const handleEdit = (item) => {
    const initial = {};
    for (const f of fields) {
      const raw = item[f.name];
      // Dates come as ISO timestamps from pg; coerce to YYYY-MM-DD so
      // <input type="date"> can display them (same trick as Phase 75).
      if (f.type === 'date' && raw) {
        initial[f.name] = typeof raw === 'string' ? raw.slice(0, 10) : '';
      } else if (raw !== null && raw !== undefined) {
        initial[f.name] = raw;
      }
    }
    setForm(initial);
    setEditingId(item.id);
    setShowAdd(true);
  };

  const handleCancelEdit = () => {
    setShowAdd(false);
    setForm({});
    setEditingId(null);
  };

  const handleDelete = async (id) => {
    try { await startupProfileAPI.remove(section, id); load(); toast.success('Deleted'); }
    catch { toast.error('Failed to delete'); }
  };

  const G = '#D0A848';

  return (
    // PROF7 (mobile audit) — anchor id + scroll-margin so the mobile quick-jump
    // chip strip can scrollIntoView each section without the header tucking under
    // the top of the viewport.
    <div id={`profsec-${section}`} className="rounded-xl" style={{ background: '#fff', border: '1px solid #e5e7eb', scrollMarginTop: '16px' }}>
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between p-4"
        style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
        <span className="text-sm font-bold" style={{ color: '#1a1a1a' }}>{title} {items.length > 0 && `(${items.length})`}</span>
        {expanded ? <ChevronUp size={16} style={{ color: '#666' }} /> : <ChevronDown size={16} style={{ color: '#666' }} />}
      </button>

      {expanded && (
        <div className="px-4 pb-4">
          {/* Add button */}
          <button onClick={() => {
              // Phase 78 — if closing while in edit mode, clear edit state too.
              if (showAdd) { setShowAdd(false); setForm({}); setEditingId(null); }
              else { setShowAdd(true); setEditingId(null); setForm({}); }
            }}
            className="flex items-center gap-1 text-xs font-semibold mb-3"
            style={{ color: G, background: 'none', border: 'none', cursor: 'pointer' }}>
            <Plus size={12} /> {editingId ? 'Cancel Edit' : `Add ${title.split(' ')[0]}`}
          </button>

          {/* Add form */}
          {showAdd && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 p-3 rounded-lg" style={{ background: '#f9fafb' }}>
              {fields.map(f => (
                <div key={f.name} className={f.type === 'textarea' ? 'md:col-span-2' : ''}>
                  <label className="block text-xs font-medium mb-1" style={{ color: '#555' }}>{f.label}</label>
                  {f.type === 'textarea' ? (
                    <textarea value={form[f.name] || ''} onChange={e => setForm(p => ({ ...p, [f.name]: e.target.value }))} rows={2}
                      style={{ width: '100%', padding: '6px 10px', fontSize: 16, border: '1px solid #ddd', borderRadius: 8, outline: 'none', resize: 'vertical' }} />
                  ) : f.type === 'select' ? (
                    <select value={form[f.name] || ''} onChange={e => setForm(p => ({ ...p, [f.name]: e.target.value }))}
                      style={{ width: '100%', padding: '6px 10px', fontSize: 16, border: '1px solid #ddd', borderRadius: 8, outline: 'none' }}>
                      <option value="">Select...</option>
                      {(f.options || []).map(o => {
                        const opt = normalizeOption(o);
                        return <option key={opt.value} value={opt.value}>{opt.label}</option>;
                      })}
                    </select>
                  ) : f.type === 'checkbox' ? (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={!!form[f.name]} onChange={e => setForm(p => ({ ...p, [f.name]: e.target.checked }))} style={{ accentColor: G }} />
                      <span className="text-xs" style={{ color: '#555' }}>Yes</span>
                    </label>
                  ) : f.type === 'select_dependent' ? (
                    /* Phase 92.1.4 (T18) - dependent select. Options resolved at render
                       time from f.optionsBy[parent_value]. If current value is no longer
                       valid for the new parent, auto-clear on render via the onChange path
                       (we don't mutate state during render - just show empty until next
                       interaction; saves an extra useEffect). */
                    (() => {
                      const parentVal = form[f.dependsOn];
                      const opts = (f.optionsBy && f.optionsBy[parentVal]) || [];
                      const currentVal = form[f.name] || '';
                      const isValid = opts.includes(currentVal);
                      // Show value if still valid, otherwise empty (forces user to re-pick)
                      const displayVal = isValid ? currentVal : '';
                      return (
                        <select value={displayVal} onChange={e => setForm(p => ({ ...p, [f.name]: e.target.value }))}
                          style={{ width: '100%', padding: '6px 10px', fontSize: 16, border: '1px solid #ddd', borderRadius: 8, outline: 'none' }}>
                          <option value="">{parentVal ? 'Select...' : `Pick ${f.dependsOn.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} first`}</option>
                          {opts.map(o => {
                            const opt = normalizeOption(o);
                            return <option key={opt.value} value={opt.value}>{opt.label}</option>;
                          })}
                        </select>
                      );
                    })()
                  ) : f.type === 'org_typeahead' ? (
                    /* Phase 92.1.4 (T19) - OrgTypeahead (Phase 87b component) inside
                       ProfileSection inline renderer. Single-value adapter: lead_investor
                       is a scalar VARCHAR not an array, so wrap to convert string <-> [string]
                       at the component boundary. */
                    <OrgTypeahead
                      lookup={f.lookup}
                      value={form[f.name] ? [form[f.name]] : []}
                      onChange={(arr) => {
                        // OrgTypeahead emits an array of selected names; for scalar fields
                        // we take the most recent (last) value or empty string.
                        const last = Array.isArray(arr) && arr.length > 0 ? arr[arr.length - 1] : '';
                        setForm(p => ({ ...p, [f.name]: last }));
                      }}
                      placeholder={f.placeholder || 'Start typing...'}
                      label=""
                    />
                  ) : f.type === 'logo' ? (
                    /* Phase 88 (T5) — logo upload widget inside ProfileSection.
                       Uses the same FileUpload component the top-level FormField
                       uses, wired to the 'logos' Cloudinary folder so Phase 73's
                       trim-to-white-256x256-WebP preset applies automatically. */
                    <FileUpload value={form[f.name] || ''} onChange={(val) => setForm(p => ({ ...p, [f.name]: val }))} folder="logos" accept="image/*" label="" />
                  ) : f.type === 'country' ? (
                    /* Phase 88 (T7) — country dropdown inside ProfileSection.
                       Mirrors the top-level FormField country branch so users
                       picking a competitor's country get the canonical ISO list. */
                    <select value={form[f.name] || 'IN'} onChange={e => setForm(p => ({ ...p, [f.name]: e.target.value }))}
                      style={{ width: '100%', padding: '6px 10px', fontSize: 16, border: '1px solid #ddd', borderRadius: 8, outline: 'none' }}>
                      {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                    </select>
                  ) : f.type === 'url' ? (
                    /* Phase 88 (T8) — explicit URL input. Uses native URL input
                       for better mobile keyboard + light validation. */
                    <input type="url" value={form[f.name] ?? ''} placeholder={f.placeholder || 'https://...'}
                      onChange={e => setForm(p => ({ ...p, [f.name]: e.target.value }))}
                      style={{ width: '100%', padding: '6px 10px', fontSize: 16, border: '1px solid #ddd', borderRadius: 8, outline: 'none' }} />
                  ) : (
                    <input type={f.type || 'text'} value={form[f.name] ?? ''} min={f.min} max={f.max}
                      onChange={e => {
                        const raw = e.target.value;
                        if (f.type !== 'number') {
                          setForm(p => ({ ...p, [f.name]: raw }));
                          return;
                        }
                        if (raw === '') { setForm(p => ({ ...p, [f.name]: '' })); return; }
                        let n = Number(raw);
                        if (Number.isNaN(n)) return;
                        if (typeof f.min === 'number' && n < f.min) n = f.min;
                        if (typeof f.max === 'number' && n > f.max) n = f.max;
                        setForm(p => ({ ...p, [f.name]: n }));
                      }}
                      style={{ width: '100%', padding: '6px 10px', fontSize: 16, border: '1px solid #ddd', borderRadius: 8, outline: 'none' }} />
                  )}
                </div>
              ))}
              <div className="md:col-span-2 flex gap-2">
                <button onClick={handleSave} disabled={loading}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold" style={{ background: G, color: '#fff', border: 'none', cursor: 'pointer' }}>
                  {loading ? (editingId ? 'Saving...' : 'Adding...') : (editingId ? 'Save Changes' : 'Add')}
                </button>
                <button onClick={handleCancelEdit}
                  className="px-4 py-1.5 rounded-lg text-xs" style={{ background: '#f3f4f6', color: '#666', border: 'none', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Items table */}
          {items.length === 0 ? (
            <div className="text-center py-4 text-xs" style={{ color: '#ccc' }}>No items yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>
                    {displayCols.map(col => (
                      <th key={col} style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 600, color: '#555', borderBottom: '1px solid #f0f0f0', fontSize: 11 }}>
                        {col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </th>
                    ))}
                    <th style={{ width: 40 }} />
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f8f8f8' }}>
                      {displayCols.map(col => {
                        // Phase 78b — pretty-print date + select values in the table cells.
                        const raw = item[col];
                        let cell;
                        if (raw === true) cell = 'Yes';
                        else if (raw === false) cell = 'No';
                        else if (raw == null) cell = '-';
                        else {
                          const fieldDef = fields.find(f => f.name === col);
                          if (fieldDef?.type === 'date' && typeof raw === 'string') {
                            cell = raw.slice(0, 10);
                          } else if (fieldDef?.type === 'select' && Array.isArray(fieldDef.options)) {
                            const opt = fieldDef.options.find(o => {
                              if (typeof o === 'string') return o === raw;
                              return o && o.value === raw;
                            });
                            cell = opt ? (typeof opt === 'string' ? opt : opt.label) : String(raw);
                          } else {
                            cell = String(raw).slice(0, 50);
                          }
                        }
                        return (
                          <td key={col} style={{ padding: '6px 10px', color: '#333' }}>{cell}</td>
                        );
                      })}
                      <td>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                          <button onClick={() => handleEdit(item)}
                            title="Edit"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#5c5c5c' }}
                            onMouseEnter={e => e.currentTarget.style.color = G}
                            onMouseLeave={e => e.currentTarget.style.color = '#888'}>
                            <Pencil size={12} />
                          </button>
                          <button onClick={() => handleDelete(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ddd' }}>
                          <Trash2 size={12} />
                        </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
// ---- BODY END ----

export default ProfileSection;

