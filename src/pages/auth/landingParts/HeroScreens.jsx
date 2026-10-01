/**
 * s125 (1 Oct 2026) — Rajeev: "it'll be good idea to show the image from our demo login" → "pls make them the first
 * screenshots". The hero's right panel shows three real screens from OpenI's demo accounts (renamed to made-up
 * companies first — Northwind Defence Systems, Voltgrid Energy — so no real company reads as a client):
 * the agent's next moves, matches checked by the analyst, and a startup's requirements. Rotates; tabs to pick one.
 * Images live in public/landing/ (cropped JPEGs, every crop checked for the old real names before saving).
 */
import { useEffect, useState } from 'react';
import { Bot } from 'lucide-react';
import { GOLD, GOLD_DEEP, GOLD_LIGHT, DARK, GRAY, BORDER } from './constants.js';

export const HERO_SCREENS = [
  { key: 'moves', tab: 'Next moves', src: '/landing/demo-next-moves.jpg',
    alt: 'The Innovation Agent suggests next moves: shortlist three startups, each with its reason, a Why? link and Shortlist or Not now buttons; Suggest only is on.' },
  { key: 'matches', tab: 'Matches, checked', src: '/landing/demo-matches.jpg',
    alt: 'Startups matched to the priority Autonomous Systems, checked by OpenI\'s analyst, each with its fit, reason and suggested move.' },
  { key: 'startups', tab: 'For startups', src: '/landing/demo-startup.jpg',
    alt: 'A startup sees requirements from outside OpenI that fit it, from iDEX (Ministry of Defence) and AIC T-Hub, each with its match and a link to apply.' },
];
const ROTATE_MS = 6000;

export default function HeroScreens() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return undefined;
    const t = setInterval(() => setI(n => (n + 1) % HERO_SCREENS.length), ROTATE_MS);
    return () => clearInterval(t);
  }, [paused]);
  const s = HERO_SCREENS[i];
  return (
    <div data-testid="hero-screens" className="lg:col-span-3 rounded-2xl p-4 md:p-5"
      style={{ background: '#fff', border: `1px solid ${BORDER}`, boxShadow: '0 28px 70px rgba(46,46,52,0.12)' }}
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 font-bold" style={{ color: DARK }}>
          <Bot size={18} style={{ color: GOLD_DEEP }} /> Your Innovation Agent at work
        </div>
        <span data-testid="hero-screens-source" className="text-xs" style={{ color: GRAY }}>From our demo account</span>
      </div>
      <div role="tablist" aria-label="Screens" className="flex flex-wrap gap-2 mb-3">
        {HERO_SCREENS.map((x, n) => (
          <button key={x.key} type="button" role="tab" aria-selected={n === i} data-testid="hero-screens-tab"
            onClick={() => { setI(n); setPaused(true); }}
            className="rounded-full px-3.5 py-1.5 text-xs font-semibold"
            style={{ border: `1px solid ${n === i ? GOLD : BORDER}`, background: n === i ? GOLD_LIGHT : '#fff', color: DARK, cursor: 'pointer' }}>
            {x.tab}
          </button>
        ))}
      </div>
      <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
        <img data-testid="hero-screens-img" src={s.src} alt={s.alt} width={1548} style={{ width: '100%', height: 'auto', display: 'block' }} />
      </div>
    </div>
  );
}
