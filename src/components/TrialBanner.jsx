import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { AlertTriangle, XCircle, ChevronRight } from 'lucide-react';
import { differenceInDays } from 'date-fns';

export default function TrialBanner({ user }) {
  const [company, setCompany] = useState(null);

  useEffect(() => {
    if (!user?.domain) return;
    base44.entities.Company.filter({ domain: user.domain }).then(results => {
      if (results?.length > 0) setCompany(results[0]);
    });
  }, [user]);

  if (!company || company.plan === 'paid') return null;

  const now = new Date();

  // Trial expired / suspended
  if (company.trial_expired || company.plan === 'suspended') {
    return (
      <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 mb-6 flex items-start gap-3">
        <XCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-destructive">Your free trial has ended</p>
          <p className="text-sm text-destructive/80 mt-0.5">
            To continue using ClearVoice at <strong>R95/seat/month (ex VAT)</strong>, please contact us to activate your subscription.
          </p>
        </div>
      </div>
    );
  }

  if (company.plan !== 'trial' || !company.trial_end_date) return null;

  const daysLeft = differenceInDays(new Date(company.trial_end_date), now);

  if (daysLeft > 7) return null; // No banner until 7 days left

  const isUrgent = daysLeft <= 3;

  return (
    <div className={`border rounded-xl p-4 mb-6 flex items-start gap-3 ${
      isUrgent
        ? 'bg-destructive/10 border-destructive/30'
        : 'bg-yellow-500/10 border-yellow-500/30'
    }`}>
      <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${isUrgent ? 'text-destructive' : 'text-yellow-400'}`} />
      <div>
        <p className={`font-semibold ${isUrgent ? 'text-destructive' : 'text-yellow-400'}`}>
          {daysLeft <= 0 ? 'Trial expires today!' : `Trial ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`}
        </p>
        <p className="text-sm text-muted-foreground mt-0.5">
          After your trial, ClearVoice is billed at <strong>R95/seat/month (ex VAT)</strong>.
          Contact us to set up your subscription and avoid interruption.
        </p>
      </div>
    </div>
  );
}