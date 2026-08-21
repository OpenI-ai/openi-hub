/**
 * Landing page sticky header — Phase 167 (W5-4).
 *
 * VERBATIM slice of pre-split Landing.jsx lines 366-533 (168 lines).
 * Exactly three props and no hooks: the mobile-drawer state stays on the page
 * because nothing else needs it, and handleHeaderSearch closes over the page's
 * useNavigate. Do NOT re-indent the slice — see index.js INVARIANTS.
 */
import { Link } from 'react-router-dom';
import { Shield, X, Menu } from 'lucide-react';
import SearchBar from '../../../components/SearchBar';
import { BORDER, GOLD, GOLD_DARK, GRAY, DARK } from './constants.js';
import { LinkedInIcon, XIcon } from './icons.jsx';

export default function LandingHeader({ mobileNavOpen, setMobileNavOpen, handleHeaderSearch }) {
  return (
    // ---- BODY START (original lines 366-533) ----
      <header
        className="sticky top-0 z-50 px-6 py-4 border-b backdrop-blur"
        style={{ background: 'rgba(255,255,255,0.92)', borderColor: BORDER }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
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

          <nav className="hidden lg:flex shrink-0 items-center gap-4 text-sm font-medium" style={{ color: GRAY }}>
            <Link to="/marketplace" className="hover:text-gray-900 transition-colors">Marketplace</Link>
            <Link to="/reports" className="hover:text-gray-900 transition-colors">Reports</Link>
            <a href="#how-it-works" className="hover:text-gray-900 transition-colors">How It Works</a>
            <a href="#services" className="hover:text-gray-900 transition-colors">Services</a>
            <a href="#pricing" className="hover:text-gray-900 transition-colors">Pricing</a>
          </nav>

          {/* Global header search — AI Ask enabled. xl (not lg) so it never
              contends with the full nav + Sign In/Get Started for space in
              the 1024-1279px band, which was causing squeeze/wrap there. */}
          <div className="hidden xl:block flex-1 max-w-md min-w-0">
            <SearchBar
              onSearch={handleHeaderSearch}
              showAiToggle
              placeholder="Ask or search..."
            />
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a href="https://www.linkedin.com/company/openi-partners/" target="_blank" rel="noopener noreferrer"
               aria-label="OpenI on LinkedIn"
               className="hidden sm:inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all"
               style={{ color: GRAY }}
               onMouseEnter={e => e.currentTarget.style.color = GOLD}
               onMouseLeave={e => e.currentTarget.style.color = GRAY}>
              <LinkedInIcon size={18} />
            </a>
            <a href="https://x.com/OpenIPartners" target="_blank" rel="noopener noreferrer"
               aria-label="OpenI on X"
               className="hidden sm:inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all"
               style={{ color: GRAY }}
               onMouseEnter={e => e.currentTarget.style.color = GOLD}
               onMouseLeave={e => e.currentTarget.style.color = GRAY}>
              <XIcon size={18} />
            </a>
            <Link
              to="/dashboard/login"
              className="hidden sm:inline-flex items-center min-h-[44px] text-sm font-semibold px-4 py-2 transition-colors"
              style={{ color: DARK }}
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-5 py-2 min-h-[44px] inline-flex items-center rounded-lg text-sm font-bold transition-all"
              style={{ background: GOLD, color: '#fff' }}
              onMouseEnter={e => e.currentTarget.style.background = GOLD_DARK}
              onMouseLeave={e => e.currentTarget.style.background = GOLD}
            >
              Get Started
            </Link>
            {/* Mobile hamburger — only visible below lg breakpoint */}
            <button
              type="button"
              aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen(o => !o)}
              className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg transition-colors"
              style={{ color: DARK }}
            >
              {mobileNavOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile nav drawer — visible only below lg breakpoint when open */}
        {mobileNavOpen && (
          <div
            className="lg:hidden border-t"
            style={{ background: '#fff', borderColor: BORDER }}
          >
            <nav className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-1 text-sm font-medium">
              <Link
                to="/marketplace"
                onClick={() => setMobileNavOpen(false)}
                className="py-2.5 rounded-md transition-colors"
                style={{ color: DARK }}
              >
                Marketplace
              </Link>
              <Link
                to="/reports"
                onClick={() => setMobileNavOpen(false)}
                className="py-2.5 rounded-md transition-colors"
                style={{ color: DARK }}
              >
                Reports
              </Link>
              <a
                href="#how-it-works"
                onClick={() => setMobileNavOpen(false)}
                className="py-2.5 rounded-md transition-colors"
                style={{ color: DARK }}
              >
                How It Works
              </a>
              <a
                href="#services"
                onClick={() => setMobileNavOpen(false)}
                className="py-2.5 rounded-md transition-colors"
                style={{ color: DARK }}
              >
                Services
              </a>
              <a
                href="#pricing"
                onClick={() => setMobileNavOpen(false)}
                className="py-2.5 rounded-md transition-colors"
                style={{ color: DARK }}
              >
                Pricing
              </a>
              <Link
                to="/dashboard/login"
                onClick={() => setMobileNavOpen(false)}
                className="py-2.5 rounded-md transition-colors font-semibold"
                style={{ color: DARK }}
              >
                Sign In
              </Link>
              <div className="flex items-center gap-3 pt-3 mt-2 border-t" style={{ borderColor: BORDER }}>
                <a
                  href="https://www.linkedin.com/company/openi-partners/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="inline-flex items-center justify-center w-9 h-9 rounded-lg"
                  style={{ color: GRAY }}
                >
                  <LinkedInIcon size={18} />
                </a>
                <a
                  href="https://x.com/OpenIPartners"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="X"
                  className="inline-flex items-center justify-center w-9 h-9 rounded-lg"
                  style={{ color: GRAY }}
                >
                  <XIcon size={18} />
                </a>
              </div>
            </nav>
          </div>
        )}
      </header>
    // ---- BODY END ----
  );
}
