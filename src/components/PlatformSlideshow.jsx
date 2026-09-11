import { useState, useEffect, useRef, useCallback } from 'react';

const G = '#D0A848';

// s117 — TWO 583K CLAIMS IN HERE WERE FALSE, AND THE s116k COPY SWEEP MISSED THEM.
// "583K+ startup profiles" and "583K-startup sourcing engine" both shipped on the
// PUBLIC landing page while the backend counted 574K. 583K is the OLD registered-
// users figure (s47 replaced that tile with AI Clusters precisely because it was
// mostly unclaimed CSV imports) and it was never the startup count.
//
// The sweep missed them because it searched for 575K — the number it was fixing —
// so a DIFFERENT wrong number in the same class survived a pass whose whole
// purpose was removing wrong numbers. **Search by claim, not by the one literal
// you already know about.**
//
// Both now read 570K+, the same floor every other public surface uses (see
// landingParts/constants.js and tests/pages/landingStats.test.js). It is a FLOOR
// on purpose: dedup merges accounts, so the true count moves DOWN as well as up,
// and an exact figure would age into an overclaim rather than an understatement.
// Do not "refresh" these to a current exact number.
const SLIDES = [
  { src: '/screenshots/01-login.png', caption: 'Secure Login', desc: 'MFA-protected sign-in with quick demo access for all 11 persona types' },
  { src: '/screenshots/02-startup-dashboard.png', caption: 'Startup Dashboard', desc: 'Persona-specific stats, AI profile score, quick actions, and meeting scheduler' },
  { src: '/screenshots/03-student-portfolio.png', caption: 'Student Portfolio', desc: 'Showcase research projects, hackathon wins, certifications, and skills' },
  { src: '/screenshots/04-incubator-programs.png', caption: 'Incubation Programs', desc: 'Manage cohorts, startup pipeline, milestones, mentors, and 8-vector portfolio health' },
  { src: '/screenshots/05-corporate-dashboard.png', caption: 'Corporate Dashboard', desc: 'AI-recommended startups, challenge pipeline, and ecosystem intelligence at a glance' },
  { src: '/screenshots/05-marketplace.png', caption: 'Challenge Marketplace', desc: 'Browse open innovation challenges with AI-powered filters and semantic search' },
  { src: '/screenshots/07-directory.png', caption: 'Ecosystem Directory', desc: '570K+ startup profiles with persona filters, AI Ask, and faceted search' },
  { src: '/screenshots/08-academia-portfolio.png', caption: 'Academic Portfolio', desc: 'Research projects with funding, publications, grants, and AI matchmaking' },
  { src: '/screenshots/09-recommended-startups.png', caption: 'AI Recommended for You', desc: 'Personalized startup matches with cluster-bridge boost across 200 AI clusters' },
  // TODO s51 — 10 is still held back, and not for want of a screenshot.
  //
  // 10-ai-profile-score: /dashboard/evaluate is a data-ENTRY form. The radar
  // only draws once someone completes the assessment, and the demo startup
  // account has not, so the shot is "0% complete", an em-dash where the score
  // goes, and an empty VECTOR PROFILE box. Restore this when the production
  // demo account has a completed 8-vector assessment to show.
  // { src: '/screenshots/10-ai-profile-score.png', caption: '8-Vector AI Profile Score', desc: 'Radar chart with strengths, red flags, and AI-narrated improvement actions' },
  { src: '/screenshots/11-investor-dashboard.png', caption: 'Investor Dashboard', desc: '7-stage deal pipeline, AI-evaluated startups, and a 570K+ startup sourcing engine' },
  // s117 — Innovation Map, requested by Rajeev: "one thing missing on landing
  // page is we can add Innovation map screen shot". It is the platform's most
  // distinctive surface and the slideshow had no shot of it.
  //
  // CAPTURED 11 Sep from production, from a cloud container, via the new
  // OPENI_VIA_PROXY mode in scripts/capture-screenshots.mjs. It is the
  // /dashboard/maps/sector/financial-services drill-down, so what the image
  // shows is the hub-and-spoke diagram: a sector hub of 45,947 startups, theme
  // nodes around it, and representative startups as the outer spokes.
  //
  // ⚠️ THE CAPTION IS WRITTEN AGAINST WHAT THE IMAGE ACTUALLY SHOWS, and my
  // first draft of it was not. It said "Explore 200 AI clusters", which is a
  // DIFFERENT dimension — the page renders SECTOR maps (26 of them, alongside
  // 11 technologies, 30 functions and 50 use cases), and the word "cluster"
  // appears nowhere on it. That would have been the third false public claim of
  // the same day, in the same file I was fixing two others in. A caption is a
  // claim; check it against the pixels, not against what you expected to shoot.
  //
  // Deliberately states no count: sector and theme totals move with the
  // directory, and a number here would age into an overclaim exactly as 583K did.
  { src: '/screenshots/12-innovation-map.png', caption: 'Innovation Map', desc: 'Hub-and-spoke maps across sectors, technologies, functions and use cases, with representative startups as the spokes' },
];

export default function PlatformSlideshow() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  // s117 — srcs whose image failed to load, keyed by src rather than by index so
  // a future reorder of SLIDES cannot mark the wrong slide broken.
  const [broken, setBroken] = useState(() => new Set());
  const timerRef = useRef(null);

  // s117 — THE RENDERED LIST, not the authored one. A slide whose PNG 404s is
  // dropped rather than shown as a broken image, which is what lets a slide
  // entry ship ahead of its screenshot: the marketing value of a missing slide
  // is zero, the cost of a broken-image icon on the homepage is negative. The
  // slide starts appearing on its own once the asset is committed.
  //
  // Everything below counts and indexes against THIS array. Mixing the two
  // would put the caption of one slide under the image of another as soon as a
  // src failed, which is worse than either failure mode on its own.
  const slides = SLIDES.filter((s) => !broken.has(s.src));

  const onError = useCallback((src) => {
    setBroken((prev) => {
      if (prev.has(src)) return prev;
      const nextSet = new Set(prev);
      nextSet.add(src);
      return nextSet;
    });
  }, []);

  const next = useCallback(() => {
    setActive(a => (slides.length ? (a + 1) % slides.length : 0));
  }, [slides.length]);

  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(next, 4000);
    return () => clearInterval(timerRef.current);
  }, [paused, next]);

  // s117 — a drop can leave `active` past the end of the shortened list, which
  // would read slides[active].caption on undefined and blank the whole landing
  // section. Clamp instead.
  useEffect(() => {
    if (active >= slides.length && slides.length > 0) setActive(0);
  }, [active, slides.length]);

  // Every image failed, so there is nothing to show. Render nothing rather than
  // an empty bordered box with a "0 / 0" counter.
  if (slides.length === 0) return null;
  const current = slides[Math.min(active, slides.length - 1)];

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
        {slides.map((slide, i) => {
          const nextIndex = (active + 1) % slides.length;
          if (i !== active && i !== nextIndex) return null;
          return (
            <img
              key={slide.src}
              src={slide.src}
              alt={slide.caption}
              loading="lazy"
              onError={() => onError(slide.src)}
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
            <div style={{ fontSize: 18, fontWeight: 700 }}>{current.caption}</div>
            <div style={{ fontSize: 13, opacity: 0.85, marginTop: 2 }}>{current.desc}</div>
          </div>
          <div style={{ fontSize: 12, opacity: 0.6, flexShrink: 0 }}>{active + 1} / {slides.length}</div>
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
          {slides.map((slide, i) => (
            <button
              key={slide.src}
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
