/**
 * OpenI Hub — UpgradeCTA (Phase 19)
 * Graceful upgrade prompt card shown when a feature is gated by plan tier.
 * Props: feature (display name), plan (current), message (optional override)
 */
import { Link } from 'react-router-dom';
import { Lock, ArrowRight } from 'lucide-react';

const G = '#D5AA5B';

export default function UpgradeCTA({ feature, plan = 'free', message, compact = false }) {
  const defaultMsg = `${feature} requires a ${plan === 'free' ? 'Pro or Enterprise' : 'Enterprise'} plan.`;

  if (compact) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
        background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10,
        fontSize: 12, color: '#92400e',
      }}>
        <Lock size={14} />
        <span>{message || defaultMsg}</span>
        <Link to="/dashboard/settings" style={{ color: G, fontWeight: 700, marginLeft: 'auto', whiteSpace: 'nowrap', textDecoration: 'none' }}>
          Upgrade <ArrowRight size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />
        </Link>
      </div>
    );
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
      border: '1px solid #fde68a',
      borderRadius: 16, padding: 32, textAlign: 'center',
      maxWidth: 500, margin: '24px auto',
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: '50%', background: `${G}20`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 16px',
      }}>
        <Lock size={24} color={G} />
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>
        {feature}
      </h3>
      <p style={{ fontSize: 14, color: '#666', marginBottom: 20, lineHeight: 1.5 }}>
        {message || `${defaultMsg} Upgrade to unlock this feature and get the most out of OpenI Hub.`}
      </p>
      <Link to="/dashboard/settings" style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '10px 24px', background: G, color: '#fff',
        borderRadius: 10, fontWeight: 700, fontSize: 14,
        textDecoration: 'none', transition: 'all 0.15s',
      }}>
        View Plans & Upgrade <ArrowRight size={16} />
      </Link>
      <p style={{ fontSize: 11, color: '#999', marginTop: 12 }}>
        Currently on: <strong>{plan === 'free' ? 'Free' : plan === 'pro' ? 'Pro' : 'Enterprise'}</strong> plan
      </p>
    </div>
  );
}
