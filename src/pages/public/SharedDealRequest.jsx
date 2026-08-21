/**
 * SharedDealRequest — Public page for viewing a private investor deal request via share token.
 * No authentication required. Allows startups to view and apply. (Phase 131)
 */
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Target, Calendar, MapPin, Building2, Loader2, ArrowRight, Users, Briefcase } from 'lucide-react';
import { publicAPI } from '../../services/api';
import PublicLayout from '../../components/PublicLayout';

const G = '#D0A848';
const card = { background: '#fff', border: '1px solid #eee', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' };

function formatTicketSize(min, max, currency) {
  if (!min && !max) return null;
  const lo = min ? `${(min / 1e5).toFixed(0)}L` : '?';
  const hi = max ? `${(max / 1e7).toFixed(1)}Cr` : '?';
  return `${currency || ''} ${lo} - ${hi}`.trim();
}

export default function SharedDealRequest() {
  const { token } = useParams();
  const [dealRequest, setDealRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (token) loadDealRequest();
  }, [token]);

  const loadDealRequest = async () => {
    try {
      const d = await publicAPI.getSharedDealRequest(token);
      setDealRequest(d);
    } catch (err) { setError(err.message || 'Deal request not found'); }
    finally { setLoading(false); }
  };

  const ticketSize = dealRequest ? formatTicketSize(dealRequest.ticket_size_min, dealRequest.ticket_size_max, dealRequest.ticket_currency) : null;

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
            <p style={{ fontSize: 16, fontWeight: 600, color: '#5c5c5c' }}>{error}</p>
            <p style={{ fontSize: 13, color: '#6e6e6e' }}>This deal request may have been closed or the link is invalid.</p>
            <Link to="/marketplace" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 16, color: G, fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>
              Browse Public Marketplace <ArrowRight size={14} />
            </Link>
          </div>
        )}

        {dealRequest && (
          <>
            {/* Header */}
            <div style={{ ...card, padding: 24, marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
                <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#fefce8', color: '#a16207' }}>
                  Deal Request
                </span>
                <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#fef2f2', color: '#b91c1c' }}>Private</span>
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', margin: '0 0 8px' }}>{dealRequest.title}</h1>
              {dealRequest.firm_name && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  {dealRequest.investor_logo && <img src={dealRequest.investor_logo} alt="" style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'cover' }} />}
                  <span style={{ fontSize: 13, color: '#555' }}><Building2 size={13} style={{ verticalAlign: -2 }} /> {dealRequest.firm_name}{dealRequest.investor_type ? ` - ${dealRequest.investor_type}` : ''}</span>
                </div>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 12, color: '#666' }}>
                {dealRequest.target_stage && <span><Briefcase size={12} style={{ verticalAlign: -2 }} /> {dealRequest.target_stage}</span>}
                {ticketSize && <span>{ticketSize}</span>}
                {dealRequest.deadline && <span><Calendar size={12} style={{ verticalAlign: -2 }} /> Deadline: {new Date(dealRequest.deadline).toLocaleDateString()}</span>}
                {dealRequest.geographic_focus && <span><MapPin size={12} style={{ verticalAlign: -2 }} /> {dealRequest.geographic_focus}</span>}
                {dealRequest.max_applicants && <span><Users size={12} style={{ verticalAlign: -2 }} /> Max {dealRequest.max_applicants} applicants</span>}
              </div>
            </div>

            {/* Investment thesis */}
            {dealRequest.investment_thesis && (
              <div style={{ ...card, padding: 24, marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>Investment Thesis</h3>
                <p style={{ fontSize: 13, color: '#555', lineHeight: 1.6 }}>{dealRequest.investment_thesis}</p>
              </div>
            )}

            {/* Description */}
            {dealRequest.description && (
              <div style={{ ...card, padding: 24, marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>Description</h3>
                <p style={{ fontSize: 13, color: '#555', lineHeight: 1.6 }}>{dealRequest.description}</p>
              </div>
            )}

            {/* Requirements */}
            {dealRequest.requirements && (
              <div style={{ ...card, padding: 24, marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>Requirements</h3>
                <p style={{ fontSize: 13, color: '#555', lineHeight: 1.6 }}>{dealRequest.requirements}</p>
              </div>
            )}

            {/* Tags */}
            {((dealRequest.sectors || []).length > 0 || (dealRequest.technologies || []).length > 0) && (
              <div style={{ ...card, padding: 24, marginBottom: 16 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {(dealRequest.sectors || []).map(t => <span key={t} style={{ fontSize: 10, padding: '3px 10px', borderRadius: 20, background: '#eff6ff', color: '#2563eb' }}>{t}</span>)}
                  {(dealRequest.technologies || []).map(t => <span key={t} style={{ fontSize: 10, padding: '3px 10px', borderRadius: 20, background: '#fefce8', color: '#a16207' }}>{t}</span>)}
                </div>
              </div>
            )}

            {/* CTA */}
            <div style={{ ...card, padding: 24, textAlign: 'center', background: '#faf7f2' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>Interested in this deal request?</h3>
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
