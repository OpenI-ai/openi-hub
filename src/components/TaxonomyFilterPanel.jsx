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
import React from 'react';
import { Search, Filter } from 'lucide-react';

const G = '#D5AA5B';

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

      {/* Technology (dropdown with optgroups for hierarchy) */}
      {(taxonomy.technologies || []).length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>Technology</label>
          <select
            value={filters.technology || ''}
            onChange={e => onChange('technology', e.target.value)}
            style={{ width: '100%', padding: '7px 8px', fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 8, background: '#f9fafb' }}
          >
            <option value="">All Technologies</option>
            {taxonomy.technologies
              .filter(t => !t.parent_id)
              .sort((a, b) => a.name.localeCompare(b.name))
              .map(root => {
                const children = taxonomy.technologies
                  .filter(c => c.parent_id === root.id)
                  .sort((a, b) => a.name.localeCompare(b.name));
                // Root is always selectable. If it has children, wrap children in an optgroup under it.
                return (
                  <React.Fragment key={root.id}>
                    <option value={root.name}>{root.name}</option>
                    {children.length > 0 && (
                      <optgroup label={'  └─ ' + root.name}>
                        {children.map(child => (
                          <option key={child.id} value={child.name}>
                            &nbsp;&nbsp;{child.name}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </React.Fragment>
                );
              })}
          </select>
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
