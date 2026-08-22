/**
 * PublicReports — Public page showing curated startup ecosystem reports.
 * No authentication required. Reports link to openi.ai insights pages.
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, ArrowRight, Calendar, User, BookOpen, Download,
  Zap, Shield,
} from 'lucide-react';
import PublicLayout from '../../components/PublicLayout';
import { publicAPI } from '../../services/api';
import { getSectorIcon, getSectorColor } from '../../constants/knowledgeIcons';

// Brand colors
const GOLD = '#D0A848';
const GOLD_DARK = '#C9983F';
const GOLD_LIGHT = 'rgba(213, 170, 91, 0.1)';
const DARK = '#1a1a1a';
const GRAY = '#6b7280';
const BORDER = '#e5e7eb';
const LIGHT_GRAY = '#f5f5f5';

// One row's worth at the widths these chips render at. Sectors get fewer
// because their labels are longer ("Real Estate & Construction").
const SECTOR_CHIP_LIMIT = 6;
const TECH_CHIP_LIMIT = 8;

/**
 * The chips to actually render: the first `limit`, plus the selected one even
 * when it sorts past the cut. Without that second part, filtering by a
 * technology low in the alphabet would collapse the row and leave nothing
 * showing as active — the user would see an "All Technologies" chip that is
 * not highlighted and no indication of what is filtering their results.
 */
function visibleChips(all, selected, expanded, limit) {
  if (expanded || all.length <= limit) return all;
  const head = all.slice(0, limit);
  if (selected && !head.includes(selected)) return [selected, ...head.slice(0, limit - 1)];
  return head;
}

/** "+58 more" / "Show fewer". Renders nothing when everything already fits. */
function MoreChipsButton({ total, limit, expanded, onToggle }) {
  if (total <= limit) return null;
  return (
    <button
      onClick={onToggle}
      className="px-3 py-2 min-h-[44px] inline-flex items-center rounded-full text-xs font-bold underline transition-all"
      style={{ background: 'none', border: 'none', color: GOLD_DARK, cursor: 'pointer' }}
    >
      {expanded ? 'Show fewer' : `+${total - limit} more`}
    </button>
  );
}

export default function PublicReports() {
  const [reports, setReports] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [technologies, setTechnologies] = useState([]);
  const [selectedSector, setSelectedSector] = useState('');
  const [selectedTechnology, setSelectedTechnology] = useState('');
  // 22 Aug 2026 — both filter rows render one chip per value, unbounded. With
  // the Knowledge Hub as the only source the vocabulary grew to ~13 sectors and
  // ~70 technologies, so the filter bar ran eight rows deep and pushed all 14
  // reports below the fold: the page opened on a wall of filters for content
  // you could not see. Reported as "entire page is filled with sector and tech,
  // reports are buried". Both rows now show one row's worth and expand on
  // request.
  const [showAllSectors, setShowAllSectors] = useState(false);
  const [showAllTechnologies, setShowAllTechnologies] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchReports(); }, [selectedSector, selectedTechnology]);

  async function fetchReports() {
    setLoading(true);
    try {
      const params = {};
      if (selectedSector) params.sector = selectedSector;
      if (selectedTechnology) params.technology = selectedTechnology;
      const data = await publicAPI.listReports(params);
      setReports(data.reports || []);
      // Deduped for the same reason as the card chips below: these arrays are
      // rendered with key={value}, so one repeated entry from the API is a
      // duplicate-key warning and a doubled filter button. Clean as of 21 Aug
      // 2026 (9 sectors, 58 technologies, no repeats) — this keeps it that way
      // without depending on the backend to guarantee it.
      if (data.filters?.sectors) setSectors([...new Set(data.filters.sectors)]);
      if (data.filters?.technologies) setTechnologies([...new Set(data.filters.technologies)]);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally { setLoading(false); }
  }

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="px-6 pt-16 pb-12 text-center" style={{ background: `linear-gradient(180deg, ${LIGHT_GRAY} 0%, #fff 100%)` }}>
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 text-xs font-bold tracking-wide"
               style={{ background: GOLD_LIGHT, color: GOLD_DARK }}>
            <BookOpen size={14} /> STARTUP ECOSYSTEM REPORTS
          </div>
          <h1 id="tour-page-reports" className="text-3xl md:text-5xl font-bold mb-4" style={{ color: DARK, fontFamily: 'Plus Jakarta Sans, Inter, sans-serif' }}>
            Curated <span style={{ color: GOLD }}>Insights</span> for Innovators
          </h1>
          <p className="text-base max-w-xl mx-auto" style={{ color: GRAY }}>
            In-depth reports on the global startup ecosystem across deep-tech sectors. Data-driven analysis to power your innovation strategy.
          </p>
        </div>
      </section>

      {/* Filter bar */}
      <section className="px-6 py-6" style={{ background: '#fff', borderBottom: `1px solid ${BORDER}` }}>
        <div className="max-w-6xl mx-auto space-y-3">
          {/* Sector row */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold w-32 shrink-0" style={{ color: DARK }}>Filter by sector:</span>
            <button
              onClick={() => setSelectedSector('')}
              className="px-4 py-2 min-h-[44px] inline-flex items-center rounded-full text-xs font-bold transition-all"
              style={{
                background: !selectedSector ? GOLD : '#fff',
                color: !selectedSector ? '#fff' : GRAY,
                border: `1px solid ${!selectedSector ? GOLD : BORDER}`,
              }}
            >
              All Sectors
            </button>
            {visibleChips(sectors, selectedSector, showAllSectors, SECTOR_CHIP_LIMIT).map(s => (
              <button
                key={s}
                onClick={() => setSelectedSector(s)}
                className="px-4 py-2 min-h-[44px] inline-flex items-center rounded-full text-xs font-bold transition-all"
                style={{
                  background: selectedSector === s ? getSectorColor(s) : '#fff',
                  color: selectedSector === s ? '#fff' : GRAY,
                  border: `1px solid ${selectedSector === s ? getSectorColor(s) : BORDER}`,
                }}
              >
                {s}
              </button>
            ))}
            <MoreChipsButton
              total={sectors.length}
              limit={SECTOR_CHIP_LIMIT}
              expanded={showAllSectors}
              onToggle={() => setShowAllSectors(v => !v)}
            />
            <span className="ml-auto text-sm" style={{ color: GRAY }}>
              {reports.length} report{reports.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Technology row */}
          {technologies.length > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-semibold w-32 shrink-0" style={{ color: DARK }}>Filter by technology:</span>
              <button
                onClick={() => setSelectedTechnology('')}
                className="px-4 py-2 min-h-[44px] inline-flex items-center rounded-full text-xs font-bold transition-all"
                style={{
                  background: !selectedTechnology ? GOLD : '#fff',
                  color: !selectedTechnology ? '#fff' : GRAY,
                  border: `1px solid ${!selectedTechnology ? GOLD : BORDER}`,
                }}
              >
                All Technologies
              </button>
              {visibleChips(technologies, selectedTechnology, showAllTechnologies, TECH_CHIP_LIMIT).map(t => (
                <button
                  key={t}
                  onClick={() => setSelectedTechnology(t)}
                  className="px-4 py-2 min-h-[44px] inline-flex items-center rounded-full text-xs font-bold transition-all"
                  style={{
                    background: selectedTechnology === t ? GOLD : '#fff',
                    color: selectedTechnology === t ? '#fff' : GRAY,
                    border: `1px solid ${selectedTechnology === t ? GOLD : BORDER}`,
                  }}
                >
                  {t}
                </button>
              ))}
              <MoreChipsButton
                total={technologies.length}
                limit={TECH_CHIP_LIMIT}
                expanded={showAllTechnologies}
                onToggle={() => setShowAllTechnologies(v => !v)}
              />
            </div>
          )}
        </div>
      </section>

      {/* Reports Grid */}
      <section className="px-6 py-10" style={{ background: '#fff' }}>
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-xl animate-pulse" style={{ background: LIGHT_GRAY, height: 320 }} />
              ))}
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-20">
              <FileText size={48} style={{ color: BORDER, margin: '0 auto 16px' }} />
              <h3 className="text-lg font-bold mb-2" style={{ color: DARK }}>No reports found</h3>
              <p className="text-sm" style={{ color: GRAY }}>Try selecting a different sector.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reports.map(report => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Why our reports section */}
      <section className="px-6 py-16" style={{ background: LIGHT_GRAY }}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ color: DARK }}>
            Why OpenI Reports?
          </h2>
          <p className="text-sm mb-10 max-w-xl mx-auto" style={{ color: GRAY }}>
            Our reports are powered by real platform data from hundreds of startups and corporates on OpenI.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Zap, title: 'Platform Data', desc: 'Built from real startup profiles, challenge applications, and evaluation data on OpenI.' },
              { icon: Shield, title: 'Expert Curated', desc: 'Reviewed and validated by domain experts across deep-tech sectors.' },
              { icon: BookOpen, title: 'Actionable Insights', desc: 'Not just numbers — strategic recommendations for corporates, investors, and policymakers.' },
            ].map((item, i) => (
              <div key={i} className="p-6 rounded-xl" style={{ background: '#fff', border: `1px solid ${BORDER}` }}>
                <div className="w-11 h-11 rounded-lg flex items-center justify-center mx-auto mb-4" style={{ background: GOLD_LIGHT }}>
                  <item.icon size={22} style={{ color: GOLD }} />
                </div>
                {/* h3 under the "Why OpenI Reports?" h2 — h4 here skipped a level. */}
                <h3 className="text-sm font-bold mb-2" style={{ color: DARK }}>{item.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: GRAY }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16" style={{ background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_DARK} 100%)` }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white">Want Full Access?</h2>
          <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.9)' }}>
            Register on OpenI to access detailed data, connect with startups and corporates featured in our research, and collaborate on innovation.
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

// ── Report Card ───────────────────────────────────────────
function ReportCard({ report }) {
  const SectorIcon = getSectorIcon(report.sector, report.tags, report.category);
  const sectorColor = getSectorColor(report.sector);
  const reportUrl = report.cover_proxy_url || report.cover_url || publicAPI.reportPdfUrl(report.id);

  return (
    <div
      className="rounded-xl overflow-hidden transition-all"
      style={{ background: '#fff', border: `1px solid ${BORDER}` }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = sectorColor;
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = `0 8px 24px ${sectorColor}20`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = BORDER;
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Cover gradient */}
      <div className="h-36 flex items-center justify-center relative"
           style={{ background: `linear-gradient(135deg, ${sectorColor}15 0%, ${sectorColor}30 100%)` }}>
        <SectorIcon size={48} style={{ color: sectorColor, opacity: 0.5 }} />
        {/* Sector badge */}
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold"
             style={{ background: `${sectorColor}20`, color: sectorColor }}>
          {report.sector}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* h2: directly under the page <h1>; h3 here skipped a level. */}
        <h2 className="text-base font-bold mb-2 line-clamp-2" style={{ color: DARK, minHeight: 44 }}>
          {report.title}
        </h2>
        <p className="text-xs leading-relaxed mb-4" style={{ color: GRAY, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {report.description}
        </p>

        {/* Technology chips */}
        {report.technologies?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {/* Deduped before render (UX audit, 21 Aug 2026). The live payload
                has at least one report — "THE FUTURE OF FASHION" — carrying
                "Manufacturing" twice in technologies[]. With key={t} that threw
                React's "Encountered two children with the same key" warning on
                every /reports load, and rendered the same chip twice. Keys must
                be unique among siblings, and React's recovery from a duplicate
                is to reuse one element for both, which attaches state to the
                wrong node the moment this list re-renders under a filter
                change. Deduping fixes the warning and the visible repeat at
                once; it is also simply what the UI means — a tag list is a set.
                Order is preserved: Set keeps insertion order. */}
            {[...new Set(report.technologies)].map(t => (
              <span key={t} className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                    style={{ background: LIGHT_GRAY, color: GRAY, border: `1px solid ${BORDER}` }}>
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Meta */}
        <div className="flex items-center gap-4 mb-4 text-xs" style={{ color: GRAY }}>
          {report.published_at && (
            <span className="flex items-center gap-1">
              <Calendar size={11} />
              {new Date(report.published_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          )}
          {report.author && <span className="flex items-center gap-1"><User size={11} /> {report.author}</span>}
          {report.pages && <span className="flex items-center gap-1"><FileText size={11} /> {report.pages} pages</span>}
        </div>

        {/* Action button — open the report PDF in a new tab.
            NOTE: do NOT combine `download` with target="_blank" — that combo
            opens a blank tab that closes instantly and nothing happens. */}
        <a
          href={reportUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all"
          style={{ background: sectorColor, color: '#fff', textDecoration: 'none' }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <Download size={14} /> View Report
        </a>
      </div>
    </div>
  );
}
