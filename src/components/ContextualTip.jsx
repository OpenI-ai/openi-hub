/**
 * OpenI Hub — ContextualTip (Phase 22)
 * Lightweight first-visit tooltip. Shows once per tipKey, dismissed on click.
 * Uses localStorage to track which tips have been seen.
 *
 * Usage:
 *   <ContextualTip tipKey="directory-search" position="bottom">
 *     Use the search bar to find startups, investors, and mentors across the ecosystem.
 *   </ContextualTip>
 */
import { useState, useEffect } from 'react';
import { Lightbulb, X } from 'lucide-react';
import safeStorage from '../utils/safeStorage';

const G = '#D0A848';
const STORAGE_KEY = 'openi_tips_seen';

function getSeenTips() {
  try {
    return JSON.parse(safeStorage.getItem(STORAGE_KEY) || '{}');
  } catch { return {}; }
}

function markSeen(tipKey) {
  const seen = getSeenTips();
  seen[tipKey] = Date.now();
  safeStorage.setItem(STORAGE_KEY, JSON.stringify(seen));
}

export default function ContextualTip({ tipKey, children, position = 'bottom' }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const seen = getSeenTips();
    if (!seen[tipKey]) {
      // Show after a short delay for better UX
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, [tipKey]);

  const dismiss = () => {
    setVisible(false);
    markSeen(tipKey);
  };

  if (!visible) return null;

  const isTop = position === 'top';

  return (
    <div style={{
      position: 'relative',
      marginTop: isTop ? 0 : 8,
      marginBottom: isTop ? 8 : 0,
      animation: 'fadeIn 0.3s ease',
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
        border: `1px solid ${G}40`,
        borderRadius: 12,
        padding: '10px 14px',
        display: 'flex',
        gap: 10,
        alignItems: 'flex-start',
        boxShadow: '0 2px 8px rgba(213,170,91,0.15)',
      }}>
        <Lightbulb size={16} color={G} style={{ flexShrink: 0, marginTop: 1 }} />
        <div style={{ flex: 1, fontSize: 12, color: '#92400e', lineHeight: 1.5 }}>
          {children}
        </div>
        <button onClick={dismiss} aria-label="Dismiss tip" style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 2, flexShrink: 0,
          color: '#b8860b', opacity: 0.6,
        }}>
          <X size={14} />
        </button>
      </div>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(${isTop ? '8px' : '-8px'}); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}

/**
 * Reset all seen tips (useful for testing or Settings).
 */
export function resetAllTips() {
  safeStorage.removeItem(STORAGE_KEY);
}
