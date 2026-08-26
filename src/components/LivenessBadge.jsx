import { WifiOff, Tag, ShieldAlert } from 'lucide-react';

/**
 * s91: customer-facing surfacing of the liveness census (backend s85–s89).
 *
 * Renders nothing unless the profile carries one of the three ADVERSE
 * verdicts — 'live' and 'unknown' are not a customer's concern. Two shapes:
 *   * chip   — compact pill for directory cards ("don't contact blind")
 *   * banner — full-width advisory on the profile page, where the contact
 *              links actually live
 *
 * Wording is deliberately advisory, never a death certificate: these are
 * automated homepage checks (WAFs, migrations and rebrands produce false
 * positives), and the backend's vocabulary intentionally has no 'closed' —
 * proving legal closure needs registry data, not a homepage.
 */

const ADVERSE = {
  unreachable: {
    icon: WifiOff,
    label: 'Website unreachable',
    chip: 'bg-red-50 text-red-700 border-red-200',
    banner: 'bg-red-500/10 border-red-500/30 text-red-300',
    detail: (when) => `Our automated checks could not reach this company's website${when ? ` (last tried ${when})` : ''}. The company may no longer be active.`,
  },
  parked: {
    icon: Tag,
    label: 'Domain for sale',
    chip: 'bg-amber-50 text-amber-700 border-amber-200',
    banner: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
    detail: (when) => `This company's domain appears to be parked or listed for sale${when ? ` (checked ${when})` : ''}. The company may no longer be active.`,
  },
  mismatched: {
    icon: ShieldAlert,
    label: 'Website changed hands',
    chip: 'bg-amber-50 text-amber-700 border-amber-200',
    banner: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
    detail: (when) => `The website on file appears to belong to a different business now${when ? ` (checked ${when})` : ''}. The company may have shut down or rebranded.`,
  },
};

const CAVEAT = 'Automated check — a site block or migration can trigger this for an active company.';

function checkedLabel(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

export default function LivenessBadge({ status, checkedAt, variant = 'chip' }) {
  const meta = ADVERSE[status];
  if (!meta) return null;
  const Icon = meta.icon;
  const when = checkedLabel(checkedAt);

  if (variant === 'banner') {
    return (
      <div className={`flex items-start gap-2.5 mt-4 px-4 py-3 rounded-xl border text-sm ${meta.banner}`}>
        <Icon size={16} className="flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">{meta.label}.</span> {meta.detail(when)}
          <div className="text-xs opacity-70 mt-0.5">{CAVEAT}</div>
        </div>
      </div>
    );
  }

  return (
    <span
      title={`${meta.detail(when)} ${CAVEAT}`}
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 border text-[10px] rounded-full ${meta.chip}`}
    >
      <Icon size={9} /> {meta.label}
    </span>
  );
}
