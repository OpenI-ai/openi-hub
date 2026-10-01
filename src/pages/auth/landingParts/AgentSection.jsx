/**
 * s125 (1 Oct 2026) — the landing page tells the world about the Innovation Agent.
 * Rajeev chose the headline ("Your innovation team that works while you sleep.") and the subline, and agreed the rule:
 * the page claims ONLY what has been verified live for each persona. Every line below is something Rajeev saw on
 * app.openi.ai on 1 Oct 2026 (corporate, investor and startup demo accounts). Personas not yet verified are not named.
 * Imported directly (like CardDeck.jsx), NOT through the verbatim-slice barrel in ./index.js.
 */
import { Link } from 'react-router-dom';
import { Search, ShieldCheck, ListOrdered, Map, Lightbulb, Building2, TrendingUp, Rocket, Eye, Undo2, HandMetal } from 'lucide-react';
import { GOLD, GOLD_DEEP, GOLD_LIGHT, DARK, GRAY, LIGHT_GRAY, BORDER } from './constants.js';

/** The agents, in the order they work for a client. */
export const AGENT_STEPS = [
  { icon: Search, name: 'Scout', text: 'Searches the news and OpenI\'s startup base every night for each of your priorities.' },
  { icon: ShieldCheck, name: 'Analyst', text: 'Reads every startup against your business and keeps only the ones that fit, with its reason.' },
  { icon: ListOrdered, name: 'Your Innovation Agent', text: 'Ranks the matches for you and re-ranks the moment you shortlist or pass on one.' },
  { icon: Map, name: 'Map builder', text: 'Builds an Innovation Map for a priority no map covers yet, and keeps looking every night.' },
  { icon: Lightbulb, name: 'Next moves', text: 'Suggests what to do next: shortlist, launch a challenge, add a priority. You decide.' },
];

/** What the agent does for each persona — verified live on 1 Oct 2026. */
export const AGENT_PERSONAS = [
  { icon: Building2, who: 'For companies', points: [
    'Startups matched to every priority, each checked by the analyst',
    'A challenge drafted for you from a priority, ready to review and launch',
    'A CEO view: what your competitors do with startups, and where to venture next, as a board pack PDF',
  ] },
  { icon: TrendingUp, who: 'For investors', points: [
    'Deal flow matched to your priorities, each startup checked by the analyst',
    'Shortlist or pass in one click, and the ranking learns from you',
    'Next moves with a "Why?" behind each, and your Innovation Brief as a PDF for your partners',
  ] },
  { icon: Rocket, who: 'For startups', points: [
    'Open challenges from corporates on OpenI that fit what you do',
    'Requirements from government, defence, corporates and investors, read every night from their own sites',
    'A weekly email with the new ones, and a link to apply on the publisher\'s site',
  ] },
];

export const AGENT_TRUST = [
  { icon: HandMetal, text: 'Suggest only by default: nothing happens without your click, unless you switch on the free steps.' },
  { icon: Eye, text: '"Why?" under every suggestion: the analyst\'s reason, the search Scout ran, and links to check it yourself.' },
  { icon: Undo2, text: 'Undo anything the agent did for you.' },
];

export default function AgentSection() {
  return (
    <section id="tour-landing-agents" data-testid="landing-agents" className="py-16 px-6" style={{ background: '#fff', borderTop: `1px solid ${BORDER}` }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-10 max-w-2xl">
          <p className="text-xs font-extrabold uppercase tracking-widest mb-3" style={{ color: GOLD_DEEP }}>Your Innovation Agent</p>
          <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: DARK }}>A team of agents, working on your priorities every night.</h2>
          <p className="text-lg" style={{ color: GRAY }}>Each agent does one job and hands it to the next. You see what each one did, and why.</p>
        </div>

        <ol data-testid="landing-agent-steps" className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-14" style={{ listStyle: 'none', padding: 0 }}>
          {AGENT_STEPS.map(({ icon: Icon, name, text }, i) => (
            <li key={name} className="rounded-xl p-5" style={{ background: LIGHT_GRAY }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center justify-center rounded-full text-xs font-bold" style={{ width: 24, height: 24, background: GOLD, color: DARK }}>{i + 1}</span>
                <Icon size={18} style={{ color: GOLD_DEEP }} />
              </div>
              <div className="font-bold mb-1" style={{ color: DARK }}>{name}</div>
              <p className="text-sm leading-relaxed" style={{ color: GRAY, margin: 0 }}>{text}</p>
            </li>
          ))}
        </ol>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
          {AGENT_PERSONAS.map(({ icon: Icon, who, points }) => (
            <div key={who} data-testid="landing-agent-persona" className="rounded-2xl p-6" style={{ border: `1px solid ${BORDER}` }}>
              <div className="flex items-center gap-2 mb-4">
                <Icon size={20} style={{ color: GOLD_DEEP }} />
                <h3 className="text-lg font-bold" style={{ color: DARK, margin: 0 }}>{who}</h3>
              </div>
              <ul className="flex flex-col gap-2.5" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {points.map(p => (
                  <li key={p} className="text-sm leading-relaxed flex gap-2" style={{ color: DARK }}>
                    <span style={{ color: GOLD_DEEP }}>✓</span><span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div data-testid="landing-agent-trust" className="rounded-2xl p-6 md:p-8 flex flex-col md:flex-row gap-6 md:items-center" style={{ background: GOLD_LIGHT }}>
          <div className="md:w-1/4 font-bold text-lg" style={{ color: DARK }}>You stay in charge.</div>
          <ul className="md:w-3/4 grid grid-cols-1 md:grid-cols-3 gap-4" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {AGENT_TRUST.map(({ icon: Icon, text }) => (
              <li key={text} className="text-sm leading-relaxed flex gap-2" style={{ color: DARK }}>
                <Icon size={18} style={{ color: GOLD_DEEP, flexShrink: 0 }} /><span>{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-10 flex justify-center">
          <Link to="/register" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg text-base font-bold"
            style={{ background: GOLD, color: '#2A2A2E', textDecoration: 'none' }}>
            Get your Innovation Agent, free
          </Link>
        </div>
      </div>
    </section>
  );
}
