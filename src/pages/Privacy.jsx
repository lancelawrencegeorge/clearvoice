import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, Cpu, Ban, Database, Building2, Mail, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SECTIONS = [
  {
    icon: Ban,
    title: 'Is voice/call audio stored or recorded?',
    body: (
      <>
        <p className="text-muted-foreground mb-3">
          No. ClearVoice does not record, capture, or store call audio at any point.
        </p>
        <ul className="space-y-2 text-muted-foreground">
          <li className="flex gap-2">
            <span className="text-primary shrink-0">•</span>
            <span>Audio is processed in real time using an on-device neural network (WebAssembly-based), running locally in the agent's browser or desktop app.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary shrink-0">•</span>
            <span>Processed audio is passed directly to the agent's softphone/call platform — it is not written to disk, buffered to a server, or retained after the call ends.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary shrink-0">•</span>
            <span>There is no cloud round-trip for the noise suppression function: 0 bytes of call audio are sent to the cloud.</span>
          </li>
        </ul>
      </>
    ),
  },
  {
    icon: Cpu,
    title: 'Is audio processed by AI, and how?',
    body: (
      <p className="text-muted-foreground">
        Yes — but exclusively on-device, not in the cloud. ClearVoice uses a recurrent neural network
        (RNNoise-based) to distinguish speech from background noise, frame-by-frame, in under 20ms.
        This AI model runs locally as a WebAssembly module inside the browser/app process — it does
        not call an external AI/ML API, and no audio is transmitted off the device for this processing
        to occur.
      </p>
    ),
  },
  {
    icon: Lock,
    title: 'Is conversation content used for model training?',
    body: (
      <p className="text-muted-foreground">
        No. Because no call audio is ever transmitted or stored outside the agent's own device, there
        is no conversation content available to be collected, reviewed, or used for model training or
        improvement purposes. This is a structural property of the architecture, not solely a policy
        commitment.
      </p>
    ),
  },
  {
    icon: Database,
    title: 'Data retention — is there a zero-data-retention option?',
    body: (
      <p className="text-muted-foreground">
        Call audio retention is zero by default and by design — there is nothing captured to retain in
        the first place. One distinction worth noting: ClearVoice's optional Usage Analytics feature
        (used for manager/admin dashboards) stores limited non-audio metadata, such as session
        start/end times, noise suppression level used, and per-agent adoption/usage statistics. This
        metadata never includes call audio or conversation content — it is operational/usage data
        only, used to give team managers visibility into adoption and suppression performance.
      </p>
    ),
  },
  {
    icon: Building2,
    title: 'Data segmentation & multi-tenancy',
    body: (
      <p className="text-muted-foreground">
        ClearVoice uses domain-scoped data isolation: each company's Super User account and agent data
        is isolated to that company's registered email domain. Companies cannot see or access another
        company's agents, sessions, or usage data.
      </p>
    ),
  },
];

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="https://media.base44.com/images/public/6a0fee336f48ec0bfb9b9279/ccdfa1a60_image.png"
              alt="ClearVoice"
              className="w-9 h-9 rounded-lg object-cover"
            />
            <span className="font-bold text-lg">ClearVoice</span>
          </Link>
          <Link to="/login">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Back to Sign In
            </Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Data Privacy &amp; Retention Statement
          </h1>
          <p className="text-muted-foreground text-lg">
            ClearVoice — real-time noise suppression for contact centres
          </p>
        </div>

        {/* Summary */}
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 mb-8">
          <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Summary
          </h2>
          <p className="text-muted-foreground">
            ClearVoice is architected to process voice audio entirely on-device, within the agent's
            own browser or desktop application. No audio content is transmitted to, or processed by,
            any cloud server or third-party service as part of its core noise suppression function.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {SECTIONS.map((section, i) => {
            const Icon = section.icon;
            return (
              <div key={i} className="rounded-xl border border-border bg-card p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Icon className="w-5 h-5 text-primary shrink-0" />
                  {section.title}
                </h2>
                {section.body}
              </div>
            );
          })}
        </div>

        {/* Contact */}
        <div className="rounded-xl border border-border bg-card p-6 mt-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary shrink-0" />
            Contact
          </h2>
          <p className="text-muted-foreground">
            For further questions regarding this statement or a formal Data Processing Agreement (DPA)
            request, please contact:{' '}
            <a href="mailto:lance@sonkay.co.za" className="text-primary hover:underline font-medium">
              lance@sonkay.co.za
            </a>
          </p>
        </div>

        {/* Footer note */}
        <p className="text-xs text-muted-foreground/60 mt-10 leading-relaxed">
          This statement reflects the technical architecture of ClearVoice and is intended to answer
          common data-privacy questions raised during vendor evaluation. It is not a substitute for
          formal legal review. For enterprise procurement requiring a signed Data Processing Agreement
          or formal compliance certification, please contact us directly.
        </p>
      </main>
    </div>
  );
}