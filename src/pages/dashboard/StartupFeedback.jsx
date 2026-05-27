import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  MessageSquare, Star, Send, ThumbsUp, ThumbsDown, Search, CheckCircle2, Clock, AlertCircle,
} from 'lucide-react';
import { feedbackAPI } from '../../services/api';
import LoadingSkeleton from '../../components/LoadingSkeleton';

const G = '#D5AA5B';
const GH = '#C9983F';

const card = {
  background: '#ffffff',
  border: '1px solid #eeeeee',
  borderRadius: 14,
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
};

const CATEGORIES = [
  'Program Support',
  'Mentoring Quality',
  'Infrastructure Access',
  'Communication & Responsiveness',
  'Funding & Financial Support',
  'Technical Guidance',
  'Process & Documentation',
  'Overall Experience',
];

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const normalizeStatus = (s) => {
  if (!s) return 'Under Review';
  const map = { open: 'Under Review', acknowledged: 'Under Review', resolved: 'Reviewed' };
  return map[s.toLowerCase()] || s;
};

const STATUS_STYLE = {
  Reviewed:       { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0', icon: CheckCircle2 },
  'Pending Action':{ bg: '#fef2f2', color: '#dc2626', border: '#fecaca', icon: AlertCircle },
  'Under Review': { bg: '#fff8ec', color: G,          border: 'rgba(213,170,91,0.4)', icon: Clock },
};

const SENTIMENT_STYLE = {
  positive: { bg: '#f0fdf4', color: '#16a34a', label: 'Positive', icon: ThumbsUp },
  negative: { bg: '#fef2f2', color: '#dc2626', label: 'Negative', icon: ThumbsDown },
  neutral:  { bg: '#f8fafc', color: '#64748b', label: 'Neutral',  icon: MessageSquare },
};

function StarRating({ value, onChange, readOnly = false }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          size={readOnly ? 14 : 20}
          color={n <= (hovered || value) ? G : '#e0e0e0'}
          style={{ fill: n <= (hovered || value) ? G : 'none', cursor: readOnly ? 'default' : 'pointer', transition: 'all 0.1s' }}
          onMouseEnter={() => !readOnly && setHovered(n)}
          onMouseLeave={() => !readOnly && setHovered(0)}
          onClick={() => !readOnly && onChange && onChange(n)}
        />
      ))}
    </div>
  );
}

export default function StartupFeedback() {
  const [view, setView]       = useState('list');
  const [feedbacks, setFeedbacks] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [search, setSearch]   = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sentimentFilter, setSentimentFilter] = useState('All');

  // Form state
  const [form, setForm] = useState({ startup: '', program: '', category: CATEGORIES[0], rating: 0, text: '' });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    Promise.all([
      feedbackAPI.list(),
      feedbackAPI.analytics().catch(() => null),
    ]).then(([fbData, analyticsData]) => {
      const raw = fbData.feedback || fbData || [];
      setFeedbacks(raw.map(f => ({
        ...f,
        startup: f.startup_name || f.startup || '—',
        program: f.title || f.program || '—',
        date: fmtDate(f.created_at),
        rating: Number(f.rating) || 3,
        category: f.category || 'Overall Experience',
        sentiment: f.sentiment || 'neutral',
        status: normalizeStatus(f.status),
        text: f.content || f.text || '',
        actionTaken: f.response || null,
        reviewer: f.responded_at ? 'OpenI Team' : null,
      })));
      if (analyticsData) setAnalytics(analyticsData);
    })
    .catch(err => toast.error(err.message || 'Failed to load feedback'))
    .finally(() => setLoading(false));
  }, []);

  const filtered = feedbacks.filter(f => {
    const matchSearch = (f.startup || '').toLowerCase().includes(search.toLowerCase()) || (f.text || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || f.status === statusFilter;
    const matchSentiment = sentimentFilter === 'All' || f.sentiment === sentimentFilter;
    return matchSearch && matchStatus && matchSentiment;
  });

  const avgRating = feedbacks.length > 0 ? (feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length).toFixed(1) : '0.0';
  const positiveCount = feedbacks.filter(f => f.sentiment === 'positive').length;
  const pendingCount = feedbacks.filter(f => f.status === 'Pending Action' || f.status === 'Under Review').length;

  const submitFeedback = () => {
    if (!form.text.trim()) return;
    feedbackAPI.create({
      startup_id: null,
      category: form.category,
      rating: form.rating || 3,
      title: form.program || 'General Feedback',
      content: form.text.trim(),
    })
      .then(data => {
        toast.success('Feedback submitted successfully');
        const newFb = {
          id: data.id || Date.now(),
          startup: form.startup || '—',
          program: form.program || '—',
          date: fmtDate(new Date()),
          rating: form.rating,
          category: form.category,
          sentiment: form.rating >= 4 ? 'positive' : form.rating <= 2 ? 'negative' : 'neutral',
          status: 'Under Review',
          text: form.text,
          actionTaken: null,
          reviewer: null,
        };
        setFeedbacks(prev => [newFb, ...prev]);
        setSubmitted(true);
      })
      .catch(err => {
        toast.error(err.message || 'Failed to submit feedback');
        // Optimistic: still add locally
        setFeedbacks(prev => [{
          id: Date.now(),
          startup: form.startup || '—',
          program: form.program || '—',
          date: fmtDate(new Date()),
          rating: form.rating,
          category: form.category,
          sentiment: form.rating >= 4 ? 'positive' : form.rating <= 2 ? 'negative' : 'neutral',
          status: 'Under Review',
          text: form.text,
          actionTaken: null,
          reviewer: null,
        }, ...prev]);
        setSubmitted(true);
      });
  };

  if (loading) return <LoadingSkeleton type="card" />;

  return (
    <div style={{ padding: 28, maxWidth: 1100, background: '#f5f5f5', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, color: '#1a1a1a', fontSize: 22, fontWeight: 700 }}>Startup Feedback on OpenI</h1>
          <p style={{ margin: '4px 0 0', color: '#888', fontSize: 13 }}>Collect, track and act on startup feedback to improve OpenI programs</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['list', 'analytics', 'submit'].map(v => (
            <button key={v} onClick={() => { setView(v); setSubmitted(false); }} style={{
              padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, textTransform: 'capitalize',
              border: '1.5px solid', cursor: 'pointer',
              background: view === v ? G : '#fff',
              color: view === v ? '#fff' : '#666',
              borderColor: view === v ? G : '#eee',
            }}>{v === 'submit' ? '+ Submit Feedback' : v}</button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 22 }}>
        {[
          { label: 'Total Feedback',   value: feedbacks.length, icon: MessageSquare, bg: '#fff8ec', fg: G },
          { label: 'Avg Rating',       value: `${avgRating}/5`, icon: Star,          bg: '#f0fdf4', fg: '#16a34a' },
          { label: 'Positive',         value: `${Math.round((positiveCount/feedbacks.length)*100)}%`, icon: ThumbsUp, bg: '#f0fdf4', fg: '#16a34a' },
          { label: 'Pending Action',   value: pendingCount,     icon: AlertCircle,   bg: '#fef2f2', fg: '#dc2626' },
        ].map(({ label, value, icon: Icon, bg, fg }) => (
          <div key={label} style={{ ...card, padding: 16 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
              <Icon size={15} color={fg} />
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a' }}>{value}</div>
            <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* List view */}
      {view === 'list' && (
        <>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
              <input placeholder="Search feedback…" value={search} onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', paddingLeft: 30, paddingRight: 12, paddingTop: 9, paddingBottom: 9, background: '#fff', border: '1.5px solid #eee', borderRadius: 9, fontSize: 16, outline: 'none', color: '#1a1a1a' }}
              />
            </div>
            {['All', 'Reviewed', 'Pending Action', 'Under Review'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: '7px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600, border: '1.5px solid', cursor: 'pointer', background: statusFilter === s ? G : '#fff', color: statusFilter === s ? '#fff' : '#666', borderColor: statusFilter === s ? G : '#eee', whiteSpace: 'nowrap' }}>{s}</button>
            ))}
            {['All', 'positive', 'neutral', 'negative'].map(s => (
              <button key={s} onClick={() => setSentimentFilter(s)} style={{ padding: '7px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600, border: '1.5px solid', cursor: 'pointer', textTransform: 'capitalize', background: sentimentFilter === s ? '#1a1a1a' : '#fff', color: sentimentFilter === s ? '#fff' : '#666', borderColor: sentimentFilter === s ? '#1a1a1a' : '#eee' }}>{s}</button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filtered.map(f => {
              const ss = STATUS_STYLE[f.status] || STATUS_STYLE['Under Review'];
              const sv = SENTIMENT_STYLE[f.sentiment] || SENTIMENT_STYLE['neutral'];
              const SIcon = ss.icon;
              const SentIcon = sv.icon;
              return (
                <div key={f.id} style={{ ...card, padding: 22 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 9, background: 'rgba(213,170,91,0.12)', color: G, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, border: '1px solid rgba(213,170,91,0.2)', flexShrink: 0 }}>{f.startup[0]}</div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{f.startup}</div>
                        <div style={{ fontSize: 11, color: '#888' }}>{f.program} · {f.date}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      <StarRating value={f.rating} readOnly />
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: sv.bg, color: sv.color, border: `1px solid ${sv.color}22`, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <SentIcon size={9} />{sv.label}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <SIcon size={9} />{f.status}
                      </span>
                    </div>
                  </div>

                  <div style={{ fontSize: 11, color: G, fontWeight: 600, marginBottom: 6 }}>{f.category}</div>
                  <p style={{ margin: '0 0 12px', color: '#555', fontSize: 13, lineHeight: 1.6 }}>{f.text}</p>

                  {f.actionTaken && (
                    <div style={{ padding: '10px 14px', background: '#f0fdf4', borderRadius: 9, border: '1px solid #bbf7d0', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <CheckCircle2 size={13} color="#16a34a" style={{ flexShrink: 0, marginTop: 1 }} />
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', marginBottom: 2 }}>Action Taken · {f.reviewer}</div>
                        <div style={{ fontSize: 12, color: '#166534' }}>{f.actionTaken}</div>
                      </div>
                    </div>
                  )}

                  {!f.actionTaken && f.status === 'Pending Action' && (
                    <div style={{ padding: '10px 14px', background: '#fef2f2', borderRadius: 9, border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <AlertCircle size={13} color="#dc2626" />
                      <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 600 }}>Action required — no response yet</span>
                      <button style={{ marginLeft: 'auto', padding: '4px 10px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>Respond</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Analytics view */}
      {view === 'analytics' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {/* Rating distribution */}
          <div style={{ ...card, padding: 22 }}>
            <h3 style={{ margin: '0 0 18px', color: '#1a1a1a', fontSize: 14, fontWeight: 600 }}>Rating Distribution</h3>
            {[5, 4, 3, 2, 1].map(r => {
              const count = feedbacks.filter(f => f.rating === r).length;
              const pct = Math.round((count / feedbacks.length) * 100);
              return (
                <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, width: 60, flexShrink: 0 }}>
                    <Star size={11} style={{ fill: G, color: G }} />
                    <span style={{ fontSize: 12, color: '#555', fontWeight: 600 }}>{r}</span>
                  </div>
                  <div style={{ flex: 1, height: 8, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: r >= 4 ? '#16a34a' : r === 3 ? G : '#dc2626', borderRadius: 4 }} />
                  </div>
                  <span style={{ fontSize: 11, color: '#888', width: 24, textAlign: 'right' }}>{count}</span>
                </div>
              );
            })}
          </div>

          {/* Sentiment pie */}
          <div style={{ ...card, padding: 22 }}>
            <h3 style={{ margin: '0 0 18px', color: '#1a1a1a', fontSize: 14, fontWeight: 600 }}>Sentiment Breakdown</h3>
            {['positive', 'neutral', 'negative'].map(s => {
              const sv = SENTIMENT_STYLE[s];
              const count = feedbacks.filter(f => f.sentiment === s).length;
              const pct = Math.round((count / feedbacks.length) * 100);
              const SIcon = sv.icon;
              return (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 7, background: sv.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <SIcon size={13} color={sv.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: '#555', textTransform: 'capitalize', fontWeight: 600 }}>{s}</span>
                      <span style={{ fontSize: 12, color: sv.color, fontWeight: 700 }}>{pct}% ({count})</span>
                    </div>
                    <div style={{ height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: sv.color, borderRadius: 3 }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Category breakdown */}
          <div style={{ ...card, padding: 22, gridColumn: 'span 1' }}>
            <h3 style={{ margin: '0 0 18px', color: '#1a1a1a', fontSize: 14, fontWeight: 600 }}>Feedback by Category</h3>
            {CATEGORIES.filter(c => feedbacks.some(f => f.category === c)).map(c => {
              const count = feedbacks.filter(f => f.category === c).length;
              const avg = feedbacks.filter(f => f.category === c).reduce((s, f) => s + f.rating, 0) / count;
              return (
                <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 11, color: '#555', flex: 1 }}>{c}</span>
                  <span style={{ fontSize: 11, color: G, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}><Star size={9} style={{ fill: G, color: G }} />{avg.toFixed(1)}</span>
                  <span style={{ fontSize: 10, color: '#aaa', width: 20, textAlign: 'right' }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Submit view */}
      {view === 'submit' && !submitted && (
        <div style={{ ...card, padding: 32, maxWidth: 640, margin: '0 auto' }}>
          <h2 style={{ margin: '0 0 6px', color: '#1a1a1a', fontSize: 18, fontWeight: 700 }}>Submit Feedback</h2>
          <p style={{ margin: '0 0 24px', color: '#888', fontSize: 13 }}>Share your experience with OpenI programs, mentoring and support</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <FormField label="Startup Name">
              <input value={form.startup} onChange={e => setForm(p => ({ ...p, startup: e.target.value }))} placeholder="Your startup name" />
            </FormField>
            <FormField label="Program Name">
              <input value={form.program} onChange={e => setForm(p => ({ ...p, program: e.target.value }))} placeholder="e.g. OpenI AI Challenge 2025" />
            </FormField>
            <FormField label="Feedback Category">
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </FormField>
            <div>
              <label style={{ display: 'block', color: '#444', fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Rating</label>
              <StarRating value={form.rating} onChange={r => setForm(p => ({ ...p, rating: r }))} />
            </div>
            <FormField label="Your Feedback">
              <textarea rows={5} value={form.text} onChange={e => setForm(p => ({ ...p, text: e.target.value }))} placeholder="Share your experience, suggestions or concerns in detail…" />
            </FormField>
            <button
              onClick={submitFeedback}
              disabled={!form.startup || !form.program || form.rating === 0 || !form.text.trim()}
              style={{
                padding: '12px 0', background: (form.startup && form.program && form.rating > 0 && form.text.trim()) ? G : '#e0e0e0',
                color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: (form.startup && form.program && form.rating > 0 && form.text.trim()) ? '0 2px 12px rgba(213,170,91,0.35)' : 'none',
              }}
            >
              <Send size={14} /> Submit Feedback
            </button>
          </div>
        </div>
      )}

      {view === 'submit' && submitted && (
        <div style={{ ...card, padding: 48, textAlign: 'center', maxWidth: 480, margin: '0 auto' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#f0fdf4', border: '2px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <CheckCircle2 size={24} color="#16a34a" />
          </div>
          <h2 style={{ margin: '0 0 8px', color: '#1a1a1a', fontSize: 18, fontWeight: 700 }}>Feedback Submitted!</h2>
          <p style={{ margin: '0 0 20px', color: '#888', fontSize: 13 }}>Thank you for your feedback. The OpenI team will review and respond within 3 working days.</p>
          <button onClick={() => { setView('list'); setSubmitted(false); setForm({ startup: '', program: '', category: CATEGORIES[0], rating: 0, text: '' }); }}
            style={{ padding: '9px 22px', background: G, color: '#fff', border: 'none', borderRadius: 9, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
            View All Feedback
          </button>
        </div>
      )}
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', color: '#444', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>{label}</label>
      {children.type === 'input' || children.type === 'select' || children.type === 'textarea'
        ? <children.type {...children.props} style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', background: '#fafafa', border: '1.5px solid #e0e0e0', borderRadius: 9, fontSize: 13, outline: 'none', color: '#1a1a1a', fontFamily: 'inherit', resize: children.type === 'textarea' ? 'vertical' : undefined, transition: 'border-color 0.15s', ...(children.props.style || {}) }}
          onFocus={e => e.target.style.borderColor = G}
          onBlur={e => e.target.style.borderColor = '#e0e0e0'}
        />
        : children
      }
    </div>
  );
}
