/**
 * @vitest-environment jsdom
 *
 * s126 — "What corporates are looking for in your areas" (G1 core): public challenges named and linked; counts as the
 * server sent them (already bucketed from 3+ companies); the privacy line; nothing at all when there is nothing.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DomainSignals, { signalLine } from '../../src/pages/dashboard/DomainSignals';

const signals = { other: 'corporate', min_companies: 3, items: [
  { key: 'k1', label: 'B2B fintech', interest: '5+', active: '3+', public: [{ id: 7, title: 'Open fintech challenge', company: 'Publico', deadline: '2026-11-20', url: '/dashboard/marketplace/7' }] },
  { key: 'k2', label: 'Payments', interest: null, active: null, public: [] },
] };

describe('DomainSignals', () => {
  it('signalLine', () => {
    expect(signalLine(signals.items[0], 'corporate')).toBe('5+ corporates on OpenI have a priority close to this · 3+ shortlisted startups here this month');
    expect(signalLine({ interest: '10+' }, 'investor')).toBe('10+ investors on OpenI have a priority close to this');
    expect(signalLine({}, 'corporate')).toBe('');
    // s126 G1: universities and labs see government bodies
    expect(signalLine({ interest: '3+' }, 'government')).toBe('3+ government bodies on OpenI have a priority close to this');
  });

  it('names only the public challenge, links it, and says how privacy is kept', () => {
    render(<MemoryRouter><DomainSignals signals={signals} /></MemoryRouter>);
    expect(screen.getByRole('heading').textContent).toMatch(/What corporates are looking for in your areas/);
    expect(screen.getAllByTestId('signal-item')).toHaveLength(2);
    expect(screen.getByTestId('signal-public').getAttribute('href')).toBe('/dashboard/marketplace/7');
    expect(screen.getByText(/public challenge by Publico/)).toBeTruthy();
    expect(screen.getByText(/a count from at least 3 companies, so no one can be identified/)).toBeTruthy();
  });

  it('government: open calls from peer programmes are named and open the publisher in a new tab', () => {
    const gov = { other: 'corporate', min_companies: 3, items: [{ key: 'd', label: 'Defence Tech', interest: '3+', active: null, public: [],
      calls: [{ id: 9, title: 'iDEX open challenge', publisher: 'iDEX', deadline: null, url: 'https://idex.example/c' }] }] };
    render(<MemoryRouter><DomainSignals signals={gov} /></MemoryRouter>);
    const a = screen.getByTestId('signal-call');
    expect(a.getAttribute('href')).toBe('https://idex.example/c');
    expect(a.getAttribute('target')).toBe('_blank');
    expect(screen.getByText(/open call by iDEX/)).toBeTruthy();
    expect(screen.getByText(/Only public challenges and open calls are named/)).toBeTruthy();
  });

  it('renders nothing when there is nothing to show', () => {
    const { container } = render(<MemoryRouter><DomainSignals signals={{ other: 'corporate', items: [] }} /></MemoryRouter>);
    expect(container.innerHTML).toBe('');
    expect(render(<DomainSignals signals={null} />).container.innerHTML).toBe('');
  });
});
