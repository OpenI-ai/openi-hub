import { useState, useEffect } from 'react';
import { acceleratorAPI } from '../../services/api';
import { formatCurrency, formatCurrencyRange, CURRENCY_OPTIONS } from '../../utils/currency';
import {
  Loader2, Plus, X, Trash2, Building2, DollarSign, Calendar,
  Globe, MapPin, ToggleLeft, ToggleRight, ExternalLink, Video
} from 'lucide-react';
import toast from 'react-hot-toast';

const G = '#D0A848';
const card = { background: '#fff', border: '1px solid #eee', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' };

const PARTNERSHIP_TYPES = ['sponsor', 'mentor', 'channel', 'customer', 'investor', 'co_host'];
const INVESTOR_TYPES = ['vc', 'angel', 'cvc', 'family_office', 'pe', 'micro_vc'];

export default function AcceleratorPartners() {
  const [tab, setTab] = useState('partners');
  const [partners, setPartners] = useState([]);
  const [investors, setInvestors] = useState([]);
  const [demoDays, setDemoDays] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddPartner, setShowAddPartner] = useState(false);
  const [showAddInvestor, setShowAddInvestor] = useState(false);
  const [showAddDemoDay, setShowAddDemoDay] = useState(false);

  const [partnerForm, setPartnerForm] = useState({
    partner_name: '', partnership_type: 'sponsor', partnership_tier: '', contribution: '', website: '', started_at: '', notes: ''
  });
  const [investorForm, setInvestorForm] = useState({
    investor_name: '', investor_type: 'vc', firm_name: '', typical_ticket_min: '', typical_ticket_max: '', ticket_currency: 'INR',
    focus_sectors: '', stage_preference: '', contact_email: '', linkedin_url: '', notes: ''
  });
  const [demoDayForm, setDemoDayForm] = useState({
    title: '', description: '', event_date: '', venue: '', is_virtual: false, stream_url: '', rsvp_url: '', total_investors_invited: 0,
    total_funding_raised: '', total_funding_raised_currency: 'INR',
  });

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const [p, i, d] = await Promise.all([
        acceleratorAPI.listCorporatePartners(),
        acceleratorAPI.listInvestorNetwork(),
        acceleratorAPI.listDemoDays(),
      ]);
      setPartners(p);
      setInvestors(i);
      setDemoDays(d);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  const handleAddPartner = async (e) => {
    e.preventDefault();
    if (!partnerForm.partner_name) return toast.error('Partner name required');
    try {
      await acceleratorAPI.addCorporatePartner({
        ...partnerForm,
        started_at: partnerForm.started_at || null,
      });
      toast.success('Partner added');
      setShowAddPartner(false);
      setPartnerForm({ partner_name: '', partnership_type: 'sponsor', partnership_tier: '', contribution: '', website: '', started_at: '', notes: '' });
      load();
    } catch (err) { toast.error(err.message || 'Failed'); }
  };

  const handleAddInvestor = async (e) => {
    e.preventDefault();
    if (!investorForm.investor_name) return toast.error('Investor name required');
    try {
      await acceleratorAPI.addInvestor({
        ...investorForm,
        focus_sectors: investorForm.focus_sectors ? investorForm.focus_sectors.split(',').map(s => s.trim()).filter(Boolean) : null,
        stage_preference: investorForm.stage_preference ? investorForm.stage_preference.split(',').map(s => s.trim()).filter(Boolean) : null,
        typical_ticket_min: investorForm.typical_ticket_min || null,
        typical_ticket_max: investorForm.typical_ticket_max || null,
      });
      toast.success('Investor added');
      setShowAddInvestor(false);
      setInvestorForm({ investor_name: '', investor_type: 'vc', firm_name: '', typical_ticket_min: '', typical_ticket_max: '', ticket_currency: 'INR', focus_sectors: '', stage_preference: '', contact_email: '', linkedin_url: '', notes: '' });
      load();
    } catch (err) { toast.error(err.message || 'Failed'); }
  };

  const handleAddDemoDay = async (e) => {
    e.preventDefault();
    if (!demoDayForm.title || !demoDayForm.event_date) return toast.error('Title and event date required');
    try {
      await acceleratorAPI.createDemoDay(demoDayForm);
      toast.success('Demo day created');
      setShowAddDemoDay(false);
      setDemoDayForm({ title: '', description: '', event_date: '', venue: '', is_virtual: false, stream_url: '', rsvp_url: '', total_investors_invited: 0, total_funding_raised: '', total_funding_raised_currency: 'INR' });
      load();
    } catch (err) { toast.error(err.message || 'Failed'); }
  };

  const togglePartner = async (p) => {
    try {
      await acceleratorAPI.updateCorporatePartner(p.id, { is_active: !p.is_active });
      load();
    } catch (err) { toast.error(err.message || 'Failed'); }
  };
  const toggleInvestor = async (i) => {
    try {
      await acceleratorAPI.updateInvestor(i.id, { is_active: !i.is_active });
      load();
    } catch (err) { toast.error(err.message || 'Failed'); }
  };

  const removePartner = async (pid) => {
    if (!window.confirm('Remove this partner?')) return;
    try { await acceleratorAPI.removeCorporatePartner(pid); toast.success('Removed'); load(); }
    catch (err) { toast.error(err.message || 'Failed'); }
  };
  const removeInvestor = async (iid) => {
    if (!window.confirm('Remove this investor?')) return;
    try { await acceleratorAPI.removeInvestor(iid); toast.success('Removed'); load(); }
    catch (err) { toast.error(err.message || 'Failed'); }
  };
  const removeDemoDay = async (did) => {
    if (!window.confirm('Remove this demo day?')) return;
    try { await acceleratorAPI.deleteDemoDay(did); toast.success('Removed'); load(); }
    catch (err) { toast.error(err.message || 'Failed'); }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Loader2 size={28} className="animate-spin" style={{ color: G }} /></div>;

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div id="tour-page-accelerator-partners" style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>Partnerships & Network</h1>
        <p style={{ fontSize: 13, color: '#5c5c5c', margin: '4px 0 0' }}>Manage corporate partners, investor network, and demo day events</p>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 18, borderBottom: '1px solid #eee' }}>
        {[
          { key: 'partners', label: 'Corporate Partners', count: partners.length },
          { key: 'investors', label: 'Investor Network', count: investors.length },
          { key: 'demo-days', label: 'Demo Days', count: demoDays.length },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ padding: '10px 18px', background: 'none', border: 'none', borderBottom: tab === t.key ? `2px solid ${G}` : '2px solid transparent', color: tab === t.key ? '#1a1a1a' : '#888', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {/* Corporate Partners */}
      {tab === 'partners' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button onClick={() => setShowAddPartner(true)}
              style={{ padding: '8px 14px', background: G, color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Plus size={14} /> Add Partner
            </button>
          </div>
          {partners.length === 0 ? (
            <EmptyState icon={Building2} label="No corporate partners yet" onAdd={() => setShowAddPartner(true)} />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
              {partners.map(p => (
                <div key={p.id} style={{ ...card, padding: 16, opacity: p.is_active ? 1 : 0.6 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 8, background: '#fff8ec', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Building2 size={18} style={{ color: G }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{p.partner_name}</div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: '#eff6ff', color: '#2563eb', textTransform: 'capitalize' }}>{p.partnership_type}</span>
                        {p.partnership_tier && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: '#fff8ec', color: G }}>{p.partnership_tier}</span>}
                      </div>
                    </div>
                  </div>
                  {p.contribution && <div style={{ fontSize: 11, color: '#666', marginTop: 10, fontStyle: 'italic' }}>{p.contribution}</div>}
                  {p.website && <a href={p.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: G, marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}><Globe size={11} />{p.website.replace(/^https?:\/\//, '')}</a>}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginTop: 12, paddingTop: 10, borderTop: '1px solid #f5f5f5' }}>
                    <button onClick={() => togglePartner(p)} style={btnIcon}>{p.is_active ? <ToggleRight size={14} color="#16a34a" /> : <ToggleLeft size={14} color="#999" />}</button>
                    <button onClick={() => removePartner(p.id)} style={{ ...btnIcon, borderColor: '#fee', color: '#dc2626' }}><Trash2 size={12} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Investor Network */}
      {tab === 'investors' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button onClick={() => setShowAddInvestor(true)}
              style={{ padding: '8px 14px', background: G, color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Plus size={14} /> Add Investor
            </button>
          </div>
          {investors.length === 0 ? (
            <EmptyState icon={DollarSign} label="No investors in network yet" onAdd={() => setShowAddInvestor(true)} />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
              {investors.map(i => (
                <div key={i.id} style={{ ...card, padding: 16, opacity: i.is_active ? 1 : 0.6 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 8, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <DollarSign size={18} style={{ color: '#16a34a' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{i.investor_name}</div>
                      {i.firm_name && <div style={{ fontSize: 11, color: '#5c5c5c' }}>{i.firm_name}</div>}
                      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: '#eff6ff', color: '#2563eb', textTransform: 'uppercase' }}>{i.investor_type}</span>
                        {i.deals_closed > 0 && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: '#f0fdf4', color: '#16a34a' }}>{i.deals_closed} deals</span>}
                      </div>
                    </div>
                  </div>
                  {(i.typical_ticket_min || i.typical_ticket_max) && (
                    <div style={{ fontSize: 11, color: '#666', marginTop: 8 }}>
                      <strong>Ticket:</strong> {formatCurrencyRange(i.typical_ticket_min, i.typical_ticket_max, i.ticket_currency, 'compact')}
                    </div>
                  )}
                  {(i.focus_sectors || []).length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                      {i.focus_sectors.slice(0, 3).map(s => <span key={s} style={{ fontSize: 9, padding: '2px 7px', borderRadius: 20, background: '#fff8ec', color: G }}>{s}</span>)}
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginTop: 12, paddingTop: 10, borderTop: '1px solid #f5f5f5' }}>
                    <button onClick={() => toggleInvestor(i)} style={btnIcon}>{i.is_active ? <ToggleRight size={14} color="#16a34a" /> : <ToggleLeft size={14} color="#999" />}</button>
                    <button onClick={() => removeInvestor(i.id)} style={{ ...btnIcon, borderColor: '#fee', color: '#dc2626' }}><Trash2 size={12} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Demo Days */}
      {tab === 'demo-days' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button onClick={() => setShowAddDemoDay(true)}
              style={{ padding: '8px 14px', background: G, color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Plus size={14} /> Schedule Demo Day
            </button>
          </div>
          {demoDays.length === 0 ? (
            <EmptyState icon={Calendar} label="No demo days scheduled yet" onAdd={() => setShowAddDemoDay(true)} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {demoDays.map(d => (
                <div key={d.id} style={{ ...card, padding: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>{d.title}</div>
                      {d.batch_name && <div style={{ fontSize: 11, color: '#5c5c5c', marginTop: 2 }}>{d.batch_name}</div>}
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: d.status === 'completed' ? '#f0fdf4' : '#eff6ff', color: d.status === 'completed' ? '#16a34a' : '#2563eb', textTransform: 'capitalize' }}>{d.status}</span>
                  </div>
                  {d.description && <div style={{ fontSize: 12, color: '#666', marginBottom: 10 }}>{d.description}</div>}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, padding: '10px 0', borderTop: '1px solid #f5f5f5', borderBottom: '1px solid #f5f5f5' }}>
                    <Stat icon={Calendar} label="Date" value={new Date(d.event_date).toLocaleDateString()} />
                    <Stat icon={d.is_virtual ? Video : MapPin} label="Venue" value={d.is_virtual ? 'Virtual' : (d.venue || '—')} />
                    <Stat icon={DollarSign} label="Invited" value={d.total_investors_invited} />
                    <Stat icon={DollarSign} label="Raised" value={formatCurrency(d.total_funding_raised, d.total_funding_raised_currency, 'compact')} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginTop: 10 }}>
                    {d.stream_url && <a href={d.stream_url} target="_blank" rel="noopener noreferrer" style={{ ...btnIcon, display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}><Video size={12} /> Stream</a>}
                    {d.rsvp_url && <a href={d.rsvp_url} target="_blank" rel="noopener noreferrer" style={{ ...btnIcon, display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}><ExternalLink size={12} /> RSVP</a>}
                    <button onClick={() => removeDemoDay(d.id)} style={{ ...btnIcon, borderColor: '#fee', color: '#dc2626' }}><Trash2 size={12} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Add Partner Modal */}
      {showAddPartner && (
        <Modal title="Add Corporate Partner" onClose={() => setShowAddPartner(false)}>
          <form onSubmit={handleAddPartner} style={{ display: 'grid', gap: 12 }}>
            <div><label style={lbl}>Partner Name *</label><input required value={partnerForm.partner_name} onChange={e => setPartnerForm({ ...partnerForm, partner_name: e.target.value })} style={inp} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
              <div><label style={lbl}>Type</label>
                <select value={partnerForm.partnership_type} onChange={e => setPartnerForm({ ...partnerForm, partnership_type: e.target.value })} style={inp}>
                  {PARTNERSHIP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div><label style={lbl}>Tier</label><input value={partnerForm.partnership_tier} onChange={e => setPartnerForm({ ...partnerForm, partnership_tier: e.target.value })} placeholder="Platinum/Gold" style={inp} /></div>
            </div>
            <div><label style={lbl}>Contribution</label><textarea rows={2} value={partnerForm.contribution} onChange={e => setPartnerForm({ ...partnerForm, contribution: e.target.value })} style={{ ...inp, resize: 'vertical' }} /></div>
            <div><label style={lbl}>Website</label><input type="url" value={partnerForm.website} onChange={e => setPartnerForm({ ...partnerForm, website: e.target.value })} style={inp} /></div>
            <div><label style={lbl}>Started At</label><input type="date" value={partnerForm.started_at} onChange={e => setPartnerForm({ ...partnerForm, started_at: e.target.value })} style={inp} /></div>
            <ModalFooter onClose={() => setShowAddPartner(false)} />
          </form>
        </Modal>
      )}

      {/* Add Investor Modal */}
      {showAddInvestor && (
        <Modal title="Add Investor to Network" onClose={() => setShowAddInvestor(false)}>
          <form onSubmit={handleAddInvestor} style={{ display: 'grid', gap: 12 }}>
            <div><label style={lbl}>Investor Name *</label><input required value={investorForm.investor_name} onChange={e => setInvestorForm({ ...investorForm, investor_name: e.target.value })} style={inp} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
              <div><label style={lbl}>Type</label>
                <select value={investorForm.investor_type} onChange={e => setInvestorForm({ ...investorForm, investor_type: e.target.value })} style={inp}>
                  {INVESTOR_TYPES.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                </select>
              </div>
              <div><label style={lbl}>Firm Name</label><input value={investorForm.firm_name} onChange={e => setInvestorForm({ ...investorForm, firm_name: e.target.value })} style={inp} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
              <div>
                <label style={lbl}>Currency</label>
                <select value={investorForm.ticket_currency} onChange={e => setInvestorForm({ ...investorForm, ticket_currency: e.target.value })} style={inp}>
                  {CURRENCY_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div><label style={lbl}>Ticket Min</label><input type="number" value={investorForm.typical_ticket_min} onChange={e => setInvestorForm({ ...investorForm, typical_ticket_min: e.target.value })} style={inp} /></div>
              <div><label style={lbl}>Ticket Max</label><input type="number" value={investorForm.typical_ticket_max} onChange={e => setInvestorForm({ ...investorForm, typical_ticket_max: e.target.value })} style={inp} /></div>
            </div>
            <div><label style={lbl}>Focus Sectors (comma-separated)</label><input value={investorForm.focus_sectors} onChange={e => setInvestorForm({ ...investorForm, focus_sectors: e.target.value })} placeholder="FinTech, SaaS" style={inp} /></div>
            <div><label style={lbl}>Stage Preference (comma-separated)</label><input value={investorForm.stage_preference} onChange={e => setInvestorForm({ ...investorForm, stage_preference: e.target.value })} placeholder="Seed, Series A" style={inp} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
              <div><label style={lbl}>Contact Email</label><input type="email" value={investorForm.contact_email} onChange={e => setInvestorForm({ ...investorForm, contact_email: e.target.value })} style={inp} /></div>
              <div><label style={lbl}>LinkedIn URL</label><input type="url" value={investorForm.linkedin_url} onChange={e => setInvestorForm({ ...investorForm, linkedin_url: e.target.value })} style={inp} /></div>
            </div>
            <ModalFooter onClose={() => setShowAddInvestor(false)} />
          </form>
        </Modal>
      )}

      {/* Add Demo Day Modal */}
      {showAddDemoDay && (
        <Modal title="Schedule Demo Day" onClose={() => setShowAddDemoDay(false)}>
          <form onSubmit={handleAddDemoDay} style={{ display: 'grid', gap: 12 }}>
            <div><label style={lbl}>Title *</label><input required value={demoDayForm.title} onChange={e => setDemoDayForm({ ...demoDayForm, title: e.target.value })} style={inp} /></div>
            <div><label style={lbl}>Description</label><textarea rows={2} value={demoDayForm.description} onChange={e => setDemoDayForm({ ...demoDayForm, description: e.target.value })} style={{ ...inp, resize: 'vertical' }} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
              <div><label style={lbl}>Event Date/Time *</label><input required type="datetime-local" value={demoDayForm.event_date} onChange={e => setDemoDayForm({ ...demoDayForm, event_date: e.target.value })} style={inp} /></div>
              <div><label style={lbl}>Investors Invited</label><input type="number" value={demoDayForm.total_investors_invited} onChange={e => setDemoDayForm({ ...demoDayForm, total_investors_invited: e.target.value })} style={inp} /></div>
            </div>
            <div><label style={lbl}>Venue</label><input value={demoDayForm.venue} onChange={e => setDemoDayForm({ ...demoDayForm, venue: e.target.value })} style={inp} /></div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#666' }}><input type="checkbox" checked={demoDayForm.is_virtual} onChange={e => setDemoDayForm({ ...demoDayForm, is_virtual: e.target.checked })} /> Virtual event</label>
            <div><label style={lbl}>Stream URL</label><input type="url" value={demoDayForm.stream_url} onChange={e => setDemoDayForm({ ...demoDayForm, stream_url: e.target.value })} style={inp} /></div>
            <div><label style={lbl}>RSVP URL</label><input type="url" value={demoDayForm.rsvp_url} onChange={e => setDemoDayForm({ ...demoDayForm, rsvp_url: e.target.value })} style={inp} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
              <div>
                <label style={lbl}>Currency</label>
                <select value={demoDayForm.total_funding_raised_currency} onChange={e => setDemoDayForm({ ...demoDayForm, total_funding_raised_currency: e.target.value })} style={inp}>
                  {CURRENCY_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Total Funding Raised (optional)</label>
                <input type="number" value={demoDayForm.total_funding_raised} onChange={e => setDemoDayForm({ ...demoDayForm, total_funding_raised: e.target.value })} placeholder="0 if not yet held" style={inp} />
              </div>
            </div>
            <ModalFooter onClose={() => setShowAddDemoDay(false)} />
          </form>
        </Modal>
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, label, onAdd }) {
  return (
    <div style={{ ...card, padding: 60, textAlign: 'center' }}>
      <Icon size={42} style={{ color: '#ddd', marginBottom: 12 }} />
      <div style={{ fontSize: 15, fontWeight: 600, color: '#666', marginBottom: 16 }}>{label}</div>
      <button onClick={onAdd} style={{ padding: '10px 20px', background: G, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Add</button>
    </div>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div>
      <div style={{ fontSize: 9, color: '#666', textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
        <Icon size={10} />{label}
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>{value}</div>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
      <div style={{ ...card, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', padding: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>{title}</h2>
          <X size={20} style={{ cursor: 'pointer', color: '#5c5c5c' }} onClick={onClose} />
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalFooter({ onClose }) {
  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 6 }}>
      <button type="button" onClick={onClose} style={{ padding: '9px 16px', background: '#fff', border: '1px solid #ddd', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#666', cursor: 'pointer' }}>Cancel</button>
      <button type="submit" style={{ padding: '9px 18px', background: G, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Save</button>
    </div>
  );
}

const lbl = { display: 'block', fontSize: 11, fontWeight: 600, color: '#666', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 };
const inp = { width: '100%', padding: '9px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 16, outline: 'none', boxSizing: 'border-box' };
const btnIcon = { padding: '5px 8px', background: 'none', border: '1px solid #eee', borderRadius: 6, cursor: 'pointer', color: '#666' };
