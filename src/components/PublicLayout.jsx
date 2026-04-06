/**
 * PublicLayout — Shared header/footer for all public (non-auth) pages.
 * Matches the Landing.jsx brand styling: gold (#D5AA5B) primary, dark theme footer.
 */
import { Link, useLocation } from 'react-router-dom';
import { Shield, ArrowRight } from 'lucide-react';

// Brand colors (same as Landing.jsx)
const GOLD = '#D5AA5B';
const GOLD_DARK = '#C9983F';
const DARK = '#1a1a1a';
const GRAY = '#6b7280';
const BORDER = '#e5e7eb';

// ── Social icons (lucide-react v0.294 doesn't have these) ───
function LinkedInIcon({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

function XIcon({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

export default function PublicLayout({ children }) {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  const navLinkStyle = (path) => ({
    color: isActive(path) ? GOLD : GRAY,
    fontWeight: isActive(path) ? 700 : 500,
  });

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#fff' }}>
      {/* ═══ HEADER ═══ */}
      <header
        className="sticky top-0 z-50 px-6 py-4 border-b backdrop-blur"
        style={{ background: 'rgba(255,255,255,0.92)', borderColor: BORDER }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/openi-logo.png"
              alt="OpenI"
              style={{ height: 38, width: 'auto', maxWidth: 140, objectFit: 'contain' }}
              onError={e => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div
              className="w-10 h-10 rounded-xl items-center justify-center"
              style={{ background: GOLD, display: 'none' }}
            >
              <Shield size={20} color="#fff" />
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link to="/marketplace" className="hover:text-gray-900 transition-colors" style={navLinkStyle('/marketplace')}>Marketplace</Link>
            <Link to="/reports" className="hover:text-gray-900 transition-colors" style={navLinkStyle('/reports')}>Reports</Link>
            <Link to="/#how-it-works" className="hover:text-gray-900 transition-colors" style={{ color: GRAY }}>How It Works</Link>
            <Link to="/#features" className="hover:text-gray-900 transition-colors" style={{ color: GRAY }}>Features</Link>
            <Link to="/#pricing" className="hover:text-gray-900 transition-colors" style={{ color: GRAY }}>Pricing</Link>
          </nav>

          <div className="flex items-center gap-3">
            <a href="https://www.linkedin.com/company/openi-partners/" target="_blank" rel="noopener noreferrer"
               className="hidden sm:inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all"
               style={{ color: GRAY }}
               onMouseEnter={e => e.currentTarget.style.color = GOLD}
               onMouseLeave={e => e.currentTarget.style.color = GRAY}
            >
              <LinkedInIcon size={18} />
            </a>
            <a href="https://x.com/OpenIPartners" target="_blank" rel="noopener noreferrer"
               className="hidden sm:inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all"
               style={{ color: GRAY }}
               onMouseEnter={e => e.currentTarget.style.color = GOLD}
               onMouseLeave={e => e.currentTarget.style.color = GRAY}
            >
              <XIcon size={18} />
            </a>
            <Link
              to="/dashboard/login"
              className="hidden sm:inline text-sm font-semibold px-4 py-2 transition-colors"
              style={{ color: DARK }}
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-5 py-2 rounded-lg text-sm font-bold transition-all"
              style={{ background: GOLD, color: '#fff' }}
              onMouseEnter={e => e.currentTarget.style.background = GOLD_DARK}
              onMouseLeave={e => e.currentTarget.style.background = GOLD}
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* ═══ CONTENT ═══ */}
      <main className="flex-1">{children}</main>

      {/* ═══ FOOTER ═══ */}
      <footer className="px-6 py-12" style={{ background: DARK, color: '#9ca3af' }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            {/* Logo & tagline */}
            <div className="col-span-2">
              <img
                src="/openi-logo.png"
                alt="OpenI"
                style={{ height: 36, width: 'auto', maxWidth: 120, objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
              />
              <p className="text-sm mt-4 max-w-xs leading-relaxed">
                The open innovation platform connecting India&apos;s deep-tech ecosystem. Partner. Source. Invest.
              </p>
              {/* Social Links */}
              <div className="flex items-center gap-4 mt-4">
                <a href="https://www.linkedin.com/company/openi-partners/" target="_blank" rel="noopener noreferrer"
                   className="transition-colors"
                   onMouseEnter={e => e.currentTarget.querySelector('svg').setAttribute('fill', GOLD)}
                   onMouseLeave={e => e.currentTarget.querySelector('svg').setAttribute('fill', '#9ca3af')}
                >
                  <LinkedInIcon size={20} color="#9ca3af" />
                </a>
                <a href="https://x.com/OpenIPartners" target="_blank" rel="noopener noreferrer"
                   className="transition-colors"
                   onMouseEnter={e => e.currentTarget.querySelector('svg').setAttribute('fill', GOLD)}
                   onMouseLeave={e => e.currentTarget.querySelector('svg').setAttribute('fill', '#9ca3af')}
                >
                  <XIcon size={20} color="#9ca3af" />
                </a>
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-sm font-bold mb-4 text-white">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/marketplace" className="hover:text-white transition-colors">Marketplace</Link></li>
                <li><Link to="/reports" className="hover:text-white transition-colors">Startup Reports</Link></li>
                <li><Link to="/#how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
                <li><Link to="/#features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link to="/#pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors">Get Started</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-sm font-bold mb-4 text-white">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/dashboard/login" className="hover:text-white transition-colors">Sign In</Link></li>
                <li><a href="mailto:contact@openi.tech" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t pt-8 flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderColor: '#333' }}>
            <p className="text-xs">
              &copy; 2026 OpenI Hub &middot; Built for India&apos;s deep-tech ecosystem
            </p>
            <p className="text-xs">
              <span style={{ color: GOLD }}>openi.tech</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
