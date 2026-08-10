export default function Field({ label, children }) {
  const child = children;
  return (
    <div>
      <label style={{ display: 'block', color: '#444', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>{label}</label>
      {child.type === 'input' || child.type === 'select' || child.type === 'textarea'
        ? <child.type {...child.props} style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', background: '#fafafa', border: '1.5px solid #e0e0e0', borderRadius: 9, fontSize: 13, outline: 'none', color: '#1a1a1a', fontFamily: 'inherit', ...(child.props.style || {}) }} />
        : child
      }
    </div>
  );
}
