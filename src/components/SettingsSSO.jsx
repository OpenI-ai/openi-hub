import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { ssoAPI, orgAPI } from '../services/api';
import { Shield, Copy, Loader2, Trash2, ShieldAlert } from 'lucide-react';

const G = '#D0A848';

const card = {
  background: '#ffffff',
  border: '1px solid #eeeeee',
  borderRadius: 14,
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
};

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const label = { display: 'block', fontSize: 12.5, fontWeight: 600, color: '#555', marginBottom: 6 };
const input = {
  width: '100%', padding: '9px 12px', border: '1px solid #ddd', borderRadius: 8,
  fontSize: 13, outline: 'none', boxSizing: 'border-box',
};

// Enterprise OIDC SSO self-serve config — lives inside Settings' "SSO" tab
// (Enterprise-only, gated by the parent tab on plan.features.sso_oidc).
// Backend: GET/POST/DELETE /api/corporate/sso/config (ssoController.js).
// The client secret is never returned by the API in any form, so it must be
// re-entered on every save (including edits that don't touch the secret).
export default function SettingsSSO() {
  const [config, setConfig] = useState(null);
  const [orgSlug, setOrgSlug] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [issuerUrl, setIssuerUrl] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [allowedDomains, setAllowedDomains] = useState('');
  const [autoProvision, setAutoProvision] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ssoData, orgData] = await Promise.all([
        ssoAPI.getConfig(),
        orgAPI.getMyOrg(),
      ]);
      const cfg = ssoData?.config || null;
      setConfig(cfg);
      setOrgSlug(orgData?.org?.slug || null);
      if (cfg) {
        setIssuerUrl(cfg.issuer_url || '');
        setClientId(cfg.client_id || '');
        setAllowedDomains((cfg.allowed_domains || []).join(', '));
        setAutoProvision(cfg.auto_provision !== false);
      }
      setClientSecret('');
    } catch (err) {
      toast.error(err.message || 'Failed to load SSO configuration');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!issuerUrl.trim() || !clientId.trim() || !clientSecret.trim()) {
      toast.error('Issuer URL, Client ID, and Client Secret are all required');
      return;
    }

    setSaving(true);
    try {
      await ssoAPI.upsertConfig({
        issuer_url: issuerUrl.trim(),
        client_id: clientId.trim(),
        client_secret: clientSecret.trim(),
        allowed_domains: allowedDomains.split(',').map((d) => d.trim()).filter(Boolean),
        auto_provision: autoProvision,
      });
      toast.success('SSO configuration saved');
      await load();
    } catch (err) {
      toast.error(err.message || 'Failed to save SSO configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Remove SSO configuration? Users will no longer be able to sign in via SSO for this organization.')) return;

    setSaving(true);
    try {
      await ssoAPI.deleteConfig();
      toast.success('SSO configuration removed');
      await load();
    } catch (err) {
      toast.error(err.message || 'Failed to remove SSO configuration');
    } finally {
      setSaving(false);
    }
  };

  const loginUrl = orgSlug ? `${API_BASE}/auth/sso/${orgSlug}/login` : null;

  const copyLoginUrl = () => {
    if (!loginUrl) return;
    navigator.clipboard.writeText(loginUrl);
    toast.success('Copied to clipboard');
  };

  if (loading) {
    return (
      <div style={{ ...card, padding: 20, display: 'flex', justifyContent: 'center' }}>
        <Loader2 size={24} className="animate-spin" style={{ color: G }} />
      </div>
    );
  }

  return (
    <div style={{ ...card, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Shield size={18} style={{ color: G }} />
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>Single Sign-On (OIDC)</h2>
      </div>

      <p style={{ margin: '0 0 20px', fontSize: 12.5, color: '#888' }}>
        Let your team sign in with your identity provider (Okta, Azure AD, Google Workspace, etc.)
        instead of a password. Your client secret is encrypted at rest and never returned by this API —
        you'll need to re-enter it whenever you update this configuration.
      </p>

      {config && loginUrl && (
        <div
          style={{
            display: 'flex', gap: 8, alignItems: 'flex-start', padding: '10px 12px',
            background: '#fff8ec', border: '1px solid rgba(213,170,91,0.35)', borderRadius: 8, marginBottom: 20,
          }}
        >
          <ShieldAlert size={15} style={{ color: G, flexShrink: 0, marginTop: 1 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: '0 0 6px', fontSize: 12, color: '#8a6d1f' }}>
              Give this login URL to your team or IdP:
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <code
                style={{
                  flex: 1, padding: '8px 10px', background: '#fff', border: '1px solid #eee',
                  borderRadius: 8, fontSize: 11.5, wordBreak: 'break-all',
                }}
              >
                {loginUrl}
              </code>
              <button
                onClick={copyLoginUrl}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5, padding: '8px 12px', borderRadius: 8,
                  fontSize: 12, fontWeight: 600, border: '1px solid #ddd', cursor: 'pointer', background: '#fff',
                  flexShrink: 0,
                }}
              >
                <Copy size={13} /> Copy
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSave}>
        <div style={{ marginBottom: 14 }}>
          <label style={label}>Issuer URL</label>
          <input
            type="text"
            value={issuerUrl}
            onChange={(e) => setIssuerUrl(e.target.value)}
            placeholder="https://accounts.google.com"
            style={input}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={label}>Client ID</label>
          <input
            type="text"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder="your-oidc-client-id"
            style={input}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={label}>
            Client Secret {config && <span style={{ fontWeight: 400, color: '#999' }}>(re-enter to save changes)</span>}
          </label>
          <input
            type="password"
            value={clientSecret}
            onChange={(e) => setClientSecret(e.target.value)}
            placeholder={config ? '••••••••••••' : 'your-oidc-client-secret'}
            style={input}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={label}>Allowed email domains</label>
          <input
            type="text"
            value={allowedDomains}
            onChange={(e) => setAllowedDomains(e.target.value)}
            placeholder="example.com, subsidiary.com"
            style={input}
          />
          <p style={{ margin: '6px 0 0', fontSize: 11, color: '#999' }}>
            Comma-separated. Leave blank to allow any email domain.
          </p>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={autoProvision}
            onChange={(e) => setAutoProvision(e.target.checked)}
          />
          <span style={{ fontSize: 13, color: '#444' }}>
            Auto-provision new accounts on first SSO login
          </span>
        </label>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {config ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving}
              style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '8px 12px', borderRadius: 7,
                fontSize: 12, fontWeight: 600, border: '1px solid #f0d0d0', cursor: 'pointer',
                background: '#fff', color: '#c0392b', opacity: saving ? 0.6 : 1,
              }}
            >
              <Trash2 size={13} /> Remove SSO
            </button>
          ) : <span />}

          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              border: 'none', cursor: 'pointer', background: G, color: '#fff', opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? 'Saving…' : config ? 'Update SSO Config' : 'Enable SSO'}
          </button>
        </div>
      </form>
    </div>
  );
}
