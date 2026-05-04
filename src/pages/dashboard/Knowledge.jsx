import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { knowledgeAPI } from '../../services/api';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import { BookOpen, Search, Lock, Eye, FileText, PlayCircle, Bookmark, Plus, ExternalLink, Star, Download } from 'lucide-react';

const TYPE_ICONS = { report: FileText, article: BookOpen, sop: Bookmark, training_module: PlayCircle };
const ACCESS_COLORS = { public: 'bg-accent-100 text-accent-700', registered: 'bg-blue-100 text-blue-700', restricted: 'bg-yellow-100 text-yellow-700', classified: 'bg-red-100 text-red-700' };

export default function Knowledge() {
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [selected, setSelected] = useState(null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

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
        <button className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-dark-950 rounded-lg font-semibold text-sm hover:bg-primary-400">
          <Plus size={16} /> Add Article
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
          const Icon = TYPE_ICONS[article.type] || BookOpen;
          return (
            <div key={article.id} onClick={() => setSelected(article)} className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-all cursor-pointer group">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-primary-200">
                  <Icon size={22} className="text-primary-600" />
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
    </div>
  );
}
