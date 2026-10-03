/**
 * s125 (1 Oct 2026) — the landing page tells the world about the Innovation Agent.
 * Rajeev chose the headline ("Your innovation team that works while you sleep.") and the subline, and agreed the rule:
 * the page claims ONLY what has been verified live for each persona. Every line below is something Rajeev saw on
 * app.openi.ai on 1 Oct 2026 (corporate, investor and startup demo accounts). Personas not yet verified are not named.
 * Imported directly (like CardDeck.jsx), NOT through the verbatim-slice barrel in ./index.js.
 *
 * s127 (3 Oct 2026) — landing rethink (Rajeev approved the 9-section plan): this is now section 3 "How your agents
 * work" + section 4 "You stay in control". The per-persona list moved to RoleAgents.jsx (all roles, tabbed). The five
 * steps end with Daily alerts (live since 2 Oct) and a learning loop; the steps grid is 1 / 2 / 5 columns (it was
 * 1 / 5 and squeezed every card to ~130 px at 768 — testing agent P2). Same rule: only what was verified live.
 */
import { Link } from 'react-router-dom';
import { Search, ShieldCheck, ListOrdered, Lightbulb, BellRing, Eye, Undo2, HandMetal, Lock, BellOff, Shield, Repeat } from 'lucide-react';
import { GOLD, GOLD_DEEP, GOLD_LIGHT, DARK, GRAY, LIGHT_GRAY, BORDER } from './constants.js';

/** The agents, in the order they work for a client. */
export const AGENT_STEPS = [
  { icon: Search, name: 'Scout', text: 'Searches the news and OpenI\'s startup base every night for each of your priorities.' },
  { icon: ShieldCheck, name: 'Analyst', text: 'Reads every startup against your business and keeps only the ones that fit, with its reason.' },
  { icon: ListOrdered, name: 'Your Innovation Agent', text: 'Ranks what was kept, and re-ranks the moment you shortlist or pass on one.' },
  { icon: Lightbulb, name: 'Next moves', text: 'Suggests what to do next: shortlist, launch a challenge, request an intro. You decide.' },
  { icon: BellRing, name: 'Daily alerts', text: 'One short morning note when something new appears for you. Each item is told once.' },
];

/** How it learns: what you do, and what changes next time. Each one is live. */
export const AGENT_LEARNS = [
  { you: 'You shortlist or pass on a startup', then: 'the next ranking leans your way' },
  { you: 'You say "Not for me" to a requirement', then: 'it never comes back' },
  { you: 'You shortlist or turn down applicants', then: 'new applicants like them move up or down' },
];

export const AGENT_TRUST = [
  { icon: HandMetal, text: 'Suggest only by default: nothing happens without your click, unless you switch on the free steps.' },
  { icon: Eye, text: '"Why?" under every suggestion: the analyst\'s reason, the search Scout ran, and links to check it yourself.' },
  { icon: Undo2, text: 'Undo anything the agent did for you.' },
  { icon: Lock, text: 'Your activity stays yours. Others only ever see it as a count from 3 or more organisations, never by name.' },
  { icon: BellOff, text: 'Turn alerts and weekly emails off in one click.' },
  { icon: Shield, text: 'ISO/IEC 27001:2022 certified.' },
];

export default function AgentSection() {
  return (
    <>
      <section id="how-it-works" className="py-16 px-6 scroll-mt-20" style={{ background: '#fff', borderTop: `1px solid ${BORDER}` }}>
        <div id="tour-landing-agents" data-testid="landing-agents" className="max-w-7xl mx-auto">
          <div className="mb-10 max-w-2xl">
            <p className="text-xs font-extrabold uppercase tracking-widest mb-3" style={{ color: GOLD_DEEP }}>How your agents work</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: DARK }}>A team of agents, working on your priorities every night.</h2>
            <p className="text-lg" style={{ color: GRAY }}>Each agent does one job and hands it to the next. You see what each one did, and why.</p>
          </div>

          <ol data-testid="landing-agent-steps" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-10" style={{ listStyle: 'none', padding: 0 }}>
            {AGENT_STEPS.map(({ icon: Icon, name, text }, i) => (
              <li key={name} className="rounded-xl p-5 min-w-0" style={{ background: LIGHT_GRAY }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center justify-center rounded-full text-xs font-bold" style={{ width: 24, height: 24, background: GOLD, color: DARK }}>{i + 1}</span>
                  <Icon size={18} style={{ color: GOLD_DEEP }} />
                </div>
                <div className="font-bold mb-1" style={{ color: DARK }}>{name}</div>
                <p className="text-sm leading-relaxed" style={{ color: GRAY, margin: 0 }}>{text}</p>
              </li>
            ))}
          </ol>

          <div data-testid="landing-agent-learns" className="rounded-2xl p-6 md:p-8" style={{ background: DARK }}>
            <div className="flex items-center gap-2 mb-5">
              <Repeat size={20} style={{ color: GOLD }} />
              <h3 className="text-xl font-bold" style={{ color: '#fff', margin: 0 }}>It learns from every click.</h3>
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {AGENT_LEARNS.map(({ you, then }) => (
                <li key={you} className="rounded-xl p-4 min-w-0" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
                  <div className="text-sm font-semibold" style={{ color: '#fff' }}>{you}</div>
                  <div className="text-sm mt-1" style={{ color: GOLD }}>→ {then}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="py-14 px-6" style={{ background: GOLD_LIGHT }}>
        <div id="tour-landing-trust" data-testid="landing-agent-trust" className="max-w-7xl mx-auto">
          <div className="mb-6 max-w-2xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: DARK }}>You stay in charge.</h2>
            <p className="text-base" style={{ color: GRAY, margin: 0 }}>Agents that work for you, on your terms.</p>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {AGENT_TRUST.map(({ icon: Icon, text }) => (
              <li key={text} className="rounded-xl p-4 text-sm leading-relaxed flex gap-2.5 min-w-0" style={{ background: '#fff', color: DARK }}>
                <Icon size={18} style={{ color: GOLD_DEEP, flexShrink: 0 }} /><span>{text}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex justify-center">
            <Link to="/register" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg text-base font-bold"
              style={{ background: GOLD, color: '#2A2A2E', textDecoration: 'none' }}>
              Get your Innovation Agent, free
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
