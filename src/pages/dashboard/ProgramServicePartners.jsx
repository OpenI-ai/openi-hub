import { useState, useEffect } from 'react';
import { programPartnersAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, CURRENCY_OPTIONS } from '../../utils/currency';
import {
  Loader2, Plus, X, Trash2, Edit3, Link2, Mail, ExternalLink,
  ToggleLeft, ToggleRight, Search, Gift, CheckCircle, User
} from 'lucide-react';
import toast from 'react-hot-toast';
import { isUpgradeError } from '../../utils/upgradeError';
import UpgradeCTA from '../../components/UpgradeCTA';

const G = '#D0A848';
const card = { background: '#fff', border: '1px solid #eee', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' };

// Service categories (matches Service Provider persona taxonomy)
const SERVICE_CATEGORIES = [
  'Cloud Credits (AWS/Azure/GCP)',
  'Legal Services',
  'Financial/Accounting',
  'Compliance/Regulatory',
  'HR/Recruitment',
  'Marketing/PR',
  'IP/Patent',
  'Mentorship Programs',
  'Office Space/Co-working',
  'Design/Branding',
  'Software Development',
  'Data Analytics',
];

export default function ProgramServicePartners() {
  const { user } = useAuth();
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);

  // Picker modal
  const [showPicker, setShowPicker] = useState(false);
  const [directoryLoading, setDirectoryLoading] = useState(false);
  const [directory, setDirectory] = useState([]);
  const [directorySearch, setDirectorySearch] = useState('');
  const [directoryCategory, setDirectoryCategory] = useState('');
  const [selectedSp, setSelectedSp] = useState(null);

  // Add/Edit form
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [upgradeError, setUpgradeError] = useState(null);
  const [form, setForm] = useState({
    service_provider_user_id: '',
    service_category: '',
    perk_description: '',
    perk_value: '',
    perk_value_currency: 'INR',
    redemption_url: '',
    redemption_instructions: '',
    eligibility_criteria: '',
    contact_email: '',
    contact_person: '',
    started_at: '',
    notes: '',
  });

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const d = await programPartnersAPI.list();
      setPartners(Array.isArray(d) ? d : []);
    } catch { toast.error('Failed to load service partners'); }
    finally { setLoading(false); }
  };

  const loadDirectory = async () => {
    setDirectoryLoading(true);
    try {
      const params = {};
      if (directorySearch) params.q = directorySearch;
      if (directoryCategory) params.category = directoryCategory;
      const d = await programPartnersAPI.directory(params);
      setDirectory(Array.isArray(d) ? d : []);
    } catch { toast.error('Failed to search directory'); }
    finally { setDirectoryLoading(false); }
  };

  useEffect(() => {
    if (showPicker) loadDirectory();
    // eslint-disable-next-line
  }, [showPicker, directorySearch, directoryCategory]);

  const openAddFlow = () => {
    setShowPicker(true);
    setSelectedSp(null);
    setEditingId(null);
    setForm({
      service_provider_user_id: '', service_category: '', perk_description: '',
      perk_value: '', perk_value_currency: 'INR', redemption_url: '', redemption_instructions: '',
      eligibility_criteria: '', contact_email: '', contact_person: '', started_at: '', notes: '',
    });
  };

  const pickSp = (sp) => {
    if (sp.already_added) {
      toast.error(`${sp.company_name || sp.name} is already added for this category. Change category or edit existing entry.`);
      return;
    }
    setSelectedSp(sp);
    setForm(prev => ({
      ...prev,
      service_provider_user_id: sp.user_id,
      service_category: (sp.service_categories && sp.service_categories[0]) || '',
      contact_email: sp.contact_email || '',
      contact_person: sp.contact_person || '',
    }));
    setShowPicker(false);
    setShowForm(true);
  };

  const openEdit = (p) => {
    setEditingId(p.id);
    setSelectedSp({
      user_id: p.service_provider_user_id,
      company_name: p.company_name,
      logo_url: p.logo_url,
      tagline: p.tagline,
    });
    setForm({
      service_provider_user_id: p.service_provider_user_id,
      service_category: p.service_category || '',
      perk_description: p.perk_description || '',
      perk_value: p.perk_value || '',
      perk_value_currency: p.perk_value_currency || 'INR',
      redemption_url: p.redemption_url || '',
      redemption_instructions: p.redemption_instructions || '',
      eligibility_criteria: p.eligibility_criteria || '',
      contact_email: p.contact_email || '',
      contact_person: p.contact_person || '',
      started_at: p.started_at ? p.started_at.split('T')[0] : '',
      notes: p.notes || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.service_provider_user_id) return toast.error('Pick a service provider from the directory first');
    try {
      const payload = {
        ...form,
        perk_value: form.perk_value || null,
        started_at: form.started_at || null,
      };
      if (editingId) {
        await programPartnersAPI.update(editingId, payload);
        toast.success('Service partner updated');
      } else {
        await programPartnersAPI.add(payload);
        toast.success('Service partner added');
      }
      setShowForm(false);
      setEditingId(null);
      setSelectedSp(null);
      load();
    } catch (err) {
      toast.error(err.message || 'Failed');
      if (isUpgradeError(err)) setUpgradeError(err);
    }
  };

  const toggleActive = async (p) => {
    try {
      await programPartnersAPI.update(p.id, { is_active: !p.is_active });
      load();
    } catch (err) { toast.error(err.message || 'Failed'); }
  };

  const remove = async (id) => {
    if (!window.confirm('Remove this service partner?')) return;
    try {
      await programPartnersAPI.remove(id);
      toast.success('Removed');
      load();
    } catch (err) { toast.error(err.message || 'Failed'); }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Loader2 size={28} className="animate-spin" style={{ color: G }} /></div>;

  const isIncubator = user?.role === 'incubator';
  const label = isIncubator ? 'Program Service Partners' : 'Batch Service Partners';
  const sublabel = isIncubator
    ? 'Cloud credits, legal, financial, and other perks for your cohort startups'
    : 'Cloud credits, legal, financial, and other perks for your batch startups';

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div id="tour-page-program-service-partners" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>{label}</h1>
          <p style={{ fontSize: 13, color: '#5c5c5c', margin: '4px 0 0' }}>{sublabel}</p>
        </div>
        <button onClick={openAddFlow}
          style={{ padding: '10px 18px', background: G, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={16} /> Add Service Partner
        </button>
      </div>

      {partners.length === 0 ? (
        <div style={{ ...card, padding: 60, textAlign: 'center' }}>
          <Link2 size={42} style={{ color: '#ddd', marginBottom: 12 }} />
          <div style={{ fontSize: 16, fontWeight: 600, color: '#666', marginBottom: 6 }}>No service partners yet</div>
          <div style={{ fontSize: 13, color: '#666', marginBottom: 18 }}>Link registered Service Providers who offer perks to your startups</div>
          <button onClick={openAddFlow}
            style={{ padding: '10px 20px', background: G, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Browse Directory
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 14 }}>
          {partners.map(p => (
            <div key={p.id} style={{ ...card, padding: 18, opacity: p.is_active ? 1 : 0.6 }}>
              {/* SP header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                {p.logo_url ? (
                  <img src={p.logo_url} alt={p.company_name} style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 44, height: 44, borderRadius: 8, background: '#fff8ec', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Link2 size={20} style={{ color: G }} />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>{p.company_name || p.sp_user_name}</div>
                  {p.tagline && <div style={{ fontSize: 11, color: '#5c5c5c', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.tagline}</div>}
                  {p.service_category && (
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: '#eff6ff', color: '#2563eb', display: 'inline-block', marginTop: 4 }}>
                      {p.service_category}
                    </span>
                  )}
                </div>
              </div>

              {/* Perk */}
              {p.perk_description && (
                <div style={{ padding: 10, background: '#fff8ec', borderRadius: 8, border: '1px solid #f5e7c1', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                    <Gift size={11} style={{ color: G }} />
                    <div style={{ fontSize: 10, fontWeight: 700, color: G, textTransform: 'uppercase', letterSpacing: 0.5 }}>Perk</div>
                  </div>
                  <div style={{ fontSize: 12, color: '#1a1a1a', lineHeight: 1.5 }}>{p.perk_description}</div>
                  {p.perk_value && (
                    <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
                      Est. value: <strong>{formatCurrency(p.perk_value, p.perk_value_currency, 'compact')}</strong>
                    </div>
                  )}
                </div>
              )}

              {/* Eligibility */}
              {p.eligibility_criteria && (
                <div style={{ fontSize: 11, color: '#666', marginBottom: 8 }}>
                  <strong>Eligibility:</strong> {p.eligibility_criteria}
                </div>
              )}

              {/* Contact */}
              {(p.contact_email || p.contact_person) && (
                <div style={{ fontSize: 11, color: '#666', marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {p.contact_person && <span><User size={10} style={{ verticalAlign: -1, marginRight: 4 }} />{p.contact_person}</span>}
                  {p.contact_email && <a href={`mailto:${p.contact_email}`} style={{ color: G, textDecoration: 'none' }}><Mail size={10} style={{ verticalAlign: -1, marginRight: 4 }} />{p.contact_email}</a>}
                </div>
              )}

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTop: '1px solid #f5f5f5' }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  {p.redemption_url && (
                    <a href={p.redemption_url} target="_blank" rel="noopener noreferrer" title="Redeem"
                      style={{ padding: '5px 8px', background: '#fff8ec', border: '1px solid #f5e7c1', borderRadius: 6, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: G, fontWeight: 600 }}>
                      <ExternalLink size={11} /> Redeem
                    </a>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => toggleActive(p)} title={p.is_active ? 'Deactivate' : 'Activate'}
                    style={{ padding: '5px 8px', background: 'none', border: '1px solid #eee', borderRadius: 6, cursor: 'pointer', color: p.is_active ? '#16a34a' : '#999' }}>
                    {p.is_active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                  </button>
                  <button onClick={() => openEdit(p)} title="Edit"
                    style={{ padding: '5px 8px', background: 'none', border: '1px solid #eee', borderRadius: 6, cursor: 'pointer', color: '#666' }}>
                    <Edit3 size={12} />
                  </button>
                  <button onClick={() => remove(p.id)} title="Remove"
                    style={{ padding: '5px 8px', background: 'none', border: '1px solid #fee', borderRadius: 6, cursor: 'pointer', color: '#dc2626' }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SP Picker Modal */}
      {showPicker && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div style={{ ...card, width: '100%', maxWidth: 720, maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', borderBottom: '1px solid #eee' }}>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>Pick a Service Provider</h2>
                <p style={{ fontSize: 11, color: '#5c5c5c', margin: '3px 0 0' }}>Only registered Service Providers on the platform can be added as partners</p>
              </div>
              <X size={20} style={{ cursor: 'pointer', color: '#5c5c5c' }} onClick={() => setShowPicker(false)} />
            </div>

            {/* Search + filter */}
            <div style={{ padding: '14px 22px', borderBottom: '1px solid #eee', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 240px', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8 }}>
                <Search size={14} style={{ color: '#5c5c5c' }} />
                <input value={directorySearch} onChange={e => setDirectorySearch(e.target.value)} placeholder="Search by name or tagline..."
                  style={{ border: 'none', outline: 'none', fontSize: 16, flex: 1, background: 'transparent' }} />
              </div>
              <select value={directoryCategory} onChange={e => setDirectoryCategory(e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 16, background: '#fff', cursor: 'pointer' }}>
                <option value="">All categories</option>
                {SERVICE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* SP list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
              {directoryLoading ? (
                <div style={{ textAlign: 'center', padding: 30 }}><Loader2 size={22} className="animate-spin" style={{ color: G }} /></div>
              ) : directory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 30, color: '#666' }}>
                  <Search size={28} style={{ color: '#ddd', marginBottom: 8 }} />
                  <div style={{ fontSize: 13 }}>No service providers found</div>
                  <div style={{ fontSize: 11, marginTop: 4 }}>Try broadening your search or category filter</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {directory.map(sp => (
                    <div key={sp.user_id}
                      onClick={() => pickSp(sp)}
                      style={{
                        padding: 12, borderRadius: 10, border: '1px solid #eee',
                        cursor: sp.already_added ? 'not-allowed' : 'pointer',
                        background: sp.already_added ? '#fafafa' : '#fff',
                        opacity: sp.already_added ? 0.55 : 1,
                        transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 12,
                      }}
                      onMouseEnter={e => !sp.already_added && (e.currentTarget.style.borderColor = G)}
                      onMouseLeave={e => e.currentTarget.style.borderColor = '#eee'}>
                      {sp.logo_url ? (
                        <img src={sp.logo_url} alt={sp.company_name} style={{ width: 42, height: 42, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 42, height: 42, borderRadius: 8, background: '#fff8ec', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Link2 size={18} style={{ color: G }} />
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{sp.company_name || sp.name}</span>
                          {sp.already_added && (
                            <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 20, background: '#f0fdf4', color: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                              <CheckCircle size={9} /> ADDED
                            </span>
                          )}
                        </div>
                        {sp.tagline && <div style={{ fontSize: 11, color: '#5c5c5c', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sp.tagline}</div>}
                        {(sp.service_categories || []).length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 5 }}>
                            {sp.service_categories.slice(0, 3).map(c => (
                              <span key={c} style={{ fontSize: 9, padding: '2px 7px', borderRadius: 20, background: '#eff6ff', color: '#2563eb' }}>{c}</span>
                            ))}
                            {sp.service_categories.length > 3 && <span style={{ fontSize: 9, color: '#666' }}>+{sp.service_categories.length - 3}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div style={{ ...card, width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto', padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>
                {editingId ? 'Edit Service Partner' : 'Add Service Partner'}
              </h2>
              <X size={20} style={{ cursor: 'pointer', color: '#5c5c5c' }} onClick={() => { setShowForm(false); setEditingId(null); setSelectedSp(null); }} />
            </div>

            {/* Locked SP header */}
            {selectedSp && (
              <div style={{ padding: 12, background: '#fafafa', borderRadius: 10, border: '1px solid #eee', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                {selectedSp.logo_url ? (
                  <img src={selectedSp.logo_url} alt={selectedSp.company_name} style={{ width: 38, height: 38, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 38, height: 38, borderRadius: 8, background: '#fff8ec', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Link2 size={17} style={{ color: G }} />
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>{selectedSp.company_name || selectedSp.name}</div>
                  {selectedSp.tagline && <div style={{ fontSize: 11, color: '#5c5c5c' }}>{selectedSp.tagline}</div>}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
              <div>
                <label style={lbl}>Service Category *</label>
                <select required value={form.service_category} onChange={e => setForm({ ...form, service_category: e.target.value })} style={inp}>
                  <option value="">— Pick a category —</option>
                  {SERVICE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label style={lbl}>Perk Description</label>
                <textarea rows={3} value={form.perk_description} onChange={e => setForm({ ...form, perk_description: e.target.value })}
                  placeholder="e.g. USD 25,000 in AWS credits for 2 years for each selected startup"
                  style={{ ...inp, resize: 'vertical' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                <div>
                  <label style={lbl}>Currency</label>
                  <select value={form.perk_value_currency} onChange={e => setForm({ ...form, perk_value_currency: e.target.value })} style={inp}>
                    {CURRENCY_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Perk Value</label>
                  <input type="number" value={form.perk_value} onChange={e => setForm({ ...form, perk_value: e.target.value })} placeholder="2500000" style={inp} />
                </div>
                <div>
                  <label style={lbl}>Redemption URL</label>
                  <input type="url" value={form.redemption_url} onChange={e => setForm({ ...form, redemption_url: e.target.value })} placeholder="https://..." style={inp} />
                </div>
              </div>

              <div>
                <label style={lbl}>Redemption Instructions</label>
                <textarea rows={2} value={form.redemption_instructions} onChange={e => setForm({ ...form, redemption_instructions: e.target.value })}
                  placeholder="How startups claim this perk..." style={{ ...inp, resize: 'vertical' }} />
              </div>

              <div>
                <label style={lbl}>Eligibility Criteria</label>
                <textarea rows={2} value={form.eligibility_criteria} onChange={e => setForm({ ...form, eligibility_criteria: e.target.value })}
                  placeholder="Which startups qualify..." style={{ ...inp, resize: 'vertical' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
                <div>
                  <label style={lbl}>Contact Person</label>
                  <input value={form.contact_person} onChange={e => setForm({ ...form, contact_person: e.target.value })} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Contact Email</label>
                  <input type="email" value={form.contact_email} onChange={e => setForm({ ...form, contact_email: e.target.value })} style={inp} />
                </div>
              </div>

              <div>
                <label style={lbl}>Partnership Start Date</label>
                <input type="date" value={form.started_at} onChange={e => setForm({ ...form, started_at: e.target.value })} style={inp} />
              </div>

              <div>
                <label style={lbl}>Notes (internal)</label>
                <textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ ...inp, resize: 'vertical' }} />
              </div>

              {upgradeError && (
                <UpgradeCTA compact feature={upgradeError.feature} plan={upgradeError.plan} />
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 6, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null); setSelectedSp(null); }}
                  style={{ padding: '9px 16px', background: '#fff', border: '1px solid #ddd', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#666', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit"
                  style={{ padding: '9px 18px', background: G, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  {editingId ? 'Save Changes' : 'Add Partner'}
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
const inp = { width: '100%', padding: '9px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 16, outline: 'none', boxSizing: 'border-box' };
