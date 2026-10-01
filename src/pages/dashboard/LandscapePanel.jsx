/**
 * s123 (30 Sep 2026) — "Your innovation landscape": the Innovation Maps around
 * this client's priorities, inside the brief. Rajeev: "this will visually tell a
 * user what Innovation/disruption is coming in their industry by sector,
 * function and use case".
 *
 * One tab per dimension; each map area is a row: its name (opens the map), a
 * bar for how many startups OpenI has there (one hue, length = magnitude, the
 * number printed beside it), and — only when production has enough recent data
 * (`momentum`) — new startups in 90 days and a "Rising" chip (icon + word, never
 * colour alone). Priorities no map covers yet are named plainly.
 * Always rendered (empty state included) so the page tour can point at it.
 */
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Map as MapIcon, TrendingUp } from 'lucide-react';

const BAR = '#2B4C8C';
const TRACK = '#EEF1F6';

// s125 — `startup`: no "from what you shortlist and pass on" (a startup's brief has nothing to shortlist).
export default function LandscapePanel({ load, build = null, client = null, startup = false, id = 'tour-brief-landscape' }) {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('sector');
  const loadRef = useRef(load);
  loadRef.current = load;
  useEffect(() => {
    let live = true;
    loadRef.current().then(d => { if (live) setData(d); }).catch(() => { if (live) setData({ dimensions: [] }); });
    return () => { live = false; };
  }, []);
  // s123 — the map-builder agent: learn a map for each priority no curated map covers.
  const [building, setBuilding] = useState(false);
  const [built, setBuilt] = useState(null);
  const runBuild = async () => {
    setBuilding(true); setBuilt(null);
    try {
      const r = await build();
      const maps = (r.maps || []).filter(m => m.members > 0);
      const empty = (r.maps || []).filter(m => !m.members).map(m => `"${m.source}"`);
      setBuilt([
        maps.length ? `Built ${maps.length === 1 ? 'a map' : `${maps.length} maps`}: ${maps.map(m => `"${m.label}" (${m.members} startup${m.members === 1 ? '' : 's'})`).join(', ')}. OpenI keeps ${maps.length === 1 ? 'it' : 'them'} up to date every night${startup ? '' : ` from what ${client ? 'this client shortlists and passes on' : 'you shortlist and pass on'}`}.` : '',
        empty.length ? `No startup checked out for ${empty.join(', ')} yet; the map builder tries again every night.` : '',
        !(r.maps || []).length ? 'OpenI\'s Innovation Maps already cover these priorities.' : '',
      ].filter(Boolean).join(' '));
      setData(await loadRef.current());
    } catch (err) {
      setBuilt(err.message || 'The map builder could not run. Please try again.');
    } finally {
      setBuilding(false);
    }
  };
  const learned = (data?.learned || []).filter(m => m.startups > 0);
  // A priority the map builder already searched for and found no startup that fits (an empty learned map).
  const triedSet = new Set((data?.learned || []).filter(m => !m.startups).map(m => m.source));
  const tried = (data?.unmapped || []).filter(u => triedSet.has(u));
  const untried = (data?.unmapped || []).filter(u => !triedSet.has(u));

  const dims = data?.dimensions || [];
  const cur = dims.find(d => d.key === tab) || dims[0];
  const max = Math.max(1, ...((cur?.items || []).map(i => i.startups)));
  const who = client || 'you';
  return (
    <section id={id} data-testid="brief-landscape" style={{ marginTop: 16, border: '1px solid #eee', borderRadius: 12, background: '#fff', padding: '12px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <MapIcon size={15} color="#8A6A1C" />
        <strong style={{ fontSize: 14, fontWeight: 600 }}>{client ? `Innovation landscape for ${client}` : 'Your innovation landscape'}</strong>
        <span style={{ fontSize: 12, color: '#888' }}>Where startups are building around {client ? 'these' : 'your'} priorities, from OpenI's Innovation Maps.</span>
      </div>
      {data === null ? null : !dims.some(d => d.items.length) ? (
        <p data-testid="landscape-empty" style={{ fontSize: 13, color: '#666', margin: '8px 0 0' }}>
          {data.note || `No Innovation Map is close enough to ${client ? 'these' : 'your'} priorities yet.`}
        </p>
      ) : (<>
        <div role="tablist" aria-label="Map dimension" style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
          {dims.map(d => (
            <button key={d.key} type="button" role="tab" aria-selected={cur?.key === d.key} data-testid={`landscape-tab-${d.key}`} onClick={() => setTab(d.key)}
              style={{ fontSize: 12.5, padding: '4px 10px', borderRadius: 8, border: '1px solid #e2e2e2', cursor: 'pointer',
                background: cur?.key === d.key ? '#152838' : '#fff', color: cur?.key === d.key ? '#fff' : '#333' }}>
              {d.label} <span style={{ opacity: 0.7 }}>({d.items.length})</span>
            </button>
          ))}
        </div>
        {cur && cur.items.length === 0 ? (
          <p style={{ fontSize: 13, color: '#666', margin: '10px 0 0' }}>No {cur.label.toLowerCase()} map is close enough to {who === 'you' ? 'your' : 'these'} priorities yet.</p>
        ) : (
          <ul data-testid="landscape-list" style={{ listStyle: 'none', margin: '10px 0 0', padding: 0, display: 'grid', gap: 8 }}>
            {cur.items.map(i => (
              <li key={i.slug} data-testid="landscape-row" data-slug={i.slug} style={{ display: 'grid', gridTemplateColumns: 'minmax(140px, 220px) 1fr auto', gap: 10, alignItems: 'center', fontSize: 13 }}
                title={`${i.label}: ${i.startups} startups on OpenI${i.new_90d != null ? `, ${i.new_90d} new in the last 90 days` : ''}${i.funded_12m ? `, ${i.funded_12m} raised in the last 12 months` : ''}. Close to: ${i.why.join(', ')}.`}>
                <span style={{ minWidth: 0 }}>
                  <Link to={i.href} style={{ color: '#1a1a1a', fontWeight: 600, textDecoration: 'none' }}>{i.label}</Link>
                  <span style={{ display: 'block', fontSize: 11.5, color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>for {i.why.join(', ')}</span>
                </span>
                <span aria-hidden="true" style={{ height: 10, background: TRACK, borderRadius: 4, overflow: 'hidden' }}>
                  <span style={{ display: 'block', height: '100%', width: `${Math.max(2, Math.round((i.startups / max) * 100))}%`, background: BAR, borderRadius: 4 }} />
                </span>
                <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center', whiteSpace: 'nowrap', color: '#333' }}>
                  <b style={{ fontWeight: 600 }}>{i.startups.toLocaleString()}</b> startups
                  {i.new_90d != null && <span style={{ color: '#666' }}>· {i.new_90d} new</span>}
                  {i.rising && <span data-testid="landscape-rising" style={{ fontSize: 11.5, fontWeight: 600, color: '#1F7A4D', background: '#EAF6EF', borderRadius: 999, padding: '1px 8px', display: 'inline-flex', alignItems: 'center', gap: 3 }}><TrendingUp size={11} /> Rising</span>}
                </span>
              </li>
            ))}
          </ul>
        )}
        {data.momentum === false && (
          <p style={{ fontSize: 11.5, color: '#999', margin: '8px 0 0' }}>How fast each area is growing appears once OpenI has enough recent data.</p>
        )}
      </>)}
      {learned.length > 0 && (
        <div data-testid="landscape-learned" style={{ marginTop: 14 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#888', fontWeight: 600 }}>Built for {who} by OpenI's map builder</div>
          <ul style={{ listStyle: 'none', margin: '6px 0 0', padding: 0, display: 'grid', gap: 8 }}>
            {learned.map(m => (
              <li key={m.id} data-testid="learned-row" style={{ fontSize: 13 }} title={m.definition}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
                  <b style={{ fontWeight: 600 }}>{m.label}</b>
                  <span style={{ fontSize: 11.5, color: '#888' }}>for {m.source}</span>
                  <span style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}><b style={{ fontWeight: 600 }}>{m.startups}</b> startups{m.new_90d != null && <span style={{ color: '#666' }}> · {m.new_90d} new</span>}</span>
                  {m.rising && <span style={{ fontSize: 11.5, fontWeight: 600, color: '#1F7A4D', background: '#EAF6EF', borderRadius: 999, padding: '1px 8px', display: 'inline-flex', alignItems: 'center', gap: 3 }}><TrendingUp size={11} /> Rising</span>}
                  {client && m.promote && <span data-testid="learned-promote" title="Other clients' learned maps agree: a candidate for OpenI's shared Innovation Maps" style={{ fontSize: 11.5, color: '#7A3E9D' }}>· candidate for OpenI's maps</span>}
                </div>
                <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>{m.definition}</div>
                {m.examples?.length > 0 && <div style={{ fontSize: 12, color: '#777', marginTop: 2 }}>e.g. {m.examples.join(', ')}</div>}
              </li>
            ))}
          </ul>
        </div>
      )}
      {built && <p role="status" data-testid="map-build-result" style={{ fontSize: 12.5, color: '#1a1a1a', background: '#F4F7FB', borderRadius: 8, padding: '6px 10px', margin: '10px 0 0' }}>{built}</p>}
      {/* s125 — Rajeev: "build map is not working". It ran: OpenI has no startup yet that fits the priority (none doing
          flywheel storage), so the map is empty. A priority already tried says so instead of offering the button again. */}
      {untried.length > 0 && (
        <p data-testid="landscape-unmapped" style={{ fontSize: 12.5, color: '#6B5A24', background: '#FBF6EA', borderRadius: 8, padding: '6px 10px', margin: '10px 0 0' }}>
          No Innovation Map covers {untried.map(u => `"${u}"`).join(', ')} yet, so {untried.length === 1 ? 'it is' : 'they are'} not in this view. {client ? 'This client\'s brief' : 'Your agent'} still searches for {untried.length === 1 ? 'it' : 'them'} above.
          {build && (
            <button type="button" data-testid="build-maps" onClick={runBuild} disabled={building}
              style={{ marginLeft: 8, fontSize: 12.5, padding: '3px 10px', borderRadius: 8, border: '1px solid #C9A84C', background: building ? '#f4efe2' : '#C9A84C', color: '#0B1E3F', fontWeight: 600, cursor: building ? 'default' : 'pointer' }}>
              {building ? 'Building…' : untried.length === 1 ? 'Build a map for it' : 'Build maps for them'}
            </button>
          )}
        </p>
      )}
      {tried.length > 0 && (
        <p data-testid="landscape-tried" style={{ fontSize: 12.5, color: '#555', background: '#F6F6F4', borderRadius: 8, padding: '6px 10px', margin: '10px 0 0' }}>
          OpenI looked for startups doing {tried.map(u => `"${u}"`).join(', ')} and has not found any that fit yet: the analyst checked the closest companies and none of them {tried.length === 1 ? 'does it' : 'do these'}. The map builder looks again every night and the map appears here once it finds some. {client ? 'This client\'s brief' : 'Your agent'} still searches for {tried.length === 1 ? 'it' : 'them'} above.
        </p>
      )}
    </section>
  );
}
