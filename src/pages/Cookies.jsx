import React from 'react';
import LegalLayout from '@/components/legal/LegalLayout';
import LegalSection from '@/components/legal/LegalSection';

export default function Cookies() {
  return (
    <LegalLayout
      title="Cookie Notice"
      subtitle="How ClearVoice uses cookies and local storage."
      updated="10 November 2026"
    >
      <LegalSection title="What cookies are">
        <p>
          Cookies are small text files stored on your device. Some keep you signed in, others show how a
          site is used. We also use local storage to remember your choices.
        </p>
      </LegalSection>

      <LegalSection title="Strictly necessary">
        <p>
          These are required for the service to work: keeping you signed in, protecting forms and
          remembering security settings. They cannot be switched off and they expire when you sign out or
          the session ends. The desktop application stores local preferences, such as your selected audio
          devices, on your own machine and does not send them anywhere.
        </p>
      </LegalSection>

      <LegalSection title="Analytics">
        <p>
          We do not currently run analytics cookies on this site. If we add them, they will load only after
          you accept, and this page will change before that happens.
        </p>
      </LegalSection>

      <LegalSection title="Advertising">
        <p>
          We do not use advertising cookies, cross-site tracking pixels or social media trackers.
        </p>
      </LegalSection>

      <LegalSection title="Browser controls">
        <p>
          You can block or delete cookies in your browser. Blocking strictly necessary cookies will break
          sign-in.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Questions about cookies? Email{' '}
          <a href="mailto:support@sonkay.co.za" className="text-primary hover:underline">support@sonkay.co.za</a>.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}