/**
 * OpenI Hub — UserProfile (Phase 18)
 * View another user's public profile with connection actions.
 * Route: /dashboard/profile/:id
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { profileAPI, connectionAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ConnectButton from '../../components/ConnectButton';
import MutualConnectionsBadge from '../../components/MutualConnectionsBadge';
import { PERSONAS } from '../../config/personas';
import {
  ChevronLeft, Loader2, MapPin, Mail, Globe, Building2,
  ExternalLink, Calendar, Users,
} from 'lucide-react';
import toast from 'react-hot-toast';

const G = '#D5AA5B';

function Avatar({ src, name, size = 80 }) {
  if (src) return <img src={src} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${G}20` }} />;
  const letter = (name || '?')[0].toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: '#f5f0e6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: G, fontSize: size * 0.35 }}>
      {letter}
    </div>
  );
}

export default function UserProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connCount, setConnCount] = useState(0);

  const userId = parseInt(id);
  const isSelf = user?.id === userId;

  useEffect(() => {
    if (!userId || isNaN(userId)) return;
    if (isSelf) { navigate('/dashboard/profile', { replace: true }); return; }

    setLoading(true);
    Promise.all([
      profileAPI.getPublic(userId),
      connectionAPI.list({ page: 1, limit: 1 }), // just to get their count later
    ])
      .then(([profileData]) => {
        setProfile(profileData);
      })
      .catch(err => { toast.error(err.message); navigate(-1); })
      .finally(() => setLoading(false));

    // Get connection count for target user — approximate via mutual
    connectionAPI.check(userId).then(d => setConnCount(0)).catch(() => {});
  }, [userId, isSelf, navigate]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <Loader2 size={28} className="spin" style={{ color: '#aaa' }} />
      </div>
    );
  }

  if (!profile) return null;

  const p = profile.profile || profile;
  const persona = PERSONAS[p.role || p.persona_type];
  const displayName = p.display_name || p.organization_name || p.company_name || p.name || 'User';

  // Collect fields to show
  const fields = [];
  if (p.tagline) fields.push({ label: 'Tagline', value: p.tagline });
  if (p.description || p.about || p.bio) fields.push({ label: 'About', value: p.description || p.about || p.bio });
  if (p.sector || p.sectors?.length) fields.push({ label: 'Sectors', value: Array.isArray(p.sectors) ? p.sectors.join(', ') : p.sector });
  if (p.stage) fields.push({ label: 'Stage', value: p.stage });
  if (p.city || p.state) fields.push({ label: 'Location', value: [p.city, p.state].filter(Boolean).join(', ') });
  if (p.website) fields.push({ label: 'Website', value: p.website, link: true });
  if (p.founded_year) fields.push({ label: 'Founded', value: p.founded_year });
  if (p.employee_range || p.team_size) fields.push({ label: 'Team Size', value: p.employee_range || p.team_size });
  if (p.focus_areas?.length) fields.push({ label: 'Focus Areas', value: p.focus_areas.join(', ') });
  if (p.technologies?.length) fields.push({ label: 'Technologies', value: Array.isArray(p.technologies) ? p.technologies.join(', ') : p.technologies });
  if (p.expertise?.length) fields.push({ label: 'Expertise', value: Array.isArray(p.expertise) ? p.expertise.join(', ') : p.expertise });
  if (p.investment_thesis) fields.push({ label: 'Investment Thesis', value: p.investment_thesis });
  // Phase 85e (14 May 2026) - money fields for all non-startup personas.
  // Each line prefers the new Phase 85a _range bracket label, then falls
  // back to legacy NUMERIC + currency. Phase 84 startup money fields use
  // the same pattern in StartupProfile.formatFunding.
  const moneyOrLegacy = (rangeText, legacyVal, currency) => {
    if (rangeText) {
      // Phase 87k — strip redundant currency code prefix from _range text;
      // the bracket label already carries the symbol (₹/$/€/£).
      return rangeText.replace(/^(INR|USD|EUR|GBP)\s+/i, '');
    }
    if (legacyVal != null && legacyVal !== '') return `${currency || ''} ${legacyVal}`.trim();
    return null;
  };
  // Investor
  const ticketSize = moneyOrLegacy(
    p.ticket_size_range_label,
    (p.ticket_size_min || p.ticket_size_max) ? `${p.ticket_size_min || '?'} - ${p.ticket_size_max || '?'}` : null,
    p.ticket_size_currency
  );
  if (ticketSize) fields.push({ label: 'Ticket Size', value: ticketSize });
  const fundSize = moneyOrLegacy(p.fund_size_range, p.fund_size, p.fund_size_currency);
  if (fundSize) fields.push({ label: 'Fund Size', value: fundSize });
  const totalAum = moneyOrLegacy(p.total_aum_range, p.total_aum, p.total_aum_currency);
  if (totalAum) fields.push({ label: 'Total AUM', value: totalAum });
  const availableToDeploy = moneyOrLegacy(p.available_to_deploy_range, p.available_to_deploy, p.available_to_deploy_currency);
  if (availableToDeploy) fields.push({ label: 'Available to Deploy', value: availableToDeploy });
  // Corporate
  const annualRevenue = moneyOrLegacy(p.annual_revenue_range, p.annual_revenue, null);
  if (annualRevenue) fields.push({ label: 'Annual Revenue', value: annualRevenue });
  // Incubator / Accelerator
  const fundingOffered = moneyOrLegacy(p.funding_offered_range, p.funding_offered, null);
  if (fundingOffered) fields.push({ label: 'Funding Offered', value: fundingOffered });

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <button onClick={() => navigate(-1)}
        style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#888', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 16 }}>
        <ChevronLeft size={16} /> Back
      </button>

      {/* Hero card */}
      <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        {/* Gold banner */}
        <div style={{ height: 80, background: `linear-gradient(135deg, ${G}20, ${G}40)` }} />

        <div style={{ padding: '0 24px 24px', marginTop: -40 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', marginBottom: 16 }}>
            <Avatar src={p.logo_url || p.avatar} name={displayName} size={80} />
            <div style={{ flex: 1, paddingBottom: 4 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>{displayName}</h2>
              {p.organization && <div style={{ fontSize: 13, color: '#666' }}>{p.organization}</div>}
            </div>
            <ConnectButton userId={userId} />
          </div>

          {/* Meta row */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            {persona && (
              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 10, background: `${persona.color}15`, color: persona.color }}>
                {persona.label}
              </span>
            )}
            {(p.city || p.state) && (
              <span style={{ fontSize: 12, color: '#888', display: 'flex', alignItems: 'center', gap: 3 }}>
                <MapPin size={12} /> {[p.city, p.state].filter(Boolean).join(', ')}
              </span>
            )}
            <MutualConnectionsBadge userId={userId} />
          </div>

          {/* Profile fields */}
          {fields.length > 0 && (
            <div style={{ display: 'grid', gap: 12, marginTop: 8 }}>
              {fields.map((f, i) => (
                <div key={i}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', marginBottom: 2 }}>{f.label}</div>
                  {f.link ? (
                    <a href={f.value.startsWith('http') ? f.value : `https://${f.value}`} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 13, color: G, display: 'flex', alignItems: 'center', gap: 4 }}>
                      {f.value} <ExternalLink size={12} />
                    </a>
                  ) : (
                    <div style={{ fontSize: 13, color: '#333', lineHeight: 1.5 }}>{f.value}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
