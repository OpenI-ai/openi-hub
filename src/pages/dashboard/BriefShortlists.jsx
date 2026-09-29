/**
 * s122 action agent A3 (29 Sep 2026) — "Share the shortlist".
 *
 * Shortlisting in the brief fills a watchlist named after the priority
 * ("Innovation Brief — Retail media", action A1). This strip lists those
 * watchlists with two actions: Open, and Copy share link — a read-only public
 * page (/watchlists/share/:token) the client can send to a colleague or paste
 * into a deck. It reuses the watchlist's existing share links: an active link
 * is copied again rather than minting a new one each click. Links expire after
 * 30 days and can be revoked from the watchlist page.
 *
 * Always rendered (empty state included) so the page tour can point at it.
 */
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Share2, Link2, FolderOpen } from 'lucide-react';
import { watchlistAPI } from '../../services/api';

const TAG = 'innovation-brief';
const btn = { fontSize: 12, padding: '4px 10px', borderRadius: 8, border: '1px solid #e2e2e2', background: '#fff', color: '#333', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none' };

export function shareUrl(token) {
  return `${window.location.origin}/watchlists/share/${token}`;
}

/** An active (not revoked, not expired) link for this watchlist, or a new one. */
export async function activeShareToken(watchlistId) {
  const shares = await watchlistAPI.listShares(watchlistId).catch(() => []);
  const live = (shares || []).find(s => !s.revoked_at && (!s.expires_at || new Date(s.expires_at) > new Date()));
  if (live) return live.token;
  const created = await watchlistAPI.createShare(watchlistId, { expires_in_days: 30 });
  return created.token;
}

export async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
}

export default function BriefShortlists({ refreshKey }) {
  const [lists, setLists] = useState(null);
  const [busy, setBusy] = useState(null);
  const [links, setLinks] = useState({});

  useEffect(() => {
    let live = true;
    watchlistAPI.list()
      .then(rows => { if (live) setLists((rows || []).filter(w => (w.tags || []).includes(TAG) && w.my_role === 'owner')); })
      .catch(() => { if (live) setLists([]); });
    return () => { live = false; };
  }, [refreshKey]);

  const share = async (wl) => {
    setBusy(wl.id);
    try {
      const url = shareUrl(await activeShareToken(wl.id));
      setLinks(l => ({ ...l, [wl.id]: url }));
      toast.success((await copyText(url)) ? 'Share link copied — anyone with it can view this shortlist' : 'Share link ready — copy it below');
    } catch (err) { toast.error(err.message || 'Could not create a share link'); }
    finally { setBusy(null); }
  };

  return (
    <div id="tour-brief-shortlists" data-testid="brief-shortlists" style={{ marginTop: 16, background: '#fff', border: '1px solid #eee', borderRadius: 14, padding: '12px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 14, color: '#1a1a1a' }}>
        <Share2 size={15} color="#8A6A1C" /> Your shortlists
      </div>
      {lists === null ? null : lists.length === 0 ? (
        <p style={{ fontSize: 13, color: '#666', margin: '6px 0 0' }}>
          Shortlist a startup below and it is saved to a watchlist named after that priority. You can then share the list with your team as a read-only link.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
          {lists.map(wl => (
            <div key={wl.id} data-testid="brief-shortlist-row" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13.5, flex: '1 1 220px' }}>
                <b>{wl.name.replace(/^Innovation Brief — /, '')}</b>{' '}
                <span style={{ color: '#888' }}>· {wl.startup_count} startup{wl.startup_count === 1 ? '' : 's'}</span>
              </span>
              <a href={`/dashboard/watchlist?list=${wl.id}`} style={btn}><FolderOpen size={13} /> Open</a>
              <button type="button" style={btn} disabled={busy === wl.id || !wl.startup_count} onClick={() => share(wl)} data-testid="brief-shortlist-share"
                title={wl.startup_count ? 'Copy a read-only link to this shortlist' : 'Shortlist a startup first'}>
                <Link2 size={13} /> {busy === wl.id ? 'Creating…' : 'Copy share link'}
              </button>
              {links[wl.id] && (
                <input readOnly value={links[wl.id]} data-testid="brief-shortlist-link" onFocus={e => e.target.select()}
                  style={{ flex: '1 1 100%', fontSize: 12, padding: '4px 8px', border: '1px solid #e2e2e2', borderRadius: 6, color: '#333' }} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
