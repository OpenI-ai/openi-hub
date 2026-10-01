/**
 * s123 (30 Sep 2026) — "What OpenI knows about <client>" (Dentsu prototype;
 * step 1 of the full agentic model, "read the company").
 *
 * Four blocks, each saying where its knowledge came from, so a client can see
 * — and correct — what the brief is built on:
 *   From your profile       what the account filled in on OpenI
 *   What you told us        priorities (and where each came from), open challenges
 *   From public sources     OpenI's researcher agent: what the company does and
 *                           what it is doing now, every line linked to its source
 *                           (website / news). "Read again" re-reads them.
 *   Learned from what you do  taste insights and the maps built for them
 * Always rendered (empty state included) so the page tour can point at it.
 */
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BookOpen, ExternalLink, RefreshCw } from 'lucide-react';

const head = { fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#888', fontWeight: 600, margin: '0 0 6px' };
const box = { border: '1px solid #f0f0f0', borderRadius: 10, padding: '10px 12px', minWidth: 0 };

function Sources({ sources }) {
  return (
    <span style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap', marginLeft: 4 }}>
      {sources.map(s => s.url ? (
        <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer" title={s.title}
          style={{ fontSize: 11.5, color: '#2B4C8C', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
          {s.kind === 'website' ? 'website' : s.date ? new Date(s.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : 'news'}
          <ExternalLink size={10} />
        </a>
      ) : <span key={s.id} style={{ fontSize: 11.5, color: '#888' }}>{s.kind}</span>)}
    </span>
  );
}

// s125 — `startup`: a startup's brief has no startups to shortlist or pass on, so the empty "Learned from what you do" box (its text is about that) is not shown.
export default function KnowsPanel({ load, refresh, client = null, startup = false, id = 'tour-brief-knows' }) {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const loadRef = useRef(load);
  loadRef.current = load;
  useEffect(() => {
    let live = true;
    loadRef.current().then(d => { if (live) setData(d); }).catch(() => { if (live) setData({ profile: [], stated: { priorities: [], challenges: [] }, learned: { insights: [], maps: [] } }); });
    return () => { live = false; };
  }, []);

  const readAgain = async () => {
    setBusy(true);
    try {
      const r = await refresh();
      toast.success(r.signals ? `Read ${r.signals} public source${r.signals === 1 ? '' : 's'}.` : 'No recent public news or readable website found.');
      setData(await loadRef.current());
    } catch (err) {
      toast.error(err.message || 'Could not read the public sources');
    } finally {
      setBusy(false);
    }
  };

  const you = client ? 'this client' : 'you';
  const title = client ? `What OpenI knows about ${data?.company || client}` : `What OpenI knows about ${data?.company ? `you (${data.company})` : 'you'}`;
  const pub = data?.public;
  const resting = data?.refresh?.next_at && new Date(data.refresh.next_at) > new Date();
  const learned = data?.learned || { insights: [], maps: [] };
  return (
    <section id={id} data-testid="brief-knows" style={{ marginTop: 16, border: '1px solid #eee', borderRadius: 12, background: '#fff', padding: '12px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <BookOpen size={15} color="#8A6A1C" />
        <strong style={{ fontSize: 14, fontWeight: 600 }}>{title}</strong>
        <span style={{ fontSize: 12, color: '#888' }}>{client ? 'What its brief is built on' : 'What your agent works from'}, and where each part came from.</span>
      </div>
      {data && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: 10, marginTop: 10 }}>
          <div style={box} data-testid="knows-profile">
            <p style={head}>From {client ? 'the' : 'your'} profile</p>
            {data.profile?.length ? (
              <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '3px 10px', fontSize: 13 }}>
                {data.profile.map(f => [
                  <dt key={`${f.key}-l`} style={{ color: '#777' }}>{f.label}</dt>,
                  <dd key={`${f.key}-v`} style={{ margin: 0, color: '#1a1a1a', overflowWrap: 'anywhere' }}>{f.value}</dd>,
                ])}
              </dl>
            ) : <p style={{ fontSize: 13, color: '#666', margin: 0 }}>Nothing filled in yet.</p>}
            {!client && <Link to="/dashboard/profile" style={{ display: 'inline-block', marginTop: 6, fontSize: 12, color: '#2B4C8C' }}>Not right? Update your profile</Link>}
          </div>

          <div style={box} data-testid="knows-stated">
            <p style={head}>What {client ? 'they' : 'you'} told us</p>
            {data.stated?.priorities?.length ? (
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13, display: 'grid', gap: 2 }}>
                {data.stated.priorities.map(p => (
                  <li key={p.label}>{p.label} <span style={{ fontSize: 11.5, color: '#999' }}>· {p.from === 'profile' ? (client ? 'their profile' : 'your profile') : p.from === 'added' ? (client ? 'added for them' : 'added by you') : p.from}</span></li>
                ))}
              </ul>
            ) : <p style={{ fontSize: 13, color: '#666', margin: 0 }}>No priorities yet.</p>}
            {data.stated?.challenges?.length > 0 && (
              <p style={{ fontSize: 12.5, color: '#444', margin: '6px 0 0' }}>Open challenges: {data.stated.challenges.map(c => c.title).join(', ')}</p>
            )}
          </div>

          <div style={box} data-testid="knows-public">
            <p style={head}>From public sources</p>
            {pub?.about ? (
              <p style={{ fontSize: 13, margin: 0, lineHeight: 1.45 }}>{pub.about.text}<Sources sources={pub.about.sources} /></p>
            ) : (
              <p style={{ fontSize: 13, color: '#666', margin: 0 }}>
                {pub ? `OpenI's researcher found no recent news or readable website about ${data.company || you} to learn from.` : `OpenI has not read public sources about ${data.company || you} yet.`}
              </p>
            )}
            {pub?.now?.length > 0 && (
              <ul data-testid="knows-now" style={{ margin: '6px 0 0', paddingLeft: 16, fontSize: 12.5, display: 'grid', gap: 2 }}>
                {pub.now.map((n, i) => <li key={i}>{n.text}<Sources sources={n.sources} /></li>)}
              </ul>
            )}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
              {data.refresh?.available && (
                <button type="button" data-testid="knows-refresh" onClick={readAgain} disabled={busy || resting}
                  title={resting ? 'OpenI read them a few minutes ago' : 'Read the website and the last 30 days of news again'}
                  style={{ fontSize: 12, padding: '4px 10px', borderRadius: 8, border: '1px solid #e2e2e2', background: '#fff', cursor: busy || resting ? 'default' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <RefreshCw size={12} /> {busy ? 'Reading…' : pub ? 'Read again' : 'Read public sources'}
                </button>
              )}
              {pub?.built_at && <span style={{ fontSize: 11.5, color: '#999' }}>Read {new Date(pub.built_at).toLocaleDateString()}</span>}
            </div>
          </div>

          {!(startup && learned.insights.length === 0 && learned.maps.length === 0) && <div style={box} data-testid="knows-learned">
            <p style={head}>Learned from what {client ? 'they do' : 'you do'}</p>
            {learned.insights.length === 0 && learned.maps.length === 0 ? (
              <p style={{ fontSize: 13, color: '#666', margin: 0 }}>Nothing yet. As {you === 'you' ? 'you shortlist and pass on' : 'they shortlist and pass on'} startups, OpenI learns and shows it here.</p>
            ) : (
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13, display: 'grid', gap: 2 }}>
                {learned.insights.map((i, n) => <li key={`i${n}`}>{i.text}</li>)}
                {learned.maps.map(m => <li key={`m${m.label}`}>Map built for {client ? 'them' : 'you'}: <b style={{ fontWeight: 600 }}>{m.label}</b> ({m.startups} startups, for "{m.source}")</li>)}
              </ul>
            )}
          </div>}
        </div>
      )}
    </section>
  );
}
