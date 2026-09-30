// s123 (30 Sep 2026) — Rajeev's Dentsu watchlist row read "null · Stage: Application".
import { describe, it, expect } from 'vitest';
import { metaLine } from '../../src/pages/dashboard/watchlistParts/metaLine';

describe('watchlist row meta line', () => {
  it('drops a placeholder sector instead of printing "null"', () => {
    expect(metaLine({ sector: 'null', stage: 'Application' })).toBe('Stage: Application');
    expect(metaLine({ sector: null, stage: 'Application' })).toBe('Stage: Application');
  });
  it('keeps real values', () => {
    expect(metaLine({ sector: 'Marketing analytics', stage: 'Application' })).toBe('Marketing analytics · Stage: Application');
  });
  it('says nothing when both are empty', () => {
    expect(metaLine({ sector: 'N/A', stage: '' })).toBe('');
  });
});
