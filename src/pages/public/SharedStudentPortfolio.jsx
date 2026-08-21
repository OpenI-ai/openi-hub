/**
 * SharedStudentPortfolio (17 Jun 2026) — public student portfolio view.
 * Landing page for viewing a student's Projects + Certifications via a tokenized
 * share URL. UNLIKE SharedStartupProfile, this page is FULLY PUBLIC — no login
 * required (the backend endpoint is unauthed and the Share modal promises "no
 * login required").
 * Backend route: GET /api/public/student-portfolio/share/:token
 * Returns { student:{name,avatar}, projects, certifications, share_meta }.
 * Falls back to friendly 404/410 messages for missing / revoked / expired tokens.
 */
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Loader2, ArrowRight, AlertCircle, Sparkles, FolderGit2, Award,
  Star, ExternalLink, Github,
} from 'lucide-react';
import { publicStudentPortfolioShare } from '../../services/api';
import PublicLayout from '../../components/PublicLayout';

const G = '#D0A848';
const card = { background: '#fff', border: '1px solid #eee', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' };

const fmtDate = (d) => {
  if (!d) return '';
  try { return new Date(d).toLocaleDateString('en-GB', { year: 'numeric', month: 'short' }); }
  catch { return ''; }
};

export default function SharedStudentPortfolio() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { if (token) loadPortfolio(); /* eslint-disable-next-line */ }, [token]);

  const loadPortfolio = async () => {
    try {
      const d = await publicStudentPortfolioShare.read(token);
      setData(d);
    } catch (err) {
      setError(err.message || 'Portfolio not found');
    } finally {
      setLoading(false);
    }
  };

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
              ? 'The portfolio owner revoked access to this link. Please contact them for a new link.'
              : isExpired
              ? 'Share links expire by default. Please ask the portfolio owner for a new link.'
              : 'The link you followed is invalid or has been removed.'}
          </p>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: G, color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
            Go to OpenI Hub <ArrowRight size={14} />
          </Link>
        </div>
      </PublicLayout>
    );
  }

  const student = data.student || {};
  const projects = data.projects || [];
  const certifications = data.certifications || [];
  const meta = data.share_meta || {};

  return (
    <PublicLayout>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 20px 64px' }}>
        {/* Header card */}
        <div style={{ ...card, padding: 28, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            {student.avatar
              ? <img src={student.avatar} alt={student.name} style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: '50%', background: '#fafafa' }} />
              : <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#fff8ec', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, color: G }}>
                  {(student.name || '?').charAt(0).toUpperCase()}
                </div>}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: G, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Portfolio</div>
              <h1 id="tour-page-share-student-portfolio" style={{ fontSize: 24, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>{student.name || 'Student'}</h1>
            </div>
          </div>
        </div>

        {/* Projects */}
        <Section title="Projects" icon={<FolderGit2 size={14} color={G} />} count={projects.length}>
          {projects.length === 0
            ? <Empty label="No projects shared." />
            : <div style={{ display: 'grid', gap: 12 }}>
                {projects.map((pr, i) => (
                  <div key={pr.id || i} style={{ padding: 16, background: '#fafafa', borderRadius: 10, border: '1px solid #f0f0f0' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>
                        {pr.is_featured && <Star size={13} color={G} fill={G} style={{ verticalAlign: -1, marginRight: 5 }} />}
                        {pr.title}
                      </div>
                      <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
                        {pr.demo_url && <a href={pr.demo_url} target="_blank" rel="noopener noreferrer" style={iconLink()}><ExternalLink size={15} /></a>}
                        {pr.github_url && <a href={pr.github_url} target="_blank" rel="noopener noreferrer" style={iconLink()}><Github size={15} /></a>}
                      </div>
                    </div>
                    {pr.description && <p style={{ fontSize: 13, color: '#555', lineHeight: 1.6, margin: '8px 0 0', whiteSpace: 'pre-line' }}>{pr.description}</p>}
                    {(pr.tech_stack || []).length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                        {pr.tech_stack.map((t, j) => <span key={j} style={chipStyle()}>{t}</span>)}
                      </div>
                    )}
                  </div>
                ))}
              </div>}
        </Section>

        {/* Certifications */}
        <Section title="Certifications" icon={<Award size={14} color={G} />} count={certifications.length}>
          {certifications.length === 0
            ? <Empty label="No certifications shared." />
            : <div style={{ display: 'grid', gap: 10 }}>
                {certifications.map((c, i) => (
                  <div key={c.id || i} style={{ padding: 14, background: '#fafafa', borderRadius: 10, border: '1px solid #f0f0f0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{c.title}</div>
                      {c.provider && <div style={{ fontSize: 12, color: '#5c5c5c', marginTop: 2 }}>{c.provider}</div>}
                      {c.completion_date && <div style={{ fontSize: 11, color: '#6e6e6e', marginTop: 4 }}>{fmtDate(c.completion_date)}</div>}
                    </div>
                    {c.credential_url && <a href={c.credential_url} target="_blank" rel="noopener noreferrer" style={iconLink()}><ExternalLink size={15} /></a>}
                  </div>
                ))}
              </div>}
        </Section>

        {/* Footer CTA */}
        <div style={{ marginTop: 32, padding: 24, textAlign: 'center', background: 'linear-gradient(180deg, #fff 0%, #fff8ec 100%)', borderRadius: 14, border: '1px solid rgba(208,168,72,0.3)' }}>
          <Sparkles size={28} color={G} style={{ margin: '0 auto 10px', display: 'block' }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', margin: '0 0 6px' }}>Build your own portfolio on OpenI Hub</h3>
          <p style={{ fontSize: 12, color: '#666', margin: '0 0 16px' }}>Showcase your projects & certifications, get discovered by investors and corporates, and join India&apos;s deepest innovation platform.</p>
          <Link to="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 22px', background: G, color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
            Sign up free <ArrowRight size={14} />
          </Link>
        </div>

        {/* Share meta footer */}
        {meta.created_at && (
          <div style={{ marginTop: 20, fontSize: 11, color: '#6e6e6e', textAlign: 'center' }}>
            Shared {new Date(meta.created_at).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })}
            {meta.expires_at && <> · Expires {new Date(meta.expires_at).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })}</>}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}

function chipStyle() {
  return { display: 'inline-flex', alignItems: 'center', background: '#fff', color: '#555', padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, border: '1px solid #eee' };
}

function iconLink() {
  return { color: '#5c5c5c', display: 'inline-flex' };
}

function Empty({ label }) {
  return <div style={{ fontSize: 13, color: '#6e6e6e', padding: '8px 0' }}>{label}</div>;
}

function Section({ title, icon, count, children }) {
  return (
    <div style={{ ...card, padding: 22, marginBottom: 14 }}>
      <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
        {icon} {title}
        {typeof count === 'number' && <span style={{ fontSize: 11, color: '#6e6e6e', fontWeight: 600 }}>({count})</span>}
      </h2>
      {children}
    </div>
  );
}
