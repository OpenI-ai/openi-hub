import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { knowledgeAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';  // Ship #5 (22 May 2026)
import LoadingSkeleton from '../../components/LoadingSkeleton';
import {
  BookOpen, Search, Lock, Eye, FileText, PlayCircle, Bookmark, Plus, ExternalLink, Download,
  Brain, Zap, TrendingUp, ShoppingBag, Shirt, Heart, Building2, Shield, Cpu, FlaskConical, Layers,
} from 'lucide-react';

const TYPE_ICONS = { report: FileText, article: BookOpen, sop: Bookmark, training_module: PlayCircle };

// s49: per-sector icons + colors so report cards aren't all identical FileText.
// Sector is read from the first tag (Strapi reports merge via tags[]).
const SECTOR_ICONS = {
  'Agentic AI': Brain, 'DeepTech': Zap, 'FinTech': TrendingUp, 'CPG': ShoppingBag,
  'FashionTech': Shirt, 'ImpactTech': Heart, 'ConstructionTech': Building2,
  'Cyber Security': Shield, 'AI': Cpu, 'AI/ML': Cpu, 'Defence': Shield,
  'CleanTech': FlaskConical, 'HealthTech': Heart, 'Quantum': Layers, 'Semiconductor': Cpu,
};
const SECTOR_COLORS = {
  'Agentic AI': '#8b5cf6', 'DeepTech': '#D5AA5B', 'FinTech': '#3b82f6', 'CPG': '#f97316',
  'FashionTech': '#ec4899', 'ImpactTech': '#10b981', 'ConstructionTech': '#78716c',
  'Cyber Security': '#ef4444', 'AI': '#6366f1', 'AI/ML': '#6366f1', 'Defence': '#16a34a',
  'CleanTech': '#10b981', 'HealthTech': '#ef4444', 'Quantum': '#06b6d4', 'Semiconductor': '#f97316',
};

const ACCESS_COLORS = { public: 'bg-accent-100 text-accent-700', registered: 'bg-blue-100 text-blue-700', restricted: 'bg-yellow-100 text-yellow-700', classified: 'bg-red-100 text-red-700' };

export default function Knowledge() {
  // Ship #5 (22 May 2026) — gate Add Article button by role
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'evaluator';
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [selected, setSelected] = useState(null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  // Ship #5 — Suggest Article modal state (non-admin only)
  const [showSuggest, setShowSuggest] = useState(false);
  const [suggestForm, setSuggestForm] = useState({ title: '', summary: '', suggested_url: '', suggested_type: 'article' });
  const [suggesting, setSuggesting] = useState(false);

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
          views: a.views || 0, pdf_url: a.pdf_url || null,
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Knowledge Hub</h1>
          <p className="text-gray-500 text-sm mt-0.5">Industry reports, SOPs, and curated research for OpenI's innovation ecosystem</p>
        </div>
        {/* Ship #5 (22 May 2026) — non-admin clicks open Suggest modal; admin button still stub (admin uses backend / admin console) */}
        <button
          onClick={() => {
            if (isAdmin) {
              toast('Admin: use the Knowledge admin console or POST /knowledge', { icon: 'i' });
            } else {
              setShowSuggest(true);
            }
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-dark-950 rounded-lg font-semibold text-sm hover:bg-primary-400"
        >
          <Plus size={16} /> {isAdmin ? 'Add Article' : 'Suggest an Article'}
        </button>
      </div>

      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-primary-400 text-sm" placeholder="Search reports, guides, articles..." />
        </div>
        {[['all', 'All'], ['report', 'Reports'], ['article', 'Articles'], ['sop', 'SOPs & Guides'], ['training_module', 'Training']].map(([k, label]) => (
          <button key={k} onClick={() => setType(k)} className={`px-3 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap ${type === k ? 'bg-primary-500 text-dark-950' : 'bg-white border border-gray-200 text-gray-600'}`}>{label}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(article => {
          // s49: pick icon by sector (first tag), fall back to type-default, fall back to BookOpen
          const sectorTag = (article.tags || []).find(t => SECTOR_ICONS[t]);
          const Icon = sectorTag ? SECTOR_ICONS[sectorTag] : (TYPE_ICONS[article.type] || BookOpen);
          const sectorColor = sectorTag ? SECTOR_COLORS[sectorTag] : '#D5AA5B';
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
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium flex-shrink-0 ${ACCESS_COLORS[article.access]}`}>{article.access}</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{article.source} · {article.date}</p>
                  <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">{article.summary}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex gap-1 flex-wrap flex-1">
                      {article.tags.map(tag => <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">{tag}</span>)}
                    </div>
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
            ) : (
              <div className="flex gap-3">
                <a href={selected.pdf_url || "/"} target="_blank" rel="noopener noreferrer" className="flex-1 py-2.5 bg-primary-500 text-dark-950 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 no-underline"><ExternalLink size={14} /> Read Full Report</a>
                <a href={selected.pdf_url || "/"} download className="flex-1 py-2.5 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium flex items-center justify-center gap-2 no-underline"><Download size={14} /> Download PDF</a>
              </div>
            )}
          </div>
        </div>
      )}

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
                <input value={suggestForm.title} onChange={e => setSuggestForm(p => ({ ...p, title: e.target.value }))} maxLength={500} style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 8, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Summary</label>
                <textarea value={suggestForm.summary} onChange={e => setSuggestForm(p => ({ ...p, summary: e.target.value }))} maxLength={5000} rows={4} style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 8, outline: 'none', boxSizing: 'border-box', resize: 'vertical' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Source URL (optional)</label>
                <input value={suggestForm.suggested_url} onChange={e => setSuggestForm(p => ({ ...p, suggested_url: e.target.value }))} placeholder="https://..." style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 8, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Type</label>
                <select value={suggestForm.suggested_type} onChange={e => setSuggestForm(p => ({ ...p, suggested_type: e.target.value }))} style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 8, outline: 'none', boxSizing: 'border-box', background: '#fff' }}>
                  <option value="article">Article</option>
                  <option value="report">Report</option>
                  <option value="sop">SOP / Guide</option>
                  <option value="training_module">Training Module</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button onClick={() => setShowSuggest(false)} style={{ padding: '8px 16px', fontSize: 12, background: '#f3f4f6', color: '#555', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button onClick={submitSuggestion} disabled={suggesting} style={{ padding: '8px 16px', fontSize: 12, background: '#D5AA5B', color: '#fff', border: 'none', borderRadius: 8, cursor: suggesting ? 'not-allowed' : 'pointer', fontWeight: 700, opacity: suggesting ? 0.6 : 1 }}>
                {suggesting ? 'Sending...' : 'Send Suggestion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
