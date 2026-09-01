import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Sparkles, Brain } from 'lucide-react';
import { publicAPI } from '../services/api';

const G = '#D0A848';

/**
 * Reusable SearchBar with debounced autocomplete suggestions.
 * Props:
 *   - compact: boolean (smaller variant for header)
 *   - onSearch: (query, mode) => void (override navigation behavior, receives mode)
 *   - placeholder: string
 *   - showSemanticToggle: boolean — show the "Semantic" (vector) toggle
 *   - showAiToggle: boolean — show the "AI Ask" (LLM query-parsing) toggle
 *   - initialMode: 'keyword' | 'semantic' | 'ai' — starting mode (from URL param)
 */
export default function SearchBar({
  compact = false,
  onSearch,
  placeholder = 'Search challenges, startups, people...',
  showSemanticToggle = false,
  showAiToggle = false,
  showMapSuggestions = false,
  initialMode = 'keyword',
}) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  // s107 — Innovation Map term matches shown above the regular suggestions
  // (auth-gated surfaces only; the maps API needs a session).
  const [mapMatches, setMapMatches] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mode, setMode] = useState(initialMode); // 'keyword' | 'semantic' | 'ai'
  const [, setLoading] = useState(false);
  const navigate = useNavigate();
  const ref = useRef(null);
  const timer = useRef(null);
  // Lazily fetched once per mount, then matched client-side — 118 terms.
  const mapTermsRef = useRef(null);

  const DIM_LABEL = { sector: 'Sector', technology: 'Technology', function: 'Function', usecase: 'Use case' };

  useEffect(() => {
    if (!showMapSuggestions || mode === 'ai') { setMapMatches([]); return; }
    const q = query.trim().toLowerCase();
    if (q.length < 2) { setMapMatches([]); return; }
    let cancelled = false;
    const match = (terms) => {
      const hits = terms
        .filter(t => t.label.toLowerCase().includes(q))
        .sort((a, b) => b.member_count - a.member_count)
        .slice(0, 4);
      if (!cancelled) {
        setMapMatches(hits);
        if (hits.length) setShowDropdown(true);
      }
    };
    if (mapTermsRef.current) { match(mapTermsRef.current); return; }
    import('../services/clusterAPI').then(({ mapsAPI }) => mapsAPI.list()).then(d => {
      mapTermsRef.current = (d.dimensions || []).flatMap(dim =>
        dim.terms.filter(t => t.member_count > 0).map(t => ({ ...t, dimension: dim.dimension }))
      );
      match(mapTermsRef.current);
    }).catch(() => { /* unauthenticated surface or API down — no map rows */ });
    return () => { cancelled = true; };
  }, [query, mode, showMapSuggestions]);

  // Sync mode with prop (e.g. when URL changes)
  useEffect(() => { setMode(initialMode); }, [initialMode]);

  // Dynamic placeholder based on mode
  const effectivePlaceholder =
    mode === 'ai'
      ? 'Ask anything — "deeptech AI startups in Bangalore"'
      : mode === 'semantic'
      ? 'Describe what you are looking for...'
      : placeholder;

  // Debounced autocomplete (disable in AI mode — user is typing a full sentence)
  useEffect(() => {
    if (mode === 'ai') { setSuggestions([]); setShowDropdown(false); return; }
    if (query.trim().length < 2) { setSuggestions([]); return; }
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        setLoading(true);
        const data = await publicAPI.searchSuggest(query.trim());
        setSuggestions(data.suggestions || []);
        setShowDropdown(true);
      } catch (_e) { /* non-fatal, debounced search */ } finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(timer.current);
  }, [query, mode]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setShowDropdown(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const doSearch = (q) => {
    const term = (q || query).trim();
    if (!term) return;
    setShowDropdown(false);
    if (onSearch) { onSearch(term, mode); }
    else {
      const modeParam = mode !== 'keyword' ? `&mode=${mode}` : '';
      navigate(`/search?q=${encodeURIComponent(term)}${modeParam}`);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') doSearch();
    if (e.key === 'Escape') setShowDropdown(false);
  };

  // Toggle AI mode (mutually exclusive with semantic)
  const toggleAi = () => setMode(mode === 'ai' ? 'keyword' : 'ai');
  // Toggle semantic mode (mutually exclusive with AI)
  const toggleSemantic = () => setMode(mode === 'semantic' ? 'keyword' : 'semantic');

  const TYPE_ICONS = { sector: '\uD83C\uDF10', technology: '\uD83D\uDCA1', industry: '\uD83C\uDFED', startup: '\uD83D\uDE80', person: '\uD83D\uDC64' };

  return (
    <div ref={ref} style={{ position: 'relative', width: compact ? 260 : '100%', maxWidth: 560 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: compact ? 'rgba(255,255,255,0.08)' : '#fff',
        border: compact ? '1px solid rgba(255,255,255,0.15)' : `1.5px solid ${mode === 'ai' ? G : '#ddd'}`,
        borderRadius: 10, padding: compact ? '6px 12px' : '10px 16px',
        transition: 'border-color 0.2s',
      }}>
        {mode === 'ai'
          ? <Brain size={compact ? 15 : 18} style={{ color: G, flexShrink: 0 }} />
          : <Search size={compact ? 15 : 18} style={{ color: compact ? 'rgba(255,255,255,0.5)' : '#999', flexShrink: 0 }} />}
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => (suggestions.length || mapMatches.length) && setShowDropdown(true)}
          placeholder={effectivePlaceholder}
          style={{
            flex: 1, border: 'none', background: 'transparent',
            fontSize: compact ? 13 : 15,
            color: compact ? '#fff' : '#1a1a2e',
          }}
        />
        {query && (
          <X size={14} style={{ cursor: 'pointer', color: '#666' }} onClick={() => { setQuery(''); setSuggestions([]); }} />
        )}
        {showAiToggle && (
          <button
            onClick={toggleAi}
            title={mode === 'ai' ? 'AI Ask (natural language → filters)' : 'Enable AI Ask'}
            style={{
              background: mode === 'ai' ? G : 'transparent',
              border: `1px solid ${mode === 'ai' ? G : '#ccc'}`,
              borderRadius: 6, padding: '3px 8px',
              display: 'flex', alignItems: 'center', gap: 4,
              cursor: 'pointer', fontSize: 11, color: mode === 'ai' ? '#fff' : '#666',
              transition: 'all 0.2s', fontWeight: 600,
            }}
          >
            <Brain size={12} /> AI Ask
          </button>
        )}
        {showSemanticToggle && (
          <button
            onClick={toggleSemantic}
            title={mode === 'semantic' ? 'Semantic search (vector)' : 'Enable semantic search'}
            style={{
              background: mode === 'semantic' ? G : 'transparent',
              border: `1px solid ${mode === 'semantic' ? G : '#ccc'}`,
              borderRadius: 6, padding: '3px 8px',
              display: 'flex', alignItems: 'center', gap: 4,
              cursor: 'pointer', fontSize: 11, color: mode === 'semantic' ? '#fff' : '#666',
              transition: 'all 0.2s',
            }}
          >
            <Sparkles size={12} /> Semantic
          </button>
        )}
        <button
          onClick={() => doSearch()}
          style={{
            background: G, color: '#fff', border: 'none', borderRadius: 8,
            padding: compact ? '5px 12px' : '8px 16px',
            cursor: 'pointer', fontSize: compact ? 12 : 14, fontWeight: 600,
            whiteSpace: 'nowrap',
          }}
        >
          Search
        </button>
      </div>

      {/* Autocomplete dropdown (keyword mode only) */}
      {showDropdown && mode !== 'ai' && (suggestions.length > 0 || mapMatches.length > 0) && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
          background: '#fff', border: '1px solid #eee', borderRadius: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 1000,
          overflow: 'hidden',
        }}>
          {/* s107 — Innovation Map matches first: a buyer typing "secur"
              jumps straight to the curated Cybersecurity map. */}
          {mapMatches.map((m) => (
            <div
              key={`map-${m.dimension}-${m.slug}`}
              onClick={() => { setShowDropdown(false); setQuery(''); navigate(`/dashboard/maps/${m.dimension}/${m.slug}`); }}
              style={{
                padding: '10px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                borderBottom: '1px solid #f5f5f5', background: '#fffdf6',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#faf3df'}
              onMouseLeave={e => e.currentTarget.style.background = '#fffdf6'}
            >
              <span style={{ fontSize: 14 }}>{'🗺️'}</span>
              <span style={{ fontSize: 14, color: '#1a1a2e', fontWeight: 600 }}>{m.label}</span>
              <span style={{ fontSize: 11, color: '#8a7430', marginLeft: 'auto' }}>
                {m.member_count.toLocaleString()} startups · {DIM_LABEL[m.dimension]} map
              </span>
            </div>
          ))}
          {suggestions.map((s, i) => (
            <div
              key={i}
              onClick={() => { setQuery(s.name || s); doSearch(s.name || s); }}
              style={{
                padding: '10px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                borderBottom: i < suggestions.length - 1 ? '1px solid #f5f5f5' : 'none',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f9f7f2'}
              onMouseLeave={e => e.currentTarget.style.background = '#fff'}
            >
              <span style={{ fontSize: 14 }}>{TYPE_ICONS[s.type] || '\uD83D\uDD0D'}</span>
              <span style={{ fontSize: 14, color: '#1a1a2e' }}>{s.name || s}</span>
              <span style={{ fontSize: 11, color: '#666', marginLeft: 'auto', textTransform: 'capitalize' }}>{s.type}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
