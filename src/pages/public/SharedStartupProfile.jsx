/**
 * Phase 110 (25 May 2026) — SharedStartupProfile.
 * Landing page for viewing a startup profile via tokenized invite URL.
 * Login-gated (5 Jun 2026): a visitor must have an OpenI account and be
 * signed in before the profile is fetched/shown. Non-members are routed to
 * register/login carrying ?redirect=<this URL>, then land straight here.
 * Backend route: GET /api/public/startup-profile/share/:token
 *
 * Renders the full profile (redaction dropped). Falls back to friendly 404/410
 * messages for missing / revoked / expired tokens.
 */
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Loader2, ArrowRight, MapPin, Calendar, Briefcase, Globe, Users,
  Award, Cpu, Lock, AlertCircle, Building2, TrendingUp, Sparkles,
} from 'lucide-react';
import { publicStartupProfileShare } from '../../services/api';
import PublicLayout from '../../components/PublicLayout';
import PublicTour from '../../components/PublicTour';

const G = '#D0A848';
const card = { background: '#fff', border: '1px solid #eee', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' };

export default function SharedStartupProfile() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Login gate: viewing a shared profile requires an OpenI account.
  const isAuthed = (() => {
    try { return !!localStorage.getItem('openi_user'); } catch { return false; }
  })();
  // The URL we want the visitor to return to after they sign up / log in.
  const redirectTarget = `/share/startup/${token}`;
  const redirectParam = `?redirect=${encodeURIComponent(redirectTarget)}`;

  useEffect(() => { if (token && isAuthed) loadProfile(); /* eslint-disable-next-line */ }, [token, isAuthed]);

  const loadProfile = async () => {
    try {
      const d = await publicStartupProfileShare.read(token);
      setData(d);
    } catch (err) {
      setError(err.message || 'Profile not found');
    } finally {
      setLoading(false);
    }
  };

  // Not signed in → show a create-account / sign-in CTA carrying ?redirect=.
  if (!isAuthed) {
    return (
      <PublicLayout>
        <div style={{ maxWidth: 540, margin: '64px auto', padding: '0 20px', textAlign: 'center' }}>
          <Sparkles size={44} color={G} style={{ margin: '0 auto 16px', display: 'block' }} />
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', marginBottom: 10 }}>
            You&apos;ve been invited to view a startup profile
          </h1>
          <p style={{ fontSize: 14, color: '#666', marginBottom: 24, lineHeight: 1.6 }}>
            OpenI Hub profiles are shared with members. Create a free OpenI account or sign in, and you&apos;ll be taken straight to this profile.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to={`/register${redirectParam}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '11px 24px', background: G, color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
              Create free account <ArrowRight size={14} />
            </Link>
            <Link to={`/dashboard/login${redirectParam}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '11px 24px', background: '#fff', color: '#555', border: '1px solid #e5e7eb', borderRadius: 9, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
              Sign in
            </Link>
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (loading) {
    return (
      <PublicLayout>
        <div style={{ minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Loader2 size={32} color={G} className="animate-spin" />
        </div>
      </PublicLayout>
    );
  }

  if (error || !data) {
    const status = (error || '').toLowerCase();
    const isExpired = status.includes('expired');
    const isRevoked = status.includes('revoked');
    return (
      <PublicLayout>
        <div style={{ maxWidth: 540, margin: '64px auto', padding: '0 20px', textAlign: 'center' }}>
          <AlertCircle size={48} color="#d97706" style={{ margin: '0 auto 16px', display: 'block' }} />
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', marginBottom: 10 }}>
            {isRevoked ? 'This share link has been revoked' : isExpired ? 'This share link has expired' : 'Share link not found'}
          </h1>
          <p style={{ fontSize: 14, color: '#666', marginBottom: 24, lineHeight: 1.6 }}>
            {isRevoked
              ? 'The profile owner revoked access to this link. Please contact them for a new link.'
              : isExpired
              ? 'Share links expire by default. Please ask the profile owner for a new link.'
              : 'The link you followed is invalid or has been removed.'}
          </p>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: G, color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
            Go to OpenI Hub <ArrowRight size={14} />
          </Link>
        </div>
      </PublicLayout>
    );
  }

  const p = data.profile || {};
  const meta = data.share_meta || {};
  const mode = meta.redaction_mode || 'full';
  const isPitch = mode === 'pitch_only';
  const isSafe = mode === 'public_safe';

  return (
    <PublicLayout>
      <div style={{ maxWidth: 980, margin: '0 auto', padding: '24px 20px 64px' }}>
        {/* Redaction banner */}
        {mode !== 'full' && (
          <div style={{ marginBottom: 16, padding: '10px 14px', background: '#fef3c7', border: '1.5px solid #fcd34d', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Lock size={14} color="#92400e" />
            <span style={{ fontSize: 12, color: '#92400e' }}>
              {isPitch
                ? <><strong>Pitch-only view</strong> — financial details, team, and historical data have been hidden by the profile owner.</>
                : isSafe
                ? <><strong>Public-safe view</strong> — financial details (funding rounds, valuation, revenue) have been hidden by the profile owner.</>
                : <strong>{mode}</strong>}
            </span>
          </div>
        )}

        {/* Header card */}
        <div style={{ ...card, padding: 28, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
            {p.logo_url && (
              <img src={p.logo_url} alt={p.name} style={{ width: 96, height: 96, objectFit: 'contain', background: '#fafafa', borderRadius: 12, padding: 6 }} />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 id="tour-page-share-startup" style={{ fontSize: 26, fontWeight: 800, color: '#1a1a1a', margin: '0 0 6px' }}>{p.name || 'Startup'}</h1>
              {p.tagline && <p style={{ fontSize: 14, color: '#666', margin: '0 0 14px', lineHeight: 1.5 }}>{p.tagline}</p>}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {p.sector && <Chip icon={<Briefcase size={11} />} label={p.sector} />}
                {p.stage && <Chip icon={<TrendingUp size={11} />} label={p.stage} />}
                {p.tech_readiness && <Chip icon={<Cpu size={11} />} label={`TRL ${p.tech_readiness}`} />}
                {p.headquarters && <Chip icon={<MapPin size={11} />} label={p.headquarters} />}
                {p.founded_year && <Chip icon={<Calendar size={11} />} label={String(p.founded_year)} />}
                {p.employee_range && <Chip icon={<Users size={11} />} label={p.employee_range} />}
                {p.website && <a href={p.website} target="_blank" rel="noopener noreferrer" style={chipStyle()}>
                  <Globe size={11} /> Website
                </a>}
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        {p.description && (
          <Section title="About">
            <p style={{ fontSize: 14, color: '#444', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-line' }}>{p.description}</p>
          </Section>
        )}

        {/* Products */}
        {(p.products || []).length > 0 && (
          <Section title="Products">
            <div style={{ display: 'grid', gap: 10 }}>
              {p.products.map((pr, i) => (
                <div key={i} style={{ padding: 14, background: '#fafafa', borderRadius: 9 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>{pr.name}</div>
                  {pr.description && <div style={{ fontSize: 12, color: '#666', lineHeight: 1.5 }}>{pr.description}</div>}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Financials — only when mode === 'full' */}
        {!isPitch && !isSafe && (p.funding_raised || (p.funding_rounds || []).length > 0 || p.valuation_range || p.revenue_range) && (
          <Section title="Financials">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 14 }}>
              {p.funding_raised && (
                <Stat label="Total Funding" value={`${p.funding_raised}${p.funding_raised_unit ? ' ' + p.funding_raised_unit : ''}${p.funding_raised_currency ? ' ' + p.funding_raised_currency : ''}`} />
              )}
              {p.valuation_range && <Stat label="Valuation" value={p.valuation_range} />}
              {p.revenue_range && <Stat label="Revenue" value={p.revenue_range} />}
              {p.last_funding_amount_range && <Stat label="Last Round" value={p.last_funding_amount_range} />}
            </div>
            {(p.funding_rounds || []).length > 0 && (
              <div>
                <h4 style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, margin: '14px 0 8px' }}>Rounds</h4>
                <div style={{ display: 'grid', gap: 8 }}>
                  {p.funding_rounds.map((r, i) => (
                    <div key={i} style={{ padding: 10, background: '#fff', border: '1px solid #eee', borderRadius: 8, fontSize: 12 }}>
                      <span style={{ fontWeight: 700, color: '#1a1a1a' }}>{r.round_type || 'Round'}</span>
                      {r.round_date && <span style={{ color: '#888' }}> · {new Date(r.round_date).toLocaleDateString('en-GB', { year: 'numeric', month: 'short' })}</span>}
                      {r.amount && <span style={{ color: '#1a1a1a', marginLeft: 8 }}>{r.amount}{r.amount_unit ? ' ' + r.amount_unit : ''}{r.amount_currency ? ' ' + r.amount_currency : ''}</span>}
                      {r.lead_investor && <span style={{ color: '#666' }}> — {r.lead_investor}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Section>
        )}

        {/* Team — hidden in pitch_only */}
        {!isPitch && (p.team || []).length > 0 && (
          <Section title="Team">
            <div style={{ display: 'grid', gap: 10 }}>
              {p.team.map((m, i) => (
                <div key={i} style={{ padding: 12, background: '#fafafa', borderRadius: 9 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>{m.name}{m.is_founder && ' (Founder)'}</div>
                  {m.role && <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>{m.role}</div>}
                  {m.bio && <div style={{ fontSize: 12, color: '#555', lineHeight: 1.5 }}>{m.bio}</div>}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Clients + Patents — hidden in pitch_only */}
        {!isPitch && (p.clients || []).length > 0 && (
          <Section title="Clients">
            <div style={{ fontSize: 13, color: '#444' }}>{p.clients.map(c => c.name).filter(Boolean).join(', ')}</div>
          </Section>
        )}
        {!isPitch && (p.patents || []).length > 0 && (
          <Section title="Patents">
            <div style={{ display: 'grid', gap: 8 }}>
              {p.patents.map((pt, i) => (
                <div key={i} style={{ padding: 10, background: '#fafafa', borderRadius: 8, fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Award size={12} color={G} />
                  <span>{pt.title}{pt.status && <span style={{ color: '#888', marginLeft: 6 }}>[{pt.status}]</span>}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Competitors + News — hidden in pitch_only */}
        {!isPitch && (p.competitors || []).length > 0 && (
          <Section title="Competitors">
            <div style={{ fontSize: 13, color: '#444' }}>{p.competitors.map(c => c.name).filter(Boolean).join(', ')}</div>
          </Section>
        )}
        {!isPitch && (p.news || []).length > 0 && (
          <Section title="Recent News">
            <div style={{ display: 'grid', gap: 8 }}>
              {p.news.slice(0, 5).map((n, i) => (
                <div key={i} style={{ padding: 12, background: '#fafafa', borderRadius: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a' }}>{n.title}</div>
                  {n.published_date && <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>{new Date(n.published_date).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })}</div>}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Footer CTA */}
        <div style={{ marginTop: 32, padding: 24, textAlign: 'center', background: 'linear-gradient(180deg, #fff 0%, #fff8ec 100%)', borderRadius: 14, border: '1px solid rgba(213,170,91,0.3)' }}>
          <Sparkles size={28} color={G} style={{ margin: '0 auto 10px', display: 'block' }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', margin: '0 0 6px' }}>Discover more startups on OpenI Hub</h3>
          <p style={{ fontSize: 12, color: '#666', margin: '0 0 16px' }}>India&apos;s deepest startup intelligence platform — search 500k+ startups, connect with founders, and run innovation programs.</p>
          <Link to="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 22px', background: G, color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
            Sign up free <ArrowRight size={14} />
          </Link>
        </div>

        {/* Share meta footer */}
        {meta.created_at && (
          <div style={{ marginTop: 20, fontSize: 11, color: '#aaa', textAlign: 'center' }}>
            Shared {new Date(meta.created_at).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })}
            {meta.expires_at && <> · Expires {new Date(meta.expires_at).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })}</>}
          </div>
        )}
        {/* Page tour */}
        <PublicTour />
      </div>
    </PublicLayout>
  );
}

function chipStyle() {
  return { display: 'inline-flex', alignItems: 'center', gap: 4, background: '#f5f5f5', color: '#555', padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, textDecoration: 'none' };
}

function Chip({ icon, label }) {
  return (
    <span style={chipStyle()}>
      {icon} {label}
    </span>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ ...card, padding: 22, marginBottom: 14 }}>
      <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: 0.5 }}>{title}</h2>
      {children}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{ padding: 12, background: '#fafafa', borderRadius: 9 }}>
      <div style={{ fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{value}</div>
    </div>
  );
}
