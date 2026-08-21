import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { partnerAPI } from '../services/api';
import { Key, Plus, Copy, Trash2, Loader2, X, ShieldAlert } from 'lucide-react';

const G = '#D0A848';

const card = {
  background: '#ffffff',
  border: '1px solid #eeeeee',
  borderRadius: 14,
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
};

// Self-serve Partner API key management — lives inside Settings' "API Keys" tab
// (Enterprise-only, gated by the parent tab on plan.features.api_access).
// Backend: POST/GET /api/partner-api/keys, DELETE /api/partner-api/keys/:id
// (partnerApiKeyController.js). The plaintext key is only ever returned once,
// on creation — we show it in a copyable field and never persist or re-display
// it after the modal closes.
export default function SettingsAPIKeys() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState(null); // { key, prefix, name } — shown once

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await partnerAPI.listKeys();
      setKeys(data?.keys || data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load API keys');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setNewKeyName(''); setCreatedKey(null); setCreateOpen(true); };
  const closeCreate = () => { setCreateOpen(false); setNewKeyName(''); setCreatedKey(null); };

  const handleCreate = async (e) => {
    e.preventDefault();
    const name = newKeyName.trim();
    if (!name) { toast.error('Please enter a name for this key'); return; }

    setBusy(true);
    try {
      const result = await partnerAPI.createKey(name);
      setCreatedKey({ key: result.key || result.apiKey, prefix: result.key_prefix || result.prefix, name });
      await load();
    } catch (err) {
      toast.error(err.message || 'Failed to create API key');
    } finally {
      setBusy(false);
    }
  };

  const handleRevoke = async (id, name) => {
    if (!confirm(`Revoke API key "${name}"? Any integrations using it will stop working immediately. This cannot be undone.`)) return;

    setBusy(true);
    try {
      await partnerAPI.deleteKey(id);
      toast.success('API key revoked');
      await load();
    } catch (err) {
      toast.error(err.message || 'Failed to revoke API key');
    } finally {
      setBusy(false);
    }
  };

  const copyKey = () => {
    if (!createdKey?.key) return;
    navigator.clipboard.writeText(createdKey.key);
    toast.success('Copied to clipboard');
  };

  return (
    <div style={{ ...card, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Key size={18} style={{ color: G }} />
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>Partner API Keys</h2>
        </div>
        <button
          onClick={openCreate}
          disabled={busy}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8,
            fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
            background: G, color: '#fff', opacity: busy ? 0.6 : 1,
          }}
        >
          <Plus size={14} /> New Key
        </button>
      </div>

      <p style={{ margin: '0 0 20px', fontSize: 12.5, color: '#5c5c5c' }}>
        API keys grant full read/write access to your challenges and applications via the Partner API.
        Keep them secret — anyone with a key can act on your account.
      </p>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <Loader2 size={24} className="animate-spin" style={{ color: G }} />
        </div>
      ) : keys.length === 0 ? (
        <p style={{ fontSize: 13, color: '#666', textAlign: 'center', padding: '20px 0' }}>
          No API keys yet. Create one to start using the Partner API.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {keys.map((k) => (
            <div
              key={k.id}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 14px', border: '1px solid #f0f0f0', borderRadius: 10,
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: '#1a1a1a' }}>{k.name}</span>
                  <span
                    style={{
                      fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                      background: '#e8f5ee', color: '#1e8a52',
                    }}
                  >
                    Active
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#666', marginTop: 3, fontFamily: 'monospace' }}>
                  {k.key_prefix}…
                </div>
                <div style={{ fontSize: 11, color: '#bbb', marginTop: 2 }}>
                  Created {k.created_at ? new Date(k.created_at).toLocaleDateString() : '—'}
                  {' · '}
                  Last used {k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : 'never'}
                </div>
              </div>
              <button
                onClick={() => handleRevoke(k.id, k.name)}
                disabled={busy}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 7,
                  fontSize: 12, fontWeight: 600, border: '1px solid #f0d0d0', cursor: 'pointer',
                  background: '#fff', color: '#c0392b', opacity: busy ? 0.6 : 1,
                }}
              >
                <Trash2 size={13} /> Revoke
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create key modal */}
      {createOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center',
            justifyContent: 'center', background: 'rgba(0,0,0,0.4)', padding: 16,
          }}
          onClick={closeCreate}
        >
          <div
            style={{ ...card, width: '100%', maxWidth: 420, padding: 22 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>
                {createdKey ? 'API key created' : 'Create a new API key'}
              </h3>
              <button onClick={closeCreate} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', padding: 2 }}>
                <X size={16} />
              </button>
            </div>

            {!createdKey ? (
              <form onSubmit={handleCreate}>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#555', marginBottom: 6 }}>
                  Key name
                </label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g. Production integration"
                  autoFocus
                  style={{
                    width: '100%', padding: '9px 12px', border: '1px solid #ddd', borderRadius: 8,
                    fontSize: 13, outline: 'none', boxSizing: 'border-box',
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
                  <button
                    type="button"
                    onClick={closeCreate}
                    style={{ padding: '8px 14px', fontSize: 13, color: '#666', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={busy}
                    style={{
                      padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                      border: 'none', cursor: 'pointer', background: G, color: '#fff', opacity: busy ? 0.6 : 1,
                    }}
                  >
                    {busy ? 'Creating…' : 'Create Key'}
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <div
                  style={{
                    display: 'flex', gap: 8, alignItems: 'flex-start', padding: '10px 12px',
                    background: '#fff8ec', border: '1px solid rgba(213,170,91,0.35)', borderRadius: 8, marginBottom: 14,
                  }}
                >
                  <ShieldAlert size={15} style={{ color: G, flexShrink: 0, marginTop: 1 }} />
                  <p style={{ margin: 0, fontSize: 12, color: '#8a6d1f' }}>
                    Copy this key now — for security, you won't be able to see it again.
                  </p>
                </div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#555', marginBottom: 6 }}>
                  {createdKey.name}
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <code
                    style={{
                      flex: 1, padding: '9px 12px', background: '#f7f7f7', border: '1px solid #eee',
                      borderRadius: 8, fontSize: 12, wordBreak: 'break-all',
                    }}
                  >
                    {createdKey.key}
                  </code>
                  <button
                    onClick={copyKey}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5, padding: '8px 12px', borderRadius: 8,
                      fontSize: 12, fontWeight: 600, border: '1px solid #ddd', cursor: 'pointer', background: '#fff',
                    }}
                  >
                    <Copy size={13} /> Copy
                  </button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
                  <button
                    onClick={closeCreate}
                    style={{
                      padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                      border: 'none', cursor: 'pointer', background: G, color: '#fff',
                    }}
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
