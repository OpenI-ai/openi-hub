/**
 * RoleTabs — Phase 60.3 (s50)
 *
 * Persistent tab strip rendered at the top of every dashboard page.
 * Shows one tab per role the user holds, plus a "+ Add role" affordance.
 * Switching tabs calls AuthContext.switchRole() which:
 *   1. Persists the choice to localStorage('openi_active_role')
 *   2. Updates AuthContext state -> sidebar repaints (DashboardLayout reads activeRole)
 *   3. Subsequent API requests carry X-Active-Role header (api.js reads localStorage)
 *
 * Decision 2 (s50): persistent tabs, not header dropdown.
 * Decision 3 (s50): tabs always visible (even single-role users) so the
 *                   "+ Add role" affordance is discoverable.
 */
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Plus, Check } from 'lucide-react';
import {
  Briefcase, GraduationCap, Building2, Landmark,
  TrendingUp, FlaskConical, Layers, Rocket, UserCheck, Wrench, Shield,
} from 'lucide-react';

// Map role -> { label, Icon, color }. Mirrors PERSONAS labels in src/config/personas.js
// but kept lightweight so this component has no heavy dep.
const ROLE_META = {
  startup:           { label: 'Startup',          Icon: Rocket },
  student:           { label: 'Student',          Icon: GraduationCap },
  academia:          { label: 'Academia',         Icon: GraduationCap },
  corporate:         { label: 'Corporate',        Icon: Building2 },
  government:        { label: 'Government',       Icon: Landmark },
  investor:          { label: 'Investor',         Icon: TrendingUp },
  mentor:            { label: 'Mentor',           Icon: UserCheck },
  lab:               { label: 'Lab',              Icon: FlaskConical },
  incubator:         { label: 'Incubator',        Icon: Layers },
  accelerator:       { label: 'Accelerator',      Icon: Rocket },
  service_provider:  { label: 'Service Provider', Icon: Wrench },
  evaluator:         { label: 'Evaluator',        Icon: Briefcase },
  admin:             { label: 'Admin',            Icon: Shield },
};

const C = {
  bg:           '#FFFFFF',
  border:       '#E8E5DD',
  textActive:   '#0D2137',
  textInactive: '#6F6A60',
  gold:         '#D4A843',
  goldBg:       'rgba(212, 168, 67, 0.10)',
  goldBorder:   'rgba(212, 168, 67, 0.40)',
  hoverBg:      'rgba(13, 33, 55, 0.04)',
};

export default function RoleTabs() {
  const { roles, activeRole, switchRole, primaryRole } = useAuth();
  const navigate = useNavigate();

  // Hide on admin/evaluator (legacy single-role personas with their own console nav)
  if (!roles || roles.length === 0) return null;
  if (roles.length === 1 && (roles[0] === 'admin' || roles[0] === 'evaluator')) return null;

  return (
    <div
      role="tablist"
      aria-label="Switch role"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '10px 24px',
        background: C.bg,
        borderBottom: `1px solid ${C.border}`,
        flexWrap: 'wrap',
      }}
    >
      <span style={{ fontSize: 11, fontWeight: 600, color: C.textInactive, letterSpacing: 0.4, textTransform: 'uppercase', marginRight: 4 }}>
        Viewing as
      </span>

      {roles.map(role => {
        const meta = ROLE_META[role] || { label: role, Icon: Briefcase };
        const Icon = meta.Icon;
        const active = role === activeRole;
        const isPrimary = role === primaryRole;
        return (
          <button
            key={role}
            role="tab"
            aria-selected={active}
            onClick={() => {
              if (active) return;
              const ok = switchRole(role);
              if (ok) {
                // Reload the dashboard root so persona-specific pages re-fetch with the new active role
                navigate('/dashboard', { replace: true });
              }
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 999,
              fontSize: 13,
              fontWeight: active ? 600 : 500,
              border: `1px solid ${active ? C.goldBorder : C.border}`,
              background: active ? C.goldBg : 'transparent',
              color: active ? C.textActive : C.textInactive,
              cursor: active ? 'default' : 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.background = C.hoverBg; }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
          >
            <Icon size={13} style={{ color: active ? C.gold : C.textInactive, flexShrink: 0 }} />
            <span>{meta.label}</span>
            {isPrimary && (
              <span
                title="Your default landing dashboard"
                style={{
                  fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4,
                  background: active ? '#fff' : C.border, color: active ? C.gold : C.textInactive,
                }}
              >
                PRIMARY
              </span>
            )}
            {active && <Check size={12} style={{ color: C.gold, flexShrink: 0 }} />}
          </button>
        );
      })}

      <button
        onClick={() => navigate('/dashboard/roles/add')}
        title="Add another role to your account"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: '6px 11px',
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 600,
          border: `1px dashed ${C.border}`,
          background: 'transparent',
          color: C.gold,
          cursor: 'pointer',
          transition: 'all 0.15s',
          marginLeft: 4,
        }}
        onMouseEnter={e => { e.currentTarget.style.background = C.goldBg; e.currentTarget.style.borderStyle = 'solid'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderStyle = 'dashed'; }}
      >
        <Plus size={13} />
        <span>Add role</span>
      </button>
    </div>
  );
}
