/**
 * s121g (26 Sep 2026) — admin "Brief Preview", read-only.
 *
 * Two modes:
 *   An existing account — search, pick, see exactly the brief they see.
 *     Nothing on their account changes (no "last visit", no clicks); the view
 *     is audit-logged.
 *   A prospect — type a company's priorities and challenges and get a live
 *     brief from OpenI's real startup data, with no account created. Built for
 *     sales demos (SAP India first).
 */
import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Loader2, Search, Plus, X, Sparkles, Download } from 'lucide-react';
import { briefPreviewAPI } from '../../services/api';
import { BriefCard, VerifiedNote, GapNote } from './InnovationBrief';
import { focusLabel } from '../../utils/focusLabel';
import { applyLabel } from '../../utils/briefLabels';
import PainBriefPanel from './PainBriefPanel';
import BriefShortlists, { activeShareToken, shareUrl, copyText } from './BriefShortlists';
import { LensBar, LensTag, OutcomeView } from './BriefLens';

const G = '#D0A848';
const btn = { fontSize: 13, padding: '7px 12px', borderRadius: 8, border: '1px solid #e2e2e2', background: '#fff', color: '#333', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 };
const input = { width: '100%', border: '1px solid #ddd', borderRadius: 8, padding: '8px 10px', fontSize: 13.5, fontFamily: 'inherit' };
const label = { fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 };
const LENS_BADGE = { partner: 'Partner', source: 'Source', invest: 'Invest' };
const PERSONAS = ['corporate', 'investor', 'incubator', 'accelerator', 'government', 'academia', 'student', 'mentor', 'startup'];

// Drafted from public information for the SAP India demo (see the prototype brief).
const SAP_INDIA = {
  company: 'SAP India',
  role: 'corporate',
  priorities: [
    'Business AI agents and copilots for enterprise workflows',
    'Indian language and voice AI',
    'Mid-market cloud ERP and business software for Indian SMEs',
    'GST, e-invoicing and payments compliance',
    'Industrial IoT and smart manufacturing',
    'Supply chain and distributor management for consumer brands',
    'Sustainability, carbon accounting and BRSR reporting',
  ].join('\n'),
  challenges: [
    { title: 'AI agents that automate finance and procurement for Indian mid-market companies', text: 'Startups building AI agents or copilots that automate accounts payable, invoicing, procurement and GST compliance on top of ERP systems for Indian mid-sized businesses.' },
  ],
};

// s121k — accuracy of a section against the admin's labels.
function SectionScore({ q }) {
  if (!q.labeled) return <span style={{ fontSize: 12, color: '#999', marginLeft: 'auto' }}>Not labelled yet: mark each startup 👍 or 👎</span>;
  const pct = Math.round((q.good / q.labeled) * 100);
  return <span data-testid="section-score" style={{ fontSize: 12.5, marginLeft: 'auto', color: pct >= 80 ? '#2E7D4F' : pct >= 50 ? '#8A6A1C' : '#A33', fontWeight: 600 }}>
    {pct}% accurate <span style={{ fontWeight: 400, color: '#777' }}>({q.good} good · {q.bad} bad of {q.labeled} labelled)</span></span>;
}

// s122 — the nightly accuracy snapshots (brief_quality_daily), last 7 days.
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const dayLabel = (d) => { const [, m, day] = String(d).split('-').map(Number); return m ? `${day} ${MONTHS[m - 1]}` : d; };
function AccuracyTrend({ history }) {
  const pts = (history || []).filter(h => h.accuracy != null).slice(-7);
  if (!pts.length) return null;
  return (
    <span data-testid="accuracy-trend" style={{ color: '#777', fontSize: 12.5 }}>
      Trend: {pts.map((h, i) => (
        <span key={h.day}>{i > 0 && ' → '}{dayLabel(h.day)} <strong style={{ fontWeight: 600, color: '#555' }}>{h.accuracy}%</strong></span>
      ))}
    </span>
  );
}

// s121k — accuracy across every client an admin has labelled.
function QualityPanel({ refreshKey }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    let live = true;
    briefPreviewAPI.quality().then(d => { if (live) setData(d); }).catch(() => {});
    return () => { live = false; };
  }, [refreshKey]);
  if (!data || !data.clients?.length) return null;
  return (
    <div data-testid="quality-panel" style={{ border: '1px solid #eee', borderRadius: 12, padding: '12px 16px', margin: '12px 0 4px', background: '#fff' }}>
      <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888', fontWeight: 600, marginBottom: 6 }}>Brief accuracy (your labels)</div>
      {data.clients.map(c => (
        <div key={c.id} style={{ display: 'flex', gap: 12, fontSize: 13, padding: '3px 0', flexWrap: 'wrap' }}>
          <strong style={{ fontWeight: 600, minWidth: 160 }}>{c.company}</strong>
          <span>{c.accuracy == null ? 'no labelled startups shown' : `${c.accuracy}% accurate`}</span>
          <span style={{ color: '#777' }}>{c.good} good of {c.labeled} labelled · {c.shown} shown</span>
          <AccuracyTrend history={c.history} />
        </div>
      ))}
      <div style={{ fontSize: 12, color: '#777', marginTop: 6 }}>
        Clients' own clicks, last 30 days: {data.clicks_30d.shortlist} shortlisted · {data.clicks_30d.intro} intros · {data.clicks_30d.dismiss} marked not relevant</div>
    </div>
  );
}

function BriefResult({ brief, onAdd, onRemove, onLabel, onLens, onPdf, busy }) {
  const [label, setLabel] = useState('');
  // s121j — what the agent suggests for this client (read-only; nothing cached on their account).
  const [suggestions, setSuggestions] = useState([]);
  const userId = brief?.preview === 'user' ? brief.user?.id : null;
  // Refresh suggestions only when the client's priorities change, not on every 👍/👎 (s121l).
  const priorityKeys = (brief?.priorities || []).map(p => p.key).join('|');
  useEffect(() => {
    let live = true;
    setSuggestions([]);
    if (userId) briefPreviewAPI.suggestions(userId).then(r => { if (live) setSuggestions(r.suggestions || []); }).catch(() => {});
    return () => { live = false; };
  }, [userId, priorityKeys]);
  // s122 — what the personalisation loop has learned about this client (read-only).
  const [taste, setTaste] = useState(null);
  useEffect(() => {
    let live = true;
    setTaste(null);
    if (userId) briefPreviewAPI.taste(userId).then(t => { if (live) setTaste(t); }).catch(() => {});
    return () => { live = false; };
  }, [userId]);
  // s122 — the Grow / Cut / Venture lens; cleared when the brief's subject or priorities change.
  const [lens, setLens] = useState(null);
  const [lensLoading, setLensLoading] = useState(false);
  const [view, setView] = useState('priority');
  const [lensFilter, setLensFilter] = useState(null);
  const subjectKey = `${userId || brief?.company || ''}|${priorityKeys}`;
  useEffect(() => { setLens(null); setView('priority'); setLensFilter(null); }, [subjectKey]);
  const runLens = async () => {
    setLensLoading(true);
    try { setLens(await onLens()); setView('outcome'); }
    catch (err) { toast.error(err.message || 'Could not read this brief through the lens'); }
    finally { setLensLoading(false); }
  };
  // s122 action A2 — the brief (with the Strategy map) as a branded PDF for a client meeting.
  const [pdfBusy, setPdfBusy] = useState(false);
  const downloadPdf = async () => {
    setPdfBusy(true);
    try {
      const { blob, name } = await onPdf();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success('PDF downloaded');
    } catch (err) {
      toast.error(err.message || 'Could not build the PDF');
    } finally { setPdfBusy(false); }
  };
  // s122 — "Save to watchlist" (Rajeev: "I can't find watchlist function from Innovation brief"):
  // the admin's own "<Client> — <priority>" lists, shared with the client as a read-only link.
  const client = ((brief?.preview === 'prospect' ? brief.company : (brief?.user?.organization || brief?.user?.name)) || '').trim();
  const [saved, setSaved] = useState({});   // list name -> Set(startup user ids)
  const [savedKey, setSavedKey] = useState(0);
  useEffect(() => {
    let live = true;
    setSaved({});
    if (client) briefPreviewAPI.watchlists(client).then(r => {
      if (live) setSaved(Object.fromEntries((r.lists || []).map(l => [l.name, new Set(l.startup_user_ids)])));
    }).catch(() => {});
    return () => { live = false; };
  }, [client, savedKey]);
  const listFor = (label) => `${client} — ${label || 'Shortlist'}`;
  const toggleSave = async (it, label) => {
    const on = saved[listFor(label)]?.has(it.user_id);
    try {
      const r = await briefPreviewAPI.saveWatchlist({ client, priority_label: label, startup_user_id: it.user_id, remove: on });
      setSavedKey(k => k + 1);
      if (on) { toast.success(`Removed ${it.name} from ${r.watchlist.name}`); return; }
      toast.success((t) => (
        <span data-testid="pv-save-toast">
          Saved to <b>{r.watchlist.name}</b>.{' '}
          <a href={`/dashboard/watchlist?list=${r.watchlist.id}`} onClick={() => toast.dismiss(t.id)} style={{ color: '#8A6A1C', fontWeight: 600 }}>Open</a>
          {' · '}
          <a href="#share" data-testid="pv-save-toast-share" style={{ color: '#8A6A1C', fontWeight: 600 }} onClick={async (e) => {
            e.preventDefault(); toast.dismiss(t.id);
            try {
              const url = shareUrl(await activeShareToken(r.watchlist.id));
              if (await copyText(url)) toast.success(`Share link copied — send it to ${client}`);
              else toast.success(`Share link: ${url}`, { duration: 10000 });
            } catch (err) { toast.error(err.message || 'Could not create a share link'); }
          }}>Share</a>
        </span>
      ), { duration: 6000 });
    } catch (err) { toast.error(err.message || 'Could not update the watchlist'); }
  };
  if (!brief) return null;
  const submit = (e) => {
    e.preventDefault();
    const { label: clean, error } = focusLabel(label);
    if (error) { toast.error(error); return; }
    onAdd(clean); setLabel('');
  };
  const items = brief.sections.flatMap(s => s.items);
  const renderCard = (it, s) => {
    const tag = lens && it.type === 'startup' ? lens.lens[it.user_id] : null;
    // The lens's action replaces the stage-based badge, so the card never contradicts its tag.
    const shown = tag ? { ...it, relationship: LENS_BADGE[tag.action] } : it;
    const saveLabel = it.priority_label || s.title;
    const card = <BriefCard item={shown} readOnly
      adminSave={client && it.type === 'startup' ? { saved: Boolean(saved[listFor(saveLabel)]?.has(it.user_id)), onToggle: () => toggleSave(it, saveLabel) } : null}
      adminLabel={onLabel && it.type === 'startup' && s.priority_key
        ? { value: it.eval_label || null, onLabel: (label) => onLabel({ priority_key: s.priority_key, startup_user_id: it.user_id, label }) } : null} />;
    return tag
      ? <div key={`${it.type}:${it.user_id || it.id}`} style={{ display: 'flex', flexDirection: 'column' }}>{card}<LensTag tag={tag} lens={lens} /></div>
      : <div key={`${it.type}:${it.user_id || it.id}`} style={{ display: 'flex', flexDirection: 'column' }}>{card}</div>;
  };
  return (
    <div style={{ marginTop: 24 }} data-testid="preview-result">
      <div style={{ background: '#152838', color: '#EEF2F5', borderRadius: 12, padding: '12px 16px', display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
        <strong style={{ color: '#fff', fontWeight: 600 }}>
          {brief.preview === 'prospect' ? `Preview: ${brief.company || 'Prospect'}` : `Preview: ${brief.user?.name || 'User'}`}
        </strong>
        <span style={{ fontSize: 13, color: '#C9D3DB' }}>{brief.role} · {items.length} matches · viewing saves nothing{brief.preview === 'user' ? '; added focus areas are saved to their brief' : ''}</span>
        {onPdf && (
          <button type="button" data-testid="brief-pdf" onClick={downloadPdf} disabled={pdfBusy}
            style={{ ...btn, marginLeft: 'auto', background: '#D0A848', borderColor: '#D0A848', color: '#152838', fontWeight: 600 }}>
            {pdfBusy ? <Loader2 className="animate-spin" size={14} /> : <Download size={14} />} {pdfBusy ? 'Preparing PDF…' : 'Download PDF'}
          </button>
        )}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
        {brief.priorities.map((p, i) => (
          <span key={p.key} style={{ fontSize: 12.5, border: `1px solid ${p.on ? G : '#ddd'}`, background: p.on ? '#FBF6EA' : '#fff', borderRadius: 999, padding: '3px 10px', opacity: p.on ? 1 : 0.55, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <span style={{ color: '#8A6A1C', fontSize: 11 }}>#{i + 1}</span>{p.label}
            {onRemove && p.source === 'custom' && <button type="button" disabled={busy} onClick={() => onRemove(p.key)} aria-label={`Remove ${p.label}`}
              style={{ border: 0, background: 'transparent', cursor: 'pointer', padding: 0, color: '#888', display: 'inline-flex' }}><X size={12} /></button>}
          </span>
        ))}
      </div>
      {onAdd && (
        <form onSubmit={submit}
          style={{ display: 'flex', gap: 6, marginTop: 10, maxWidth: 560, alignItems: 'center', flexWrap: 'wrap' }}>
          <input id="pv-add-priority" value={label} onChange={e => setLabel(e.target.value)} maxLength={80}
            placeholder="Add a focus area for this client (they will see it too)" style={{ ...input, flex: 1, minWidth: 240 }} />
          <button type="submit" disabled={busy || label.trim().length < 3} style={btn}><Plus size={14} /> Add for client</button>
        </form>
      )}
      {onAdd && suggestions.length > 0 && (
        <div data-testid="pv-suggestions" style={{ marginTop: 10, maxWidth: 900 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
            <Sparkles size={11} /> Suggested by OpenI for this client</div>
          {suggestions.map(sg => (
            <div key={sg.label} style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap', fontSize: 13, marginBottom: 4 }}>
              <button type="button" disabled={busy} onClick={() => onAdd(sg.label)} style={{ ...btn, padding: '2px 10px' }}><Plus size={12} /> {sg.label}</button>
              {sg.why && <span style={{ color: '#666' }}>{sg.why}</span>}
            </div>
          ))}
        </div>
      )}
      {taste && (
        <div data-testid="pv-taste" style={{ marginTop: 12, fontSize: 13, color: '#444', maxWidth: 900 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888', fontWeight: 600, marginBottom: 4 }}>
            Learned from this client's behaviour {taste.learned_at ? `· ${new Date(taste.learned_at).toLocaleDateString()}` : ''}</div>
          {taste.insights.length === 0 ? <span style={{ color: '#888' }}>Nothing yet: too few shortlists / passes to say anything.</span>
            : taste.insights.map(i => (
              <div key={i.key} style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                <span style={{ textDecoration: i.status === 'reject' ? 'line-through' : 'none', color: i.status === 'reject' ? '#999' : '#333' }}>{i.text}</span>
                <span style={{ fontSize: 11.5, color: i.status === 'keep' ? '#2E7D4F' : i.status === 'reject' ? '#A33' : '#888' }}>
                  {i.status === 'keep' ? 'kept by client' : i.status === 'reject' ? '"Not me"' : 'in use, not yet confirmed'}</span>
              </div>
            ))}
          {taste.metrics?.length > 0 && (() => {
            const m = taste.metrics[taste.metrics.length - 1];
            return <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>Last 30 days: {m.shortlists} shortlisted, {m.dismisses} passed{m.dismiss_rate != null ? ` (${Math.round(m.dismiss_rate * 100)}% passed)` : ''}.</div>;
          })()}
        </div>
      )}
      {client && (
        <BriefShortlists refreshKey={savedKey} tag="brief-preview" namePrefix={`${client} — `} title={`Saved for ${client}`}
          id="pv-saved" testId="pv-saved"
          emptyText={`Press "Save" on a startup to add it to a watchlist named after its priority, e.g. "${client} — ${brief.sections.find(x => x.priority_key)?.title || 'Retail media'}". Then copy a read-only link to share with ${client}.`} />
      )}
      {onLens && items.some(it => it.type === 'startup') && (
        <LensBar lens={lens} loading={lensLoading} onRun={runLens} view={view} setView={setView}
          client={(brief.preview === 'prospect' ? brief.company : (brief.user?.organization || brief.user?.name)) || 'this client'} filter={lensFilter} setFilter={setLensFilter} />
      )}
      {lens && view === 'outcome' ? <OutcomeView brief={brief} lens={lens} renderCard={renderCard} filter={lensFilter} clearFilter={() => setLensFilter(null)} /> : brief.sections.filter(s => s.items.length || s.gap).map(s => (
        <section key={s.id} style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', borderBottom: '1px solid #eee', paddingBottom: 6, marginBottom: 12 }}>
            <h2 style={{ fontSize: 17, fontWeight: 600, margin: 0 }}>{s.title}</h2>
            <span style={{ fontSize: 12.5, color: '#888' }}>{s.question}</span>
            {s.verified && <VerifiedNote />}
            {s.quality && <SectionScore q={s.quality} />}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 12 }}>
            {s.items.map(it => renderCard(it, s))}
          </div>
          <GapNote s={s} />
        </section>
      ))}
      {brief.sections.every(s => !s.items.length) && (
        <p style={{ marginTop: 20, color: '#666' }}>No matches yet for these priorities.</p>
      )}
      {(() => {
        const empty = brief.sections.filter(s => !s.items.length && !s.gap);
        return empty.length > 0 && !brief.sections.every(s => !s.items.length)
          ? <p style={{ marginTop: 20, fontSize: 13, color: '#777' }}>No strong matches yet for {empty.map(s => s.title).join(', ')}.</p> : null;
      })()}
    </div>
  );
}

export default function AdminBriefPreview() {
  const [mode, setMode] = useState('user');
  const [q, setQ] = useState('');
  const [users, setUsers] = useState([]);
  const [prospect, setProspect] = useState({ company: '', website: '', role: 'corporate', priorities: '', challenges: [{ title: '', text: '' }] });
  const [brief, setBrief] = useState(null);
  const [busy, setBusy] = useState(false);

  const search = async (e) => {
    e.preventDefault();
    if (q.trim().length < 2) return;
    setBusy(true);
    try { setUsers((await briefPreviewAPI.findUsers(q.trim())).users || []); }
    catch (err) { toast.error(err.message || 'Search failed'); }
    finally { setBusy(false); }
  };
  // s122: the open account lives in the URL (?user=<id>), so Back from a
  // startup profile returns to that client's brief instead of an empty search
  // (Rajeev, 29 Sep: "back button takes you here instead of Dentsu Innovation brief").
  const [params, setParams] = useSearchParams();
  const loadUser = async (id) => {
    setBusy(true); setBrief(null);
    try { setBrief(await briefPreviewAPI.user(id)); }
    catch (err) { toast.error(err.message || 'Could not build that brief'); }
    finally { setBusy(false); }
  };
  const urlUser = params.get('user');
  const openUser = (u) => (String(u.id) === urlUser ? loadUser(u.id) : setParams({ user: String(u.id) }));
  useEffect(() => {
    if (urlUser && /^\d+$/.test(urlUser)) { setMode('user'); loadUser(Number(urlUser)); }
  }, [urlUser]); // eslint-disable-line react-hooks/exhaustive-deps
  // The payload the shown prospect brief was built from, so the lens reads the same brief.
  const prospectPayload = useRef(null);
  const buildProspect = async (e) => {
    e.preventDefault();
    setBusy(true); setBrief(null);
    try {
      const payload = {
        company: prospect.company,
        role: prospect.role,
        priorities: prospect.priorities.split('\n').map(s => s.trim()).filter(Boolean),
        challenges: prospect.challenges.filter(c => c.title.trim()),
      };
      prospectPayload.current = payload;
      setBrief(await briefPreviewAPI.prospect(payload));
    } catch (err) { toast.error(err.message || 'Could not build that brief'); }
    finally { setBusy(false); }
  };
  const editUser = async (payload) => {
    setBusy(true);
    try { setBrief(await briefPreviewAPI.editPriorities(brief.user.id, payload)); toast.success('Saved to the client\'s brief.'); }
    catch (err) { toast.error(err.message || 'Could not save that'); }
    finally { setBusy(false); }
  };
  // s121k — accuracy labels; the response is the rebuilt preview.
  const [labelled, setLabelled] = useState(0);
  // Optimistic (Rajeev, 26 Sep: "it takes 2-3 seconds to turn green"): the
  // button and score update on click; the server's rebuilt preview (which may
  // backfill a 👎 slot) replaces it when it arrives, unless a newer click is
  // in flight. On failure the click is undone.
  const labelSeq = useRef(0);
  const labelStartup = async (payload) => {
    const before = brief;
    const seq = ++labelSeq.current;
    setBrief(b => applyLabel(b, payload));
    try {
      const fresh = await briefPreviewAPI.label(before.user.id, payload);
      if (seq === labelSeq.current) setBrief(fresh);
      setLabelled(n => n + 1);
    } catch (err) {
      if (seq === labelSeq.current) setBrief(before);
      toast.error(err.message || 'Could not save that label');
    }
  };
  const setChallenge = (i, field, value) => setProspect(p => ({ ...p, challenges: p.challenges.map((c, j) => j === i ? { ...c, [field]: value } : c) }));

  const tab = (id, text) => (
    <button type="button" onClick={() => { setMode(id); setBrief(null); if (params.get('user')) setParams({}); }} aria-pressed={mode === id ? 'true' : 'false'}
      style={{ ...btn, ...(mode === id ? { background: '#152838', color: '#fff', borderColor: '#152838' } : {}) }}>{text}</button>
  );

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: '8px 4px 40px' }} data-testid="brief-preview">
      <h1 id="tour-page-admin-brief-preview" style={{ fontSize: 24, fontWeight: 600, margin: '4px 0 6px' }}>Brief Preview</h1>
      <p style={{ fontSize: 14, color: '#555', margin: 0, maxWidth: '75ch' }}>
        See the Innovation Brief any account sees, or build one for a prospect from their priorities. Viewing saves nothing to anyone's account. Only "Add for client" and × on a focus area change a client's brief (audited).
        Mark startups 👍 good fit or 👎 bad fit to measure accuracy; a 👎 also hides that startup from the client.
      </p>
      <QualityPanel refreshKey={labelled} />
      <div id="tour-brief-preview-modes" style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        {tab('user', 'An existing account')}
        {tab('prospect', 'A prospect (no account)')}
      </div>

      {mode === 'user' ? (
        <div style={{ marginTop: 16 }}>
          <form onSubmit={search} style={{ display: 'flex', gap: 8, maxWidth: 520 }}>
            <input id="preview-search" style={input} value={q} onChange={e => setQ(e.target.value)} placeholder="Company, name or email (e.g. Dentsu)" />
            <button type="submit" style={{ ...btn, background: G, borderColor: G, color: '#152838', fontWeight: 600 }} disabled={busy}><Search size={14} /> Find</button>
          </form>
          {users.length > 0 && (
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 620 }}>
              {users.map(u => (
                <button key={u.id} type="button" onClick={() => openUser(u)} style={{ ...btn, justifyContent: 'space-between', width: '100%' }}>
                  <span style={{ textAlign: 'left' }}><strong style={{ fontWeight: 600 }}>{u.organization || u.name}</strong> <span style={{ color: '#777' }}>· {u.name} · {u.email}</span></span>
                  <span style={{ fontSize: 11.5, color: '#8A6A1C' }}>{u.role}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={buildProspect} style={{ marginTop: 16, display: 'grid', gap: 12, maxWidth: 760 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" style={btn} onClick={() => setProspect({ website: '', ...SAP_INDIA, challenges: SAP_INDIA.challenges.map(c => ({ ...c })) })}>Load SAP India example</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2fr) minmax(0,1fr)', gap: 12 }}>
            <div><label htmlFor="pv-company" style={label}>Company</label>
              <input id="pv-company" style={input} value={prospect.company} onChange={e => setProspect(p => ({ ...p, company: e.target.value }))} /></div>
            <div><label htmlFor="pv-role" style={label}>Persona</label>
              <select id="pv-role" style={input} value={prospect.role} onChange={e => setProspect(p => ({ ...p, role: e.target.value }))}>
                {PERSONAS.map(r => <option key={r} value={r}>{r}</option>)}
              </select></div>
          </div>
          <div><label htmlFor="pv-website" style={label}>Website (optional, used for the pain points)</label>
            <input id="pv-website" style={input} placeholder="e.g. dentsu.com" value={prospect.website} onChange={e => setProspect(p => ({ ...p, website: e.target.value }))} /></div>
          {/* s122 — Dentsu's "pain brief": draft priorities from public signals. */}
          <PainBriefPanel company={prospect.company} website={prospect.website}
            onUse={(labels) => setProspect(p => {
              const have = p.priorities.split('\n').map(s => s.trim()).filter(Boolean);
              const add = labels.filter(l => !have.some(h => h.toLowerCase() === l.toLowerCase()));
              return { ...p, priorities: [...add, ...have].join('\n') };
            })} />
          <div><label htmlFor="pv-priorities" style={label}>Priorities: sectors, functions or use cases, one per line, most important first</label>
            <textarea id="pv-priorities" rows={6} style={input} value={prospect.priorities} onChange={e => setProspect(p => ({ ...p, priorities: e.target.value }))} /></div>
          <div>
            <span style={label}>Challenges they are working on (optional, ranked first)</span>
            {prospect.challenges.map((c, i) => (
              <div key={i} style={{ display: 'grid', gap: 6, marginBottom: 8, border: '1px solid #eee', borderRadius: 10, padding: 10, background: '#fff' }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input id={`pv-ch-title-${i}`} aria-label={`Challenge ${i + 1} title`} style={input} placeholder="Challenge title" value={c.title} onChange={e => setChallenge(i, 'title', e.target.value)} />
                  {prospect.challenges.length > 1 && <button type="button" style={btn} aria-label={`Remove challenge ${i + 1}`}
                    onClick={() => setProspect(p => ({ ...p, challenges: p.challenges.filter((_, j) => j !== i) }))}><X size={14} /></button>}
                </div>
                <textarea id={`pv-ch-text-${i}`} aria-label={`Challenge ${i + 1} description`} rows={2} style={input} placeholder="What they need, in a sentence or two" value={c.text} onChange={e => setChallenge(i, 'text', e.target.value)} />
              </div>
            ))}
            {prospect.challenges.length < 3 && <button type="button" style={btn} onClick={() => setProspect(p => ({ ...p, challenges: [...p.challenges, { title: '', text: '' }] }))}><Plus size={14} /> Add a challenge</button>}
          </div>
          <div><button type="submit" disabled={busy} style={{ ...btn, background: G, borderColor: G, color: '#152838', fontWeight: 600 }}>Build brief</button></div>
        </form>
      )}

      {busy && <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 20, color: '#666' }}><Loader2 className="animate-spin" size={16} /> Building the brief…</div>}
      <BriefResult brief={brief} busy={busy}
        onAdd={brief?.preview === 'user' ? (label) => editUser({ add: [label] }) : null}
        onRemove={brief?.preview === 'user' ? (key) => editUser({ remove: [key] }) : null}
        onLabel={brief?.preview === 'user' ? labelStartup : null}
        onLens={() => briefPreviewAPI.lens(brief?.preview === 'user' ? { user_id: brief.user.id } : { prospect: prospectPayload.current })}
        onPdf={() => briefPreviewAPI.pdf(brief?.preview === 'user' ? { user_id: brief.user.id } : { prospect: prospectPayload.current })} />
    </div>
  );
}
