import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Search, Loader2, Rocket, Building2, Users, ChevronRight, Sparkles, Brain, MapPin, Calendar, Tag, Info, BookOpen } from 'lucide-react';
import PublicLayout from '../../components/PublicLayout';
import SearchBar from '../../components/SearchBar';
import UpgradeCTA from '../../components/UpgradeCTA';
import { publicAPI, crawlAPI, getToken } from '../../services/api';
import toast from 'react-hot-toast';
import { isUpgradeError } from '../../utils/upgradeError';
import { openProxyFile } from '../../utils/fileAccess';

const G = '#D0A848';
const NAVY = '#0D2137';
const card = { background: '#fff', border: '1px solid #eee', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' };

const TABS = [
  { key: 'all', label: 'All', icon: Search },
  { key: 'challenges', label: 'Challenges', icon: Building2 },
  { key: 'startups', label: 'Startups', icon: Rocket },
  { key: 'directory', label: 'People', icon: Users },
  { key: 'knowledge', label: 'Knowledge', icon: BookOpen },
];

// Map AI intent → default tab
const INTENT_TO_TAB = { startups: 'startups', challenges: 'challenges', directory: 'directory', all: 'all' };

export default function GlobalSearch() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const q = params.get('q') || '';
  const mode = params.get('mode') || 'keyword'; // 'keyword' | 'semantic' | 'ai'
  const type = params.get('type') || 'all';

  const [results, setResults] = useState(null);
  const [interpretation, setInterpretation] = useState(null);
  const [upgradeNeeded, setUpgradeNeeded] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(type);

  useEffect(() => {
    if (q) doSearch(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, mode]);

  const doSearch = async (term) => {
    setLoading(true);
    setInterpretation(null);
    setUpgradeNeeded(null);
    try {
      if (mode === 'ai') {
        // AI query-parsing: single call returns all three entity types + interpretation
        const data = await publicAPI.aiSearch(term, 8);
        setResults(data);
        setInterpretation(data.interpretation || null);
        // Auto-select tab based on intent if user hasn't explicitly picked one
        if (data.interpretation?.intent && (!type || type === 'all')) {
          const suggested = INTENT_TO_TAB[data.interpretation.intent] || 'all';
          setActiveTab(suggested);
        }
      } else if (mode === 'semantic') {
        // Semantic search — one type at a time
        const types = activeTab === 'all' ? ['challenges', 'startups', 'directory', 'knowledge'] : [activeTab];
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
      // Phase 19: handle 402 upgrade_required from AI/semantic search
      if (isUpgradeError(err)) {
        setUpgradeNeeded(mode === 'ai' ? 'AI Ask Search' : 'Semantic Search');
      } else {
        toast.error('Search failed');
      }
      console.error(err);
    } finally { setLoading(false); }
  };

  const handleSearch = (term, newMode) => {
    const effectiveMode = newMode || mode;
    const modeParam = effectiveMode !== 'keyword' ? `&mode=${effectiveMode}` : '';
    navigate(`/search?q=${encodeURIComponent(term)}${modeParam}`);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    const modeParam = mode !== 'keyword' ? `&mode=${mode}` : '';
    if (q) navigate(`/search?q=${encodeURIComponent(q)}&type=${tab}${modeParam}`);
  };

  const totalResults = results
    ? (results.challenges?.total || 0) + (results.startups?.total || 0) + (results.directory?.total || 0) + (results.knowledge?.total || 0)
    : 0;

  return (
    <PublicLayout>
      <div style={{ minHeight: '70vh', background: '#fafafa' }}>
        {/* Hero search */}
        <div style={{ background: '#1a1a2e', padding: '48px 24px 40px', textAlign: 'center' }}>
          <h1 id="tour-page-search" style={{ color: '#fff', fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
            Search <span style={{ color: G }}>OpenI Hub</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 24 }}>
            Find challenges, startups, investors, mentors, and more
          </p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <SearchBar
              onSearch={handleSearch}
              showSemanticToggle
              showAiToggle
              initialMode={mode}
              placeholder="Search across the entire platform..."
            />
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

          {/* AI Interpretation banner (mode=ai) */}
          {mode === 'ai' && interpretation && !loading && (
            <InterpretationBanner interpretation={interpretation} />
          )}

          {/* Phase 19: Upgrade CTA when feature is gated */}
          {upgradeNeeded && !loading && (
            <UpgradeCTA feature={upgradeNeeded} compact />
          )}

          {/* Loading */}
          {loading && (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <Loader2 size={32} style={{ color: G, animation: 'spin 1s linear infinite' }} />
              <p style={{ color: '#5c5c5c', marginTop: 12 }}>Searching...</p>
            </div>
          )}

          {/* No query */}
          {!q && !loading && (
            <div style={{ textAlign: 'center', padding: 80, color: '#666' }}>
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
                  <span style={{ fontSize: 12, color: '#666' }}>Related:</span>
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

              {/* Knowledge section */}
              {(activeTab === 'all' || activeTab === 'knowledge') && results.knowledge?.results?.length > 0 && (
                <Section title="Knowledge Hub" icon={BookOpen} count={results.knowledge.total} viewAllLink="/dashboard/knowledge">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                    {results.knowledge.results.map(k => (
                      <KnowledgeCard key={k.id} article={k} />
                    ))}
                  </div>
                </Section>
              )}

              {/* No results + on-demand crawl CTA */}
              {totalResults === 0 && (
                <NoResultsCTA query={q} />
              )}
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </PublicLayout>
  );
}

function NoResultsCTA({ query }) {
  const [requested, setRequested] = useState(false);
  const isLoggedIn = !!getToken();

  const handleRequest = async () => {
    try {
      await crawlAPI.requestCrawl(query);
      setRequested(true);
      toast.success('Request submitted! We\'ll add this startup to our database.');
    } catch (err) {
      toast.error(err.message || 'Request failed');
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: 60, color: '#666' }}>
      <Search size={40} style={{ color: '#ddd', marginBottom: 12 }} />
      <p style={{ fontSize: 16 }}>No results found for "{query}"</p>
      <p style={{ fontSize: 13, marginBottom: 24 }}>Try different keywords or check the spelling</p>
      {isLoggedIn && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, maxWidth: 420, margin: '0 auto', textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Rocket size={16} style={{ color: '#D4A843' }} />
            <span style={{ fontWeight: 600, color: '#0D2137', fontSize: 14 }}>Can't find what you're looking for?</span>
          </div>
          <p style={{ fontSize: 12, color: '#666', margin: '0 0 12px' }}>
            We can search the web for "{query}" and add it to our database. You'll be notified when it's available.
          </p>
          <button
            onClick={handleRequest}
            disabled={requested}
            style={{
              background: requested ? '#f3f4f6' : '#D4A843', color: requested ? '#999' : '#0D2137',
              border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13,
              fontWeight: 600, cursor: requested ? 'default' : 'pointer', width: '100%',
            }}
          >
            {requested ? 'Request Submitted — We\'ll notify you' : `Fetch data for "${query}"`}
          </button>
        </div>
      )}
    </div>
  );
}

function Section({ title, icon: Icon, count, viewAllLink, children }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon size={18} style={{ color: G }} />
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a2e', margin: 0 }}>{title}</h2>
          <span style={{ fontSize: 12, color: '#666' }}>({count})</span>
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
          <p style={{ fontSize: 12, color: '#5c5c5c', margin: 0 }}>{c.company_name || c.corporate_name}</p>
          {c.problem_statement && <p style={{ fontSize: 13, color: '#555', margin: '8px 0 0', lineHeight: 1.5 }}>{c.problem_statement.slice(0, 120)}{c.problem_statement.length > 120 ? '...' : ''}</p>}
          <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
            {c.budget_range && <span style={{ fontSize: 11, color: '#666', display: 'flex', alignItems: 'center', gap: 4 }}><Tag size={11} /> {c.budget_range}</span>}
            {c.deadline && <span style={{ fontSize: 11, color: '#666', display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={11} /> {new Date(c.deadline).toLocaleDateString()}</span>}
            {c.relevance && <span style={{ fontSize: 10, background: '#f0f0f0', borderRadius: 8, padding: '2px 8px', color: '#5c5c5c' }}>Relevance: {(c.relevance * 100).toFixed(0)}%</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function StartupCard({ startup: s }) {
  // s50 (J10 follow-up): cards on /search were static — clicking did nothing.
  // Now route to the dashboard startup detail page so authed users land on the
  // page where the Claim CTA lives. Append ?by=user_id so the backend resolves
  // by user_id first — id and user_id are independent SERIAL sequences and a
  // number like 32 can match BOTH a row's id AND a different row's user_id.
  const targetId = s.user_id || s.id;
  return (
    <Link
      to={`/dashboard/startup-profile/${targetId}?by=user_id`}
      style={{ ...card, padding: 16, display: 'block', textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        {s.logo_url ? <img src={s.logo_url} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }} /> : <Rocket size={20} style={{ color: G }} />}
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e', margin: 0 }}>{s.company_name || s.name}</h4>
          {s.city && <span style={{ fontSize: 11, color: '#5c5c5c', display: 'flex', alignItems: 'center', gap: 3 }}><MapPin size={10} /> {s.city}</span>}
        </div>
        {s.is_deeptech && <span style={{ marginLeft: 'auto', fontSize: 10, background: '#1a1a2e', color: G, borderRadius: 6, padding: '2px 8px' }}>DeepTech</span>}
      </div>
      {s.tagline && <p style={{ fontSize: 12, color: '#666', margin: 0, lineHeight: 1.4 }}>{s.tagline.slice(0, 100)}{s.tagline.length > 100 ? '...' : ''}</p>}
      <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
        {s.sector && <span style={{ fontSize: 10, background: '#f5f0e6', color: '#8B7355', borderRadius: 6, padding: '2px 8px' }}>{s.sector}</span>}
        {s.stage && <span style={{ fontSize: 10, background: '#eef', color: '#558', borderRadius: 6, padding: '2px 8px' }}>{s.stage}</span>}
      </div>
    </Link>
  );
}

function InterpretationBanner({ interpretation }) {
  const { intent, filters = {}, keywords, confidence, fallback_used, error } = interpretation || {};
  const confPct = Math.round((confidence || 0) * 100);

  // Collect non-null filter chips
  const chips = [];
  if (intent && intent !== 'all') chips.push({ label: `Intent: ${intent.charAt(0).toUpperCase() + intent.slice(1)}`, primary: true });
  if (filters.sector) chips.push({ label: `Sector: ${filters.sector}` });
  if (filters.technology) chips.push({ label: `Tech: ${filters.technology}` });
  if (filters.stage) chips.push({ label: `Stage: ${filters.stage}` });
  if (filters.city) chips.push({ label: `City: ${filters.city}` });
  if (filters.state) chips.push({ label: `State: ${filters.state}` });
  if (filters.challenge_type) chips.push({ label: `Type: ${filters.challenge_type}` });
  if (filters.persona_type) chips.push({ label: `Persona: ${filters.persona_type.replace('_', ' ')}` });
  if (filters.is_deeptech) chips.push({ label: 'DeepTech', highlight: true });

  // Build fallback note
  let fallbackNote = null;
  if (error === 'no_api_key') fallbackNote = 'AI parser unavailable — showing keyword results';
  else if (fallback_used === 'keywords-only') fallbackNote = 'Low confidence — showing keyword results';
  else if (fallback_used === 'fts') fallbackNote = 'No filter matches — showing keyword results';
  else if (fallback_used === 'semantic') fallbackNote = 'No keyword matches — showing semantic (vector) results';

  return (
    <div style={{
      background: 'linear-gradient(135deg, #fffbf0 0%, #fff 100%)',
      border: `1.5px solid ${G}`,
      borderRadius: 12,
      padding: '14px 18px',
      marginBottom: 20,
      boxShadow: '0 2px 8px rgba(213,170,91,0.08)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: chips.length ? 10 : 0 }}>
        <Brain size={16} style={{ color: G }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>Interpreted as:</span>
        {confidence > 0 && (
          <span style={{
            fontSize: 11, color: '#5c5c5c', marginLeft: 'auto',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <Info size={11} /> {confPct}% confidence
          </span>
        )}
      </div>
      {chips.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: fallbackNote ? 10 : 0 }}>
          {chips.map((c, i) => (
            <span
              key={i}
              style={{
                fontSize: 12,
                padding: '4px 12px',
                borderRadius: 14,
                background: c.primary ? NAVY : c.highlight ? G : '#f5f0e6',
                color: c.primary || c.highlight ? '#fff' : '#8B7355',
                fontWeight: c.primary ? 600 : 500,
                border: c.primary || c.highlight ? 'none' : '1px solid #eadfc8',
              }}
            >
              {c.label}
            </span>
          ))}
          {keywords && (
            <span style={{
              fontSize: 12,
              padding: '4px 12px',
              borderRadius: 14,
              background: '#f0f0f0',
              color: '#666',
              fontStyle: 'italic',
            }}>
              keywords: "{keywords}"
            </span>
          )}
        </div>
      )}
      {fallbackNote && (
        <div style={{
          fontSize: 11,
          color: '#a06b00',
          background: '#fff8e6',
          padding: '6px 10px',
          borderRadius: 6,
          border: '1px solid #f0d890',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
        }}>
          <Info size={11} /> {fallbackNote}
        </div>
      )}
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
          <span style={{ fontSize: 11, color: '#666', textTransform: 'capitalize' }}>{d.persona_type?.replace('_', ' ')}</span>
        </div>
        {d.is_verified && <span style={{ marginLeft: 'auto', fontSize: 10, background: '#e8f5e9', color: '#2e7d32', borderRadius: 6, padding: '2px 8px' }}>Verified</span>}
      </div>
      {d.organization && <p style={{ fontSize: 12, color: '#666', margin: '4px 0 0' }}>{d.organization}</p>}
      {d.tagline && <p style={{ fontSize: 12, color: '#5c5c5c', margin: '4px 0 0', lineHeight: 1.4 }}>{d.tagline.slice(0, 80)}{d.tagline.length > 80 ? '...' : ''}</p>}
      {d.city && <span style={{ fontSize: 11, color: '#6e6e6e', display: 'flex', alignItems: 'center', gap: 3, marginTop: 6 }}><MapPin size={10} /> {d.city}</span>}
    </div>
  );
}

function KnowledgeCard({ article: k }) {
  return (
    <div style={{ ...card, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <BookOpen size={20} style={{ color: G }} />
        <div style={{ flex: 1 }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e', margin: 0 }}>{k.title}</h4>
          {k.category && (
            <span style={{ fontSize: 10, background: '#f5f0e6', color: '#8B7355', borderRadius: 6, padding: '2px 8px', textTransform: 'capitalize' }}>
              {k.category.replace('_', ' ')}
            </span>
          )}
        </div>
      </div>
      {k.content && (
        <p style={{ fontSize: 12, color: '#666', margin: '4px 0 0', lineHeight: 1.4 }}>
          {k.content.slice(0, 100)}{k.content.length > 100 ? '...' : ''}
        </p>
      )}
      {k.file_url && (
        k.file_proxy_url ? (
          <button
            onClick={async () => {
              try {
                await openProxyFile(k.file_proxy_url);
              } catch (err) {
                toast.error(err.message || 'Failed to open file');
              }
            }}
            style={{ fontSize: 12, color: G, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8, background: 'transparent', border: 0, padding: 0, cursor: 'pointer' }}
          >
            View file <ChevronRight size={12} />
          </button>
        ) : (
          <a
            href={k.file_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 12, color: G, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8 }}
          >
            View file <ChevronRight size={12} />
          </a>
        )
      )}
    </div>
  );
}
