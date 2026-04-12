/**
 * OpenI Hub — What's New / Changelog (Phase 22)
 * Shows platform updates organized by date.
 */
import { useState } from 'react';
import { Sparkles, Rocket, Shield, TrendingUp, Users, Brain, Lock, Building2, Zap, FlaskConical, Briefcase, CalendarCheck } from 'lucide-react';

const G = '#D5AA5B';
const card = { background: '#fff', border: '1px solid #eee', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: 20 };

const CHANGELOG = [
  {
    date: 'April 12, 2026',
    title: 'Massive Platform Update — 9 New Modules',
    badge: 'LATEST',
    items: [
      { icon: Users, color: '#3b82f6', title: 'My Network & Connections', desc: 'LinkedIn-style connection graph. Send/accept requests, view mutual connections, discover people across the ecosystem.' },
      { icon: Lock, color: '#D5AA5B', title: 'Feature-Based Licensing', desc: 'Granular feature gating per plan tier. AI Ask, Portfolio Health, Deal Pipeline, and Service Partners now enforced at the API level.' },
      { icon: Building2, color: '#16a34a', title: 'Organization Admin & Bulk Licensing', desc: 'Create organizations, invite team members, manage seats. Members automatically inherit the org plan.' },
      { icon: Briefcase, color: '#0d9488', title: 'Service Provider Enhancement', desc: 'Full service catalog, client list, and review system for Service Providers. Manage your offerings and track client engagements.' },
      { icon: CalendarCheck, color: '#ec4899', title: 'Mentor Sessions & Availability', desc: 'Mentors can now manage session schedules, set weekly availability slots, and track session ratings.' },
      { icon: FlaskConical, color: '#14b8a6', title: 'Lab Equipment & Publications', desc: 'Labs can catalog equipment with booking management, and maintain a publications list with DOI links.' },
      { icon: Sparkles, color: '#7c3aed', title: 'Onboarding Wizard', desc: 'New users get a persona-specific guided setup wizard with progress tracking and skippable steps.' },
      { icon: TrendingUp, color: '#f59e0b', title: 'Multi-Currency Everywhere', desc: 'INR + USD currency selectors added across all monetary fields — startup profiles, investor profiles, mentor rates, lab rates, and more.' },
    ],
  },
  {
    date: 'April 11, 2026',
    title: 'Incubator & Accelerator Ecosystem',
    items: [
      { icon: Rocket, color: '#8b5cf6', title: 'Incubator Programs', desc: 'Full program management with 6-stage startup pipeline kanban, mentor pool, mentor assignments, and auto-seeded milestones.' },
      { icon: Zap, color: '#ef4444', title: 'Accelerator Batches', desc: 'Batch management with demo days, corporate partners, investor network, and 7-step milestone tracking.' },
      { icon: Shield, color: '#16a34a', title: 'Portfolio Health Analytics', desc: '8-vector radar charts, at-risk detection, checkpoint progression tracking for incubator and accelerator portfolios.' },
      { icon: TrendingUp, color: '#D5AA5B', title: 'Service Partner Network', desc: 'Link Service Providers to programs so portfolio startups can access cloud credits, legal services, and more.' },
    ],
  },
  {
    date: 'April 10, 2026',
    title: 'AI-Powered Search',
    items: [
      { icon: Brain, color: '#7c3aed', title: 'AI Ask — Natural Language Search', desc: 'Search the entire ecosystem in plain English. AI parses queries into structured filters with confidence scores.' },
      { icon: Sparkles, color: '#3b82f6', title: 'Semantic Search', desc: 'pgvector-powered similarity matching finds relevant results even when exact keywords do not match.' },
    ],
  },
  {
    date: 'April 9, 2026',
    title: 'Search & Taxonomy Overhaul',
    items: [
      { icon: Rocket, color: '#16a34a', title: 'Full-Text Search', desc: 'PostgreSQL tsvector-powered search with weighted relevance ranking across startups, challenges, and directory profiles.' },
      { icon: Shield, color: '#f59e0b', title: '856+ Taxonomy Entries', desc: '5 taxonomy tables with 297 sectors, 105 functions, 170 technologies, 92 use cases, and 192 industries.' },
    ],
  },
  {
    date: 'April 8, 2026',
    title: 'Rich Profiles & Investor Tools',
    items: [
      { icon: Rocket, color: '#D5AA5B', title: 'Rich Startup Profiles', desc: '15-section comprehensive profiles with products, team, funding rounds, clients, patents, competitors, awards, news, and acquisitions.' },
      { icon: TrendingUp, color: '#f59e0b', title: 'Investor Deal Pipeline', desc: '7-stage deal workflow with 8-vector evaluations, milestones, tasks, portfolio management, and exit tracking.' },
    ],
  },
];

export default function WhatsNew() {
  const [expanded, setExpanded] = useState(0);

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <Sparkles size={22} color={G} />
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>What's New</h1>
      </div>
      <p style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>Latest platform updates and new features</p>

      <div style={{ display: 'grid', gap: 16 }}>
        {CHANGELOG.map((release, ri) => (
          <div key={ri} style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, cursor: 'pointer' }}
              onClick={() => setExpanded(expanded === ri ? -1 : ri)}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', marginBottom: 2 }}>{release.date}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>
                  {release.title}
                  {release.badge && (
                    <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: G, color: '#fff', marginLeft: 8, verticalAlign: 'middle' }}>
                      {release.badge}
                    </span>
                  )}
                </div>
              </div>
              <span style={{ fontSize: 12, color: '#bbb' }}>{expanded === ri ? '▲' : '▼'}</span>
            </div>

            {expanded === ri && (
              <div style={{ display: 'grid', gap: 10, marginTop: 8 }}>
                {release.items.map((item, ii) => {
                  const Icon = item.icon;
                  return (
                    <div key={ii} style={{ display: 'flex', gap: 12, padding: '10px 0', borderTop: ii > 0 ? '1px solid #f5f5f5' : 'none' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${item.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={18} color={item.color} />
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', marginBottom: 2 }}>{item.title}</div>
                        <div style={{ fontSize: 12, color: '#666', lineHeight: 1.5 }}>{item.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
