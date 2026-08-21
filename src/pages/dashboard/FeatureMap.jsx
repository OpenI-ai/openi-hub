/**
 * OpenI Hub — Feature Map (Phase 22)
 * Interactive grid of all platform capabilities grouped by category.
 * Shows which features are available per plan tier.
 */
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  Brain, Sparkles, Rocket, TrendingUp, Target, Award, GraduationCap, BarChart3,
  Link2, DollarSign, MessageSquare, Users, Building2, Search, Shield,
  CalendarCheck, FileText, Briefcase, FlaskConical, User, Lock,
  Star, Map,
} from 'lucide-react';

const G = '#D0A848';

const FEATURES = [
  {
    category: 'Search & Discovery',
    items: [
      { icon: Search, title: 'Keyword Search (FTS)', desc: 'Full-text search with relevance ranking across startups, challenges, and people.', tier: 'free', link: '/search' },
      { icon: Brain, title: 'AI Ask', desc: 'Natural language search — ask in plain English and get structured results with confidence scores.', tier: 'pro', link: '/search' },
      { icon: Sparkles, title: 'Semantic Search', desc: 'pgvector similarity matching finds results even without exact keyword match.', tier: 'pro', link: '/search' },
      { icon: Search, title: 'Directory', desc: 'Browse all 11 persona types with filters for sector, city, skills, and more.', tier: 'free', link: '/dashboard/directory' },
    ],
  },
  {
    category: 'Startup Tools',
    items: [
      { icon: Rocket, title: 'Rich Startup Profile', desc: '15-section comprehensive profile with funding rounds, team, patents, clients, and metrics.', tier: 'pro', link: '/dashboard/profile' },
      { icon: Target, title: 'Challenge Marketplace', desc: 'Browse and apply to open innovation challenges from corporates, investors, and government.', tier: 'free', link: '/dashboard/marketplace' },
      { icon: Shield, title: 'DeepTech Assessment', desc: 'Tech-Readiness-based qualification framework for defence, quantum, biotech, and advanced materials.', tier: 'free', link: '/dashboard/deeptech' },
    ],
  },
  {
    category: 'Investor Tools',
    items: [
      { icon: TrendingUp, title: 'Deal Pipeline', desc: '7-stage workflow from sourcing to close with milestones, tasks, and evaluation tracking.', tier: 'pro', link: '/dashboard/investor/deals' },
      { icon: Award, title: '8-Vector Evaluation', desc: 'Score startups across Market, Team, Tech, Traction, Financials, IP, Scalability, Strategic Fit.', tier: 'pro', link: '/dashboard/investor/deals' },
      { icon: BarChart3, title: 'Portfolio Management', desc: 'Track portfolio companies with entry/exit valuations, equity stakes, and performance.', tier: 'pro', link: '/dashboard/investor/portfolio' },
    ],
  },
  {
    category: 'Incubator & Accelerator',
    items: [
      { icon: GraduationCap, title: 'Program Management', desc: 'Create programs/batches with startup pipeline kanban, milestones, and mentor assignments.', tier: 'pro', link: '/dashboard/incubator/programs' },
      { icon: BarChart3, title: 'Portfolio Health', desc: '8-vector radar charts, at-risk detection, and checkpoint progression tracking.', tier: 'pro', link: '/dashboard/incubator/programs' },
      { icon: Link2, title: 'Service Partner Network', desc: 'Link Service Providers to programs for portfolio startup perks and credits.', tier: 'enterprise', link: '/dashboard/program/service-partners' },
    ],
  },
  {
    category: 'Corporate & Government',
    items: [
      { icon: Target, title: 'Challenge Creation', desc: 'Post Partner/Source/Invest challenges with templates, data rooms, FAQs, and team sharing.', tier: 'free', link: '/dashboard/corporate/challenges' },
      { icon: Star, title: 'Applicant Evaluation', desc: '1-5 star rating, evaluation notes, status pipeline, and recommendation engine.', tier: 'free', link: '/dashboard/corporate/challenges' },
      { icon: Building2, title: 'Collaboration Tracking', desc: 'Milestones, tasks, budget tracking, and progress monitoring for active collaborations.', tier: 'free', link: '/dashboard/corporate/collabs' },
    ],
  },
  {
    category: 'Persona Tools',
    items: [
      { icon: Briefcase, title: 'Service Provider Catalog', desc: 'Manage services, clients, and reviews. Connect with incubator/accelerator programs.', tier: 'free', link: '/dashboard/sp/services' },
      { icon: CalendarCheck, title: 'Mentor Sessions', desc: 'Schedule and track mentoring sessions with availability management.', tier: 'free', link: '/dashboard/mentor/sessions' },
      { icon: FlaskConical, title: 'Lab Equipment & Bookings', desc: 'Catalog lab equipment, manage bookings, and publish research papers.', tier: 'free', link: '/dashboard/lab/equipment' },
    ],
  },
  {
    category: 'Collaboration & Networking',
    items: [
      { icon: Users, title: 'Connection Graph', desc: 'Send/accept connection requests, view mutual connections, build your professional network.', tier: 'free', link: '/dashboard/network' },
      { icon: MessageSquare, title: 'Messaging', desc: 'Direct and group conversations across all persona types.', tier: 'free', link: '/dashboard/messaging' },
      { icon: CalendarCheck, title: 'Meetings & RSVP', desc: 'Schedule meetings with RSVP tracking and automatic confirmations.', tier: 'free', link: '/dashboard/meetings' },
    ],
  },
  {
    category: 'Platform & Admin',
    items: [
      { icon: DollarSign, title: 'Multi-Currency', desc: 'Native INR + USD support across all monetary fields with compact formatting.', tier: 'enterprise', link: '/dashboard/settings' },
      { icon: Building2, title: 'Organization Admin', desc: 'Create organizations, manage team members, bulk licensing with seat management.', tier: 'free', link: '/dashboard/organization' },
      { icon: FileText, title: 'PDF Export', desc: 'Branded PDF invoices, challenge summaries, and sector reports with OpenI styling.', tier: 'free', link: '/dashboard/settings' },
      { icon: User, title: 'Onboarding Wizard', desc: 'Persona-specific guided setup with progress tracking and skippable steps.', tier: 'free', link: '/dashboard/onboarding' },
    ],
  },
];

const TIER_CONFIG = {
  free: { label: 'Free', color: '#16a34a', bg: '#f0fdf4' },
  pro: { label: 'Pro', color: '#D0A848', bg: '#fffbeb' },
  enterprise: { label: 'Enterprise', color: '#7c3aed', bg: '#f5f3ff' },
};

export default function FeatureMap() {
  const { user } = useAuth();
  const [filter, setFilter] = useState('all'); // all | free | pro | enterprise
  const plan = user?.current_plan || 'free';

  const isAccessible = (tier) => {
    if (plan === 'enterprise') return true;
    if (plan === 'pro') return tier !== 'enterprise';
    return tier === 'free';
  };

  return (
    <div id="tour-page-features" style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <Map size={22} color={G} />
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>Feature Map</h1>
      </div>
      <p style={{ fontSize: 13, color: '#5c5c5c', marginBottom: 20 }}>
        Explore all platform capabilities. Your plan: <strong style={{ color: TIER_CONFIG[plan]?.color }}>{TIER_CONFIG[plan]?.label || 'Free'}</strong>
      </p>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
        {[{ key: 'all', label: 'All Features' }, ...Object.entries(TIER_CONFIG).map(([k, v]) => ({ key: k, label: v.label }))].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            style={{
              padding: '6px 14px', fontSize: 12, fontWeight: filter === f.key ? 700 : 500,
              borderRadius: 20, border: filter === f.key ? `1px solid ${G}` : '1px solid #eee',
              background: filter === f.key ? '#fffbeb' : '#fff', color: filter === f.key ? G : '#666',
              cursor: 'pointer',
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Feature grid */}
      {FEATURES.map((group, gi) => {
        const filtered = filter === 'all' ? group.items : group.items.filter(i => i.tier === filter);
        if (!filtered.length) return null;
        return (
          <div key={gi} style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid #eee' }}>
              {group.category}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {filtered.map((feat, fi) => {
                const Icon = feat.icon;
                const tier = TIER_CONFIG[feat.tier];
                const accessible = isAccessible(feat.tier);
                return (
                  <Link key={fi} to={feat.link} style={{ textDecoration: 'none' }}>
                    <div style={{
                      background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: 16,
                      transition: 'all 0.15s', position: 'relative', opacity: accessible ? 1 : 0.7,
                    }}
                      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; e.currentTarget.style.borderColor = G; }}
                      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#eee'; }}
                    >
                      {/* Tier badge */}
                      <span style={{
                        position: 'absolute', top: 10, right: 10, fontSize: 9, fontWeight: 700,
                        padding: '2px 8px', borderRadius: 10, background: tier.bg, color: tier.color,
                      }}>
                        {tier.label}
                      </span>

                      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${tier.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {accessible ? <Icon size={16} color={tier.color} /> : <Lock size={14} color="#bbb" />}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', marginBottom: 3 }}>{feat.title}</div>
                          <div style={{ fontSize: 11, color: '#5c5c5c', lineHeight: 1.5 }}>{feat.desc}</div>
                        </div>
                      </div>

                      {!accessible && (
                        <div style={{ marginTop: 8, fontSize: 10, color: G, fontWeight: 600, textAlign: 'right' }}>
                          Upgrade to {tier.label} →
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
