/**
 * PlanHeroTile.jsx — Phase 68: top-of-dashboard plan card.
 *
 * Slots into each persona dashboard above the KPI grid. Free-plan users see
 * a gold-accented Upgrade card; paid users see a quieter "manage subscription"
 * card. Persona-aware copy via getPersonaCategory() so providers see "Growth"
 * upgrade language and seekers see "Pro / Enterprise".
 *
 * Click-throughs go to /dashboard/settings?tab=billing&focus=plans which
 * lands the user directly on the plan-comparison grid.
 *
 * Reads user.current_plan from AuthContext (populated at login). No extra
 * API call needed for first-paint render.
 */

import { Link } from 'react-router-dom';
import { Crown, Zap, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PLAN_LABELS, getPersonaCategory } from '../config/personas';

const G = '#D4A843';
const NAVY = '#0D2137';

const UPGRADE_HREF = '/dashboard/settings?tab=billing&focus=plans';
const MANAGE_HREF = '/dashboard/settings?tab=billing';

const FREE_PROVIDER_PITCH =
  'Unlock Growth: featured badge, priority search ranking, profile visit alerts, and AI profile recommendations.';
const FREE_SEEKER_PITCH =
  'Unlock Pro: semantic search, 8-vector evaluation, deal pipeline, and the full innovation directory.';

export default function PlanHeroTile() {
  const { user, activeRole } = useAuth();
  if (!user) return null;

  const role = activeRole || user.role;
  const category = getPersonaCategory(role); // 'provider' or 'seeker'
  const planKey = user.current_plan || 'free';
  const planLabel = PLAN_LABELS[planKey] || 'Free';
  const isFree = planKey === 'free';
  const isEnterprise = planKey === 'seeker_enterprise' || planKey === 'enterprise';
  const Icon = isEnterprise ? Crown : isFree ? Sparkles : Zap;

  if (isFree) {
    return (
      <Link
        to={UPGRADE_HREF}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '14px 18px',
          marginBottom: 18,
          borderRadius: 14,
          textDecoration: 'none',
          background: 'linear-gradient(135deg, #FFF8E7 0%, #FDEBC8 100%)',
          border: `1px solid #F0D7A0`,
          boxShadow: '0 1px 3px rgba(212, 168, 67, 0.12)',
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: G,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon size={20} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                color: '#92400E',
              }}
            >
              You are on the {planLabel} plan
            </span>
          </div>
          <div style={{ fontSize: 13, color: '#7C3F00', lineHeight: 1.4 }}>
            {category === 'provider' ? FREE_PROVIDER_PITCH : FREE_SEEKER_PITCH}
          </div>
        </div>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            background: G,
            color: '#fff',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 700,
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}
        >
          Upgrade <ArrowRight size={14} />
        </span>
      </Link>
    );
  }

  // Paid plan: quieter chip-style tile linking to manage subscription.
  return (
    <Link
      to={MANAGE_HREF}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '12px 16px',
        marginBottom: 18,
        borderRadius: 14,
        textDecoration: 'none',
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: '#F1F5F9',
          color: NAVY,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={18} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 2 }}>
          {planLabel} plan active
        </div>
        <div style={{ fontSize: 12, color: '#64748B' }}>
          Manage subscription, billing address, and invoices
        </div>
      </div>
      <ArrowRight size={16} color="#94A3B8" />
    </Link>
  );
}
