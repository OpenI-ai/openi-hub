import { Plus, Search } from 'lucide-react';
import Modal from './Modal';
import { G } from './styles';

export default function AddStartupModal({
  addLoading, addSearch, addSelected, addStartup, availableToAdd, selectedList,
  setAddSearch, setAddSelected, setShowAdd,
}) {
  return (
        <Modal title={`Add Startup to "${selectedList.name}"`} onClose={() => setShowAdd(false)}>
          {/* Phase 89.8 (T31) — search-driven discovery. Users type to find any
              startup across the 575k+ catalogue rather than picking from a
              static slice of 24. */}
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
            <input
              autoFocus
              type="text"
              value={addSearch}
              onChange={e => setAddSearch(e.target.value)}
              placeholder="Search startups by name…"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '10px 14px 10px 36px',
                background: '#fff',
                border: '1.5px solid #e0e0e0',
                borderRadius: 10,
                fontSize: 16,
                color: '#1a1a1a',
              }}
            />
          </div>
          {addSearch.trim().length < 2 ? (
            <p style={{ color: '#5c5c5c', fontSize: 13, textAlign: 'center', margin: '20px 0' }}>
              Type at least 2 characters to search.
            </p>
          ) : addLoading ? (
            <p style={{ color: '#5c5c5c', fontSize: 13, textAlign: 'center', margin: '20px 0' }}>
              Searching…
            </p>
          ) : availableToAdd.length === 0 ? (
            <p style={{ color: '#5c5c5c', fontSize: 13, textAlign: 'center', margin: '20px 0' }}>
              No matching startups found (or all matches are already in this list).
            </p>
          ) : (
            <>
              {/* Phase 104d — Select-all + selection counter */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, padding: '6px 4px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#555' }}>
                  <input
                    type="checkbox"
                    checked={availableToAdd.length > 0 && availableToAdd.every(s => addSelected.has(s.id))}
                    onChange={(e) => {
                      if (e.target.checked) setAddSelected(new Set(availableToAdd.map(s => s.id)));
                      else setAddSelected(new Set());
                    }}
                    style={{ width: 16, height: 16, cursor: 'pointer', accentColor: G }}
                  />
                  Select all visible ({availableToAdd.length})
                </label>
                <span style={{ fontSize: 11, color: '#5c5c5c' }}>
                  {addSelected.size > 0 ? `${addSelected.size} selected` : 'Click row or checkbox to select'}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 360, overflowY: 'auto' }}>
                {availableToAdd.map(s => {
                  const isChecked = addSelected.has(s.id);
                  const toggle = () => setAddSelected(prev => {
                    const next = new Set(prev);
                    if (next.has(s.id)) next.delete(s.id); else next.add(s.id);
                    return next;
                  });
                  return (
                    <div
                      key={s.id}
                      onClick={toggle}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                        background: isChecked ? 'rgba(213,170,91,0.08)' : '#fafafa',
                        borderRadius: 9,
                        border: `1px solid ${isChecked ? 'rgba(213,170,91,0.4)' : '#eee'}`,
                        cursor: 'pointer',
                        transition: 'background 0.12s, border-color 0.12s',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={toggle}
                        onClick={(e) => e.stopPropagation()}
                        style={{ width: 16, height: 16, cursor: 'pointer', accentColor: G, flexShrink: 0 }}
                      />
                      {s.logo_url ? (
                        <img
                          src={s.logo_url}
                          alt=""
                          style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'contain', background: '#fff', border: '1px solid #eee', flexShrink: 0 }}
                          onError={(e) => {
                            const fallback = document.createElement('div');
                            fallback.textContent = (s.name || '?').charAt(0).toUpperCase();
                            fallback.style.cssText = `width:32px;height:32px;border-radius:8px;background:rgba(213,170,91,0.12);color:${G};font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center;flex-shrink:0;`;
                            e.target.replaceWith(fallback);
                          }}
                        />
                      ) : (
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(213,170,91,0.12)', color: G, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{(s.name || '?').charAt(0).toUpperCase()}</div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                        <div style={{ fontSize: 11, color: '#5c5c5c' }}>{s.sector} · {s.stage}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Phase 104d — sticky footer with bulk Add */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16, paddingTop: 14, borderTop: '1px solid #eee' }}>
                <button
                  onClick={() => setShowAdd(false)}
                  style={{ padding: '9px 18px', background: '#fff', color: '#666', border: '1.5px solid #eee', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (addSelected.size === 0) return;
                    addStartup(Array.from(addSelected));
                    setShowAdd(false);
                  }}
                  disabled={addSelected.size === 0}
                  style={{
                    padding: '9px 18px', background: G, color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700,
                    cursor: addSelected.size === 0 ? 'not-allowed' : 'pointer',
                    opacity: addSelected.size === 0 ? 0.5 : 1,
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  <Plus size={13} /> Add {addSelected.size > 0 ? `${addSelected.size} ` : ''}Selected
                </button>
              </div>
            </>
          )}
        </Modal>
  );
}
