import { useState, useEffect } from 'react';
import { Inbox, Check, X, Building2, Calendar, Loader2 } from 'lucide-react';
import { applicantInviteAPI } from '../../services/api';

const G = '#C9A646';
const palette = {
  invited:  { bg: '#FFF8E6', border: '#F0D77A', fg: '#7A5A00' },
  accepted: { bg: '#E8F5E9', border: '#9CCB9F', fg: '#2E6B33' },
  declined: { bg: '#F5F5F5', border: '#D0D0D0', fg: '#666' },
  revoked:  { bg: '#F5F5F5', border: '#D0D0D0', fg: '#999' },
};
const ENTITY_LABEL = {
  investor: 'Deal Sourcing', incubator: 'Incubator Program',
  accelerator: 'Accelerator Batch', lab: 'Lab Facility',
};

// Mirrors ChallengeInvites.jsx, but for the generic Phase F applicant-invite
// subsystem (investor deal requests / incubator programs / accelerator
// batches / lab announcements). Unlike challenge invites, "Accept" fully
// materializes the application server-side (respondToInvite → applicantInviteAPI.respond)
// — there's no separate apply form to navigate to afterward.
export default function ApplicationInvites() {
  const [filter, setFilter] = useState('invited');
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await applicantInviteAPI.myInvites(filter);
      setInvites(data.invites || []);
    } catch (e) {
      console.error('[ApplicationInvites] load failed:', e);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional refetch on filter change; `load` is a stable inline closure
  useEffect(() => { load(); }, [filter]);

  const respond = async (inviteId, status) => {
    setActing(inviteId);
    try {
      await applicantInviteAPI.respond(inviteId, status);
      await load();
    } catch (e) {
      alert(e?.message || 'Action failed');
    } finally {
      setActing(null);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 980, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <Inbox size={28} color={G} />
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>Application Invites</h1>
      </div>
      <p style={{ color: '#666', fontSize: 13, marginTop: 4, marginBottom: 24 }}>
        Opportunities (deal sourcing, incubator, accelerator, lab) you have been invited to apply to.
        Accept to submit your application immediately; decline to remove from this list.
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid #eee' }}>
        {[
          { k: 'invited',  label: 'Invited' },
          { k: 'accepted', label: 'Accepted' },
          { k: 'declined', label: 'Declined' },
        ].map(t => (
          <button key={t.k} type="button" onClick={() => setFilter(t.k)}
            style={{
              padding: '10px 18px', fontSize: 13, fontWeight: 600,
              border: 'none', borderBottom: `2px solid ${filter === t.k ? G : 'transparent'}`,
              background: 'transparent', color: filter === t.k ? G : '#666',
              cursor: 'pointer',
            }}>{t.label}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <Loader2 size={28} className="spin" color="#999" />
        </div>
      ) : invites.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>
          <Inbox size={48} color="#ddd" style={{ margin: '0 auto 12px' }} />
          <p style={{ fontSize: 14, margin: 0 }}>No {filter} invites yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {invites.map(inv => {
            const c = palette[inv.status] || palette.invited;
            return (
              <div key={inv.id} style={{
                border: `1.5px solid ${c.border}`, borderRadius: 12, background: c.bg, padding: 16,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                                   letterSpacing: 0.4, color: c.fg, marginBottom: 4 }}>
                      {inv.status} · {ENTITY_LABEL[inv.entity_type] || inv.entity_type}
                    </div>
                    <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: '#111' }}>
                      {inv.entity_title || 'An opportunity'}
                    </h3>
                  </div>
                  {inv.status === 'invited' && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button type="button" disabled={acting === inv.id}
                        onClick={() => respond(inv.id, 'accepted')}
                        style={{
                          padding: '8px 14px', fontSize: 12, fontWeight: 600,
                          background: G, color: '#fff', border: 'none', borderRadius: 8,
                          cursor: acting === inv.id ? 'wait' : 'pointer', display: 'flex',
                          alignItems: 'center', gap: 6,
                        }}>
                        <Check size={14} /> Accept
                      </button>
                      <button type="button" disabled={acting === inv.id}
                        onClick={() => respond(inv.id, 'declined')}
                        style={{
                          padding: '8px 14px', fontSize: 12, fontWeight: 600,
                          background: '#fff', color: '#666', border: '1.5px solid #ccc', borderRadius: 8,
                          cursor: acting === inv.id ? 'wait' : 'pointer', display: 'flex',
                          alignItems: 'center', gap: 6,
                        }}>
                        <X size={14} /> Decline
                      </button>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 12,
                              color: '#666', marginTop: 10 }}>
                  {inv.inviter_org && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Building2 size={12} /> Invited by {inv.inviter_org}
                    </span>
                  )}
                  {inv.deadline && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={12} /> Deadline {new Date(inv.deadline).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {inv.message && (
                  <div style={{ marginTop: 10, padding: 10, background: '#fff',
                                borderRadius: 8, fontSize: 12, color: '#444',
                                fontStyle: 'italic', borderLeft: `3px solid ${G}` }}>
                    "{inv.message}"
                  </div>
                )}

                {inv.status === 'accepted' && (
                  <p style={{ marginTop: 10, fontSize: 12, color: c.fg, fontWeight: 600 }}>
                    Your application has been submitted automatically.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
