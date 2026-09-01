/**
 * InnovationMaps.jsx — s106: directory of standalone Innovation Maps.
 *
 * URL: /dashboard/maps
 * One micro-focused map per curated term, grouped by the four buyer-lens
 * dimensions (Sectors / Technologies / Functions / Use cases) — todo #14:
 * "Security should be a standalone map. Retail Banking should be a
 * standalone map. Agentic AI should be a standalone map." Buyers are
 * corporate C-suite executives; their lens is dimension-specific.
 *
 * Terms with zero classified members are hidden (a map must have content
 * to be a pitch surface). If NOTHING is classified yet (the taxonomy job
 * hasn't run), the page says so instead of rendering an empty shell.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Map as MapIcon } from 'lucide-react';
import { mapsAPI } from '../../services/clusterAPI';

export default function InnovationMaps() {
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    mapsAPI
      .list()
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse text-gray-400 text-sm">Loading maps…</div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="p-4 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>
      </div>
    );
  }

  const needle = filter.trim().toLowerCase();
  const dimensions = (data?.dimensions || []).map((d) => ({
    ...d,
    terms: d.terms.filter(
      (t) => t.member_count > 0 && (!needle || t.label.toLowerCase().includes(needle))
    ),
  }));
  const anyContent = dimensions.some((d) => d.terms.length > 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-[#D4A843]/10 rounded-lg">
            <MapIcon className="w-6 h-6 text-[#D4A843]" />
          </div>
          <div>
            <h1 id="tour-page-maps-header" className="text-2xl font-semibold text-[#0D2137]">
              Innovation Maps
            </h1>
            <p className="text-sm text-gray-500">
              The startup landscape, one focused map at a time — by sector, technology,
              function and use case.
            </p>
          </div>
        </div>
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter maps… e.g. Security, Agentic AI, Oncology"
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#D4A843]"
          />
        </div>
      </div>

      {!anyContent && (
        <div className="p-6 bg-white border border-gray-200 rounded-lg text-sm text-gray-600">
          {needle
            ? 'No map matches that filter.'
            : 'The maps are being computed — check back shortly.'}
        </div>
      )}

      {dimensions.map((d) =>
        d.terms.length === 0 ? null : (
          <section key={d.dimension} className="mb-8">
            <h2 className="text-sm font-semibold text-[#0D2137] uppercase tracking-wide mb-3">
              {d.label}
              <span className="ml-2 text-gray-400 font-normal normal-case">
                {d.terms.length} maps
              </span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {d.terms.map((t) => (
                <Link
                  key={t.slug}
                  to={`/dashboard/maps/${d.dimension}/${t.slug}`}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:border-[#D4A843] hover:shadow-sm transition-all"
                >
                  <div className="font-semibold text-sm text-[#0D2137]">{t.label}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {t.member_count.toLocaleString()} startups
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )
      )}
    </div>
  );
}
