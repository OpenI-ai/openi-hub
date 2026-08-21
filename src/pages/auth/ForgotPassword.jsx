import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Loader2, AlertCircle, CheckCircle, Send } from 'lucide-react';
import PublicTour from '../../components/PublicTour';
import PageTourButton from '../../components/PageTourButton';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const inputStyle = {
  backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', color: '#1a1a1a',
  width: '100%', borderRadius: 12, padding: '10px 14px', fontSize: 14, outline: 'none',
};

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!email.trim()) { setErrorMsg('Please enter your email.'); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message || 'Could not send reset link. Please try again.');
        return;
      }
      // Backend always returns ok:true even if email not registered, to prevent enumeration
      setDone(true);
    } catch {
      setErrorMsg('Could not reach the server. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#f5f5f5' }}>
      <div className="w-full max-w-md">
        {/* Phase 65c — OpenI brand mark */}
        <div className="text-center mb-4">
          <Link to="/" aria-label="Go to OpenI home" className="inline-block">
            <img
              src="/openi-logo.png"
              alt="OpenI"
              className="mx-auto"
              style={{ height: 48, width: 'auto', maxWidth: 180, objectFit: 'contain', display: 'block', cursor: 'pointer' }}
              onError={e => { e.target.style.display = 'none'; }}
            />
          </Link>
        </div>
        <div className="bg-white rounded-2xl p-8" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center mb-3"
              style={{ width: 56, height: 56, borderRadius: '50%', background: '#FFF8E6' }}>
              {done
                ? <CheckCircle size={28} style={{ color: '#16a34a' }} />
                : <Mail size={28} style={{ color: '#D0A848' }} />}
            </div>
            <h1 id="tour-page-forgot-password" className="text-xl font-bold mb-1" style={{ color: '#1a1a1a' }}>
              {done ? 'Check your inbox' : 'Forgot your password?'}
            </h1>
            <p className="text-sm" style={{ color: '#6b7280' }}>
              {done
                ? `If an account exists for ${email}, we've sent a password reset link. The link is valid for 1 hour.`
                : 'Enter your email and we will send you a link to reset your password.'}
            </p>
            <div className="mt-4 flex justify-center">
              <PageTourButton />
            </div>
          </div>

          {!done && (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" style={inputStyle} autoComplete="email" autoFocus />
              </div>

              {errorMsg && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg text-xs"
                  style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}>
                  <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button type="submit" disabled={submitting || !email.trim()}
                className="w-full font-semibold py-3 rounded-xl flex items-center justify-center gap-2 text-sm transition-all"
                style={{
                  background: (email.trim() && !submitting) ? '#D0A848' : '#e5e7eb',
                  color:      (email.trim() && !submitting) ? '#fff' : '#9ca3af',
                  cursor:     (email.trim() && !submitting) ? 'pointer' : 'not-allowed',
                }}>
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Send reset link
              </button>
            </form>
          )}

          {done && (
            <div className="text-center pt-2">
              <Link to="/dashboard/login" className="text-xs font-semibold" style={{ color: '#D0A848' }}>
                Back to login
              </Link>
            </div>
          )}

          <div className="text-center mt-6 pt-4 border-t" style={{ borderColor: '#f3f4f6' }}>
            <Link to="/dashboard/login" className="text-xs" style={{ color: '#6e6e6e' }}>
              Remember your password? Log in
            </Link>
          </div>
        </div>
        {/* Page tour */}
        <PublicTour />
      </div>
    </div>
  );
}
