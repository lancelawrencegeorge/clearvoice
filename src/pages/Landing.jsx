import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { motion, useInView } from 'framer-motion';
import { Volume2, Zap, ShieldCheck, Headphones, BarChart3, Users, ChevronRight, CheckCircle2, Globe, Cpu, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';

const FEATURES = [
  {
    icon: Zap,
    title: 'Sub-20ms Latency',
    desc: 'Real-time AI inference runs entirely in-browser using WebAssembly — no cloud round-trip, no delay.',
  },
  {
    icon: ShieldCheck,
    title: '100% Local Processing',
    desc: 'Audio never leaves the device. No recording, no uploads, no compliance headaches.',
  },
  {
    icon: Headphones,
    title: 'Dual-Channel Suppression',
    desc: 'Independent noise suppression on both agent outbound and customer inbound streams.',
  },
  {
    icon: BarChart3,
    title: 'Usage Analytics',
    desc: 'Per-agent adoption dashboards, session tracking, and suppression level insights for managers.',
  },
  {
    icon: Globe,
    title: 'Multi-Tenant Ready',
    desc: 'Domain-scoped data isolation. Each company sees only their own agents and sessions.',
  },
  {
    icon: Cpu,
    title: 'Works With Any Softphone',
    desc: 'Chrome extension integrates with Genesys, Twilio Flex, RingCentral, Avaya, Five9 and more.',
  },
];

const STATS = [
  { value: '< 20ms', label: 'Processing latency' },
  { value: '95%', label: 'Noise reduction' },
  { value: '0 bytes', label: 'Data sent to cloud' },
  { value: '10+', label: 'Softphone integrations' },
];

const PLANS = [
  {
    name: 'Starter',
    price: 'R599',
    per: '/mo per team',
    features: ['Up to 10 agents', 'Basic analytics', 'Chrome extension', 'Email support'],
    cta: 'Get Started',
    highlight: false,
  },
  {
    name: 'Pro',
    price: 'R1,299',
    per: '/mo per team',
    features: ['Up to 50 agents', 'Full analytics + reports', 'Manager dashboards', 'Priority support', 'Custom domain isolation'],
    cta: 'Start Free Trial',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    per: '',
    features: ['Unlimited agents', 'Multi-company management', 'SLA + dedicated support', 'SSO / SAML', 'On-prem option'],
    cta: 'Contact Sales',
    highlight: false,
  },
];

function FadeIn({ children, delay = 0, className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Animated grid background
function GridBg() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'linear-gradient(hsl(185,80%,55%) 1px, transparent 1px), linear-gradient(90deg, hsl(185,80%,55%) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-primary/8 rounded-full blur-[160px]" />
      <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-primary/4 rounded-full blur-[120px]" />
    </div>
  );
}

export default function Landing() {
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    base44.auth.isAuthenticated().then(setAuthed);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* NAV */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/30 bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Volume2 className="w-4 h-4 text-primary" />
            </div>
            <span className="font-bold text-lg tracking-tight">ClearVoice</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#stats" className="hover:text-foreground transition-colors">Performance</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-3">
            {authed ? (
              <Link to="/dashboard">
                <Button size="sm" className="gap-1.5">Dashboard <ChevronRight className="w-3.5 h-3.5" /></Button>
              </Link>
            ) : (
              <Button size="sm" onClick={() => base44.auth.redirectToLogin()}>
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative pt-40 pb-28 px-6">
        <GridBg />
        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-medium mb-6">
              <Wifi className="w-3 h-3" />
              Real-time · In-browser · Zero cloud latency
            </div>
            <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight leading-[1.05] mb-6">
              Crystal-clear calls.<br />
              <span className="text-primary">No noise. No lag.</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10">
              ClearVoice uses on-device AI to remove background noise from your contact centre calls in under 20ms — without sending a single byte to the cloud.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="gap-2 px-8 text-base"
                onClick={() => authed ? window.location.href = '/dashboard' : base44.auth.redirectToLogin()}
              >
                Get Started Free <ChevronRight className="w-4 h-4" />
              </Button>
              <Link to="/guide">
                <Button size="lg" variant="outline" className="gap-2 px-8 text-base">
                  View Setup Guide
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Fake terminal */}
          <FadeIn delay={0.3} className="mt-16 text-left">
            <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur overflow-hidden shadow-2xl">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-border/40 bg-card/80">
                <div className="w-3 h-3 rounded-full bg-destructive/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-primary/60" />
                <span className="ml-3 text-xs text-muted-foreground font-mono">clearvoice — audio engine</span>
              </div>
              <div className="p-6 font-mono text-xs sm:text-sm space-y-2 text-muted-foreground">
                <p><span className="text-primary">▶</span> Initialising noise suppression engine...</p>
                <p><span className="text-primary">✓</span> WebAssembly module loaded <span className="text-muted-foreground/50">(12.4ms)</span></p>
                <p><span className="text-primary">✓</span> Microphone stream acquired</p>
                <p><span className="text-primary">✓</span> Dual-channel pipeline ready</p>
                <p className="animate-pulse"><span className="text-primary">⬤</span> <span className="text-primary">Active</span> — suppression: 80% | latency: <span className="text-primary">14ms</span></p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* STATS */}
      <section id="stats" className="py-16 border-y border-border/30 bg-card/30">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 sm:grid-cols-4 gap-8">
          {STATS.map((s, i) => (
            <FadeIn key={s.label} delay={i * 0.08} className="text-center">
              <p className="text-3xl sm:text-4xl font-extrabold text-primary mb-1">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-16">
            <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">Built for contact centres</p>
            <h2 className="text-3xl sm:text-4xl font-bold">Everything you need for<br />professional-grade audio</h2>
          </FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <FadeIn key={f.title} delay={i * 0.07}>
                <div className="group h-full p-6 rounded-2xl border border-border/50 bg-card/50 hover:border-primary/30 hover:bg-card/80 transition-all duration-300">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <f.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-base mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-24 px-6 bg-card/20">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-16">
            <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">Simple pricing</p>
            <h2 className="text-3xl sm:text-4xl font-bold">Pay for what you need</h2>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map((p, i) => (
              <FadeIn key={p.name} delay={i * 0.1}>
                <div className={`relative h-full flex flex-col p-7 rounded-2xl border transition-all duration-300 ${
                  p.highlight
                    ? 'border-primary/50 bg-primary/5 shadow-[0_0_40px_-10px_hsl(185,80%,55%,0.3)]'
                    : 'border-border/50 bg-card/50'
                }`}>
                  {p.highlight && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                      Most Popular
                    </div>
                  )}
                  <div className="mb-6">
                    <h3 className="font-bold text-lg mb-2">{p.name}</h3>
                    <div className="flex items-end gap-1">
                      <span className="text-4xl font-extrabold">{p.price}</span>
                      <span className="text-muted-foreground text-sm mb-1">{p.per}</span>
                    </div>
                  </div>
                  <ul className="space-y-2.5 mb-8 flex-1">
                    {p.features.map(f => (
                      <li key={f} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={p.highlight ? 'default' : 'outline'}
                    className="w-full"
                    onClick={() => base44.auth.redirectToLogin()}
                  >
                    {p.cta}
                  </Button>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FOOTER */}
      <section className="relative py-24 px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-primary/6 rounded-full blur-[120px]" />
        </div>
        <FadeIn className="relative max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to eliminate noise?</h2>
          <p className="text-muted-foreground mb-8">Set up takes under 5 minutes. No hardware. No IT department required.</p>
          <Button
            size="lg"
            className="gap-2 px-10 text-base"
            onClick={() => authed ? window.location.href = '/dashboard' : base44.auth.redirectToLogin()}
          >
            Start Free <ChevronRight className="w-4 h-4" />
          </Button>
        </FadeIn>
      </section>

      <footer className="border-t border-border/30 py-8 px-6 text-center text-xs text-muted-foreground/50">
        © {new Date().getFullYear()} ClearVoice. All audio processed locally in your browser.
      </footer>
    </div>
  );
}