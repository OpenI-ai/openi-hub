import { useState, useEffect } from 'react';
import { spAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Briefcase, Users, Star, Plus, X, ToggleLeft, ToggleRight } from 'lucide-react';

const G = '#D5AA5B';
const card = { background: '#fff', border: '1px solid #eee', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' };

const TABS = ['Services', 'Clients', 'Reviews'];

export default function SPServices() {
  const [tab, setTab] = useState(0);
  const [services, setServices] = useState([]);
  const [clients, setClients] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'service' | 'client' | null
  const [form, setForm] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const [s, c, r] = await Promise.all([spAPI.listServices(), spAPI.listClients(), spAPI.listReviews()]);
      setServices(s.data?.services || s.data || []);
      setClients(c.data?.clients || c.data || []);
      setReviews(r.data?.reviews || r.data || []);
    } catch { toast.error('Failed to load data'); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    try {
      if (modal === 'service') { await spAPI.createService(form); toast.success('Service created'); }
      else if (modal === 'client') { await spAPI.createClient(form); toast.success('Client added'); }
      setModal(null); setForm({}); load();
    } catch { toast.error('Save failed'); }
  };

  const toggleActive = async (svc) => {
    try { await spAPI.updateService(svc.id, { is_active: !svc.is_active }); load(); } catch { toast.error('Update failed'); }
  };

  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1) : '—';
  const stars = (n) => '★'.repeat(Math.round(n || 0)) + '☆'.repeat(5 - Math.round(n || 0));

  if (loading) return <div style={{ padding: 32, textAlign: 'center', color: '#888' }}>Loading…</div>;

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Service Provider Hub</h1>
        {tab < 2 && (
          <button onClick={() => { setModal(tab === 0 ? 'service' : 'client'); setForm({}); }}
            style={{ background: G, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
            <Plus size={16} /> {tab === 0 ? 'Add Service' : 'Add Client'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid #eee', paddingBottom: 0 }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            style={{ padding: '8px 20px', border: 'none', borderBottom: tab === i ? `3px solid ${G}` : '3px solid transparent', background: 'none', fontWeight: tab === i ? 700 : 400, color: tab === i ? G : '#666', cursor: 'pointer', fontSize: 15 }}>
            {[<Briefcase key="br" size={14}/>, <Users key="us" size={14}/>, <Star key="st" size={14}/>][i]} {t}
          </button>
        ))}
      </div>

      {/* Services Tab */}
      {tab === 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
          {services.length === 0 && <p style={{ color: '#888' }}>No services yet. Add your first service.</p>}
          {services.map(s => (
            <div key={s.id} style={{ ...card, padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{s.service_name || s.name}</h3>
                <span onClick={() => toggleActive(s)} style={{ cursor: 'pointer' }}>
                  {s.is_active !== false ? <ToggleRight size={22} color={G}/> : <ToggleLeft size={22} color="#ccc"/>}
                </span>
              </div>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: '#888' }}>{s.category || '—'}</p>
              <div style={{ display: 'flex', gap: 12, marginTop: 10, fontSize: 13, color: '#555' }}>
                <span>💰 {s.pricing_type || '—'}</span>
                {(s.price_min || s.price_max) && <span>₹{s.price_min || 0}–{s.price_max || '∞'}</span>}
              </div>
              {s.delivery_time && <p style={{ margin: '6px 0 0', fontSize: 12, color: '#999' }}>⏱ {s.delivery_time}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Clients Tab */}
      {tab === 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
          {clients.length === 0 && <p style={{ color: '#888' }}>No clients yet.</p>}
          {clients.map(c => (
            <div key={c.id} style={{ ...card, padding: 18 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{c.client_name || c.name}</h3>
              <p style={{ margin: '4px 0', fontSize: 13, color: '#888' }}>{c.client_type || c.type || '—'}</p>
              {c.engagement_summary && <p style={{ margin: '6px 0 0', fontSize: 13, color: '#555' }}>{c.engagement_summary}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Reviews Tab */}
      {tab === 2 && (
        <>
          <div style={{ ...card, padding: 16, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Star size={28} color={G} fill={G}/>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{avgRating}</div>
              <div style={{ fontSize: 13, color: '#888' }}>Average from {reviews.length} review{reviews.length !== 1 && 's'}</div>
            </div>
          </div>
          {reviews.map(r => (
            <div key={r.id} style={{ ...card, padding: 16, marginBottom: 12 }}>
              <div style={{ color: G, letterSpacing: 2, fontSize: 16 }}>{stars(r.rating)}</div>
              <p style={{ margin: '6px 0 0', fontSize: 14 }}>{r.comment || r.review_text || '—'}</p>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#999' }}>— {r.reviewer_name || 'Anonymous'}</p>
            </div>
          ))}
          {reviews.length === 0 && <p style={{ color: '#888' }}>No reviews yet.</p>}
        </>
      )}

      {/* Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ ...card, padding: 28, width: 420, maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>{modal === 'service' ? 'New Service' : 'New Client'}</h2>
              <X size={20} style={{ cursor: 'pointer' }} onClick={() => setModal(null)}/>
            </div>
            {modal === 'service' && <>
              <Input label="Service Name" value={form.service_name || ''} onChange={v => setForm(f => ({ ...f, service_name: v }))}/>
              <Input label="Category" value={form.category || ''} onChange={v => setForm(f => ({ ...f, category: v }))}/>
              <Input label="Pricing Type" placeholder="fixed / hourly / retainer" value={form.pricing_type || ''} onChange={v => setForm(f => ({ ...f, pricing_type: v }))}/>
              <Input label="Price Min" type="number" value={form.price_min || ''} onChange={v => setForm(f => ({ ...f, price_min: v }))}/>
              <Input label="Price Max" type="number" value={form.price_max || ''} onChange={v => setForm(f => ({ ...f, price_max: v }))}/>
              <Input label="Delivery Time" placeholder="e.g. 2 weeks" value={form.delivery_time || ''} onChange={v => setForm(f => ({ ...f, delivery_time: v }))}/>
            </>}
            {modal === 'client' && <>
              <Input label="Client Name" value={form.client_name || ''} onChange={v => setForm(f => ({ ...f, client_name: v }))}/>
              <Input label="Client Type" placeholder="startup / corporate / govt" value={form.client_type || ''} onChange={v => setForm(f => ({ ...f, client_type: v }))}/>
              <Input label="Engagement Summary" value={form.engagement_summary || ''} onChange={v => setForm(f => ({ ...f, engagement_summary: v }))}/>
            </>}
            <button onClick={handleSave} style={{ marginTop: 16, width: '100%', padding: 10, background: G, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Input({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>{label}</label>
      <input type={type} value={value} placeholder={placeholder || ''} onChange={e => onChange(e.target.value)}
        style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8, fontSize: 16, boxSizing: 'border-box' }}/>
    </div>
  );
}
