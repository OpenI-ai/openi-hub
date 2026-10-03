/**
 * s127 (3 Oct 2026) — landing page rethink, section 2: "Pick your role, see what your agent does".
 * Rajeev approved the 9-section plan ("Approve as proposed"); this one section replaces three that overlapped
 * (Built for Every Stakeholder, the persona picker, and the agent section's 3-persona list).
 *
 * THE RULE (Rajeev, 1 Oct, still in force): the page claims ONLY what has been verified live on app.openi.ai with
 * that persona's demo account. Each role's points below were seen live (s125 1 Oct, s126 2 Oct, s127 3 Oct); see
 * NEXT_SESSION_TODOS 0000t-landing for the dated evidence. Do not add a point here without a live check.
 *
 * Every role has a sign-up link with its persona preselected (/register?type=…), which the old persona picker gave.
 * The section keeps the #choose-persona anchor so old links still land here.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Landmark, TrendingUp, Home, BookOpen, Users, GraduationCap, Rocket, ArrowRight } from 'lucide-react';
import { GOLD, GOLD_DEEP, GOLD_LIGHT, DARK, GRAY, LIGHT_GRAY, BORDER } from './constants.js';

// s127: the small label above the heading. GOLD_DEEP read 2.85-3.24:1 on these backgrounds (axe color-contrast, small
// text needs 4.5:1); this darker shade of the brand gold is ~5.5:1.
const EYEBROW = '#7a5f17';

/** One tab per role group. `types` = the personas it covers (sign-up links), first is the default. */
export const ROLE_AGENTS = [
  { key: 'company', shot: '/landing/role-company.jpg', shotAlt: "A company's Innovation Agent: matches found, next moves with a Why? behind each", icon: Building2, tab: 'Companies', types: [['corporate', 'Join as a company']],
    title: 'Your agent finds the startups for every priority, and tells you the move.',
    points: [
      'Startups matched to each of your innovation priorities, every one checked by the analyst agent against your business',
      'A Strategy map: where each startup fits (grow, cut or venture × partner, source or invest), with "your move" in one line',
      'A CEO view: what your competitors do with startups, and where to venture next',
      'A challenge drafted from a priority; every applicant scored for fit, best fit first',
    ] },
  { key: 'government', shot: '/landing/role-government.jpg', shotAlt: "A government body's Innovation Agent: next moves for its missions and its pilot pipeline", icon: Landmark, tab: 'Government', types: [['government', 'Join as a government body']],
    title: 'Your agent works your missions and grand challenges.',
    points: [
      'Startups matched to your missions and open challenges, checked by the analyst agent',
      'What companies and investors are looking for in your areas, shown only as counts from 3 or more of them',
      'Open calls from peer programmes in your areas, linked to their own sites',
      'Launch a challenge, invite the startups you shortlisted, evaluate one with AI',
    ] },
  { key: 'investor', shot: '/landing/role-investor.jpg', shotAlt: "An investor's Innovation Agent: next moves, priorities and what the agents did this week", icon: TrendingUp, tab: 'Investors', types: [['investor', 'Join as an investor']],
    title: 'Deal flow matched to your thesis, checked before you see it.',
    points: [
      'Startups matched to your thesis and sectors, each checked by the analyst agent',
      'Shortlist or pass in one click, and the ranking learns from you',
      'Add a startup to your deal pipeline in one click',
      'Next moves with a "Why?" behind each, and your Innovation Brief as a PDF for your partners',
    ] },
  { key: 'programme', shot: '/landing/role-programme.jpg', shotAlt: "An incubator's Innovation Agent: a challenge drafted from a priority, and suggested priorities", icon: Home, tab: 'Incubators & accelerators',
    types: [['incubator', 'Join as an incubator'], ['accelerator', 'Join as an accelerator']],
    title: 'Startups for your cohort, and the demand around it.',
    points: [
      'Startups matched to your focus sectors, checked by the analyst agent',
      'What companies and investors want in your sectors: public challenges named, the rest as counts',
      'Open calls from peer programmes, linked',
      'Evaluate a startup with AI through your own programme lens',
    ] },
  { key: 'research', shot: '/landing/role-research.jpg', shotAlt: "A university's Innovation Agent: matched startups, next moves and its pilot pipeline", icon: BookOpen, tab: 'Universities & labs',
    types: [['academia', 'Join as a university'], ['lab', 'Join as a lab']],
    title: 'Who needs your research, found for you.',
    points: [
      'Startups matched to each of your research areas, checked by the analyst agent',
      'Open calls from government programmes in your areas, such as iDEX defence challenges, linked to their own sites',
      'An intro or a meeting with a startup, drafted for you to send',
      'A short morning alert when something new appears for you',
    ] },
  { key: 'advisor', shot: '/landing/role-advisor.jpg', shotAlt: "A service provider's Innovation Agent: matches in the sectors it serves", icon: Users, tab: 'Mentors & service providers',
    types: [['mentor', 'Join as a mentor'], ['service_provider', 'Join as a service provider']],
    title: 'The startups that need what you know.',
    points: [
      'Startups matched to each area of your expertise, or to the sectors you serve',
      'Every match checked by the analyst agent before you see it',
      'An intro or a meeting with a startup, drafted for you to send',
      'A short morning alert when something new appears for you',
    ] },
  { key: 'student', shot: '/landing/role-student.jpg', shotAlt: "A student's Innovation Agent: each topic studied as a priority, and what the agents found", icon: GraduationCap, tab: 'Students', types: [['student', 'Join as a student']],
    title: 'The startups working on what you study.',
    points: [
      'Startups matched to each topic you study, checked by the analyst agent',
      'Where a topic has no startup yet, it says so, and Scout searches for one that night',
      'Each topic you study becomes its own list, so you can see where the activity is',
      'A short morning alert when something new appears for you',
    ] },
  { key: 'startup', shot: '/landing/role-startup.jpg', shotAlt: "A startup's agent: requirements from defence and incubators, each with Not for me", icon: Rocket, tab: 'Startups', types: [['startup', 'Join as a startup']],
    title: 'Requirements that fit you, from everyone who is asking.',
    points: [
      'Open challenges from companies on OpenI that fit what you do, grouped by company',
      'Requirements from government, defence, companies and investors, read every night from their own sites',
      '"Not for me" hides one for good, and your agent learns what to leave out',
      'A weekly email with only the new ones, and a link to apply',
    ] },
];

/** s127 — the agent questions, first in the FAQ (Landing.jsx puts them ahead of the CMS list). Same rule: only what is live. */
export const AGENT_FAQS = [
  { q: 'Does my Innovation Agent act without me?', a: 'No. By default it only suggests: every next move waits for your click. You can switch on "Auto: free steps" so it does the free, reversible ones for you (like drafting a challenge it never launches by itself), and you can undo anything it did.' },
  { q: 'What does it see about other companies?', a: 'Only what is public on OpenI is ever named: public challenges, public profiles, open calls and published news. Anything private (priorities, shortlists, meetings) appears only as a count from 3 or more organisations, in coarse buckets like "5+", and never by name. Your own activity is treated the same way.' },
  { q: 'How does it learn?', a: 'From what you do. Shortlist or pass on a startup and the next ranking leans your way; say "Not for me" to a requirement and it never comes back; shortlist or turn down applicants and new ones like them move up or down. Every suggestion has a "Why?" so you can check its reasoning.' },
  { q: 'What does the agent cost?', a: 'Your Innovation Agent, its nightly search, the analyst checks, Daily alerts and next moves are included in every plan, Free too. Deeper AI actions use AI credits from your plan or a credit pack: an AI evaluation of a startup uses 5 credits, an 8-Vector AI draft 20.' },
];

export default function RoleAgents() {
  const [active, setActive] = useState(ROLE_AGENTS[0].key);
  const role = ROLE_AGENTS.find(r => r.key === active) || ROLE_AGENTS[0];
  const Icon = role.icon;
  return (
    <section id="choose-persona" data-testid="landing-roles" className="py-16 px-6 scroll-mt-20" style={{ background: LIGHT_GRAY }}>
      <div className="max-w-7xl mx-auto">
        <div id="tour-landing-roles" className="mb-8 max-w-2xl">
          <p className="text-xs font-extrabold uppercase tracking-widest mb-3" style={{ color: EYEBROW }}>An agent for every role</p>
          <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: DARK }}>Pick your role. See what your agent does.</h2>
          <p className="text-lg" style={{ color: GRAY, margin: 0 }}>
            Eleven kinds of innovators use OpenI. Each gets its own Innovation Agent, built around what that role is looking for.
          </p>
        </div>

        {/* 2 columns on phones (one chip per line was 6 lines tall at 390), one wrapping row from 640 px. */}
        <div role="tablist" aria-label="Roles" data-testid="landing-role-tabs" className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 mb-6">
          {ROLE_AGENTS.map(r => {
            const on = r.key === active;
            return (
              <button key={r.key} type="button" role="tab" aria-selected={on} data-testid="landing-role-tab"
                onClick={() => setActive(r.key)}
                className="inline-flex items-center gap-1.5 rounded-full text-[13px] sm:text-sm font-semibold text-left leading-tight"
                style={{ padding: '8px 13px', minHeight: 40, cursor: 'pointer', transition: 'all 0.15s',
                  background: on ? DARK : '#fff', color: on ? '#fff' : DARK, border: `1px solid ${on ? DARK : BORDER}` }}>
                <r.icon size={15} style={{ color: on ? GOLD : GOLD_DEEP, flexShrink: 0 }} /> {r.tab}
              </button>
            );
          })}
        </div>

        <div role="tabpanel" data-testid="landing-role-panel" className="rounded-2xl p-6 md:p-8 grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-10"
          style={{ background: '#fff', border: `1px solid ${BORDER}` }}>
          <div className="lg:col-span-2 min-w-0">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: GOLD_LIGHT }}>
              <Icon size={24} style={{ color: GOLD_DEEP }} />
            </div>
            <h3 data-testid="landing-role-title" className="text-2xl font-bold mb-5" style={{ color: DARK, lineHeight: 1.25 }}>{role.title}</h3>
            <div className="flex flex-wrap gap-3">
              {role.types.map(([type, label]) => (
                <Link key={type} to={`/register?type=${type}`} data-testid="landing-role-join"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-bold"
                  style={{ background: GOLD, color: '#2A2A2E', textDecoration: 'none' }}>
                  {label} <ArrowRight size={15} />
                </Link>
              ))}
            </div>
          </div>
          <ul data-testid="landing-role-points" className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {role.points.map(p => (
              <li key={p} className="rounded-xl p-4 text-sm leading-relaxed flex gap-2.5" style={{ background: LIGHT_GRAY, color: DARK }}>
                <span style={{ color: GOLD_DEEP, fontWeight: 800 }}>✓</span><span>{p}</span>
              </li>
            ))}
          </ul>
          {/* s127: that role's own agent, captured live from its demo account (names of real organisations replaced). Only
              the open tab's image is in the page, so one picture loads at a time. */}
          {role.shot && (
            <figure className="lg:col-span-5 m-0" style={{ margin: 0 }}>
              <img data-testid="landing-role-shot" key={role.shot} src={role.shot} alt={role.shotAlt} loading="lazy" decoding="async"
                width={1548} height={role.key === 'startup' ? 470 : 860}
                className="w-full h-auto rounded-xl" style={{ border: `1px solid ${BORDER}`, display: 'block' }} />
              <figcaption className="text-xs mt-2" style={{ color: GRAY }}>From our demo account</figcaption>
            </figure>
          )}
        </div>
      </div>
    </section>
  );
}
