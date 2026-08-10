import { Globe, Users, Lock } from 'lucide-react';

export const G = '#D0A848';
export const GH = '#C9983F';

export const card = {
  background: '#ffffff',
  border: '1px solid #eeeeee',
  borderRadius: 14,
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
};

// Mock data removed — data is fetched from API

export const VIS_STYLE = {
  public:     { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0',              icon: Globe, label: 'Public' },
  internal:   { bg: '#fff8ec', color: G,          border: 'rgba(213,170,91,0.4)', icon: Users, label: 'Internal' },
  restricted: { bg: '#fef2f2', color: '#dc2626',  border: '#fecaca',              icon: Lock,  label: 'Restricted' },
};

export const STATUS_STYLE = {
  Active:     { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  'On Hold':  { bg: '#fff7ed', color: '#ea580c', border: '#fed7aa' },
  Pending:    { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' },
  'In Review':{ bg: '#fff8ec', color: G,          border: 'rgba(213,170,91,0.4)' },
};
