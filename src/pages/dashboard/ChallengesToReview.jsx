import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ClipboardCheck, Calendar, Building2, ArrowRight, Loader2 } from 'lucide-react';
import { corporateAPI } from '../../services/api';

const G = '#D5AA5B';

const ROLE_LABELS = {
  reviewer: 'Reviewer',
  viewer:   'Viewer',
  editor:   'Editor',
  owner:    'Owner',
};

const ROLE_DESCRIPTIONS = {
  reviewer: 'You can review and rate applications.',
  viewer:   'You can view the challenge and its applications.',
  editor:   'You can edit the challenge and manage applications.',
  owner:    'You created this challenge.',
};

export default function ChallengesToReview() {
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const r = await corporateAPI.myReviewerQueue();
        setChallenges(r.challenges || []);
      } catch (err) {
        console.error('[challenges-to-review] load failed:', err);
        toast.error(err?.message || 'Failed to load review queue');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px' }}>
      <div id="tour-page-review-queue-header" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <ClipboardCheck size={22} color={G} />
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: '#1a1a1a' }}>
          Challenges to Review
        </h1>
      </div>
      <p style={{ fontSize: 13, color: '#666', margin: '0 0 20px' }}>
        Challenges where you have been added as a reviewer, viewer, or editor.
        Click any card to open the challenge detail and review applications.
      </p>

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#888', fontSize: 13 }}>
          <Loader2 size={14} className="animate-spin" /> Loading…
        </div>
      )}

      {!loading && challenges.length === 0 && (
        <div style={{
          padding: 32, textAlign: 'center', background: '#f9fafb',
          border: '1.5px dashed #e5e7eb', borderRadius: 12, color: '#999', fontSize: 14,
        }}>
          <ClipboardCheck size={32} color="#ccc" style={{ marginBottom: 8 }} />
          <div style={{ fontWeight: 600, color: '#666', marginBottom: 4 }}>
            No review assignments yet
          </div>
          <div style={{ fontSize: 12 }}>
            When a corporate adds you as a reviewer on their challenge, it will appear here.
          </div>
        </div>
      )}

      {!loading && challenges.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {challenges.map(ch => (
            <div key={ch.id}
              onClick={() => navigate(`/dashboard/corporate/challenges?challenge=${ch.id}`)}
              style={{
                padding: 16, background: '#fff', border: '1.5px solid #e5e7eb',
                borderRadius: 12, cursor: 'pointer', display: 'flex',
                alignItems: 'flex-start', gap: 14, transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = G; e.currentTarget.style.background = `${G}08`; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.background = '#fff'; }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: '#1a1a1a' }}>
                    {ch.title}
                  </h3>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 8px',
                    borderRadius: 12, background: `${G}20`, color: '#5a4715',
                    border: `1px solid ${G}50`,
                  }}>
                    {ROLE_LABELS[ch.my_role] || ch.my_role}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                  <Building2 size={11} style={{ verticalAlign: -1, marginRight: 4 }} />
                  {ch.corporate_org || ch.corporate_name || 'Unknown organization'}
                </div>
                {ch.description && (
                  <p style={{
                    fontSize: 12, color: '#555', margin: '0 0 8px',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {ch.description}
                  </p>
                )}
                <div style={{ fontSize: 11, color: '#999', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  {ch.created_at && (
                    <span>
                      <Calendar size={10} style={{ verticalAlign: -1, marginRight: 3 }} />
                      Posted {new Date(ch.created_at).toLocaleDateString()}
                    </span>
                  )}
                  <span style={{ color: '#888' }}>
                    {ROLE_DESCRIPTIONS[ch.my_role] || ''}
                  </span>
                </div>
              </div>
              <ArrowRight size={16} color="#999" style={{ flexShrink: 0, marginTop: 8 }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
