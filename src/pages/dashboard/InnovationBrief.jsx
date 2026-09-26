/**
 * s121e (26 Sep 2026) — Innovation Brief: a personalised, self-updating feed
 * for every persona. Consumes GET /api/brief (backend briefService).
 *
 * Built from the user's own profile (sectors, functions, use cases) and, for a
 * corporate, its open challenges. It re-ranks as the user clicks: "Not
 * relevant" removes a startup for good and lowers similar ones, "Shortlist"
 * adds a "Because you shortlisted …" section. New startups since the last
 * visit are flagged, and the nightly crawler targets open challenges and
 * popular searches, so the brief changes between visits too.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Loader2, MapPin, Star, X, ArrowUp, Search, RefreshCw, Target, TrendingUp } from 'lucide-react';
import { briefAPI } from '../../services/api';

const G = '#D0A848';
const NAVY = '#152838';
const REL_STYLE = {
  Partner: { bg: '#DDF0EC', fg: '#1F7A6E' },
  Source:  { bg: '#E1E8F6', fg: '#3A5BA0' },
  Invest:  { bg: '#F6EEDA', fg: '#8A6A1C' },
};
const card = {
  background: '#fff', border: '1px solid #eee', borderRadius: 14, padding: 16,
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 8,
  transition: 'border-color 0.3s, opacity 0.3s',
};
const pill = (bg, fg) => ({ fontSize: 10.5, fontWeight: 600, padding: '2px 8px', borderRadius: 5, background: bg, color: fg, whiteSpace: 'nowrap' });
const btn = { fontSize: 12, padding: '5px 10px', borderRadius: 8, border: '1px solid #e2e2e2', background: '#fff', color: '#333', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 };

function timeAgo(iso) {
  if (!iso) return null;
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${Math.max(1, mins)} min ago`;
  const h = Math.round(mins / 60);
  if (h < 48) return `${h} hour${h === 1 ? '' : 's'} ago`;
  return `${Math.round(h / 24)} days ago`;
}

function Initials({ name, logo }) {
  const [broken, setBroken] = useState(false);
  const initials = (name || '?').split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
  if (logo && !broken) {
    return <img src={logo} alt="" onError={() => setBroken(true)}
      style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', background: '#f7f5f0', flexShrink: 0 }} />;
  }
  return <div style={{ width: 40, height: 40, borderRadius: 8, background: '#f1ede3', color: NAVY, display: 'flex',
    alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{initials}</div>;
}

function BriefCard({ item, onShortlist, onDismiss, highlight }) {
  const isStartup = item.type === 'startup';
  const to = isStartup ? `/dashboard/startups/${item.user_id}` : `/dashboard/marketplace/${item.id}`;
  const rel = REL_STYLE[item.relationship];
  const meta = isStartup ? [item.city, item.country, item.stage].filter(Boolean).join(' · ')
    : [item.corporate_name, item.deadline ? `closes ${new Date(item.deadline).toLocaleDateString()}` : null].filter(Boolean).join(' · ');
  return (
    <div style={{ ...card, borderColor: highlight ? G : '#eee' }} data-testid="brief-card">
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <Initials name={item.name} logo={item.logo_url} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <Link to={to} style={{ fontSize: 14.5, fontWeight: 700, color: '#1a1a1a', textDecoration: 'none' }}>{item.name}</Link>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center', marginTop: 3 }}>
            {meta && <span style={{ fontSize: 11.5, color: '#666', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              {isStartup && (item.city || item.country) ? <MapPin size={10} /> : null}{meta}</span>}
            {item.is_new && <span style={pill('#DFF2E6', '#2E7D4F')}>New</span>}
            {item.is_imported && <span style={pill('#f1f1f1', '#666')} title="Profile built from public sources; not yet claimed by the startup">Imported profile</span>}
          </div>
        </div>
        {rel && <span style={pill(rel.bg, rel.fg)}>{item.relationship}</span>}
      </div>
      {item.tagline && <p style={{ fontSize: 13, color: '#444', margin: 0, lineHeight: 1.45 }}>{item.tagline}</p>}
      <p style={{ fontSize: 12.5, margin: 0, color: '#1a1a1a', borderTop: '1px dashed #eee', paddingTop: 8 }}>
        <span style={{ color: '#8A6A1C', fontWeight: 600 }}>{item.match == null ? 'Keyword match.' : `${item.match}% fit.`}</span> {item.why}
      </p>
      {isStartup && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 'auto' }}>
          <button type="button" style={{ ...btn, ...(item.shortlisted ? { background: G, borderColor: G, color: NAVY, fontWeight: 600 } : {}) }}
            aria-pressed={item.shortlisted ? 'true' : 'false'} onClick={() => onShortlist(item)}>
            <Star size={12} /> {item.shortlisted ? 'Shortlisted' : 'Shortlist'}
          </button>
          <button type="button" style={btn} onClick={() => onDismiss(item)}><X size={12} /> Not relevant</button>
          <Link to={to} style={{ ...btn, textDecoration: 'none' }}>View profile</Link>
        </div>
      )}
    </div>
  );
}

export default function InnovationBrief() {
  const [brief, setBrief] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [fresh, setFresh] = useState(new Set());
  const prevIds = useRef(new Set());

  const idsOf = (b) => new Set((b?.sections || []).flatMap(s => s.items.map(i => `${i.type}:${i.user_id || i.id}`)));

  const load = useCallback(async ({ after } = {}) => {
    try {
      const b = await briefAPI.get();
      const now = idsOf(b);
      if (after) {
        const added = (b.sections || []).flatMap(s => s.items).filter(i => !prevIds.current.has(`${i.type}:${i.user_id || i.id}`));
        setFresh(new Set(added.map(i => `${i.type}:${i.user_id || i.id}`)));
        setNotice(added.length
          ? `Brief updated. Because you ${after}, it now also shows ${added.slice(0, 3).map(i => i.name).join(', ')}.`
          : `Brief updated. Because you ${after}, similar startups now rank ${after.startsWith('dismissed') ? 'lower' : 'higher'}.`);
      }
      prevIds.current = now;
      setBrief(b);
      setError(false);
    } catch (err) {
      setError(true);
      toast.error(err.message || 'Could not load your brief');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onShortlist = async (item) => {
    setBusy(true);
    try {
      await briefAPI.feedback(item.user_id, 'shortlist', item.shortlisted);
      await load({ after: item.shortlisted ? `removed ${item.name} from your shortlist` : `shortlisted ${item.name}` });
    } catch (err) { toast.error(err.message || 'Could not save that'); }
    finally { setBusy(false); }
  };

  const onDismiss = async (item) => {
    setBusy(true);
    try {
      await briefAPI.feedback(item.user_id, 'dismiss');
      await load({ after: `dismissed ${item.name}` });
      toast((t) => (
        <span>{item.name} hidden.{' '}
          <button type="button" style={{ ...btn, marginLeft: 6 }} onClick={async () => {
            toast.dismiss(t.id);
            await briefAPI.feedback(item.user_id, 'dismiss', true);
            await load({ after: `restored ${item.name}` });
          }}>Undo</button>
        </span>
      ), { duration: 5000 });
    } catch (err) { toast.error(err.message || 'Could not save that'); }
    finally { setBusy(false); }
  };

  const savePrefs = async (priorities, relationships) => {
    setBusy(true);
    try {
      const b = await briefAPI.preferences({
        priorities: priorities.map(p => ({ key: p.key, on: p.on })),
        ...(relationships ? { relationships } : {}),
      });
      prevIds.current = idsOf(b);
      setBrief(b);
      setNotice('Brief rebuilt around your priorities.');
      setFresh(new Set());
    } catch (err) { toast.error(err.message || 'Could not save your priorities'); }
    finally { setBusy(false); }
  };

  const togglePriority = (key) => savePrefs(brief.priorities.map(p => p.key === key ? { ...p, on: !p.on } : p));
  const raisePriority = (key) => {
    const list = [...brief.priorities];
    const i = list.findIndex(p => p.key === key);
    if (i <= 0) return;
    [list[i - 1], list[i]] = [list[i], list[i - 1]];
    savePrefs(list);
  };
  const toggleRelationship = (r) => {
    const cur = brief.relationships || [];
    const next = cur.includes(r) ? cur.filter(x => x !== r) : [...cur, r];
    if (!next.length) return;
    savePrefs(brief.priorities, next);
  };

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 40, color: '#666' }}>
      <Loader2 className="animate-spin" size={18} /> Building your brief…</div>;
  }
  if (error || !brief) {
    return <div style={{ padding: 40 }}>
      <p style={{ color: '#444' }}>We could not build your brief just now.</p>
      <button type="button" style={btn} onClick={() => { setLoading(true); load(); }}><RefreshCw size={12} /> Try again</button>
    </div>;
  }

  const items = brief.sections.flatMap(s => s.items);
  const challengeCount = brief.priorities.filter(p => p.source === 'challenge').length;
  const isCorporate = brief.role === 'corporate';

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: '8px 4px 40px' }} data-testid="innovation-brief">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#888', fontWeight: 600 }}>
            <TrendingUp size={12} style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: 4 }} />Innovation Brief
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 600, color: '#1a1a1a', margin: '4px 0 6px' }}>Built for you, updated as you use it</h1>
          <p style={{ fontSize: 14, color: '#555', margin: 0, maxWidth: '70ch' }}>
            Ranked against your profile{challengeCount ? ` and your ${challengeCount} open challenge${challengeCount === 1 ? '' : 's'}` : ''}.
            Shortlist or dismiss startups and it re-ranks straight away; OpenI's crawler adds new matches every night.
          </p>
        </div>
        <Link to="/search" style={{ ...btn, textDecoration: 'none', padding: '8px 12px' }}><Search size={13} /> Ask OpenI</Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginTop: 16,
        background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: '12px 16px' }}>
        <div><div style={{ fontSize: 22, fontWeight: 600 }}>{items.length}</div><div style={{ fontSize: 12, color: '#777' }}>matches in this brief</div></div>
        <div><div style={{ fontSize: 22, fontWeight: 600 }}>{brief.since.new_count}</div>
          <div style={{ fontSize: 12, color: '#777' }}>{brief.since.last_visit_at ? `new since your last visit (${timeAgo(brief.since.last_visit_at)})` : 'new on OpenI this week'}</div></div>
        <div><div style={{ fontSize: 22, fontWeight: 600 }}>{brief.shortlist_count}</div><div style={{ fontSize: 12, color: '#777' }}>on your shortlist</div></div>
      </div>

      {brief.priorities.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888', fontWeight: 600 }}>Your priorities</span>
            {brief.priorities.map((p, i) => (
              <span key={p.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 2, border: `1px solid ${p.on ? G : '#ddd'}`,
                background: p.on ? '#FBF6EA' : '#fff', borderRadius: 999, padding: '2px 4px 2px 10px', opacity: p.on ? 1 : 0.55 }}>
                <button type="button" disabled={busy} onClick={() => togglePriority(p.key)} aria-pressed={p.on ? 'true' : 'false'}
                  title={`${p.label} — click to switch ${p.on ? 'off' : 'on'}`}
                  style={{ border: 0, background: 'transparent', cursor: 'pointer', fontSize: 12.5, color: '#1a1a1a', textDecoration: p.on ? 'none' : 'line-through', padding: 0,
                    maxWidth: 320, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <span style={{ color: '#8A6A1C', fontSize: 11, marginRight: 4 }}>#{i + 1}</span>
                  {p.source === 'challenge' && <Target size={11} style={{ display: 'inline-block', verticalAlign: '-1px', marginRight: 3 }} />}{p.label}
                </button>
                {i > 0 && <button type="button" disabled={busy} onClick={() => raisePriority(p.key)} aria-label={`Rank ${p.label} higher`}
                  style={{ border: 0, background: 'transparent', cursor: 'pointer', padding: 2, color: '#888' }}><ArrowUp size={12} /></button>}
              </span>
            ))}
          </div>
          {isCorporate && (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12.5, color: '#555' }}>Show startups to</span>
              {['Partner', 'Source', 'Invest'].map(r => {
                const on = (brief.relationships || []).includes(r);
                return <button key={r} type="button" disabled={busy} aria-pressed={on ? 'true' : 'false'} onClick={() => toggleRelationship(r)}
                  style={{ ...btn, ...(on ? { background: REL_STYLE[r].bg, borderColor: REL_STYLE[r].fg, color: REL_STYLE[r].fg, fontWeight: 600 } : {}) }}>
                  {r === 'Partner' ? 'Partner with' : r === 'Source' ? 'Source from' : 'Invest in'}</button>;
              })}
            </div>
          )}
        </div>
      )}

      {notice && (
        <div role="status" data-testid="brief-notice" style={{ marginTop: 14, background: '#FBF6EA', border: `1px solid ${G}`, borderRadius: 10, padding: '10px 14px', fontSize: 13.5 }}>
          {notice}
        </div>
      )}

      {brief.sections.every(s => s.items.length === 0) ? (
        <div style={{ ...card, marginTop: 24, alignItems: 'flex-start' }}>
          <p style={{ margin: 0, fontSize: 14 }}>Your brief needs a little more to go on.</p>
          <p style={{ margin: 0, fontSize: 13, color: '#555' }}>Add your sectors, focus areas or use cases to your profile{isCorporate ? ', or post a challenge' : ''}, and your brief fills in.</p>
          <Link to="/dashboard/profile" style={{ ...btn, textDecoration: 'none' }}>Complete your profile</Link>
        </div>
      ) : brief.sections.filter(s => s.items.length > 0 || s.id.startsWith('challenge:')).map(s => (
        <section key={s.id} style={{ marginTop: 28 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', borderBottom: '1px solid #eee', paddingBottom: 6, marginBottom: 12 }}>
            <h2 style={{ fontSize: 17, fontWeight: 600, margin: 0, color: '#1a1a1a' }}>{s.title}</h2>
            <span style={{ fontSize: 12.5, color: '#888' }}>{s.question}</span>
          </div>
          {s.items.length === 0
            ? <p style={{ fontSize: 13, color: '#777', fontStyle: 'italic' }}>No strong matches yet. OpenI's crawler is looking tonight.</p>
            : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 12 }}>
                {s.items.map(it => <BriefCard key={`${it.type}:${it.user_id || it.id}`} item={it} onShortlist={onShortlist} onDismiss={onDismiss}
                  highlight={fresh.has(`${it.type}:${it.user_id || it.id}`)} />)}
              </div>}
        </section>
      ))}

      {(() => {
        const empty = brief.sections.filter(s => s.items.length === 0 && !s.id.startsWith('challenge:'));
        return empty.length > 0 && !brief.sections.every(s => s.items.length === 0) ? (
          <p style={{ fontSize: 13, color: '#777', marginTop: 24 }}>
            No strong matches yet for {empty.map(s => s.title).join(', ')}. OpenI's crawler is looking.
          </p>
        ) : null;
      })()}

      <p style={{ fontSize: 11.5, color: '#888', marginTop: 28, maxWidth: '100ch' }}>
        Fit is how closely a startup's profile matches the priority, by meaning. Partner / Source / Invest is OpenI's suggestion from the startup's stage.
        Imported profiles were built from public sources and are not yet verified by the startup.
      </p>
    </div>
  );
}
