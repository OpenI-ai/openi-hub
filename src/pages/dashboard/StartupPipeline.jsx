import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { startupAPI } from '../../services/api';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import { CheckCircle2, Circle,
  ChevronRight, Star, Filter,
  Search, Award, Users, Zap, FileText,
} from 'lucide-react';

const G = '#D5AA5B';
const GH = '#C9983F';

const card = {
  background: '#ffffff',
  border: '1px solid #eeeeee',
  borderRadius: 14,
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
};

// Pipeline stages per RFP sec 1.5
const STAGES = [
  { id: 'application',  label: 'Application',  icon: FileText },
  { id: 'screening',    label: 'Screening',     icon: Filter },
  { id: 'evaluation',   label: 'Evaluation',    icon: Star },
  { id: 'selection',    label: 'Selection',     icon: CheckCircle2 },
  { id: 'onboarding',   label: 'Onboarding',    icon: Users },
  { id: 'incubation',   label: 'Incubation',    icon: Zap },
  { id: 'graduation',   label: 'Graduation',    icon: Award },
];

// Pipeline stage mapping from backend pipeline_stage values to stage IDs
const PIPELINE_STAGE_MAP = {
  application: 'application',
  screening: 'screening',
  evaluation: 'evaluation',
  selection: 'selection',
  onboarding: 'onboarding',
  incubation: 'incubation',
  graduation: 'graduation',
  // Also handle capitalised or alternate forms from backend
  Application: 'application',
  Screening: 'screening',
  Evaluation: 'evaluation',
  Selection: 'selection',
  Onboarding: 'onboarding',
  Incubation: 'incubation',
  Graduation: 'graduation',
  Applied: 'application',
  Active: 'incubation',
  Incubated: 'incubation',
};

const STATUS_STYLE = {
  Active:     { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  'On Hold':  { bg: '#fff7ed', color: '#ea580c', border: '#fed7aa' },
  Pending:    { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' },
  'In Review':{ bg: '#fff8ec', color: G,         border: 'rgba(213,170,91,0.4)' },
};

const STAGE_IDX = Object.fromEntries(STAGES.map((s, i) => [s.id, i]));

export default function StartupPipeline() {
  const [view, setView]         = useState('pipeline'); // 'pipeline' | 'list'
  const [selected, setSelected] = useState(null);
  const [search, setSearch]     = useState('');
  const [stageFilter, setStageFilter] = useState('All');
  const [startups, setStartups] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    startupAPI.list()
      .then(data => {
        const rows = data.startups || data || [];
        const normalized = rows.map(s => ({
          id: s.id,
          name: s.company_name || s.name || '',
          logo_url: s.logo_url || null,
          sector: s.sector || '',
          score: s.score ? (s.score / 20) : null, // convert 0-100 to 0-5 for display
          stage: PIPELINE_STAGE_MAP[s.pipeline_stage] || PIPELINE_STAGE_MAP[s.status] || 'application',
          stageDate: s.updated_at ? new Date(s.updated_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
          status: s.status || 'Pending',
          program: s.openi_cluster || 'OpenI Program',
          pm: 'Assigned',
          journey: STAGES.map(st => ({
            stage: st.id,
            date: '',
            note: '',
            done: STAGES.findIndex(x => x.id === st.id) <= STAGES.findIndex(x => x.id === (PIPELINE_STAGE_MAP[s.pipeline_stage] || PIPELINE_STAGE_MAP[s.status] || 'application')),
          })),
          milestones: [],
        }));
        setStartups(normalized);
      })
      .catch(err => { toast.error(err.message || 'Failed to load pipeline'); setStartups([]); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSkeleton type="card" />;

  const filtered = startups.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
                        s.sector.toLowerCase().includes(search.toLowerCase());
    const matchStage = stageFilter === 'All' || s.stage === stageFilter;
    return matchSearch && matchStage;
  });

  // Group startups by stage for kanban view
  const byStage = STAGES.reduce((acc, s) => {
    acc[s.id] = filtered.filter(st => st.stage === s.id);
    return acc;
  }, {});

  if (selected) {
    return <StartupJourney startup={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div style={{ padding: 28, background: '#f5f5f5', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, color: '#1a1a1a', fontSize: 22, fontWeight: 700 }}>Startup Pipeline</h1>
          <p style={{ margin: '4px 0 0', color: '#888', fontSize: 13 }}>Track each startup's journey from Application to Graduation</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
            <input placeholder="Search startups…" value={search} onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 28, paddingRight: 12, paddingTop: 8, paddingBottom: 8, background: '#fff', border: '1.5px solid #eee', borderRadius: 9, fontSize: 12, outline: 'none', color: '#1a1a1a', width: 180 }}
            />
          </div>
          {/* View toggle */}
          <div style={{ display: 'flex', background: '#fff', border: '1px solid #eee', borderRadius: 9, padding: 3, gap: 2 }}>
            {['pipeline', 'list'].map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: '6px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600, textTransform: 'capitalize',
                border: 'none', cursor: 'pointer',
                background: view === v ? G : 'transparent',
                color: view === v ? '#fff' : '#666',
              }}>{v}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Stage summary pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 22, flexWrap: 'wrap' }}>
        <button onClick={() => setStageFilter('All')} style={{
          padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, border: '1.5px solid', cursor: 'pointer',
          background: stageFilter === 'All' ? G : '#fff', color: stageFilter === 'All' ? '#fff' : '#555', borderColor: stageFilter === 'All' ? G : '#eee',
        }}>All ({startups.length})</button>
        {STAGES.map(s => {
          const count = startups.filter(st => st.stage === s.id).length;
          return count > 0 ? (
            <button key={s.id} onClick={() => setStageFilter(s.id === stageFilter ? 'All' : s.id)} style={{
              padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, border: '1.5px solid', cursor: 'pointer',
              background: stageFilter === s.id ? G : '#fff', color: stageFilter === s.id ? '#fff' : '#555', borderColor: stageFilter === s.id ? G : '#eee',
            }}>{s.label} ({count})</button>
          ) : null;
        })}
      </div>

      {/* Pipeline (Kanban) view */}
      {view === 'pipeline' && (
        <div style={{ overflowX: 'auto', paddingBottom: 12 }}>
          <div style={{ display: 'flex', gap: 14, minWidth: 'max-content' }}>
            {STAGES.map(stage => {
              const items = byStage[stage.id] || [];
              const Icon = stage.icon;
              return (
                <div key={stage.id} style={{ width: 210, flexShrink: 0 }}>
                  {/* Stage header */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '8px 12px', background: '#fff',
                    border: '1px solid #eee', borderRadius: 10, marginBottom: 10,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  }}>
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(213,170,91,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={12} color={G} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a', flex: 1 }}>{stage.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: G }}>{items.length}</span>
                  </div>
                  {/* Cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {items.map(s => {
                      const ss = STATUS_STYLE[s.status] || STATUS_STYLE['Pending'];
                      return (
                        <div key={s.id}
                          onClick={() => setSelected(s)}
                          style={{ ...card, padding: 14, cursor: 'pointer', transition: 'box-shadow 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.1)'}
                          onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            {s.logo_url ? (
                              <img
                                src={s.logo_url}
                                alt=""
                                style={{ width: 28, height: 28, borderRadius: 7, objectFit: 'contain', background: '#fafafa', border: '1px solid #eee', flexShrink: 0 }}
                                onError={(e) => {
                                  const fallback = document.createElement('div');
                                  fallback.textContent = (s.name || '?').charAt(0).toUpperCase();
                                  fallback.style.cssText = `width:28px;height:28px;border-radius:7px;background:rgba(213,170,91,0.12);color:${G};font-weight:700;font-size:12px;display:flex;align-items:center;justify-content:center;border:1px solid rgba(213,170,91,0.2);flex-shrink:0;`;
                                  e.target.replaceWith(fallback);
                                }}
                              />
                            ) : (
                              <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(213,170,91,0.12)', color: G, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, border: '1px solid rgba(213,170,91,0.2)', flexShrink: 0 }}>{(s.name || '?').charAt(0).toUpperCase()}</div>
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                              <div style={{ fontSize: 10, color: '#888' }}>{s.sector}</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: ss.bg, color: ss.color, border: `1px solid ${ss.border}` }}>{s.status}</span>
                            {s.score && (
                              <span style={{ fontSize: 11, color: G, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
                                <Star size={9} style={{ fill: G, color: G }} /> {s.score}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 10, color: '#bbb', marginTop: 7 }}>{s.stageDate}</div>
                        </div>
                      );
                    })}
                    {items.length === 0 && (
                      <div style={{ padding: '20px 12px', textAlign: 'center', color: '#ddd', fontSize: 11 }}>No startups</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* List view */}
      {view === 'list' && (
        <div style={{ ...card, overflow: 'hidden' }}>
          <div style={{ padding: '14px 22px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0, color: '#1a1a1a', fontSize: 14, fontWeight: 600 }}>All Startups ({filtered.length})</h3>
          </div>
          {filtered.map((s, i) => {
            const ss = STATUS_STYLE[s.status] || STATUS_STYLE['Pending'];
            const currentStageIdx = STAGE_IDX[s.stage];
            return (
              <div key={s.id}
                onClick={() => setSelected(s)}
                style={{ padding: '14px 22px', borderBottom: i < filtered.length - 1 ? '1px solid #f5f5f5' : 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                  {s.logo_url ? (
                    <img
                      src={s.logo_url}
                      alt=""
                      style={{ width: 36, height: 36, borderRadius: 9, objectFit: 'contain', background: '#fafafa', border: '1px solid #eee', flexShrink: 0 }}
                      onError={(e) => {
                        const fallback = document.createElement('div');
                        fallback.textContent = (s.name || '?').charAt(0).toUpperCase();
                        fallback.style.cssText = `width:36px;height:36px;border-radius:9px;background:rgba(213,170,91,0.12);color:${G};font-weight:700;font-size:14px;display:flex;align-items:center;justify-content:center;border:1px solid rgba(213,170,91,0.2);flex-shrink:0;`;
                        e.target.replaceWith(fallback);
                      }}
                    />
                  ) : (
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(213,170,91,0.12)', color: G, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, border: '1px solid rgba(213,170,91,0.2)', flexShrink: 0 }}>{(s.name || '?').charAt(0).toUpperCase()}</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#1a1a1a', fontSize: 13, fontWeight: 600 }}>{s.name}</div>
                    <div style={{ color: '#888', fontSize: 11 }}>{s.sector} · {s.program}</div>
                  </div>
                  {/* Mini pipeline progress */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'nowrap' }}>
                    {STAGES.map((stage, idx) => {
                      const done = idx <= currentStageIdx;
                      const current = idx === currentStageIdx;
                      return (
                        <div key={stage.id} style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{
                            width: current ? 22 : 16, height: current ? 22 : 16,
                            borderRadius: '50%',
                            background: done ? (current ? G : '#16a34a') : '#f0f0f0',
                            border: `2px solid ${done ? (current ? G : '#16a34a') : '#e0e0e0'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.2s',
                          }}>
                            {done && !current && <CheckCircle2 size={8} color="#fff" />}
                            {current && <Circle size={8} color="#fff" />}
                          </div>
                          {idx < STAGES.length - 1 && (
                            <div style={{ width: 8, height: 2, background: done && idx < currentStageIdx ? '#16a34a' : '#e0e0e0' }} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`, whiteSpace: 'nowrap' }}>{s.status}</span>
                  {s.score && <span style={{ fontSize: 12, color: G, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3, width: 36, flexShrink: 0 }}><Star size={10} style={{ fill: G, color: G }} />{s.score}</span>}
                  <ChevronRight size={14} color="#ccc" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StartupJourney({ startup: s, onBack }) {
  const [tab, setTab] = useState('journey');
  const ss = STATUS_STYLE[s.status] || STATUS_STYLE['Pending'];
  const currentStageIdx = STAGE_IDX[s.stage];

  return (
    <div style={{ padding: 28, maxWidth: 1000, background: '#f5f5f5', minHeight: '100%' }}>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, color: G, fontSize: 13, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 20, padding: 0 }}>
        ← Pipeline
      </button>

      {/* Startup header */}
      <div style={{ ...card, padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(213,170,91,0.12)', color: G, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 20, border: '1.5px solid rgba(213,170,91,0.25)', flexShrink: 0 }}>{s.name[0]}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
              <h1 style={{ margin: 0, color: '#1a1a1a', fontSize: 20, fontWeight: 700 }}>{s.name}</h1>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: ss.bg, color: ss.color, border: `1px solid ${ss.border}` }}>{s.status}</span>
            </div>
            <div style={{ color: '#666', fontSize: 13 }}>{s.sector} · {s.program} · PM: {s.pm}</div>
          </div>
          {s.score && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: G, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Star size={18} style={{ fill: G, color: G }} />{s.score}
              </div>
              <div style={{ fontSize: 11, color: '#888' }}>OpenI Score</div>
            </div>
          )}
        </div>

        {/* Pipeline progress bar */}
        <div style={{ marginTop: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            {STAGES.map((stage, idx) => {
              const done = idx <= currentStageIdx;
              const current = idx === currentStageIdx;
              const Icon = stage.icon;
              return (
                <div key={stage.id} style={{ display: 'flex', alignItems: 'center', flex: idx < STAGES.length - 1 ? 1 : 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{
                      width: current ? 36 : 28, height: current ? 36 : 28,
                      borderRadius: '50%',
                      background: done ? (current ? G : '#16a34a') : '#f0f0f0',
                      border: `2px solid ${done ? (current ? G : '#16a34a') : '#e0e0e0'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: current ? `0 0 0 4px rgba(213,170,91,0.2)` : 'none',
                      transition: 'all 0.2s',
                      flexShrink: 0,
                    }}>
                      <Icon size={current ? 14 : 11} color={done ? '#fff' : '#ccc'} />
                    </div>
                    <span style={{ fontSize: 9, color: done ? (current ? G : '#16a34a') : '#bbb', fontWeight: current ? 700 : 500, whiteSpace: 'nowrap', textAlign: 'center' }}>{stage.label}</span>
                  </div>
                  {idx < STAGES.length - 1 && (
                    <div style={{ flex: 1, height: 3, background: idx < currentStageIdx ? '#16a34a' : '#f0f0f0', margin: '0 4px', marginBottom: 20, borderRadius: 2 }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#fff', border: '1px solid #eee', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {['journey', 'milestones'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '7px 18px', borderRadius: 7, fontSize: 12, fontWeight: 600, textTransform: 'capitalize',
            border: 'none', cursor: 'pointer',
            background: tab === t ? G : 'transparent',
            color: tab === t ? '#fff' : '#666',
          }}>{t}</button>
        ))}
      </div>

      {/* Journey timeline */}
      {tab === 'journey' && (
        <div style={{ ...card, padding: 24 }}>
          <h3 style={{ margin: '0 0 22px', color: '#1a1a1a', fontSize: 14, fontWeight: 600 }}>Startup Journey Timeline</h3>
          <div style={{ position: 'relative', paddingLeft: 28 }}>
            {/* Vertical line */}
            <div style={{ position: 'absolute', left: 10, top: 0, bottom: 0, width: 2, background: '#f0f0f0', borderRadius: 2 }} />
            {s.journey.map((item, i) => {
              const stage = STAGES.find(st => st.id === item.stage);
              const Icon = stage?.icon || Circle;
              return (
                <div key={i} style={{ position: 'relative', marginBottom: i < s.journey.length - 1 ? 28 : 0 }}>
                  {/* Dot */}
                  <div style={{
                    position: 'absolute', left: -23, top: 2,
                    width: 22, height: 22, borderRadius: '50%',
                    background: item.done ? (i === s.journey.filter(j => j.done).length - 1 ? G : '#16a34a') : '#f0f0f0',
                    border: `2px solid ${item.done ? (i === s.journey.filter(j => j.done).length - 1 ? G : '#16a34a') : '#e0e0e0'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={10} color={item.done ? '#fff' : '#ccc'} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: item.done ? '#1a1a1a' : '#aaa' }}>{stage?.label}</span>
                      <span style={{ fontSize: 11, color: '#888' }}>{item.date}</span>
                      {!item.done && <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 20, background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' }}>Upcoming</span>}
                    </div>
                    <p style={{ margin: 0, color: item.done ? '#555' : '#bbb', fontSize: 13, lineHeight: 1.5 }}>{item.note}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Milestones */}
      {tab === 'milestones' && (
        <div style={{ ...card, overflow: 'hidden' }}>
          <div style={{ padding: '16px 22px', borderBottom: '1px solid #eee' }}>
            <h3 style={{ margin: 0, color: '#1a1a1a', fontSize: 14, fontWeight: 600 }}>Key Milestones</h3>
          </div>
          {s.milestones.length === 0 ? (
            <div style={{ padding: 28, textAlign: 'center', color: '#aaa', fontSize: 13 }}>No milestones defined yet</div>
          ) : s.milestones.map((m, i) => (
            <div key={i} style={{ padding: '14px 22px', borderBottom: i < s.milestones.length - 1 ? '1px solid #f5f5f5' : 'none', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                background: m.done ? '#f0fdf4' : '#f8fafc',
                border: `2px solid ${m.done ? '#16a34a' : '#e2e8f0'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <CheckCircle2 size={14} color={m.done ? '#16a34a' : '#ccc'} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#1a1a1a', fontSize: 13, fontWeight: 500 }}>{m.name}</div>
                <div style={{ color: '#888', fontSize: 11, marginTop: 2 }}>{m.date} · {m.note}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 20, background: m.done ? '#f0fdf4' : '#f8fafc', color: m.done ? '#16a34a' : '#64748b', border: `1px solid ${m.done ? '#bbf7d0' : '#e2e8f0'}` }}>
                {m.done ? 'Completed' : 'Pending'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
