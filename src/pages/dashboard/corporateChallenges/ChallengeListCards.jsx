/**
 * ChallengeListCards — extracted from CorporateChallenges.jsx (Phase 165 / W5-2).
 *
 * The body between the sentinels is a VERBATIM slice of the pre-split file,
 * original lines 1667-1718 of 1721. Nothing inside was reformatted or reindented.
 * Props are the exact set of parent-scope names the slice referenced — they are
 * computed from the slice, never hand-listed, so the signature cannot drift from
 * the call site. Long prop lists are deliberate: grouping them into state/actions
 * objects would force rewriting the body and destroy the verbatim property.
 */

import { Target, Users, Calendar, DollarSign, MapPin } from 'lucide-react';
import { G, card, STATUS_STYLE } from './constants';

export default function ChallengeListCards({ challenges, navigate }) {
  return (
    // ---- BODY START (original lines 1667-1718) ----
    <>
      {/* Challenge list */}
      {challenges.length === 0 ? (
        <div style={{ ...card, padding: 40, textAlign: 'center' }}>
          <Target size={32} style={{ color: '#ddd', marginBottom: 10 }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: '#5c5c5c' }}>No challenges yet</p>
          <p style={{ fontSize: 12, color: '#6e6e6e' }}>Launch your first innovation challenge</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {challenges.map(ch => {
            const st = STATUS_STYLE[ch.status] || STATUS_STYLE.open;
            return (
              <div key={ch.id} style={{ ...card, padding: 16, cursor: 'pointer' }}
                onClick={() => navigate(`/dashboard/corporate/challenges/${ch.id}`)}
                onMouseEnter={e => e.currentTarget.style.borderColor = G}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#eee'}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', margin: 0 }}>{ch.title}</h3>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    {ch.challenge_type && (
                      <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 7px', borderRadius: 20,
                        background: ch.challenge_type === 'partner' ? '#f0fdf4' : ch.challenge_type === 'source' ? '#eff6ff' : '#fefce8',
                        color: ch.challenge_type === 'partner' ? '#16a34a' : ch.challenge_type === 'source' ? '#2563eb' : '#f59e0b' }}>
                        {ch.challenge_type === 'partner' ? 'Partner' : ch.challenge_type === 'source' ? 'Source' : 'Invest'}
                      </span>
                    )}
                    {/* T32-99c-hotfix: list badge */}
                    {(ch.visibility === 'invite_only' || ch.visibility === 'private') && <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: '#fef3c7', color: '#92400e' }}>Invite-only</span>}
                    {ch.visibility === 'draft' && <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: '#f3f4f6', color: '#6b7280' }}>Draft</span>}
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: st.bg, color: st.color }}>{st.label}</span>
                  </div>
                </div>
                {ch.problem_statement && (
                  <p style={{ fontSize: 12, color: '#666', lineHeight: 1.4, margin: '0 0 6px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {ch.problem_statement}
                  </p>
                )}
                <div style={{ display: 'flex', gap: 14, fontSize: 11, color: '#5c5c5c' }}>
                  <span><Users size={11} style={{ verticalAlign: -2 }} /> {parseInt(ch.application_count) || 0} applications</span>
                  {ch.budget_range && <span><DollarSign size={11} style={{ verticalAlign: -2 }} /> {ch.budget_range}</span>}
                  {ch.deadline && <span><Calendar size={11} style={{ verticalAlign: -2 }} /> {new Date(ch.deadline).toLocaleDateString()}</span>}
                  {ch.location && <span><MapPin size={11} style={{ verticalAlign: -2 }} /> {ch.location}</span>}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                  {(ch.sectors || []).map(t => <span key={t} style={{ fontSize: 9, padding: '2px 7px', borderRadius: 20, background: '#eff6ff', color: '#2563eb' }}>{t}</span>)}
                  {(ch.technologies || []).map(t => <span key={t} style={{ fontSize: 9, padding: '2px 7px', borderRadius: 20, background: '#fefce8', color: '#ca8a04' }}>{t}</span>)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
    // ---- BODY END ----
  );
}
