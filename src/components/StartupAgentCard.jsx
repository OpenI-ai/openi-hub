/**
 * s125 (1 Oct 2026) — Innovation Agent Phase 4d, the startup half. Rajeev chose "Public data
 * only": on a startup's home page, the corporates with OPEN PUBLIC challenges that match it,
 * grouped by corporate, each challenge with why it matches and a link to apply. A weekly
 * email of the new ones is ON unless turned off here.
 *
 * Always rendered for a startup (the tour step points at it), with a plain empty state.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Building2, ExternalLink, Globe, Loader2, Mail } from 'lucide-react';
import { startupAgentAPI } from '../services/api';

const G = '#D0A848';
const card = { background: '#fff', border: '1px solid #eee', borderRadius: 12 };
// s125 Programme Scout: who asks.
const TYPE_LABEL = { government: 'Government', defence: 'Defence', corporate: 'Corporate', investor: 'Investor', incubator: 'Incubator' };

/** The line under the title. */
export function matchesText(d) {
  if (!d) return '';
  const groups = d.groups || [];
  const calls = (d.open_calls || []).length;
  if (!groups.length) {
    if (d.reason === 'no_profile' || d.reason === 'thin_profile') return 'Add your sector, technologies and a short description to your profile, and matching challenges will show here.';
    if (calls) return `No OpenI challenge matches you right now, but ${calls} requirement${calls === 1 ? '' : 's'} from outside OpenI ${calls === 1 ? 'does' : 'do'}: see below.`;
    return 'No open public challenge matches you right now. New ones are checked every week.';
  }
  const n = groups.reduce((k, g) => k + g.challenges.length, 0);
  return `${n} open challenge${n === 1 ? '' : 's'} from ${groups.length} compan${groups.length === 1 ? 'y' : 'ies'} ${n === 1 ? 'matches' : 'match'} what you do. Only public challenges, open now, are used.`;
}

export default function StartupAgentCard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    startupAgentAPI.matches().then(setData).catch(() => setError(true));
  }, []);

  const toggleEmail = async () => {
    const was = data?.settings?.weekly_email !== false;
    const next = !was;
    // Flip at once (the box must answer the click), and put it back if the save fails.
    setData(d => ({ ...d, settings: { ...(d?.settings || {}), weekly_email: next } }));
    setSaving(true);
    try {
      const s = await startupAgentAPI.setSettings({ weekly_email: next });
      setData(d => ({ ...d, settings: s }));
      toast.success(next ? 'Weekly email on: Mondays, when there is something new.' : 'Weekly email off.');
    } catch (err) {
      setData(d => ({ ...d, settings: { ...(d?.settings || {}), weekly_email: was } }));
      toast.error(err.message || 'Could not save.');
    } finally { setSaving(false); }
  };

  const groups = data?.groups || [];
  const emailOn = data?.settings?.weekly_email !== false;
  return (
    <div id="tour-startup-agent" data-testid="startup-agent" style={{ ...card, padding: 18, marginTop: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', margin: 0, flex: '1 1 300px' }}>
          {/* s125 — renamed (Rajeev, 1 Oct): it now carries requirements from defence, government, corporates and investors. */}
          <Building2 size={15} style={{ verticalAlign: -3, marginRight: 6, color: G }} />Requirements from corporates, government and defence
        </h2>
        {data && (
          <label style={{ fontSize: 12.5, color: '#555', display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <input type="checkbox" data-testid="startup-agent-email" checked={emailOn} disabled={saving} onChange={toggleEmail} />
            <Mail size={13} /> Weekly email
          </label>
        )}
      </div>
      <p data-testid="startup-agent-status" style={{ fontSize: 13, color: '#555', margin: '6px 0 0' }}>
        {error ? 'Could not load your matches just now.' : !data ? <Loader2 size={14} className="animate-spin" /> : matchesText(data)}
      </p>
      {groups.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12, marginTop: 12 }}>
          {groups.map(g => (
            <div key={g.corporate_id} data-testid="startup-agent-corporate" style={{ ...card, padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                {g.logo_url ? <img src={g.logo_url} alt="" style={{ width: 24, height: 24, borderRadius: 6, objectFit: 'contain' }} /> : <Building2 size={18} color="#999" />}
                <span style={{ fontWeight: 700, fontSize: 14, color: '#0B1E3F' }}>{g.company_name}</span>
              </div>
              {g.challenges.map(c => (
                <div key={c.id} data-testid="startup-agent-challenge" style={{ borderTop: '1px solid #f3f3f3', padding: '7px 0 2px' }}>
                  {/* The challenge page (marketplace detail), where the startup applies. */}
                  <Link to={c.url} style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{c.title}</Link>
                  <div style={{ fontSize: 11.5, color: '#666' }}>
                    {c.why}{c.deadline ? ` · apply by ${new Date(c.deadline).toLocaleDateString()}` : ''}{c.budget_range ? ` · ${c.budget_range}` : ''}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
      {/* s125 — Rajeev: "add crawled open calls for startups" (India first). Calls published by government programmes,
          missions and incubators on their own sites, read daily; the startup applies there, so the link leaves OpenI. */}
      {(data?.open_calls || []).length > 0 && (
        <div data-testid="startup-agent-calls" style={{ marginTop: 16 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Globe size={14} color={G} /> From outside OpenI
            <span style={{ fontSize: 11.5, fontWeight: 400, color: '#888' }}>Defence, government, corporate and investor programmes, read every night from their own sites. You apply on their site.</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 10, marginTop: 8 }}>
            {data.open_calls.map(c => (
              <div key={c.id} data-testid="startup-agent-call" style={{ ...card, padding: 12 }}>
                {TYPE_LABEL[c.publisher_type] && <div data-testid="startup-agent-call-type" style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#8A6A1C', marginBottom: 2 }}>{TYPE_LABEL[c.publisher_type]}</div>}
                <a href={c.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{c.title}</a>
                <div style={{ fontSize: 11.5, color: '#666', marginTop: 2 }}>
                  {c.org_name || c.source_name}{c.deadline ? ` · apply by ${new Date(c.deadline).toLocaleDateString()}` : ''}
                </div>
                {c.summary && <div style={{ fontSize: 12, color: '#444', marginTop: 4 }}>{c.summary}</div>}
                <div style={{ fontSize: 11.5, color: '#8A6A1C', marginTop: 4 }}>{c.why}</div>
                <a href={c.url} target="_blank" rel="noopener noreferrer" data-testid="startup-agent-call-apply"
                  style={{ fontSize: 12, fontWeight: 600, color: G, display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
                  Apply on {c.source_name} <ExternalLink size={12} />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
