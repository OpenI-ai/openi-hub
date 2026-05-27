import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { acceleratorAPI } from '../../services/api';
import { CURRENCY_OPTIONS } from '../../utils/currency';
import {
  Loader2, Plus, X, Calendar,
  Search, ArrowRight, Zap, MapPin
} from 'lucide-react';
import toast from 'react-hot-toast';

const G = '#D5AA5B';
const card = { background: '#fff', border: '1px solid #eee', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' };

const STATUS_COLORS = {
  draft:      { bg: '#f3f4f6', color: '#6b7280', label: 'Draft' },
  accepting:  { bg: '#eff6ff', color: '#2563eb', label: 'Accepting Applications' },
  active:     { bg: '#f0fdf4', color: '#16a34a', label: 'Active' },
  demo_day:   { bg: '#fef3c7', color: '#ca8a04', label: 'Demo Day' },
  completed:  { bg: '#e0e7ff', color: '#4338ca', label: 'Completed' },
  cancelled:  { bg: '#fee2e2', color: '#dc2626', label: 'Cancelled' },
};

export default function AcceleratorBatches() {
  const navigate = useNavigate();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', focus_sectors: '', batch_number: '', duration_weeks: 12,
    equity_taken: '', investment_amount: '', investment_currency: 'INR', application_deadline: '', start_date: '',
    end_date: '', demo_day_date: '', total_seats: 10, status: 'draft', location: '', is_virtual: false,
  });

  useEffect(() => { load(); }, [statusFilter, search]);

  const load = async () => {
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (search) params.search = search;
      const d = await acceleratorAPI.listBatches(params);
      setBatches(Array.isArray(d) ? d : []);
    } catch { toast.error('Failed to load batches'); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name) return toast.error('Batch name required');
    try {
      const payload = {
        ...form,
        focus_sectors: form.focus_sectors ? form.focus_sectors.split(',').map(s => s.trim()).filter(Boolean) : null,
        duration_weeks: form.duration_weeks || null,
        equity_taken: form.equity_taken || null,
        investment_amount: form.investment_amount || null,
        application_deadline: form.application_deadline || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        demo_day_date: form.demo_day_date || null,
      };
      await acceleratorAPI.createBatch(payload);
      toast.success('Batch created');
      setShowCreate(false);
      setForm({
        name: '', description: '', focus_sectors: '', batch_number: '', duration_weeks: 12,
        equity_taken: '', investment_amount: '', investment_currency: 'INR', application_deadline: '', start_date: '',
        end_date: '', demo_day_date: '', total_seats: 10, status: 'draft', location: '', is_virtual: false,
      });
      load();
    } catch (err) { toast.error(err.message || 'Failed to create'); }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Loader2 size={28} className="animate-spin" style={{ color: G }} /></div>;

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <span id="tour-page-accelerator-batches-header" />
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>Accelerator Batches</h1>
          <p style={{ fontSize: 13, color: '#888', margin: '4px 0 0' }}>Manage cohorts, pitch pipelines, and demo day events</p>
        </div>
        <button id="tour-page-accelerator-batches-create" onClick={() => setShowCreate(true)}
          style={{ padding: '10px 18px', background: G, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={16} /> New Batch
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ ...card, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 240px' }}>
          <Search size={15} style={{ color: '#888' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search batches..."
            style={{ border: 'none', outline: 'none', fontSize: 16, flex: 1, background: 'transparent' }} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '10px 14px', border: '1px solid #eee', borderRadius: 10, fontSize: 16, background: '#fff', cursor: 'pointer' }}>
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="accepting">Accepting</option>
          <option value="active">Active</option>
          <option value="demo_day">Demo Day</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {batches.length === 0 ? (
        <div style={{ ...card, padding: 60, textAlign: 'center' }}>
          <Zap size={42} style={{ color: '#ddd', marginBottom: 12 }} />
          <div style={{ fontSize: 16, fontWeight: 600, color: '#666', marginBottom: 6 }}>No batches yet</div>
          <div style={{ fontSize: 13, color: '#999', marginBottom: 18 }}>Create your first accelerator batch to get started</div>
          <button onClick={() => setShowCreate(true)}
            style={{ padding: '10px 20px', background: G, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Create Batch
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
          {batches.map(b => {
            const sc = STATUS_COLORS[b.status] || STATUS_COLORS.draft;
            const milestonePct = b.milestone_total > 0 ? Math.round((b.milestone_done / b.milestone_total) * 100) : 0;
            return (
              <div key={b.id} style={{ ...card, padding: 18, cursor: 'pointer', transition: 'all 0.2s' }}
                onClick={() => navigate(`/dashboard/accelerator/batches/${b.id}`)}
                onMouseEnter={e => e.currentTarget.style.borderColor = G}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#eee'}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: sc.bg, color: sc.color }}>
                    {sc.label}
                  </span>
                  {b.batch_number && <span style={{ fontSize: 10, color: '#999', fontWeight: 600 }}>{b.batch_number}</span>}
                </div>

                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', margin: '0 0 6px' }}>{b.name}</h3>
                <p style={{ fontSize: 12, color: '#888', margin: '0 0 12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {b.description || 'No description provided'}
                </p>

                {(b.focus_sectors || []).length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
                    {b.focus_sectors.slice(0, 3).map(s => (
                      <span key={s} style={{ fontSize: 9, padding: '2px 7px', borderRadius: 20, background: '#fff8ec', color: G }}>{s}</span>
                    ))}
                    {b.focus_sectors.length > 3 && <span style={{ fontSize: 9, color: '#999' }}>+{b.focus_sectors.length - 3}</span>}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid #f5f5f5', borderBottom: '1px solid #f5f5f5', marginBottom: 10 }}>
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>{b.startup_count || 0}</div>
                    <div style={{ fontSize: 9, color: '#999' }}>STARTUPS</div>
                  </div>
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#16a34a' }}>{b.selected_count || 0}</div>
                    <div style={{ fontSize: 9, color: '#999' }}>SELECTED</div>
                  </div>
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#ca8a04' }}>{b.graduated_count || 0}</div>
                    <div style={{ fontSize: 9, color: '#999' }}>GRADUATED</div>
                  </div>
                </div>

                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#888', marginBottom: 4 }}>
                    <span>Milestones</span>
                    <span>{b.milestone_done}/{b.milestone_total}</span>
                  </div>
                  <div style={{ height: 5, background: '#f3f4f6', borderRadius: 3 }}>
                    <div style={{ height: '100%', width: `${milestonePct}%`, background: G, borderRadius: 3, transition: 'width 0.3s' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: '#888' }}>
                  {b.demo_day_date ? (
                    <span><Calendar size={11} style={{ verticalAlign: -2, marginRight: 3 }} />Demo Day: {new Date(b.demo_day_date).toLocaleDateString()}</span>
                  ) : b.location ? (
                    <span><MapPin size={11} style={{ verticalAlign: -2, marginRight: 3 }} />{b.is_virtual ? 'Virtual' : b.location}</span>
                  ) : (
                    <span>—</span>
                  )}
                  <ArrowRight size={13} style={{ color: '#ccc' }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div style={{ ...card, width: '100%', maxWidth: 620, maxHeight: '90vh', overflowY: 'auto', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>New Accelerator Batch</h2>
              <X size={20} style={{ cursor: 'pointer', color: '#888' }} onClick={() => setShowCreate(false)} />
            </div>
            <form onSubmit={handleCreate}>
              <div style={{ display: 'grid', gap: 12 }}>
                <div>
                  <label style={lbl}>Batch Name *</label>
                  <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inp} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
                  <div>
                    <label style={lbl}>Description</label>
                    <textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ ...inp, resize: 'vertical' }} />
                  </div>
                  <div>
                    <label style={lbl}>Batch Number</label>
                    <input value={form.batch_number} onChange={e => setForm({ ...form, batch_number: e.target.value })} placeholder="Batch 8" style={inp} />
                  </div>
                </div>
                <div>
                  <label style={lbl}>Focus Sectors (comma-separated)</label>
                  <input value={form.focus_sectors} onChange={e => setForm({ ...form, focus_sectors: e.target.value })} placeholder="FinTech, InsurTech" style={inp} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={lbl}>Duration (weeks)</label>
                    <input type="number" value={form.duration_weeks} onChange={e => setForm({ ...form, duration_weeks: e.target.value })} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Equity (%)</label>
                    <input type="number" step="0.1" value={form.equity_taken} onChange={e => setForm({ ...form, equity_taken: e.target.value })} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Currency</label>
                    <select value={form.investment_currency} onChange={e => setForm({ ...form, investment_currency: e.target.value })} style={inp}>
                      {CURRENCY_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Investment</label>
                    <input type="number" value={form.investment_amount} onChange={e => setForm({ ...form, investment_amount: e.target.value })} style={inp} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={lbl}>Application Deadline</label>
                    <input type="date" value={form.application_deadline} onChange={e => setForm({ ...form, application_deadline: e.target.value })} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Start Date</label>
                    <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>End Date</label>
                    <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Demo Day</label>
                    <input type="date" value={form.demo_day_date} onChange={e => setForm({ ...form, demo_day_date: e.target.value })} style={inp} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: 10 }}>
                  <div>
                    <label style={lbl}>Total Seats</label>
                    <input type="number" value={form.total_seats} onChange={e => setForm({ ...form, total_seats: e.target.value })} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Location</label>
                    <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Bengaluru" style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Status</label>
                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={inp}>
                      <option value="draft">Draft</option>
                      <option value="accepting">Accepting</option>
                      <option value="active">Active</option>
                    </select>
                  </div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#666', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.is_virtual} onChange={e => setForm({ ...form, is_virtual: e.target.checked })} />
                  Virtual batch (remote-first)
                </label>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 18, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowCreate(false)}
                  style={{ padding: '9px 16px', background: '#fff', border: '1px solid #ddd', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#666', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit"
                  style={{ padding: '9px 18px', background: G, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Create Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const lbl = { display: 'block', fontSize: 11, fontWeight: 600, color: '#666', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 };
const inp = { width: '100%', padding: '9px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' };
