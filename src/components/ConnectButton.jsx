/**
 * OpenI Hub — ConnectButton (Phase 18)
 * Reusable button that adapts to connection status:
 *   none → "Connect"
 *   pending outgoing → "Pending" (with withdraw)
 *   pending incoming → "Accept / Decline"
 *   accepted → "Connected" (with disconnect)
 *   blocked → hidden
 */
import { useState, useEffect } from 'react';
import { connectionAPI } from '../services/api';
import { UserPlus, UserCheck, Clock, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

const G = '#D5AA5B';

export default function ConnectButton({ userId, size = 'md', onStatusChange }) {
  const [status, setStatus] = useState(null); // null = loading
  const [direction, setDirection] = useState('none');
  const [connId, setConnId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [showRelType, setShowRelType] = useState(false);

  useEffect(() => {
    if (!userId) return;
    connectionAPI.check(userId).then(data => {
      setStatus(data.status);
      setDirection(data.direction || 'none');
      setConnId(data.connection_id || null);
    }).catch(() => setStatus('error'));
  }, [userId]);

  const notify = (newStatus) => {
    if (onStatusChange) onStatusChange(newStatus);
  };

  const handleSend = async (relType = 'colleague') => {
    setBusy(true);
    try {
      const res = await connectionAPI.send({ recipient_id: userId, relationship_type: relType });
      setStatus('pending');
      setDirection('outgoing');
      setConnId(res.connection_id);
      setShowRelType(false);
      toast.success('Connection request sent!');
      notify('pending');
    } catch (err) { toast.error(err.message); }
    finally { setBusy(false); }
  };

  const handleRespond = async (action) => {
    setBusy(true);
    try {
      await connectionAPI.respond(connId, action);
      setStatus(action === 'accept' ? 'accepted' : 'declined');
      toast.success(action === 'accept' ? 'Connection accepted!' : 'Request declined');
      notify(action === 'accept' ? 'accepted' : 'declined');
    } catch (err) { toast.error(err.message); }
    finally { setBusy(false); }
  };

  const handleWithdraw = async () => {
    setBusy(true);
    try {
      await connectionAPI.remove(connId);
      setStatus('none');
      setConnId(null);
      toast.success('Connection removed');
      notify('none');
    } catch (err) { toast.error(err.message); }
    finally { setBusy(false); }
  };

  if (status === null || status === 'error' || status === 'self' || status === 'blocked') return null;

  const sm = size === 'sm';
  const btnBase = {
    display: 'inline-flex', alignItems: 'center', gap: sm ? 4 : 6,
    padding: sm ? '4px 10px' : '6px 14px',
    fontSize: sm ? 11 : 13, fontWeight: 600, borderRadius: 8,
    cursor: busy ? 'wait' : 'pointer', border: 'none', transition: 'all 0.15s',
  };

  // ── NONE → show Connect with relationship picker
  if (status === 'none' || status === 'declined') {
    if (showRelType) {
      return (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {['colleague', 'partner', 'investor', 'advisor', 'mentor', 'other'].map(t => (
            <button key={t} disabled={busy} onClick={() => handleSend(t)}
              style={{ ...btnBase, background: '#f5f0e6', color: '#333', textTransform: 'capitalize' }}>
              {t}
            </button>
          ))}
          <button onClick={() => setShowRelType(false)} style={{ ...btnBase, background: '#eee', color: '#888' }}>
            <X size={12} />
          </button>
        </div>
      );
    }
    return (
      <button disabled={busy} onClick={() => setShowRelType(true)}
        style={{ ...btnBase, background: G, color: '#fff' }}>
        <UserPlus size={sm ? 12 : 14} /> Connect
      </button>
    );
  }

  // ── PENDING OUTGOING → Pending (click to withdraw)
  if (status === 'pending' && direction === 'outgoing') {
    return (
      <button disabled={busy} onClick={handleWithdraw}
        style={{ ...btnBase, background: '#f5f0e6', color: '#b8860b', border: `1px solid ${G}` }}>
        <Clock size={sm ? 12 : 14} /> Pending
      </button>
    );
  }

  // ── PENDING INCOMING → Accept / Decline
  if (status === 'pending' && direction === 'incoming') {
    return (
      <div style={{ display: 'flex', gap: 4 }}>
        <button disabled={busy} onClick={() => handleRespond('accept')}
          style={{ ...btnBase, background: '#16a34a', color: '#fff' }}>
          <Check size={sm ? 12 : 14} /> Accept
        </button>
        <button disabled={busy} onClick={() => handleRespond('decline')}
          style={{ ...btnBase, background: '#eee', color: '#666' }}>
          <X size={sm ? 12 : 14} />
        </button>
      </div>
    );
  }

  // ── ACCEPTED → Connected (click to disconnect)
  if (status === 'accepted') {
    return (
      <button disabled={busy} onClick={handleWithdraw}
        style={{ ...btnBase, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>
        <UserCheck size={sm ? 12 : 14} /> Connected
      </button>
    );
  }

  return null;
}
