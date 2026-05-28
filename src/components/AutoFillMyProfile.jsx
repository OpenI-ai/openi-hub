/**
 * AutoFillMyProfile — Phase 38
 *
 * Self-service auto-fill for startup owners. Scrapes their website + AI polishes
 * the content, then shows a diff UI where the user can selectively accept fields.
 *
 * Props:
 *  - currentProfile: the user's current startup_profiles row (used for diff rendering)
 *  - onApplied: () => void — called after successful apply so parent can refetch
 */
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Sparkles, RefreshCw, Check, ExternalLink, Loader2, Info, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { crawlAPI } from '../services/api';

const G = '#D5AA5B';

// Field definitions: key used in API, label, how to render preview
const FIELDS = [
  { key: 'description', label: 'Description',  type: 'text',      scrapedField: 'scraped_description', currentKey: 'description' },
  { key: 'logo',        label: 'Logo',         type: 'image',     scrapedField: 'scraped_logo_url',    currentKey: 'logo_url' },
  { key: 'founded',     label: 'Founded year', type: 'text',      scrapedField: 'scraped_founded',     currentKey: 'founded_year' },
  { key: 'social',      label: 'Social links', type: 'social',    scrapedField: 'scraped_social',      currentKey: '_social' },
  { key: 'technologies',label: 'Technologies', type: 'tags',      scrapedField: 'scraped_technologies',currentKey: 'technologies' },
];

function isEmpty(v) {
  if (v == null) return true;
  if (typeof v === 'string') return v.trim().length === 0;
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === 'object') return Object.keys(v).length === 0;
  return false;
}

function getScrapedValue(enrichment, scrapedField) {
  if (!enrichment) return null;
  let v = enrichment[scrapedField];
  if (scrapedField === 'scraped_social' && typeof v === 'string') {
    try { v = JSON.parse(v); } catch { v = {}; }
  }
  return v;
}

function getCurrentValue(profile, currentKey) {
  if (!profile) return null;
  if (currentKey === '_social') {
    return {
      linkedin: profile.linkedin_url, twitter: profile.twitter_url,
      github: profile.github_url, youtube: profile.youtube_url,
      crunchbase: profile.crunchbase_url,
    };
  }
  return profile[currentKey];
}

function FieldPreview({ type, value }) {
  if (isEmpty(value)) return <em style={{ color: '#bbb', fontSize: 12 }}>(empty)</em>;
  if (type === 'image') {
    return <img src={value} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', background: '#fafafa', border: '1px solid #eee' }} />;
  }
  if (type === 'social') {
    const entries = Object.entries(value || {}).filter(([, url]) => !!url);
    if (entries.length === 0) return <em style={{ color: '#bbb', fontSize: 12 }}>(none)</em>;
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {entries.map(([platform, url]) => (
          <a key={platform} href={url} target="_blank" rel="noreferrer" style={{ fontSize: 10, padding: '2px 8px', borderRadius: 8, background: '#eff6ff', color: '#2563eb', textDecoration: 'none' }}>
            {platform} <ExternalLink size={9} style={{ display: 'inline' }} />
          </a>
        ))}
      </div>
    );
  }
  if (type === 'tags' && Array.isArray(value)) {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {value.slice(0, 6).map((t, i) => (
          <span key={i} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: '#fef3c7', color: '#92400e' }}>{t}</span>
        ))}
      </div>
    );
  }
  return <span style={{ fontSize: 12, color: '#374151', whiteSpace: 'pre-wrap' }}>{String(value)}</span>;
}

export default function AutoFillMyProfile({ currentProfile, onApplied, autoStart = false }) {
  const [busy, setBusy] = useState(false);
  const [enrichment, setEnrichment] = useState(null);
  const [polished, setPolished] = useState(null);
  const [selected, setSelected] = useState(() => new Set(FIELDS.map(f => f.key)));
  const [applying, setApplying] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [quota, setQuota] = useState(null);
  const [autoTriggered, setAutoTriggered] = useState(false);

  // Load quota on mount so the CTA can show "2 left this month"
  useEffect(() => {
    let alive = true;
    crawlAPI.autoFillQuota()
      .then(q => { if (alive) setQuota(q); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  // Auto-trigger from registration (?autofill=1). Runs once when quota loads
  // and only if the user has a website URL and available quota.
  useEffect(() => {
    if (!autoStart || autoTriggered || busy || enrichment || !quota) return;
    const hasWebsite = !!(currentProfile?.website || currentProfile?.domain_name);
    const canRun = quota.unlimited || quota.remaining > 0;
    if (hasWebsite && canRun) {
      setAutoTriggered(true);
      runAutoFill(false);
      // Clean URL so a page refresh doesn't re-trigger
      if (typeof window !== 'undefined' && window.history?.replaceState) {
        const url = new URL(window.location.href);
        url.searchParams.delete('autofill');
        window.history.replaceState({}, '', url.toString());
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, quota, currentProfile, autoTriggered, busy, enrichment]);

  const runAutoFill = async (force = false) => {
    setBusy(true);
    try {
      const r = await crawlAPI.autoFillMyProfile(force);
      setEnrichment(r.enrichment);
      setPolished(r.polished);
      if (r.quota) setQuota(r.quota);
      // Default-select only fields that would actually add new info
      const next = new Set();
      FIELDS.forEach(f => {
        const scraped = getScrapedValue(r.enrichment, f.scrapedField);
        const current = getCurrentValue(currentProfile, f.currentKey);
        if (!isEmpty(scraped) && (isEmpty(current) || f.type === 'social')) next.add(f.key);
      });
      setSelected(next);
      if (r.fresh) toast.success('Found your public info!');
      else toast('Showing your recent scan', { icon: '🔄' });
    } catch (err) {
      // If quota exceeded, refetch to reflect latest state (belt & braces)
      if (/auto-fill|quota|growth plan/i.test(err?.message || '')) {
        crawlAPI.autoFillQuota().then(q => setQuota(q)).catch(() => {});
      }
      toast.error(err.message || 'Auto-fill failed');
    } finally {
      setBusy(false);
    }
  };

  const toggleField = (key) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const applySelected = async () => {
    if (!enrichment || selected.size === 0) return;
    setApplying(true);
    try {
      await crawlAPI.applyMyAutoFill(enrichment.id, Array.from(selected));
      toast.success(`Applied ${selected.size} field${selected.size > 1 ? 's' : ''} to your profile`);
      setEnrichment(null);
      setPolished(null);
      onApplied?.();
    } catch (err) {
      toast.error(err.message || 'Failed to apply');
    } finally {
      setApplying(false);
    }
  };

  if (dismissed) return null;

  // Entry CTA — shown when no enrichment is active
  if (!enrichment) {
    const needsHelp = isEmpty(currentProfile?.description) || (currentProfile?.description?.length || 0) < 30;
    const hasWebsite = !!(currentProfile?.website || currentProfile?.domain_name);
    const exhausted = quota && !quota.unlimited && quota.remaining === 0;
    const quotaText = quota
      ? (quota.unlimited
          ? 'Unlimited auto-fills on your plan'
          : `${quota.remaining} of ${quota.cap} auto-fill${quota.cap > 1 ? 's' : ''} left this month`)
      : null;

    // Exhausted → upgrade CTA
    if (exhausted) {
      return (
        <div style={{
          background: 'linear-gradient(135deg, #fff7e6 0%, #fffbeb 100%)',
          border: '1px solid #fde68a', borderRadius: 14, padding: 16, marginBottom: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Lock size={18} style={{ color: '#d97706' }} />
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: '#78350f' }}>
                You have used all {quota.cap} auto-fills this month
              </h4>
              <p style={{ fontSize: 12, color: '#92400e', margin: '3px 0 10px 0' }}>
                Upgrade to the <strong>Growth plan (₹499/mo)</strong> for unlimited auto-fills plus profile views, watchlist alerts, and search ranking boost.
              </p>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Link to="/dashboard/settings" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: 8,
                  background: '#d97706', color: 'white', fontWeight: 600, fontSize: 12,
                  textDecoration: 'none',
                }}>
                  Upgrade plan
                </Link>
                <button
                  onClick={() => setDismissed(true)}
                  style={{ fontSize: 11, color: '#888', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div style={{
        background: needsHelp
          ? 'linear-gradient(135deg, #fef3c7 0%, #fef9c3 100%)'
          : 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
        border: `1px solid ${needsHelp ? '#fde68a' : '#bae6fd'}`,
        borderRadius: 14, padding: 16, marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Sparkles size={18} style={{ color: needsHelp ? '#d97706' : '#0284c7' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: needsHelp ? '#78350f' : '#0c4a6e' }}>
                {needsHelp ? 'Short on time? Let us fill in your profile' : 'Auto-fill from your website'}
              </h4>
              {quotaText && (
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'white', color: '#666', border: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>
                  {quotaText}
                </span>
              )}
            </div>
            <p style={{ fontSize: 12, color: needsHelp ? '#92400e' : '#075985', margin: '3px 0 10px 0' }}>
              We'll scan your website and public sources, then let you review each field before it's saved.
              {!hasWebsite && <strong> Add your website URL first.</strong>}
            </p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                onClick={() => runAutoFill(false)}
                disabled={busy || !hasWebsite}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: 8,
                  background: needsHelp ? '#d97706' : '#0284c7',
                  color: 'white', border: 'none', fontWeight: 600, fontSize: 12,
                  cursor: busy || !hasWebsite ? 'not-allowed' : 'pointer',
                  opacity: busy || !hasWebsite ? 0.6 : 1,
                }}
              >
                {busy ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                {busy ? 'Scanning...' : 'Collect my data'}
              </button>
              <button
                onClick={() => setDismissed(true)}
                style={{ fontSize: 11, color: '#888', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                No thanks
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Diff/review UI
  const scrapedFields = FIELDS.filter(f => !isEmpty(getScrapedValue(enrichment, f.scrapedField)));
  const canRescan = !quota || quota.unlimited || quota.remaining > 0;

  return (
    <div style={{ background: 'white', border: `1px solid ${G}40`, borderRadius: 14, padding: 16, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={16} style={{ color: G }} />
          <h4 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: '#1a1a1a' }}>Review auto-fill results</h4>
          {quota && !quota.unlimited && (
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: '#fafafa', color: '#666', border: '1px solid #e5e7eb' }}>
              {quota.remaining} of {quota.cap} left
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {canRescan && (
            <button
              onClick={() => runAutoFill(true)}
              disabled={busy}
              title={quota && !quota.unlimited ? `Uses 1 of your ${quota.remaining} remaining auto-fills` : 'Rescan'}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7, background: 'white', color: '#666', border: '1px solid #e5e7eb', fontSize: 11, fontWeight: 500, cursor: 'pointer' }}
            >
              {busy ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
              Rescan
            </button>
          )}
          <button
            onClick={() => { setEnrichment(null); setPolished(null); }}
            style={{ padding: '5px 10px', borderRadius: 7, background: 'white', color: '#666', border: '1px solid #e5e7eb', fontSize: 11, fontWeight: 500, cursor: 'pointer' }}
          >
            Cancel
          </button>
        </div>
      </div>

      {polished && polished.confidence > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 8, background: '#f0fdf4', border: '1px solid #bbf7d0', marginBottom: 10, fontSize: 11, color: '#15803d' }}>
          <Info size={12} />
          AI matched you to <strong>{polished.sector || 'a sector'}</strong>{polished.stage ? `, stage: ${polished.stage}` : ''} with {Math.round(polished.confidence * 100)}% confidence
        </div>
      )}

      {scrapedFields.length === 0 ? (
        <p style={{ fontSize: 12, color: '#888', textAlign: 'center', margin: '16px 0' }}>
          We couldn't find enough info on your website. Try adding an About page or clear company description.
        </p>
      ) : (
        <>
          <p style={{ fontSize: 11, color: '#666', marginBottom: 10 }}>
            Tick the fields you want to apply. You can always edit them afterwards.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {scrapedFields.map(f => {
              const scraped = getScrapedValue(enrichment, f.scrapedField);
              const current = getCurrentValue(currentProfile, f.currentKey);
              const isSelected = selected.has(f.key);
              return (
                <div
                  key={f.key}
                  onClick={() => toggleField(f.key)}
                  style={{
                    padding: 10, borderRadius: 10, cursor: 'pointer',
                    border: `1px solid ${isSelected ? G : '#e5e7eb'}`,
                    background: isSelected ? `${G}08` : 'white',
                    transition: 'border-color 0.15s, background 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <input
                      type="checkbox" checked={isSelected}
                      onChange={() => toggleField(f.key)}
                      onClick={e => e.stopPropagation()}
                      style={{ marginTop: 2, accentColor: G, flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a', marginBottom: 6 }}>{f.label}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                        <div>
                          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.3, color: '#9ca3af', marginBottom: 3 }}>Current</div>
                          <FieldPreview type={f.type} value={current} />
                        </div>
                        <div>
                          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.3, color: G, marginBottom: 3 }}>Proposed</div>
                          <FieldPreview type={f.type} value={scraped} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTop: '1px solid #f3f4f6' }}>
            <span style={{ fontSize: 11, color: '#666' }}>
              {selected.size} of {scrapedFields.length} selected
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => setSelected(new Set(scrapedFields.map(f => f.key)))}
                style={{ fontSize: 11, padding: '5px 10px', borderRadius: 7, background: 'white', color: '#666', border: '1px solid #e5e7eb', cursor: 'pointer' }}
              >
                Select all
              </button>
              <button
                onClick={applySelected}
                disabled={selected.size === 0 || applying}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '6px 14px', borderRadius: 7,
                  background: selected.size === 0 || applying ? '#d4d4d4' : G,
                  color: 'white', border: 'none', fontSize: 12, fontWeight: 600,
                  cursor: selected.size === 0 || applying ? 'not-allowed' : 'pointer',
                }}
              >
                {applying ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                {applying ? 'Applying...' : `Apply ${selected.size} field${selected.size !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
