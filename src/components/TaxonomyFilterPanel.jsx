/**
 * Shared taxonomy filter panel for startup discovery across personas.
 *
 * Props:
 *  - taxonomy: { sectors, functions, technologies, usecases } from /api/public/taxonomy
 *  - filters: { sector, func, technology, usecase, stage, search }
 *  - onChange: (key, value) => void  — set filter key
 *  - onClear: () => void              — clear all
 *  - facets: { stage: { [name]: count }, sector: { [name]: count } }
 */
import React, { useState } from 'react';
import { Search, Filter, X, ChevronDown, ChevronRight } from 'lucide-react';

const G = '#D5AA5B';

function TechTree({ technologies, selected, onSelect }) {
  const roots = technologies.filter(t => !t.parent_id);
  const getChildren = (parentId) => technologies.filter(t => t.parent_id === parentId);
  const [expanded, setExpanded] = useState({});

  return (
    <div>
      {roots.map(root => {
        const children = getChildren(root.id);
        const isExp = expanded[root.id];
        return (
          <div key={root.id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 0', cursor: 'pointer' }}
              onClick={() => { onSelect(root.name); if (children.length) setExpanded(p => ({ ...p, [root.id]: !p[root.id] })); }}>
              {children.length > 0 && (isExp ? <ChevronDown size={12} style={{ color: '#888' }} /> : <ChevronRight size={12} style={{ color: '#888' }} />)}
              <span style={{ fontSize: 12, fontWeight: selected === root.name ? 700 : 400, color: selected === root.name ? G : '#555' }}>{root.name}</span>
            </div>
            {isExp && children.map(child => {
              const grandChildren = getChildren(child.id);
              return (
                <div key={child.id} style={{ paddingLeft: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 0', cursor: 'pointer' }}
                    onClick={() => { onSelect(child.name); if (grandChildren.length) setExpanded(p => ({ ...p, [child.id]: !p[child.id] })); }}>
                    {grandChildren.length > 0 && (expanded[child.id] ? <ChevronDown size={10} /> : <ChevronRight size={10} />)}
                    <span style={{ fontSize: 11, fontWeight: selected === child.name ? 700 : 400, color: selected === child.name ? G : '#666' }}>{child.name}</span>
                  </div>
                  {expanded[child.id] && grandChildren.map(gc => (
                    <div key={gc.id} style={{ paddingLeft: 20, padding: '2px 0 2px 20px', cursor: 'pointer' }}
                      onClick={() => onSelect(gc.name)}>
                      <span style={{ fontSize: 11, fontWeight: selected === gc.name ? 700 : 400, color: selected === gc.name ? G : '#777' }}>{gc.name}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

const DEFAULT_STAGES = ['Pre-seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Growth', 'Late Stage'];

export default function TaxonomyFilterPanel({ taxonomy, filters, onChange, onClear, facets = {}, stages = DEFAULT_STAGES, showDeeptech = true }) {
  const hasFilters = Object.entries(filters || {}).some(([, v]) => v && v !== 'All' && v !== false);
  const stageFacets = facets.stage || {};
  const sectorFacets = facets.sector || {};

  return (
    <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: 16, position: 'sticky', top: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>
          <Filter size={14} style={{ marginRight: 6, verticalAlign: -2 }} />Filters
        </h3>
        {hasFilters && <button onClick={onClear} style={{ fontSize: 11, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}>Clear all</button>}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 14 }}>
        <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
        <input
          type="text"
          value={filters.search || ''}
          onChange={e => onChange('search', e.target.value)}
          placeholder="Search startups..."
          style={{ width: '100%', padding: '8px 10px 8px 30px', fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 8, outline: 'none', background: '#f9fafb', boxSizing: 'border-box' }}
          onFocus={e => e.target.style.borderColor = G}
          onBlur={e => e.target.style.borderColor = '#e5e7eb'}
        />
      </div>

      {/* Sector (with facet counts when available) */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>Sector</label>
        <select
          value={filters.sector || ''}
          onChange={e => onChange('sector', e.target.value)}
          style={{ width: '100%', padding: '7px 8px', fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 8, background: '#f9fafb' }}
        >
          <option value="">All Sectors</option>
          {(taxonomy.sectors || []).filter(s => !s.parent_id).sort((a, b) => (sectorFacets[b.name] || 0) - (sectorFacets[a.name] || 0)).map(s => (
            <option key={s.id} value={s.name}>
              {s.name}{sectorFacets[s.name] != null ? ` (${sectorFacets[s.name]})` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Function */}
      {(taxonomy.functions || []).length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>Function</label>
          <select
            value={filters.func || ''}
            onChange={e => onChange('func', e.target.value)}
            style={{ width: '100%', padding: '7px 8px', fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 8, background: '#f9fafb' }}
          >
            <option value="">All Functions</option>
            {taxonomy.functions.filter(f => !f.parent_id).map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
          </select>
        </div>
      )}

      {/* Technology tree */}
      {(taxonomy.technologies || []).length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>
            Technology
            {filters.technology && <button onClick={() => onChange('technology', '')} style={{ float: 'right', background: 'none', border: 'none', fontSize: 10, color: '#dc2626', cursor: 'pointer' }}>clear</button>}
          </label>
          <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #eee', borderRadius: 8, padding: 8, background: '#fafafa' }}>
            <TechTree
              technologies={taxonomy.technologies}
              selected={filters.technology || ''}
              onSelect={v => onChange('technology', filters.technology === v ? '' : v)}
            />
          </div>
        </div>
      )}

      {/* Use case */}
      {(taxonomy.usecases || []).length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>Use Case</label>
          <select
            value={filters.usecase || ''}
            onChange={e => onChange('usecase', e.target.value)}
            style={{ width: '100%', padding: '7px 8px', fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 8, background: '#f9fafb' }}
          >
            <option value="">All Use Cases</option>
            {taxonomy.usecases.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
          </select>
        </div>
      )}

      {/* Stage chips with facet counts */}
      <div style={{ marginBottom: showDeeptech ? 14 : 0 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>Stage</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {stages.map(s => {
            const n = stageFacets[s];
            return (
              <button
                key={s}
                onClick={() => onChange('stage', filters.stage === s ? '' : s)}
                style={{
                  padding: '4px 10px', fontSize: 11, borderRadius: 20,
                  border: `1px solid ${filters.stage === s ? G : '#e5e7eb'}`,
                  background: filters.stage === s ? G : '#fff',
                  color: filters.stage === s ? '#fff' : '#666',
                  cursor: 'pointer',
                }}
              >
                {s}{n != null ? ` (${n})` : ''}
              </button>
            );
          })}
        </div>
      </div>

      {/* DeepTech toggle */}
      {showDeeptech && (
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#555', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={!!filters.deeptech}
              onChange={e => onChange('deeptech', e.target.checked)}
              style={{ accentColor: G }}
            />
            DeepTech only
          </label>
        </div>
      )}
    </div>
  );
}
