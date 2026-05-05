/**
 * Privacy Policy - public page
 * Phase 60.7 (s50). Templated boilerplate; OpenI legal counsel to review pre-launch.
 */
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export const PRIVACY_VERSION = '1.0';
export const PRIVACY_EFFECTIVE_DATE = '5 May 2026';

const C = {
  pageBg:     '#F7F5F0',
  cardBg:     '#FFFFFF',
  border:     '#E8E5DD',
  textHeader: '#0D2137',
  textBody:   '#374151',
  textMuted:  '#6F6A60',
  gold:       '#D4A843',
  link:       '#1D4ED8',
};

export default function Privacy() {
  return (
    <div style={{ background: C.pageBg, minHeight: '100vh' }}>
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '32px 24px 64px' }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: C.textMuted,
                              textDecoration: 'none', fontSize: 13, marginBottom: 16 }}>
          <ArrowLeft size={14} /> Back to home
        </Link>

        <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 12, padding: '32px 36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, color: C.gold }}>
            <ShieldCheck size={20} />
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase' }}>
              Legal
            </span>
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: C.textHeader, margin: '0 0 4px' }}>
            Privacy Policy
          </h1>
          <p style={{ color: C.textMuted, fontSize: 13, marginBottom: 28 }}>
            Version {PRIVACY_VERSION} &middot; Effective {PRIVACY_EFFECTIVE_DATE}
          </p>

          <Section title="1. Who We Are">
            <p>
              <strong>OpenI Partners LLP</strong> (&ldquo;OpenI&rdquo;, &ldquo;we&rdquo;,
              or &ldquo;us&rdquo;) operates the OpenI Hub platform (the &ldquo;Platform&rdquo;).
              This Privacy Policy explains what personal data we collect, how we use it, who
              we share it with, and the rights you have over it. It applies to all users
              of the Platform, including visitors, registered users, and recipients of our
              communications.
            </p>
            <p>
              For the purposes of the Digital Personal Data Protection Act, 2023 (&ldquo;DPDPA&rdquo;),
              OpenI Partners LLP is the Data Fiduciary for personal data submitted to the Platform.
            </p>
          </Section>

          <Section title="2. Data We Collect">
            <p>We collect personal data in three ways:</p>
            <ul>
              <li>
                <strong>You provide it directly.</strong> Account details (name, email,
                password hash, organisation, role), profile information for the persona(s)
                you hold, content you post (challenges, applications, evaluations,
                messages), and payment details collected through our payment processor.
              </li>
              <li>
                <strong>Automatically while you use the Platform.</strong> Log entries
                (IP address, browser, device type, timestamps), cookies and similar
                technologies, page-view and click telemetry to improve the product.
              </li>
              <li>
                <strong>From third parties.</strong> Public sources for imported startup
                profiles, payment confirmations from Razorpay, email-deliverability
                signals from our email provider, and OAuth profile data if you sign in
                via a third-party identity provider.
              </li>
            </ul>
          </Section>

          <Section title="3. Why We Process Your Data">
            <p>We use your data to:</p>
            <ul>
              <li>provide, secure, and improve the Platform and its features;</li>
              <li>authenticate you and protect your account (including via multi-factor authentication);</li>
              <li>match you with relevant startups, challenges, mentors, investors, and other users
                  using AI-driven recommendations;</li>
              <li>process subscriptions, payments, and refunds;</li>
              <li>send transactional and (with consent) marketing communications;</li>
              <li>detect and prevent fraud, abuse, and security incidents;</li>
              <li>comply with legal obligations and enforce our{' '}
                  <Link to="/terms" style={{ color: C.link }}>Terms of Use</Link>.</li>
            </ul>
            <p>
              Our legal basis under DPDPA is your consent for non-essential processing,
              and legitimate use (including contractual necessity and legal obligation)
              for processing required to deliver the service you signed up for.
            </p>
          </Section>

          <Section title="4. Imported Startup Profiles">
            <p>
              The Platform contains startup profiles imported from public sources (the
              &ldquo;Imported Profiles&rdquo;). If you are a founder or authorised
              representative of an imported startup and wish to claim, correct, or remove
              the listing, please use the Claim flow inside the Platform or email{' '}
              <a href="mailto:info@openi.ai" style={{ color: C.link }}>info@openi.ai</a>.
            </p>
          </Section>

          <Section title="5. AI Processing">
            <p>
              We use AI models (including OpenAI&rsquo;s embedding and language models) to
              generate recommendations, narrate evaluations, and translate natural-language
              search queries into structured filters. Profile data and challenge text may be
              transmitted to these third-party AI providers under contractual data-processing
              terms. We do not use your personal data to train public foundation models.
            </p>
          </Section>

          <Section title="6. Cookies and Similar Technologies">
            <p>
              We use cookies and local-storage entries to keep you signed in, remember your
              active role, persist UI preferences, and measure aggregate platform usage.
              Essential cookies do not require consent; optional analytics cookies are set
              only after you opt in via the cookie banner where applicable.
            </p>
          </Section>

          <Section title="7. Sharing of Your Data">
            <p>We share personal data only as follows:</p>
            <ul>
              <li>
                <strong>Other Platform users</strong> can view profile fields you mark as
                public (e.g. your name, organisation, sectors, bio). You control which
                fields are visible; private fields are visible only to you and to OpenI
                administrators.
              </li>
              <li>
                <strong>Service providers</strong> we use to run the Platform (cloud
                hosting, email delivery, payment processing, AI inference, error
                monitoring, customer support tooling). All providers are bound by
                contractual confidentiality and data-protection terms.
              </li>
              <li>
                <strong>Legal authorities</strong> when required by valid legal process or
                to protect our rights, users, or the public from harm.
              </li>
              <li>
                <strong>Successors</strong> in the event of a merger, acquisition, or asset
                sale; you will be notified before your data is transferred to a different
                Data Fiduciary.
              </li>
            </ul>
            <p>We do not sell your personal data.</p>
          </Section>

          <Section title="8. International Transfers">
            <p>
              Some of our service providers operate outside India (notably AI inference
              endpoints and email infrastructure). When we transfer your data outside
              India we rely on contractual safeguards approved under the DPDPA and
              applicable foreign privacy laws.
            </p>
          </Section>

          <Section title="9. Data Retention">
            <p>
              We retain your account and profile data for as long as your account is active
              and as long as needed to provide the Platform. Audit logs, payment records,
              and tax documents are retained for the period required by Indian law (typically
              up to seven years). On account deletion we anonymise or delete personal data
              not subject to legal-retention requirements within ninety (90) days.
            </p>
          </Section>

          <Section title="10. Your Rights">
            <p>Subject to applicable law, you have the right to:</p>
            <ul>
              <li>access the personal data we hold about you;</li>
              <li>correct inaccurate personal data and update your profile;</li>
              <li>erase your data, subject to legal-retention exceptions;</li>
              <li>port your data to another service in a machine-readable format;</li>
              <li>withdraw consent for non-essential processing at any time;</li>
              <li>nominate a representative under DPDPA Section 14 to exercise these rights on your behalf;</li>
              <li>file a complaint with the Data Protection Board of India.</li>
            </ul>
            <p>
              To exercise any of these rights, email{' '}
              <a href="mailto:info@openi.ai" style={{ color: C.link }}>info@openi.ai</a>{' '}
              with the subject line &ldquo;Privacy Request&rdquo;. We will respond within thirty (30) days.
            </p>
          </Section>

          <Section title="11. Security">
            <p>
              OpenI Partners LLP is ISO/IEC 27001:2022 certified (Bureau Veritas Certificate
              No. IND.25.7578/IS/U). We use encryption in transit (TLS 1.2+), encryption at
              rest for production databases and backups, role-based access controls,
              multi-factor authentication for staff, and continuous security monitoring.
              Backups are encrypted and stored across geographically separated locations.
              Despite our safeguards, no system can guarantee absolute security; please notify
              us immediately if you suspect any unauthorised access.
            </p>
          </Section>

          <Section title="12. Children">
            <p>
              The Platform is intended for users aged 18 and above. We do not knowingly
              collect personal data from children. If you believe a child has provided us
              with personal data, please contact us and we will remove it promptly.
            </p>
          </Section>

          <Section title="13. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. The version number and
              effective date at the top of this page reflect the latest revision. Material
              changes will be communicated via email or in-app banner before they take
              effect.
            </p>
          </Section>

          <Section title="14. Grievance Officer / Data Protection Officer">
            <p>
              In compliance with the Information Technology (Reasonable Security Practices
              and Procedures and Sensitive Personal Data or Information) Rules, 2011 and
              the DPDPA:
            </p>
            <p style={{ marginTop: 6 }}>
              <strong>Grievance Officer / DPO</strong><br/>
              OpenI Partners LLP<br/>
              121 Beach Towers, P. Balu Marg, New Prabhadevi Road,<br/>
              Mumbai &ndash; 400 025, Maharashtra, India<br/>
              Email: <a href="mailto:info@openi.ai" style={{ color: C.link }}>info@openi.ai</a>
            </p>
            <p style={{ marginTop: 6 }}>
              We aim to acknowledge grievances within forty-eight (48) hours and resolve
              them within thirty (30) days.
            </p>
          </Section>

          <p style={{ fontSize: 12, color: C.textMuted, marginTop: 32, paddingTop: 18,
                       borderTop: `1px solid ${C.border}` }}>
            See also our <Link to="/terms" style={{ color: C.link }}>Terms of Use</Link>{' '}
            (Version 1.0). By using the Platform you confirm acceptance of Version{' '}
            {PRIVACY_VERSION} of this Privacy Policy, effective {PRIVACY_EFFECTIVE_DATE}.
          </p>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ fontSize: 17, fontWeight: 700, color: C.textHeader, margin: '0 0 8px' }}>
        {title}
      </h2>
      <div style={{ fontSize: 14, lineHeight: 1.65, color: C.textBody }}>
        {children}
      </div>
    </div>
  );
}
