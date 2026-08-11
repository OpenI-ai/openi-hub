/**
 * OpenI Hub - fieldPrimitives.jsx
 *
 * TRL/funding formatters, field-value renderers and row chrome
 *
 * VERBATIM slice of src/pages/dashboard/StartupProfile.jsx lines 18-302 as it
 * stood before the Phase 163 split (9 Aug 2026). Do NOT reformat the body -
 * see ./index.js for the re-concat verification recipe and the invariants.
 */

import { ExternalLink } from 'lucide-react';

// --- BODY START (verbatim, do not reformat) ---
// --- lines 18-302 ---
// Phase 69: TRL renamed to "Tech Readiness" everywhere visible. Tooltip
// explains the 1-9 NASA scale for users who do not know the term.
const TRL_TOOLTIP =
  'Tech Readiness Level (TRL): NASA standard 1–9 scale.\n' +
  '1 = basic concept · 4 = lab demo · 6 = prototype in relevant environment · 9 = proven in production.';

function TechReadinessBadge({ trl }) {
  if (!trl) return null;
  const colors = ['', 'bg-gray-200 text-gray-700', 'bg-gray-300 text-gray-700', 'bg-blue-100 text-blue-700', 'bg-blue-200 text-blue-800', 'bg-yellow-100 text-yellow-800', 'bg-yellow-200 text-yellow-800', 'bg-orange-100 text-orange-800', 'bg-accent-100 text-accent-700', 'bg-accent-200 text-accent-800'];
  return (
    <span
      title={TRL_TOOLTIP}
      className={`px-2.5 py-1 rounded-lg text-xs font-bold ${colors[trl] || 'bg-gray-100 text-gray-600'}`}
    >
      Tech Readiness {trl}
    </span>
  );
}

// Phase 84 - formatFunding prefers the human-readable bracket label when
// available. Falls back to formatting the legacy numeric column with the
// companion _currency.
const MONEY_SYMBOLS = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
function formatFunding(val, currency, rangeText) {
  if (rangeText && typeof rangeText === 'string') {
    // Phase 87k — strip redundant currency code prefix; the bracket label
    // already includes the symbol (₹/$/€/£). Phase 84 storage prepended
    // "INR " / "USD " to every money_range value.
    return rangeText.replace(/^(INR|USD|EUR|GBP)\s+/i, '');
  }
  if (!val) return null;
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num) || num === 0) return null;
  const sym = MONEY_SYMBOLS[currency || 'INR'] || (currency || '');
  if (num >= 1e9) return `${sym}${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `${sym}${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${sym}${(num / 1e3).toFixed(0)}K`;
  return `${sym}${num}`;
}

// Phase 88 — generic SubSectionCard. Replaces the Phase 87f hand-picked
// whitelist (which hid linkedin/twitter on team, launch_date/pricing_model/
// product_url on products, logo_url on clients, abstract/url on patents,
// description/country/sector/website on competitors, url on news — reported
// by the Dentsu cohort across T1/T2/T5b/T6/T7b/T8). Now every non-empty field
// on every sub-section row renders, formatted by type.
//
// Field labels are pulled from a per-section LABELS map (kept colocated for
// easy maintenance). System fields (id, startup_profile_id, created_at,
// updated_at) are excluded.

const SUBSECTION_DEFS = [
  { key: 'team',         title: 'Team & Management' },
  { key: 'products',     title: 'Products & Services' },
  { key: 'funding',      title: 'Funding History' },
  { key: 'clients',      title: 'Customers & Clients' },
  { key: 'patents',      title: 'IP & Patents' },
  { key: 'competitors',  title: 'Competitive Landscape' },
  { key: 'news',         title: 'In the News' },
  { key: 'acquisitions', title: 'Acquisitions' },
];

// Per-field labels. Falls back to title-cased column name if absent.
const FIELD_LABELS = {
  // Team
  name: 'Name', designation: 'Designation', role: 'Role', bio: 'Bio',
  linkedin_url: 'LinkedIn', twitter_url: 'X (Twitter)',
  is_founder: 'Founder', is_advisory: 'Advisory Board',
  // Products
  product_name: 'Name', tagline: 'Tagline', description: 'Description',
  launch_date: 'Launch Date', pricing_model: 'Pricing Model',
  product_url: 'Product URL', url: 'URL',
  // Funding
  round_name: 'Round Name', round_type: 'Round Type', round_date: 'Date',
  amount: 'Amount', amount_range: 'Amount', currency: 'Currency',
  lead_investor: 'Lead Investor', valuation_at_round: 'Valuation at Round',
  // Clients
  client_name: 'Client', industry: 'Industry', logo_url: 'Logo',
  // Patents
  title: 'Title', status: 'Status', patent_number: 'Patent No.',
  filing_date: 'Filing Date', abstract: 'Abstract',
  // Competitors
  competitor_name: 'Competitor', country: 'Country', sector: 'Sector', website: 'Website',
  differentiation: 'Differentiation',
  // News
  headline: 'Headline', source: 'Source', published_date: 'Date', link: 'Link',
  // Acquisitions
  acquirer: 'Acquirer', target: 'Target', acquired_company: 'Company',
  acquisition_date: 'Date',
};

// Fields excluded from generic render (system / internal).
const FIELD_EXCLUDE = new Set([
  'id', 'startup_profile_id', 'created_at', 'updated_at',
]);

// Heuristics for type-based formatting based on field name + value shape.
// Kept inline rather than per-section so adding a new field gets sensible
// formatting automatically.
function looksLikeUrl(name, val) {
  if (typeof val !== 'string') return false;
  if (/_url$|^url$|^link$|^website$/i.test(name)) return true;
  return /^https?:\/\//i.test(val);
}
function looksLikeDate(name, val) {
  if (typeof val !== 'string') return false;
  if (/_date$|^date$/i.test(name)) return true;
  return /^\d{4}-\d{2}-\d{2}/.test(val);
}
function looksLikeMoneyRange(name, val) {
  if (typeof val !== 'string') return false;
  return /_range$/i.test(name) && /^(INR|USD|EUR|GBP)\s+/i.test(val);
}
function looksLikeLogo(name) {
  return /logo_url$/i.test(name);
}
function fmtLabel(name) {
  return FIELD_LABELS[name] || name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
function fmtDate(val) {
  try { return String(val).slice(0, 10); } catch { return null; }
}
function fmtMoneyRange(val) {
  return String(val).replace(/^(INR|USD|EUR|GBP)\s+/i, '');
}
function isEmpty(val) {
  if (val === null || val === undefined) return true;
  if (typeof val === 'string' && val.trim() === '') return true;
  if (Array.isArray(val) && val.length === 0) return true;
  return false;
}

function FieldValue({ name, value }) {
  if (looksLikeLogo(name) && typeof value === 'string' && /^https?:\/\//.test(value)) {
    return <img src={value} alt="" className="w-12 h-12 rounded object-contain bg-white border border-gray-200" />;
  }
  if (looksLikeUrl(name, value)) {
    const href = value.startsWith('http') ? value : `https://${value}`;
    return <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline break-all">{value}</a>;
  }
  if (looksLikeMoneyRange(name, value)) {
    return <span className="font-semibold text-primary-600">{fmtMoneyRange(value)}</span>;
  }
  if (looksLikeDate(name, value)) {
    return <span>{fmtDate(value)}</span>;
  }
  if (typeof value === 'boolean') {
    return <span className={value ? 'text-green-600 font-semibold' : 'text-gray-500'}>{value ? 'Yes' : 'No'}</span>;
  }
  if (Array.isArray(value)) {
    return <span>{value.join(', ')}</span>;
  }
  if (typeof value === 'string' && value.length > 200) {
    return <span className="text-gray-700">{value}</span>;
  }
  return <span>{String(value)}</span>;
}

// ─────────────────────────────────────────────────────────────────────
// Phase 90 — structured row cards. Replaces Phase 88's flat label/value
// grid for the corporate-view StartupProfile sub-sections. Each section
// gets a per-type renderer with header / body / footer zones for visual
// hierarchy and scannability. Closes T13 (cohort flagged Phase 88
// render-everything as cluttered).
//
// Render-everything contract from Phase 88 is preserved: every field
// visible after Phase 88 stays visible after Phase 90 — just slotted into
// semantic zones. Any field not explicitly slotted by a row component
// falls through to a small "more details" grid via <FallbackFields>.
// ─────────────────────────────────────────────────────────────────────

// Shared atom components.
function Badge({ children, tone = 'gray' }) {
  const tones = {
    gray:   'bg-gray-100 text-gray-700 border-gray-200',
    green:  'bg-green-50 text-green-700 border-green-200',
    amber:  'bg-amber-50 text-amber-700 border-amber-200',
    blue:   'bg-blue-50 text-blue-700 border-blue-200',
    primary:'bg-primary-50 text-primary-700 border-primary-200',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${tones[tone] || tones.gray}`}>
      {children}
    </span>
  );
}

function UrlChip({ href, icon: Icon, label }) {
  if (!href) return null;
  const full = href.startsWith('http') ? href : `https://${href}`;
  return (
    <a
      href={full}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border border-gray-200 text-gray-700 hover:border-primary-400 hover:text-primary-600 transition-colors"
    >
      {Icon && <Icon size={12} />}
      <span>{label}</span>
      <ExternalLink size={10} className="opacity-60" />
    </a>
  );
}

function MoneyPill({ value }) {
  if (!value) return null;
  const stripped = typeof value === 'string'
    ? value.replace(/^(INR|USD|EUR|GBP)\s+/i, '')
    : String(value);
  return (
    <span className="inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-md bg-primary-50 text-primary-700 border border-primary-200">
      {stripped}
    </span>
  );
}

function LogoImg({ src, size = 48 }) {
  if (!src || typeof src !== 'string' || !/^https?:\/\//.test(src)) return null;
  return (
    <img
      src={src}
      alt=""
      style={{ width: size, height: size }}
      className="rounded-md object-contain bg-white border border-gray-200 flex-shrink-0"
    />
  );
}

function StatusBadge({ status }) {
  if (!status) return null;
  const norm = String(status).toLowerCase();
  const tone = norm.includes('grant')   ? 'green'
            : norm.includes('appli')    ? 'amber'
            : norm.includes('pend')     ? 'gray'
            : norm.includes('reject')   ? 'gray'
            : 'blue';
  return <Badge tone={tone}>{String(status)}</Badge>;
}

// Fallback: any non-empty field not explicitly slotted by a row component
// renders here as a compact label/value pair. Preserves Phase 88's
// render-everything contract — no field gets dropped silently.
function FallbackFields({ row, slotted }) {
  const slottedSet = new Set([...slotted, ...FIELD_EXCLUDE]);
  const remaining = Object.entries(row)
    .filter(([k, v]) => !slottedSet.has(k) && !isEmpty(v));
  if (remaining.length === 0) return null;
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs mt-2 pt-2 border-t border-gray-100">
      {remaining.map(([k, v]) => (
        <div key={k} className="flex gap-2">
          <dt className="text-gray-400 flex-shrink-0">{fmtLabel(k)}:</dt>
          <dd className="text-gray-700 min-w-0"><FieldValue name={k} value={v} /></dd>
        </div>
      ))}
    </dl>
  );
}

// Shared row card wrapper — consistent padding + dividers.
function RowCard({ children }) {
  return (
    <div className="py-3 border-b border-gray-100 last:border-0 last:pb-0">
      {children}
    </div>
  );
}

// Header row: primary text + inline metadata + optional right-aligned content.
function RowHeader({ primary, meta, right }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-gray-900">{primary}</div>
        {meta && meta.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5 text-xs text-gray-500">
            {meta.map((m, i) => <span key={i}>{m}</span>)}
          </div>
        )}
      </div>
      {right && <div className="flex-shrink-0">{right}</div>}
    </div>
  );
}

// --- BODY END ---

export {
  TRL_TOOLTIP,
  TechReadinessBadge,
  formatFunding,
  SUBSECTION_DEFS,
  fmtDate,
  Badge,
  UrlChip,
  MoneyPill,
  LogoImg,
  StatusBadge,
  FallbackFields,
  RowCard,
  RowHeader,
};
