import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Lock, Loader2, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const inputStyle = {
  backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', color: '#1a1a1a',
  width: '100%', borderRadius: 12, padding: '10px 14px', fontSize: 14, outline: 'none',
};

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [pwd, setPwd] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!token) { setErrorMsg('Missing reset token.'); return; }
    if (pwd.length < 8) { setErrorMsg('Password must be at least 8 characters.'); return; }
    if (pwd !== confirm) { setErrorMsg('Passwords do not match.'); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: pwd }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message || 'Could not reset your password.');
        return;
      }
      setDone(true);
      setTimeout(() => navigate('/dashboard/login', { replace: true }), 2500);
    } catch {
      setErrorMsg('Could not reach the server. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#f5f5f5' }}>
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl p-8" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center mb-3"
              style={{ width: 56, height: 56, borderRadius: '50%', background: '#FFF8E6' }}>
              {done
                ? <CheckCircle size={28} style={{ color: '#16a34a' }} />
                : <Lock size={28} style={{ color: '#D5AA5B' }} />}
            </div>
            <h1 className="text-xl font-bold mb-1" style={{ color: '#1a1a1a' }}>
              {done ? 'Password updated' : 'Set a new password'}
            </h1>
            <p className="text-sm" style={{ color: '#6b7280' }}>
              {done
                ? 'Your password has been updated. Redirecting you to login…'
                : 'Choose a strong password (minimum 8 characters).'}
            </p>
          </div>

          {!done && (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>New password</label>
                <div className="relative">
                  <input type={showPwd ? 'text' : 'password'} value={pwd} onChange={e => setPwd(e.target.value)}
                    placeholder="At least 8 characters" style={inputStyle} autoComplete="new-password" autoFocus />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#9ca3af' }}>
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Confirm new password</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                  placeholder="Re-enter password" style={inputStyle} autoComplete="new-password" />
                {confirm && pwd !== confirm && (
                  <p className="text-xs mt-1" style={{ color: '#ef4444' }}>Passwords do not match</p>
                )}
              </div>

              {errorMsg && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg text-xs"
                  style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}>
                  <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button type="submit" disabled={submitting || pwd.length < 8 || pwd !== confirm}
                className="w-full font-semibold py-3 rounded-xl flex items-center justify-center gap-2 text-sm transition-all"
                style={{
                  background: (pwd.length >= 8 && pwd === confirm && !submitting) ? '#D5AA5B' : '#e5e7eb',
                  color:      (pwd.length >= 8 && pwd === confirm && !submitting) ? '#fff' : '#9ca3af',
                  cursor:     (pwd.length >= 8 && pwd === confirm && !submitting) ? 'pointer' : 'not-allowed',
                }}>
                {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
                Update password
              </button>
            </form>
          )}

          {done && (
            <div className="text-center py-4">
              <Loader2 size={20} className="inline-block animate-spin" style={{ color: '#D5AA5B' }} />
              <p className="mt-2 text-sm" style={{ color: '#6b7280' }}>Taking you to login…</p>
            </div>
          )}

          <div className="text-center mt-6 pt-4 border-t" style={{ borderColor: '#f3f4f6' }}>
            <Link to="/dashboard/login" className="text-xs" style={{ color: '#9ca3af' }}>
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
