/**
 * OpenI Hub — Currency formatting helper (Phase 16B.2)
 *
 * Supports INR + USD with two display formats:
 *   - 'compact': "₹5L", "₹2Cr", "$60K", "$1.5M"    (for cards, dashboards, chips)
 *   - 'full':    "₹5,00,000", "$60,000"            (for detail views, forms, invoices)
 *
 * NO FX conversion — truth stays with the currency the amount was entered in.
 */

export const CURRENCY_SYMBOLS = {
  INR: '₹',
  USD: '$',
};

export const CURRENCY_OPTIONS = [
  { value: 'INR', label: '₹ INR' },
  { value: 'USD', label: '$ USD' },
];

/**
 * Format a monetary amount with its currency.
 *
 * @param {number|string|null|undefined} amount — The numeric amount
 * @param {string} currency — 'INR' or 'USD' (defaults to 'INR')
 * @param {string} format — 'compact' (default) or 'full'
 * @returns {string} Formatted string, or '—' for null/undefined
 *
 * Examples:
 *   formatCurrency(500000, 'INR', 'compact')    → "₹5L"
 *   formatCurrency(25000000, 'INR', 'compact')  → "₹2.5Cr"
 *   formatCurrency(500000, 'INR', 'full')       → "₹5,00,000"
 *   formatCurrency(60000, 'USD', 'compact')     → "$60K"
 *   formatCurrency(1500000, 'USD', 'compact')   → "$1.5M"
 *   formatCurrency(60000, 'USD', 'full')        → "$60,000"
 */
export function formatCurrency(amount, currency = 'INR', format = 'compact') {
  if (amount === null || amount === undefined || amount === '') return '—';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '—';

  const symbol = CURRENCY_SYMBOLS[currency] || CURRENCY_SYMBOLS.INR;

  if (format === 'full') {
    // Full format: use locale-appropriate grouping
    if (currency === 'INR') {
      // Indian lakh/crore grouping: 5,00,000 rather than 500,000
      return symbol + num.toLocaleString('en-IN', { maximumFractionDigits: 0 });
    }
    // USD uses standard US grouping
    return symbol + num.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }

  // Compact format
  if (currency === 'INR') {
    // INR: Lakh (L) = 100,000; Crore (Cr) = 10,000,000
    if (num >= 10000000) {
      const cr = num / 10000000;
      return symbol + (cr >= 100 ? cr.toFixed(0) : cr.toFixed(cr >= 10 ? 0 : 1)) + 'Cr';
    }
    if (num >= 100000) {
      const l = num / 100000;
      return symbol + (l >= 100 ? l.toFixed(0) : l.toFixed(l >= 10 ? 0 : 1)) + 'L';
    }
    if (num >= 1000) {
      return symbol + (num / 1000).toFixed(num >= 10000 ? 0 : 1) + 'K';
    }
    return symbol + num.toFixed(0);
  }

  // USD compact: K = 1,000; M = 1,000,000; B = 1,000,000,000
  if (num >= 1000000000) {
    return symbol + (num / 1000000000).toFixed(1) + 'B';
  }
  if (num >= 1000000) {
    return symbol + (num / 1000000).toFixed(num >= 10000000 ? 0 : 1) + 'M';
  }
  if (num >= 1000) {
    return symbol + (num / 1000).toFixed(num >= 10000 ? 0 : 1) + 'K';
  }
  return symbol + num.toFixed(0);
}

/**
 * Format a range of amounts (min–max) with shared currency.
 * If both null → "—". If only one present → that one formatted.
 */
export function formatCurrencyRange(min, max, currency = 'INR', format = 'compact') {
  const hasMin = min !== null && min !== undefined && min !== '';
  const hasMax = max !== null && max !== undefined && max !== '';
  if (!hasMin && !hasMax) return '—';
  if (hasMin && hasMax) return `${formatCurrency(min, currency, format)} – ${formatCurrency(max, currency, format)}`;
  if (hasMin) return `${formatCurrency(min, currency, format)}+`;
  return `up to ${formatCurrency(max, currency, format)}`;
}

/**
 * Return just the currency symbol for a code.
 */
export function currencySymbol(currency = 'INR') {
  return CURRENCY_SYMBOLS[currency] || CURRENCY_SYMBOLS.INR;
}
