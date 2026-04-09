import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Search, Loader2, Rocket, Building2, Users, ChevronRight, Sparkles, MapPin, Calendar, Tag } from 'lucide-react';
import PublicLayout from '../../components/PublicLayout';
import SearchBar from '../../components/SearchBar';
import { publicAPI } from '../../services/api';
import toast from 'react-hot-toast';

const G = '#D5AA5B';
const card = { background: '#fff', border: '1px solid #eee', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' };

const TABS = [
  { key: 'all', label: 'All', icon: Search },
  { key: 'challenges', label: 'Challenges', icon: Building2 },
  { key: 'startups', label: 'Startups', icon: Rocket },
  { key: 'directory', label: 'People', icon: Users },
];

export default function GlobalSearch() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const q = params.get('q') || '';
  const mode = params.get('mode') || 'keyword';
  const type = params.get('type') || 'all';

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(type);
  const [semantic, setSemantic] = useState(mode === 'semantic');

  useEffect(() => {
    if (q) doSearch(q);
  }, [q, mode]);

  const doSearch = async (term) => {
    setLoading(true);
    try {
      if (semantic && mode === 'semantic') {
        // Semantic search — one type at a time
        const types = activeTab === 'all' ? ['challenges', 'startups', 'directory'] : [activeTab];
        const promises = types.map(t => publicAPI.semanticSearch(term, t, 8));
        const res = await Promise.all(promises);
        const combined = {};
        types.forEach((t, i) => { combined[t] = { results: res[i].results || [], total: res[i].total || 0 }; });
        setResults(combined);
      } else {
        const data = await publicAPI.globalSearch(term, 8);
        setResults(data);
      }
    } catch (err) {
      toast.error('Search failed');
      console.error(err);
    } finally { setLoading(false); }
  };

  const handleSearch = (term) => {
    navigate(`/search?q=${encodeURIComponent(term)}${semantic ? '&mode=semantic' : ''}`);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (q) navigate(`/search?q=${encodeURIComponent(q)}&type=${tab}${semantic ? '&mode=semantic' : ''}`);
  };

  const totalResults = results
    ? (results.challenges?.total || 0) + (results.startups?.total || 0) + (results.directory?.total || 0)
    : 0;

  return (
    <PublicLayout>
      <div style={{ minHeight: '70vh', background: '#fafafa' }}>
        {/* Hero search */}
        <div style={{ background: '#1a1a2e', padding: '48px 24px 40px', textAlign: 'center' }}>
          <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
            Search <span style={{ color: G }}>OpenI Hub</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 24 }}>
            Find challenges, startups, investors, mentors, and more
          </p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <SearchBar onSearch={handleSearch} showSemanticToggle placeholder="Search across the entire platform..." />
          </div>
        </div>

        <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 20px 60px' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
            {TABS.map(t => {
              const count = t.key === 'all' ? totalResults : (results?.[t.key]?.total || 0);
              const active = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => handleTabChange(t.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 16px', borderRadius: 20,
                    border: active ? `2px solid ${G}` : '1px solid #ddd',
                    background: active ? '#fffbf0' : '#fff',
                    color: active ? '#1a1a2e' : '#666',
                    fontWeight: active ? 600 : 400, fontSize: 13, cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <t.icon size={14} />
                  {t.label}
                  {count > 0 && <span style={{ background: active ? G : '#eee', color: active ? '#fff' : '#666', borderRadius: 10, padding: '1px 8px', fontSize: 11 }}>{count}</span>}
                </button>
              );
            })}
          </div>

          {/* Loading */}
          {loading && (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <Loader2 size={32} style={{ color: G, animation: 'spin 1s linear infinite' }} />
              <p style={{ color: '#888', marginTop: 12 }}>Searching...</p>
            </div>
          )}

          {/* No query */}
          {!q && !loading && (
            <div style={{ textAlign: 'center', padding: 80, color: '#999' }}>
              <Search size={48} style={{ color: '#ddd', marginBottom: 16 }} />
              <p>Enter a search term to find challenges, startups, and people</p>
            </div>
          )}

          {/* Results */}
          {q && !loading && results && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              {/* Suggestions */}
              {results.suggestions?.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: '#999' }}>Related:</span>
                  {results.suggestions.map((s, i) => (
                    <button key={i} onClick={() => handleSearch(s)}
                      style={{ background: '#f0f0f0', border: 'none', borderRadius: 16, padding: '4px 12px', fontSize: 12, color: '#555', cursor: 'pointer' }}>
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Challenges section */}
              {(activeTab === 'all' || activeTab === 'challenges') && results.challenges?.results?.length > 0 && (
                <Section title="Challenges" icon={Building2} count={results.challenges.total} viewAllLink={`/marketplace?search=${encodeURIComponent(q)}`}>
                  {results.challenges.results.map(c => (
                    <ChallengeCard key={c.id} challenge={c} />
                  ))}
                </Section>
              )}

              {/* Startups section */}
              {(activeTab === 'all' || activeTab === 'startups') && results.startups?.results?.length > 0 && (
                <Section title="Startups" icon={Rocket} count={results.startups.total}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                    {results.startups.results.map(s => (
                      <StartupCard key={s.user_id} startup={s} />
                    ))}
                  </div>
                </Section>
              )}

              {/* Directory section */}
              {(activeTab === 'all' || activeTab === 'directory') && results.directory?.results?.length > 0 && (
                <Section title="People & Organizations" icon={Users} count={results.directory.total}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                    {results.directory.results.map(d => (
                      <DirectoryCard key={d.user_id} profile={d} />
                    ))}
                  </div>
                </Section>
              )}

              {/* No results */}
              {totalResults === 0 && (
                <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>
                  <Search size={40} style={{ color: '#ddd', marginBottom: 12 }} />
                  <p style={{ fontSize: 16 }}>No results found for "{q}"</p>
                  <p style={{ fontSize: 13 }}>Try different keywords or check the spelling</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </PublicLayout>
  );
}

function Section({ title, icon: Icon, count, viewAllLink, children }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon size={18} style={{ color: G }} />
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a2e', margin: 0 }}>{title}</h2>
          <span style={{ fontSize: 12, color: '#999' }}>({count})</span>
        </div>
        {viewAllLink && (
          <Link to={viewAllLink} style={{ fontSize: 13, color: G, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            View all <ChevronRight size={14} />
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

function ChallengeCard({ challenge: c }) {
  return (
    <div style={{ ...card, padding: 20, marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        {c.corporate_logo && <img src={c.corporate_logo} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />}
        <div style={{ flex: 1 }}>
          <Link to={`/marketplace`} style={{ textDecoration: 'none' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1a1a2e', margin: '0 0 4px' }}>{c.title}</h3>
          </Link>
          <p style={{ fontSize: 12, color: '#888', margin: 0 }}>{c.company_name || c.corporate_name}</p>
          {c.problem_statement && <p style={{ fontSize: 13, color: '#555', margin: '8px 0 0', lineHeight: 1.5 }}>{c.problem_statement.slice(0, 120)}{c.problem_statement.length > 120 ? '...' : ''}</p>}
          <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
            {c.budget_range && <span style={{ fontSize: 11, color: '#666', display: 'flex', alignItems: 'center', gap: 4 }}><Tag size={11} /> {c.budget_range}</span>}
            {c.deadline && <span style={{ fontSize: 11, color: '#666', display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={11} /> {new Date(c.deadline).toLocaleDateString()}</span>}
            {c.relevance && <span style={{ fontSize: 10, background: '#f0f0f0', borderRadius: 8, padding: '2px 8px', color: '#888' }}>Relevance: {(c.relevance * 100).toFixed(0)}%</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function StartupCard({ startup: s }) {
  return (
    <div style={{ ...card, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        {s.logo_url ? <img src={s.logo_url} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }} /> : <Rocket size={20} style={{ color: G }} />}
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e', margin: 0 }}>{s.company_name || s.name}</h4>
          {s.city && <span style={{ fontSize: 11, color: '#888', display: 'flex', alignItems: 'center', gap: 3 }}><MapPin size={10} /> {s.city}</span>}
        </div>
        {s.is_deeptech && <span style={{ marginLeft: 'auto', fontSize: 10, background: '#1a1a2e', color: G, borderRadius: 6, padding: '2px 8px' }}>DeepTech</span>}
      </div>
      {s.tagline && <p style={{ fontSize: 12, color: '#666', margin: 0, lineHeight: 1.4 }}>{s.tagline.slice(0, 100)}{s.tagline.length > 100 ? '...' : ''}</p>}
      <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
        {s.sector && <span style={{ fontSize: 10, background: '#f5f0e6', color: '#8B7355', borderRadius: 6, padding: '2px 8px' }}>{s.sector}</span>}
        {s.stage && <span style={{ fontSize: 10, background: '#eef', color: '#558', borderRadius: 6, padding: '2px 8px' }}>{s.stage}</span>}
      </div>
    </div>
  );
}

function DirectoryCard({ profile: d }) {
  return (
    <div style={{ ...card, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        {d.logo_url ? <img src={d.logo_url} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }} /> : <Users size={20} style={{ color: G }} />}
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e', margin: 0 }}>{d.display_name}</h4>
          <span style={{ fontSize: 11, color: '#999', textTransform: 'capitalize' }}>{d.persona_type?.replace('_', ' ')}</span>
        </div>
        {d.is_verified && <span style={{ marginLeft: 'auto', fontSize: 10, background: '#e8f5e9', color: '#2e7d32', borderRadius: 6, padding: '2px 8px' }}>Verified</span>}
      </div>
      {d.organization && <p style={{ fontSize: 12, color: '#666', margin: '4px 0 0' }}>{d.organization}</p>}
      {d.tagline && <p style={{ fontSize: 12, color: '#888', margin: '4px 0 0', lineHeight: 1.4 }}>{d.tagline.slice(0, 80)}{d.tagline.length > 80 ? '...' : ''}</p>}
      {d.city && <span style={{ fontSize: 11, color: '#aaa', display: 'flex', alignItems: 'center', gap: 3, marginTop: 6 }}><MapPin size={10} /> {d.city}</span>}
    </div>
  );
}
