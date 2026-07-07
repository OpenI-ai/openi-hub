import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { knowledgeAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';  // Ship #5 (22 May 2026)
import LoadingSkeleton from '../../components/LoadingSkeleton';
import AddArticleModal from '../../components/knowledge/AddArticleModal'; // Phase 121
import {
  BookOpen, Search, Lock, Eye, EyeOff, FileText, PlayCircle, Bookmark, Plus, ExternalLink, Download,
  Brain, Zap, TrendingUp, ShoppingBag, Shirt, Heart, Building2, Shield, Cpu, FlaskConical, Layers,
  Briefcase, Trash2,
} from 'lucide-react';

const TYPE_ICONS = { report: FileText, article: BookOpen, sop: Bookmark, training_module: PlayCircle, case_study: Briefcase };

// s49: per-sector icons + colors so report cards aren't all identical FileText.
// Sector is read from the first tag (Strapi reports merge via tags[]).
const SECTOR_ICONS = {
  'Agentic AI': Brain, 'DeepTech': Zap, 'FinTech': TrendingUp, 'CPG': ShoppingBag,
  'FashionTech': Shirt, 'ImpactTech': Heart, 'ConstructionTech': Building2,
  'Cyber Security': Shield, 'AI': Cpu, 'AI/ML': Cpu, 'Defence': Shield,
  'CleanTech': FlaskConical, 'HealthTech': Heart, 'Quantum': Layers, 'Semiconductor': Cpu,
};
const SECTOR_COLORS = {
  'Agentic AI': '#8b5cf6', 'DeepTech': '#D0A848', 'FinTech': '#3b82f6', 'CPG': '#f97316',
  'FashionTech': '#ec4899', 'ImpactTech': '#10b981', 'ConstructionTech': '#78716c',
  'Cyber Security': '#ef4444', 'AI': '#6366f1', 'AI/ML': '#6366f1', 'Defence': '#16a34a',
  'CleanTech': '#10b981', 'HealthTech': '#ef4444', 'Quantum': '#06b6d4', 'Semiconductor': '#f97316',
};

const ACCESS_COLORS = { public: 'bg-accent-100 text-accent-700', registered: 'bg-blue-100 text-blue-700', restricted: 'bg-yellow-100 text-yellow-700', classified: 'bg-red-100 text-red-700' };

export default function Knowledge() {
  const { user } = useAuth();
  // Phase 121 — three-tier "who can add content" gate: true admin, evaluator, or
  // an approved contributor. Moderation (take-down/delete of ANY article) is
  // admin-only; authors may take down their own article regardless of role.
  const isAdminOrEvaluator = user?.role === 'admin' || user?.role === 'evaluator';
  const isTrueAdmin = user?.role === 'admin';
  const isContributor = user?.is_knowledge_contributor === true;
  const canAdd = isAdminOrEvaluator || isContributor;

  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [selected, setSelected] = useState(null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  // Ship #5 — Suggest Article modal state (non-admin only)
  const [showSuggest, setShowSuggest] = useState(false);
  const [suggestForm, setSuggestForm] = useState({ title: '', summary: '', suggested_url: '', suggested_type: 'article' });
  const [suggesting, setSuggesting] = useState(false);
  // Phase 121 — Add Article modal + contributor self-service request state
  const [showAddModal, setShowAddModal] = useState(false);
  const [contribInfo, setContribInfo] = useState(null);
  const [requesting, setRequesting] = useState(false);

  const submitSuggestion = async () => {
    const t = (suggestForm.title || '').trim();
    if (!t) { toast.error('Title is required'); return; }
    setSuggesting(true);
    try {
      await knowledgeAPI.suggest(suggestForm);
      toast.success('Suggestion sent to admin');
      setShowSuggest(false);
      setSuggestForm({ title: '', summary: '', suggested_url: '', suggested_type: 'article' });
    } catch (err) {
      toast.error(err.message || 'Failed to send suggestion');
    } finally {
      setSuggesting(false);
    }
  };

  // Phase 121 — self-service "request contributor access" (only relevant for
  // users who aren't already admin/evaluator/contributor).
  const requestContributorAccess = async () => {
    setRequesting(true);
    try {
      await knowledgeAPI.requestContributor();
      toast.success('Request sent — an admin will review it');
      const data = await knowledgeAPI.myContributorStatus();
      setContribInfo(data);
    } catch (err) {
      toast.error(err.message || 'Failed to send request');
    } finally {
      setRequesting(false);
    }
  };

  useEffect(() => {
    if (canAdd) return; // already able to add — no need to check request status
    knowledgeAPI.myContributorStatus()
      .then(data => setContribInfo(data))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount / when canAdd resolves
  }, [canAdd]);

  // Phase 121 — admin (any article) or the article's author (own article only)
  // may take it down / republish it. Hard delete stays admin-only.
  const toggleAdminPublish = async (article) => {
    const nextPublished = article.is_published === false;
    try {
      await knowledgeAPI.update(article.id, { is_published: nextPublished });
      setArticles(prev => prev.map(a => (a.id === article.id ? { ...a, is_published: nextPublished } : a)));
      setSelected(sel => (sel && sel.id === article.id ? { ...sel, is_published: nextPublished } : sel));
      toast.success(nextPublished ? 'Article published' : 'Article taken down');
    } catch (err) {
      toast.error(err.message || 'Failed to update article');
    }
  };

  const deleteArticleHandler = async (article) => {
    if (!window.confirm(`Permanently delete "${article.title}"? This cannot be undone.`)) return;
    try {
      await knowledgeAPI.delete(article.id);
      setArticles(prev => prev.filter(a => a.id !== article.id));
      setSelected(null);
      toast.success('Article deleted');
    } catch (err) {
      toast.error(err.message || 'Failed to delete article');
    }
  };

  const handleArticleCreated = (created) => {
    setArticles(prev => [{
      id: created.id,
      title: created.title || '',
      type: created.type || created.category || 'article',
      access: created.access || 'registered',
      source: created.source || created.author_name || user?.name || 'You',
      date: created.created_at ? new Date(created.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
      summary: created.summary || created.content || '',
      tags: created.tags || [],
      sector: created.sector || null,
      views: 0,
      pdf_url: null,
      file_url: created.file_url || null,
      file_name: created.file_name || null,
      is_published: created.is_published !== undefined ? created.is_published : true,
      author_id: created.author_id ?? user?.id ?? null,
      is_public: created.is_public || false,
    }, ...prev]);
  };

  // s49 fix: dismiss the report modal on Escape key for keyboard users
  useEffect(() => {
    if (!selected) return;
    const onKeyDown = (e) => { if (e.key === 'Escape') setSelected(null); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selected]);

  useEffect(() => {
    knowledgeAPI.list()
      .then(data => {
        const items = data.articles || data.knowledge_articles || data || [];
        const normalized = items.map(a => ({
          id: a.id,
          title: a.title || '',
          type: a.type || a.category || 'article',
          access: a.access || 'registered',
          source: a.source || a.author_name || 'DRDO',
          date: a.created_at ? new Date(a.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : a.date || '',
          summary: a.summary || a.content || '',
          tags: a.tags || [],
          sector: a.sector || null,
          views: a.views || 0, pdf_url: a.pdf_url || null,
          file_url: a.file_url || null,
          file_name: a.file_name || null,
          is_published: a.is_published !== undefined ? a.is_published : true,
          author_id: a.author_id ?? null,
          is_public: a.is_public || false,
        }));
        setArticles(normalized);
      })
      .catch(err => { toast.error(err.message || 'Failed to load articles'); setArticles([]); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSkeleton type="card" />;

  const filtered = articles.filter(a => {
    const matchSearch = (a.title || '').toLowerCase().includes(search.toLowerCase()) || (a.tags || []).some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchType = type === 'all' || a.type === type;
    return matchSearch && matchType;
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Knowledge Hub</h1>
          <p className="text-gray-500 text-sm mt-0.5">Industry reports, SOPs, and curated research for OpenI's innovation ecosystem</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {/* Phase 121 — canAdd (admin/evaluator/approved contributor) opens the real Add Article modal; everyone else sends a suggestion */}
          <button
            onClick={() => {
              if (canAdd) setShowAddModal(true);
              else setShowSuggest(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-dark-950 rounded-lg font-semibold text-sm hover:bg-primary-400"
          >
            <Plus size={16} /> {canAdd ? 'Add Article' : 'Suggest an Article'}
          </button>
          {!canAdd && (
            contribInfo?.request?.status === 'pending' ? (
              <span className="text-xs text-gray-400">Contributor request pending review</span>
            ) : contribInfo?.request?.status === 'rejected' ? (
              <span className="text-xs text-red-500">Contributor request rejected</span>
            ) : (
              <button onClick={requestContributorAccess} disabled={requesting} className="text-xs text-primary-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed">
                {requesting ? 'Sending…' : 'Request contributor access'}
              </button>
            )
          )}
        </div>
      </div>

      <div id="tour-page-knowledge-search" className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-primary-400 text-sm" placeholder="Search reports, guides, articles..." />
        </div>
        {[['all', 'All'], ['report', 'Reports'], ['article', 'Articles'], ['sop', 'SOPs & Guides'], ['training_module', 'Training'], ['case_study', 'Case Studies']].map(([k, label]) => (
          <button key={k} onClick={() => setType(k)} className={`px-3 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap ${type === k ? 'bg-primary-500 text-dark-950' : 'bg-white border border-gray-200 text-gray-600'}`}>{label}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(article => {
          // Phase 124: prefer the dedicated sector field; fall back to s49's
          // tag-based sniffing (for articles created before sector existed).
          const sectorTag = article.sector || (article.tags || []).find(t => SECTOR_ICONS[t]);
          const Icon = sectorTag && SECTOR_ICONS[sectorTag] ? SECTOR_ICONS[sectorTag] : (TYPE_ICONS[article.type] || BookOpen);
          const sectorColor = sectorTag && SECTOR_COLORS[sectorTag] ? SECTOR_COLORS[sectorTag] : '#D0A848';
          return (
            <div key={article.id} onClick={() => setSelected(article)} className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-all cursor-pointer group"
              style={{ transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = sectorColor; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; }}>
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: `${sectorColor}15`,
                    border: `1px solid ${sectorColor}30`,
                  }}>
                  <Icon size={22} style={{ color: sectorColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-1">
                    <h3 className="font-display font-bold text-gray-900 text-sm leading-snug flex-1">{article.title}</h3>
                    {article.is_published === false && (
                      <span className="px-2 py-0.5 text-xs rounded-full font-medium flex-shrink-0 bg-gray-200 text-gray-600">Unpublished</span>
                    )}
                    {article.sector && (
                      <span
                        className="px-2 py-0.5 text-xs rounded-full font-medium flex-shrink-0"
                        style={{ background: `${sectorColor}15`, color: sectorColor, border: `1px solid ${sectorColor}30` }}
                      >
                        {article.sector}
                      </span>
                    )}
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium flex-shrink-0 ${ACCESS_COLORS[article.access]}`}>{article.access}</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{article.source} · {article.date}</p>
                  <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">{article.summary}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex gap-1 flex-wrap flex-1">
                      {article.tags.map(tag => <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">{tag}</span>)}
                    </div>
                    {article.file_url && (
                      <a href={article.file_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="flex items-center gap-1 text-xs text-primary-600 flex-shrink-0 hover:underline">
                        <Download size={11} /> File
                      </a>
                    )}
                    <div className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
                      <Eye size={11} /> {article.views.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${ACCESS_COLORS[selected.access]} mb-2 inline-block capitalize`}>{selected.access}</span>
                {selected.is_published === false && (
                  <span className="px-2 py-0.5 text-xs rounded-full font-medium bg-gray-200 text-gray-600 mb-2 ml-2 inline-block">Unpublished</span>
                )}
                {selected.sector && (
                  <span
                    className="px-2 py-0.5 text-xs rounded-full font-medium mb-2 ml-2 inline-block"
                    style={{
                      background: `${SECTOR_COLORS[selected.sector] || '#D0A848'}15`,
                      color: SECTOR_COLORS[selected.sector] || '#D0A848',
                      border: `1px solid ${SECTOR_COLORS[selected.sector] || '#D0A848'}30`,
                    }}
                  >
                    {selected.sector}
                  </span>
                )}
                <h3 className="font-display font-bold text-gray-900 text-lg leading-snug">{selected.title}</h3>
                <p className="text-xs text-gray-400 mt-1">{selected.source} · {selected.date} · {selected.views.toLocaleString()} views</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 text-xl font-bold hover:text-gray-600">×</button>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed mb-5">{selected.summary}</p>
            <div className="flex gap-2 mb-5 flex-wrap">
              {selected.tags.map(tag => <span key={tag} className="px-2.5 py-1 bg-primary-50 text-primary-700 border border-primary-200 text-xs rounded-lg">{tag}</span>)}
            </div>
            {selected.access === 'classified' ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                <Lock size={18} className="text-red-500" />
                <p className="text-sm text-red-700">This document is classified. Request access through OpenI secure portal.</p>
              </div>
            ) : (selected.file_url || selected.pdf_url) ? (
              <div className="flex gap-3">
                <a href={selected.file_url || selected.pdf_url} target="_blank" rel="noopener noreferrer" className="flex-1 py-2.5 bg-primary-500 text-dark-950 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 no-underline"><ExternalLink size={14} /> Read Full Report</a>
                <a href={selected.file_url || selected.pdf_url} download className="flex-1 py-2.5 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium flex items-center justify-center gap-2 no-underline"><Download size={14} /> Download</a>
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No attachment for this item.</p>
            )}

            {/* Phase 121 — moderation: admin can take down/publish/delete ANY article; an author can take down/publish their own */}
            {(isTrueAdmin || (user?.id && selected.author_id === user.id)) && (
              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                <button onClick={() => toggleAdminPublish(selected)} className="flex-1 py-2 border border-gray-300 text-gray-600 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-gray-50">
                  {selected.is_published === false ? (<><Eye size={13} /> Publish</>) : (<><EyeOff size={13} /> Take down</>)}
                </button>
                {isTrueAdmin && (
                  <button onClick={() => deleteArticleHandler(selected)} className="flex-1 py-2 border border-red-300 text-red-600 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-red-50">
                    <Trash2 size={13} /> Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Phase 121 — Add Knowledge Hub content modal (admin/evaluator/approved contributor) */}
      <AddArticleModal open={showAddModal} onClose={() => setShowAddModal(false)} onCreated={handleArticleCreated} />

      {/* Ship #5 (22 May 2026) — Suggest an Article modal (non-admin only) */}
      {showSuggest && (
        <div onClick={() => setShowSuggest(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div role="dialog" onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, padding: 24, maxWidth: 520, width: '100%', boxShadow: '0 10px 40px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#111' }}>Suggest an Article</h3>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#666' }}>Send a suggestion to the OpenI Knowledge Hub team. We will review and add it if it fits.</p>
              </div>
              <button onClick={() => setShowSuggest(false)} style={{ background: 'none', border: 'none', fontSize: 22, color: '#999', cursor: 'pointer', lineHeight: 1, padding: 0 }}>&times;</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Title <span style={{ color: '#ef4444' }}>*</span></label>
                <input value={suggestForm.title} onChange={e => setSuggestForm(p => ({ ...p, title: e.target.value }))} maxLength={500} style={{ width: '100%', padding: '8px 10px', fontSize: 16, border: '1px solid #e5e7eb', borderRadius: 8, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Summary</label>
                <textarea value={suggestForm.summary} onChange={e => setSuggestForm(p => ({ ...p, summary: e.target.value }))} maxLength={5000} rows={4} style={{ width: '100%', padding: '8px 10px', fontSize: 16, border: '1px solid #e5e7eb', borderRadius: 8, outline: 'none', boxSizing: 'border-box', resize: 'vertical' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Source URL (optional)</label>
                <input value={suggestForm.suggested_url} onChange={e => setSuggestForm(p => ({ ...p, suggested_url: e.target.value }))} placeholder="https://..." style={{ width: '100%', padding: '8px 10px', fontSize: 16, border: '1px solid #e5e7eb', borderRadius: 8, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Type</label>
                <select value={suggestForm.suggested_type} onChange={e => setSuggestForm(p => ({ ...p, suggested_type: e.target.value }))} style={{ width: '100%', padding: '8px 10px', fontSize: 16, border: '1px solid #e5e7eb', borderRadius: 8, outline: 'none', boxSizing: 'border-box', background: '#fff' }}>
                  <option value="article">Article</option>
                  <option value="report">Report</option>
                  <option value="sop">SOP / Guide</option>
                  <option value="training_module">Training Module</option>
                  <option value="case_study">Case Study</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button onClick={() => setShowSuggest(false)} style={{ padding: '8px 16px', fontSize: 12, background: '#f3f4f6', color: '#555', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button onClick={submitSuggestion} disabled={suggesting} style={{ padding: '8px 16px', fontSize: 12, background: '#D0A848', color: '#fff', border: 'none', borderRadius: 8, cursor: suggesting ? 'not-allowed' : 'pointer', fontWeight: 700, opacity: suggesting ? 0.6 : 1 }}>
                {suggesting ? 'Sending...' : 'Send Suggestion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
