/**
 * OpenI Hub — OrgAdmin (Phase 21)
 * Organization admin panel: manage members, view seats, invite users.
 * Accessible from Settings for org admins, or as a standalone page.
 */
import { useState, useEffect, useCallback } from 'react';
import { orgAPI, subscriptionAPI, claimAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Building2, UserPlus, Trash2, Loader2,
  Crown, X,
} from 'lucide-react';
import toast from 'react-hot-toast';

const G = '#D0A848';
const card = { background: '#fff', border: '1px solid #eee', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: 20 };

function Avatar({ name, size = 36 }) {
  const letter = (name || '?')[0].toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: '#f5f0e6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: G, fontSize: size * 0.4 }}>
      {letter}
    </div>
  );
}

export default function OrgAdmin() {
  const { user } = useAuth();
  const [org, setOrg] = useState(null);
  const [members, setMembers] = useState([]);
  const [myRole, setMyRole] = useState('member');
  const [seatsUsed, setSeatsUsed] = useState(0);
  const [loading, setLoading] = useState(true);

  // Invite form
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviting, setInviting] = useState(false);

  // Create org form
  const [showCreate, setShowCreate] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgDomain, setNewOrgDomain] = useState('');
  const [newOrgSeats, setNewOrgSeats] = useState(10);
  const [creating, setCreating] = useState(false);
  const [plans, setPlans] = useState([]);
  // Bug #2a recourse: when createOrg returns 409 (org already exists), the
  // backend sends { error, recourse:'claim'|'join', org }. We stash it here to
  // offer a claim/join CTA instead of a dead-end "already exists" toast.
  const [createRecourse, setCreateRecourse] = useState(null);
  const [recourseBusy, setRecourseBusy] = useState(false);

  const loadOrg = useCallback(async () => {
    setLoading(true);
    try {
      const data = await orgAPI.getMyOrg();
      setOrg(data.org);
      setMembers(data.members || []);
      setMyRole(data.my_role || 'member');
      setSeatsUsed(data.seats_used || 0);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadOrg(); }, [loadOrg]);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      await orgAPI.inviteMember({ email: inviteEmail.trim().toLowerCase(), role: inviteRole });
      toast.success('Member added!');
      setInviteEmail('');
      setShowInvite(false);
      loadOrg();
    } catch (err) { toast.error(err.message); }
    finally { setInviting(false); }
  };

  const handleRemove = async (memberId, name) => {
    if (!confirm(`Remove ${name} from the organization? They will lose access to the org plan.`)) return;
    try {
      await orgAPI.removeMember(memberId);
      toast.success('Member removed');
      loadOrg();
    } catch (err) { toast.error(err.message); }
  };

  const handleToggleRole = async (memberId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'member' : 'admin';
    try {
      await orgAPI.updateMember(memberId, { role: newRole });
      toast.success(`Role updated to ${newRole}`);
      loadOrg();
    } catch (err) { toast.error(err.message); }
  };

  const handleCreateOrg = async () => {
    if (!newOrgName.trim()) return;
    setCreating(true);
    setCreateRecourse(null);
    try {
      // Load plans if needed
      if (!plans.length) {
        const p = await subscriptionAPI.getPlans();
        setPlans(p.plans || []);
      }
      await orgAPI.create({
        name: newOrgName.trim(),
        domain: newOrgDomain.trim() || null,
        seat_limit: newOrgSeats,
      });
      toast.success('Organization created!');
      setShowCreate(false);
      loadOrg();
    } catch (err) {
      // 409 = this org already exists. The backend tells us whether to claim
      // (existing org is an unclaimed imported placeholder) or join (existing
      // org has a real admin). Surface a productive CTA instead of a dead-end.
      if (err.status === 409 && err.recourse && err.org) {
        setCreateRecourse({ recourse: err.recourse, org: err.org, error: err.error });
        toast.error(err.error || 'This organization already exists.');
      } else {
        toast.error(err.message);
      }
    }
    finally { setCreating(false); }
  };

  // Act on the 409 recourse: claim an unclaimed placeholder org, or request to
  // join an org that already has a real admin.
  const handleRecourse = async () => {
    if (!createRecourse?.org?.id) return;
    setRecourseBusy(true);
    try {
      if (createRecourse.recourse === 'claim') {
        await claimAPI.request({
          target_org_id: createRecourse.org.id,
          evidence: `Requesting to claim ${createRecourse.org.name} — I created this org record while registering my organization.`,
        });
        toast.success('Claim submitted. Check your email or your claims dashboard for next steps.');
      } else {
        await orgAPI.requestJoin({ org_id: createRecourse.org.id });
        toast.success(`Request to join ${createRecourse.org.name} sent to its admin.`);
      }
      setCreateRecourse(null);
      setShowCreate(false);
    } catch (err) { toast.error(err.error || err.message); }
    finally { setRecourseBusy(false); }
  };

  const isAdmin = myRole === 'admin';

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Loader2 size={24} className="spin" style={{ color: '#aaa' }} />
      </div>
    );
  }

  // No org — show create form
  if (!org) {
    return (
      <div style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>Organization</h1>
        <p style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>
          Create an organization to manage bulk licenses for your team.
        </p>

        {!showCreate ? (
          <button onClick={() => setShowCreate(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: G, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            <Building2 size={16} /> Create Organization
          </button>
        ) : (
          <div style={card}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>New Organization</h3>
            <div style={{ display: 'grid', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>Organization Name *</label>
                <input value={newOrgName} onChange={e => setNewOrgName(e.target.value)} placeholder="e.g. Tata Innovation Corp"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 16 }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>Domain (optional)</label>
                <input value={newOrgDomain} onChange={e => setNewOrgDomain(e.target.value)} placeholder="e.g. tata.com"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 16 }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>Seat Limit</label>
                <input type="number" value={newOrgSeats} onChange={e => setNewOrgSeats(parseInt(e.target.value) || 5)} min={2} max={100}
                  style={{ width: 100, padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 16 }} />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button onClick={handleCreateOrg} disabled={creating || !newOrgName.trim()}
                  style={{ padding: '8px 20px', background: G, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: creating ? 'wait' : 'pointer' }}>
                  {creating ? 'Creating...' : 'Create'}
                </button>
                <button onClick={() => setShowCreate(false)}
                  style={{ padding: '8px 20px', background: '#eee', color: '#666', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bug #2a recourse: this org already exists. Offer claim (unclaimed
            placeholder) or request-to-join (real admin) instead of a dead-end. */}
        {createRecourse && createRecourse.org && (
          <div style={{ ...card, marginTop: 16, borderColor: G, background: '#fffdf7' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, color: '#1a1a1a' }}>
              {createRecourse.org.name} already exists
            </h3>
            <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
              {createRecourse.recourse === 'claim'
                ? 'This organization is an unclaimed placeholder. You can claim it to take ownership — its existing data will be merged into your account.'
                : 'This organization already has an admin. Send a request to join their team.'}
            </p>
            <button onClick={handleRecourse} disabled={recourseBusy}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 22px', background: G, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: recourseBusy ? 'wait' : 'pointer', opacity: recourseBusy ? 0.6 : 1 }}>
              {recourseBusy && <Loader2 size={14} className="animate-spin" />}
              {createRecourse.recourse === 'claim'
                ? `Claim ${createRecourse.org.name}`
                : `Request to join ${createRecourse.org.name}`}
            </button>
          </div>
        )}
      </div>
    );
  }

  // Has org — show admin panel
  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      {/* Header */}
      <div id="tour-page-organization" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>{org.name}</h1>
          <p style={{ fontSize: 13, color: '#888' }}>
            {org.plan_display_name || org.plan_name || 'No plan'} &middot; {seatsUsed}/{org.seat_limit} seats used
            {org.domain && <span> &middot; {org.domain}</span>}
          </p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowInvite(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: G, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
            <UserPlus size={14} /> Add Member
          </button>
        )}
      </div>

      {/* Seats bar */}
      <div style={{ ...card, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#555', marginBottom: 6 }}>
          <span>Seats Used</span>
          <span style={{ fontWeight: 600 }}>{seatsUsed} / {org.seat_limit}</span>
        </div>
        <div style={{ height: 8, borderRadius: 4, background: '#f3f4f6' }}>
          <div style={{
            height: '100%', borderRadius: 4, transition: 'width 0.3s',
            width: `${Math.min((seatsUsed / org.seat_limit) * 100, 100)}%`,
            background: seatsUsed >= org.seat_limit ? '#dc2626' : seatsUsed >= org.seat_limit * 0.8 ? '#f59e0b' : '#16a34a',
          }} />
        </div>
      </div>

      {/* Invite form */}
      {showInvite && isAdmin && (
        <div style={{ ...card, marginBottom: 16, background: '#fffbeb' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Add New Member</h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="Email address"
              style={{ flex: 1, minWidth: 200, padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 16 }} />
            <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 16 }}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}
              style={{ padding: '8px 16px', background: G, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: inviting ? 'wait' : 'pointer' }}>
              {inviting ? 'Adding...' : 'Add'}
            </button>
            <button onClick={() => setShowInvite(false)}
              style={{ padding: '8px 12px', background: '#eee', color: '#666', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
              <X size={14} />
            </button>
          </div>
          <p style={{ fontSize: 11, color: '#888', marginTop: 8 }}>
            If the user exists on OpenI Hub, they will be added immediately and inherit the org plan. Otherwise, an invite email will be sent.
          </p>
        </div>
      )}

      {/* Members list */}
      <div style={card}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Members ({members.length})</h3>
        <div style={{ display: 'grid', gap: 8 }}>
          {members.map(m => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
              <Avatar name={m.display_name || m.name || m.email} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>
                  {m.display_name || m.name || m.email}
                  {m.role === 'admin' && <Crown size={12} style={{ color: G, marginLeft: 6, verticalAlign: 'middle' }} />}
                </div>
                <div style={{ fontSize: 11, color: '#888' }}>{m.email} &middot; {m.persona_type || 'pending'}</div>
              </div>
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10,
                background: m.status === 'active' ? '#f0fdf4' : '#fef3c7',
                color: m.status === 'active' ? '#16a34a' : '#92400e',
              }}>
                {m.status}
              </span>
              {isAdmin && m.user_id !== user.id && m.status === 'active' && (
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => handleToggleRole(m.id, m.role)} title={`Make ${m.role === 'admin' ? 'member' : 'admin'}`}
                    style={{ padding: '4px 8px', background: '#f5f5f5', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, color: '#666' }}>
                    {m.role === 'admin' ? 'Demote' : 'Promote'}
                  </button>
                  <button onClick={() => handleRemove(m.id, m.display_name || m.email)} title="Remove"
                    style={{ padding: '4px 8px', background: '#fef2f2', border: 'none', borderRadius: 6, cursor: 'pointer', color: '#dc2626' }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              )}
            </div>
          ))}
          {members.length === 0 && (
            <div style={{ textAlign: 'center', padding: 20, color: '#aaa', fontSize: 13 }}>No members yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
