import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { investorAPI, publicAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import CollaboratorsPanel from '../../components/CollaboratorsPanel';
import ApplicantInvitePanel from '../../components/ApplicantInvitePanel';
import ReviewPanel from '../../components/ReviewPanel';
import {
  Plus, X, ChevronRight, Users, Clock,
  CheckCircle, ArrowRight, TrendingUp, Target, Edit2, Trash2,
} from 'lucide-react';

const STAGES = ['Pre-seed','Seed','Series A','Series B','Series C','Growth','Late Stage','Any'];
const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-600',
  open: 'bg-green-100 text-green-700',
  reviewing: 'bg-yellow-100 text-yellow-700',
  closed: 'bg-red-100 text-red-600',
  filled: 'bg-blue-100 text-blue-700',
};
const APP_STATUS_COLORS = {
  applied: 'bg-gray-100 text-gray-600',
  shortlisted: 'bg-yellow-100 text-yellow-700',
  evaluating: 'bg-blue-100 text-blue-700',
  selected: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-600',
};

export default function InvestorDealRequests() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [taxonomy, setTaxonomy] = useState({ sectors: [], technologies: [] });
  const [expandedApps, setExpandedApps] = useState({});

  const [form, setForm] = useState({
    title: '', description: '', investment_thesis: '', status: 'open',
    sectors: [], technologies: [], target_stage: '', ticket_size_min: '',
    ticket_size_max: '', ticket_currency: 'INR', geographic_focus: [],
    deadline: '', max_applicants: 50, is_public: true, requirements: '',
  });

  useEffect(() => { loadRequests(); loadTaxonomy(); }, []);

  // Deep-link support: ?open=<id> (e.g. from the Marketplace "collaborating on"
  // route) auto-opens that deal's detail view once, then clears the param.
  useEffect(() => {
    const openId = searchParams.get('open');
    if (openId) {
      selectRequest(openId);
      const next = new URLSearchParams(searchParams);
      next.delete('open');
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount to consume the deep-link param
  }, []);

  async function loadRequests() {
    setLoading(true);
    try {
      const data = await investorAPI.listDealRequests();
      setRequests(Array.isArray(data) ? data : []);
    } catch { setRequests([]); }
    setLoading(false);
  }

  async function loadTaxonomy() {
    try {
      const data = await publicAPI.getTaxonomy();
      setTaxonomy({
        sectors: (data.sectors || []).filter(s => !s.parent_id).map(s => s.name).sort(),
        technologies: (data.technologies || []).filter(t => !t.parent_id).map(t => t.name).sort(),
      });
    } catch (_e) { /* non-fatal */ }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const tMin = form.ticket_size_min ? parseFloat(form.ticket_size_min) : null;
    const tMax = form.ticket_size_max ? parseFloat(form.ticket_size_max) : null;
    if ((tMin !== null && tMin < 0) || (tMax !== null && tMax < 0)) { alert('Ticket size cannot be negative.'); return; }
    if (tMin !== null && tMax !== null && tMax < tMin) { alert('Max Ticket must be greater than or equal to Min Ticket.'); return; }
    const payload = { ...form, ticket_size_min: tMin, ticket_size_max: tMax, max_applicants: parseInt(form.max_applicants) || 50 };
    try {
      if (editId) { await investorAPI.updateDealRequest(editId, payload); }
      else { await investorAPI.createDealRequest(payload); }
      setShowForm(false); setEditId(null); resetForm(); loadRequests();
    } catch (err) { alert(err.message || 'Error saving'); }
  }

  function resetForm() {
    setForm({ title: '', description: '', investment_thesis: '', status: 'open', sectors: [], technologies: [], target_stage: '', ticket_size_min: '', ticket_size_max: '', ticket_currency: 'INR', geographic_focus: [], deadline: '', max_applicants: 50, is_public: true, requirements: '' });
  }

  function editRequest(r) {
    setForm({ ...r, ticket_size_min: r.ticket_size_min || '', ticket_size_max: r.ticket_size_max || '', max_applicants: r.max_applicants || 50, deadline: r.deadline ? r.deadline.split('T')[0] : '', sectors: r.sectors || [], technologies: r.technologies || [], geographic_focus: r.geographic_focus || [] });
    setEditId(r.id); setShowForm(true);
  }

  async function selectRequest(id) {
    try {
      const data = await investorAPI.getDealRequest(id);
      setSelected(data);
    } catch { alert('Error loading deal request'); }
  }

  async function deleteRequest(r, fromDetail = false) {
    if (!confirm(`Delete deal request "${r.title}"? This removes its applications, team, and reviews. This cannot be undone.`)) return;
    try {
      await investorAPI.deleteDealRequest(r.id);
      if (fromDetail) setSelected(null);
      loadRequests();
    } catch (err) { alert(err.message || 'Error deleting deal request'); }
  }

  async function updateAppStatus(appId, status) {
    if (!selected) return;
    try {
      await investorAPI.updateDealRequestApp(selected.id, appId, { status });
      selectRequest(selected.id);
    } catch (err) { alert(err.message); }
  }

  async function promoteApp(appId) {
    if (!selected || !confirm('Promote this startup to your Deal Pipeline?')) return;
    try {
      const result = await investorAPI.promoteToPipeline(selected.id, appId);
      alert(result.message || 'Promoted to pipeline');
      selectRequest(selected.id);
    } catch (err) { alert(err.message); }
  }

  function toggleArrayItem(arr, item) {
    return arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];
  }

  // ── Detail View ──
  if (selected) {
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <button onClick={() => setSelected(null)} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
          <ChevronRight size={14} className="rotate-180" /> Back to Deal Requests
        </button>

        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-gray-900">{selected.title}</h1>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[selected.status]}`}>{selected.status}</span>
              </div>
              {selected.firm_name && <p className="text-sm text-gray-500 mt-1">{selected.firm_name}</p>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => { editRequest(selected); setSelected(null); }} className="px-3 py-1.5 text-xs border rounded-lg hover:bg-gray-50 flex items-center gap-1"><Edit2 size={12} /> Edit</button>
              <button onClick={() => deleteRequest(selected, true)} className="px-3 py-1.5 text-xs border border-red-200 text-red-600 rounded-lg hover:bg-red-50 flex items-center gap-1"><Trash2 size={12} /> Delete</button>
            </div>
          </div>

          {selected.investment_thesis && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs font-semibold text-amber-700 uppercase mb-1">Investment Thesis</p>
              <p className="text-sm text-gray-800">{selected.investment_thesis}</p>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {selected.target_stage && <div className="text-center p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Stage</p><p className="text-sm font-semibold">{selected.target_stage}</p></div>}
            {(selected.ticket_size_min || selected.ticket_size_max) && <div className="text-center p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Ticket Size</p><p className="text-sm font-semibold">{selected.ticket_currency} {selected.ticket_size_min ? (selected.ticket_size_min/1e5).toFixed(0)+'L' : '?'} - {selected.ticket_size_max ? (selected.ticket_size_max/1e7).toFixed(1)+'Cr' : '?'}</p></div>}
            {selected.deadline && <div className="text-center p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Deadline</p><p className="text-sm font-semibold">{new Date(selected.deadline).toLocaleDateString()}</p></div>}
            <div className="text-center p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Applicants</p><p className="text-sm font-semibold">{selected.applications?.length || 0} / {selected.max_applicants}</p></div>
          </div>

          {selected.sectors?.length > 0 && <div className="mt-3 flex flex-wrap gap-1">{selected.sectors.map(s => <span key={s} className="px-2 py-0.5 bg-primary-50 text-primary-700 text-xs rounded-full">{s}</span>)}</div>}
          {selected.technologies?.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{selected.technologies.map(t => <span key={t} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">{t}</span>)}</div>}
        </div>

        {/* Phase 40: Collaboration team */}
        <div className="mb-4">
          <CollaboratorsPanel
            entityType="deal_request"
            entityId={selected.id}
            title="Deal Team"
            subtitle="Invite your own colleagues here to help review applications (editor / reviewer / viewer). Startups, students and academia don't get invited here — they join by applying to this deal once it's open, and appear under Applications below."
          />
        </div>

        {/* Cross-Ecosystem Phase F: invite applicants to this deal */}
        <div className="mb-4">
          <ApplicantInvitePanel entityType="investor" entityId={selected.id} entityLabel={selected.title} user={user} />
        </div>

        {/* Phase 40 (P8): Reviews */}
        <div className="mb-4">
          <ReviewPanel entityType="deal_request" entityId={selected.id} title="Deal Reviews" />
        </div>

        {/* Applications */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Applications ({selected.applications?.length || 0})</h2>
          {!selected.applications?.length ? (
            <p className="text-sm text-gray-500">No applications yet.</p>
          ) : (
            <div className="space-y-3">
              {selected.applications.map(app => (
                <div key={app.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    {app.logo_url ? <img src={app.logo_url} alt="" className="w-10 h-10 rounded-lg object-cover" /> : <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">{(app.company_name || app.applicant_name || '?')[0]}</div>}
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{app.company_name || app.applicant_name}</p>
                      <p className="text-xs text-gray-500">{app.sector} {app.stage ? `| ${app.stage}` : ''} {app.city ? `| ${app.city}` : ''}</p>
                      {app.pitch && (
                        <>
                          <p className={`text-xs text-gray-600 mt-1 ${expandedApps[app.id] ? '' : 'line-clamp-2'}`}>{app.pitch}</p>
                          {app.pitch.length > 110 && (
                            <button
                              type="button"
                              onClick={() => setExpandedApps(prev => ({ ...prev, [app.id]: !prev[app.id] }))}
                              className="text-xs text-indigo-600 hover:underline mt-0.5"
                            >
                              {expandedApps[app.id] ? 'Show less' : 'Show more'}
                            </button>
                          )}
                        </>
                      )}
                      {app.proposal_url && (
                        <a
                          href={app.proposal_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-indigo-600 hover:underline mt-0.5 inline-block"
                        >
                          View Document
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${APP_STATUS_COLORS[app.status]}`}>{app.status}</span>
                    {app.status === 'applied' && (
                      <>
                        <button onClick={() => updateAppStatus(app.id, 'shortlisted')} className="px-2 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600">Shortlist</button>
                        <button onClick={() => updateAppStatus(app.id, 'rejected')} className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600">Reject</button>
                      </>
                    )}
                    {app.status === 'shortlisted' && (
                      <button onClick={() => promoteApp(app.id)} className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 flex items-center gap-1"><ArrowRight size={12} /> Pipeline</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Create/Edit Form ──
  if (showForm) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900">{editId ? 'Edit' : 'New'} Deal Sourcing Request</h1>
          <button onClick={() => { setShowForm(false); setEditId(null); resetForm(); }} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input type="text" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g., Looking for AI/ML startups in Series A" />
          </div>

          {/* Investment Thesis */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Investment Thesis</label>
            <textarea rows={3} value={form.investment_thesis} onChange={e => setForm(f => ({ ...f, investment_thesis: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Describe what you're looking for, your investment philosophy, and what makes a startup interesting to you..." />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Detailed description of the opportunity..." />
          </div>

          {/* Sectors */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Sectors</label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {taxonomy.sectors.map(s => (
                <button key={s} type="button" onClick={() => setForm(f => ({ ...f, sectors: toggleArrayItem(f.sectors, s) }))}
                  className={`px-2.5 py-1 rounded-full text-xs transition ${form.sectors.includes(s) ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{s}</button>
              ))}
            </div>
          </div>

          {/* Technologies */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Technologies</label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {taxonomy.technologies.map(t => (
                <button key={t} type="button" onClick={() => setForm(f => ({ ...f, technologies: toggleArrayItem(f.technologies, t) }))}
                  className={`px-2.5 py-1 rounded-full text-xs transition ${form.technologies.includes(t) ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{t}</button>
              ))}
            </div>
          </div>

          {/* Stage + Ticket Size */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Stage</label>
              <select value={form.target_stage} onChange={e => setForm(f => ({ ...f, target_stage: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="">Any</option>
                {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Ticket</label>
              <input type="number" min="0" step="any" value={form.ticket_size_min} onChange={e => setForm(f => ({ ...f, ticket_size_min: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g., 5000000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Ticket</label>
              <input type="number" min="0" step="any" value={form.ticket_size_max} onChange={e => setForm(f => ({ ...f, ticket_size_max: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g., 50000000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select value={form.ticket_currency} onChange={e => setForm(f => ({ ...f, ticket_currency: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="INR">INR</option><option value="USD">USD</option>
              </select>
            </div>
          </div>

          {/* Deadline + Max Applicants */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
              <input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Applicants</label>
              <input type="number" value={form.max_applicants} onChange={e => setForm(f => ({ ...f, max_applicants: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="draft">Draft</option><option value="open">Open</option>
                <option value="reviewing">Reviewing</option><option value="closed">Closed</option>
              </select>
            </div>
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, is_public: true }))}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${form.is_public ? 'bg-primary-500 text-white border-primary-500' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
              >
                Public — visible on Marketplace
              </button>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, is_public: false }))}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${!form.is_public ? 'bg-primary-500 text-white border-primary-500' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
              >
                Private — invite only
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {form.is_public
                ? 'This deal request will be listed on the public Marketplace for all startups to discover and apply.'
                : 'This deal request will be hidden from the public Marketplace. Only startups you invite directly will be able to see and apply.'}
            </p>
          </div>

          {/* Requirements */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Requirements</label>
            <textarea rows={3} value={form.requirements} onChange={e => setForm(f => ({ ...f, requirements: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="What do you expect in applications? Pitch deck, financial projections, etc." />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => { setShowForm(false); setEditId(null); resetForm(); }} className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
            <button type="submit" className="px-6 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600">{editId ? 'Update' : 'Create'} Deal Request</button>
          </div>
        </form>
      </div>
    );
  }

  // ── List View ──
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div id="tour-page-investor-deal-requests" className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Deal Sourcing</h1>
          <p className="text-sm text-gray-500">Post your investment thesis to attract startup applications</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 flex items-center gap-2"><Plus size={16} /> New Request</button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border">
          <Target size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700">No deal sourcing requests yet</h3>
          <p className="text-sm text-gray-500 mt-1">Create your first request to start sourcing deals from startups.</p>
          <button onClick={() => { resetForm(); setShowForm(true); }} className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg text-sm">Create First Request</button>
        </div>
      ) : (
        <div className="grid gap-4">
          {requests.map(r => (
            <div key={r.id} onClick={() => selectRequest(r.id)} className="bg-white rounded-xl border p-5 cursor-pointer hover:shadow-md transition group">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-900 group-hover:text-primary-600">{r.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[r.status]}`}>{r.status}</span>
                  </div>
                  {r.investment_thesis && <p className="text-xs text-gray-600 mt-1 line-clamp-2">{r.investment_thesis}</p>}
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    {r.target_stage && <span className="flex items-center gap-1"><TrendingUp size={12} /> {r.target_stage}</span>}
                    <span className="flex items-center gap-1"><Users size={12} /> {r.applicant_count || 0} applicants</span>
                    {r.shortlisted_count > 0 && <span className="flex items-center gap-1"><CheckCircle size={12} className="text-yellow-500" /> {r.shortlisted_count} shortlisted</span>}
                    {r.deadline && <span className="flex items-center gap-1"><Clock size={12} /> {new Date(r.deadline).toLocaleDateString()}</span>}
                  </div>
                  {r.sectors?.length > 0 && <div className="flex flex-wrap gap-1 mt-2">{r.sectors.slice(0, 5).map(s => <span key={s} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">{s}</span>)}</div>}
                </div>
                <div className="flex items-center">
                  <button onClick={e => { e.stopPropagation(); editRequest(r); }} className="p-2 text-gray-400 hover:text-gray-600"><Edit2 size={14} /></button>
                  <button onClick={e => { e.stopPropagation(); deleteRequest(r); }} className="p-2 text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
