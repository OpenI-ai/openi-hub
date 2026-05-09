/**
 * PlanBadge.jsx — Phase 68: persistent plan indicator.
 *
 * Renders the user's current plan as a small chip with an Upgrade affordance
 * for free-plan users. Designed to slot into the dashboard sidebar footer
 * and into the top app bar near the user avatar.
 *
 * Single source of truth: AuthContext.user.current_plan, which is populated
 * from the backend at login (see middleware/auth.js#USER_BASE_FIELDS). No
 * extra API call on every render — the chip shows what the auth payload
 * already knows, and Settings → Billing fetches the live subscription
 * details when the user clicks through.
 *
 * Variants:
 *   variant="sidebar" — full-width pill above Logout, label + Upgrade link
 *   variant="topbar"  — compact pill beside avatar, just the plan name
 *
 * All links go to /dashboard/settings?tab=billing&focus=plans so the click
 * lands the user directly on the plan-comparison grid.
 */

import { Link } from 'react-router-dom';
import { Crown, ArrowRight, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PLAN_LABELS } from '../config/personas';

const G = '#D4A843';
const GOLD_BG = '#FFF8E7';
const GOLD_BORDER = '#F0D7A0';
const NAVY = '#0D2137';

function planMeta(planName) {
  const key = planName || 'free';
  const isFree = key === 'free';
  const isEnterprise = key === 'seeker_enterprise' || key === 'enterprise';
  return {
    isFree,
    isEnterprise,
    label: PLAN_LABELS[key] || 'Free',
    Icon: isEnterprise ? Crown : isFree ? null : Zap,
  };
}

const UPGRADE_HREF = '/dashboard/settings?tab=billing&focus=plans';
const MANAGE_HREF = '/dashboard/settings?tab=billing';

export default function PlanBadge({ variant = 'sidebar' }) {
  const { user } = useAuth();
  if (!user) return null;

  const meta = planMeta(user.current_plan);

  if (variant === 'topbar') {
    return (
      <Link
        to={meta.isFree ? UPGRADE_HREF : MANAGE_HREF}
        title={meta.isFree ? 'Upgrade your plan' : 'Manage subscription'}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 10px',
          borderRadius: 999,
          fontSize: 11,
          fontWeight: 700,
          textDecoration: 'none',
          background: meta.isFree ? GOLD_BG : '#F1F5F9',
          color: meta.isFree ? '#92400E' : NAVY,
          border: `1px solid ${meta.isFree ? GOLD_BORDER : '#E2E8F0'}`,
          whiteSpace: 'nowrap',
        }}
      >
        {meta.Icon ? <meta.Icon size={11} /> : null}
        <span>{meta.label}</span>
      </Link>
    );
  }

  // sidebar variant
  return (
    <div
      style={{
        margin: '8px 0 6px',
        padding: '10px 12px',
        borderRadius: 10,
        border: `1px solid ${meta.isFree ? GOLD_BORDER : '#E2E8F0'}`,
        background: meta.isFree ? GOLD_BG : '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: 0.4,
            textTransform: 'uppercase',
            color: '#64748B',
          }}
        >
          Plan
        </span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 12,
            fontWeight: 700,
            color: meta.isFree ? '#92400E' : NAVY,
          }}
        >
          {meta.Icon ? <meta.Icon size={12} /> : null}
          {meta.label}
        </span>
      </div>
      <Link
        to={meta.isFree ? UPGRADE_HREF : MANAGE_HREF}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 11,
          fontWeight: 600,
          textDecoration: 'none',
          color: meta.isFree ? G : '#64748B',
        }}
      >
        <span>{meta.isFree ? 'Upgrade' : 'Manage subscription'}</span>
        <ArrowRight size={11} />
      </Link>
    </div>
  );
}
