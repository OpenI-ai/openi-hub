export default function StatusBadge({ status, config }) {
  const c = config[status] || { label: status, color: 'bg-gray-100 text-gray-600' };
  return <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${c.color || c.bg + ' ' + c.textColor}`}>{c.label}</span>;
}
