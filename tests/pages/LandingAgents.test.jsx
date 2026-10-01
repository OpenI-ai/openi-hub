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
import { fireEvent } from '@testing-library/react';
import { readFileSync, existsSync } from 'fs';
import HeroScreens, { HERO_SCREENS } from '../../src/pages/auth/landingParts/HeroScreens.jsx';
import { DEFAULT_TITLE } from '../../src/hooks/useDocumentTitle.js';

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

  // Rajeev (1 Oct): "show the image from our demo login" -> "pls make them the first screenshots".
  it('the hero shows three real screens from the demo login; a tab picks one; every image ships with the page', () => {
    render(<HeroScreens />);
    expect(HERO_SCREENS.map(x => x.tab)).toEqual(['Next moves', 'Matches, checked', 'For startups']);
    expect(screen.getByTestId('hero-screens-source').textContent).toBe('From our demo account');
    expect(screen.getByTestId('hero-screens-img').getAttribute('src')).toBe('/landing/demo-next-moves.jpg');
    fireEvent.click(screen.getAllByTestId('hero-screens-tab')[2]);
    expect(screen.getByTestId('hero-screens-img').getAttribute('src')).toBe('/landing/demo-startup.jpg');
    expect(screen.getByTestId('hero-screens-img').getAttribute('alt')).toMatch(/requirements from outside OpenI/);
    for (const x of HERO_SCREENS) expect(existsSync(`public${x.src}`), x.src).toBe(true);
  });

  it('the homepage title and share text lead with the agent, the same in index.html and the title hook', () => {
    const html = readFileSync('index.html', 'utf8');
    expect(DEFAULT_TITLE).toBe('OpenI Hub — Your innovation team that works while you sleep');
    for (const tag of [`<title>${DEFAULT_TITLE}</title>`, `property="og:title" content="${DEFAULT_TITLE}"`, `name="twitter:title" content="${DEFAULT_TITLE}"`]) expect(html).toContain(tag);
    expect(html).not.toMatch(/AI Open Innovation Marketplace" \/>/);
  });
});
