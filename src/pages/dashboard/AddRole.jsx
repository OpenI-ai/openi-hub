/**
 * AddRole — Phase 60.4b (s50)
 *
 * Add another role to the current user's account. Two-step flow:
 *   Step 1: pick a role from cards (filtered to available_to_add[])
 *   Step 2: confirm + submit -> POST /auth/roles/add
 * On success: switchRole() to the new role + redirect to /dashboard
 *
 * Decision 5 (s50): primary role is purely UX default. Adding a role does
 * NOT make it primary. User can later set it primary via Settings.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { rolesAPI } from '../../services/api';
import toast from 'react-hot-toast';
import {
  ArrowLeft, ArrowRight, CheckCircle2, Loader2,
  Briefcase, GraduationCap, Building2, Landmark, TrendingUp,
  FlaskConical, Layers, Rocket, UserCheck, Wrench,
} from 'lucide-react';

const ROLE_META = {
  startup:           { label: 'Startup',          Icon: Rocket,         category: 'Provider', desc: 'Build, fundraise, find pilots and customers.' },
  student:           { label: 'Student',          Icon: GraduationCap,  category: 'Provider', desc: 'Showcase projects, find internships, build portfolio.' },
  academia:          { label: 'Academia',         Icon: GraduationCap,  category: 'Provider', desc: 'Publish research, find collaborators, transfer tech.' },
  corporate:         { label: 'Corporate',        Icon: Building2,      category: 'Seeker',   desc: 'Post challenges, source startups, run pilots.' },
  government:        { label: 'Government',       Icon: Landmark,       category: 'Seeker',   desc: 'Run innovation programs, source solutions for public sector.' },
  investor:          { label: 'Investor',         Icon: TrendingUp,     category: 'Seeker',   desc: 'Discover deals, evaluate startups, manage portfolio.' },
  mentor:            { label: 'Mentor',           Icon: UserCheck,      category: 'Seeker',   desc: 'Guide founders, share expertise, run mentor sessions.' },
  lab:               { label: 'Research Lab',     Icon: FlaskConical,   category: 'Seeker',   desc: 'Offer infrastructure, equipment, expertise to startups.' },
  incubator:         { label: 'Incubator',        Icon: Layers,         category: 'Seeker',   desc: 'Run early-stage programs, support founders pre-traction.' },
  accelerator:       { label: 'Accelerator',      Icon: Rocket,         category: 'Seeker',   desc: 'Run cohort-based growth programs, prep startups for fundraise.' },
  service_provider:  { label: 'Service Provider', Icon: Wrench,         category: 'Seeker',   desc: 'Offer professional services to the ecosystem (legal, accounting, design...).' },
};

const C = {
  pageBg:        '#F7F5F0',
  cardBg:        '#FFFFFF',
  border:        '#E8E5DD',
  borderActive:  '#D4A843',
  textPrimary:   '#0D2137',
  textSecond:    '#555555',
  textMuted:     '#888888',
  gold:          '#D4A843',
  goldBg:        'rgba(212, 168, 67, 0.10)',
  hoverBg:       'rgba(13, 33, 55, 0.04)',
  greenBg:       '#ECFDF5',
  greenBorder:   '#10B981',
};

export default function AddRole() {
  const navigate = useNavigate();
  const { roles: existingRoles, applyRolesUpdate } = useAuth();
  const [available, setAvailable] = useState([]);
  const [pickedRole, setPickedRole] = useState(null);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch roles on mount (also lets us know what's available_to_add)
  useEffect(() => {
    rolesAPI.list()
      .then(res => setAvailable(res.available_to_add || []))
      .catch(err => toast.error(err.message || 'Failed to load roles'))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async () => {
    if (!pickedRole) return;
    setSubmitting(true);
    try {
      // Backend returns { message, role, roles: [{role, is_primary, added_at}, ...] }
      // We must refresh user.roles[] from this response BEFORE switching active role,
      // otherwise switchRole() rejects because the new role is not yet in the cached
      // user.roles[] (which was last seeded at login). applyRolesUpdate writes both
      // the fresh roles[] and the new activeRole atomically to React state + localStorage.
      const res = await rolesAPI.add(pickedRole);
      applyRolesUpdate(res.roles || [], pickedRole);
      toast.success(`${ROLE_META[pickedRole]?.label || pickedRole} role added!`);
      // Brief delay so the toast renders before navigation
      setTimeout(() => navigate('/dashboard', { replace: true }), 600);
    } catch (err) {
      toast.error(err.message || 'Could not add role');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: C.textMuted }}>
        <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
        Loading...
      </div>
    );
  }

  if (!available.length) {
    return (
      <div style={{ padding: 48, maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
        <CheckCircle2 size={48} style={{ color: C.gold, margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: 22, fontWeight: 700, color: C.textPrimary, marginBottom: 8 }}>
          You hold every available role!
        </h2>
        <p style={{ color: C.textSecond, marginBottom: 24 }}>
          Your account already has all 11 roles. Switch between them via the tabs at the top of the dashboard.
        </p>
        <button onClick={() => navigate('/dashboard')} style={primaryBtn}>
          Back to dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 24px', maxWidth: 960, margin: '0 auto' }}>
      <button
        onClick={() => navigate(-1)}
        style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'6px 12px',
                 background:'transparent', border:'none', color:C.textSecond, cursor:'pointer',
                 fontSize:13, marginBottom:16 }}
      >
        <ArrowLeft size={14} /> Back
      </button>

      <h1 style={{ fontSize:28, fontWeight:700, color:C.textPrimary, marginBottom:6 }}>
        Add another role
      </h1>
      <p style={{ color:C.textSecond, marginBottom:8 }}>
        You currently hold {existingRoles.length === 1 ? 'one role' : `${existingRoles.length} roles`}:{' '}
        <strong>{existingRoles.map(r => ROLE_META[r]?.label || r).join(', ')}</strong>.
      </p>
      <p style={{ color:C.textMuted, fontSize:13, marginBottom:32 }}>
        Adding a role gives you a separate dashboard for that persona. Switch between them using the tabs at the top of any dashboard page. Your existing roles stay active.
      </p>

      {step === 1 && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:14 }}>
            {available.map(role => {
              const meta = ROLE_META[role] || { label: role, Icon: Briefcase, category: '', desc: '' };
              const Icon = meta.Icon;
              const picked = pickedRole === role;
              return (
                <button
                  key={role}
                  onClick={() => setPickedRole(role)}
                  style={{
                    textAlign: 'left',
                    padding: '18px 18px',
                    background: picked ? C.goldBg : C.cardBg,
                    border: `2px solid ${picked ? C.borderActive : C.border}`,
                    borderRadius: 12,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    boxShadow: picked ? '0 2px 10px rgba(212,168,67,0.10)' : 'none',
                  }}
                  onMouseEnter={e => { if (!picked) e.currentTarget.style.background = C.hoverBg; }}
                  onMouseLeave={e => { if (!picked) e.currentTarget.style.background = C.cardBg; }}
                >
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                    <div style={{
                      width:36, height:36, borderRadius:10,
                      background: picked ? C.gold : C.goldBg,
                      display:'flex', alignItems:'center', justifyContent:'center',
                    }}>
                      <Icon size={18} color={picked ? '#fff' : C.gold} />
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:600, color:C.textPrimary, fontSize:15 }}>{meta.label}</div>
                      <div style={{ fontSize:11, color:C.textMuted, fontWeight:500, letterSpacing:0.4 }}>
                        {meta.category.toUpperCase()}
                      </div>
                    </div>
                    {picked && <CheckCircle2 size={20} style={{ color: C.gold }} />}
                  </div>
                  <p style={{ fontSize:12.5, color:C.textSecond, lineHeight:1.45, margin:0 }}>
                    {meta.desc}
                  </p>
                </button>
              );
            })}
          </div>

          <div style={{ marginTop:32, display:'flex', justifyContent:'flex-end', gap:12 }}>
            <button onClick={() => navigate('/dashboard')} style={ghostBtn}>Cancel</button>
            <button
              onClick={() => setStep(2)}
              disabled={!pickedRole}
              style={{ ...primaryBtn, opacity: pickedRole ? 1 : 0.5, cursor: pickedRole ? 'pointer' : 'not-allowed' }}
            >
              Continue <ArrowRight size={14} style={{ marginLeft:6, verticalAlign:'middle' }}/>
            </button>
          </div>
        </>
      )}

      {step === 2 && pickedRole && (
        <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 12, padding: 28 }}>
          <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:20 }}>
            <div style={{
              width:48, height:48, borderRadius:12,
              background: C.goldBg, display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              {(() => { const I = ROLE_META[pickedRole]?.Icon || Briefcase; return <I size={24} color={C.gold} />; })()}
            </div>
            <div>
              <div style={{ fontSize:13, color:C.textMuted, fontWeight:500 }}>Adding role</div>
              <div style={{ fontSize:20, fontWeight:700, color:C.textPrimary }}>
                {ROLE_META[pickedRole]?.label || pickedRole}
              </div>
            </div>
          </div>

          <div style={{ background: C.greenBg, border: `1px solid ${C.greenBorder}`, padding:14, borderRadius:8, marginBottom:20 }}>
            <div style={{ fontWeight:600, color:'#065F46', fontSize:13, marginBottom:4 }}>What happens next</div>
            <ul style={{ margin:0, paddingLeft:18, fontSize:13, color:'#065F46', lineHeight:1.7 }}>
              <li>A new <strong>{ROLE_META[pickedRole]?.label}</strong> dashboard tab is added to your account.</li>
              <li>You can switch to it from the tabs at the top of any dashboard page.</li>
              <li>Your existing roles remain active and unchanged.</li>
              <li>You will receive a confirmation email at your registered address.</li>
            </ul>
          </div>

          <p style={{ fontSize:13, color:C.textMuted, marginBottom:24 }}>
            You can fill in your {ROLE_META[pickedRole]?.label} profile details after adding the role,
            from the {ROLE_META[pickedRole]?.label} dashboard.
          </p>

          <div style={{ display:'flex', justifyContent:'flex-end', gap:12 }}>
            <button onClick={() => setStep(1)} disabled={submitting} style={ghostBtn}>
              <ArrowLeft size={14} style={{ marginRight:6, verticalAlign:'middle' }}/> Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{ ...primaryBtn, opacity: submitting ? 0.7 : 1, cursor: submitting ? 'wait' : 'pointer' }}
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" style={{ marginRight:6, verticalAlign:'middle' }}/>
                  Adding...
                </>
              ) : (
                <>
                  Confirm and add role
                  <CheckCircle2 size={14} style={{ marginLeft:6, verticalAlign:'middle' }}/>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const primaryBtn = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '10px 20px',
  background: C.gold,
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'background 0.15s',
};

const ghostBtn = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '10px 20px',
  background: 'transparent',
  color: C.textSecond,
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.15s',
};
