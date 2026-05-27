import { useState, useEffect } from 'react';
import { labEnhAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Cpu, CalendarCheck, Plus, X, ToggleLeft, ToggleRight } from 'lucide-react';

const G = '#D5AA5B';
const card = { background: '#fff', border: '1px solid #eee', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' };

const TABS = ['Equipment', 'Bookings'];
const STATUS_COLORS = { pending: '#F59E0B', approved: '#3B82F6', active: '#22C55E', completed: '#6B7280', rejected: '#EF4444' };

export default function LabEquipment() {
  const [tab, setTab] = useState(0);
  const [equipment, setEquipment] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const [eq, bk] = await Promise.all([labEnhAPI.listEquipment(), labEnhAPI.listBookings()]);
      setEquipment(eq.data?.equipment || eq.data || []);
      setBookings(bk.data?.bookings || bk.data || []);
    } catch { toast.error('Failed to load data'); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.name) { toast.error('Name is required'); return; }
    try {
      await labEnhAPI.createEquipment(form);
      toast.success('Equipment added');
      setModal(false); setForm({}); load();
    } catch { toast.error('Create failed'); }
  };

  const toggleAvailable = async (eq) => {
    try { await labEnhAPI.updateEquipment(eq.id, { is_available: !eq.is_available }); load(); } catch { toast.error('Update failed'); }
  };

  const fmtDate = (d) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return d; }
  };

  const fmtCurrency = (v) => v ? `₹${Number(v).toLocaleString('en-IN')}` : '—';

  if (loading) return <div style={{ padding: 32, textAlign: 'center', color: '#888' }}>Loading…</div>;

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Lab Equipment & Bookings</h1>
        {tab === 0 && (
          <button onClick={() => { setModal(true); setForm({}); }}
            style={{ background: G, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
            <Plus size={16}/> Add Equipment
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid #eee' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            style={{ padding: '8px 20px', border: 'none', borderBottom: tab === i ? `3px solid ${G}` : '3px solid transparent', background: 'none', fontWeight: tab === i ? 700 : 400, color: tab === i ? G : '#666', cursor: 'pointer', fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
            {i === 0 ? <Cpu size={14}/> : <CalendarCheck size={14}/>} {t}
          </button>
        ))}
      </div>

      {/* Equipment Grid */}
      {tab === 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
          {equipment.length === 0 && <p style={{ color: '#888' }}>No equipment listed. Add your first item.</p>}
          {equipment.map(eq => (
            <div key={eq.id} style={{ ...card, padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{eq.name}</h3>
                <span onClick={() => toggleAvailable(eq)} style={{ cursor: 'pointer' }}>
                  {eq.is_available !== false ? <ToggleRight size={22} color={G}/> : <ToggleLeft size={22} color="#ccc"/>}
                </span>
              </div>
              {eq.category && <p style={{ margin: '4px 0 0', fontSize: 13, color: '#888' }}>{eq.category}</p>}
              <div style={{ display: 'flex', gap: 14, marginTop: 10, fontSize: 13, color: '#555' }}>
                <span>Hourly: {fmtCurrency(eq.hourly_rate)}</span>
                <span>Daily: {fmtCurrency(eq.daily_rate)}</span>
              </div>
              {eq.description && <p style={{ margin: '8px 0 0', fontSize: 12, color: '#999', lineHeight: 1.4 }}>{eq.description.substring(0, 100)}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Bookings List */}
      {tab === 1 && (
        <>
          {bookings.length === 0 && <p style={{ color: '#888', textAlign: 'center', marginTop: 40 }}>No bookings yet.</p>}
          {bookings.map(b => (
            <div key={b.id} style={{ ...card, padding: 16, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{b.equipment_name || `Equipment #${b.equipment_id}`}</h3>
                <p style={{ margin: '3px 0 0', fontSize: 13, color: '#888' }}>
                  Booked by: {b.booked_by_name || b.booked_by || '—'} &nbsp;·&nbsp; {fmtDate(b.start_date)}{b.end_date ? ` – ${fmtDate(b.end_date)}` : ''}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 12, fontWeight: 600, color: '#fff', background: STATUS_COLORS[b.status] || '#888' }}>
                  {b.status || 'pending'}
                </span>
                {b.total_cost > 0 && <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>{fmtCurrency(b.total_cost)}</div>}
              </div>
            </div>
          ))}
        </>
      )}

      {/* Create Equipment Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ ...card, padding: 28, width: 420, maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>Add Equipment</h2>
              <X size={20} style={{ cursor: 'pointer' }} onClick={() => setModal(false)}/>
            </div>
            <Inp label="Name *" value={form.name || ''} onChange={v => setForm(f => ({ ...f, name: v }))}/>
            <Inp label="Category" value={form.category || ''} onChange={v => setForm(f => ({ ...f, category: v }))} placeholder="e.g. Microscopy, Spectroscopy"/>
            <Inp label="Hourly Rate (INR)" type="number" value={form.hourly_rate || ''} onChange={v => setForm(f => ({ ...f, hourly_rate: v }))}/>
            <Inp label="Daily Rate (INR)" type="number" value={form.daily_rate || ''} onChange={v => setForm(f => ({ ...f, daily_rate: v }))}/>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Description</label>
              <textarea value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8, fontSize: 16, boxSizing: 'border-box', resize: 'vertical' }}/>
            </div>
            <button onClick={handleCreate} style={{ marginTop: 8, width: '100%', padding: 10, background: G, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
              Add Equipment
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Inp({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>{label}</label>
      <input type={type} value={value} placeholder={placeholder || ''} onChange={e => onChange(e.target.value)}
        style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8, fontSize: 16, boxSizing: 'border-box' }}/>
    </div>
  );
}
