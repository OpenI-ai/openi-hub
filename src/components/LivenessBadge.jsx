import { WifiOff, Tag, ShieldAlert, Ban, Scale } from 'lucide-react';

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

// s92: registry verdicts. Unlike the homepage checks these are facts about
// the legal entity (matched to the corporate registry by company name), so
// the wording drops the "may be" and the registry caveat is about the MATCH,
// not the status. A registry verdict outranks a liveness one.
const REGISTRY = {
  struck_off: {
    icon: Ban,
    label: 'Closed — struck off',
    chip: 'bg-red-50 text-red-800 border-red-300',
    banner: 'bg-red-500/15 border-red-500/40 text-red-300',
    detail: (when) => `This company has been struck off the corporate register${when ? ` (verified ${when})` : ''}. It is no longer a going concern.`,
  },
  dissolved: {
    icon: Ban,
    label: 'Closed — dissolved',
    chip: 'bg-red-50 text-red-800 border-red-300',
    banner: 'bg-red-500/15 border-red-500/40 text-red-300',
    detail: (when) => `This company has been formally dissolved${when ? ` (verified ${when})` : ''}. It is no longer a going concern.`,
  },
  striking_off: {
    icon: Scale,
    label: 'Being struck off',
    chip: 'bg-amber-50 text-amber-700 border-amber-200',
    banner: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
    detail: (when) => `The corporate register shows a strike-off in process for this company${when ? ` (checked ${when})` : ''}.`,
  },
  under_liquidation: {
    icon: Scale,
    label: 'Under liquidation',
    chip: 'bg-amber-50 text-amber-700 border-amber-200',
    banner: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
    detail: (when) => `The corporate register shows liquidation or administration in process for this company${when ? ` (checked ${when})` : ''}.`,
  },
};

const REGISTRY_CAVEAT = 'Source: official corporate registry records (MCA, Companies House, Annuaire des Entreprises), matched by company name.';

function checkedLabel(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

export default function LivenessBadge({
  status, checkedAt, registryStatus, registryCheckedAt, variant = 'chip',
}) {
  // A registry verdict (fact) outranks a homepage verdict (inference).
  const registryMeta = REGISTRY[registryStatus];
  const meta = registryMeta || ADVERSE[status];
  if (!meta) return null;
  const Icon = meta.icon;
  const when = checkedLabel(registryMeta ? registryCheckedAt : checkedAt);
  const caveat = registryMeta ? REGISTRY_CAVEAT : CAVEAT;

  if (variant === 'banner') {
    return (
      <div className={`flex items-start gap-2.5 mt-4 px-4 py-3 rounded-xl border text-sm ${meta.banner}`}>
        <Icon size={16} className="flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">{meta.label}.</span> {meta.detail(when)}
          <div className="text-xs opacity-70 mt-0.5">{caveat}</div>
        </div>
      </div>
    );
  }

  return (
    <span
      title={`${meta.detail(when)} ${caveat}`}
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 border text-[10px] rounded-full ${meta.chip}`}
    >
      <Icon size={9} /> {meta.label}
    </span>
  );
}
