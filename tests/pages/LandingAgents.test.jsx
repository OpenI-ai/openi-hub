/**
 * @vitest-environment jsdom
 *
 * s125 (1 Oct 2026) — the landing page leads with the Innovation Agent. Rajeev chose the headline
 * ("Your innovation team that works while you sleep.") and the subline, and agreed the page claims only what
 * was verified live per persona (companies, investors, startups on 1 Oct).
 * s127 (3 Oct): landing rethink — all roles (RoleAgents), Daily alerts + learning, privacy; new tour.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AgentSection, { AGENT_STEPS } from '../../src/pages/auth/landingParts/AgentSection.jsx';
import RoleAgents, { ROLE_AGENTS, AGENT_FAQS } from '../../src/pages/auth/landingParts/RoleAgents.jsx';
import { PAGE_TOURS } from '../../src/config/tourData/index.js';
import { fireEvent } from '@testing-library/react';
import { readFileSync, existsSync } from 'fs';
import HeroScreens, { HERO_SCREENS } from '../../src/pages/auth/landingParts/HeroScreens.jsx';
import { DEFAULT_TITLE } from '../../src/hooks/useDocumentTitle.js';

describe('landing: the Innovation Agent section', () => {
  // s127 (3 Oct): landing rethink — the per-persona list moved to RoleAgents (all roles); the steps end with Daily alerts.
  it('shows the five agents in order, how it learns, and how the client stays in charge', () => {
    render(<MemoryRouter><AgentSection /></MemoryRouter>);
    expect(AGENT_STEPS.map(s => s.name)).toEqual(['Scout', 'Analyst', 'Your Innovation Agent', 'Next moves', 'Daily alerts']);
    expect(screen.getByTestId('landing-agent-steps').querySelectorAll('li')).toHaveLength(5);
    expect(screen.getByTestId('landing-agent-learns').textContent).toMatch(/It learns from every click\..*Not for me.*applicants/s);
    const trust = screen.getByTestId('landing-agent-trust').textContent;
    expect(trust).toMatch(/Suggest only by default.*"Why\?".*Undo.*3 or more organisations, never by name.*off in one click.*27001/s);
    expect(screen.getByText('Get your Innovation Agent, free').closest('a').getAttribute('href')).toBe('/register');
    // 1 column on phones, 2 on tablets, 5 on desktop (was 1 / 5: squeezed at 768 — testing agent P2)
    expect(screen.getByTestId('landing-agent-steps').className).toMatch(/grid-cols-1 sm:grid-cols-2 lg:grid-cols-5/);
  });

  it('the landing tour opens with the headline and walks roles, agents, you stay in charge', () => {
    for (const key of ['/', '/landing']) {
      const steps = PAGE_TOURS[key].steps;
      expect(steps.map(s => s.title)).toEqual(['Your innovation team that works while you sleep', 'Pick your role', 'How your agents work', 'You stay in charge']);
      expect(steps.map(s => s.target)).toEqual(['#tour-page-landing', '#tour-landing-roles', '#tour-landing-agents', '#tour-landing-trust']);
      expect(steps.every(s => s.skipBeacon)).toBe(true);
    }
  });
});

describe('landing: an agent for every role (s127)', () => {
  const CANONICAL = ['startup', 'student', 'academia', 'corporate', 'government', 'investor', 'mentor', 'lab', 'incubator', 'accelerator', 'service_provider'];
  it('eight role tabs cover all 11 personas, each with its own sign-up link', () => {
    expect(ROLE_AGENTS).toHaveLength(8);
    expect(ROLE_AGENTS.flatMap(r => r.types.map(([t]) => t)).sort()).toEqual([...CANONICAL].sort());
    for (const r of ROLE_AGENTS) expect(r.points.length, r.key).toBeGreaterThanOrEqual(3);
  });
  it('companies first; a tab shows that role\'s agent and joins with that persona', () => {
    render(<MemoryRouter><RoleAgents /></MemoryRouter>);
    expect(screen.getAllByTestId('landing-role-tab')).toHaveLength(8);
    expect(screen.getAllByTestId('landing-role-tab')[0].getAttribute('aria-selected')).toBe('true');
    expect(screen.getByTestId('landing-role-join').getAttribute('href')).toBe('/register?type=corporate');
    fireEvent.click(screen.getByRole('tab', { name: /Startups/ }));
    expect(screen.getByTestId('landing-role-points').textContent).toContain('"Not for me" hides one for good');
    expect(screen.getByTestId('landing-role-join').getAttribute('href')).toBe('/register?type=startup');
    fireEvent.click(screen.getByRole('tab', { name: /Incubators/ }));
    expect(screen.getAllByTestId('landing-role-join').map(a => a.getAttribute('href'))).toEqual(['/register?type=incubator', '/register?type=accelerator']);
    expect(document.getElementById('choose-persona')).toBeTruthy();   // old links still land here
  });
  it('the agent questions lead the FAQ and say what is never shown by name', () => {
    expect(AGENT_FAQS[0].q).toBe('Does my Innovation Agent act without me?');
    expect(AGENT_FAQS.find(f => /other companies/.test(f.q)).a).toMatch(/3 or more organisations.*never by name/s);
  });
});

describe('landing: each role tab shows its own agent (s127)', () => {
  // Rajeev: "remove it and add screenshots to each role tab" — the old slideshow is gone; each tab carries a live capture.
  it('every role has a screenshot that ships with the page, with alt text; the open tab shows only its own', () => {
    for (const r of ROLE_AGENTS) {
      expect(r.shot, r.key).toMatch(/^\/landing\/role-[a-z]+\.jpg$/);
      expect(existsSync(`public${r.shot}`), r.shot).toBe(true);
      expect(r.shotAlt.length, r.key).toBeGreaterThan(20);
    }
    render(<MemoryRouter><RoleAgents /></MemoryRouter>);
    expect(screen.getAllByTestId('landing-role-shot')).toHaveLength(1);
    expect(screen.getByTestId('landing-role-shot').getAttribute('src')).toBe('/landing/role-company.jpg');
    fireEvent.click(screen.getAllByTestId('landing-role-tab').find(b => b.textContent.includes('Startups')));
    expect(screen.getByTestId('landing-role-shot').getAttribute('src')).toBe('/landing/role-startup.jpg');
  });
  it('the old "See it in action" slideshow is no longer on the landing page', () => {
    const src = readFileSync('src/pages/auth/Landing.jsx', 'utf8');
    expect(src).not.toMatch(/<PlatformSlideshow/);
  });
});

describe('landing: hero buttons (s127)', () => {
  // Rajeev: "change it to See what your agent does" — the 2nd hero button opens the role tabs on this page.
  it('the second hero button opens the role tabs; the marketplace stays in the final call to action', () => {
    const src = readFileSync('src/pages/auth/Landing.jsx', 'utf8');
    expect(src).toMatch(/href="#choose-persona"\s+data-testid="hero-see-agent"[\s\S]{0,600}See what your agent does/);
    expect(src.match(/Browse Marketplace/g)).toHaveLength(1);
    render(<MemoryRouter><RoleAgents /></MemoryRouter>);
    expect(document.getElementById('choose-persona')).not.toBeNull();
  });
});

describe('landing: hero screens and page title', () => {
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

  it('a shared link shows the 1200x630 share card, not the bare logo', () => {
    const html = readFileSync('index.html', 'utf8');
    for (const tag of ['property="og:image" content="https://www.openi.ai/og-card.jpg"', 'name="twitter:image" content="https://www.openi.ai/og-card.jpg"',
      'property="og:image:width" content="1200"', 'property="og:image:height" content="630"']) expect(html).toContain(tag);
    expect(html).not.toMatch(/(og|twitter):image" content="[^"]*openi-logo\.png"/);
    const jpg = readFileSync('public/og-card.jpg');
    const sof = jpg.indexOf(Buffer.from([0xff, 0xc0]));   // baseline JPEG frame header: height then width
    expect([jpg.readUInt16BE(sof + 7), jpg.readUInt16BE(sof + 5)]).toEqual([1200, 630]);
  });
});
