import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { iprAPI, startupAPI, iprShareAPI, getToken } from '../../services/api';
import { useAuth } from '../../context/AuthContext'; // Phase 94
import LoadingSkeleton from '../../components/LoadingSkeleton';
import { Shield, Plus, Search, FileText, Award, Share2, FileDown, Mail, X } from 'lucide-react'; // Phase 111 Ship 2b icons added

const TYPE_ICONS = { Patent: Shield, Trademark: Award, Copyright: FileText, Design: FileText };
const STATUS_COLORS = {
  Granted: 'bg-accent-100 text-accent-700 border-accent-200',
  Published: 'bg-blue-100 text-blue-700 border-blue-200',
  Filed: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Licensed (Exclusive – HAL)': 'bg-purple-100 text-purple-700 border-purple-200',
};

// Normalize jurisdiction into an array for the render path (`.map`). The DB
// stores jurisdiction as a plain string (e.g. 'India', 'IN', 'US, EU'); older
// shapes used an array. Coerce: array → as-is, comma/semicolon string → split,
// single string → [string], null/empty → ['IN'] fallback. Prevents the
// `record.jurisdiction.map is not a function` crash on populated tables.
function toJurisdictionArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string' && value.trim()) {
    return value.split(/[,;]/).map(s => s.trim()).filter(Boolean);
  }
  return ['IN'];
}

export default function IPRDatabase() {
  // Phase 94 — gate Add/Edit + endpoint choice by role.
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'evaluator';
  const [search, setSearch] = useState('');
  const [type, setType] = useState('All');
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [iprRecords, setIprRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  // Phase 89 — wire IPR Save Record handler. Form state for the Add IPR
  // modal. Was previously uncontrolled inputs that the Save button just
  // dropped on the floor (Phase 66 events bug pattern).
  // Phase 94 Ship 3 — startup_id + startup_name (display label) for the
  // typeahead picker. startup_id is what goes on the wire; startup_name is
  // the human-readable label we keep in the input box once picked.
  const [form, setForm] = useState({
    title: '',
    application_no: '',
    filing_date: '',
    owner: '',
    type: 'Patent',
    openi_share: '',
    startup_id: null,
    startup_name: '',
  });
  // Phase 94 Ship 3 — typeahead state (search query + debounced results).
  const [startupSearch, setStartupSearch] = useState('');
  const [startupResults, setStartupResults] = useState([]);
  const [startupLoading, setStartupLoading] = useState(false);
  const startupSeqRef = useRef(0);
  const [saving, setSaving] = useState(false);

  // Phase 111 Ship 2b: Share modal state (magic-link only per D3)
  const [shareOpen, setShareOpen] = useState(false);
  const [shareTab, setShareTab] = useState('pdf');
  const [shareEmails, setShareEmails] = useState([]);
  const [shareEmailDraft, setShareEmailDraft] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [shareBusy, setShareBusy] = useState(false);

  // Phase 111 Ship 2b: Share handlers (IPR magic-link only per D3)
  const openIprShareModal = () => {
    setShareOpen(true);
    setShareTab('pdf');
    setShareEmails([]);
    setShareEmailDraft('');
    setShareMessage('');
  };

  const downloadIprPdf = async () => {
    if (!selected?.id) return;
    try {
      const res = await fetch(iprShareAPI.pdfUrl(selected.id), { headers: { Authorization: `Bearer ${getToken()}` } });
      if (!res.ok) throw new Error('PDF download failed');
      const blob = await res.blob();
      const dlUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = dlUrl;
      a.download = `ipr-${selected.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(dlUrl);
      toast.success('PDF downloaded');
    } catch (err) {
      toast.error(err.message || 'Failed to download PDF');
    }
  };

  const addShareEmail = () => {
    const em = shareEmailDraft.trim().toLowerCase();
    if (!em || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      toast.error('Enter a valid email');
      return;
    }
    if (shareEmails.includes(em)) return;
    setShareEmails(prev => [...prev, em]);
    setShareEmailDraft('');
  };

  const sendIprEmailInvite = async () => {
    if (!selected?.id || shareEmails.length === 0) return;
    setShareBusy(true);
    try {
      const r = await iprShareAPI.inviteByEmail(selected.id, {
        emails: shareEmails,
        message: shareMessage.trim() || undefined,
      });
      const count = (r.pending_email_invites || []).length;
      toast.success(`${count} magic-link invite${count === 1 ? '' : 's'} sent`);
      setShareEmails([]); setShareEmailDraft(''); setShareMessage('');
      setShareOpen(false);
    } catch (err) {
      toast.error(err?.message || 'Failed to send invites');
    } finally {
      setShareBusy(false);
    }
  };



  function resetForm() {
    setForm({
      title: '',
      application_no: '',
      filing_date: '',
      owner: '',
      type: 'Patent',
      openi_share: '',
      startup_id: null,
      startup_name: '',
    });
    // Phase 94 Ship 3 — also clear typeahead state.
    setStartupSearch('');
    setStartupResults([]);
  }

  async function handleAddRecord() {
    const title = form.title.trim();
    if (!title) {
      toast.error('Title of IP is required');
      return;
    }
    setSaving(true);
    try {
      // Backend payload shape per iprController.create. startup_id is left
      // null (no startup picker in this modal yet); Owner free-text + OpenI
      // ownership % are stashed in description so the data isn't lost.
      const ownerLine  = form.owner.trim() ? `Owner: ${form.owner.trim()}` : '';
      const shareLine  = form.openi_share !== '' ? `OpenI ownership: ${form.openi_share}%` : '';
      const description = [ownerLine, shareLine].filter(Boolean).join('\n');
      const payload = {
        startup_id: form.startup_id, // Phase 94 Ship 3 — was null, now from picker
        title,
        type: form.type || 'Patent',
        application_no: form.application_no.trim() || null,
        filing_date: form.filing_date || null,
        status: 'Filed',
        jurisdiction: 'IN',
        description: description || null,
      };
      await iprAPI.create(payload);
      toast.success('IPR record added');
      // Optimistic refresh — prepend the created row to the list. Falls back
      // to a full re-fetch if the response shape is unexpected.
      try {
        const data = await iprAPI.list();
        const records = data.records || data.ipr_records || data || [];
        const normalized = records.map(r => ({
          id: r.id,
          title: r.title || '',
          applicationNo: r.application_no || r.applicationNo || '',
          startup: r.startup_name || r.startup || '',
          type: r.type || 'Patent',
          status: r.status || 'Filed',
          jurisdiction: toJurisdictionArray(r.jurisdiction ?? r.jurisdictions),
          openi_share: r.openi_share || 0,
          startup_share: r.startup_share || 100,
          filingDate: r.filing_date ? new Date(r.filing_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : r.filingDate || '',
          grantDate: r.grant_date ? new Date(r.grant_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : r.grantDate || null,
          expiryDate: r.expiry_date ? new Date(r.expiry_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : r.expiryDate || '',
          licensing: r.licensing || 'None',
          inventors: Array.isArray(r.inventors) ? r.inventors : [],
        }));
        setIprRecords(normalized);
      } catch {
        // Refresh failed; the row is in the DB but list is stale. Page reload
        // will pick it up. Don't surface this as an error.
      }
      resetForm();
      setShowAdd(false);
    } catch (err) {
      // Surface the backend message if available (per Phase 64 pattern).
      const msg = err?.response?.data?.message || err?.message || 'Failed to save IPR record';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    // Phase 94 — admin/evaluator hit the full registry. Other personas hit
    // the org-filtered portfolio view (corporate/government via challenges,
    // investor/accelerator via JSONB chip-name matching).
    const fetcher = isAdmin ? iprAPI.list() : iprAPI.myPortfolio();
    fetcher
      .then(data => {
        const records = data.records || data.ipr_records || data || [];
        const normalized = records.map(r => ({
          id: r.id,
          title: r.title || '',
          applicationNo: r.application_no || r.applicationNo || '',
          startup: r.startup_name || r.startup || '',
          type: r.type || 'Patent',
          status: r.status || 'Filed',
          jurisdiction: toJurisdictionArray(r.jurisdiction ?? r.jurisdictions),
          openi_share: r.openi_share || 0,
          startup_share: r.startup_share || 100,
          filingDate: r.filing_date ? new Date(r.filing_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : r.filingDate || '',
          grantDate: r.grant_date ? new Date(r.grant_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : r.grantDate || null,
          expiryDate: r.expiry_date ? new Date(r.expiry_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : r.expiryDate || '',
          licensing: r.licensing || 'None',
          inventors: Array.isArray(r.inventors) ? r.inventors : [],
        }));
        setIprRecords(normalized);
      })
      .catch(err => { toast.error(err.message || 'Failed to load IPR records'); setIprRecords([]); })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only load; isAdmin is derived from the session user and stable for the session
  }, []);

  // Phase 94 Ship 3 — debounced startup search for the Add modal's
  // typeahead. Only fires when modal is open + admin + 2+ chars typed.
  // Race-guard via seqRef so a slow earlier response can't clobber a
  // fast later one (Phase 87b OrgTypeahead pattern).
  useEffect(() => {
    if (!showAdd || !isAdmin) return;
    const q = startupSearch.trim();
    if (q.length < 2) { setStartupResults([]); return; }
    setStartupLoading(true);
    const mySeq = ++startupSeqRef.current;
    const t = setTimeout(() => {
      startupAPI.list({ search: q, limit: 20 })
        .then(data => {
          if (mySeq !== startupSeqRef.current) return; // stale
          const rows = Array.isArray(data) ? data : (data?.startups || data?.rows || []);
          setStartupResults(rows);
        })
        .catch(() => {
          if (mySeq !== startupSeqRef.current) return;
          setStartupResults([]);
        })
        .finally(() => {
          if (mySeq === startupSeqRef.current) setStartupLoading(false);
        });
    }, 250);
  return () => clearTimeout(t);
  }, [startupSearch, showAdd, isAdmin]);

  if (loading) return <LoadingSkeleton type="table" />;

  const filtered = iprRecords.filter(r => {
    const matchSearch = (r.title || '').toLowerCase().includes(search.toLowerCase()) || (r.startup || '').toLowerCase().includes(search.toLowerCase());
    const matchType = type === 'All' || r.type === type;
    return matchSearch && matchType;
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div id="tour-page-ipr-header" className="flex items-center justify-between mb-6">
        <div>
          {/* Phase 94 — persona-aware title + subtitle */}
          <h1 className="text-2xl font-display font-bold text-gray-900">{isAdmin ? 'IPR Database' : 'IPR Portfolio'}</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {isAdmin
              ? 'Track patents, trademarks, and intellectual property across the OpenI ecosystem'
              : 'Patents, trademarks, and IP linked to your organization'}
          </p>
        </div>
        {/* Phase 94 — only admin/evaluator can create new IPR records */}
        {isAdmin && (
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-dark-950 rounded-lg font-semibold text-sm hover:bg-primary-400">
            <Plus size={16} /> Add IPR Record
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total IPR Records', value: iprRecords.length, color: 'text-gray-800' },
          { label: 'Patents Granted', value: iprRecords.filter(r => r.type === 'Patent' && r.status === 'Granted').length, color: 'text-accent-600' },
          { label: 'Under Review', value: iprRecords.filter(r => ['Filed', 'Published'].includes(r.status)).length, color: 'text-yellow-600' },
          { label: 'OpenI Co-owned', value: iprRecords.filter(r => r.openi_share > 0).length, color: 'text-primary-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className={`text-3xl font-display font-bold ${s.color}`}>{s.value}</div>
            <div className="text-gray-500 text-sm mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-primary-400 text-sm" placeholder="Search IPR records..." />
        </div>
        {['All', 'Patent', 'Trademark', 'Copyright'].map(t => (
          <button key={t} onClick={() => setType(t)} className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${type === t ? 'bg-primary-500 text-dark-950' : 'bg-white border border-gray-200 text-gray-600'}`}>{t}</button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">IPR Title</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Startup</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Type</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Status</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Jurisdiction</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">OpenI Share</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Filed</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(record => {
              const Icon = TYPE_ICONS[record.type] || Shield;
              return (
                <tr key={record.id} onClick={() => setSelected(record)} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer">
                  <td className="py-4 px-4 max-w-xs">
                    <div className="flex items-start gap-3">
                      <Icon size={16} className="text-primary-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-gray-800 leading-snug line-clamp-2">{record.title}</div>
                        <div className="text-xs text-gray-400 font-mono mt-0.5">{record.applicationNo}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-700">{record.startup}</td>
                  <td className="py-4 px-4">
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded font-medium">{record.type}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${STATUS_COLORS[record.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>{record.status}</span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex gap-1 flex-wrap">
                      {record.jurisdiction.map(j => <span key={j} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-xs rounded font-mono">{j}</span>)}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    {record.openi_share > 0 ? (
                      <div className="flex items-center gap-1 text-primary-700 text-sm font-semibold">
                        <Shield size={12} /> {record.openi_share}%
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-xs text-gray-500">{record.filingDate}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-5">
              <div>
                <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${STATUS_COLORS[selected.status] || 'bg-gray-100 text-gray-600 border-gray-200'} mb-2 inline-block`}>{selected.status}</span>
                <h3 className="font-display font-bold text-gray-900 text-lg leading-tight">{selected.title}</h3>
                <p className="text-xs text-gray-400 font-mono mt-1">{selected.applicationNo}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 text-xl font-bold hover:text-gray-600">×</button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-5">
              {[
                ['Type', selected.type], ['Startup', selected.startup], ['Filing Date', selected.filingDate],
                ['Grant Date', selected.grantDate || 'Pending'], ['Expiry Date', selected.expiryDate],
                ['OpenI Share', selected.openi_share > 0 ? `${selected.openi_share}%` : '—'],
                ['Startup Share', `${selected.startup_share}%`], ['Licensing', selected.licensing],
              ].map(([k, v]) => (
                <div key={k} className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-0.5">{k}</div>
                  <div className="text-sm font-semibold text-gray-800">{v}</div>
                </div>
              ))}
            </div>
            {selected.inventors.length > 0 && (
              <div className="mb-5">
                <div className="text-sm font-semibold text-gray-700 mb-2">Inventors</div>
                <div className="flex gap-2 flex-wrap">
                  {selected.inventors.map(inv => (
                    <span key={inv} className="px-3 py-1.5 bg-primary-50 text-primary-700 border border-primary-200 rounded-lg text-xs">{inv}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="mb-5">
              <div className="text-sm font-semibold text-gray-700 mb-2">Jurisdictions</div>
              <div className="flex gap-2">
                {selected.jurisdiction.map(j => <span key={j} className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-mono">{j}</span>)}
              </div>
            </div>
            <div className="flex gap-3">
              {/* Phase 111 Ship 2b: Share button (magic-link only) */}
              <button onClick={openIprShareModal} className="flex-1 py-2.5 bg-primary-500 text-dark-950 rounded-lg text-sm font-semibold inline-flex items-center justify-center gap-2">
                <Share2 size={14} /> Share Record
              </button>
              <button onClick={() => setSelected(null)} className="flex-1 py-2.5 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Add IPR Modal — Phase 89 wires controlled inputs + Save handler.
          Pre-Phase-89, every input was uncontrolled and Save just closed the
          modal (Phase 66 events bug pattern). */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <h3 className="font-display font-bold text-gray-900 text-lg mb-5">Add IPR Record</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">
                  Title of IP <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  maxLength={500}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary-400"
                  placeholder="Full title of the intellectual property"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Application Number</label>
                <input
                  type="text"
                  value={form.application_no}
                  onChange={e => setForm(p => ({ ...p, application_no: e.target.value }))}
                  maxLength={500}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary-400"
                  placeholder="IN2024XXXXXXX or PCT/IN2024/..."
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Filing Date</label>
                <input
                  type="date"
                  value={form.filing_date}
                  onChange={e => setForm(p => ({ ...p, filing_date: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary-400"
                />
              </div>
              {/* Phase 94 Ship 3 — startup typeahead (search-driven). Resolves
                  to startup_profiles.id so server-side per-org filtering can
                  link this IPR to the chosen startup. */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Startup (linked)</label>
                {form.startup_id ? (
                  <div className="flex items-center justify-between gap-2 px-3 py-2.5 border border-primary-300 bg-primary-50 rounded-lg">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">{form.startup_name}</div>
                      <div className="text-xs text-gray-500">ID #{form.startup_id}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm(p => ({ ...p, startup_id: null, startup_name: '' }))}
                      className="text-xs text-gray-500 hover:text-red-600 px-2 py-1"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="text"
                      value={startupSearch}
                      onChange={e => setStartupSearch(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary-400"
                      placeholder="Search startup by name (type 2+ chars)…"
                    />
                    {startupSearch.trim().length >= 2 && (
                      <div className="absolute top-full left-0 right-0 mt-1 max-h-64 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                        {startupLoading && (
                          <div className="px-3 py-2 text-xs text-gray-500">Searching…</div>
                        )}
                        {!startupLoading && startupResults.length === 0 && (
                          <div className="px-3 py-2 text-xs text-gray-500">No startups found — record will be saved without a startup link</div>
                        )}
                        {!startupLoading && startupResults.map(s => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              setForm(p => ({ ...p, startup_id: s.id, startup_name: s.company_name || s.name || `Startup #${s.id}` }));
                              setStartupSearch('');
                              setStartupResults([]);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-medium text-gray-900">{s.company_name || s.name || `Startup #${s.id}`}</div>
                            {(s.sector || s.city) && (
                              <div className="text-xs text-gray-500">{[s.sector, s.city].filter(Boolean).join(' • ')}</div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Co-owner / Notes (optional)</label>
                <input
                  type="text"
                  value={form.owner}
                  onChange={e => setForm(p => ({ ...p, owner: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary-400"
                  placeholder="e.g. IIT Madras (institutional co-owner)"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">IPR Type</label>
                  <select
                    value={form.type}
                    onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary-400"
                  >
                    <option value="Patent">Patent</option>
                    <option value="Trademark">Trademark</option>
                    <option value="Copyright">Copyright</option>
                    <option value="Design">Design</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">OpenI Ownership %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.openi_share}
                    onChange={e => {
                      const raw = e.target.value;
                      if (raw === '') { setForm(p => ({ ...p, openi_share: '' })); return; }
                      let n = Number(raw);
                      if (Number.isNaN(n)) return;
                      if (n < 0) n = 0;
                      if (n > 100) n = 100;
                      setForm(p => ({ ...p, openi_share: n }));
                    }}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary-400"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => { resetForm(); setShowAdd(false); }}
                disabled={saving}
                className="flex-1 py-2.5 border border-gray-300 text-gray-600 rounded-lg text-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddRecord}
                disabled={saving || !form.title.trim()}
                className="flex-1 py-2.5 bg-primary-500 text-dark-950 rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving…' : 'Save Record'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Phase 111 Ship 2b: IPR Share modal (magic-link only per D3) */}
      {shareOpen && selected && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={(e) => { if (e.target === e.currentTarget) setShareOpen(false); }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 560, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>Share IPR Record</h2>
              <button onClick={() => setShareOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6e6e6e', padding: 4 }}>
                <X size={16} />
              </button>
            </div>

            {/* Tab strip — only PDF + Email (no Public link per D3) */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 18, borderBottom: '1.5px solid #eee' }}>
              {[
                { id: 'pdf',   icon: <FileDown size={13} />, label: 'Download PDF' },
                { id: 'email', icon: <Mail size={13} />, label: 'Invite by email' },
              ].map(t => (
                <button key={t.id} onClick={() => setShareTab(t.id)}
                  style={{ padding: '10px 14px', fontSize: 12, fontWeight: 700, background: 'none', border: 'none',
                           borderBottom: shareTab === t.id ? '2.5px solid #D0A848' : '2.5px solid transparent',
                           marginBottom: -1.5, color: shareTab === t.id ? '#D0A848' : '#666', cursor: 'pointer',
                           display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            {shareTab === 'pdf' && (
              <div>
                <p style={{ fontSize: 12, color: '#666', margin: '0 0 14px', lineHeight: 1.6 }}>
                  Branded PDF of this IPR record (admin/evaluator gate enforced by backend).
                </p>
                <button onClick={downloadIprPdf}
                  style={{ width: '100%', padding: '11px 18px', background: '#D0A848', color: '#0D2137', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <FileDown size={14} /> Download IPR PDF
                </button>
              </div>
            )}

            {shareTab === 'email' && (
              <div>
                <p style={{ fontSize: 12, color: '#666', margin: '0 0 14px', lineHeight: 1.6 }}>
                  Send a magic-link to one or more email recipients. They sign up for an OpenI account, sign in, and access the IPR record via /dashboard/ipr. <strong>No public token mode</strong> — IPR data is too sensitive for anyone-with-the-URL access.
                </p>

                {/* Email input */}
                <label style={{ fontSize: 11, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>Add recipient emails</label>
                <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                  <input value={shareEmailDraft} onChange={e => setShareEmailDraft(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addShareEmail(); } }}
                    placeholder="recipient@example.com — press Enter"
                    style={{ flex: 1, padding: '9px 12px', background: '#fafafa', border: '1.5px solid #e0e0e0', borderRadius: 9, fontSize: 16, outline: 'none' }} />
                  <button type="button" onClick={addShareEmail}
                    style={{ padding: '9px 14px', background: '#f5f5f5', border: '1.5px solid #e0e0e0', borderRadius: 9, fontSize: 12, fontWeight: 600, color: '#555', cursor: 'pointer' }}>
                    Add
                  </button>
                </div>
                {shareEmails.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                    {shareEmails.map(em => (
                      <span key={em} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: 14, padding: '4px 10px', fontSize: 11, color: '#1e40af' }}>
                        <Mail size={10} /> {em}
                        <button onClick={() => setShareEmails(prev => prev.filter(x => x !== em))}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                          <X size={11} color="#1e40af" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <label style={{ fontSize: 11, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>Personal message (optional)</label>
                <textarea value={shareMessage} onChange={e => setShareMessage(e.target.value)} rows={2}
                  placeholder="Add a note - what excites you about this IPR record."
                  style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', background: '#fafafa', border: '1.5px solid #e0e0e0', borderRadius: 9, fontSize: 16, outline: 'none', resize: 'vertical', marginBottom: 14 }} />

                <button onClick={sendIprEmailInvite} disabled={shareBusy || shareEmails.length === 0}
                  style={{ width: '100%', padding: '10px 16px', background: (shareEmails.length === 0 || shareBusy) ? '#ccc' : '#D0A848', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: (shareEmails.length === 0 || shareBusy) ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Mail size={14} /> {shareBusy ? 'Sending...' : 'Send magic-link invites'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>

  );
}
