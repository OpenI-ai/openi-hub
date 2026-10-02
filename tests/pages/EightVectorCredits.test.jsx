/**
 * @vitest-environment jsdom
 *
 * s126 (2 Oct 2026) — the 8-vector AI draft costs 20 AI credits (Rajeev: "charge credit", 20 credits; "anywhere we
 * mention 8 vector is free" changes). Pinned: the admin Costs card, the cost constant, the tour text.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EightVectorSpend } from '../../src/pages/dashboard/AdminCosts';
import { AI_DRAFT_CREDITS } from '../../src/pages/dashboard/StartupEvaluation';
import { PAGE_TOURS } from '../../src/config/tourData';

describe('8-vector AI draft: 20 credits', () => {
  it('the constant matches the backend', () => expect(AI_DRAFT_CREDITS).toBe(20));

  it('the Costs card: drafts, model cost, per draft, credits charged', () => {
    render(<EightVectorSpend v={{ days: 30, drafts: 12, model_cost_usd: 2.52, cost_per_draft_usd: 0.21, credits_per_draft: 20, credits_charged_est: 240 }} />);
    const t = screen.getByTestId('eight-vector-spend').textContent;
    for (const s of ['8-Vector AI drafts (last 30 days)', '12 drafts', '$2.52 model cost', '$0.210 per draft', '240 credits charged']) expect(t).toContain(s);
  });

  it('the evaluate tour no longer calls the AI part free or Pro-only', () => {
    const text = PAGE_TOURS['/dashboard/evaluate'].steps.map(s => s.content).join(' ');
    expect(text).toContain('20 AI credits');
    expect(text).not.toContain('Free for all OpenI users.');
    expect(text).not.toContain('Pro tier adds AI-powered auto-fill');
  });
});
