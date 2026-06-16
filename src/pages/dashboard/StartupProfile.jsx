import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { startupAPI, startupProfileAPI, profileViewAPI, claimAPI, startupProfileShareAPI, watchlistAPI, getToken } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import SimilarStartupsPanel from '../../components/SimilarStartupsPanel';
import {
  MapPin, Users, TrendingUp, Award, Shield,
  ExternalLink, Bookmark, BookmarkCheck, Share2, Globe,
  Cpu, Target, Building2, CheckCircle2, AlertCircle,
  Calendar, Briefcase, Sparkles, Flag, Loader2,
  X, Mail, Github, Youtube, FileText,
  Video, BarChart3, List, Wallet, FileDown,  // Phase 92.1 (T17b) - chart/list toggle icons
} from "lucide-react";

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

// ─────────────────────────────────────────────────────────────────────
// Phase 92 — funding history bar chart (T17). Crunchbase-style visual
// above the per-round list. Hand-rolled SVG, zero new dependencies.
// Renders only when funding_rounds has >= 1 row.
// ─────────────────────────────────────────────────────────────────────

// Parse a money_range bracket label to a numeric midpoint in Cr units.
// Handles MONEY_RANGES.INR (₹1 Lakh / ₹10 Lakh / ₹1 Cr / ₹10 Cr / etc),
// "Below X", "Above X", "Pre-revenue", "Confidential", and stripped variants
// from Phase 87k (where "INR " / "USD " prefix already removed).
//
// Returns null for non-numeric values (Pre-revenue, Confidential) so the
// chart can skip them without breaking the totals.
function bracketToMidpoint(label) {
  if (!label || typeof label !== 'string') return null;
  const s = label.trim();
  // Skip non-numeric labels
  if (/pre-revenue|not applicable|confidential/i.test(s)) return null;
  // Strip any leading currency code prefix (defensive)
  const cleaned = s.replace(/^(INR|USD|EUR|GBP)\s+/i, '');
  // Helper: convert "X Lakh" / "X Cr" / "X" to Cr value
  function toCr(numStr, unitStr) {
    const n = parseFloat(numStr);
    if (Number.isNaN(n)) return null;
    if (/lakh/i.test(unitStr || '')) return n / 100;       // 1 Lakh = 0.01 Cr
    if (/cr|crore/i.test(unitStr || '')) return n;         // 1 Cr = 1 Cr
    return n; // bare number assumed Cr
  }
  // Pattern: "Below ₹X Unit" or "Above ₹X Unit"
  const boundMatch = cleaned.match(/^(Below|Above)\s+₹?([\d.]+)\s*(Lakh|Cr|Crore)?/i);
  if (boundMatch) {
    const [, dir, num, unit] = boundMatch;
    const val = toCr(num, unit);
    if (val == null) return null;
    return dir.toLowerCase() === 'below' ? val / 2 : val * 1.5;
  }
  // Pattern: "₹X Unit – ₹Y Unit" or "₹X Unit - ₹Y Unit" (en-dash or hyphen)
  // Phase 90 MoneyPill strips the leading currency code but ₹ stays inside the bracket
  const rangeMatch = cleaned.match(/^₹?([\d.]+)\s*(Lakh|Cr|Crore)?\s*[–-]\s*₹?([\d.]+)\s*(Lakh|Cr|Crore)?/i);
  if (rangeMatch) {
    const [, lo, loUnit, hi, hiUnit] = rangeMatch;
    const loCr = toCr(lo, loUnit || hiUnit);
    const hiCr = toCr(hi, hiUnit || loUnit);
    if (loCr == null || hiCr == null) return null;
    return (loCr + hiCr) / 2;
  }
  // Pattern: bare bracket like "1-5 Cr" or "100-250 Cr" (Phase 91 revenue ladder)
  const bareRange = cleaned.match(/^([\d.]+)\s*[–-]\s*([\d.]+)\s*(Lakh|Cr|Crore)?/i);
  if (bareRange) {
    const [, lo, hi, unit] = bareRange;
    const loCr = toCr(lo, unit);
    const hiCr = toCr(hi, unit);
    if (loCr == null || hiCr == null) return null;
    return (loCr + hiCr) / 2;
  }
  // Pattern: "<X Cr" or ">X Cr" (Phase 91 ladder bookends)
  const ineqMatch = cleaned.match(/^([<>])\s*([\d.]+)\s*(Lakh|Cr|Crore)?/i);
  if (ineqMatch) {
    const [, op, num, unit] = ineqMatch;
    const val = toCr(num, unit);
    if (val == null) return null;
    return op === '<' ? val / 2 : val * 1.5;
  }
  return null;
}

// Phase 92.1 (T17a) - amountToDisplay replaces the old amountToCr that
// wrongly assumed row.amount was in actual rupees. New schema has
// amount_unit column (Phase 92.1 ship 1/3) so we know what '10.00' means:
// 10 Cr / 10 Lakh / 10 Million / etc. Per-currency convention:
//   INR  -> Lakh (0.01 Cr) / Cr (1) / Rupees (1e-7 Cr)
//   USD/EUR/GBP -> K (0.001 M) / M (1) / Base (1e-6 M)
// Big-unit per currency family: INR uses Cr, others use M. Chart
// converts everything to the big-unit for visual comparison.
//
// Returns null for rows with no usable amount (Confidential / Pre-revenue
// brackets and rows missing both amount and amount_range).
//
// Returns { value, bigUnit, currency, displayLabel, isApprox } where
// `value` is in `bigUnit` (Cr for INR, M for others) so the chart can
// stack same-currency bars on a shared Y axis.
function amountToDisplay(row) {
  // Path 1: amount_range bracket (Phase 84) - already produces a Cr midpoint
  if (row.amount_range) {
    const mid = bracketToMidpoint(row.amount_range);
    if (mid != null) {
      const cur = (row.currency || 'INR').toUpperCase();
      return {
        value: mid,
        bigUnit: 'Cr',
        currency: cur,
        displayLabel: `${cur === 'INR' ? '₹' : (CURRENCY_SYMBOL[cur] || '')}${mid.toFixed(mid >= 10 ? 0 : 1)} Cr`,
        isApprox: true,
      };
    }
  }

  // Path 2: numeric amount + unit (Phase 92.1 happy path)
  const numericAmt = Number(row.amount);
  if (!row.amount || Number.isNaN(numericAmt)) return null;

  const cur = (row.currency || 'INR').toUpperCase();
  // Resolve unit: explicit amount_unit > heuristic by currency
  let unit = row.amount_unit;
  if (!unit) {
    // Legacy row without amount_unit. Assume Indian convention for INR,
    // international convention for others.
    unit = (cur === 'INR') ? 'Cr' : 'M';
  }

  // Convert to big-unit per currency family.
  // INR family big-unit: Cr. Lakh -> 0.01x, Rupees -> 1e-7x.
  // USD/EUR/GBP family big-unit: M. K -> 0.001x, Base -> 1e-6x.
  const isINR = (cur === 'INR');
  const bigUnit = isINR ? 'Cr' : 'M';

  let valueInBigUnit;
  if (isINR) {
    if (unit === 'Cr')          valueInBigUnit = numericAmt;
    else if (unit === 'Lakh')   valueInBigUnit = numericAmt / 100;
    else if (unit === 'Rupees') valueInBigUnit = numericAmt / 1e7;
    // Heuristic safety: if user picked K/M/Base for INR (off-convention),
    // map them to nearest INR big-unit using rough FX-free conversion
    // (1 K ~ 0.0001 Cr, 1 M ~ 0.1 Cr, 1 Base = Rupees).
    else if (unit === 'K')      valueInBigUnit = numericAmt * 0.0001;
    else if (unit === 'M')      valueInBigUnit = numericAmt * 0.1;
    else if (unit === 'Base')   valueInBigUnit = numericAmt / 1e7;
    else                        valueInBigUnit = numericAmt; // fallback assume Cr
  } else {
    // Non-INR: big-unit M
    if (unit === 'M')           valueInBigUnit = numericAmt;
    else if (unit === 'K')      valueInBigUnit = numericAmt / 1000;
    else if (unit === 'Base')   valueInBigUnit = numericAmt / 1e6;
    // Off-convention safety: INR units picked for non-INR currency
    else if (unit === 'Cr')     valueInBigUnit = numericAmt * 10; // 1 Cr = 10 M (rough INR equivalent)
    else if (unit === 'Lakh')   valueInBigUnit = numericAmt * 0.1;
    else if (unit === 'Rupees') valueInBigUnit = numericAmt / 1e6;
    else                        valueInBigUnit = numericAmt; // fallback assume M
  }

  // Build the human-readable display label using the user's chosen unit
  // (not the big-unit) so it matches what they typed.
  const sym = CURRENCY_SYMBOL[cur] || cur + ' ';
  const displayLabel = `${sym}${numericAmt} ${unit}`;

  return {
    value: valueInBigUnit,
    bigUnit,
    currency: cur,
    displayLabel,
    isApprox: !row.amount_unit, // approximate when we used the heuristic
  };
}

// Currency symbol map - reused across MoneyPill, FundingRow, and chart.
const CURRENCY_SYMBOL = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };

// Phase 92.1.3 (T17c) - valuationToDisplay mirrors amountToDisplay but reads
// valuation_at_round + valuation_at_round_unit + valuation_at_round_currency.
// Returns null when valuation is missing/zero so the meta line can be skipped.
// Same legacy heuristic as amountToDisplay: NULL unit => INR uses Cr, others use M.
function valuationToDisplay(row) {
  const numericVal = Number(row.valuation_at_round);
  if (!row.valuation_at_round || Number.isNaN(numericVal) || numericVal === 0) return null;

  const cur = (row.valuation_at_round_currency || row.currency || 'INR').toUpperCase();
  let unit = row.valuation_at_round_unit;
  if (!unit) {
    unit = (cur === 'INR') ? 'Cr' : 'M';
  }

  const sym = CURRENCY_SYMBOL[cur] || cur + ' ';
  return `${sym}${numericVal} ${unit}`;
}

// Color map by round stage. Falls back to OpenI gold for unknown stages.
const STAGE_COLORS = {
  'Pre-seed':  '#94a3b8', // slate-400
  'Seed':      '#fbbf24', // amber-400
  'Angel':     '#f59e0b', // amber-500
  'Series A':  '#3b82f6', // blue-500
  'Series B':  '#8b5cf6', // violet-500
  'Series C':  '#a855f7', // purple-500
  'Series D':  '#d946ef', // fuchsia-500
  'Series E':  '#ec4899', // pink-500
  'Growth':    '#10b981', // emerald-500
  'Bridge':    '#6b7280', // gray-500
  'Debt':      '#374151', // gray-700
  'Grant':     '#14b8a6', // teal-500
  'Pre-IPO':   '#0ea5e9', // sky-500
};
const DEFAULT_BAR_COLOR = '#D0A848'; // OpenI gold

// Format ISO date → "Jan 2024" for X-axis labels
function fmtMonthYear(d) {
  if (!d) return '';
  try {
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return '';
    return dt.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
  } catch { return ''; }
}

function FundingChart({ rounds }) {
  const [tooltip, setTooltip] = React.useState(null); // {x, y, round, amountCr, isApprox}

  // Phase 92.1 - normalize via amountToDisplay so per-currency units work.
  // Each item carries _value (in big-unit), _bigUnit (Cr or M), _currency,
  // _displayLabel (what user typed), _isApprox (true when bracket-derived
  // or heuristic-resolved unit).
  const items = (rounds || [])
    .map(r => {
      const amt = amountToDisplay(r);
      return amt ? {
        ...r,
        _value: amt.value,
        _bigUnit: amt.bigUnit,
        _currency: amt.currency,
        _displayLabel: amt.displayLabel,
        _isApprox: amt.isApprox,
      } : null;
    })
    .filter(Boolean)
    .sort((a, b) => {
      const da = a.round_date ? new Date(a.round_date).getTime() : 0;
      const db = b.round_date ? new Date(b.round_date).getTime() : 0;
      return da - db;
    });

  if (items.length === 0) return null; // no chartable rounds

  // Total funding by currency (chart sums values within the same currency
  // family because Cr and M are different scales). For mixed-currency
  // portfolios, callout shows the dominant currency total + a note.
  const totalsByCur = {};
  items.forEach(r => {
    if (!totalsByCur[r._currency]) totalsByCur[r._currency] = { value: 0, bigUnit: r._bigUnit };
    totalsByCur[r._currency].value += r._value;
  });
  const currencies = Object.keys(totalsByCur);
  const dominantCur = currencies.reduce((a, b) =>
    (totalsByCur[a].value > totalsByCur[b].value) ? a : b, currencies[0]
  );
  const dominantTotal = totalsByCur[dominantCur];
  const anyApprox = items.some(r => r._isApprox);
  const isMixedCur = currencies.length > 1;

  // SVG geometry
  const W = 800, H = 280;
  const padL = 56, padR = 24, padT = 36, padB = 56;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const maxVal = Math.max(...items.map(r => r._value));
  // Round Y-axis max up to a clean number (10/25/50/100/250/500/1000/...)
  const niceMax = (m => {
    const candidates = [1, 2.5, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];
    for (const c of candidates) if (m <= c) return c;
    return Math.ceil(m / 1000) * 1000;
  })(maxVal);

  const n = items.length;
  const barGap = 12;
  const barWidth = Math.min(64, (plotW - barGap * (n - 1)) / n);
  const barSlot = barWidth + barGap;
  const totalBarsW = n * barWidth + (n - 1) * barGap;
  const startX = padL + (plotW - totalBarsW) / 2; // center group horizontally

  // Y-axis ticks: 0, 25%, 50%, 75%, 100%. Labels use dominant currency's
  // big-unit (Cr for INR portfolios, M for USD/EUR/GBP). Cross-currency
  // mixed portfolios still use the dominant currency axis - other currency
  // bars are visually scaled by their own big-unit value but tooltip shows
  // their native currency + unit.
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(t => ({
    val: niceMax * t,
    y: padT + plotH * (1 - t),
  }));
  const yUnit = dominantTotal.bigUnit;
  const ySym = CURRENCY_SYMBOL[dominantCur] || dominantCur;

  return (
    <div className="mb-4">
      {/* Phase 92.1 - currency-aware total callout. Shows dominant currency's total.
          For mixed-currency portfolios, adds a small note below. */}
      <div className="flex items-baseline justify-between mb-3 px-1">
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">
            Total raised{anyApprox ? ' (approx)' : ''}{isMixedCur ? ` (${dominantCur} portion)` : ''}
          </div>
          <div className="text-2xl font-display font-bold text-gray-900 mt-0.5">
            {CURRENCY_SYMBOL[dominantCur] || dominantCur}{dominantTotal.value >= 1000 ? `${(dominantTotal.value/1000).toFixed(1)}K` : dominantTotal.value >= 100 ? Math.round(dominantTotal.value) : dominantTotal.value.toFixed(1)} {dominantTotal.bigUnit}
          </div>
          {isMixedCur && (
            <div className="text-[10px] text-gray-400 mt-0.5">
              + {currencies.filter(c => c !== dominantCur).map(c => `${CURRENCY_SYMBOL[c] || c}${totalsByCur[c].value.toFixed(1)} ${totalsByCur[c].bigUnit}`).join(', ')}
            </div>
          )}
        </div>
        <div className="text-xs text-gray-500">
          {n} round{n === 1 ? '' : 's'}
        </div>
      </div>

      {/* SVG chart */}
      <div className="relative" style={{ width: '100%' }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ width: '100%', height: 'auto' }}
          className="bg-gray-50 rounded-lg border border-gray-200"
        >
          {/* Y-axis grid lines + labels */}
          {yTicks.map((t, i) => (
            <g key={i}>
              <line
                x1={padL} y1={t.y} x2={W - padR} y2={t.y}
                stroke={i === 0 ? '#9ca3af' : '#e5e7eb'}
                strokeWidth={i === 0 ? 1 : 0.5}
                strokeDasharray={i === 0 ? 'none' : '2 3'}
              />
              <text
                x={padL - 8} y={t.y + 4}
                textAnchor="end" fontSize="10" fill="#6b7280"
              >
                {ySym}{t.val >= 1000 ? `${(t.val/1000).toFixed(1)}K` : t.val >= 100 ? Math.round(t.val) : t.val >= 10 ? t.val.toFixed(0) : t.val.toFixed(1)} {yUnit}
              </text>
            </g>
          ))}

          {/* Bars */}
          {items.map((r, i) => {
            const barH = (r._value / niceMax) * plotH;
            const x = startX + i * barSlot;
            const y = padT + plotH - barH;
            const color = STAGE_COLORS[r.round_type] || DEFAULT_BAR_COLOR;
            return (
              <g key={r.id || i}>
                {/* Bar */}
                <rect
                  x={x} y={y} width={barWidth} height={barH}
                  fill={color} rx={3}
                  style={{ cursor: 'pointer', transition: 'opacity 0.15s' }}
                  opacity={tooltip && tooltip.idx !== i ? 0.5 : 1}
                  onMouseEnter={() => setTooltip({ idx: i, round: r, x: x + barWidth / 2, y })}
                  onMouseLeave={() => setTooltip(null)}
                  onClick={() => setTooltip(t => t && t.idx === i ? null : { idx: i, round: r, x: x + barWidth / 2, y })}
                />
                {/* Bar value label (only if bar is tall enough) - shows user's native amount + unit */}
                {barH > 24 && (
                  <text
                    x={x + barWidth / 2} y={y - 4}
                    textAnchor="middle" fontSize="10" fontWeight="600" fill="#374151"
                  >
                    {r._displayLabel}
                  </text>
                )}
                {/* X-axis date label */}
                <text
                  x={x + barWidth / 2} y={H - padB + 16}
                  textAnchor="middle" fontSize="10" fill="#6b7280"
                >
                  {fmtMonthYear(r.round_date)}
                </text>
                {/* X-axis stage label (under date, smaller) */}
                <text
                  x={x + barWidth / 2} y={H - padB + 30}
                  textAnchor="middle" fontSize="9" fontWeight="500"
                  fill={color}
                >
                  {r.round_type || r.round_name || ''}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Tooltip - HTML overlay outside SVG for richer text */}
        {tooltip && (() => {
          const r = tooltip.round;
          // Position tooltip above the bar; SVG is responsive so use percent
          const xPct = (tooltip.x / W) * 100;
          const yPct = (tooltip.y / H) * 100;
          return (
            <div
              className="absolute pointer-events-none bg-gray-900 text-white text-xs rounded-md px-3 py-2 shadow-lg"
              style={{
                left: `${xPct}%`,
                top: `${yPct}%`,
                transform: 'translate(-50%, -110%)',
                whiteSpace: 'nowrap',
                zIndex: 10,
              }}
            >
              <div className="font-semibold">{r.round_type || r.round_name || 'Round'}</div>
              {r.round_date && (
                <div className="text-gray-300">{new Date(r.round_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
              )}
              {r.lead_investor && (
                <div className="text-gray-300">Led by {r.lead_investor}</div>
              )}
              <div className="font-semibold mt-1" style={{ color: STAGE_COLORS[r.round_type] || DEFAULT_BAR_COLOR }}>
                {r._displayLabel}{r._isApprox ? ' (approx)' : ''}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

// ── Per-section row components (Phase 90) ─────────────────────────────

function TeamRow({ row }) {
  const meta = [];
  if (row.designation) meta.push(row.designation);
  if (row.role && row.role !== row.designation) meta.push(row.role);
  if (row.is_founder)  meta.push(<Badge tone="green">Founder</Badge>);
  if (row.is_advisory) meta.push(<Badge tone="amber">Advisory</Badge>);

  return (
    <RowCard>
      <RowHeader primary={row.name || 'Team member'} meta={meta} />
      {row.bio && (
        <p className="text-xs text-gray-600 mt-1.5 line-clamp-3">{row.bio}</p>
      )}
      {(row.linkedin_url || row.twitter_url) && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          <UrlChip href={row.linkedin_url} icon={ExternalLink} label="LinkedIn" />
          <UrlChip href={row.twitter_url}  icon={ExternalLink} label="X (Twitter)" />
        </div>
      )}
      <FallbackFields row={row} slotted={['name','designation','role','is_founder','is_advisory','bio','linkedin_url','twitter_url']} />
    </RowCard>
  );
}

function ProductRow({ row }) {
  const meta = [];
  if (row.pricing_model) meta.push(<Badge tone="primary">{row.pricing_model}</Badge>);
  if (row.launch_date)   meta.push(<span className="inline-flex items-center gap-1"><Calendar size={11} />{fmtDate(row.launch_date)}</span>);
  const productUrl = row.url || row.product_url;

  return (
    <RowCard>
      <RowHeader primary={row.name || row.product_name || 'Product'} meta={meta} />
      {row.tagline && (
        <p className="text-xs text-primary-700 font-medium mt-1">{row.tagline}</p>
      )}
      {row.description && (
        <p className="text-xs text-gray-600 mt-1.5 line-clamp-3">{row.description}</p>
      )}
      {productUrl && (
        <div className="mt-2">
          <UrlChip href={productUrl} icon={ExternalLink} label="Visit Product" />
        </div>
      )}
      <FallbackFields row={row} slotted={['name','product_name','tagline','description','launch_date','pricing_model','url','product_url']} />
    </RowCard>
  );
}

function FundingRow({ row }) {
  const meta = [];
  if (row.round_date)    meta.push(<span className="inline-flex items-center gap-1"><Calendar size={11} />{fmtDate(row.round_date)}</span>);
  if (row.lead_investor) meta.push(`Led by ${row.lead_investor}`);
  // Phase 92.1.3 (T17c) - valuation as secondary meta line under round info.
  // Falls back to row.currency when valuation_at_round_currency is null (some
  // legacy rows may have currency on the round but not the valuation).
  const valDisplay = valuationToDisplay(row);
  if (valDisplay) meta.push(<span className="text-gray-600">Valued at <span className="font-semibold">{valDisplay}</span></span>);

  // Phase 92.1 - render money via amountToDisplay so list view shows the
  // same currency + unit format as the chart (e.g. "Rs10 Cr" or "$5 M").
  let moneyEl = null;
  const amt = amountToDisplay(row);
  if (amt) {
    moneyEl = <MoneyPill value={amt.displayLabel} />;
  }

  return (
    <RowCard>
      <RowHeader
        primary={row.round_name || row.round_type || 'Funding round'}
        meta={meta}
        right={moneyEl}
      />
      <FallbackFields row={row} slotted={['round_name','round_type','round_date','lead_investor','amount','amount_unit','amount_range','currency','valuation_at_round','valuation_at_round_unit','valuation_at_round_currency']} />
    </RowCard>
  );
}

function ClientsRow({ row }) {
  const meta = [];
  if (row.industry) meta.push(<Badge tone="blue">{row.industry}</Badge>);

  return (
    <RowCard>
      <div className="flex items-center gap-3">
        <LogoImg src={row.logo_url} size={40} />
        <div className="flex-1 min-w-0">
          <RowHeader primary={row.client_name || row.name || 'Client'} meta={meta} />
        </div>
      </div>
      <FallbackFields row={row} slotted={['client_name','name','industry','logo_url']} />
    </RowCard>
  );
}

function PatentsRow({ row }) {
  const meta = [];
  if (row.status)         meta.push(<StatusBadge status={row.status} />);
  if (row.patent_number)  meta.push(<span className="font-mono">{row.patent_number}</span>);
  if (row.filing_date)    meta.push(<span className="inline-flex items-center gap-1"><Calendar size={11} />Filed {fmtDate(row.filing_date)}</span>);

  return (
    <RowCard>
      <RowHeader primary={row.title || 'Patent'} meta={meta} />
      {row.abstract && (
        <p className="text-xs text-gray-600 mt-1.5 line-clamp-3">{row.abstract}</p>
      )}
      {row.url && (
        <div className="mt-2">
          <UrlChip href={row.url} icon={FileText} label="View Patent" />
        </div>
      )}
      <FallbackFields row={row} slotted={['title','status','patent_number','filing_date','abstract','url']} />
    </RowCard>
  );
}

function CompetitorsRow({ row }) {
  const meta = [];
  if (row.sector)   meta.push(<Badge tone="primary">{row.sector}</Badge>);
  if (row.country)  meta.push(<span className="inline-flex items-center gap-1"><Globe size={11} />{row.country}</span>);

  return (
    <RowCard>
      <RowHeader primary={row.competitor_name || row.name || 'Competitor'} meta={meta} />
      {(row.description || row.differentiation) && (
        <p className="text-xs text-gray-600 mt-1.5 line-clamp-3">{row.description || row.differentiation}</p>
      )}
      {row.website && (
        <div className="mt-2">
          <UrlChip href={row.website} icon={Globe} label="Visit Site" />
        </div>
      )}
      <FallbackFields row={row} slotted={['competitor_name','name','sector','country','description','differentiation','website']} />
    </RowCard>
  );
}

function NewsRow({ row }) {
  const meta = [];
  if (row.source)         meta.push(row.source);
  if (row.published_date) meta.push(fmtDate(row.published_date));
  const href = row.url || row.link;

  // News title is the primary action — make whole header clickable when href exists.
  const titleEl = href ? (
    <a
      href={href.startsWith('http') ? href : `https://${href}`}
      target="_blank"
      rel="noopener noreferrer"
      className="hover:text-primary-600 transition-colors"
    >
      {row.title || row.headline || 'Article'}
    </a>
  ) : (row.title || row.headline || 'Article');

  return (
    <RowCard>
      <RowHeader primary={titleEl} meta={meta} />
      {href && (
        <div className="mt-2">
          <UrlChip href={href} icon={ExternalLink} label="Read Article" />
        </div>
      )}
      <FallbackFields row={row} slotted={['title','headline','source','published_date','url','link']} />
    </RowCard>
  );
}

function AcquisitionsRow({ row }) {
  const meta = [];
  if (row.acquisition_date) meta.push(<span className="inline-flex items-center gap-1"><Calendar size={11} />{fmtDate(row.acquisition_date)}</span>);

  // Phase 92.1 - same display fix as FundingRow
  let moneyEl = null;
  const amt = amountToDisplay(row);
  if (amt) {
    moneyEl = <MoneyPill value={amt.displayLabel} />;
  }

  return (
    <RowCard>
      <RowHeader
        primary={row.acquired_company || row.acquirer || row.target || 'Acquisition'}
        meta={meta}
        right={moneyEl}
      />
      <FallbackFields row={row} slotted={['acquired_company','acquirer','target','acquisition_date','amount','amount_unit','amount_range','currency']} />
    </RowCard>
  );
}

// Dispatcher — picks the right row component for each section type.
function SubSectionRow({ sectionKey, row }) {
  switch (sectionKey) {
    case 'team':         return <TeamRow row={row} />;
    case 'products':     return <ProductRow row={row} />;
    case 'funding':      return <FundingRow row={row} />;
    case 'clients':      return <ClientsRow row={row} />;
    case 'patents':      return <PatentsRow row={row} />;
    case 'competitors':  return <CompetitorsRow row={row} />;
    case 'news':         return <NewsRow row={row} />;
    case 'acquisitions': return <AcquisitionsRow row={row} />;
    default:
      // Defensive fallback — shouldn't fire, but keeps render-everything intact
      // for any hypothetical new sub-section type added later.
      return (
        <RowCard>
          <RowHeader primary={row.name || row.title || 'Entry'} meta={[]} />
          <FallbackFields row={row} slotted={[]} />
        </RowCard>
      );
  }
}

// Phase 92.1 (T17b) - per-section card with chart/list toggle.
// Toggle only meaningful for funding section (where the chart exists).
// Other sections render as plain row lists.
function FundingSectionCard({ section }) {
  const s = section;
  const isFunding = s.key === 'funding';
  const [view, setView] = React.useState('chart'); // 'chart' | 'list'
  const showChart = isFunding && view === 'chart';
  const showList  = !isFunding || view === 'list';

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-display font-bold text-gray-900">{s.title}</h3>
          <Badge tone="gray">{s.rows.length}</Badge>
        </div>
        {isFunding && (
          <div className="flex items-center gap-1 bg-gray-100 rounded-md p-0.5">
            <button
              onClick={() => setView('chart')}
              className={`p-1.5 rounded transition-colors ${view === 'chart' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
              title="Chart view"
              aria-label="Chart view"
            >
              <BarChart3 size={14} />
            </button>
            <button
              onClick={() => setView('list')}
              className={`p-1.5 rounded transition-colors ${view === 'list' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
              title="List view"
              aria-label="List view"
            >
              <List size={14} />
            </button>
          </div>
        )}
      </div>
      {showChart && <FundingChart rounds={s.rows} />}
      {showList && (
        <div className="space-y-1">
          {s.rows.map((r, i) => (
            <SubSectionRow key={r.id || i} sectionKey={s.key} row={r} />
          ))}
        </div>
      )}
    </div>
  );
}

function StartupSubSections({ data }) {
  if (!data) return null;
  const sections = SUBSECTION_DEFS
    .map(s => ({ ...s, rows: Array.isArray(data[s.key]) ? data[s.key] : [] }))
    .filter(s => s.rows.length > 0);
  if (sections.length === 0) return null;
  return (
    <div className="space-y-4">
      {sections.map(s => (
        <FundingSectionCard key={s.key} section={s} />
      ))}
    </div>
  );
}

function EmptySection({ message }) {
  return <p className="text-gray-400 text-sm py-4 text-center">{message}</p>;
}

/**
 * J10 (s50): Claim Startup Modal
 *
 * - Fires `POST /claims/request` with { target_startup_user_id, verification_evidence }.
 * - Backend auto-detects domain match: matching email domain -> domain_auto path
 *   (sends confirmation email); non-matching -> admin_manual path (admin reviews).
 * - Both paths surface in MyClaims at /dashboard/my-claims.
 * - User must explain their relationship to the startup (founder/employee/etc) so an
 *   admin reviewer can decide on the admin_manual path. The text is also retained as
 *   audit trail on the domain_auto path.
 */
function ClaimStartupModal({ open, onClose, startup, onSuccess }) {
  const [evidence, setEvidence] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const submit = async () => {
    if (evidence.trim().length < 20) {
      toast.error('Please describe your relationship to this startup (at least 20 characters)');
      return;
    }
    setSubmitting(true);
    try {
      const res = await claimAPI.request({
        target_startup_user_id: startup.user_id,
        verification_evidence: evidence.trim(),
      });
      // Backend returns { claim_id, status, verification_method, next_step }
      // Status will be 'email_sent' on domain-auto path or 'pending' on admin-manual path.
      if (res?.status === 'email_sent') {
        toast.success('Claim submitted — check your email to confirm');
      } else {
        toast.success('Claim submitted — awaiting admin review');
      }
      onSuccess?.(res);
      onClose();
    } catch (err) {
      // 409 duplicate or already-claimed; 403 not eligible
      toast.error(err?.message || 'Failed to submit claim');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(13,33,55,0.55)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: '#FFF8E6' }}>
              <Flag size={18} style={{ color: '#B45309' }} />
            </div>
            <div>
              <h2 className="text-base font-display font-bold text-gray-900">
                Claim {startup.company_name || 'this startup'}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Tell us how you&rsquo;re affiliated with this profile
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Info strip */}
        <div className="rounded-lg p-3 mb-4 text-xs flex gap-2 items-start"
             style={{ background: '#EFF6FF', color: '#1E40AF', border: '1px solid #BFDBFE' }}>
          <Mail size={14} className="flex-shrink-0 mt-0.5" />
          <div>
            If your email domain matches the startup&rsquo;s website, we&rsquo;ll email you a
            confirmation link. Otherwise, an admin will review your request manually.
          </div>
        </div>

        {/* Evidence */}
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
          Your relationship to this startup <span className="text-red-500">*</span>
        </label>
        <textarea
          value={evidence}
          onChange={e => setEvidence(e.target.value)}
          rows={5}
          placeholder="e.g. I'm the founder/CTO/employee of this company. My LinkedIn: https://… Press mention: https://…"
          className="w-full text-sm border rounded-lg p-3 outline-none focus:ring-2 focus:ring-amber-200"
          style={{ borderColor: '#E5E7EB' }}
          maxLength={2000}
          disabled={submitting}
        />
        <div className="flex justify-between text-[11px] text-gray-400 mt-1 mb-4">
          <span>Include role, LinkedIn URL, press cross-references where possible</span>
          <span>{evidence.length}/2000</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={submitting || evidence.trim().length < 20}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            style={{ background: '#D0A848', color: '#fff' }}
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Flag size={14} />}
            {submitting ? 'Submitting…' : 'Submit Claim'}
          </button>
        </div>
      </div>
    </div>
  );
}

const CLAIM_ELIGIBLE_ROLES = new Set(['startup', 'student', 'academia']);
function userIsClaimEligible(user) {
  if (!user) return false;
  const roles = Array.isArray(user.roles) && user.roles.length ? user.roles : (user.role ? [user.role] : []);
  return roles.some(r => CLAIM_ELIGIBLE_ROLES.has(r));
}

export default function StartupProfile() {
  const navigate = useNavigate();
  const { id } = useParams();
  // s50 (J10 follow-up): callers can pass ?by=user_id to disambiguate the
  // id-vs-user_id collision (independent SERIAL sequences in startup_profiles).
  const [searchParams] = useSearchParams();
  const lookupBy = searchParams.get('by') || undefined;
  const [startup, setStartup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  const [watchlisted, setWatchlisted] = useState(false);
  // Phase 99q: Watchlist picker modal (bookmark button)
  const [wlOpen, setWlOpen] = useState(false);
  const [wlLists, setWlLists] = useState([]);          // editable lists [{id,name,my_role,contains}]
  const [wlLoading, setWlLoading] = useState(false);
  const [wlBusyId, setWlBusyId] = useState(null);      // list id currently mutating
  const [wlNewName, setWlNewName] = useState('');
  const [wlCreating, setWlCreating] = useState(false);
  // J10 (s50): Claim flow
  const { user } = useAuth();

  // Phase 110: Share modal state (Share button at top of page opens this)
  const [shareOpen, setShareOpen] = useState(false);
  const [shareTab, setShareTab] = useState('pdf'); // 'pdf' | 'link' | 'email'
  const [shareMode] = useState('full'); // for 'link' tab
  const [shareList, setShareList] = useState([]);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareMinting, setShareMinting] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [shareEmailBusy] = useState(false);
  const [shareEmailMessage, setShareEmailMessage] = useState('');

  // Phase 110: Share handlers
  // Phase 99q follow-up: the share endpoints are userId-keyed, and the route
  // :id may be a startup_profiles.id (NOT a user_id) when loaded via ?by=.
  // Always derive ownership + the share-API key from the loaded startup's
  // user_id so the Link/Email tabs appear for the legitimate owner/admin.
  const shareOwnerId = startup?.user_id;
  const shareIsOwner = user && shareOwnerId != null && (user.id === shareOwnerId || user.role === 'admin');
  const LinkIconShare = ({ size }) => <Globe size={size} />;

  const openShareModal = async () => {
    setShareOpen(true);
    setShareTab('pdf');
    // Login-gated invite: any signed-in member can mint a link. Pre-load any
    // existing share links for this profile (keyed by the profile's user_id).
    if (shareOwnerId != null) {
      setShareLoading(true);
      try {
        const r = await startupProfileShareAPI.listShares(shareOwnerId);
        setShareList(Array.isArray(r) ? r : []);
      } catch (err) {
        setShareList([]);
      } finally {
        setShareLoading(false);
      }
    }
  };

  // Phase 99q: Watchlist picker — load my editable lists and flag which already contain this startup.
  // Uses startup.id (= startup_profiles.id), NOT the route :id (which may be a user_id).
  const loadWatchlists = async () => {
    const sid = startup?.id;
    if (!sid) return;
    setWlLoading(true);
    try {
      const lists = await watchlistAPI.list();
      const editable = (Array.isArray(lists) ? lists : []).filter(l => l.my_role !== 'viewer');
      // For each editable list, check membership via full fetch (returns joined startups).
      const withMembership = await Promise.all(editable.map(async (l) => {
        try {
          const full = await watchlistAPI.get(l.id);
          const ids = (full.startups || []).map(s => s.id || s.startup_id || s);
          return { ...l, contains: ids.includes(sid) };
        } catch (_) {
          return { ...l, contains: false };
        }
      }));
      setWlLists(withMembership);
      setWatchlisted(withMembership.some(l => l.contains));
    } catch (err) {
      setWlLists([]);
    } finally {
      setWlLoading(false);
    }
  };

  const openWatchlistModal = async () => {
    setWlOpen(true);
    await loadWatchlists();
  };

  const toggleInList = async (list) => {
    const sid = startup?.id;
    if (!sid) return;
    setWlBusyId(list.id);
    try {
      if (list.contains) {
        await watchlistAPI.removeStartup(list.id, sid);
        toast.success(`Removed from "${list.name}"`);
      } else {
        await watchlistAPI.addStartup(list.id, sid);
        toast.success(`Saved to "${list.name}"`);
      }
      setWlLists(prev => {
        const next = prev.map(l => l.id === list.id ? { ...l, contains: !l.contains } : l);
        setWatchlisted(next.some(l => l.contains));
        return next;
      });
    } catch (err) {
      toast.error(err?.message || 'Could not update watchlist');
    } finally {
      setWlBusyId(null);
    }
  };

  const createAndAdd = async () => {
    const sid = startup?.id;
    const name = wlNewName.trim();
    if (!name || !sid) return;
    setWlCreating(true);
    try {
      const created = await watchlistAPI.create({ name });
      await watchlistAPI.addStartup(created.id, sid);
      toast.success(`Created "${name}" and saved`);
      setWlNewName('');
      await loadWatchlists();
    } catch (err) {
      toast.error(err?.message || 'Could not create list');
    } finally {
      setWlCreating(false);
    }
  };

  const downloadStartupPdf = async () => {
    try {
      const url = startupProfileShareAPI.pdfUrl(shareOwnerId ?? id);
      const res = await fetch(url, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (!res.ok) throw new Error('PDF download failed');
      const blob = await res.blob();
      const dlUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = dlUrl;
      a.download = `startup-profile-${shareOwnerId ?? id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(dlUrl);
      toast.success('PDF downloaded');
    } catch (err) {
      toast.error(err.message || 'Failed to download PDF');
    }
  };

  const mintNewProfileShare = async () => {
    if (shareOwnerId == null) {
      toast.error('Cannot create a share link before the profile finishes loading');
      return;
    }
    setShareMinting(true);
    try {
      const r = await startupProfileShareAPI.createShare(shareOwnerId, { redaction_mode: shareMode });
      setShareList(prev => [r, ...prev]);
      toast.success(`Created ${shareMode} share link`);
    } catch (err) {
      toast.error(err?.message || 'Failed to create share');
    } finally {
      setShareMinting(false);
    }
  };

  const copyShareLink = async (token) => {
    const url = `${window.location.origin}/share/startup/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied');
    } catch {
      toast.error('Copy failed — please select and copy manually');
    }
  };

  const revokeProfileShare = async (shareId) => {
    if (!confirm('Revoke this share link? Anyone who already has it will lose access.')) return;
    try {
      await startupProfileShareAPI.revokeShare(shareId);
      setShareList(prev => prev.map(s => s.id === shareId ? { ...s, revoked_at: new Date().toISOString() } : s));
      toast.success('Share link revoked');
    } catch (err) {
      toast.error(err?.message || 'Failed to revoke');
    }
  };

  const sendProfileEmailInvite = async () => {
    // Uses the pendingInviteService.createPendingInvite endpoint via a new
    // hard-to-find /api/startup-profile/:userId/email-invite handler that
    // doesn't exist YET (deferred to a Phase 110b ship if cohort asks).
    // For now: surface a friendly placeholder.
    toast.error('Email invite path is being wired in a follow-up ship. Use the Public link option for now.');
  };


  const [claimOpen, setClaimOpen] = useState(false);
  const [claimSubmitted, setClaimSubmitted] = useState(false);
  // Phase 87f — child sub-sections (team / products / funding / clients /
  // patents / competitors / news / acquisitions). Read-only render for
  // corporates and other personas evaluating a startup.
  const [childSections, setChildSections] = useState(null);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    startupAPI.get(id, { by: lookupBy })
      .then(data => {
        const s = data.startup || data;
        setStartup(s);
        // Record profile view (fire-and-forget, server dedups per day)
        if (s?.user_id) {
          profileViewAPI.recordView(s.user_id).catch(() => {});
        }
      })
      .catch(err => {
        toast.error(err.message || 'Failed to load startup profile');
        setStartup(null);
      })
      .finally(() => setLoading(false));
  }, [id, lookupBy]);

  // Phase 87f — fetch 8 child sub-section tables once we have the user_id.
  // Backend endpoint /api/startup-profile/public/:userId returns parent
  // fields + all 8 child arrays in one shot.
  useEffect(() => {
    const uid = startup?.user_id;
    if (!uid) return;
    startupProfileAPI.getFullProfile(uid)
      .then(full => setChildSections({
        team:         Array.isArray(full?.team)            ? full.team            : [],
        products:     Array.isArray(full?.products)        ? full.products        : [],
        funding:      Array.isArray(full?.funding_rounds)  ? full.funding_rounds  : [],
        clients:      Array.isArray(full?.clients)         ? full.clients         : [],
        patents:      Array.isArray(full?.patents)         ? full.patents         : [],
        competitors:  Array.isArray(full?.competitors)     ? full.competitors     : [],
        news:         Array.isArray(full?.news)            ? full.news            : [],
        acquisitions: Array.isArray(full?.acquisitions)    ? full.acquisitions    : [],
      }))
      .catch(() => setChildSections(null));
  }, [startup?.user_id]);

  if (loading) return <LoadingSkeleton type="card" />;
  if (!startup) return (
    <div className="bg-gray-50 min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Startup not found.</p>
    </div>
  );

  // Derived display values
  const name = startup.company_name || startup.name || '';
  const initials = name.split(' ').map(w => w?.[0]).join('').slice(0, 2).toUpperCase() || '??';
  const location = [startup.city, startup.state, startup.country].filter(Boolean).join(', ');
  const trl = startup.tech_readiness || 0;
  // Phase 92.3 ship 3/3 (T23 display) - use amountToDisplay helper to render
  // Funding Raised with the new funding_raised_unit + funding_raised_currency.
  // Falls back to formatFunding (Phase 84 bracket label or raw NUMERIC) for
  // legacy startups with no unit set (display heuristic kicks in: NULL unit
  // means INR=Cr, USD=M per amountToDisplay).
  const fundingRow = {
    amount: startup.funding_raised,
    amount_unit: startup.funding_raised_unit,
    currency: startup.funding_raised_currency,
    amount_range: startup.funding_raised_range,  // Phase 84 fallback
  };
  const fundingDisplay = amountToDisplay(fundingRow);
  const funding = fundingDisplay
    ? fundingDisplay.displayLabel
    : formatFunding(startup.funding_raised, startup.funding_raised_currency, startup.funding_raised_range);
  const valuation = formatFunding(startup.valuation, startup.valuation_currency, startup.valuation_range);
  const technologies = Array.isArray(startup.technologies) ? startup.technologies : [];
  const focusAreas = Array.isArray(startup.focus_areas) ? startup.focus_areas : [];
  const investors = Array.isArray(startup.investor_names) ? startup.investor_names : [];
  const awards = Array.isArray(startup.awards) ? startup.awards : (typeof startup.awards === 'string' ? startup.awards.split(',').map(a => a.trim()).filter(Boolean) : []);

  const TABS = ['Overview', 'Technology', 'Financials'];

  return (
    <div id="tour-page-startup-profile" className="bg-gray-50 min-h-screen">
      {/* Back nav */}
      <div className="bg-dark-950 border-b border-dark-800 px-6 py-2">
        <button onClick={() => navigate('/dashboard/startups')} className="text-dark-400 hover:text-white text-sm flex items-center gap-1 transition-colors">
          ← Back to Startups
        </button>
      </div>

      {/* Header Banner */}
      <div className="bg-dark-950 border-b border-dark-800">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-center gap-5">
              {startup.logo_url ? (
                <img src={startup.logo_url} alt="" className="w-16 h-16 rounded-2xl object-cover flex-shrink-0" />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-primary-500 flex items-center justify-center text-dark-950 text-xl font-display font-bold flex-shrink-0">
                  {initials}
                </div>
              )}
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-white text-2xl font-display font-bold">{name}</h1>
                  {startup.is_deeptech && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-primary-500/20 text-primary-400 text-xs font-semibold rounded-full border border-primary-500/30">
                      <Cpu size={11} /> DeepTech
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1.5 text-dark-400 text-sm flex-wrap">
                  {location && <span className="flex items-center gap-1"><MapPin size={13} /> {location}</span>}
                  {startup.sector && <span className="flex items-center gap-1"><Building2 size={13} /> {startup.sector}</span>}
                  {startup.founded_year && <span className="flex items-center gap-1"><Calendar size={13} /> Founded {startup.founded_year}</span>}
                </div>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <TechReadinessBadge trl={trl} />
                  {startup.stage && <span className="px-2.5 py-1 bg-dark-800 text-dark-300 text-xs rounded-lg">{startup.stage}</span>}
                  {startup.business_model && <span className="px-2.5 py-1 bg-dark-800 text-primary-400 text-xs rounded-lg">{startup.business_model}</span>}
                  {startup.import_metadata?.cluster_label && (
                    <span
                      title="Auto-assigned semantic cluster (s21 K=100)"
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-dark-800 text-amber-300 text-xs rounded-lg border border-amber-500/20"
                    >
                      <Sparkles size={11} />
                      <span className="font-mono">{startup.import_metadata.cluster_label}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* J10 (s50): Claim CTA — visible only if startup is imported, unclaimed,
                  not the viewer's own row, and viewer has a claim-eligible role.
                  Submitted state shows a static "Claim Pending" pill. */}
              {claimSubmitted ? (
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold"
                  style={{ background: '#FFF8E6', borderColor: '#FCD34D', color: '#B45309' }}
                  title="We received your claim — check My Claims for status"
                >
                  <CheckCircle2 size={13} /> Claim Submitted
                </span>
              ) : (
                user
                && startup.is_imported
                && !startup.claimed_at
                && startup.user_id !== user.id
                && userIsClaimEligible(user)
                && (
                  <button
                    onClick={() => setClaimOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{ background: '#D0A848', color: '#0D2137' }}
                    title="Claim ownership of this profile"
                  >
                    <Flag size={13} /> Claim This Profile
                  </button>
                )
              )}
              <button onClick={() => openWatchlistModal()} title="Save to watchlist" className={`p-2 rounded-lg border transition-all ${watchlisted ? 'border-primary-500 bg-primary-500/20 text-primary-400' : 'border-dark-700 text-dark-400 hover:border-primary-500 hover:text-primary-400'}`}>
                {watchlisted ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
              </button>
              <button onClick={() => openShareModal()} className="p-2 rounded-lg border border-dark-700 text-dark-400 hover:border-primary-500 hover:text-primary-400 transition-all" title="Share this profile">
                <Share2 size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex gap-0 overflow-x-auto">
            {TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-3.5 text-sm font-medium border-b-2 whitespace-nowrap transition-all ${activeTab === tab ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">

            {/* Overview */}
            {activeTab === 'Overview' && (
              <>
                {/* About */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="font-display font-bold text-gray-900 mb-3">About</h3>
                  {startup.tagline && startup.tagline !== startup.description && (
                    <p className="text-primary-700 text-sm font-medium mb-2">{startup.tagline}</p>
                  )}
                  <p className="text-gray-700 text-sm leading-relaxed">{startup.description || 'No description available.'}</p>
                  {startup.mission && (
                    <div className="mt-4 p-3 bg-primary-50 rounded-lg border border-primary-100">
                      <span className="text-xs font-semibold text-primary-600 uppercase">Mission</span>
                      <p className="text-sm text-primary-800 mt-1">{startup.mission}</p>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {(technologies.length > 0 || focusAreas.length > 0) && (
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="font-display font-bold text-gray-900 mb-3">Focus Areas & Technologies</h3>
                    <div className="flex gap-2 flex-wrap">
                      {startup.sector && <span className="px-3 py-1 bg-primary-50 text-primary-700 text-xs rounded-full border border-primary-200">{startup.sector}</span>}
                      {technologies.map(t => (
                        <span key={t} className="px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200">{t}</span>
                      ))}
                      {focusAreas.map(f => (
                        <span key={f} className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">{f}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Investors */}
                {investors.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="font-display font-bold text-gray-900 mb-4">Investors</h3>
                    <div className="flex gap-2 flex-wrap">
                      {investors.map((inv, i) => (
                        <span key={i} className="px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg">{typeof inv === 'string' ? inv : inv.name}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Awards */}
                {awards.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="font-display font-bold text-gray-900 mb-4">Awards & Recognition</h3>
                    <div className="space-y-2">
                      {awards.map((a, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <Award size={16} className="text-yellow-600 flex-shrink-0" />
                          <span className="text-sm font-medium text-yellow-800">{typeof a === 'string' ? a : a.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Technology */}
            {activeTab === 'Technology' && (
              <>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="font-display font-bold text-gray-900 mb-4">Technology Profile</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      startup.sector && ['Sector', startup.sector],
                      technologies.length > 0 && ['Technologies', technologies.join(', ')],
                      startup.product_type && ['Product Type', startup.product_type],
                      startup.business_model && ['Business Model', startup.business_model],
                      trl > 0 && ['Tech Readiness', `Level ${trl}`],
                      startup.startup_type && ['Startup Type', startup.startup_type],
                    ].filter(Boolean).map(([k, v]) => (
                      <div key={k} className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-xs text-gray-500 mb-0.5">{k}</div>
                        <div className="text-sm font-semibold text-gray-800">{v}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {trl > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="font-display font-bold text-gray-900 mb-3" title={TRL_TOOLTIP}>Tech Readiness Progression</h3>
                    <div className="flex gap-1 mt-4">
                      {[1,2,3,4,5,6,7,8,9].map(level => (
                        <div key={level} className="flex-1">
                          <div className={`h-8 rounded flex items-center justify-center text-xs font-bold transition-all ${level <= trl ? 'bg-primary-500 text-dark-950' : 'bg-gray-100 text-gray-400'}`}>{level}</div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 text-sm text-gray-600 text-center" title={TRL_TOOLTIP}>Currently at Tech Readiness Level {trl}</div>
                  </div>
                )}

                {startup.is_deeptech && (
                  <div className="bg-dark-950 rounded-xl border border-dark-800 p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Cpu size={20} className="text-primary-400" />
                      <h3 className="font-display font-bold text-white">DeepTech Classification</h3>
                    </div>
                    <p className="text-dark-300 text-sm">This startup is classified as a DeepTech company. Eligible for priority evaluation and dedicated incubation programs.</p>
                  </div>
                )}
              </>
            )}

            {/* Financials */}
            {activeTab === 'Financials' && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-display font-bold text-gray-900 mb-4">Financial Overview</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  {[
                    funding && ['Total Funding', funding, 'text-primary-600'],
                    valuation && ['Valuation', valuation, 'text-accent-600'],
                    (startup.employee_range || startup.team_size) && ['Team Size', startup.employee_range || startup.team_size, 'text-blue-600'],
                    startup.total_funding_rounds && ['Funding Rounds', startup.total_funding_rounds, 'text-gray-700'],
                    startup.total_investors && ['Total Investors', startup.total_investors, 'text-gray-700'],
                    startup.revenue_range && ['Revenue', /^[<>]?\d/.test(startup.revenue_range) ? `₹ ${startup.revenue_range}` : startup.revenue_range, 'text-accent-600'],
                  ].filter(Boolean).map(([k,v,c]) => (
                    <div key={k} className="p-4 bg-gray-50 rounded-xl text-center border border-gray-100">
                      <div className={`text-xl font-display font-bold ${c}`}>{v}</div>
                      <div className="text-xs text-gray-500 mt-1">{k}</div>
                    </div>
                  ))}
                </div>

                {investors.length > 0 && (
                  <>
                    <h4 className="font-semibold text-gray-800 text-sm mb-3">Investors</h4>
                    <div className="flex gap-2 flex-wrap">
                      {investors.map((inv, i) => (
                        <span key={i} className="px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg">{typeof inv === 'string' ? inv : inv.name}</span>
                      ))}
                    </div>
                  </>
                )}

                {!funding && !valuation && investors.length === 0 && (
                  <EmptySection message="No financial data available for this startup." />
                )}
              </div>
            )}

            {/* Phase 87f — child sub-sections (team / products / funding /
                clients / patents / competitors / news / acquisitions).
                Read-only render. Silently skipped if backend returns nothing. */}
            <StartupSubSections data={childSections} />
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Quick Stats */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h4 className="font-semibold text-gray-800 text-sm mb-4">Quick Stats</h4>
              <div className="space-y-3">
                {[
                  trl > 0 && { label: 'Tech Readiness', value: `Level ${trl}`, icon: Target, color: 'text-blue-500', tooltip: TRL_TOOLTIP },
                  (startup.employee_range || startup.team_size) && { label: 'Team Size', value: startup.employee_range || startup.team_size, icon: Users, color: 'text-green-500' },
                  funding && { label: 'Funding Raised', value: funding, icon: Wallet, color: 'text-yellow-500' },  // Phase 92.4 (T26) - Wallet (currency-agnostic) replaces DollarSign which implied USD
                  valuation && { label: 'Valuation', value: valuation, icon: TrendingUp, color: 'text-accent-500' },
                  startup.founded_year && { label: 'Founded', value: startup.founded_year, icon: Calendar, color: 'text-gray-500' },
                  startup.stage && { label: 'Stage', value: startup.stage, icon: Briefcase, color: 'text-indigo-500' },
                  startup.dpiit_number && { label: 'DPIIT', value: startup.dpiit_number, icon: Shield, color: 'text-purple-500' },
                ].filter(Boolean).map(stat => (
                  <div key={stat.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <stat.icon size={14} className={stat.color} />
                      <span className="text-sm text-gray-600">{stat.label}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-800">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Links */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h4 className="font-semibold text-gray-800 text-sm mb-4">Links</h4>
              <div className="space-y-2 text-sm">
                {startup.website && (
                  <a href={startup.website.startsWith('http') ? startup.website : `https://${startup.website}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-primary-600 hover:text-primary-700">
                    <Globe size={14} /> {startup.domain_name || 'Website'}
                  </a>
                )}
                {startup.linkedin_url && (
                  <a href={startup.linkedin_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-primary-600 hover:text-primary-700">
                    <ExternalLink size={14} /> LinkedIn
                  </a>
                )}
                {startup.twitter_url && (
                  <a href={startup.twitter_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-primary-600 hover:text-primary-700">
                    <ExternalLink size={14} /> X / Twitter
                  </a>
                )}
                {/* Phase 80 — surface the full set of stored URLs so corporates
                    reviewing the profile can reach GitHub / Crunchbase /
                    Product Hunt / YouTube / pitch deck / demo video. */}
                {startup.github_url && (
                  <a href={startup.github_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-primary-600 hover:text-primary-700">
                    <Github size={14} /> GitHub
                  </a>
                )}
                {startup.crunchbase_url && (
                  <a href={startup.crunchbase_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-primary-600 hover:text-primary-700">
                    <ExternalLink size={14} /> Crunchbase
                  </a>
                )}
                {startup.product_hunt_url && (
                  <a href={startup.product_hunt_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-primary-600 hover:text-primary-700">
                    <ExternalLink size={14} /> Product Hunt
                  </a>
                )}
                {startup.youtube_url && (
                  <a href={startup.youtube_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-primary-600 hover:text-primary-700">
                    <Youtube size={14} /> YouTube
                  </a>
                )}
                {startup.pitch_deck_url && (
                  <a href={startup.pitch_deck_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-primary-600 hover:text-primary-700">
                    <FileText size={14} /> Pitch Deck
                  </a>
                )}
                {startup.video_url && (
                  <a href={startup.video_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-primary-600 hover:text-primary-700">
                    <Video size={14} /> Demo Video
                  </a>
                )}
                {!startup.website && !startup.linkedin_url && !startup.twitter_url && !startup.github_url && !startup.crunchbase_url && !startup.product_hunt_url && !startup.youtube_url && !startup.pitch_deck_url && !startup.video_url && (
                  <p className="text-gray-400">No links available</p>
                )}
              </div>
            </div>

            {/* Verification */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h4 className="font-semibold text-gray-800 text-sm mb-4">Verification</h4>
              <div className="space-y-2">
                {[
                  { label: 'DPIIT Registered', ok: !!startup.dpiit_number },
                  { label: 'GSTIN Verified', ok: !!startup.gstin },
                  { label: 'Profile Complete', ok: !!(startup.description && startup.sector && startup.city) },
                ].map(v => (
                  <div key={v.label} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{v.label}</span>
                    {v.ok ? <CheckCircle2 size={15} className="text-accent-500" /> : <AlertCircle size={15} className="text-yellow-500" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Q3 (s21): Similar Startups via cluster-mate discovery */}
        <SimilarStartupsPanel startupId={startup.user_id || startup.id} limit={8} />
      </div>

      {/* J10 (s50): Claim modal */}
      <ClaimStartupModal
        open={claimOpen}
        onClose={() => setClaimOpen(false)}
        startup={startup}
        onSuccess={() => setClaimSubmitted(true)}
      />
      {/* Phase 110: Share modal JSX */}
      {shareOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={(e) => { if (e.target === e.currentTarget) setShareOpen(false); }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 560, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>Share this startup profile</h2>
              <button onClick={() => setShareOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: 4 }}>
                <X size={16} />
              </button>
            </div>

            {/* Tab strip */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 18, borderBottom: '1.5px solid #eee' }}>
              {[
                { id: 'pdf',   icon: <FileDown size={13} />, label: 'Download PDF' },
                { id: 'link',  icon: <LinkIconShare size={13} />, label: 'Invite link' },
                { id: 'email', icon: <Mail size={13} />, label: 'Invite by email', ownerOnly: true },
              ].filter(t => !t.ownerOnly || shareIsOwner).map(t => (
                <button key={t.id} onClick={() => setShareTab(t.id)}
                  style={{ padding: '10px 14px', fontSize: 12, fontWeight: 700, background: 'none', border: 'none',
                           borderBottom: shareTab === t.id ? '2.5px solid #D0A848' : '2.5px solid transparent',
                           marginBottom: -1.5, color: shareTab === t.id ? '#D0A848' : '#666', cursor: 'pointer',
                           display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            {/* Tab body */}
            {shareTab === 'pdf' && (
              <div>
                <p style={{ fontSize: 12, color: '#666', margin: '0 0 14px', lineHeight: 1.6 }}>
                  Generate a branded PDF of this startup profile. Anyone with this PDF can read it (no link to manage).
                </p>
                <button onClick={() => downloadStartupPdf()}
                  style={{ width: '100%', padding: '11px 18px', background: '#D0A848', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <FileDown size={14} /> Download startup profile PDF
                </button>
              </div>
            )}

            {shareTab === 'link' && (
              <div>
                <p style={{ fontSize: 12, color: '#666', margin: '0 0 14px', lineHeight: 1.6 }}>
                  Create a link to invite someone to this profile. People who aren&apos;t on OpenI yet will be asked to create a free account (or sign in), then taken straight to the profile.
                </p>
                <button onClick={() => mintNewProfileShare()} disabled={shareMinting}
                  style={{ width: '100%', padding: '10px 16px', background: '#D0A848', color: '#fff', border: 'none', borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: shareMinting ? 'not-allowed' : 'pointer', marginBottom: 16, opacity: shareMinting ? 0.6 : 1 }}>
                  {shareMinting ? 'Creating link…' : '+ Create new share link'}
                </button>

                {/* Existing shares list */}
                {shareLoading ? (
                  <p style={{ color: '#888', fontSize: 12, textAlign: 'center', margin: '14px 0' }}>Loading existing shares…</p>
                ) : shareList.length === 0 ? (
                  <p style={{ color: '#888', fontSize: 12, fontStyle: 'italic', margin: 0, textAlign: 'center', padding: '12px 0' }}>No share links yet. Click above to create one.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto' }}>
                    {shareList.map(s => {
                      const expired = s.expires_at && new Date(s.expires_at) < new Date();
                      const revoked = !!s.revoked_at;
                      const inactive = expired || revoked;
                      const shareUrl = `${window.location.origin}/share/startup/${s.token}`;
                      return (
                        <div key={s.id} style={{ padding: 10, borderRadius: 8, background: inactive ? '#fafafa' : '#fff8ec', border: `1px solid ${inactive ? '#eee' : 'rgba(213,170,91,0.3)'}`, opacity: inactive ? 0.6 : 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: revoked ? '#fef2f2' : (expired ? '#fef9e7' : '#f0fdf4'), color: revoked ? '#dc2626' : (expired ? '#a16207' : '#16a34a') }}>
                              {revoked ? 'REVOKED' : (expired ? 'EXPIRED' : 'ACTIVE')}
                            </span>
                            <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4, background: '#e0e7ff', color: '#3730a3' }}>
                              {s.redaction_mode === 'full' ? 'Full' : s.redaction_mode === 'public_safe' ? 'Public-safe' : 'Pitch-only'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: 6, background: '#fff', borderRadius: 6, border: '1px solid #eee', fontSize: 10, fontFamily: 'monospace' }}>
                            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#555' }}>{shareUrl}</span>
                            {!inactive && (
                              <>
                                <button onClick={() => copyShareLink(s.token)} style={{ padding: '3px 7px', background: '#f3f4f6', border: '1px solid #ddd', borderRadius: 5, fontSize: 9, fontWeight: 600, color: '#555', cursor: 'pointer' }}>Copy</button>
                                <button onClick={() => revokeProfileShare(s.id)} style={{ padding: '3px 7px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 5, fontSize: 9, fontWeight: 600, color: '#dc2626', cursor: 'pointer' }}>Revoke</button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {shareTab === 'email' && shareIsOwner && (
              <div>
                <p style={{ fontSize: 12, color: '#666', margin: '0 0 14px', lineHeight: 1.6 }}>
                  Send a magic-link invite to a non-OpenI user. They&apos;ll be prompted to create an account, then sign in to view your full profile.
                </p>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>Email address</label>
                <input type="email" value={shareEmail} onChange={e => setShareEmail(e.target.value)}
                  placeholder="recipient@example.com"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', background: '#fafafa', border: '1.5px solid #e0e0e0', borderRadius: 9, fontSize: 16, outline: 'none', marginBottom: 10 }} />
                <label style={{ fontSize: 11, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>Personal message (optional)</label>
                <textarea value={shareEmailMessage} onChange={e => setShareEmailMessage(e.target.value)} rows={2}
                  placeholder="Add a note — why you&apos;re sharing this profile."
                  style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', background: '#fafafa', border: '1.5px solid #e0e0e0', borderRadius: 9, fontSize: 16, outline: 'none', resize: 'vertical', marginBottom: 14 }} />
                <button onClick={() => sendProfileEmailInvite()} disabled={shareEmailBusy || !shareEmail.trim()}
                  style={{ width: '100%', padding: '10px 16px', background: (!shareEmail.trim() || shareEmailBusy) ? '#ccc' : '#D0A848', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: (!shareEmail.trim() || shareEmailBusy) ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Mail size={14} /> {shareEmailBusy ? 'Sending…' : 'Send invite'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Phase 99q: Watchlist picker modal */}
      {wlOpen && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setWlOpen(false); }}
          style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        >
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 480, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>Save to watchlist</h3>
              <button onClick={() => setWlOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', padding: 4, lineHeight: 0 }}>
                <X size={20} />
              </button>
            </div>
            <p style={{ fontSize: 12, color: '#666', margin: '0 0 18px', lineHeight: 1.6 }}>
              {(startup?.name || 'This startup')} — choose a list to save to, or create a new one.
            </p>

            {wlLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '28px 0', color: '#999', fontSize: 13 }}>
                <Loader2 size={18} className="animate-spin" /> Loading your lists…
              </div>
            ) : wlLists.length === 0 ? (
              <p style={{ fontSize: 13, color: '#888', textAlign: 'center', padding: '18px 0' }}>
                You don&apos;t have any watchlists yet. Create one below.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
                {wlLists.map((l) => (
                  <div key={l.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 12px', background: '#fafafa', border: '1.5px solid #eee', borderRadius: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#222', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.name}</span>
                    <button onClick={() => toggleInList(l)} disabled={wlBusyId === l.id}
                      style={{ flexShrink: 0, padding: '6px 14px', background: l.contains ? '#fff' : '#D0A848', color: l.contains ? '#D0A848' : '#fff', border: l.contains ? '1.5px solid #D0A848' : 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: wlBusyId === l.id ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, minWidth: 86, justifyContent: 'center' }}>
                      {wlBusyId === l.id
                        ? <Loader2 size={13} className="animate-spin" />
                        : l.contains
                          ? <><BookmarkCheck size={13} /> Saved</>
                          : <><Bookmark size={13} /> Save</>}
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ borderTop: '1px solid #eee', paddingTop: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>Create a new list</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="text" value={wlNewName} onChange={(e) => setWlNewName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') createAndAdd(); }}
                  placeholder="e.g. Q3 Pipeline"
                  style={{ flex: 1, boxSizing: 'border-box', padding: '9px 12px', background: '#fafafa', border: '1.5px solid #e0e0e0', borderRadius: 9, fontSize: 16, outline: 'none' }} />
                <button onClick={() => createAndAdd()} disabled={wlCreating || !wlNewName.trim()}
                  style={{ flexShrink: 0, padding: '9px 16px', background: (!wlNewName.trim() || wlCreating) ? '#ccc' : '#D0A848', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: (!wlNewName.trim() || wlCreating) ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {wlCreating ? <Loader2 size={14} className="animate-spin" /> : 'Create & save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
