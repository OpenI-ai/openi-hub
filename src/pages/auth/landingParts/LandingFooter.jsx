/**
 * Landing page footer — Phase 167 (W5-4).
 *
 * VERBATIM slice of pre-split Landing.jsx lines 1209-1296 (88 lines).
 * One prop, no hooks. Includes the ISO 27001 trust strip (cert.
 * IND.25.7578/IS/U, Bureau Veritas) — do not drop it, it is referenced from
 * the header nav anchor. Do NOT re-indent the slice.
 */
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { DARK, GOLD } from './constants.js';
import { LinkedInIcon, XIcon } from './icons.jsx';

export default function LandingFooter({ footerTagline }) {
  return (
    // ---- BODY START (original lines 1209-1296) ----
      <footer className="px-6 py-12" style={{ background: DARK, color: '#6e6e6e' }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            {/* Logo & tagline */}
            <div className="col-span-2">
              <Link to="/" aria-label="Go to OpenI home" className="inline-block">
                <img
                  src="/openi-logo.png"
                  alt="OpenI"
                  style={{ height: 36, width: 'auto', maxWidth: 120, objectFit: 'contain', filter: 'brightness(0) invert(1)', cursor: 'pointer' }}
                />
              </Link>
              <p className="text-sm mt-4 max-w-xs leading-relaxed">
                {footerTagline || 'The AI-powered open innovation platform. 11 roles, one ecosystem.'}
              </p>
              {/* Social Links */}
              <div className="flex items-center gap-4 mt-4">
                <a href="https://www.linkedin.com/company/openi-partners/" target="_blank" rel="noopener noreferrer"
                   aria-label="OpenI on LinkedIn"
                   className="transition-colors"
                   onMouseEnter={e => e.currentTarget.querySelector('svg').setAttribute('fill', GOLD)}
                   onMouseLeave={e => e.currentTarget.querySelector('svg').setAttribute('fill', '#9ca3af')}>
                  <LinkedInIcon size={20} color="#9ca3af" />
                </a>
                <a href="https://x.com/OpenIPartners" target="_blank" rel="noopener noreferrer"
                   aria-label="OpenI on X"
                   className="transition-colors"
                   onMouseEnter={e => e.currentTarget.querySelector('svg').setAttribute('fill', GOLD)}
                   onMouseLeave={e => e.currentTarget.querySelector('svg').setAttribute('fill', '#9ca3af')}>
                  <XIcon size={20} color="#9ca3af" />
                </a>
              </div>
            </div>

            {/* Product */}
            <div>
              {/* h2, not h4: this sits under the page <h1>, and h1->h4 skipped two levels. Size unchanged. */}
              <h2 className="text-sm font-bold mb-4 text-white">Product</h2>
              <ul className="space-y-2 text-sm">
                <li><Link to="/marketplace" className="hover:text-white transition-colors">Marketplace</Link></li>
                <li><Link to="/reports" className="hover:text-white transition-colors">Startup Reports</Link></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><Link to="/register" className="hover:text-white transition-colors">Get Started</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h2 className="text-sm font-bold mb-4 text-white">Company</h2>
              <ul className="space-y-2 text-sm">
                <li><Link to="/dashboard/login" className="hover:text-white transition-colors">Sign In</Link></li>
                <li><a href="mailto:info@openi.ai" className="hover:text-white transition-colors">Contact</a></li>
                <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Use</Link></li>
                <li>
                  <a href="/openi-iso-27001.pdf" target="_blank" rel="noopener noreferrer"
                     className="hover:text-white transition-colors inline-flex items-center gap-1.5">
                    <Shield size={12} style={{ color: GOLD }} /> ISO 27001 Certificate
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Phase 60.7 (s50) — ISO 27001 trust strip */}
          <div className="border-t pt-6 mb-2 flex flex-wrap items-center justify-center gap-3 text-xs" style={{ borderColor: '#333', color: '#6e6e6e' }}>
            <Shield size={14} style={{ color: GOLD }} />
            <span>
              <strong style={{ color: '#fff' }}>OpenI Partners LLP</strong> is{' '}
              <strong style={{ color: GOLD }}>ISO/IEC 27001:2022 certified</strong> by Bureau Veritas
              (Cert. No. IND.25.7578/IS/U &middot; valid until 19 June 2028).
            </span>
            <a href="/openi-iso-27001.pdf" target="_blank" rel="noopener noreferrer"
               className="underline hover:text-white">
              View Certificate (PDF)
            </a>
          </div>

          {/* Divider */}
          <div className="border-t pt-6 flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderColor: '#333' }}>
            <p className="text-xs">
              &copy; 2026 OpenI Hub &middot; ISO/IEC 27001:2022 certified by Bureau Veritas
            </p>
            <p className="text-xs">
              <span style={{ color: GOLD }}>openi.ai</span>
            </p>
          </div>
        </div>
      </footer>
    // ---- BODY END ----
  );
}
