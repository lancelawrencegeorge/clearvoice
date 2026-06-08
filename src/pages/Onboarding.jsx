import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, User, Building2, Headphones, CheckCircle2, ChevronRight, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SOFTPHONES = [
  'Genesys Cloud', 'Twilio Flex', 'RingCentral', 'Avaya', 'Cisco Finesse',
  'NICE CXone', 'Five9', 'Amazon Connect', 'Salesforce Service Cloud', 'Other'
];

// Steps for regular users
const USER_STEPS = [
  { id: 'welcome', title: 'Welcome to ClearVoice', icon: Volume2 },
  { id: 'profile', title: 'Your Profile', icon: User },
  { id: 'setup', title: 'Your Setup', icon: Headphones },
  { id: 'done', title: "You're all set!", icon: CheckCircle2 },
];

// Extra domain step inserted for admins/super_users after welcome
const ADMIN_STEPS = [
  { id: 'welcome', title: 'Welcome to ClearVoice', icon: Volume2 },
  { id: 'domain', title: 'Your Company Domain', icon: Globe },
  { id: 'profile', title: 'Your Profile', icon: User },
  { id: 'setup', title: 'Your Setup', icon: Headphones },
  { id: 'done', title: "You're all set!", icon: CheckCircle2 },
];

const ADMIN_ROLES = ['admin', 'super_user', 'manager'];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [form, setForm] = useState({
    job_title: '',
    phone: '',
    softphone_platform: '',
    domain: '',
  });

  useEffect(() => {
    base44.auth.me().then(u => {
      setCurrentUser(u);
      if (u?.email) {
        const autoDomaain = u.email.split('@')[1] || '';
        setForm(f => ({ ...f, domain: autoDomaain }));
      }
    });
  }, []);

  const isAdmin = ADMIN_ROLES.includes(currentUser?.role);
  const STEPS = isAdmin ? ADMIN_STEPS : USER_STEPS;
  const currentStepId = STEPS[step]?.id;

  const update = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const handleFinish = async () => {
    setSaving(true);
    const updates = {
      ...form,
      onboarding_complete: true,
      last_active_date: new Date().toISOString(),
    };
    // Store domain on user for RLS
    if (isAdmin && form.domain) {
      updates.domain = form.domain.toLowerCase().trim();
    } else if (currentUser?.email) {
      // Regular users get domain auto-set from email
      updates.domain = currentUser.email.split('@')[1]?.toLowerCase() || '';
    }
    await base44.auth.updateMe(updates);
    navigate('/');
  };

  const canNext = () => {
    if (currentStepId === 'domain') return form.domain.trim().length > 0;
    if (currentStepId === 'profile') return form.job_title.trim().length > 0;
    if (currentStepId === 'setup') return form.softphone_platform.length > 0;
    return true;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      {/* Ambient glow */}
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
            {/* Step: Welcome */}
            {currentStepId === 'welcome' && (
              <div className="text-center space-y-4">
                <img src="https://media.base44.com/images/public/6a0fee336f48ec0bfb9b9279/b787ab024_icon-128.png" alt="ClearVoice" className="w-16 h-16 rounded-2xl object-cover mx-auto" />
                <h1 className="text-2xl font-bold">Welcome to ClearVoice</h1>
                <p className="text-muted-foreground leading-relaxed">
                  Real-time AI noise suppression for your calls. Let's get you set up in just a few steps so you can start delivering crystal-clear audio.
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
              </div>
            )}

            {/* Step: Domain (admin/super_user/manager only) */}
            {currentStepId === 'domain' && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold">Your Company Domain</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    This domain controls data isolation — only users with this email domain will see your company's data.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label>Company Email Domain *</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm font-mono px-3 py-2 bg-secondary rounded-l-md border border-r-0 border-input">@</span>
                    <Input
                      className="rounded-l-none"
                      placeholder="acme.com"
                      value={form.domain}
                      onChange={e => update('domain', e.target.value.toLowerCase().replace(/^@/, ''))}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    We've pre-filled this from your email address. Only change it if your team uses a different domain.
                  </p>
                </div>
                <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 text-sm text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground">🔒 How data isolation works</p>
                  <p>All users, session logs and company data will only be visible to people signed in with a <strong>@{form.domain || 'yourdomain.com'}</strong> email address.</p>
                </div>
              </div>
            )}

            {/* Step: Profile */}
            {currentStepId === 'profile' && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold">Your Profile</h2>
                  <p className="text-sm text-muted-foreground mt-1">Help your admin manage your account.</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Job Title *</Label>
                  <Input
                    placeholder="e.g. Customer Support Agent"
                    value={form.job_title}
                    onChange={e => update('job_title', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone Number <span className="text-muted-foreground text-xs">(optional)</span></Label>
                  <Input
                    placeholder="+1 555 000 0000"
                    value={form.phone}
                    onChange={e => update('phone', e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Step: Setup */}
            {currentStepId === 'setup' && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold">Your Softphone Setup</h2>
                  <p className="text-sm text-muted-foreground mt-1">This helps us optimise ClearVoice for your platform.</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Softphone Platform *</Label>
                  <Select value={form.softphone_platform} onValueChange={v => update('softphone_platform', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your platform..." />
                    </SelectTrigger>
                    <SelectContent>
                      {SOFTPHONES.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">📋 What to do next</p>
                  <p>After setup, download the ClearVoice Chrome extension from your admin and follow the installation guide at <strong>/guide</strong>.</p>
                </div>
              </div>
            )}

            {/* Step: Done */}
            {currentStepId === 'done' && (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">You're all set!</h2>
                <p className="text-muted-foreground">
                  ClearVoice is ready to go. Head to the dashboard to activate noise suppression before your next call.
                </p>
                <div className="bg-secondary/50 rounded-xl p-4 text-sm text-left space-y-2">
                  <p className="font-medium">Quick start checklist:</p>
                  {['Install the Chrome extension (see /guide)', 'Open your softphone in Chrome', 'Click Start in ClearVoice popup', 'Make a test call and compare quality'].map(item => (
                    <div key={item} className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
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
                  {saving ? 'Saving...' : 'Go to Dashboard →'}
                </Button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}