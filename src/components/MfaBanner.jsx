/**
 * Phase 54 — MFA enrollment nudge banner.
 * Renders a dismissible amber banner if:
 *   - user is logged in
 *   - account is not on the bypass list (demo / legacy admin)
 *   - MFA is not enabled
 * Dismissal is persisted in sessionStorage so it hides for the rest of the tab session.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, X } from 'lucide-react';
import { mfaAPI } from '../services/api';

const DISMISS_KEY = 'mfa_banner_dismissed';

export default function MfaBanner() {
  const [status, setStatus]       = useState(null);
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem(DISMISS_KEY) === '1');
  const navigate = useNavigate();

  useEffect(() => {
    if (dismissed) return;
    mfaAPI.status().then(setStatus).catch(() => setStatus(null));
  }, [dismissed]);

  if (dismissed || !status) return null;
  if (status.bypass) return null;    // demo/admin — no nudge
  if (status.enabled) return null;   // already enrolled

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 16px',
      background: '#fffbeb',
      border: '1px solid #fde68a',
      borderRadius: 10,
      marginBottom: 16,
      fontSize: 13,
    }}>
      <Shield size={16} style={{ color: '#b45309', flexShrink: 0 }} />
      <div style={{ flex: 1, color: '#78350f' }}>
        <strong>Secure your account.</strong> Enable multi-factor authentication for an extra layer of protection.
      </div>
      <button
        onClick={() => navigate('/dashboard/settings?tab=security')}
        style={{
          padding: '6px 14px',
          background: '#D0A848',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
        }}>
        Enable MFA
      </button>
      <button
        onClick={handleDismiss}
        aria-label="Dismiss"
        style={{
          padding: 4, background: 'transparent', border: 'none', color: '#92400e', cursor: 'pointer', display: 'flex',
        }}>
        <X size={16} />
      </button>
    </div>
  );
}
