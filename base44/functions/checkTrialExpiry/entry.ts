import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // This function is called by a scheduled automation - use service role
    const companies = await base44.asServiceRole.entities.Company.list();
    const now = new Date();

    const results = { expired: [], warned: [], ok: [] };

    for (const company of companies) {
      if (!company.trial_end_date || company.plan !== 'trial') {
        results.ok.push(company.name);
        continue;
      }

      const trialEnd = new Date(company.trial_end_date);
      const daysLeft = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));

      if (daysLeft <= 0 && !company.trial_expired) {
        // Trial has expired - mark it
        await base44.asServiceRole.entities.Company.update(company.id, {
          trial_expired: true,
          plan: 'suspended'
        });

        // Send expiry email to billing contact
        if (company.billing_contact_email) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: company.billing_contact_email,
            subject: 'Your ClearVoice trial has ended',
            body: `Hi,\n\nYour free trial for ${company.name} has ended.\n\nTo continue using ClearVoice at R95/seat/month (ex VAT), contact us to activate your subscription.\n\nYour team currently has access suspended. Reach out to us at support@clearvoice.africa to restore access.\n\nThe ClearVoice Team`
          });
        }
        results.expired.push(company.name);

      } else if (daysLeft > 0 && daysLeft <= 7) {
        // Warn when 7 days or less remaining
        if (company.billing_contact_email) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: company.billing_contact_email,
            subject: `Your ClearVoice trial ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`,
            body: `Hi,\n\nYour ClearVoice free trial for ${company.name} ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}.\n\nAfter your trial, ClearVoice is billed at R95/seat/month (ex VAT).\n\nContact us at support@clearvoice.africa before your trial ends to set up your subscription and avoid any interruption.\n\nThe ClearVoice Team`
          });
        }
        results.warned.push(company.name);
      } else {
        results.ok.push(company.name);
      }
    }

    return Response.json({ success: true, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});