import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    let body = {};
    try { body = await req.json(); } catch (e) {}
    const { company_id, action, new_end_date } = body;

    if (!company_id) {
      return Response.json({ error: 'company_id required' }, { status: 400 });
    }

    if (!['extend_trial', 'activate_paid', 'deactivate'].includes(action)) {
      return Response.json({ error: 'action must be "extend_trial", "activate_paid", or "deactivate"' }, { status: 400 });
    }

    const company = await base44.asServiceRole.entities.Company.get(company_id);
    if (!company) {
      return Response.json({ error: 'Company not found' }, { status: 404 });
    }

    if (action === 'extend_trial') {
      if (!new_end_date) {
        return Response.json({ error: 'new_end_date required for extend_trial' }, { status: 400 });
      }
      await base44.asServiceRole.entities.Company.update(company_id, {
        trial_end_date: new Date(new_end_date).toISOString(),
        trial_expired: false,
        trial_reminder_sent: false,
        trial_expiry_email_sent: false,
        plan: 'trial',
        is_active: true,
      });

      if (company.billing_contact_email) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: company.billing_contact_email,
          subject: 'Your ClearVoice trial has been extended',
          body: `Hi,\n\nGood news! Your ClearVoice trial for ${company.name} has been extended to ${new Date(new_end_date).toLocaleDateString('en-ZA')}.\n\nYour team can continue using ClearVoice without interruption.\n\nThe ClearVoice Team`
        });
      }

      return Response.json({ success: true, action: 'extend_trial', company_id });
    }

    // activate_paid
    await base44.asServiceRole.entities.Company.update(company_id, {
      plan: 'paid',
      trial_expired: false,
      is_active: true,
    });

    if (company.billing_contact_email) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: company.billing_contact_email,
        subject: 'Your ClearVoice subscription is now active',
        body: `Hi,\n\nYour ClearVoice subscription for ${company.name} is now active.\n\nYour team can continue using ClearVoice without interruption. You'll receive monthly invoices at R95/seat/month (ex VAT).\n\nThank you for choosing ClearVoice.\n\nThe ClearVoice Team`
      });
    }

    // deactivate
    await base44.asServiceRole.entities.Company.update(company_id, {
      plan: 'suspended',
      trial_expired: true,
      is_active: false,
    });

    if (company.billing_contact_email) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: company.billing_contact_email,
        subject: 'Your ClearVoice access has been deactivated',
        body: `Hi,\n\nAccess to ClearVoice for ${company.name} has been deactivated.\n\nIf this was unexpected or you'd like to resume service, please contact us at support@clearvoice.africa.\n\nThe ClearVoice Team`
      });
    }

    return Response.json({ success: true, action: 'deactivate', company_id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});