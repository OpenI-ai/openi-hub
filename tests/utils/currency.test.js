/**
 * formatCurrency — INR lakh/crore and USD K/M/B compaction.
 *
 * Worth testing because the thresholds are hand-rolled arithmetic with
 * precision rules that change at each boundary (`toFixed(l >= 10 ? 0 : 1)`),
 * and the output goes on cards, dashboards and invoices. An off-by-one at a
 * boundary is invisible in review and obvious to a customer.
 */
import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatCurrencyRange,
  currencySymbol,
  CURRENCY_SYMBOLS,
} from '../../src/utils/currency.js';

describe('formatCurrency — the documented examples', () => {
  // Copied from the module's own docblock. Writing these down immediately found
  // that TWO of them were wrong: the docblock promised "₹5L" and "₹2Cr" where
  // the code has always produced "₹5.0L" and "₹2.0Cr". The code is
  // self-consistent (below 10 units the compact form keeps one decimal, at or
  // above 10 it drops it), so s116 corrected the DOCS, not the money
  // formatting — changing that would move every amount on every card. Whether
  // the trailing .0 is wanted is a live product question.
  it.each([
    [500000, 'INR', 'compact', '₹5.0L'],
    [20000000, 'INR', 'compact', '₹2.0Cr'],
    [25000000, 'INR', 'compact', '₹2.5Cr'],
    [500000, 'INR', 'full', '₹5,00,000'],
    [60000, 'USD', 'compact', '$60K'],
    [1500000, 'USD', 'compact', '$1.5M'],
    [60000, 'USD', 'full', '$60,000'],
  ])('formatCurrency(%s, %s, %s) → %s', (amount, currency, format, expected) => {
    expect(formatCurrency(amount, currency, format)).toBe(expected);
  });
});

describe('formatCurrency — missing and unusable input', () => {
  it.each([[null], [undefined], ['']])('renders an em dash for %s', (v) => {
    expect(formatCurrency(v)).toBe('—');
  });

  it('renders an em dash rather than NaN for unparseable text', () => {
    expect(formatCurrency('not-a-number')).toBe('—');
  });

  it('parses numeric strings, since API payloads deliver numerics as strings', () => {
    expect(formatCurrency('500000', 'INR', 'compact')).toBe('₹5.0L');
  });

  it('defaults to INR for an unknown currency code rather than dropping the symbol', () => {
    expect(formatCurrency(1000, 'GBP', 'compact')).toBe('₹1.0K');
  });
});

describe('formatCurrency — INR compaction boundaries', () => {
  // Each pair straddles a threshold in the source, where both the unit and the
  // decimal precision change.
  it.each([
    [999, '₹999'],
    [1000, '₹1.0K'],
    [9999, '₹10.0K'],
    [10000, '₹10K'],
    [99999, '₹100K'],
    [100000, '₹1.0L'],
    [999999, '₹10.0L'],
    [1000000, '₹10L'],
    [9999999, '₹100L'],
    [10000000, '₹1.0Cr'],
    [100000000, '₹10Cr'],
    [1000000000, '₹100Cr'],
  ])('formatCurrency(%s, INR) → %s', (amount, expected) => {
    expect(formatCurrency(amount, 'INR', 'compact')).toBe(expected);
  });
});

describe('formatCurrency — USD compaction boundaries', () => {
  it.each([
    [999, '$999'],
    [1000, '$1.0K'],
    [10000, '$10K'],
    [999999, '$1000K'],
    [1000000, '$1.0M'],
    [10000000, '$10M'],
    [1000000000, '$1.0B'],
  ])('formatCurrency(%s, USD) → %s', (amount, expected) => {
    expect(formatCurrency(amount, 'USD', 'compact')).toBe(expected);
  });
});

describe('formatCurrencyRange', () => {
  it('renders an em dash when neither bound is present', () => {
    expect(formatCurrencyRange(null, null)).toBe('—');
  });

  it('joins both bounds with an en dash', () => {
    expect(formatCurrencyRange(100000, 500000, 'INR', 'compact')).toBe('₹1.0L – ₹5.0L');
  });

  it('renders a minimum-only range as open-ended upward', () => {
    expect(formatCurrencyRange(100000, null, 'INR', 'compact')).toBe('₹1.0L+');
  });

  it('renders a maximum-only range as a ceiling', () => {
    expect(formatCurrencyRange(null, 500000, 'INR', 'compact')).toBe('up to ₹5.0L');
  });

  it('treats an empty string as absent, matching formatCurrency', () => {
    expect(formatCurrencyRange('', '', 'INR')).toBe('—');
  });

  it('does not treat a zero bound as absent', () => {
    // 0 is a real amount. A `!min` guard here would silently drop it.
    expect(formatCurrencyRange(0, 500000, 'INR', 'compact')).toBe('₹0 – ₹5.0L');
  });
});

describe('currencySymbol', () => {
  it('returns the symbol for a known code', () => {
    expect(currencySymbol('USD')).toBe('$');
    expect(currencySymbol('INR')).toBe('₹');
  });

  it('falls back to INR for an unknown or missing code', () => {
    expect(currencySymbol('JPY')).toBe('₹');
    expect(currencySymbol()).toBe('₹');
  });

  it('exposes exactly the two supported currencies', () => {
    // NO FX conversion is a documented invariant; adding a third symbol here
    // without pricing work would imply support that does not exist.
    expect(Object.keys(CURRENCY_SYMBOLS).sort()).toEqual(['INR', 'USD']);
  });
});
