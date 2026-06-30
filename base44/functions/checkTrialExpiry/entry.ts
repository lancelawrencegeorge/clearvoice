import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // This function is called by a scheduled automation — use service role.
    const companies = await base44.asServiceRole.entities.Company.list();
    const now = new Date();

    const results = { expired: [], warned: [], ok: [] };

    for (const company of companies) {
      if (!company.trial_end_date || company.plan !== 'trial') {
        results.ok.push(company.name);
        continue;
      }

      const trialEnd = new Date(company.trial_end_date);
      const msPerDay = 1000 * 60 * 60 * 24;
      const daysLeft = Math.ceil((trialEnd - now) / msPerDay);

      // --- Trial has ended: stop service + send expiry email ---
      if (daysLeft <= 0 && !company.trial_expired) {
        await base44.asServiceRole.entities.Company.update(company.id, {
          trial_expired: true,
          plan: 'suspended',
        });

        if (company.billing_contact_email && !company.trial_expiry_email_sent) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: company.billing_contact_email,
            subject: 'Your ClearVoice trial has ended',
            body: `Hi,\n\nYour free trial for ${company.name} has ended and access to ClearVoice has been suspended.\n\nTo continue using ClearVoice at R95/seat/month (ex VAT), please contact us to activate your subscription.\n\nReply to this email or reach us at support@clearvoice.africa to restore access.\n\nThe ClearVoice Team`
          });
          await base44.asServiceRole.entities.Company.update(company.id, {
            trial_expiry_email_sent: true,
          });
        }
        results.expired.push(company.name);
        continue;
      }

      // --- 3 days before trial ends: send reminder email ---
      if (daysLeft <= 3 && daysLeft > 0 && !company.trial_reminder_sent) {
        if (company.billing_contact_email) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: company.billing_contact_email,
            subject: `Your ClearVoice trial ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`,
            body: `Hi,\n\nYour ClearVoice free trial for ${company.name} ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}.\n\nAfter your trial ends, your team's access will be suspended. To avoid interruption, contact us to set up your subscription at R95/seat/month (ex VAT).\n\nReach us at support@clearvoice.africa before your trial ends.\n\nThe ClearVoice Team`
          });
        }
        await base44.asServiceRole.entities.Company.update(company.id, {
          trial_reminder_sent: true,
        });
        results.warned.push(company.name);
        continue;
      }

      results.ok.push(company.name);
    }

    return Response.json({ success: true, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});