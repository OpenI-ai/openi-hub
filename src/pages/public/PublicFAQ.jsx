/**
 * PublicFAQ — GEO P1 content surface. Public /faq page answering real buyer
 * questions, with a FAQPage JSON-LD block so AI answer engines can lift the
 * Q&A pairs directly into generated answers.
 *
 * Single source of truth: FAQ_SECTIONS drives BOTH the visible accordion and
 * the JSON-LD mainEntity, so the structured data can never drift from the copy.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, HelpCircle } from 'lucide-react';
import PublicLayout from '../../components/PublicLayout';

// Brand colors (same as PublicReports.jsx / Landing.jsx)
const GOLD = '#D0A848';
const GOLD_DARK = '#C9983F';
const DARK = '#1a1a1a';
const GRAY = '#6b7280';
const BORDER = '#e5e7eb';

// ── FAQ content. Each answer is plain text (no markup) so it can be reused
// verbatim inside the FAQPage JSON-LD acceptedAnswer.text. ──────────────────
const FAQ_SECTIONS = [
  {
    heading: 'About OpenI Hub',
    items: [
      {
        q: 'What is OpenI Hub?',
        a: 'OpenI Hub is an AI-powered open innovation marketplace. It lets corporates, investors, government bodies and academia search 570,000+ startups in plain English, post innovation challenges, and connect directly with founders and partners. It is ISO/IEC 27001:2022 certified and free to start.',
      },
      {
        q: 'Who is OpenI Hub for?',
        a: 'OpenI Hub serves four main audiences: corporates sourcing startups and running open-innovation challenges; investors discovering and evaluating deal flow; government and academia connecting with the deep-tech ecosystem; and startups looking to be found by partners, customers and funders.',
      },
      {
        q: 'How does the AI evaluation framework work?',
        a: 'The 8-Vector framework is a structured scoring rubric covering over 100 criteria across eight dimensions, including people, strategic direction, revenue management and technology readiness. Each criterion is scored one to five, and AI can draft a first pass for you to review and adjust. Because every startup is assessed against the same rubric, you get comparable shortlists rather than impressions.',
      },
    ],
  },
  {
    heading: 'Searching and sourcing startups',
    items: [
      {
        q: 'How do I search 570,000+ startups in plain English?',
        a: 'You describe what you are looking for in natural language — for example "deep-tech climate startups in India with corporate pilots" — and an AI layer translates that into structured filters: sector, technology, stage, location. Results are then ranked by full-text and semantic similarity. There is no need to learn filters or boolean syntax, and you can refine the filters the AI chose.',
      },
      {
        q: 'Can I find deep-tech startups in a specific sector?',
        a: 'Yes. OpenI Hub covers startups across sectors and lets you source by industry, technology area and stage. You can search by sector in plain English and refine the results, then connect directly with the founders of the startups that fit your brief.',
      },
      {
        q: 'Where does OpenI Hub get its startup data?',
        a: 'OpenI Hub aggregates startup data from public and curated sources and enriches it with AI. Founders can claim and update their own profiles, so the platform combines broad coverage with first-party, founder-verified information.',
      },
    ],
  },
  {
    heading: 'Running innovation challenges',
    items: [
      {
        q: 'How do I run an open-innovation challenge?',
        a: 'Corporates and other organisations can post an innovation challenge describing the problem they want solved. The challenge is published to the marketplace, startups apply with their solutions, and you evaluate and shortlist applicants using OpenI Hub\u2019s AI scoring and review tools.',
      },
      {
        q: 'Who can respond to a challenge?',
        a: 'Any eligible startup on OpenI Hub can apply to a public challenge. As the challenge owner you can also invite specific startups directly, and add reviewers to your team to help evaluate the applications.',
      },
      {
        q: 'How are challenge applicants evaluated?',
        a: 'You can run an AI evaluation on any application, scoring it against your challenge on solution fit, technical maturity, scalability, integration feasibility, team capability, cost effectiveness, innovation and strategic alignment, with a written explanation and any red flags. You can also add your own reviewers to assess submissions alongside it. The result is a consistent, comparable shortlist rather than a pile of unstructured pitches.',
      },
    ],
  },
  {
    heading: 'Pricing and access',
    items: [
      {
        q: 'Is OpenI Hub free to start?',
        a: 'Yes. OpenI Hub has a Free plan so you can start searching startups and exploring the marketplace at no cost. Paid Pro and Enterprise plans add more capacity and features for teams that need them.',
      },
      {
        q: 'What do the paid plans cost?',
        a: 'Pricing depends on which side of the marketplace you are on. Startups, students and academia use the provider plans: Free, or Growth at \u20B9499 per month. Corporates, investors, government bodies and other seekers use Free, Pro at \u20B92,499 per month, or Enterprise at \u20B99,999 per month. Annual billing is available on the paid plans at roughly ten months for twelve.',
      },
    ],
  },
  {
    heading: 'Trust, security and data',
    items: [
      {
        q: 'Is OpenI Hub secure?',
        a: 'OpenI Hub is ISO/IEC 27001:2022 certified, an internationally recognised standard for information security management. The platform is operated by OpenI Partners LLP.',
      },
      {
        q: 'How do startups claim their profile?',
        a: 'Startups can register on OpenI Hub and claim their existing profile to verify ownership. Once claimed, founders control their own profile data, and OpenI Hub will not overwrite founder-filled information with automated enrichment.',
      },
    ],
  },
];

// Flatten every Q&A pair into the schema.org FAQPage mainEntity shape.
const FAQ_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_SECTIONS.flatMap((section) =>
    section.items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    }))
  ),
};

function FaqItem({ q, a, isOpen, onToggle }) {
  return (
    <div style={{ borderBottom: `1px solid ${BORDER}` }}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between gap-4 text-left py-5"
      >
        <span className="text-base md:text-lg font-semibold" style={{ color: DARK }}>
          {q}
        </span>
        <ChevronDown
          size={20}
          color={GRAY}
          style={{
            flexShrink: 0,
            transition: 'transform 0.2s ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>
      {isOpen && (
        <p className="text-sm md:text-base leading-relaxed pb-5 pr-8" style={{ color: GRAY }}>
          {a}
        </p>
      )}
    </div>
  );
}

export default function PublicFAQ() {
  // Open the first question by default; key = `${sectionIndex}-${itemIndex}`.
  const [openKey, setOpenKey] = useState('0-0');

  return (
    <PublicLayout>
      {/* FAQPage structured data for AI answer engines + rich results. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }}
      />

      {/* ═══ HERO ═══ */}
      <section className="px-6 pt-16 pb-10" style={{ background: '#fff' }}>
        <div className="max-w-3xl mx-auto text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
            style={{ background: 'rgba(213, 170, 91, 0.1)', color: GOLD_DARK }}
          >
            <HelpCircle size={16} />
            <span className="text-sm font-semibold">Frequently Asked Questions</span>
          </div>
          <h1
            id="tour-page-faq"
            className="text-3xl md:text-5xl font-extrabold mb-5"
            style={{ color: DARK, fontFamily: 'Plus Jakarta Sans, Inter, sans-serif' }}
          >
            Questions about OpenI Hub
          </h1>
          <p className="text-base md:text-lg leading-relaxed" style={{ color: GRAY }}>
            How OpenI Hub helps corporates, investors, government and academia search
            570,000+ startups, run innovation challenges, and connect with India&apos;s
            deep-tech ecosystem.
          </p>
        </div>
      </section>

      {/* ═══ FAQ SECTIONS ═══ */}
      <section className="px-6 pb-16">
        <div className="max-w-3xl mx-auto">
          {FAQ_SECTIONS.map((section, si) => (
            <div key={section.heading} className="mb-10">
              <h2
                className="text-xl md:text-2xl font-bold mb-2"
                style={{ color: DARK, fontFamily: 'Plus Jakarta Sans, Inter, sans-serif' }}
              >
                {section.heading}
              </h2>
              <div>
                {section.items.map((item, ii) => {
                  const key = `${si}-${ii}`;
                  return (
                    <FaqItem
                      key={key}
                      q={item.q}
                      a={item.a}
                      isOpen={openKey === key}
                      onToggle={() => setOpenKey((cur) => (cur === key ? '' : key))}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="px-6 pb-20">
        <div
          className="max-w-4xl mx-auto rounded-2xl px-8 py-12 text-center"
          style={{ background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_DARK} 100%)` }}
        >
          <h2
            className="text-2xl md:text-3xl font-extrabold mb-3 text-white"
            style={{ fontFamily: 'Plus Jakarta Sans, Inter, sans-serif' }}
          >
            Still have questions?
          </h2>
          <p className="text-base mb-7 text-white" style={{ opacity: 0.95 }}>
            Start free and explore the marketplace, or reach out and we&apos;ll help.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/register"
              className="px-7 py-3 rounded-lg text-base font-bold transition-all"
              style={{ background: '#fff', color: GOLD_DARK }}
            >
              Get Started Free
            </Link>
            <a
              href="mailto:info@openi.ai"
              className="px-7 py-3 rounded-lg text-base font-bold transition-all"
              style={{ background: 'rgba(255,255,255,0.18)', color: '#fff', border: '1px solid rgba(255,255,255,0.5)' }}
            >
              Contact Us
            </a>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
