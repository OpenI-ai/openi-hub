/**
 * OpenI Hub — MutualConnectionsBadge (Phase 18)
 * Shows "N mutual connections" inline badge.
 * Clicking expands a tooltip with names.
 */
import { useState, useEffect } from 'react';
import { connectionAPI } from '../services/api';
import { Users } from 'lucide-react';

export default function MutualConnectionsBadge({ userId, size = 'sm' }) {
  const [count, setCount] = useState(0);
  const [names, setNames] = useState([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!userId) return;
    connectionAPI.mutual(userId).then(data => {
      setCount(data.count || 0);
      setNames((data.mutual || []).map(m => m.display_name || m.name));
    }).catch(() => {});
  }, [userId]);

  if (!count) return null;

  const small = size === 'sm';

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: small ? 11 : 12, color: '#5c5c5c', background: 'none',
          border: 'none', cursor: 'pointer', padding: 0,
        }}
      >
        <Users size={small ? 10 : 12} /> {count} mutual
      </button>
      {expanded && names.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, marginTop: 4,
          background: '#fff', border: '1px solid #eee', borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)', padding: '8px 12px',
          zIndex: 999, minWidth: 160, maxWidth: 250,
        }}>
          {names.slice(0, 10).map((n, i) => (
            <div key={i} style={{ fontSize: 12, color: '#333', padding: '2px 0' }}>{n}</div>
          ))}
          {count > 10 && <div style={{ fontSize: 11, color: '#5c5c5c', marginTop: 4 }}>+{count - 10} more</div>}
        </div>
      )}
    </div>
  );
}
