/**
 * s125 (1 Oct 2026) — Rajeev: "right hand side image should show the work of Innovation agent not Innovation map".
 * The hero's right panel shows one night of a client's Innovation Agent: what each agent did, then one next move
 * with its "Why?" open. It is an EXAMPLE (labelled so): a made-up food company's priorities, no real startup or
 * client names, so it never reads as someone's real data. Every element mirrors something on the live
 * Innovation Agent page (the Agents panel lines, a next move, "Why?", Suggest only).
 * Imported directly, NOT through the verbatim-slice barrel in ./index.js.
 */
import { Search, ShieldCheck, Map, ListOrdered, Lightbulb, Bot } from 'lucide-react';
import { GOLD, GOLD_DEEP, GOLD_LIGHT, DARK, GRAY, LIGHT_GRAY, BORDER } from './constants.js';

export const HERO_FEED = [
  { icon: Search, who: 'Scout', text: 'searched the news overnight for "cold-chain monitoring" and 3 more of your priorities', at: '02:10' },
  { icon: ShieldCheck, who: 'Analyst', text: 'read 211 startups against your business and kept 69, each with its reason', at: '02:40' },
  { icon: Map, who: 'Map builder', text: 'built a map for "food waste reduction", a priority no map covered yet', at: '03:05' },
  { icon: ListOrdered, who: 'Your agent', text: 're-ranked your matches: 8 new since your last visit', at: '06:00' },
];

export default function HeroAgentPanel() {
  return (
    <div data-testid="hero-agent-panel" className="lg:col-span-3 rounded-2xl p-6 md:p-7"
      style={{ background: '#fff', border: `1px solid ${BORDER}`, boxShadow: '0 28px 70px rgba(46,46,52,0.12)' }}>
      <div className="flex items-center justify-between gap-3 pb-4 mb-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div className="flex items-center gap-2 text-lg font-bold" style={{ color: DARK }}>
          <Bot size={20} style={{ color: GOLD_DEEP }} /> Your Innovation Agent · last night
        </div>
        <span data-testid="hero-agent-example" className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: LIGHT_GRAY, color: GRAY }}>
          Example
        </span>
      </div>

      <ul className="flex flex-col gap-3" style={{ listStyle: 'none', padding: 0, margin: '0 0 20px' }}>
        {HERO_FEED.map(({ icon: Icon, who, text, at }) => (
          <li key={who} data-testid="hero-agent-feed" className="flex items-start gap-3 text-sm">
            <Icon size={16} style={{ color: GOLD_DEEP, flexShrink: 0, marginTop: 2 }} />
            <span className="flex-1" style={{ color: DARK }}><strong>{who}</strong> {text}.</span>
            <span style={{ color: GRAY, flexShrink: 0 }}>{at}</span>
          </li>
        ))}
      </ul>

      <div className="rounded-xl p-5" style={{ border: `1px solid ${GOLD}`, background: GOLD_LIGHT }}>
        <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest mb-2" style={{ color: GOLD_DEEP }}>
          <Lightbulb size={14} /> Next move
        </div>
        <div className="font-bold mb-1" style={{ color: DARK }}>Shortlist 3 startups for "Cold-chain monitoring"</div>
        <p className="text-sm mb-3" style={{ color: DARK, margin: '0 0 12px' }}>They track the temperature of dairy and frozen goods in transit, close to your pilot plan.</p>
        <div data-testid="hero-agent-why" className="rounded-lg p-3 mb-4 text-sm" style={{ background: '#fff', border: `1px solid ${BORDER}` }}>
          <div className="font-semibold mb-1" style={{ color: DARK }}>Why?</div>
          <ul className="flex flex-col gap-1" style={{ listStyle: 'none', padding: 0, margin: 0, color: GRAY }}>
            <li>Analyst: "Monitors cold-chain temperature for food distributors; fits your Q3 pilot."</li>
            <li>Scout's search: "cold chain IoT sensor dairy logistics"</li>
            <li>Links to each startup's profile and website</li>
          </ul>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg px-4 py-2 text-sm font-bold" style={{ background: DARK, color: '#fff' }}>Shortlist</span>
          <span className="rounded-lg px-4 py-2 text-sm" style={{ background: '#fff', border: `1px solid ${BORDER}`, color: DARK }}>Not now</span>
          <span className="text-xs ml-auto" style={{ color: GRAY }}>Suggest only: nothing happens without your OK.</span>
        </div>
      </div>
    </div>
  );
}
