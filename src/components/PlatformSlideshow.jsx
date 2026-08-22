import { useState, useEffect, useRef, useCallback } from 'react';

const G = '#D0A848';

const SLIDES = [
  { src: '/screenshots/01-login.png', caption: 'Secure Login', desc: 'MFA-protected sign-in with quick demo access for all 11 persona types' },
  { src: '/screenshots/02-startup-dashboard.png', caption: 'Startup Dashboard', desc: 'Persona-specific stats, AI profile score, quick actions, and meeting scheduler' },
  { src: '/screenshots/03-student-portfolio.png', caption: 'Student Portfolio', desc: 'Showcase research projects, hackathon wins, certifications, and skills' },
  { src: '/screenshots/04-incubator-programs.png', caption: 'Incubation Programs', desc: 'Manage cohorts, startup pipeline, milestones, mentors, and 8-vector portfolio health' },
  { src: '/screenshots/05-corporate-dashboard.png', caption: 'Corporate Dashboard', desc: 'AI-recommended startups, challenge pipeline, and ecosystem intelligence at a glance' },
  { src: '/screenshots/05-marketplace.png', caption: 'Challenge Marketplace', desc: 'Browse open innovation challenges with AI-powered filters and semantic search' },
  { src: '/screenshots/07-directory.png', caption: 'Ecosystem Directory', desc: '583K+ startup profiles with persona filters, AI Ask, and faceted search' },
  { src: '/screenshots/08-academia-portfolio.png', caption: 'Academic Portfolio', desc: 'Research projects with funding, publications, grants, and AI matchmaking' },
  // TODO s51 — restore these 3 slides once their images exist.
  // `npm run screenshots` now captures all three (they were missing from its
  // SHOTS list until 22 Aug 2026, so earlier runs could never have produced
  // them). Uncomment these lines in the SAME commit that adds the PNGs —
  // uncommenting first points the slideshow at files that 404.
  // { src: '/screenshots/09-recommended-startups.png', caption: 'AI Recommended for You', desc: 'Personalized startup matches with cluster-bridge boost across 200 AI clusters' },
  // { src: '/screenshots/10-ai-profile-score.png', caption: '8-Vector AI Profile Score', desc: 'Radar chart with strengths, red flags, and AI-narrated improvement actions' },
  // { src: '/screenshots/11-investor-dashboard.png', caption: 'Investor Dashboard', desc: '7-stage deal pipeline, AI-evaluated startups, and 583K-startup sourcing engine' },
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
      {/* Images with crossfade — s54: only mount the active slide + the next one
          (instead of all 8 up front) to cut initial image downloads. The next slide
          stays mounted at opacity 0 so it's preloaded and ready to crossfade in;
          zIndex keeps the active image on top so swapping the "next" slide out from
          under it (e.g. on wraparound) never causes a visible pop. */}
      <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', background: '#f5f5f5' }}>
        {SLIDES.map((slide, i) => {
          const nextIndex = (active + 1) % SLIDES.length;
          if (i !== active && i !== nextIndex) return null;
          return (
            <img
              key={i}
              src={slide.src}
              alt={slide.caption}
              loading="lazy"
              style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
                opacity: i === active ? 1 : 0,
                zIndex: i === active ? 2 : 1,
                transition: 'opacity 0.6s ease-in-out',
              }}
            />
          );
        })}
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

        {/* Navigation dots.
            The BUTTON is the touch target; the SPAN inside is the dot you see.
            Previously the button itself was the 8px dot — an 8x8 tap target on
            a phone, against a 44px guideline, and the smallest control measured
            anywhere on the site in the 21 Aug 2026 UX audit. Missing it either
            does nothing or scrolls the page, and the visitor has no idea the
            slideshow is steerable.

            The visual is unchanged: same 8px dot, same 24px active pill, same
            colours and transition. The button contributes no size of its own
            (transparent, no border, no padding beyond the inline-flex box) and
            the row's negative vertical margin cancels the extra height, so the
            layout below is identical to before — only the hit area grew. */}
        <div style={{ display: 'flex', gap: 4, marginTop: 12, marginBottom: -16, justifyContent: 'center' }}>
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`Slide ${i + 1}`}
              aria-current={i === active ? 'true' : undefined}
              style={{
                height: 44, minWidth: 44, padding: 0,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                background: 'transparent', border: 'none', cursor: 'pointer',
                marginTop: -16,
              }}
            >
              <span
                style={{
                  display: 'block',
                  width: i === active ? 24 : 8, height: 8,
                  borderRadius: 4,
                  background: i === active ? G : 'rgba(255,255,255,0.4)',
                  transition: 'all 0.3s ease',
                }}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
