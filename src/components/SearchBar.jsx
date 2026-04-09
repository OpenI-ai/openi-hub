import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Sparkles } from 'lucide-react';
import { publicAPI } from '../services/api';

const G = '#D5AA5B';

/**
 * Reusable SearchBar with debounced autocomplete suggestions.
 * Props:
 *   - compact: boolean (smaller variant for header)
 *   - onSearch: (query) => void (override navigation behavior)
 *   - placeholder: string
 *   - showSemanticToggle: boolean
 */
export default function SearchBar({ compact = false, onSearch, placeholder = 'Search challenges, startups, people...', showSemanticToggle = false }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [semantic, setSemantic] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const ref = useRef(null);
  const timer = useRef(null);

  // Debounced autocomplete
  useEffect(() => {
    if (query.trim().length < 2) { setSuggestions([]); return; }
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        setLoading(true);
        const data = await publicAPI.searchSuggest(query.trim());
        setSuggestions(data.suggestions || []);
        setShowDropdown(true);
      } catch {} finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(timer.current);
  }, [query]);

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
    if (onSearch) { onSearch(term); }
    else { navigate(`/search?q=${encodeURIComponent(term)}${semantic ? '&mode=semantic' : ''}`); }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') doSearch();
    if (e.key === 'Escape') setShowDropdown(false);
  };

  const TYPE_ICONS = { sector: '\uD83C\uDF10', technology: '\uD83D\uDCA1', industry: '\uD83C\uDFED', startup: '\uD83D\uDE80', person: '\uD83D\uDC64' };

  return (
    <div ref={ref} style={{ position: 'relative', width: compact ? 260 : '100%', maxWidth: 520 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: compact ? 'rgba(255,255,255,0.08)' : '#fff',
        border: compact ? '1px solid rgba(255,255,255,0.15)' : '1.5px solid #ddd',
        borderRadius: 10, padding: compact ? '6px 12px' : '10px 16px',
        transition: 'border-color 0.2s',
      }}>
        <Search size={compact ? 15 : 18} style={{ color: compact ? 'rgba(255,255,255,0.5)' : '#999', flexShrink: 0 }} />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length && setShowDropdown(true)}
          placeholder={placeholder}
          style={{
            flex: 1, border: 'none', outline: 'none', background: 'transparent',
            fontSize: compact ? 13 : 15,
            color: compact ? '#fff' : '#1a1a2e',
          }}
        />
        {query && (
          <X size={14} style={{ cursor: 'pointer', color: '#999' }} onClick={() => { setQuery(''); setSuggestions([]); }} />
        )}
        {showSemanticToggle && (
          <button
            onClick={() => setSemantic(!semantic)}
            title={semantic ? 'Semantic search (AI)' : 'Keyword search'}
            style={{
              background: semantic ? G : 'transparent',
              border: `1px solid ${semantic ? G : '#ccc'}`,
              borderRadius: 6, padding: '3px 8px',
              display: 'flex', alignItems: 'center', gap: 4,
              cursor: 'pointer', fontSize: 11, color: semantic ? '#fff' : '#666',
              transition: 'all 0.2s',
            }}
          >
            <Sparkles size={12} /> AI
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

      {/* Autocomplete dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
          background: '#fff', border: '1px solid #eee', borderRadius: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 1000,
          overflow: 'hidden',
        }}>
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
              <span style={{ fontSize: 11, color: '#999', marginLeft: 'auto', textTransform: 'capitalize' }}>{s.type}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
