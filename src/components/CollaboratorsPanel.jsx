/**
 * CollaboratorsPanel — Phase 40 (cross-persona)
 *
 * Generic team collaboration panel. Works on any entity type supported by
 * the backend (challenge, deal_request, govt_program, incubator_program,
 * accelerator_batch, ...).
 *
 * Props:
 *  - entityType: e.g. 'challenge', 'deal_request'
 *  - entityId: number
 *  - title (optional): custom heading
 *  - onChange (optional): called after mutations
 */
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Users, UserPlus, X, Loader2, Shield, Eye, Star, Crown } from 'lucide-react';
import { collabAPI } from '../services/api';

const G = '#D0A848';

const ROLE_META = {
  owner:    { icon: Crown,  color: '#b45309', bg: '#fef3c7', label: 'Owner',    desc: 'Full access, cannot be removed' },
  editor:   { icon: Shield, color: '#0284c7', bg: '#e0f2fe', label: 'Editor',   desc: 'Can edit + review' },
  reviewer: { icon: Star,   color: '#7c3aed', bg: '#ede9fe', label: 'Reviewer', desc: 'Can score applications' },
  viewer:   { icon: Eye,    color: '#6b7280', bg: '#f3f4f6', label: 'Viewer',   desc: 'Read-only access' },
};

function avatarColor(id) {
  const palette = ['#7c3aed', '#0284c7', '#16a34a', '#d97706', '#dc2626', '#db2777', '#0891b2', '#4f46e5'];
  return palette[(id || 0) % palette.length];
}

function Avatar({ name, id, size = 28 }) {
  const initials = (name || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: avatarColor(id), color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.floor(size / 2.5), fontWeight: 600, flexShrink: 0,
    }}>
      {initials || '?'}
    </div>
  );
}

export default function CollaboratorsPanel({ entityType, entityId, title = 'Collaboration Team', onChange }) {
  const [loading, setLoading] = useState(true);
  const [collaborators, setCollaborators] = useState([]);
  const [myRole, setMyRole] = useState(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('reviewer');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await collabAPI.list(entityType, entityId);
      setCollaborators(r.collaborators || []);
      setMyRole(r.my_role);
    } catch (err) {
      toast.error(err.message || 'Failed to load collaborators');
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => { if (entityType && entityId) load(); }, [load, entityType, entityId]);

  const canManage = myRole === 'editor';

  const submitInvite = async () => {
    if (!inviteEmail.trim()) return toast.error('Enter an email');
    setBusy(true);
    try {
      // inviteByEmail handles BOTH registered users (added immediately) and
      // non-registered emails (a pending invite is created + emailed).
      const r = await collabAPI.inviteByEmail({
        entity_type: entityType,
        entity_id: entityId,
        emails: [inviteEmail.trim()],
        role: inviteRole,
      });
      const addedCount = r?.added?.length || 0;
      const pendingCount = r?.pending_email_invites?.length || 0;
      if (addedCount) {
        toast.success('Collaborator added');
      } else if (pendingCount) {
        toast.success('Invitation emailed — they\u2019ll join once they sign up');
      } else {
        toast.success('Invitation sent');
      }
      setInviteEmail('');
      setInviteOpen(false);
      load();
      onChange?.();
    } catch (err) {
      toast.error(err.message || 'Invite failed');
    } finally {
      setBusy(false);
    }
  };

  const changeRole = async (collabId, role) => {
    try {
      await collabAPI.updateRole(entityType, entityId, collabId, role);
      toast.success('Role updated');
      load();
    } catch (err) { toast.error(err.message); }
  };

  const remove = async (collabId, name) => {
    if (!confirm(`Remove ${name} from this ${entityType}?`)) return;
    try {
      await collabAPI.remove(entityType, entityId, collabId);
      toast.success('Removed');
      load();
      onChange?.();
    } catch (err) { toast.error(err.message); }
  };

  if (loading) {
    return (
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#888' }}>
          <Loader2 size={14} className="animate-spin" /> Loading team…
        </div>
      </div>
    );
  }

  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Users size={16} style={{ color: G }} />
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>
            {title} <span style={{ color: '#999', fontWeight: 400 }}>({collaborators.length})</span>
          </h3>
        </div>
        {canManage && !inviteOpen && (
          <button
            onClick={() => setInviteOpen(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '5px 10px', borderRadius: 7, border: `1px solid ${G}`,
              background: 'white', color: G, fontSize: 11, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <UserPlus size={11} /> Invite
          </button>
        )}
      </div>

      {inviteOpen && (
        <div style={{ padding: 10, background: '#fafafa', border: '1px solid #eee', borderRadius: 8, marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            <input
              type="email"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              placeholder="colleague@company.com"
              style={{ flex: 1, padding: '6px 8px', fontSize: 16, border: '1px solid #e5e7eb', borderRadius: 6, outline: 'none' }}
              onKeyDown={e => e.key === 'Enter' && submitInvite()}
            />
            <select
              value={inviteRole}
              onChange={e => setInviteRole(e.target.value)}
              style={{ padding: '6px 8px', fontSize: 16, border: '1px solid #e5e7eb', borderRadius: 6, background: 'white' }}
            >
              <option value="editor">Editor</option>
              <option value="reviewer">Reviewer</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button
              onClick={submitInvite}
              disabled={busy}
              style={{
                padding: '6px 12px', borderRadius: 6, background: G, color: '#fff',
                border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer',
              }}
            >
              {busy ? <Loader2 size={11} className="animate-spin" /> : 'Send invite'}
            </button>
            <button
              onClick={() => { setInviteOpen(false); setInviteEmail(''); }}
              style={{ padding: '6px 10px', fontSize: 11, color: '#666', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <span style={{ fontSize: 10, color: '#888', marginLeft: 'auto' }}>
              {ROLE_META[inviteRole]?.desc}
            </span>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {collaborators.map(c => {
          const meta = ROLE_META[c.role] || ROLE_META.viewer;
          const Icon = meta.icon;
          return (
            <div
              key={c.role === 'owner' ? 'owner' : c.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px', borderRadius: 8,
                background: c.role === 'owner' ? '#fffbeb' : '#fff',
                border: `1px solid ${c.role === 'owner' ? '#fde68a' : '#f3f4f6'}`,
              }}
            >
              <Avatar id={c.user_id} name={c.name} size={28} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {c.name}
                </div>
                <div style={{ fontSize: 10, color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {c.email}
                </div>
              </div>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 3,
                padding: '2px 8px', borderRadius: 20,
                background: meta.bg, color: meta.color,
                fontSize: 10, fontWeight: 600,
              }}>
                <Icon size={10} /> {meta.label}
              </span>
              {canManage && c.role !== 'owner' && (
                <div style={{ display: 'flex', gap: 4 }}>
                  <select
                    value={c.role}
                    onChange={e => changeRole(c.id, e.target.value)}
                    style={{ padding: '3px 6px', fontSize: 16, border: '1px solid #e5e7eb', borderRadius: 5, background: 'white' }}
                    title="Change role"
                  >
                    <option value="editor">Editor</option>
                    <option value="reviewer">Reviewer</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <button
                    onClick={() => remove(c.id, c.name)}
                    title="Remove"
                    style={{ padding: 4, background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', display: 'flex' }}
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!canManage && collaborators.length <= 1 && (
        <p style={{ fontSize: 11, color: '#888', textAlign: 'center', margin: '8px 0 0 0' }}>
          No collaborators yet. The owner can invite team members to help review.
        </p>
      )}
    </div>
  );
}

const card = {
  background: '#fff',
  border: '1px solid #eee',
  borderRadius: 12,
  padding: 16,
  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
};
