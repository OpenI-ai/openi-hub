/**
 * Landing page presentational components — Phase 167 (W5-4).
 *
 * ONE VERBATIM slice of pre-split Landing.jsx lines 98-305, covering:
 *   Section 99-105 · PartnerLogo 107-161 · FeatureCard 163-190
 *   gstAnnotation 192-201 · PricingCard 203-263 · Step 265-279
 *   PersonaListItem 281-289 · FAQItem 291-305
 *
 * The range is contiguous in the original and is kept contiguous here on
 * purpose: PricingCard calls gstAnnotation (205) and PartnerLogo carries its
 * own useState (112). Splitting further would add cross-module edges for no
 * gain and would break the byte-identity audit trail.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ChevronUp, ChevronDown } from 'lucide-react';
import { GOLD, GOLD_DARK, GOLD_LIGHT, BORDER, DARK, GRAY } from './constants.js';

// ---- BODY START (original lines 98-305) ----
// ── Reusable section wrapper ───────────────────────────────
function Section({ children, bg = '#fff', className = '', id = '' }) {
  return (
    <section id={id} className={`py-20 px-6 ${className}`} style={{ background: bg }}>
      <div className="max-w-6xl mx-auto">{children}</div>
    </section>
  );
}

// ── Partner logo (Phase 60.7) ───────────────────────────────
// Tries /partners/<slug>.png first, then .svg, then falls back to text.
// Sized for visual presence on the marketing strip: roomier 160x80 frame,
// grayscale-by-default with full color on hover, subtle lift on hover.
function PartnerLogo({ name, slug }) {
  const [stage, setStage] = useState(slug ? 'png' : 'text');
  const src = stage === 'png' ? `/partners/${slug}.png`
            : stage === 'svg' ? `/partners/${slug}.svg`
            : null;

  if (!src) {
    return (
      <span className="text-base md:text-lg font-bold tracking-wide" style={{ color: '#5c5c5c' }}>
        {name}
      </span>
    );
  }

  return (
    <div
      title={name}
      className="partner-logo-frame"
      style={{
        flex: '0 0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px 16px',
        transition: 'transform 0.25s ease',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      <img
        src={src}
        alt={name}
        loading="lazy"
        width={160}
        height={80}
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          width: 'auto',
          height: 'auto',
          objectFit: 'contain',
          filter: 'grayscale(0.85) opacity(0.7)',
          transition: 'filter 0.25s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.filter = 'grayscale(0) opacity(1)'; }}
        onMouseLeave={e => { e.currentTarget.style.filter = 'grayscale(0.85) opacity(0.7)'; }}
        onError={() => setStage(stage === 'png' ? 'svg' : 'text')}
      />
    </div>
  );
}

// ── Feature card ───────────────────────────────────────────
function FeatureCard({ icon: Icon, title, description }) {
  return (
    <div
      className="p-6 rounded-xl transition-all"
      style={{ background: '#fff', border: `1px solid ${BORDER}` }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = GOLD;
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(213,170,91,0.12)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = BORDER;
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div
        className="w-11 h-11 rounded-lg flex items-center justify-center mb-4"
        style={{ background: GOLD_LIGHT }}
      >
        <Icon size={22} style={{ color: GOLD }} />
      </div>
      <h3 className="text-base font-bold mb-2" style={{ color: DARK }}>{title}</h3>
      <p className="text-sm leading-relaxed" style={{ color: GRAY }}>{description}</p>
    </div>
  );
}

// Compute "+ 18% GST" annotation for any INR price string like "₹2,499"
function gstAnnotation(price) {
  if (!price || typeof price !== 'string') return null;
  const m = price.match(/[\d,]+/);
  if (!m) return null;
  const base = parseInt(m[0].replace(/,/g, ''), 10);
  if (isNaN(base) || base === 0) return null;
  const total = Math.round(base * 1.18);
  return `+ 18% GST · ₹${total.toLocaleString('en-IN')} total`;
}

// ── Pricing card ───────────────────────────────────────────
function PricingCard({ name, price, priceNote, features, cta, ctaLink, featured = false }) {
  const tax = gstAnnotation(price);
  return (
    <div
      className="rounded-2xl p-8 relative transition-all"
      style={{
        background: '#fff',
        border: featured ? `2px solid ${GOLD}` : `1px solid ${BORDER}`,
        boxShadow: featured ? '0 12px 32px rgba(213,170,91,0.15)' : '0 2px 8px rgba(0,0,0,0.04)',
        transform: featured ? 'scale(1.02)' : 'scale(1)',
      }}
    >
      {featured && (
        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold"
          style={{ background: GOLD, color: '#fff' }}
        >
          MOST POPULAR
        </div>
      )}
      <div className="mb-6">
        <h3 className="text-lg font-bold mb-1" style={{ color: DARK }}>{name}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold" style={{ color: DARK }}>{price}</span>
          {priceNote && <span className="text-sm" style={{ color: GRAY }}>{priceNote}</span>}
        </div>
        {tax && (
          <div className="text-xs mt-1" style={{ color: GRAY }}>
            {tax}
          </div>
        )}
      </div>
      <ul className="space-y-3 mb-8">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-sm" style={{ color: GRAY }}>
            <CheckCircle2 size={16} style={{ color: GOLD, marginTop: 2, flexShrink: 0 }} />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Link
        to={ctaLink}
        className="block text-center py-3 rounded-lg text-sm font-bold transition-all"
        style={{
          background: featured ? GOLD : '#fff',
          color: featured ? '#fff' : GOLD,
          border: featured ? 'none' : `1.5px solid ${GOLD}`,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = featured ? GOLD_DARK : GOLD_LIGHT;
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = featured ? GOLD : '#fff';
        }}
      >
        {cta}
      </Link>
    </div>
  );
}

// ── How It Works step ──────────────────────────────────────
function Step({ number, title, description }) {
  return (
    <div className="text-center">
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold"
        style={{ background: GOLD_LIGHT, color: GOLD }}
      >
        {number}
      </div>
      <h3 className="text-base font-bold mb-2" style={{ color: DARK }}>{title}</h3>
      <p className="text-sm leading-relaxed max-w-xs mx-auto" style={{ color: GRAY }}>{description}</p>
    </div>
  );
}

// ── Persona list item ───────────────────────────────────────
function PersonaListItem({ icon: Icon, label, color }) {
  return (
    <li className="flex items-center gap-2 text-sm" style={{ color: DARK }}>
      <Icon size={14} style={{ color }} />
      <span>{label}</span>
    </li>
  );
}

// ── FAQ item ────────────────────────────────────────────────
function FAQItem({ question, answer, isOpen, onToggle }) {
  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden' }}>
      <button onClick={onToggle} className="w-full flex justify-between items-center p-5 text-left"
        style={{ background: isOpen ? GOLD_LIGHT : '#fff', border: 'none', cursor: 'pointer' }}>
        <span className="text-sm font-semibold pr-4" style={{ color: DARK }}>{question}</span>
        {isOpen ? <ChevronUp size={18} style={{ color: GOLD, flexShrink: 0 }} /> : <ChevronDown size={18} style={{ color: GRAY, flexShrink: 0 }} />}
      </button>
      {isOpen && (
        <div className="px-5 pb-5 text-sm leading-relaxed" style={{ color: GRAY }}>{answer}</div>
      )}
    </div>
  );
}
// ---- BODY END ----

export {
  Section, PartnerLogo, FeatureCard, gstAnnotation,
  PricingCard, Step, PersonaListItem, FAQItem,
};
