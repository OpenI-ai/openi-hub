import { useState } from 'react';
import toast from 'react-hot-toast';
import { dataExportAPI } from '../services/api';
import { Database, Download, Loader2, Key, ExternalLink } from 'lucide-react';

const G = '#D0A848';

const card = {
  background: '#ffffff',
  border: '1px solid #eeeeee',
  borderRadius: 14,
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
};

const inputStyle = {
  padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8,
  fontSize: 12.5, outline: 'none', boxSizing: 'border-box',
};

const TYPES = [
  { value: 'challenges', label: 'Challenges' },
  { value: 'applications', label: 'Applications' },
  { value: 'collaborations', label: 'Collaborations' },
];

// Self-serve Bulk Data Export — lives inside Settings' "Data Export" tab
// (Enterprise-only, gated by the parent tab on plan.features.api_access,
// same flag as the API Keys tab).
// Backend: GET /api/corporate/data-export (dataExportController.js),
// scoped to req.user.id. Supports type(challenges|applications|collaborations),
// from/to, format(json|csv). CSV/JSON file downloads use blobRequest() under
// the hood since the endpoint requires a Bearer header.
export default function SettingsDataExport() {
  const [type, setType] = useState('challenges');
  const [range, setRange] = useState({ from: '', to: '' });
  const [exporting, setExporting] = useState(null); // 'json' | 'csv' | null

  const handleExport = async (format) => {
    setExporting(format);
    try {
      const params = { type };
      if (range.from) params.from = range.from;
      if (range.to) params.to = range.to;

      if (format === 'json') {
        const data = await dataExportAPI.list(params);
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}-export.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        toast.success(`Exported ${data?.count ?? 0} ${type} row(s) as JSON`);
      } else {
        const blob = await dataExportAPI.exportBlob(params, 'csv');
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}-export.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        toast.success(`Exported ${type} as CSV`);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to export data');
    } finally {
      setExporting(null);
    }
  };

  return (
    <div style={{ ...card, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Database size={18} style={{ color: G }} />
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>Data Export</h2>
      </div>

      <p style={{ margin: '0 0 18px', fontSize: 12.5, color: '#5c5c5c' }}>
        Bulk export your organization's own data — challenges, applications, and
        collaborations — as CSV or JSON. Scoped to your account only.
      </p>

      <div
        style={{
          display: 'flex', alignItems: 'flex-end', gap: 10, flexWrap: 'wrap',
          padding: '12px 14px', background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 10, marginBottom: 16,
        }}
      >
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#666', marginBottom: 4 }}>Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            style={{ ...inputStyle, width: 180 }}
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#666', marginBottom: 4 }}>From</label>
          <input
            type="date"
            value={range.from}
            onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#666', marginBottom: 4 }}>To</label>
          <input
            type="date"
            value={range.to}
            onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
            style={inputStyle}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => handleExport('json')}
          disabled={!!exporting}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8,
            fontSize: 12.5, fontWeight: 600, border: '1px solid #ddd', cursor: 'pointer',
            background: '#fff', color: '#333', opacity: exporting ? 0.6 : 1,
          }}
        >
          {exporting === 'json' ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} Export JSON
        </button>
        <button
          onClick={() => handleExport('csv')}
          disabled={!!exporting}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8,
            fontSize: 12.5, fontWeight: 600, border: 'none', cursor: 'pointer',
            background: G, color: '#fff', opacity: exporting ? 0.6 : 1,
          }}
        >
          {exporting === 'csv' ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} Export CSV
        </button>
      </div>

      {/* Automate this note */}
      <div
        style={{
          display: 'flex', gap: 8, alignItems: 'flex-start', padding: '12px 14px',
          background: '#fff8ec', border: '1px solid rgba(213,170,91,0.35)', borderRadius: 10, marginTop: 18,
        }}
      >
        <Key size={15} style={{ color: G, flexShrink: 0, marginTop: 1 }} />
        <p style={{ margin: 0, fontSize: 12, color: '#8a6d1f', lineHeight: 1.5 }}>
          <strong>Automate this.</strong> Pull this data programmatically on your own schedule via
          the Partner API — <code style={{ fontSize: 11 }}>GET /v1/partner/data-export?type=challenges</code> using
          a key from the <strong>API Keys</strong> tab. <ExternalLink size={11} style={{ verticalAlign: -1, marginLeft: 2 }} />
        </p>
      </div>
    </div>
  );
}
