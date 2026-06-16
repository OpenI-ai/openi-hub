/**
 * PublicMarketplace — Fully public page showing all open challenges.
 * No authentication required. "Apply Now" redirects to /register.
 */
import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Search, Briefcase, MapPin, Clock, Calendar, Users, ChevronDown, ChevronUp,
  ArrowRight, Building2, Tag, DollarSign, Filter, X, ChevronLeft, ChevronRight, ArrowUpDown,
} from 'lucide-react';
import PublicLayout from '../../components/PublicLayout';
import { publicAPI } from '../../services/api';

// Brand colors
const GOLD = '#D0A848';
const GOLD_DARK = '#C9983F';
const GOLD_LIGHT = 'rgba(213, 170, 91, 0.1)';
const DARK = '#1a1a1a';
const GRAY = '#6b7280';
const BORDER = '#e5e7eb';
const LIGHT_GRAY = '#f5f5f5';

const SORT_OPTIONS = [
  { value: '', label: 'Default' },
  { value: 'relevance', label: 'Relevance' },
  { value: 'newest', label: 'Newest First' },
  { value: 'deadline', label: 'Deadline Soon' },
  { value: 'applications', label: 'Most Applications' },
];

const CHALLENGE_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'partner', label: 'Partner' },
  { value: 'source', label: 'Source' },
  { value: 'invest', label: 'Invest' },
];

export default function PublicMarketplace() {
  const [challenges, setChallenges] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sector, setSector] = useState('');
  const [technology, setTechnology] = useState('');
  const [filters, setFilters] = useState({ sectors: [], technologies: [], usecases: [] });
  // Phase 120: selectedChallenge data still in state, but URL :id drives the fetch trigger
  const navigate = useNavigate();
  const { id: pmpParamId } = useParams();
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sort, setSort] = useState('');
  const [challengeType, setChallengeType] = useState('');
  const [facets, setFacets] = useState({ sector: {}, challenge_type: {} });
  const limit = 12;

  // Fetch challenges
  useEffect(() => {
    fetchChallenges();
  }, [page, sector, technology, sort, challengeType]);

  async function fetchChallenges() {
    setLoading(true);
    try {
      const params = { page, limit };
      if (search) params.search = search;
      if (sector) params.sector = sector;
      if (technology) params.technology = technology;
      if (sort) params.sort = sort;
      if (challengeType) params.challenge_type = challengeType;
      const data = await publicAPI.listChallenges(params);
      setChallenges(data.challenges || []);
      setTotal(data.total || 0);
      if (data.filters) setFilters(data.filters);
      if (data.facets) setFacets(data.facets);
    } catch (err) {
      console.error('Failed to load challenges:', err);
    } finally { setLoading(false); }
  }

  function handleSearch(e) {
    e.preventDefault();
    setPage(1);
    fetchChallenges();
  }

  // Phase 120: Fetch detail whenever URL :id changes (back/forward, click, deep-link)
  useEffect(() => {
    if (pmpParamId) {
      const id = parseInt(pmpParamId, 10);
      if (Number.isFinite(id) && (!selectedChallenge || selectedChallenge.id !== id)) {
        openDetail(id);
      }
    } else if (selectedChallenge) {
      // URL reverted to list — clear detail state
      setSelectedChallenge(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pmpParamId]);

  async function openDetail(id) {
    setDetailLoading(true);
    try {
      const data = await publicAPI.getChallengeDetail(id);
      setSelectedChallenge(data);
    } catch (err) { console.error(err); }
    finally { setDetailLoading(false); }
  }

  const totalPages = Math.ceil(total / limit);

  // ── Detail View ──────────────────────────────────────────
  if (selectedChallenge) {
    const c = selectedChallenge;
    return (
      <PublicLayout>
        <div className="max-w-4xl mx-auto px-6 py-12">
          {/* Back button */}
          <button
            onClick={() => navigate('/marketplace')}
            className="flex items-center gap-2 text-sm font-semibold mb-8 transition-colors"
            style={{ color: GRAY }}
            onMouseEnter={e => e.currentTarget.style.color = GOLD}
            onMouseLeave={e => e.currentTarget.style.color = GRAY}
          >
            <ChevronLeft size={16} /> Back to Marketplace
          </button>

          {/* Header */}
          <div className="flex items-start gap-4 mb-8">
            {c.corporate_logo ? (
              <img src={c.corporate_logo} alt="" className="w-16 h-16 rounded-xl object-contain p-1 bg-white" style={{ border: `1px solid ${BORDER}` }} />
            ) : (
              <div className="w-16 h-16 rounded-xl flex items-center justify-center" style={{ background: GOLD_LIGHT }}>
                <Building2 size={28} style={{ color: GOLD }} />
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-1" style={{ color: DARK }}>{c.title}</h1>
              <p className="text-sm" style={{ color: GRAY }}>
                {c.company_name || c.organization_name}
                {c.corporate_city && ` \u00B7 ${c.corporate_city}`}
              </p>
            </div>
          </div>

          {/* Meta cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { icon: DollarSign, label: 'Budget', value: c.budget_range || 'Not specified' },
              { icon: Clock, label: 'Timeline', value: c.timeline || 'Flexible' },
              { icon: Calendar, label: 'Deadline', value: c.deadline ? new Date(c.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Open' },
              { icon: Users, label: 'Applicants', value: c.application_count || '0' },
            ].map((m, i) => (
              <div key={i} className="p-4 rounded-xl" style={{ background: LIGHT_GRAY, border: `1px solid ${BORDER}` }}>
                <m.icon size={16} style={{ color: GOLD, marginBottom: 4 }} />
                <div className="text-xs" style={{ color: GRAY }}>{m.label}</div>
                <div className="text-sm font-bold" style={{ color: DARK }}>{m.value}</div>
              </div>
            ))}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-8">
            {(c.sectors || []).map((s, i) => (
              <span key={`s${i}`} className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: GOLD_LIGHT, color: GOLD_DARK }}>{s}</span>
            ))}
            {(c.technologies || []).map((t, i) => (
              <span key={`t${i}`} className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>{t}</span>
            ))}
            {(c.usecases || []).map((u, i) => (
              <span key={`u${i}`} className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: 'rgba(16,163,127,0.1)', color: '#10a37f' }}>{u}</span>
            ))}
          </div>

          {/* Problem Statement */}
          {c.problem_statement && (
            <div className="mb-8">
              <h3 className="text-sm font-bold mb-3 uppercase tracking-wide" style={{ color: GRAY }}>Problem Statement</h3>
              <div className="p-5 rounded-xl text-sm leading-relaxed" style={{ background: LIGHT_GRAY, color: DARK, border: `1px solid ${BORDER}` }}>
                {c.problem_statement}
              </div>
            </div>
          )}

          {/* Description */}
          {c.description && (
            <div className="mb-8">
              <h3 className="text-sm font-bold mb-3 uppercase tracking-wide" style={{ color: GRAY }}>Description</h3>
              <div className="text-sm leading-relaxed" style={{ color: DARK }}>{c.description}</div>
            </div>
          )}

          {/* Requirements */}
          {c.requirements && (
            <div className="mb-8">
              <h3 className="text-sm font-bold mb-3 uppercase tracking-wide" style={{ color: GRAY }}>Requirements</h3>
              <div className="text-sm leading-relaxed" style={{ color: DARK }}>{c.requirements}</div>
            </div>
          )}

          {/* FAQs */}
          {c.faqs && c.faqs.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-bold mb-3 uppercase tracking-wide" style={{ color: GRAY }}>Frequently Asked Questions</h3>
              <div className="space-y-2">
                {c.faqs.map((faq, i) => (
                  <FAQAccordion key={i} question={faq.question || faq.q} answer={faq.answer || faq.a} />
                ))}
              </div>
            </div>
          )}

          {/* Apply CTA */}
          <div className="p-8 rounded-2xl text-center" style={{ background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_DARK} 100%)` }}>
            <h3 className="text-xl font-bold text-white mb-2">Interested in this challenge?</h3>
            <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.85)' }}>
              Register on OpenI to submit your application and connect with the organization.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-lg text-base font-bold transition-all"
              style={{ background: '#fff', color: GOLD_DARK }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              Register to Apply <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </PublicLayout>
    );
  }

  // ── List View ──────────────────────────────────────────────
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="px-6 pt-16 pb-12 text-center" style={{ background: `linear-gradient(180deg, ${LIGHT_GRAY} 0%, #fff 100%)` }}>
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 text-xs font-bold tracking-wide"
               style={{ background: GOLD_LIGHT, color: GOLD_DARK }}>
            <Briefcase size={14} /> OPEN INNOVATION MARKETPLACE
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4" style={{ color: DARK, fontFamily: 'Plus Jakarta Sans, Inter, sans-serif' }}>
            Explore Innovation <span style={{ color: GOLD }}>Challenges</span>
          </h1>
          <p className="text-base max-w-xl mx-auto" style={{ color: GRAY }}>
            Browse open challenges from corporates, government, and investors. Find opportunities to innovate, collaborate, and grow.
          </p>
        </div>
      </section>

      {/* Search & Filters */}
      <section className="px-6 py-8" style={{ background: '#fff' }}>
        <div className="max-w-6xl mx-auto">
          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex gap-3 mb-6">
            <div className="relative flex-1">
              <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: GRAY }} />
              <input
                type="text"
                placeholder="Search challenges by title, technology, or keyword..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl text-sm"
                style={{ border: `1px solid ${BORDER}`, outline: 'none', color: DARK }}
                onFocus={e => e.target.style.borderColor = GOLD}
                onBlur={e => e.target.style.borderColor = BORDER}
              />
            </div>
            <button type="submit" className="px-6 py-3 rounded-xl text-sm font-bold transition-all"
                    style={{ background: GOLD, color: '#fff' }}
                    onMouseEnter={e => e.currentTarget.style.background = GOLD_DARK}
                    onMouseLeave={e => e.currentTarget.style.background = GOLD}>
              Search
            </button>
            <button type="button" onClick={() => setShowFilters(!showFilters)}
                    className="px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 md:hidden"
                    style={{ border: `1px solid ${BORDER}`, color: DARK }}>
              <Filter size={16} /> Filters
            </button>
          </form>

          {/* Filter dropdowns */}
          <div className={`flex flex-wrap gap-3 mb-4 ${showFilters ? '' : 'hidden md:flex'}`}>
            {/* Sector filter */}
            <select value={sector} onChange={e => { setSector(e.target.value); setPage(1); }}
                    className="px-4 py-2.5 rounded-xl text-sm" style={{ border: `1px solid ${BORDER}`, color: DARK, outline: 'none', minWidth: 180 }}>
              <option value="">All Sectors</option>
              {filters.sectors.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            {/* Technology filter */}
            <select value={technology} onChange={e => { setTechnology(e.target.value); setPage(1); }}
                    className="px-4 py-2.5 rounded-xl text-sm" style={{ border: `1px solid ${BORDER}`, color: DARK, outline: 'none', minWidth: 180 }}>
              <option value="">All Technologies</option>
              {filters.technologies.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            {/* Challenge type filter */}
            <select value={challengeType} onChange={e => { setChallengeType(e.target.value); setPage(1); }}
                    className="px-4 py-2.5 rounded-xl text-sm" style={{ border: `1px solid ${challengeType ? GOLD : BORDER}`, color: DARK, outline: 'none', minWidth: 140, background: challengeType ? GOLD_LIGHT : '#fff', fontWeight: challengeType ? 600 : 400 }}>
              {CHALLENGE_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            {/* Sort dropdown */}
            <div className="flex items-center gap-1.5 ml-auto">
              <ArrowUpDown size={14} style={{ color: GRAY }} />
              <select value={sort} onChange={e => { setSort(e.target.value); setPage(1); }}
                      className="px-3 py-2.5 rounded-xl text-sm" style={{ border: `1px solid ${sort ? GOLD : BORDER}`, color: DARK, outline: 'none', background: sort ? GOLD_LIGHT : '#fff', fontWeight: sort ? 600 : 400 }}>
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {/* Active filters */}
            {(sector || technology || sort || challengeType) && (
              <button onClick={() => { setSector(''); setTechnology(''); setSort(''); setChallengeType(''); setPage(1); }}
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1"
                      style={{ background: GOLD_LIGHT, color: GOLD_DARK }}>
                <X size={14} /> Clear All
              </button>
            )}
          </div>

          {/* Facet chips */}
          {Object.keys(facets.sector || {}).length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.entries(facets.sector).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, count]) => (
                <button key={name} onClick={() => { setSector(sector === name ? '' : name); setPage(1); }}
                  className="px-3 py-1 rounded-full text-xs font-medium transition-all"
                  style={{ border: `1px solid ${sector === name ? GOLD : BORDER}`, background: sector === name ? GOLD_LIGHT : '#fff', color: sector === name ? GOLD_DARK : GRAY }}>
                  {name} <span style={{ color: '#bbb', marginLeft: 2 }}>{count}</span>
                </button>
              ))}
            </div>
          )}
          {Object.keys(facets.challenge_type || {}).length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.entries(facets.challenge_type).map(([type, count]) => (
                <button key={type} onClick={() => { setChallengeType(challengeType === type ? '' : type); setPage(1); }}
                  className="px-3 py-1 rounded-full text-xs font-medium transition-all capitalize"
                  style={{ border: `1px solid ${challengeType === type ? GOLD : BORDER}`, background: challengeType === type ? GOLD_LIGHT : '#fff', color: challengeType === type ? GOLD_DARK : GRAY }}>
                  {type} <span style={{ color: '#bbb', marginLeft: 2 }}>{count}</span>
                </button>
              ))}
            </div>
          )}

          {/* Result count */}
          <div className="flex items-center text-sm mb-6" style={{ color: GRAY }}>
            {total} challenge{total !== 1 ? 's' : ''} found
          </div>

          {/* Challenge Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-xl p-6 animate-pulse" style={{ background: LIGHT_GRAY, height: 280 }} />
              ))}
            </div>
          ) : challenges.length === 0 ? (
            <div className="text-center py-20">
              <Briefcase size={48} style={{ color: BORDER, margin: '0 auto 16px' }} />
              <h3 className="text-lg font-bold mb-2" style={{ color: DARK }}>No challenges found</h3>
              <p className="text-sm" style={{ color: GRAY }}>Try adjusting your search or filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {challenges.map(c => (
                <ChallengeCard key={c.id} challenge={c} onClick={() => navigate(`/marketplace/${c.id}`)} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-10">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                      className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1 transition-all"
                      style={{ border: `1px solid ${BORDER}`, color: page === 1 ? '#ccc' : DARK, cursor: page === 1 ? 'default' : 'pointer' }}>
                <ChevronLeft size={16} /> Previous
              </button>
              <span className="text-sm" style={{ color: GRAY }}>Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                      className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1 transition-all"
                      style={{ border: `1px solid ${BORDER}`, color: page === totalPages ? '#ccc' : DARK, cursor: page === totalPages ? 'default' : 'pointer' }}>
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-16" style={{ background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_DARK} 100%)` }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white">Ready to Innovate?</h2>
          <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.9)' }}>
            Join OpenI to apply to challenges, connect with corporates, and accelerate your innovation journey.
          </p>
          <Link to="/register"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-lg text-base font-bold transition-all shadow-lg"
                style={{ background: '#fff', color: GOLD_DARK }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
            Get Started &mdash; It&apos;s Free <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}

// ── Challenge Card ──────────────────────────────────────────
function ChallengeCard({ challenge: c, onClick }) {
  return (
    <div
      className="rounded-xl p-6 cursor-pointer transition-all"
      style={{ background: '#fff', border: `1px solid ${BORDER}` }}
      onClick={onClick}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = GOLD;
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(213,170,91,0.12)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = BORDER;
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Company info */}
      <div className="flex items-center gap-3 mb-4">
        {c.corporate_logo ? (
          <img src={c.corporate_logo} alt="" className="w-10 h-10 rounded-lg object-contain p-1 bg-white" style={{ border: `1px solid ${BORDER}` }} />
        ) : (
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: GOLD_LIGHT }}>
            <Building2 size={18} style={{ color: GOLD }} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold truncate" style={{ color: GRAY }}>
            {c.company_name || c.organization_name || 'Organization'}
          </div>
          {c.location && (
            <div className="flex items-center gap-1 text-xs" style={{ color: '#aaa' }}>
              <MapPin size={10} /> {c.location}
            </div>
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className="text-base font-bold mb-2 line-clamp-2" style={{ color: DARK, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {c.title}
      </h3>

      {/* Problem snippet */}
      <p className="text-xs leading-relaxed mb-4" style={{ color: GRAY, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {c.problem_statement || c.description || 'No description available'}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {(c.sectors || []).slice(0, 2).map((s, i) => (
          <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: GOLD_LIGHT, color: GOLD_DARK }}>{s}</span>
        ))}
        {(c.technologies || []).slice(0, 2).map((t, i) => (
          <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>{t}</span>
        ))}
      </div>

      {/* Meta row */}
      <div className="flex items-center justify-between pt-3" style={{ borderTop: `1px solid ${BORDER}` }}>
        <div className="flex items-center gap-3 text-xs" style={{ color: GRAY }}>
          {c.budget_range && (
            <span className="flex items-center gap-1"><DollarSign size={11} />{c.budget_range}</span>
          )}
          {c.deadline && (
            <span className="flex items-center gap-1">
              <Calendar size={11} />{new Date(c.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </span>
          )}
        </div>
        <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: GOLD }}>
          <Users size={12} /> {c.application_count || 0}
        </span>
      </div>
    </div>
  );
}

// ── FAQ Accordion (for detail view) ────────────────────────
function FAQAccordion({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden' }}>
      <button onClick={() => setOpen(!open)} className="w-full flex justify-between items-center p-4 text-left"
              style={{ background: open ? GOLD_LIGHT : '#fff', border: 'none', cursor: 'pointer' }}>
        <span className="text-sm font-semibold" style={{ color: DARK }}>{question}</span>
        {open ? <ChevronUp size={16} style={{ color: GRAY }} /> : <ChevronDown size={16} style={{ color: GRAY }} />}
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm leading-relaxed" style={{ color: GRAY }}>{answer}</div>
      )}
    </div>
  );
}
