/**
 * s121e — the entry point to the Innovation Brief on every dashboard home.
 * Deliberately static (no API call): building the brief is the brief page's
 * job, and a dashboard load should not pay for it twice.
 */
import { Link } from 'react-router-dom';
import { TrendingUp, ArrowRight } from 'lucide-react';

export default function BriefTeaser() {
  return (
    <Link to="/dashboard/brief" data-testid="brief-teaser"
      style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', background: '#152838', color: '#EEF2F5',
        borderRadius: 12, padding: '12px 16px', marginBottom: 16 }}>
      <TrendingUp size={20} style={{ color: '#D0A848', flexShrink: 0 }} />
      <span style={{ flex: 1, minWidth: 0 }}>
        <strong style={{ fontWeight: 600, color: '#fff' }}>Your Innovation Brief</strong>
        <span style={{ display: 'block', fontSize: 13, color: '#C9D3DB' }}>
          Startups and opportunities picked for your priorities, updated every time you visit.
        </span>
      </span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#D0A848', fontWeight: 600 }}>
        Open <ArrowRight size={14} />
      </span>
    </Link>
  );
}
