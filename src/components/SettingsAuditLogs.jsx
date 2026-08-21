import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { auditLogAPI } from '../services/api';
import { FileText, Download, Loader2, Filter, Key, ExternalLink } from 'lucide-react';

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

const PAGE_SIZE = 25;

// Self-serve Audit Log export — lives inside Settings' "Audit Logs" tab
// (Enterprise-only, gated by the parent tab on plan.features.sso_audit_logs).
// Backend: GET /api/corporate/audit-log/export (auditExportController.js),
// scoped to req.user.id. Supports from/to/action/limit/offset/format(json|csv).
// CSV/JSON file downloads use blobRequest() under the hood since the endpoint
// requires a Bearer header (a plain <a href> can't attach one).
export default function SettingsAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [offset, setOffset] = useState(0);
  const [filters, setFilters] = useState({ from: '', to: '', action: '' });
  const [appliedFilters, setAppliedFilters] = useState({ from: '', to: '', action: '' });

  const load = useCallback(async (currentOffset, currentFilters) => {
    setLoading(true);
    try {
      const params = { limit: PAGE_SIZE, offset: currentOffset };
      if (currentFilters.from) params.from = currentFilters.from;
      if (currentFilters.to) params.to = currentFilters.to;
      if (currentFilters.action) params.action = currentFilters.action;
      const data = await auditLogAPI.list(params);
      setLogs(data?.logs || []);
      setCount(data?.count ?? (data?.logs || []).length);
    } catch (err) {
      toast.error(err.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(0, appliedFilters); }, [load, appliedFilters]);

  const applyFilters = (e) => {
    e.preventDefault();
    setOffset(0);
    setAppliedFilters({ ...filters });
  };

  const clearFilters = () => {
    const empty = { from: '', to: '', action: '' };
    setFilters(empty);
    setOffset(0);
    setAppliedFilters(empty);
  };

  const goPrev = () => {
    const next = Math.max(0, offset - PAGE_SIZE);
    setOffset(next);
    load(next, appliedFilters);
  };

  const goNext = () => {
    const next = offset + PAGE_SIZE;
    setOffset(next);
    load(next, appliedFilters);
  };

  const handleExport = async (format) => {
    setExporting(true);
    try {
      const params = {};
      if (appliedFilters.from) params.from = appliedFilters.from;
      if (appliedFilters.to) params.to = appliedFilters.to;
      if (appliedFilters.action) params.action = appliedFilters.action;
      const blob = await auditLogAPI.exportBlob(params, format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-log-export.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (err) {
      toast.error(err.message || 'Failed to export audit log');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div style={{ ...card, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={18} style={{ color: G }} />
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>Audit Logs</h2>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => handleExport('json')}
            disabled={exporting}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8,
              fontSize: 12.5, fontWeight: 600, border: '1px solid #ddd', cursor: 'pointer',
              background: '#fff', color: '#333', opacity: exporting ? 0.6 : 1,
            }}
          >
            <Download size={13} /> Export JSON
          </button>
          <button
            onClick={() => handleExport('csv')}
            disabled={exporting}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8,
              fontSize: 12.5, fontWeight: 600, border: 'none', cursor: 'pointer',
              background: G, color: '#fff', opacity: exporting ? 0.6 : 1,
            }}
          >
            {exporting ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} Export CSV
          </button>
        </div>
      </div>

      <p style={{ margin: '0 0 18px', fontSize: 12.5, color: '#5c5c5c' }}>
        A record of security-relevant actions on your account — logins, key changes, permission
        updates, and data access. Filter and export below, or pull this programmatically via the
        Partner API (see note below).
      </p>

      {/* Filters */}
      <form
        onSubmit={applyFilters}
        style={{
          display: 'flex', alignItems: 'flex-end', gap: 10, flexWrap: 'wrap',
          padding: '12px 14px', background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 10, marginBottom: 16,
        }}
      >
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#666', marginBottom: 4 }}>From</label>
          <input
            type="date"
            value={filters.from}
            onChange={(e) => setFilters(f => ({ ...f, from: e.target.value }))}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#666', marginBottom: 4 }}>To</label>
          <input
            type="date"
            value={filters.to}
            onChange={(e) => setFilters(f => ({ ...f, to: e.target.value }))}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#666', marginBottom: 4 }}>Action</label>
          <input
            type="text"
            placeholder="e.g. login, key.create"
            value={filters.action}
            onChange={(e) => setFilters(f => ({ ...f, action: e.target.value }))}
            style={{ ...inputStyle, width: 160 }}
          />
        </div>
        <button
          type="submit"
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8,
            fontSize: 12.5, fontWeight: 600, border: 'none', cursor: 'pointer', background: '#1a1a1a', color: '#fff',
          }}
        >
          <Filter size={13} /> Apply
        </button>
        {(appliedFilters.from || appliedFilters.to || appliedFilters.action) && (
          <button
            type="button"
            onClick={clearFilters}
            style={{ padding: '8px 10px', fontSize: 12.5, color: '#5c5c5c', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Clear
          </button>
        )}
      </form>

      {/* Table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <Loader2 size={24} className="animate-spin" style={{ color: G }} />
        </div>
      ) : logs.length === 0 ? (
        <p style={{ fontSize: 13, color: '#666', textAlign: 'center', padding: '20px 0' }}>
          No audit log entries match these filters.
        </p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#5c5c5c', fontSize: 11, textTransform: 'uppercase' }}>
                <th style={{ padding: '8px 10px', borderBottom: '1px solid #eee' }}>Action</th>
                <th style={{ padding: '8px 10px', borderBottom: '1px solid #eee' }}>Entity</th>
                <th style={{ padding: '8px 10px', borderBottom: '1px solid #eee' }}>IP Address</th>
                <th style={{ padding: '8px 10px', borderBottom: '1px solid #eee' }}>When</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                  <td style={{ padding: '9px 10px', fontWeight: 600, color: '#1a1a1a' }}>{log.action}</td>
                  <td style={{ padding: '9px 10px', color: '#555' }}>{log.entity_type || '—'}</td>
                  <td style={{ padding: '9px 10px', color: '#5c5c5c', fontFamily: 'monospace' }}>{log.ip_address || '—'}</td>
                  <td style={{ padding: '9px 10px', color: '#5c5c5c' }}>
                    {log.created_at ? new Date(log.created_at).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
            <span style={{ fontSize: 11.5, color: '#666' }}>
              Showing {logs.length ? offset + 1 : 0}–{offset + logs.length}{count === PAGE_SIZE ? '+' : ''}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={goPrev}
                disabled={offset === 0 || loading}
                style={{
                  padding: '6px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                  border: '1px solid #ddd', cursor: offset === 0 ? 'default' : 'pointer',
                  background: '#fff', color: '#555', opacity: offset === 0 ? 0.5 : 1,
                }}
              >
                Previous
              </button>
              <button
                onClick={goNext}
                disabled={logs.length < PAGE_SIZE || loading}
                style={{
                  padding: '6px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                  border: '1px solid #ddd', cursor: logs.length < PAGE_SIZE ? 'default' : 'pointer',
                  background: '#fff', color: '#555', opacity: logs.length < PAGE_SIZE ? 0.5 : 1,
                }}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Automate this note */}
      <div
        style={{
          display: 'flex', gap: 8, alignItems: 'flex-start', padding: '12px 14px',
          background: '#fff8ec', border: '1px solid rgba(213,170,91,0.35)', borderRadius: 10, marginTop: 18,
        }}
      >
        <Key size={15} style={{ color: G, flexShrink: 0, marginTop: 1 }} />
        <p style={{ margin: 0, fontSize: 12, color: '#8a6d1f', lineHeight: 1.5 }}>
          <strong>Automate this.</strong> Pull audit logs programmatically on your own schedule via
          the Partner API — <code style={{ fontSize: 11 }}>GET /v1/partner/audit-logs</code> using a
          key from the <strong>API Keys</strong> tab. <ExternalLink size={11} style={{ verticalAlign: -1, marginLeft: 2 }} />
        </p>
      </div>
    </div>
  );
}
