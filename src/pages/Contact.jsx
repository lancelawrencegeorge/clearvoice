import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, CheckCircle2, ArrowLeft, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';

const SEAT_OPTIONS = ['1–10', '11–50', '51–100', '101–250', '250+'];

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', company: '', seats: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name || !form.email || !form.company) {
      setError('Please fill in your name, email, and company.');
      return;
    }

    setSubmitting(true);
    try {
      const body = [
        `New demo request from the ClearVoice website:`,
        ``,
        `Name: ${form.name}`,
        `Email: ${form.email}`,
        `Company: ${form.company}`,
        `Seats: ${form.seats || 'Not specified'}`,
        `Message: ${form.message || 'None'}`,
      ].join('\n');

      await base44.integrations.Core.SendEmail({
        to: 'sales@clearvoice.africa',
        subject: `Demo Request — ${form.company}`,
        body,
      });

      setSubmitted(true);
    } catch (err) {
      setError('Something went wrong sending your request. Please try again or email us directly.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* NAV */}
      <header className="border-b border-border/30 bg-background/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="https://media.base44.com/images/public/6a0fee336f48ec0bfb9b9279/b787ab024_icon-128.png" alt="ClearVoice" className="w-8 h-8 rounded-lg object-cover" />
            <span className="font-bold text-lg tracking-tight">ClearVoice</span>
          </Link>
          <Link to="/">
            <Button size="sm" variant="ghost" className="gap-1.5">
              <ArrowLeft className="w-4 h-4" /> Back to home
            </Button>
          </Link>
        </div>
      </header>

      <section className="relative py-20 px-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-primary/8 rounded-full blur-[160px] pointer-events-none" />
        <div className="relative max-w-xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-3 text-center">Request a Demo</p>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-center mb-3">
              See ClearVoice in action
            </h1>
            <p className="text-muted-foreground text-center mb-10">
              Tell us about your team and we'll set up a personalised demo.
            </p>

            {submitted ? (
              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-8 text-center">
                <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">Request received!</h2>
                <p className="text-muted-foreground mb-6">
                  Thanks {form.name.split(' ')[0]} — our team will reach out to {form.email} within one business day.
                </p>
                <Link to="/">
                  <Button className="gap-2">
                    Back to home <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="rounded-2xl border border-border/50 bg-card/50 p-8 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full name *</Label>
                    <Input id="name" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Jane Smith" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Work email *</Label>
                    <Input id="email" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="jane@company.com" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="company">Company *</Label>
                    <Input id="company" value={form.company} onChange={(e) => update('company', e.target.value)} placeholder="Acme Pty Ltd" />
                  </div>
                  <div className="space-y-2">
                    <Label>Number of agents</Label>
                    <Select value={form.seats} onValueChange={(v) => update('seats', v)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select range" />
                      </SelectTrigger>
                      <SelectContent>
                        {SEAT_OPTIONS.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea id="message" value={form.message} onChange={(e) => update('message', e.target.value)} placeholder="Tell us about your contact centre setup, softphone platform, or any questions..." rows={4} />
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <Button type="submit" size="lg" className="w-full gap-2" disabled={submitting}>
                  {submitting ? 'Sending...' : <>Request demo <Send className="w-4 h-4" /></>}
                </Button>
              </form>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
}