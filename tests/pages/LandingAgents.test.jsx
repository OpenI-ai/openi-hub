/**
 * @vitest-environment jsdom
 *
 * s125 (1 Oct 2026) — the landing page leads with the Innovation Agent. Rajeev chose the headline
 * ("Your innovation team that works while you sleep.") and the subline, and agreed the page claims only what
 * was verified live per persona (companies, investors, startups on 1 Oct).
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AgentSection, { AGENT_STEPS, AGENT_PERSONAS } from '../../src/pages/auth/landingParts/AgentSection.jsx';
import { PAGE_TOURS } from '../../src/config/tourData/index.js';

describe('landing: the Innovation Agent section', () => {
  it('shows the five agents in order, the three verified personas, and how the client stays in charge', () => {
    render(<MemoryRouter><AgentSection /></MemoryRouter>);
    expect(AGENT_STEPS.map(s => s.name)).toEqual(['Scout', 'Analyst', 'Your Innovation Agent', 'Map builder', 'Next moves']);
    expect(screen.getByTestId('landing-agent-steps').querySelectorAll('li')).toHaveLength(5);
    expect(screen.getAllByTestId('landing-agent-persona').map(p => p.querySelector('h3').textContent))
      .toEqual(['For companies', 'For investors', 'For startups']);
    // the rule: only personas verified live are named
    expect(AGENT_PERSONAS.map(p => p.who).join(' ')).not.toMatch(/government|incubator|academia|student|mentor/i);
    expect(screen.getByTestId('landing-agent-trust').textContent).toMatch(/Suggest only by default.*"Why\?".*Undo/s);
    expect(screen.getByText('Get your Innovation Agent, free').closest('a').getAttribute('href')).toBe('/register');
  });

  it('the landing tour opens with the headline and walks to the agent section', () => {
    for (const key of ['/', '/landing']) {
      const steps = PAGE_TOURS[key].steps;
      expect(steps.map(s => s.title)).toEqual(['Your innovation team that works while you sleep', 'How your Innovation Agent works']);
      expect(steps.map(s => s.target)).toEqual(['#tour-page-landing', '#tour-landing-agents']);
    }
  });
});
