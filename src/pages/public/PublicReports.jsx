/**
 * PublicReports — Public page showing curated startup ecosystem reports.
 * No authentication required. Reports link to openi.ai insights pages.
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, ArrowRight, Calendar, User, BookOpen, ExternalLink,
  Zap, Shield, FlaskConical, Heart, Cpu, Layers,
  TrendingUp, ShoppingBag, Shirt, Globe, Building2, Brain,
} from 'lucide-react';
import PublicLayout from '../../components/PublicLayout';
import { publicAPI } from '../../services/api';

// Brand colors
const GOLD = '#D5AA5B';
const GOLD_DARK = '#C9983F';
const GOLD_LIGHT = 'rgba(213, 170, 91, 0.1)';
const DARK = '#1a1a1a';
const GRAY = '#6b7280';
const BORDER = '#e5e7eb';
const LIGHT_GRAY = '#f5f5f5';

// Sector icon mapping
const SECTOR_ICONS = {
  'Agentic AI': Brain,
  'DeepTech': Zap,
  'FinTech': TrendingUp,
  'CPG': ShoppingBag,
  'FashionTech': Shirt,
  'ImpactTech': Heart,
  'ConstructionTech': Building2,
  'Cyber Security': Shield,
  'AI': Cpu,
  'AI/ML': Cpu,
  'Defence': Shield,
  'CleanTech': FlaskConical,
  'HealthTech': Heart,
  'Quantum': Layers,
  'Semiconductor': Cpu,
};

// Sector color mapping
const SECTOR_COLORS = {
  'Agentic AI': '#8b5cf6',
  'DeepTech': '#D5AA5B',
  'FinTech': '#3b82f6',
  'CPG': '#f97316',
  'FashionTech': '#ec4899',
  'ImpactTech': '#10b981',
  'ConstructionTech': '#78716c',
  'Cyber Security': '#ef4444',
  'AI': '#6366f1',
  'AI/ML': '#6366f1',
  'Defence': '#16a34a',
  'CleanTech': '#10b981',
  'HealthTech': '#ef4444',
  'Quantum': '#06b6d4',
  'Semiconductor': '#f97316',
};

export default function PublicReports() {
  const [reports, setReports] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [selectedSector, setSelectedSector] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchReports(); }, [selectedSector]);

  async function fetchReports() {
    setLoading(true);
    try {
      const params = {};
      if (selectedSector) params.sector = selectedSector;
      const data = await publicAPI.listReports(params);
      setReports(data.reports || []);
      if (data.filters?.sectors) setSectors(data.filters.sectors);
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
          <h1 className="text-3xl md:text-5xl font-bold mb-4" style={{ color: DARK, fontFamily: 'Plus Jakarta Sans, Inter, sans-serif' }}>
            Curated <span style={{ color: GOLD }}>Insights</span> for Innovators
          </h1>
          <p className="text-base max-w-xl mx-auto" style={{ color: GRAY }}>
            In-depth reports on the global startup ecosystem across deep-tech sectors. Data-driven analysis to power your innovation strategy.
          </p>
        </div>
      </section>

      {/* Filter bar */}
      <section className="px-6 py-6" style={{ background: '#fff', borderBottom: `1px solid ${BORDER}` }}>
        <div className="max-w-6xl mx-auto flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold" style={{ color: DARK }}>Filter by sector:</span>
          <button
            onClick={() => setSelectedSector('')}
            className="px-4 py-2 rounded-full text-xs font-bold transition-all"
            style={{
              background: !selectedSector ? GOLD : '#fff',
              color: !selectedSector ? '#fff' : GRAY,
              border: `1px solid ${!selectedSector ? GOLD : BORDER}`,
            }}
          >
            All Sectors
          </button>
          {sectors.map(s => (
            <button
              key={s}
              onClick={() => setSelectedSector(s)}
              className="px-4 py-2 rounded-full text-xs font-bold transition-all"
              style={{
                background: selectedSector === s ? (SECTOR_COLORS[s] || GOLD) : '#fff',
                color: selectedSector === s ? '#fff' : GRAY,
                border: `1px solid ${selectedSector === s ? (SECTOR_COLORS[s] || GOLD) : BORDER}`,
              }}
            >
              {s}
            </button>
          ))}
          <span className="ml-auto text-sm" style={{ color: GRAY }}>
            {reports.length} report{reports.length !== 1 ? 's' : ''}
          </span>
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
                <h4 className="text-sm font-bold mb-2" style={{ color: DARK }}>{item.title}</h4>
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
  const SectorIcon = SECTOR_ICONS[report.sector] || FileText;
  const sectorColor = SECTOR_COLORS[report.sector] || GOLD;
  const reportUrl = report.cover_url || '#';

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
        <h3 className="text-base font-bold mb-2 line-clamp-2" style={{ color: DARK, minHeight: 44 }}>
          {report.title}
        </h3>
        <p className="text-xs leading-relaxed mb-4" style={{ color: GRAY, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {report.description}
        </p>

        {/* Meta */}
        <div className="flex items-center gap-4 mb-4 text-xs" style={{ color: GRAY }}>
          {report.author && <span className="flex items-center gap-1"><User size={11} /> {report.author}</span>}
          {report.pages && <span className="flex items-center gap-1"><FileText size={11} /> {report.pages} pages</span>}
        </div>

        {/* Action button — link to openi.ai report page */}
        <a
          href={reportUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all"
          style={{ background: sectorColor, color: '#fff', textDecoration: 'none' }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <ExternalLink size={14} /> Read Report
        </a>
      </div>
    </div>
  );
}
