import React from 'react';
import LegalLayout from '@/components/legal/LegalLayout';
import LegalSection from '@/components/legal/LegalSection';

export default function Privacy() {
  return (
    <LegalLayout
      title="Privacy Notice"
      subtitle="How SONKAY handles personal information for ClearVoice, in line with the Protection of Personal Information Act (POPIA)."
      updated="10 November 2026"
    >
      <LegalSection title="Who is responsible">
        <p>
          SONKAY is the responsible party for the personal information described in this notice. We are
          based in South Africa and can be reached at{' '}
          <a href="mailto:support@sonkay.co.za" className="text-primary hover:underline">support@sonkay.co.za</a>.
          Our Information Officer is Lance George, reachable at the same address.
        </p>
      </LegalSection>

      <LegalSection title="What we collect">
        <ul className="space-y-2">
          <li>Account information: name, work email, phone, organisation, role and tenant.</li>
          <li>
            Usage information: pages used, actions taken, device and browser type, approximate location
            derived from your IP address, and error logs.
          </li>
          <li>
            Device and audio device information needed to run the desktop application, such as the
            microphone and speaker devices you have selected.
          </li>
          <li>Communications with our support team.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Call audio">
        <p>
          ClearVoice suppresses noise on your device. Call audio is never recorded, captured or stored,
          and no audio is sent to our servers for noise suppression. The audio devices you select are kept
          as local preferences on your own machine.
        </p>
      </LegalSection>

      <LegalSection title="Why we process it">
        <p>
          To create and secure your account, deliver and support the service, keep the service reliable
          and improve it, invoice and collect payment, and meet our legal obligations.
        </p>
      </LegalSection>

      <LegalSection title="Lawful basis">
        <ul className="space-y-2">
          <li>
            Performance of our contract with your organisation, or our legitimate interest in running and
            securing the service where that interest does not override your rights.
          </li>
          <li>Consent for optional analytics, which you can withdraw at any time.</li>
          <li>Legal obligation for records such as tax records.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Who we share it with">
        <p>
          Our hosting and application platform provider, which processes data on our behalf; analytics
          providers, only where consent was given; payment providers for subscriptions; and professional
          advisers or authorities where the law requires it. We do not sell personal information and we do
          not share it for third-party advertising.
        </p>
      </LegalSection>

      <LegalSection title="Where your information goes">
        <p>
          Some of our providers process information outside South Africa, including in the United States,
          under contractual safeguards and the transfer conditions in section 72 of POPIA.
        </p>
      </LegalSection>

      <LegalSection title="How long we keep it">
        <ul className="space-y-2">
          <li>Account information: for the life of the account plus twelve months.</li>
          <li>Usage and diagnostic data: twelve months.</li>
          <li>Support correspondence: three years.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Your rights">
        <p>
          Under POPIA you may request access to your personal information, ask us to correct or delete it,
          object to processing, and withdraw consent. Email{' '}
          <a href="mailto:support@sonkay.co.za" className="text-primary hover:underline">support@sonkay.co.za</a>{' '}
          and we will respond within 30 days. If you are not satisfied with our response, you may complain
          to the Information Regulator of South Africa.
        </p>
      </LegalSection>

      <LegalSection title="Security">
        <p>
          We use encryption in transit, access controls, tenant separation and audit logging. No system is
          perfectly secure, so please use a strong and unique password and report any suspected misuse to{' '}
          <a href="mailto:support@sonkay.co.za" className="text-primary hover:underline">support@sonkay.co.za</a>.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}