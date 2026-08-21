/**
 * Shared taxonomy filter panel for startup discovery across personas.
 * Layout: horizontal sticky bar at top of results.
 *
 * Props:
 *  - taxonomy: { sectors, functions, technologies, usecases } from /api/public/taxonomy
 *  - filters: { sector, func, technology, usecase, stage, search, deeptech }
 *  - onChange: (key, value) => void  — set filter key
 *  - onClear: () => void              — clear all
 *  - facets: { stage: { [name]: count }, sector: { [name]: count } }
 *  - stages (optional): array of stage labels to show
 *  - showDeeptech: whether to include the DeepTech toggle (default true)
 *  - geo (optional): { countries: [{value,label,count}], cities: [...] } from
 *      GET /api/startups/geo-options. OPTIONAL on purpose — CorporateStartupSearch
 *      also mounts this panel and does not pass it, and must keep working.
 *      Omit it and the two geography controls simply do not render.
 */
import React from 'react';
import { Search, X } from 'lucide-react';

const G = '#D0A848';

const DEFAULT_STAGES = ['Pre-seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Growth', 'Late Stage'];

const selectStyle = {
  padding: '7px 10px', fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 8,
  background: '#f9fafb', minWidth: 140, cursor: 'pointer',
};

export default function TaxonomyFilterPanel({ taxonomy, filters, onChange, onClear, facets = {}, stages = DEFAULT_STAGES, showDeeptech = true, geo = null }) {
  const hasFilters = Object.entries(filters || {}).some(([k, v]) => k !== 'search' && v && v !== 'All' && v !== false);
  const sectorFacets = facets.sector || {};
  const stageFacets = facets.stage || {};

  const activeChips = Object.entries(filters || {})
    .filter(([k, v]) => k !== 'search' && v && v !== 'All' && v !== false)
    .map(([k, v]) => ({ key: k, value: typeof v === 'boolean' ? 'DeepTech' : v }));

  return (
    <div style={{
      background: '#fff', border: '1px solid #eee', borderRadius: 12,
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: 12, marginBottom: 14,
      position: 'sticky', top: 12, zIndex: 10,
    }}>
      {/* Row 1: Search + primary filters */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 220 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#6e6e6e' }} />
          <input
            type="text"
            value={filters.search || ''}
            onChange={e => onChange('search', e.target.value)}
            placeholder="Search startups by name, description..."
            style={{
              width: '100%', padding: '8px 10px 8px 32px', fontSize: 16,
              border: '1px solid #e5e7eb', borderRadius: 8, outline: 'none',
              background: '#f9fafb', boxSizing: 'border-box',
            }}
            onFocus={e => e.target.style.borderColor = G}
            onBlur={e => e.target.style.borderColor = '#e5e7eb'}
          />
        </div>

        {/* Geography — placed first among the dropdowns deliberately. The client
            report that prompted these controls was "I am getting startup's from
            all geography", so country is the filter that needs to be found without
            hunting. Counts are corpus-wide (rows carrying that country), NOT
            facet-scoped like sector/stage — geo-options is a cached standalone
            query, not part of the listing query, so it does not react to the
            other filters. */}
        {geo && (geo.countries || []).length > 0 && (
          <select
            value={filters.country || ''}
            onChange={e => onChange('country', e.target.value)}
            style={selectStyle}
            aria-label="Country"
          >
            <option value="">All Countries</option>
            {geo.countries.map(c => (
              <option key={c.value} value={c.label}>
                {c.label}{c.count != null ? ` (${c.count})` : ''}
              </option>
            ))}
          </select>
        )}

        {/* City — free-text input backed by a datalist, not a <select>. The list
            only carries cities with >=2 startups (533 of 874); the remaining 341
            are still filterable server-side, so typing one has to stay possible.
            A <select> would make those unreachable from the UI. */}
        {geo && (geo.cities || []).length > 0 && (
          <>
            <input
              type="text"
              list="geo-city-options"
              value={filters.city || ''}
              onChange={e => onChange('city', e.target.value)}
              placeholder="City"
              aria-label="City"
              style={{ ...selectStyle, cursor: 'text', minWidth: 130 }}
              onFocus={e => e.target.style.borderColor = G}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'}
            />
            <datalist id="geo-city-options">
              {geo.cities.map(c => (
                <option key={c.value} value={c.label}>{c.count}</option>
              ))}
            </datalist>
          </>
        )}

        {/* Sector */}
        <select
          value={filters.sector || ''}
          onChange={e => onChange('sector', e.target.value)}
          style={selectStyle}
          aria-label="Sector"
        >
          <option value="">All Sectors</option>
          {(taxonomy.sectors || [])
            .filter(s => !s.parent_id)
            .sort((a, b) => (sectorFacets[b.name] || 0) - (sectorFacets[a.name] || 0))
            .map(s => (
              <option key={s.id} value={s.name}>
                {s.name}{sectorFacets[s.name] != null ? ` (${sectorFacets[s.name]})` : ''}
              </option>
            ))}
        </select>

        {/* Technology */}
        {(taxonomy.technologies || []).length > 0 && (
          <select
            value={filters.technology || ''}
            onChange={e => onChange('technology', e.target.value)}
            style={selectStyle}
            aria-label="Technology"
          >
            <option value="">All Technologies</option>
            {taxonomy.technologies
              .filter(t => !t.parent_id)
              .sort((a, b) => a.name.localeCompare(b.name))
              .map(root => {
                const children = taxonomy.technologies
                  .filter(c => c.parent_id === root.id)
                  .sort((a, b) => a.name.localeCompare(b.name));
                return (
                  <React.Fragment key={root.id}>
                    <option value={root.name}>{root.name}</option>
                    {children.length > 0 && (
                      <optgroup label={'  └─ ' + root.name}>
                        {children.map(child => (
                          <option key={child.id} value={child.name}>&nbsp;&nbsp;{child.name}</option>
                        ))}
                      </optgroup>
                    )}
                  </React.Fragment>
                );
              })}
          </select>
        )}

        {/* Stage */}
        <select
          value={filters.stage || ''}
          onChange={e => onChange('stage', e.target.value)}
          style={selectStyle}
          aria-label="Stage"
        >
          <option value="">All Stages</option>
          {stages.map(s => (
            <option key={s} value={s}>
              {s}{stageFacets[s] != null ? ` (${stageFacets[s]})` : ''}
            </option>
          ))}
        </select>

        {/* Function */}
        {(taxonomy.functions || []).length > 0 && (
          <select
            value={filters.func || ''}
            onChange={e => onChange('func', e.target.value)}
            style={selectStyle}
            aria-label="Function"
          >
            <option value="">All Functions</option>
            {taxonomy.functions.filter(f => !f.parent_id).map(f => (
              <option key={f.id} value={f.name}>{f.name}</option>
            ))}
          </select>
        )}

        {/* Use case */}
        {(taxonomy.usecases || []).length > 0 && (
          <select
            value={filters.usecase || ''}
            onChange={e => onChange('usecase', e.target.value)}
            style={selectStyle}
            aria-label="Use Case"
          >
            <option value="">All Use Cases</option>
            {taxonomy.usecases.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
          </select>
        )}

        {/* DeepTech toggle */}
        {showDeeptech && (
          <label style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#555',
            padding: '7px 12px', borderRadius: 8, background: filters.deeptech ? `${G}15` : '#f9fafb',
            border: `1px solid ${filters.deeptech ? G : '#e5e7eb'}`, cursor: 'pointer',
          }}>
            <input
              type="checkbox"
              checked={!!filters.deeptech}
              onChange={e => onChange('deeptech', e.target.checked)}
              style={{ accentColor: G, margin: 0 }}
            />
            DeepTech
          </label>
        )}

        {hasFilters && (
          <button
            onClick={onClear}
            style={{
              marginLeft: 'auto', padding: '7px 12px', fontSize: 11, fontWeight: 600,
              background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer',
            }}
          >
            Clear all
          </button>
        )}
      </div>

      {/* Active filter chips (row 2) */}
      {activeChips.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10, paddingTop: 10, borderTop: '1px solid #f3f4f6' }}>
          {activeChips.map(({ key, value }) => (
            <span
              key={key}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '3px 10px', fontSize: 11, borderRadius: 20,
                background: `${G}12`, color: G, border: `1px solid ${G}30`,
              }}
            >
              {key}: {value}
              <button
                onClick={() => onChange(key, key === 'deeptech' ? false : '')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: G, padding: 0, display: 'flex' }}
                aria-label={`Remove ${key} filter`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
