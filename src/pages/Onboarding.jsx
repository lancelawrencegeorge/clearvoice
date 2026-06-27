import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Building2, CreditCard, Users, CheckCircle2, ChevronRight, Mail, Globe, UserPlus, Calendar } from 'lucide-react';
import { getCurrentAgent, setCurrentAgent, getCurrentSessionId, getTenantDomain } from '@/lib/customAuth';

const TIERS = [
  { range: '0–50 seats', price: 'R110' },
  { range: '51–100 seats', price: 'R95' },
  { range: '101–250 seats', price: 'R85' },
  { range: '250+ seats', price: 'R75' },
];

const STEPS = [
  { id: 'welcome', title: 'Welcome', icon: Volume2 },
  { id: 'company', title: 'Company', icon: Building2 },
  { id: 'plan', title: 'Plan & Trial', icon: CreditCard },
  { id: 'team', title: 'Invite Team', icon: Users },
  { id: 'done', title: 'Done', icon: CheckCircle2 },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [agent, setAgent] = useState(null);
  const [form, setForm] = useState({
    company_name: '',
    domain: '',
    billing_email: '',
  });

  useEffect(() => {
    const a = getCurrentAgent();
    if (!a) {
      navigate('/login', { replace: true });
      return;
    }
    setAgent(a);
    setForm(f => ({
      ...f,
      company_name: a.company || '',
      domain: a.tenant_domain || getTenantDomain(a.email),
      billing_email: a.email,
    }));
  }, [navigate]);

  const update = (key, val) => setForm(p => ({ ...p, [key]: val }));
  const currentStepId = STEPS[step]?.id;

  const canNext = () => {
    if (currentStepId === 'company') return form.company_name.trim() && form.domain.trim();
    return true;
  };

  const handleFinish = async () => {
    setSaving(true);
    setError('');
    try {
      const now = new Date();
      const trialEnd = new Date(now);
      trialEnd.setDate(trialEnd.getDate() + 7);

      const company = await base44.entities.Company.create({
        name: form.company_name.trim(),
        domain: form.domain.toLowerCase().trim(),
        billing_contact_email: form.billing_email.trim(),
        plan: 'trial',
        trial_start_date: now.toISOString(),
        trial_end_date: trialEnd.toISOString(),
        seat_limit: 50,
        is_active: true,
      });

      const updated = await base44.entities.Agent.update(agent.id, {
        role: 'super_user',
        company: form.company_name.trim(),
        tenant_domain: form.domain.toLowerCase().trim(),
        onboarding_complete: true,
      });

      setCurrentAgent({ ...agent, ...updated }, getCurrentSessionId());
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Setup failed. Please try again.');
      setSaving(false);
    }
  };

  if (!agent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <CheckCircle2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full max-w-lg">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.id}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                i < step ? 'bg-primary text-primary-foreground' :
                i === step ? 'bg-primary/20 text-primary border border-primary/40' :
                'bg-secondary text-muted-foreground'
              }`}>
                {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 w-8 transition-all duration-500 ${i < step ? 'bg-primary' : 'bg-border'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
            className="bg-card/80 border border-border/50 rounded-2xl p-8"
          >
            {/* Welcome */}
            {currentStepId === 'welcome' && (
              <div className="text-center space-y-4">
                <img src="https://media.base44.com/images/public/6a0fee336f48ec0bfb9b9279/b787ab024_icon-128.png" alt="ClearVoice" className="w-16 h-16 rounded-2xl object-cover mx-auto" />
                <h1 className="text-2xl font-bold">Welcome to ClearVoice</h1>
                <p className="text-muted-foreground leading-relaxed">
                  You're the first person from <strong>{form.domain || 'your company'}</strong> to sign in. Let's set up your company account so your team can start taking crystal-clear calls.
                </p>
                <div className="grid grid-cols-3 gap-3 pt-2">
                  {[
                    { icon: '🎙', label: 'Live noise removal' },
                    { icon: '⚡', label: 'Under 20ms latency' },
                    { icon: '🔒', label: 'Local processing' },
                  ].map(f => (
                    <div key={f.label} className="bg-secondary/50 rounded-xl p-3 text-center">
                      <div className="text-2xl mb-1">{f.icon}</div>
                      <p className="text-xs text-muted-foreground">{f.label}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground pt-2">
                  This takes about 2 minutes. You'll set up your company, start a 7-day trial, and learn how to invite agents.
                </p>
              </div>
            )}

            {/* Company */}
            {currentStepId === 'company' && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold">Company Details</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    This sets up your tenant and data isolation. Only users with your email domain will see your company's data.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label>Company Name *</Label>
                  <Input
                    placeholder="Acme Contact Centre"
                    value={form.company_name}
                    onChange={e => update('company_name', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Email Domain *</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm font-mono px-3 py-2 bg-secondary rounded-l-md border border-r-0 border-input">@</span>
                    <Input
                      className="rounded-l-none"
                      placeholder="acme.com"
                      value={form.domain}
                      onChange={e => update('domain', e.target.value.toLowerCase().replace(/^@/, ''))}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Pre-filled from your email. Change only if your team uses a different domain.</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Billing Contact Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      className="pl-10"
                      placeholder="billing@acme.com"
                      value={form.billing_email}
                      onChange={e => update('billing_email', e.target.value)}
                    />
                  </div>
                </div>
                <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 text-sm text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground flex items-center gap-2"><Globe className="w-4 h-4 text-primary" /> How data isolation works</p>
                  <p>All agents, session logs and company data will only be visible to people signed in with a <strong>@{form.domain || 'yourdomain.com'}</strong> email address.</p>
                </div>
              </div>
            )}

            {/* Plan & Trial */}
            {currentStepId === 'plan' && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold">Your 7-Day Trial</h2>
                  <p className="text-sm text-muted-foreground mt-1">No credit card required. Full access to all features during your trial.</p>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <Calendar className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <p className="font-medium">Trial starts now</p>
                    <p className="text-sm text-muted-foreground">7 days of full access · ends {new Date(Date.now() + 7 * 86400000).toLocaleDateString()}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-3">Volume pricing (ex VAT):</p>
                  <div className="grid grid-cols-2 gap-3">
                    {TIERS.map(t => (
                      <div key={t.range} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card/50">
                        <span className="text-xs text-muted-foreground">{t.range}</span>
                        <span className="text-lg font-bold">{t.price}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">Per seat per month. Price reduces as your team grows.</p>
                </div>
              </div>
            )}

            {/* Team */}
            {currentStepId === 'team' && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold">Invite Your Team</h2>
                  <p className="text-sm text-muted-foreground mt-1">After setup, you can invite agents from your dashboard. Here's what to expect.</p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-secondary/50">
                    <UserPlus className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Invite individual agents</p>
                      <p className="text-xs text-muted-foreground mt-1">Enter each agent's work email — they'll get a sign-in link and complete their own profile setup.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-secondary/50">
                    <Users className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Bulk import via CSV</p>
                      <p className="text-xs text-muted-foreground mt-1">Upload a spreadsheet of agent emails to invite your whole team at once.</p>
                    </div>
                  </div>
                </div>
                <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">📋 Next steps after onboarding</p>
                  <p>Once you reach the dashboard, use the <strong>Users</strong> tab to invite agents and the <strong>IT Support</strong> tab to download the deployment guide for your team.</p>
                </div>
              </div>
            )}

            {/* Done */}
            {currentStepId === 'done' && (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">You're all set!</h2>
                <p className="text-muted-foreground">
                  <strong>{form.company_name || 'Your company'}</strong> is ready to go. Your 7-day trial is active.
                </p>
                <div className="bg-secondary/50 rounded-xl p-4 text-sm text-left space-y-2">
                  <p className="font-medium">Quick start checklist:</p>
                  {[
                    'Invite agents from the Users tab',
                    'Download the setup guide from IT Support',
                    'Share the guide with your IT team for virtual audio cable setup',
                    'Agents install ClearVoice and start taking clearer calls',
                  ].map(item => (
                    <div key={item} className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-3 mt-8">
              {step > 0 && currentStepId !== 'done' && (
                <Button variant="outline" className="flex-1" onClick={() => setStep(s => s - 1)}>
                  Back
                </Button>
              )}
              {currentStepId !== 'done' ? (
                <Button
                  className="flex-1 gap-2"
                  onClick={() => setStep(s => s + 1)}
                  disabled={!canNext()}
                >
                  {step === 0 ? 'Get Started' : 'Continue'} <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button className="flex-1" onClick={handleFinish} disabled={saving}>
                  {saving ? 'Setting up...' : 'Go to Dashboard →'}
                </Button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}