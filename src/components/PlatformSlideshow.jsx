import { useState, useEffect, useRef, useCallback } from 'react';

const G = '#D5AA5B';

const SLIDES = [
  { src: '/screenshots/01-landing.png', caption: 'Landing Page', desc: 'Public-facing homepage with AI search, 11 persona types, and pricing' },
  { src: '/screenshots/02-startup-dashboard.png', caption: 'Startup Dashboard', desc: 'Persona-specific stats, quick actions, and meeting scheduler' },
  { src: '/screenshots/03-student-portfolio.png', caption: 'Student Portfolio', desc: 'Showcase projects, certifications, and track mentorships' },
  { src: '/screenshots/04-investor-deals.png', caption: 'Investor Deal Pipeline', desc: '7-stage kanban with 8-vector evaluations and milestones' },
  { src: '/screenshots/05-marketplace.png', caption: 'Challenge Marketplace', desc: 'Browse 278+ open innovation challenges with filters and search' },
  { src: '/screenshots/06-settings.png', caption: 'Settings & Billing', desc: 'Profile, security, billing, plan management, and currency preferences' },
  { src: '/screenshots/07-directory.png', caption: 'Ecosystem Directory', desc: '30+ profiles with persona filters, connect buttons, and faceted search' },
  { src: '/screenshots/08-academia-research.png', caption: 'Academic Portfolio', desc: 'Track research projects, publications, and grant applications' },
];

export default function PlatformSlideshow() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);

  const next = useCallback(() => {
    setActive(a => (a + 1) % SLIDES.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(next, 4000);
    return () => clearInterval(timerRef.current);
  }, [paused, next]);

  return (
    <div
      style={{ position: 'relative', maxWidth: 960, margin: '0 auto', borderRadius: 16, overflow: 'hidden', border: `2px solid ${G}33`, boxShadow: '0 8px 32px rgba(0,0,0,0.10)' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Images with crossfade */}
      <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', background: '#f5f5f5' }}>
        {SLIDES.map((slide, i) => (
          <img
            key={i}
            src={slide.src}
            alt={slide.caption}
            loading="lazy"
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
              opacity: i === active ? 1 : 0,
              transition: 'opacity 0.6s ease-in-out',
            }}
          />
        ))}
      </div>

      {/* Caption overlay */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'linear-gradient(transparent, rgba(0,0,0,0.75))',
        padding: '40px 24px 16px',
        color: '#fff',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{SLIDES[active].caption}</div>
            <div style={{ fontSize: 13, opacity: 0.85, marginTop: 2 }}>{SLIDES[active].desc}</div>
          </div>
          <div style={{ fontSize: 12, opacity: 0.6, flexShrink: 0 }}>{active + 1} / {SLIDES.length}</div>
        </div>

        {/* Navigation dots */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'center' }}>
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`Slide ${i + 1}`}
              style={{
                width: i === active ? 24 : 8, height: 8,
                borderRadius: 4, border: 'none', cursor: 'pointer',
                background: i === active ? G : 'rgba(255,255,255,0.4)',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
