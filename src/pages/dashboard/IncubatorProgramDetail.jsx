import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { incubatorAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PortfolioHealthTab from '../../components/portfolio/PortfolioHealthTab';
import CollaboratorsPanel from '../../components/CollaboratorsPanel';
import ApplicantInvitePanel from '../../components/ApplicantInvitePanel';
import ReviewPanel from '../../components/ReviewPanel';
import {
  Loader2, ChevronLeft, Plus, X, CheckCircle, Trash2, Calendar,
  Users, Target, GraduationCap, Clock, BarChart3
} from 'lucide-react';
import toast from 'react-hot-toast';

const G = '#D0A848';
const card = { background: '#fff', border: '1px solid #eee', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' };

const PIPELINE_STAGES = [
  { key: 'applied',    label: 'Applied',    color: '#6b7280', bg: '#f3f4f6' },
  { key: 'screening',  label: 'Screening',  color: '#3b82f6', bg: '#eff6ff' },
  { key: 'interview',  label: 'Interview',  color: '#8b5cf6', bg: '#faf5ff' },
  { key: 'selected',   label: 'Selected',   color: '#16a34a', bg: '#f0fdf4' },
  { key: 'rejected',   label: 'Rejected',   color: '#dc2626', bg: '#fee2e2' },
  { key: 'graduated',  label: 'Graduated',  color: '#ca8a04', bg: '#fef3c7' },
];

const STATUS_COLORS = {
  draft:      { bg: '#f3f4f6', color: '#6b7280', label: 'Draft' },
  accepting:  { bg: '#eff6ff', color: '#2563eb', label: 'Accepting' },
  active:     { bg: '#f0fdf4', color: '#16a34a', label: 'Active' },
  completed:  { bg: '#fef3c7', color: '#ca8a04', label: 'Completed' },
  cancelled:  { bg: '#fee2e2', color: '#dc2626', label: 'Cancelled' },
};

export default function IncubatorProgramDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [program, setProgram] = useState(null);
  const [startups, setStartups] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [mentorPool, setMentorPool] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pipeline');

  const [showAddStartup, setShowAddStartup] = useState(false);
  const [startupForm, setStartupForm] = useState({ startup_name: '', application_status: 'applied', cohort_label: '', notes: '' });

  const [showAddAssign, setShowAddAssign] = useState(false);
  const [assignForm, setAssignForm] = useState({ program_startup_id: '', mentor_pool_id: '', notes: '' });

  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional refetch on id change; `load` is a stable inline closure
  useEffect(() => { load(); }, [id]);

  const load = async () => {
    try {
      const [p, s, m, mp, a] = await Promise.all([
        incubatorAPI.getProgram(id),
        incubatorAPI.listProgramStartups(id),
        incubatorAPI.listMilestones(id),
        incubatorAPI.listMentorPool(),
        incubatorAPI.listAssignments(id),
      ]);
      setProgram(p);
      setStartups(s);
      setMilestones(m);
      setMentorPool(mp);
      setAssignments(a);
    } catch (err) { toast.error(err.message || 'Failed to load program'); }
    finally { setLoading(false); }
  };

  const moveStartup = async (sid, newStatus) => {
    try {
      await incubatorAPI.updateProgramStartup(id, sid, { application_status: newStatus });
      toast.success(`Moved to ${newStatus}`);
      load();
    } catch (err) { toast.error(err.message || 'Failed'); }
  };

  const handleAddStartup = async (e) => {
    e.preventDefault();
    if (!startupForm.startup_name) return toast.error('Startup name required');
    try {
      await incubatorAPI.addProgramStartup(id, startupForm);
      toast.success('Startup added to pipeline');
      setShowAddStartup(false);
      setStartupForm({ startup_name: '', application_status: 'applied', cohort_label: '', notes: '' });
      load();
    } catch (err) { toast.error(err.message || 'Failed'); }
  };

  const removeStartup = async (sid) => {
    if (!window.confirm('Remove this startup from the program?')) return;
    try {
      await incubatorAPI.removeProgramStartup(id, sid);
      toast.success('Removed');
      load();
    } catch (err) { toast.error(err.message || 'Failed'); }
  };

  const toggleMilestone = async (mid, currentStatus) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    try {
      await incubatorAPI.updateMilestone(id, mid, { status: newStatus });
      load();
    } catch (err) { toast.error(err.message || 'Failed'); }
  };

  const handleAddAssign = async (e) => {
    e.preventDefault();
    if (!assignForm.program_startup_id || !assignForm.mentor_pool_id) return toast.error('Pick startup + mentor');
    try {
      await incubatorAPI.createAssignment(id, assignForm);
      toast.success('Mentor assigned');
      setShowAddAssign(false);
      setAssignForm({ program_startup_id: '', mentor_pool_id: '', notes: '' });
      load();
    } catch (err) { toast.error(err.message || 'Failed'); }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Loader2 size={28} className="animate-spin" style={{ color: G }} /></div>;
  if (!program) return <div style={{ padding: 24, textAlign: 'center', color: '#999' }}>Program not found</div>;

  const sc = STATUS_COLORS[program.status] || STATUS_COLORS.draft;
  const milestoneDone = milestones.filter(m => m.status === 'completed').length;
  const milestonePct = milestones.length > 0 ? Math.round((milestoneDone / milestones.length) * 100) : 0;

  return (
    <div style={{ padding: 24, maxWidth: 1300, margin: '0 auto' }}>
      {/* Back button */}
      <button onClick={() => navigate('/dashboard/incubator/programs')}
        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', background: 'none', border: 'none', color: '#666', fontSize: 12, cursor: 'pointer', marginBottom: 12 }}>
        <ChevronLeft size={14} /> Back to Programs
      </button>

      {/* Header */}
      <div id="tour-page-incubator-program-detail" style={{ ...card, padding: 22, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <h1 style={{ fontSize: 21, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>{program.name}</h1>
              <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: sc.bg, color: sc.color }}>
                {sc.label}
              </span>
            </div>
            <p style={{ fontSize: 13, color: '#666', margin: '0 0 10px' }}>{program.description || 'No description'}</p>
            {(program.focus_sectors || []).length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {program.focus_sectors.map(s => (
                  <span key={s} style={{ fontSize: 10, padding: '3px 9px', borderRadius: 20, background: '#fff8ec', color: G }}>{s}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginTop: 14, paddingTop: 14, borderTop: '1px solid #f5f5f5' }}>
          <Stat icon={Users} label="Pipeline" value={startups.length} color="#3b82f6" />
          <Stat icon={CheckCircle} label="Selected" value={startups.filter(s => s.application_status === 'selected').length} color="#16a34a" />
          <Stat icon={GraduationCap} label="Graduated" value={startups.filter(s => s.application_status === 'graduated').length} color="#ca8a04" />
          <Stat icon={Target} label="Total Seats" value={program.total_seats || '—'} color={G} />
          <Stat icon={Calendar} label="Duration" value={program.duration_months ? `${program.duration_months}mo` : '—'} color="#8b5cf6" />
        </div>
      </div>

      {/* Phase 40: Program team */}
      <div style={{ marginBottom: 16 }}>
        <CollaboratorsPanel entityType="incubator_program" entityId={program.id} title="Program Team" />
      </div>

      {/* Cross-Ecosystem Phase F: invite applicants to this program */}
      <div style={{ marginBottom: 16 }}>
        <ApplicantInvitePanel entityType="incubator" entityId={program.id} entityLabel={program.name} user={user} />
      </div>

      {/* Phase 40 (P8): Reviews */}
      <div style={{ marginBottom: 16 }}>
        <ReviewPanel entityType="incubator_program" entityId={program.id} title="Program Reviews" />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 14, borderBottom: '1px solid #eee', flexWrap: 'wrap' }}>
        {['pipeline', 'milestones', 'mentors', 'health'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '10px 18px', background: 'none', border: 'none', borderBottom: tab === t ? `2px solid ${G}` : '2px solid transparent', color: tab === t ? '#1a1a1a' : '#888', fontSize: 13, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: 5 }}>
            {t === 'health' && <BarChart3 size={13} />}
            {t === 'health' ? 'Portfolio Health' : t}
            {t === 'pipeline' && ` (${startups.length})`}
            {t === 'milestones' && ` (${milestoneDone}/${milestones.length})`}
            {t === 'mentors' && ` (${assignments.length})`}
          </button>
        ))}
      </div>

      {/* Pipeline tab — kanban */}
      {tab === 'pipeline' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button onClick={() => setShowAddStartup(true)}
              style={{ padding: '8px 14px', background: G, color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Plus size={14} /> Add Startup
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
            {PIPELINE_STAGES.map(stage => {
              const stageStartups = startups.filter(s => s.application_status === stage.key);
              return (
                <div key={stage.key} style={{ ...card, padding: 12, minHeight: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, paddingBottom: 8, borderBottom: `2px solid ${stage.color}` }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: stage.color, textTransform: 'uppercase' }}>{stage.label}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: stage.bg, color: stage.color, marginLeft: 'auto' }}>{stageStartups.length}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {stageStartups.map(s => (
                      <div key={s.id} style={{ padding: 10, background: '#fafafa', borderRadius: 8, border: '1px solid #f0f0f0' }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a', marginBottom: 3 }}>{s.startup_name}</div>
                        {s.cohort_label && <div style={{ fontSize: 9, color: '#888', marginBottom: 4 }}>{s.cohort_label}</div>}
                        {s.evaluation_score && <div style={{ fontSize: 9, color: G, fontWeight: 600, marginBottom: 4 }}>★ {s.evaluation_score}/5</div>}
                        {s.notes && <div style={{ fontSize: 10, color: '#888', marginBottom: 6, fontStyle: 'italic' }}>{s.notes.substring(0, 60)}{s.notes.length > 60 ? '...' : ''}</div>}
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          <select value={s.application_status} onChange={e => moveStartup(s.id, e.target.value)}
                            style={{ flex: 1, fontSize: 16, padding: '3px 5px', border: '1px solid #ddd', borderRadius: 4, background: '#fff' }}>
                            {PIPELINE_STAGES.map(st => <option key={st.key} value={st.key}>{st.label}</option>)}
                            <option value="dropped">Dropped</option>
                          </select>
                          <button onClick={() => removeStartup(s.id)}
                            style={{ padding: '3px 5px', background: 'none', border: '1px solid #fee', borderRadius: 4, cursor: 'pointer', color: '#dc2626' }}>
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {stageStartups.length === 0 && (
                      <div style={{ padding: 14, textAlign: 'center', fontSize: 10, color: '#bbb' }}>—</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Milestones tab */}
      {tab === 'milestones' && (
        <div style={{ ...card, padding: 18 }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#888', marginBottom: 6 }}>
              <span>Program Progress</span>
              <span>{milestoneDone}/{milestones.length} ({milestonePct}%)</span>
            </div>
            <div style={{ height: 8, background: '#f3f4f6', borderRadius: 4 }}>
              <div style={{ height: '100%', width: `${milestonePct}%`, background: G, borderRadius: 4, transition: 'width 0.3s' }} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {milestones.map(m => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: m.status === 'completed' ? '#f0fdf4' : '#fafafa', borderRadius: 8, border: `1px solid ${m.status === 'completed' ? '#bbf7d0' : '#f0f0f0'}` }}>
                <button onClick={() => toggleMilestone(m.id, m.status)}
                  style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${m.status === 'completed' ? '#16a34a' : '#ddd'}`, background: m.status === 'completed' ? '#16a34a' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {m.status === 'completed' && <CheckCircle size={14} style={{ color: '#fff' }} />}
                </button>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', textDecoration: m.status === 'completed' ? 'line-through' : 'none' }}>{m.title}</div>
                  {m.description && <div style={{ fontSize: 11, color: '#888' }}>{m.description}</div>}
                  {m.due_date && <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}><Clock size={10} style={{ verticalAlign: -1, marginRight: 3 }} />{new Date(m.due_date).toLocaleDateString()}</div>}
                </div>
              </div>
            ))}
            {milestones.length === 0 && (
              <div style={{ padding: 30, textAlign: 'center', fontSize: 13, color: '#999' }}>No milestones yet</div>
            )}
          </div>
        </div>
      )}

      {/* Mentors tab — assignments */}
      {tab === 'mentors' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button onClick={() => setShowAddAssign(true)}
              style={{ padding: '8px 14px', background: G, color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Plus size={14} /> Assign Mentor
            </button>
          </div>
          <div style={{ ...card, padding: 18 }}>
            {assignments.length === 0 ? (
              <div style={{ padding: 30, textAlign: 'center', color: '#999', fontSize: 13 }}>No mentor assignments yet</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {assignments.map(a => (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 12, background: '#fafafa', borderRadius: 8, border: '1px solid #f0f0f0' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#fff8ec', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Users size={16} style={{ color: G }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{a.pool_mentor_name || a.mentor_name}</div>
                      <div style={{ fontSize: 11, color: '#888' }}>→ {a.startup_name} · {a.sessions_completed} sessions completed</div>
                      {(a.expertise || []).length > 0 && (
                        <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                          {a.expertise.slice(0, 4).map(e => <span key={e} style={{ fontSize: 9, padding: '2px 6px', borderRadius: 20, background: '#eff6ff', color: '#2563eb' }}>{e}</span>)}
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 20, background: a.status === 'active' ? '#f0fdf4' : '#f3f4f6', color: a.status === 'active' ? '#16a34a' : '#6b7280' }}>{a.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Portfolio Health tab (Phase 16B.4) */}
      {tab === 'health' && (
        <PortfolioHealthTab
          owner="incubator"
          parentId={parseInt(id, 10)}
          pipelineStartups={startups}
        />
      )}

      {/* Add startup modal */}
      {showAddStartup && (
        <Modal title="Add Startup to Pipeline" onClose={() => setShowAddStartup(false)}>
          <form onSubmit={handleAddStartup} style={{ display: 'grid', gap: 12 }}>
            <div>
              <label style={lbl}>Startup Name *</label>
              <input required value={startupForm.startup_name} onChange={e => setStartupForm({ ...startupForm, startup_name: e.target.value })} style={inp} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
              <div>
                <label style={lbl}>Initial Status</label>
                <select value={startupForm.application_status} onChange={e => setStartupForm({ ...startupForm, application_status: e.target.value })} style={inp}>
                  {PIPELINE_STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Cohort Label</label>
                <input value={startupForm.cohort_label} onChange={e => setStartupForm({ ...startupForm, cohort_label: e.target.value })} placeholder="Cohort A" style={inp} />
              </div>
            </div>
            <div>
              <label style={lbl}>Notes</label>
              <textarea rows={3} value={startupForm.notes} onChange={e => setStartupForm({ ...startupForm, notes: e.target.value })} style={{ ...inp, resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 6 }}>
              <button type="button" onClick={() => setShowAddStartup(false)} style={btnSecondary}>Cancel</button>
              <button type="submit" style={btnPrimary}>Add</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add assignment modal */}
      {showAddAssign && (
        <Modal title="Assign Mentor to Startup" onClose={() => setShowAddAssign(false)}>
          <form onSubmit={handleAddAssign} style={{ display: 'grid', gap: 12 }}>
            <div>
              <label style={lbl}>Startup *</label>
              <select required value={assignForm.program_startup_id} onChange={e => setAssignForm({ ...assignForm, program_startup_id: e.target.value })} style={inp}>
                <option value="">— Select startup —</option>
                {startups.map(s => <option key={s.id} value={s.id}>{s.startup_name} ({s.application_status})</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Mentor *</label>
              <select required value={assignForm.mentor_pool_id} onChange={e => setAssignForm({ ...assignForm, mentor_pool_id: e.target.value })} style={inp}>
                <option value="">— Select mentor —</option>
                {mentorPool.filter(m => m.is_active).map(m => <option key={m.id} value={m.id}>{m.mentor_name}</option>)}
              </select>
              {mentorPool.length === 0 && <div style={{ fontSize: 11, color: '#dc2626', marginTop: 4 }}>No mentors in pool. Add some via the Mentor Pool page first.</div>}
            </div>
            <div>
              <label style={lbl}>Notes</label>
              <textarea rows={2} value={assignForm.notes} onChange={e => setAssignForm({ ...assignForm, notes: e.target.value })} style={{ ...inp, resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 6 }}>
              <button type="button" onClick={() => setShowAddAssign(false)} style={btnSecondary}>Cancel</button>
              <button type="submit" style={btnPrimary}>Assign</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={16} style={{ color }} />
      </div>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>{value}</div>
        <div style={{ fontSize: 9, color: '#999', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      </div>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
      <div style={{ ...card, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto', padding: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>{title}</h2>
          <X size={20} style={{ cursor: 'pointer', color: '#888' }} onClick={onClose} />
        </div>
        {children}
      </div>
    </div>
  );
}

const lbl = { display: 'block', fontSize: 11, fontWeight: 600, color: '#666', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 };
const inp = { width: '100%', padding: '9px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 16, outline: 'none', boxSizing: 'border-box' };
const btnPrimary = { padding: '9px 18px', background: G, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' };
const btnSecondary = { padding: '9px 16px', background: '#fff', border: '1px solid #ddd', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#666', cursor: 'pointer' };
