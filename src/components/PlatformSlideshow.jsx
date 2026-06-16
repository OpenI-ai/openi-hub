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
  // TODO s51 — capture screenshots and restore these 3 slides:
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
