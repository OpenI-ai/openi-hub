/**
 * Terms of Use - public page
 * Phase 60.7 (s50). Templated boilerplate; OpenI legal counsel to review pre-launch.
 *
 * Versioning convention: bump TERMS_VERSION when material changes ship,
 * and the next user login will re-prompt acceptance (Phase 60.7+ TBD).
 */
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export const TERMS_VERSION = '1.1';
export const TERMS_EFFECTIVE_DATE = '5 May 2026';

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

export default function Terms() {
  return (
    <div style={{ background: C.pageBg, minHeight: '100vh' }}>
      <div className="legal-page-wrap" style={{ maxWidth: 820, margin: '0 auto' }}>
        {/* Phase 65c — OpenI brand mark */}
        <div style={{ textAlign: 'center', paddingTop: 24, paddingBottom: 8 }}>
          <Link to="/" aria-label="Go to OpenI home" style={{ display: 'inline-block' }}>
            <img
              src="/openi-logo.png"
              alt="OpenI"
              style={{ height: 44, width: 'auto', maxWidth: 180, objectFit: 'contain', display: 'block', cursor: 'pointer' }}
              onError={e => { e.target.style.display = 'none'; }}
            />
          </Link>
        </div>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: C.textMuted,
                              textDecoration: 'none', fontSize: 13, marginBottom: 16 }}>
          <ArrowLeft size={14} /> Back to home
        </Link>

        <div className="legal-page-card" style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, color: C.gold }}>
            <ShieldCheck size={20} />
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase' }}>
              Legal
            </span>
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: C.textHeader, margin: '0 0 4px' }}>
            Terms of Use
          </h1>
          <p style={{ color: C.textMuted, fontSize: 13, marginBottom: 28 }}>
            Version {TERMS_VERSION} &middot; Effective {TERMS_EFFECTIVE_DATE}
          </p>

          <Section title="1. Acceptance of Terms">
            <p>
              These Terms of Use (the &ldquo;Terms&rdquo;) govern your access to and use of the
              OpenI Hub platform operated by <strong>OpenI Partners LLP</strong> (&ldquo;OpenI&rdquo;,
              &ldquo;we&rdquo;, or &ldquo;us&rdquo;), including the website at openi.tech and
              all associated subdomains, APIs, and services (together, the &ldquo;Platform&rdquo;).
            </p>
            <p>
              By creating an account, signing in, or otherwise using the Platform, you confirm
              that you have read, understood, and agree to be bound by these Terms and our
              {' '}<Link to="/privacy" style={{ color: C.link }}>Privacy Policy</Link>.
              If you do not agree, do not use the Platform.
            </p>
          </Section>

          <Section title="2. Eligibility">
            <p>
              You must be at least 18 years old to register an account. By registering, you
              represent that you have the legal capacity to enter into a binding agreement and
              that any organisation you register on behalf of has authorised you to do so.
            </p>
          </Section>

          <Section title="3. Your Account">
            <p>
              You are responsible for keeping your login credentials and any multi-factor
              authentication device secure. You must not share your account or impersonate
              another person, organisation, or persona. We may suspend or terminate accounts
              that we have reason to believe are inauthentic, fraudulent, or in breach of
              these Terms.
            </p>
            <p>
              The Platform supports holding multiple roles (e.g. Investor and Mentor) on a
              single account. You may add or remove roles via your dashboard settings; each
              role is governed equally by these Terms.
            </p>
          </Section>

          <Section title="4. Acceptable Use">
            <p>You agree NOT to:</p>
            <ul>
              <li>upload or transmit unlawful, infringing, defamatory, harassing, or harmful content;</li>
              <li>misrepresent your identity, affiliation, or the status of any startup, deal, or relationship;</li>
              <li>attempt unauthorised access to any account, system, or data;</li>
              <li>use automated tools to scrape, copy, or harvest Platform data, including the
                  startup directory, beyond your subscription tier&rsquo;s limits;</li>
              <li>introduce viruses, malware, or other malicious code;</li>
              <li>resell or sublicense Platform access without our written consent;</li>
              <li>violate any applicable law, including the Information Technology Act, 2000
                  and the Digital Personal Data Protection Act, 2023.</li>
            </ul>
          </Section>

          <Section title="5. Profile Claims and Verification">
            <p>
              The Platform contains imported startup profiles (the &ldquo;Imported Profiles&rdquo;)
              compiled from public sources. Founders and authorised representatives may claim
              an Imported Profile by submitting verification evidence. Claim approval is at
              our discretion based on the evidence provided. False claims may result in
              account suspension and may attract civil or criminal liability.
            </p>
          </Section>

          <Section title="6. User-Generated Content">
            <p>
              You retain ownership of content you submit (profile data, challenge posts,
              applications, evaluations, messages, and similar). You grant OpenI a worldwide,
              royalty-free, non-exclusive licence to host, display, reproduce, and distribute
              that content for the purpose of operating and improving the Platform. You
              represent that you have all rights necessary to grant this licence.
            </p>
            <p>
              We may remove content that we determine, in our reasonable judgement, breaches
              these Terms. We do not pre-screen content and accept no responsibility for
              user-generated content beyond what is required by applicable law.
            </p>
          </Section>

          <Section title="7. Subscriptions, Payments, and Refunds">
            <p>
              Some features require a paid subscription. Plans are offered per role
              (e.g. Mentor Pro, Investor Pro). Pricing displayed at checkout is the price
              you pay; taxes are added where applicable. Subscriptions auto-renew at the end
              of each billing period unless cancelled.
            </p>
            <p>
              Payments are processed by Razorpay or other PCI-compliant providers. We do
              not store full payment-card details on our servers.
            </p>
            <p>
              Refunds are at our discretion and considered case-by-case. Subscription fees
              for the current period are generally non-refundable. To request a refund,
              email <a href="mailto:info@openi.ai" style={{ color: C.link }}>info@openi.ai</a>{' '}
              within 14 days of the charge.
            </p>
          </Section>

          <Section title="8. Intellectual Property">
            <p>
              The Platform, including its design, code, trademarks, AI models, scoring
              frameworks (including the 8-Vector Evaluation Framework), and recommendation
              algorithms, is owned by or licensed to OpenI Partners LLP. Your subscription
              grants a limited, revocable, non-exclusive, non-transferable right to use the
              Platform per these Terms; no other rights are granted by implication.
            </p>
          </Section>

          <Section title="9. Recommendations Disclaimer">
            <p>
              AI-generated recommendations, evaluations, and narrations are provided for
              informational purposes only. They are not investment advice, legal advice, or
              fiduciary recommendations. You are solely responsible for your investment,
              partnership, and business decisions. OpenI is not liable for outcomes arising
              from reliance on any recommendation.
            </p>
          </Section>

          <Section title="10. Third-Party Services">
            <p>
              The Platform integrates with third-party services (e.g. payment processors,
              email providers, analytics, video meeting tools). Your use of those services
              is governed by the respective third party&rsquo;s terms; OpenI is not responsible
              for their availability, accuracy, or conduct.
            </p>
          </Section>

          <Section title="11. Suspension and Termination">
            <p>
              We may suspend, restrict, or terminate your access at any time, with or without
              notice, if we reasonably believe you have breached these Terms, applicable law,
              or a third party&rsquo;s rights. You may close your account at any time; certain
              data (including financial records and audit logs) may be retained as required by
              law.
            </p>
          </Section>

          <Section title="12. Limitation of Liability">
            <p>
              To the maximum extent permitted by law, OpenI&rsquo;s total liability arising
              out of or relating to the Platform shall not exceed the greater of (a) the
              fees paid by you to OpenI in the 12 months preceding the claim, or (b) INR
              10,000. OpenI is not liable for indirect, incidental, special, consequential,
              or exemplary damages, including loss of profits, goodwill, data, or business
              opportunity.
            </p>
          </Section>

          <Section title="13. Indemnity">
            <p>
              You agree to indemnify and hold OpenI, its members, employees, and partners
              harmless from any claim, loss, or expense (including reasonable legal fees)
              arising from your breach of these Terms, your content, or your misuse of the
              Platform.
            </p>
          </Section>

          <Section title="14. Information Security">
            <p>
              OpenI Partners LLP is ISO/IEC 27001:2022 certified (Bureau Veritas Certificate
              No. IND.25.7578/IS/U). We maintain administrative, technical, and physical
              safeguards designed to protect Platform data. No internet service is perfectly
              secure; you use the Platform at your own risk.
            </p>
          </Section>

          <Section title="15. Changes to These Terms">
            <p>
              We may revise these Terms from time to time. Material changes take effect on
              the date noted at the top of the page; the prior version remains available in
              our archives. We will notify you of material changes via email or in-app banner
              and may require fresh acceptance before continued use.
            </p>
          </Section>

          <Section title="16. Force Majeure">
            <p>
              Neither party will be liable for any failure or delay in performing its
              obligations under these Terms to the extent such failure or delay is caused
              by events beyond that party&rsquo;s reasonable control, including but not
              limited to acts of God, natural disasters, fire, flood, earthquake,
              pandemic or epidemic, war, civil unrest, terrorism, government action,
              changes in law, labour disputes, internet or power outages, denial-of-service
              attacks, third-party infrastructure failures (including cloud, payment, or
              email providers), and unavailability of public communication networks.
            </p>
            <p>
              The affected party will use reasonable efforts to mitigate the impact and
              resume performance as soon as practicable. If the force-majeure event
              continues for more than sixty (60) consecutive days, either party may
              terminate the affected services on written notice without further liability,
              other than for amounts already due.
            </p>
          </Section>

          <Section title="17. Severability">
            <p>
              If any provision of these Terms is held by a court or tribunal of competent
              jurisdiction to be invalid, illegal, or unenforceable in any respect, that
              provision will be deemed modified to the minimum extent necessary to make
              it enforceable, and if no such modification is possible, severed from these
              Terms. The remaining provisions will continue in full force and effect.
              Failure by OpenI to enforce any right under these Terms is not a waiver of
              that right.
            </p>
          </Section>

          <Section title="18. Consumer Protection (Indian Users)">
            <p>
              For users who qualify as &ldquo;consumers&rdquo; under the Consumer Protection
              Act, 2019, nothing in these Terms is intended to limit or exclude any
              statutory rights you have that cannot lawfully be limited or excluded.
              In particular, the limitation of liability in Section 12 does not apply to
              the extent it would be unenforceable against a consumer under applicable
              consumer-protection legislation.
            </p>
            <p>
              Grievances relating to consumer rights may be sent to the Grievance Officer
              at the contact address listed in Section 21 below. We will acknowledge such
              grievances within forty-eight (48) hours and aim to resolve them within
              thirty (30) days. Users may also seek recourse through the appropriate
              consumer redressal authority under the Consumer Protection Act, 2019 and
              the Consumer Protection (E-Commerce) Rules, 2020.
            </p>
            <p>
              Mandatory disclosures, including the legal name of the Platform operator,
              registered address, contact details, and refund policy, are provided in
              Section 7 (Subscriptions, Payments, and Refunds) and Section 21 (Contact),
              and are also accessible from the Platform&rsquo;s public footer.
            </p>
          </Section>

          <Section title="19. Export Controls and Sanctions">
            <p>
              You are responsible for compliance with all applicable export-control,
              re-export, and economic-sanctions laws and regulations, including those
              of India, the United States (including OFAC and EAR), the European Union,
              the United Kingdom, and the United Nations.
            </p>
            <p>
              You represent and warrant that:
            </p>
            <ul>
              <li>you are not a person, entity, or government with whom dealings are
                  restricted or prohibited by any applicable sanctions list (including
                  but not limited to the OFAC Specially Designated Nationals list, the
                  EU Consolidated Sanctions list, the UN Security Council Consolidated
                  list, and any list maintained by the Government of India);</li>
              <li>you are not located in, organised under the laws of, or ordinarily
                  resident in any country or region subject to comprehensive trade
                  sanctions imposed by the Government of India, the United States, the
                  European Union, the United Kingdom, or the United Nations;</li>
              <li>you will not access, use, export, or re-export the Platform, or any
                  data obtained through it, in violation of such laws and regulations;</li>
              <li>you will not use the Platform to facilitate transactions involving any
                  restricted person, entity, or jurisdiction.</li>
            </ul>
            <p>
              We may suspend or terminate your access without notice if we have reasonable
              grounds to believe your use of the Platform breaches this Section, or if
              continued service would expose OpenI to sanctions risk. You will indemnify
              OpenI for any loss, claim, fine, or penalty arising from your breach of
              this Section.
            </p>
          </Section>

          <Section title="20. Governing Law and Dispute Resolution">
            <p>
              These Terms are governed by the laws of India. Any dispute will be subject to
              the exclusive jurisdiction of the courts of Mumbai, Maharashtra, India.
              The parties will first attempt to resolve any dispute through good-faith
              discussions for thirty (30) days before initiating legal proceedings.
            </p>
          </Section>

          <Section title="21. Contact">
            <p>
              Questions about these Terms? Email{' '}
              <a href="mailto:info@openi.ai" style={{ color: C.link }}>info@openi.ai</a>{' '}
              or write to: OpenI Partners LLP, 121 Beach Towers, P. Balu Marg,
              New Prabhadevi Road, Mumbai &ndash; 400 025, Maharashtra, India.
            </p>
          </Section>

          <p style={{ fontSize: 12, color: C.textMuted, marginTop: 32, paddingTop: 18,
                       borderTop: `1px solid ${C.border}` }}>
            By using the Platform you confirm acceptance of Version {TERMS_VERSION} of these Terms,
            effective {TERMS_EFFECTIVE_DATE}.
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
