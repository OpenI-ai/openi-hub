/**
 * Phase 72 — What's New (dynamic, persona-aware, auto-populated).
 *
 * Replaces the Phase-22 hardcoded CHANGELOG array. Reads from
 * GET /api/whats-new — backend returns is_published rows where audience='{}'
 * OR user's role is in audience, ordered posted_at DESC, id DESC.
 *
 * Auto-population happens at backend boot (src/server.js) via
 * whatsNewController.syncFromGitHub() which fetches Phase commits from both
 * repos via the GitHub REST API and GPT-translates each into user-friendly
 * title/summary/body_md. Idempotent thanks to UNIQUE(commit_hash).
 */
import { useState, useEffect } from 'react';
import { Sparkles, Loader2, RefreshCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { whatsNewAPI } from '../../services/api';

const G = '#D5AA5B';
const card = { background: '#fff', border: '1px solid #eee', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: 20 };

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch (e) {
    return dateStr;
  }
}

// Render the body_md field as a simple bullet list. We deliberately do NOT
// pull in a full markdown library — body_md is constrained by the GPT prompt
// to "2-3 short bullet points formatted as markdown ('- item')".
function BodyBullets({ body }) {
  if (!body) return null;
  // Pre-normalize comma+bullet-marker patterns to newline+bullet-marker so
  // GPT outputs like "first,\n- second,- third" or "a,* b,* c" split into
  // separate bullets. Carry-forward fix 21 May 2026.
  const normalized = body.replace(/,\s*([-*\u2022])\s*/g, '\n$1 ');
  const lines = normalized
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const bullets = lines
    .map((l) => l.replace(/^[-*•]\s*/, ''))
    .filter((l) => l.length > 0);
  if (bullets.length === 0) return null;
  return (
    <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: 13, color: '#444', lineHeight: 1.55 }}>
      {bullets.map((b, i) => (
        <li key={i} style={{ marginBottom: 4 }}>{b}</li>
      ))}
    </ul>
  );
}

// Group entries by date so multiple phases shipped the same day collapse
// into one date-headed card.
function groupByDate(entries) {
  const groups = new Map();
  for (const e of entries) {
    const key = (e.posted_at || '').slice(0, 10);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(e);
  }
  // entries are already DESC, so insertion order preserves it
  return [...groups.entries()].map(([date, items]) => ({ date, items }));
}

export default function WhatsNew() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(0);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await whatsNewAPI.list();
      setEntries(Array.isArray(data?.entries) ? data.entries : []);
    } catch (err) {
      setError(err.message || 'Failed to load updates');
      toast.error('Failed to load updates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // Phase 74 — mark all currently-visible entries as seen for this user.
    // Fire-and-forget: a failure here must not interrupt the page render.
    // Other tabs / sidebars listening for the 'whatsnew:seen' event refresh
    // their unread-count chip without a hard reload.
    whatsNewAPI.markSeen()
      .then(() => {
        try { window.dispatchEvent(new Event('whatsnew:seen')); } catch (e) { /* noop */ }
      })
      .catch(() => { /* swallow: badge will resync next mount */ });
  }, []);

  const groups = groupByDate(entries);

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Sparkles size={22} color={G} />
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>What's New</h1>
        </div>
        <button
          onClick={load}
          disabled={loading}
          title="Reload latest updates"
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'transparent', border: '1px solid #eee', color: '#666',
            padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
          }}
        >
          <RefreshCcw size={12} /> Refresh
        </button>
      </div>
      <p style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>
        Latest platform updates — relevant to your role
      </p>

      {loading && entries.length === 0 ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <Loader2 size={32} style={{ color: G, animation: 'spin 1s linear infinite' }} />
        </div>
      ) : error && entries.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', padding: 40 }}>
          <p style={{ color: '#a00', fontSize: 13, margin: 0 }}>{error}</p>
        </div>
      ) : entries.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', padding: 40 }}>
          <Sparkles size={32} style={{ color: G, opacity: 0.5, marginBottom: 12 }} />
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', margin: '0 0 6px' }}>No updates yet</h3>
          <p style={{ color: '#666', fontSize: 13, margin: 0 }}>
            Platform updates will appear here as new features ship.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {groups.map((g, gi) => (
            <div key={`${g.date}-${gi}`} style={card}>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, cursor: 'pointer' }}
                onClick={() => setExpanded(expanded === gi ? -1 : gi)}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', marginBottom: 2 }}>
                    {formatDate(g.date)}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>
                    {g.items.length === 1 ? g.items[0].title : `${g.items.length} updates`}
                    {gi === 0 && (
                      <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: G, color: '#fff', marginLeft: 8, verticalAlign: 'middle' }}>
                        LATEST
                      </span>
                    )}
                  </div>
                </div>
                <span style={{ fontSize: 12, color: '#bbb', marginLeft: 12 }}>{expanded === gi ? '▲' : '▼'}</span>
              </div>

              {expanded === gi && (
                <div style={{ display: 'grid', gap: 14, marginTop: 8 }}>
                  {g.items.map((item, ii) => (
                    <div
                      key={item.id}
                      style={{
                        padding: '10px 0',
                        borderTop: ii > 0 ? '1px solid #f5f5f5' : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <div
                          style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: `${G}1A`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}
                        >
                          <Sparkles size={16} color={G} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', marginBottom: 4 }}>
                            {g.items.length === 1 ? null : item.title}
                          </div>
                          {item.body_md ? (
                            <BodyBullets body={item.body_md} />
                          ) : item.summary ? (
                            <div style={{ fontSize: 13, color: '#666', lineHeight: 1.5 }}>{item.summary}</div>
                          ) : null}
                          {Array.isArray(item.audience) && item.audience.length > 0 && (
                            <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                              {item.audience.map((a) => (
                                <span
                                  key={a}
                                  style={{
                                    fontSize: 9, padding: '2px 6px', background: '#f7f5f0',
                                    color: '#888', borderRadius: 4, fontWeight: 500,
                                  }}
                                >
                                  {a.replace('_', ' ')}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
