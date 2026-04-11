/**
 * PortfolioRadarChart (Phase 16B.4)
 *
 * Renders an 8-vector radar chart using Recharts. Accepts either a single data
 * row (current snapshot) or an array for overlay comparison (current vs prior).
 *
 * Props:
 *   data: Object with the 8 score fields (market_score, team_score, etc.)
 *         OR { current: {...}, previous: {...} } for comparison overlay
 *   size?: 'sm' | 'md' | 'lg' (default 'md')
 *   title?: string
 */
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Legend, Tooltip,
} from 'recharts';

const VECTOR_LABELS = {
  market_score:        'Market',
  team_score:          'Team',
  tech_score:          'Tech',
  traction_score:      'Traction',
  financials_score:    'Financials',
  ip_score:            'IP',
  scalability_score:   'Scalability',
  strategic_fit_score: 'Strategic Fit',
};

const G = '#D5AA5B';
const BLUE = '#3b82f6';

function toChartData(scores) {
  if (!scores) return [];
  return Object.entries(VECTOR_LABELS).map(([key, label]) => ({
    vector: label,
    value: scores[key] != null ? parseFloat(scores[key]) : 0,
  }));
}

function toOverlayData(current, previous) {
  return Object.entries(VECTOR_LABELS).map(([key, label]) => ({
    vector: label,
    current:  current?.[key]  != null ? parseFloat(current[key])  : 0,
    previous: previous?.[key] != null ? parseFloat(previous[key]) : 0,
  }));
}

export default function PortfolioRadarChart({ data, previous, size = 'md', title }) {
  const height = size === 'sm' ? 220 : size === 'lg' ? 380 : 300;
  const isOverlay = previous != null;

  const chartData = isOverlay ? toOverlayData(data, previous) : toChartData(data);

  return (
    <div style={{ width: '100%' }}>
      {title && (
        <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 8, textAlign: 'center' }}>
          {title}
        </div>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart outerRadius="75%" data={chartData}>
          <PolarGrid stroke="#eee" />
          <PolarAngleAxis dataKey="vector" tick={{ fontSize: 11, fill: '#666' }} />
          <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fontSize: 9, fill: '#999' }} />
          {isOverlay ? (
            <>
              <Radar name="Previous" dataKey="previous" stroke={BLUE} fill={BLUE} fillOpacity={0.15} strokeWidth={2} />
              <Radar name="Current"  dataKey="current"  stroke={G}    fill={G}    fillOpacity={0.25} strokeWidth={2} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </>
          ) : (
            <Radar name="Score" dataKey="value" stroke={G} fill={G} fillOpacity={0.3} strokeWidth={2} />
          )}
          <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6, border: '1px solid #eee' }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
