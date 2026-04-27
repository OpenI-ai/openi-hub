import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Building2, MapPin, Cpu, ArrowRight } from 'lucide-react';
import { startupAPI } from '../services/api';

/**
 * SimilarStartupsPanel — Q3/s21 cluster-mate discovery.
 * Mounts on startup profile pages. Fetches GET /api/startups/:id/similar and
 * shows up to 8 other startups in the same s21 K=100 cluster.
 *
 * Tolerates 404 / older backend deploys (component renders nothing if endpoint missing).
 *
 * Props:
 *   - startupId (number|string): user_id or startup_profile.id of the target
 *   - limit (number, default 8)
 */
export default function SimilarStartupsPanel({ startupId, limit = 8 }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!startupId) return;
    let cancelled = false;
    setLoading(true);
    setErr(false);
    startupAPI.getSimilar(startupId, limit)
      .then(d => { if (!cancelled) setData(d); })
      .catch(() => { if (!cancelled) setErr(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [startupId, limit]);

  // Quietly hide if endpoint is missing or no cluster info — non-essential UI
  if (err) return null;
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-5 mt-6">
        <div className="h-5 w-40 bg-gray-100 rounded animate-pulse mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-50 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }
  if (!data || !Array.isArray(data.similar) || data.similar.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 mt-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center">
            <Sparkles size={16} className="text-amber-600" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-gray-900 text-sm">Similar Startups</h3>
            {data.cluster_label && (
              <p className="text-xs text-gray-500">
                Cluster:{' '}
                <span className="font-mono text-xs text-gray-700">{data.cluster_label}</span>
              </p>
            )}
          </div>
        </div>
        <span className="text-xs text-gray-400">{data.similar.length} found</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {data.similar.map(s => (
          <button
            key={s.user_id}
            onClick={() => navigate(`/dashboard/startups/${s.user_id}`)}
            className="text-left group bg-gray-50 hover:bg-white hover:border-primary-200 hover:shadow-sm border border-transparent rounded-xl p-3 transition-all"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {s.logo_url ? (
                  <img
                    src={s.logo_url}
                    alt=""
                    className="w-full h-full object-contain"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : (
                  <Building2 size={18} className="text-gray-400" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <div className="font-medium text-sm text-gray-900 truncate group-hover:text-primary-700">
                    {s.company_name || 'Unnamed'}
                  </div>
                  {s.is_deeptech && (
                    <Cpu size={11} className="text-primary-500 flex-shrink-0" title="DeepTech" />
                  )}
                </div>
                {s.sector && (
                  <div className="text-xs text-gray-500 truncate">{s.sector}</div>
                )}
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                  {s.stage && <span className="truncate">{s.stage}</span>}
                  {s.city && (
                    <span className="flex items-center gap-0.5 truncate">
                      <MapPin size={9} />
                      {s.city}
                    </span>
                  )}
                </div>
              </div>
              <ArrowRight size={14} className="text-gray-300 group-hover:text-primary-500 flex-shrink-0 transition-colors" />
            </div>
          </button>
        ))}
      </div>

      <div className="text-xs text-gray-400 mt-3 flex items-center gap-1">
        <Sparkles size={11} />
        Cluster-based recommendations from semantic embeddings (s21 K=100)
      </div>
    </div>
  );
}
