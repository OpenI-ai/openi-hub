import { useState, useEffect } from 'react';
import { investorAPI } from '../../services/api';
import {
  Loader2, Plus, X, DollarSign, TrendingUp, TrendingDown, Building2,
  Calendar, CheckCircle, AlertTriangle, Edit3
} from 'lucide-react';
import toast from 'react-hot-toast';

const G = '#D0A848';
const card = { background: '#fff', border: '1px solid #eee', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' };

const STATUS_CONFIG = {
  active:  { label: 'Active',  color: '#16a34a', bg: '#f0fdf4' },
  exited:  { label: 'Exited',  color: '#3b82f6', bg: '#eff6ff' },
  failed:  { label: 'Failed',  color: '#dc2626', bg: '#fef2f2' },
  partial: { label: 'Partial', color: '#f59e0b', bg: '#fefce8' },
};

export default function InvestorPortfolio() {
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add form
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    startup_name: '', entry_date: '', entry_valuation: '', equity_stake: '',
    investment_amount: '', board_seat: false, currency: 'INR',
  });

  // Inline edit (for exit updates)
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    status: '', exit_date: '', exit_valuation: '', exit_type: '',
  });

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const d = await investorAPI.listPortfolio();
      setPortfolio(Array.isArray(d) ? d : d.portfolio || []);
    } catch { toast.error('Failed to load portfolio'); }
    finally { setLoading(false); }
  };

  const handleAdd = async () => {
    if (!addForm.startup_name) { toast.error('Startup name is required'); return; }
    try {
      await investorAPI.addToPortfolio(addForm);
      toast.success('Added to portfolio');
      setAddForm({ startup_name: '', entry_date: '', entry_valuation: '', equity_stake: '', investment_amount: '', board_seat: false, currency: 'INR' });
      setShowAdd(false);
      load();
    } catch (err) { toast.error(err.message); }
  };

  const startEdit = (co) => {
    setEditingId(co.id);
    setEditForm({
      status: co.status || 'active',
      exit_date: co.exit_date ? co.exit_date.slice(0, 10) : '',
      exit_valuation: co.exit_valuation || '',
      exit_type: co.exit_type || '',
    });
  };

  const saveEdit = async (id) => {
    try {
      await investorAPI.updatePortfolio(id, editForm);
      toast.success('Portfolio updated');
      setEditingId(null);
      load();
    } catch (err) { toast.error(err.message); }
  };

  // ── Summary stats ──
  const totalInvested = portfolio.reduce((s, c) => s + (parseFloat(c.investment_amount) || 0), 0);
  const activeCount = portfolio.filter(c => c.status === 'active').length;
  const exitedCount = portfolio.filter(c => c.status === 'exited').length;
  const failedCount = portfolio.filter(c => c.status === 'failed').length;
  const totalExitValue = portfolio
    .filter(c => c.status === 'exited')
    .reduce((s, c) => s + (parseFloat(c.exit_valuation) || 0), 0);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Loader2 size={28} className="animate-spin" style={{ color: G }} /></div>;

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      {/* ── Header ── */}
      <div id="tour-page-portfolio-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>
          <Building2 size={20} style={{ verticalAlign: -3, marginRight: 8, color: G }} />Portfolio
        </h1>
        <button id="tour-page-portfolio-add" onClick={() => setShowAdd(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 16px', fontSize: 12, fontWeight: 600, borderRadius: 10, background: G, color: '#fff', border: 'none', cursor: 'pointer' }}>
          <Plus size={14} /> Add to Portfolio
        </button>
      </div>

      {/* ── Summary Stats ── */}
      <div id="tour-page-portfolio-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Invested', value: `INR ${totalInvested.toLocaleString()}`, icon: DollarSign, iconColor: G },
          { label: 'Active Companies', value: activeCount, icon: TrendingUp, iconColor: '#16a34a' },
          { label: 'Exited', value: exitedCount, icon: CheckCircle, iconColor: '#3b82f6' },
          { label: 'Failed', value: failedCount, icon: AlertTriangle, iconColor: '#dc2626' },
          { label: 'Total Exit Value', value: `INR ${totalExitValue.toLocaleString()}`, icon: TrendingDown, iconColor: '#8b5cf6' },
        ].map(stat => (
          <div key={stat.label} style={{ ...card, padding: 16, textAlign: 'center' }}>
            <stat.icon size={18} style={{ color: stat.iconColor, marginBottom: 6 }} />
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>{stat.value}</div>
            <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ── Add Form ── */}
      {showAdd && (
        <div style={{ ...card, padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>Add Portfolio Company</h3>
            <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}><X size={16} /></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 10, color: '#888', display: 'block', marginBottom: 2 }}>Startup Name *</label>
              <input placeholder="e.g. ArmorTech" value={addForm.startup_name} onChange={e => setAddForm(f => ({ ...f, startup_name: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', fontSize: 16, border: '1px solid #ddd', borderRadius: 8, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: 10, color: '#888', display: 'block', marginBottom: 2 }}>Entry Date</label>
              <input type="date" value={addForm.entry_date} onChange={e => setAddForm(f => ({ ...f, entry_date: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', fontSize: 16, border: '1px solid #ddd', borderRadius: 8, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: 10, color: '#888', display: 'block', marginBottom: 2 }}>Entry Valuation</label>
              <input type="number" placeholder="Valuation" value={addForm.entry_valuation} onChange={e => setAddForm(f => ({ ...f, entry_valuation: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', fontSize: 16, border: '1px solid #ddd', borderRadius: 8, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: 10, color: '#888', display: 'block', marginBottom: 2 }}>Equity Stake (%)</label>
              <input type="number" step="0.1" placeholder="e.g. 12.5" value={addForm.equity_stake} onChange={e => setAddForm(f => ({ ...f, equity_stake: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', fontSize: 16, border: '1px solid #ddd', borderRadius: 8, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: 10, color: '#888', display: 'block', marginBottom: 2 }}>Investment Amount</label>
              <input type="number" placeholder="Amount" value={addForm.investment_amount} onChange={e => setAddForm(f => ({ ...f, investment_amount: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', fontSize: 16, border: '1px solid #ddd', borderRadius: 8, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: 10, color: '#888', display: 'block', marginBottom: 2 }}>Currency</label>
              <select value={addForm.currency} onChange={e => setAddForm(f => ({ ...f, currency: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', fontSize: 16, border: '1px solid #ddd', borderRadius: 8, boxSizing: 'border-box' }}>
                <option>INR</option><option>USD</option><option>EUR</option><option>GBP</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#555', cursor: 'pointer' }}>
              <input type="checkbox" checked={addForm.board_seat} onChange={e => setAddForm(f => ({ ...f, board_seat: e.target.checked }))}
                style={{ width: 16, height: 16, accentColor: G }} />
              Board Seat
            </label>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleAdd} style={{ padding: '8px 20px', fontSize: 12, fontWeight: 600, borderRadius: 8, background: G, color: '#fff', border: 'none', cursor: 'pointer' }}>Add Company</button>
            <button onClick={() => setShowAdd(false)} style={{ padding: '8px 14px', fontSize: 12, borderRadius: 8, background: '#f3f4f6', color: '#666', border: 'none', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* ── Portfolio Grid ── */}
      {portfolio.length === 0 && !showAdd ? (
        <div style={{ ...card, padding: 40, textAlign: 'center' }}>
          <Building2 size={32} style={{ color: '#ddd', marginBottom: 10 }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: '#888' }}>No portfolio companies yet</p>
          <p style={{ fontSize: 12, color: '#aaa' }}>Add your first investment to start tracking</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {portfolio.map(co => {
            const st = STATUS_CONFIG[co.status] || STATUS_CONFIG.active;
            const isEditing = editingId === co.id;

            return (
              <div key={co.id} style={{ ...card, padding: 18, position: 'relative' }}>
                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: `${G}18`, color: G, fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {(co.startup_name || '?')[0]}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{co.startup_name || 'Unknown'}</div>
                      {co.entry_date && (
                        <div style={{ fontSize: 10, color: '#aaa', marginTop: 2 }}>
                          <Calendar size={10} style={{ verticalAlign: -1 }} /> Invested {new Date(co.entry_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {co.board_seat && (
                      <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 20, background: `${G}18`, color: G, fontWeight: 600 }}>Board Seat</span>
                    )}
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: st.bg, color: st.color }}>{st.label}</span>
                  </div>
                </div>

                {/* Metrics grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: 8, marginBottom: 12 }}>
                  <div style={{ padding: 8, background: '#f9fafb', borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 9, color: '#888', marginBottom: 2 }}>Invested</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a' }}>
                      {co.investment_amount ? `${co.currency || 'INR'} ${parseFloat(co.investment_amount).toLocaleString()}` : '--'}
                    </div>
                  </div>
                  <div style={{ padding: 8, background: '#f9fafb', borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 9, color: '#888', marginBottom: 2 }}>Equity</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a' }}>
                      {co.equity_stake ? `${co.equity_stake}%` : '--'}
                    </div>
                  </div>
                  <div style={{ padding: 8, background: '#f9fafb', borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 9, color: '#888', marginBottom: 2 }}>Entry Val.</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a' }}>
                      {co.entry_valuation ? `${co.currency || 'INR'} ${parseFloat(co.entry_valuation).toLocaleString()}` : '--'}
                    </div>
                  </div>
                </div>

                {/* Exit info (if exited) */}
                {co.status === 'exited' && co.exit_valuation && (
                  <div style={{ padding: 8, background: '#eff6ff', borderRadius: 8, marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                      <span style={{ color: '#3b82f6', fontWeight: 600 }}>Exit: {co.currency || 'INR'} {parseFloat(co.exit_valuation).toLocaleString()}</span>
                      {co.exit_type && <span style={{ color: '#6b7280', textTransform: 'capitalize' }}>{co.exit_type}</span>}
                    </div>
                    {co.exit_date && <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>{new Date(co.exit_date).toLocaleDateString()}</div>}
                    {co.investment_amount && co.exit_valuation && (() => {
                      const multiple = (parseFloat(co.exit_valuation) / parseFloat(co.investment_amount)).toFixed(1);
                      return <div style={{ fontSize: 10, fontWeight: 600, color: parseFloat(multiple) >= 1 ? '#16a34a' : '#dc2626', marginTop: 2 }}>{multiple}x return</div>;
                    })()}
                  </div>
                )}

                {/* Edit / Update button */}
                {!isEditing ? (
                  <button onClick={() => startEdit(co)}
                    style={{ width: '100%', padding: '6px', fontSize: 11, fontWeight: 500, borderRadius: 8, background: '#f9fafb', color: '#666', border: '1px solid #e5e7eb', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <Edit3 size={11} /> Update Status
                  </button>
                ) : (
                  <div style={{ padding: 12, background: '#f9fafb', borderRadius: 10, marginTop: 4 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, marginBottom: 8 }}>
                      <div>
                        <label style={{ fontSize: 10, color: '#888', display: 'block', marginBottom: 2 }}>Status</label>
                        <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                          style={{ width: '100%', padding: '6px 8px', fontSize: 16, border: '1px solid #ddd', borderRadius: 8, boxSizing: 'border-box' }}>
                          <option value="active">Active</option>
                          <option value="exited">Exited</option>
                          <option value="failed">Failed</option>
                          <option value="partial">Partial Exit</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: 10, color: '#888', display: 'block', marginBottom: 2 }}>Exit Type</label>
                        <select value={editForm.exit_type} onChange={e => setEditForm(f => ({ ...f, exit_type: e.target.value }))}
                          style={{ width: '100%', padding: '6px 8px', fontSize: 16, border: '1px solid #ddd', borderRadius: 8, boxSizing: 'border-box' }}>
                          <option value="">None</option>
                          <option value="acquisition">Acquisition</option>
                          <option value="ipo">IPO</option>
                          <option value="secondary">Secondary Sale</option>
                          <option value="buyback">Buyback</option>
                          <option value="write_off">Write-off</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: 10, color: '#888', display: 'block', marginBottom: 2 }}>Exit Date</label>
                        <input type="date" value={editForm.exit_date} onChange={e => setEditForm(f => ({ ...f, exit_date: e.target.value }))}
                          style={{ width: '100%', padding: '6px 8px', fontSize: 16, border: '1px solid #ddd', borderRadius: 8, outline: 'none', boxSizing: 'border-box' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 10, color: '#888', display: 'block', marginBottom: 2 }}>Exit Valuation</label>
                        <input type="number" placeholder="Exit value" value={editForm.exit_valuation} onChange={e => setEditForm(f => ({ ...f, exit_valuation: e.target.value }))}
                          style={{ width: '100%', padding: '6px 8px', fontSize: 16, border: '1px solid #ddd', borderRadius: 8, outline: 'none', boxSizing: 'border-box' }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => saveEdit(co.id)} style={{ flex: 1, padding: '6px 14px', fontSize: 11, fontWeight: 600, borderRadius: 8, background: G, color: '#fff', border: 'none', cursor: 'pointer' }}>Save</button>
                      <button onClick={() => setEditingId(null)} style={{ padding: '6px 10px', fontSize: 11, borderRadius: 8, background: '#f3f4f6', color: '#666', border: 'none', cursor: 'pointer' }}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
