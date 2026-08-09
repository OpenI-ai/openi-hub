/**
 * OpenI Hub - fundingChart.jsx
 *
 * funding-amount normalisation + the stacked funding bar chart
 *
 * VERBATIM slice of src/pages/dashboard/StartupProfile.jsx lines 303-712 as it
 * stood before the Phase 163 split (9 Aug 2026). Do NOT reformat the body -
 * see ./index.js for the re-concat verification recipe and the invariants.
 */

import React from 'react';
import { X } from 'lucide-react';

// --- BODY START (verbatim, do not reformat) ---
// --- lines 303-712 ---
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

// --- BODY END ---

export {
  amountToDisplay,
  valuationToDisplay,
  FundingChart,
};
