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
import { PERSONAS, PROFILE_FIELDS } from '../../config/personas';
import {
  ChevronLeft, Loader2, MapPin,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';

const G = '#D0A848';

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
  }, [userId, isSelf, navigate]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <Loader2 size={28} className="spin" style={{ color: '#6e6e6e' }} />
      </div>
    );
  }

  if (!profile) return null;

  const p = profile.profile || profile;
  const persona = PERSONAS[p.role || p.persona_type];
  const displayName = p.display_name || p.organization_name || p.company_name || p.name || 'User';

  // Phase 88 — generic field iteration. Replaces the hand-picked field
  // list (which hid most persona-specific fields like investor_type,
  // investment_thesis, expertise, focus_areas, looking_for, social URLs,
  // contact details, etc.) with a loop over PROFILE_FIELDS[role]. Every
  // field the persona declared in personas.js renders if it has a value.
  // Sub-section repeaters (startup-only) have their own surface on
  // StartupProfile.jsx; UserProfile is for the 10 non-startup personas.
  const role = p.role || p.persona_type;
  const personaFields = PROFILE_FIELDS[role] || [];

  // Phase 85e (preserved) - money fields prefer the new _range bracket label,
  // fall back to legacy NUMERIC + currency.
  const moneyOrLegacy = (rangeText, legacyVal, currency) => {
    if (rangeText) {
      // Phase 87k - strip redundant currency code prefix from _range text.
      return rangeText.replace(/^(INR|USD|EUR|GBP)\s+/i, '');
    }
    if (legacyVal != null && legacyVal !== '') return `${currency || ''} ${legacyVal}`.trim();
    return null;
  };

  // Per-field formatter. Returns null if the field should be skipped.
  function formatField(f) {
    const raw = p[f.name];
    if (f.type === 'logo') return null; // shown in Avatar block
    if (raw === null || raw === undefined) return null;
    if (typeof raw === 'string' && raw.trim() === '') return null;
    if (Array.isArray(raw) && raw.length === 0) return null;

    // money_range: use moneyOrLegacy with the legacy column name pattern.
    if (f.type === 'money_range') {
      // Phase 87k strip on the bracket label.
      const stripped = String(raw).replace(/^(INR|USD|EUR|GBP)\s+/i, '');
      return { label: f.label, value: stripped };
    }
    // url: render as link.
    if (f.type === 'url') {
      return { label: f.label, value: raw, link: true };
    }
    // checkbox: Yes / No.
    if (f.type === 'checkbox') {
      return { label: f.label, value: raw ? 'Yes' : 'No' };
    }
    // multiselect / tags / taxonomy_tags: comma-join arrays.
    if (Array.isArray(raw)) {
      return { label: f.label, value: raw.join(', ') };
    }
    // org_typeahead: array of {name,...} objects.
    if (f.type === 'org_typeahead' && Array.isArray(raw)) {
      return { label: f.label, value: raw.map(x => typeof x === 'object' ? x.name : x).join(', ') };
    }
    // year / number / select / text / textarea / etc.
    return { label: f.label, value: String(raw) };
  }

  const fields = personaFields
    .map(formatField)
    .filter(Boolean);

  // Investor — handle the legacy ticket_size_min/max pair via moneyOrLegacy.
  // If the persona config didn't already surface ticket_size_range_label, fall
  // back to the min/max pair so legacy investor rows still show ticket size.
  if (role === 'investor' && !fields.some(f => f.label === 'Ticket Size')) {
    const ticketSize = moneyOrLegacy(
      p.ticket_size_range_label,
      (p.ticket_size_min || p.ticket_size_max) ? `${p.ticket_size_min || '?'} - ${p.ticket_size_max || '?'}` : null,
      p.ticket_size_currency
    );
    if (ticketSize) fields.push({ label: 'Ticket Size', value: ticketSize });
  }

  return (
    <div id="tour-page-user-profile" style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <button onClick={() => navigate(-1)}
        style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#5c5c5c', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 16 }}>
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
              <span style={{ fontSize: 12, color: '#5c5c5c', display: 'flex', alignItems: 'center', gap: 3 }}>
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
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#666', textTransform: 'uppercase', marginBottom: 2 }}>{f.label}</div>
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
