/**
 * s126 (2 Oct 2026) — "What corporates / investors are looking for in your areas" (AGENTIC_PLATFORM_PLAN G1 core).
 * Rajeev: "personas are interlinked … an investor … would help to know how corporates are looking in same domain?"
 * Privacy (Rajeev): "recommend based on what is public on openihub platform" … "we can do the aggregate, as long it does
 * not dilute user privacy". So: public open challenges are named and linked; everything else is a coarse count from 3+
 * companies (the server never sends a smaller one or a name). Renders nothing when there is nothing to show.
 * s126 G1 government: also open calls from peer programmes (public, linked to the publisher), and a second panel for investors.
 */
import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';

const WHO = { corporate: 'corporates', investor: 'investors', government: 'government bodies' };   // s126 G1: universities and labs see government

export function signalLine(item, other) {
  const who = WHO[other] || 'accounts';
  const parts = [];
  if (item.interest) parts.push(`${item.interest} ${who} on OpenI have a priority close to this`);
  if (item.active) parts.push(`${item.active} shortlisted startups here this month`);
  return parts.join(' · ');
}

export default function DomainSignals({ signals }) {
  const items = signals?.items || [];
  if (!items.length) return null;
  const who = WHO[signals.other] || 'others';
  return (
    <section id="tour-brief-signals" data-testid="domain-signals" style={{ marginTop: 16, background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: '14px 16px' }}>
      <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Users size={16} color="#0B1E3F" /> What {who} are looking for in your areas
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: 10, marginTop: 10 }}>
        {items.map(it => (
          <div key={it.key} data-testid="signal-item" style={{ border: '1px solid #f0f0f0', borderRadius: 10, padding: '10px 12px', minWidth: 0 }}>
            <strong style={{ fontSize: 13.5, fontWeight: 600 }}>{it.label}</strong>
            {signalLine(it, signals.other) && <p data-testid="signal-line" style={{ fontSize: 12.5, color: '#444', margin: '4px 0 0' }}>{signalLine(it, signals.other)}</p>}
            {(it.public || []).map(p => (
              <p key={p.id} style={{ fontSize: 12.5, margin: '6px 0 0' }}>
                <Link to={p.url} data-testid="signal-public" style={{ color: '#0B1E3F', fontWeight: 600 }}>{p.title}</Link>
                <span style={{ color: '#777' }}> · public challenge by {p.company}{p.deadline ? ` · apply by ${new Date(p.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : ''}</span>
              </p>
            ))}
            {(it.calls || []).map(c => (
              <p key={`c${c.id}`} style={{ fontSize: 12.5, margin: '6px 0 0' }}>
                <a href={c.url} target="_blank" rel="noopener noreferrer" data-testid="signal-call" style={{ color: '#0B1E3F', fontWeight: 600 }}>{c.title}</a>
                <span style={{ color: '#777' }}> · open call by {c.publisher}{c.deadline ? ` · closes ${new Date(c.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : ''}</span>
              </p>
            ))}
          </div>
        ))}
      </div>
      <p style={{ fontSize: 11.5, color: '#888', margin: '10px 0 0' }}>
        Only public challenges{items.some(i => (i.calls || []).length) ? ' and open calls' : ''} are named. Everything else is a count from at least {signals.min_companies || 3} companies, so no one can be identified.
      </p>
    </section>
  );
}
