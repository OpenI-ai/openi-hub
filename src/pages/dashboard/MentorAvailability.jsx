import { useState, useEffect } from 'react';
import { mentorEnhAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Clock, Save, Trash2 } from 'lucide-react';

const G = '#D5AA5B';
const card = { background: '#fff', border: '1px solid #eee', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' };

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const emptySlot = (day) => ({ day_of_week: day, start_time: '09:00', end_time: '17:00', is_active: true });

export default function MentorAvailability() {
  const [slots, setSlots] = useState(DAYS.map(d => emptySlot(d)));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await mentorEnhAPI.getAvailability();
        const existing = res.data?.slots || res.data || [];
        if (existing.length > 0) {
          const merged = DAYS.map(day => {
            const found = existing.find(s => s.day_of_week === day);
            return found ? { ...found } : { ...emptySlot(day), is_active: false };
          });
          setSlots(merged);
        }
      } catch { /* use defaults */ }
      setLoading(false);
    })();
  }, []);

  const update = (idx, field, value) => {
    setSlots(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const activeSlots = slots.filter(s => s.is_active);
      await mentorEnhAPI.setAvailability(activeSlots);
      toast.success('Availability saved');
    } catch { toast.error('Save failed'); }
    setSaving(false);
  };

  const clearDay = (idx) => {
    setSlots(prev => prev.map((s, i) => i === idx ? { ...emptySlot(s.day_of_week), is_active: false } : s));
  };

  if (loading) return <div style={{ padding: 32, textAlign: 'center', color: '#888' }}>Loading…</div>;

  return (
    <div style={{ padding: 24, maxWidth: 700, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <span id="tour-page-mentor-availability-header" />
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Availability</h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: '#888' }}>Set your weekly availability for mentoring sessions</p>
        </div>
        <button id="tour-page-mentor-availability-save" onClick={handleSave} disabled={saving}
          style={{ background: G, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, opacity: saving ? 0.6 : 1 }}>
          <Save size={16}/> {saving ? 'Saving…' : 'Save All'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {slots.map((slot, idx) => (
          <div key={slot.day_of_week} style={{ ...card, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, opacity: slot.is_active ? 1 : 0.5 }}>
            {/* Active toggle */}
            <input type="checkbox" checked={slot.is_active} onChange={e => update(idx, 'is_active', e.target.checked)}
              style={{ width: 18, height: 18, accentColor: G, cursor: 'pointer' }}/>

            {/* Day label */}
            <div style={{ width: 100, fontWeight: 600, fontSize: 15 }}>{slot.day_of_week}</div>

            {/* Time inputs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
              <Clock size={14} color="#888"/>
              <input type="time" value={slot.start_time} disabled={!slot.is_active}
                onChange={e => update(idx, 'start_time', e.target.value)}
                style={{ padding: '6px 8px', border: '1px solid #ddd', borderRadius: 6, fontSize: 16 }}/>
              <span style={{ color: '#888' }}>to</span>
              <input type="time" value={slot.end_time} disabled={!slot.is_active}
                onChange={e => update(idx, 'end_time', e.target.value)}
                style={{ padding: '6px 8px', border: '1px solid #ddd', borderRadius: 6, fontSize: 16 }}/>
            </div>

            {/* Clear */}
            <Trash2 size={16} color="#ccc" style={{ cursor: 'pointer' }} onClick={() => clearDay(idx)}/>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20, padding: 14, background: '#FFFBF0', border: `1px solid ${G}33`, borderRadius: 10, fontSize: 13, color: '#666' }}>
        <strong>Tip:</strong> Uncheck days you are unavailable. Active slots will be visible to mentees when scheduling sessions.
      </div>
    </div>
  );
}
