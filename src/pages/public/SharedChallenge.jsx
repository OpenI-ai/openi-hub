/**
 * SharedChallenge — Public page for viewing a private challenge via share token.
 * No authentication required. Allows startups to view and apply.
 */
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Target, Clock, Calendar, DollarSign, MapPin, Building2, Loader2, ArrowRight } from 'lucide-react';
import { publicAPI } from '../../services/api';
import PublicLayout from '../../components/PublicLayout';

const G = '#D5AA5B';
const card = { background: '#fff', border: '1px solid #eee', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' };

export default function SharedChallenge() {
  const { token } = useParams();
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (token) loadChallenge();
  }, [token]);

  const loadChallenge = async () => {
    try {
      const d = await publicAPI.getSharedChallenge(token);
      setChallenge(d);
    } catch (err) { setError(err.message || 'Challenge not found'); }
    finally { setLoading(false); }
  };

  const parseFaqs = (v) => { try { return typeof v === 'string' ? JSON.parse(v) : (v || []); } catch { return []; } };

  return (
    <PublicLayout>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <Loader2 size={28} className="animate-spin" style={{ color: G }} />
          </div>
        )}

        {error && (
          <div style={{ ...card, padding: 40, textAlign: 'center' }}>
            <Target size={32} style={{ color: '#ddd', marginBottom: 10 }} />
            <p style={{ fontSize: 16, fontWeight: 600, color: '#888' }}>{error}</p>
            <p style={{ fontSize: 13, color: '#aaa' }}>This challenge may have been closed or the link is invalid.</p>
            <Link to="/marketplace" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 16, color: G, fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>
              Browse Public Challenges <ArrowRight size={14} />
            </Link>
          </div>
        )}

        {challenge && (
          <>
            {/* Header */}
            <div style={{ ...card, padding: 24, marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
                <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#fefce8', color: '#ca8a04' }}>
                  {challenge.challenge_type === 'partner' ? 'Partnership' : challenge.challenge_type === 'source' ? 'Sourcing' : challenge.challenge_type === 'invest' ? 'Investment' : 'Challenge'}
                </span>
                {challenge.visibility === 'private' && <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#fef2f2', color: '#dc2626' }}>Private</span>}
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', margin: '0 0 8px' }}>{challenge.title}</h1>
              {challenge.company_name && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  {challenge.corporate_logo && <img src={challenge.corporate_logo} alt="" style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'cover' }} />}
                  <span style={{ fontSize: 13, color: '#555' }}><Building2 size={13} style={{ verticalAlign: -2 }} /> {challenge.company_name}{challenge.industry ? ` - ${challenge.industry}` : ''}</span>
                </div>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 12, color: '#666' }}>
                {challenge.budget_range && <span><DollarSign size={12} style={{ verticalAlign: -2 }} /> {challenge.budget_range}</span>}
                {challenge.timeline && <span><Clock size={12} style={{ verticalAlign: -2 }} /> {challenge.timeline}</span>}
                {challenge.deadline && <span><Calendar size={12} style={{ verticalAlign: -2 }} /> Deadline: {new Date(challenge.deadline).toLocaleDateString()}</span>}
                {challenge.location && <span><MapPin size={12} style={{ verticalAlign: -2 }} /> {challenge.location}</span>}
              </div>
            </div>

            {/* Description */}
            {challenge.problem_statement && (
              <div style={{ ...card, padding: 24, marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>Problem Statement</h3>
                <p style={{ fontSize: 13, color: '#555', lineHeight: 1.6 }}>{challenge.problem_statement}</p>
              </div>
            )}

            {challenge.description && (
              <div style={{ ...card, padding: 24, marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>Description</h3>
                <p style={{ fontSize: 13, color: '#555', lineHeight: 1.6 }}>{challenge.description}</p>
              </div>
            )}

            {/* Tags */}
            <div style={{ ...card, padding: 24, marginBottom: 16 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {(challenge.sectors || []).map(t => <span key={t} style={{ fontSize: 10, padding: '3px 10px', borderRadius: 20, background: '#eff6ff', color: '#2563eb' }}>{t}</span>)}
                {(challenge.technologies || []).map(t => <span key={t} style={{ fontSize: 10, padding: '3px 10px', borderRadius: 20, background: '#fefce8', color: '#ca8a04' }}>{t}</span>)}
                {(challenge.usecases || []).map(t => <span key={t} style={{ fontSize: 10, padding: '3px 10px', borderRadius: 20, background: '#f0fdf4', color: '#16a34a' }}>{t}</span>)}
              </div>
            </div>

            {/* FAQs */}
            {parseFaqs(challenge.faqs).length > 0 && (
              <div style={{ ...card, padding: 24, marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 }}>FAQs</h3>
                {parseFaqs(challenge.faqs).map((faq, i) => (
                  <div key={i} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>Q: {faq.question}</div>
                    <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{faq.answer}</div>
                  </div>
                ))}
              </div>
            )}

            {/* CTA */}
            <div style={{ ...card, padding: 24, textAlign: 'center', background: '#faf7f2' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>Interested in this challenge?</h3>
              <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>Register or log in to submit your application.</p>
              <Link to="/register?type=startup" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 24px', borderRadius: 8, background: G, color: '#fff', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
                Apply Now <ArrowRight size={16} />
              </Link>
            </div>
          </>
        )}
      </div>
    </PublicLayout>
  );
}
