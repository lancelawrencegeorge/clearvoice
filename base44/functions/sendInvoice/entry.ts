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
    const { invoice_id } = body;

    if (!invoice_id) {
      return Response.json({ error: 'invoice_id required' }, { status: 400 });
    }

    const invoice = await base44.asServiceRole.entities.Invoice.get(invoice_id);
    if (!invoice) {
      return Response.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (!invoice.billing_contact_email) {
      return Response.json({ error: 'No billing contact email on file for this tenant' }, { status: 400 });
    }

    const formatZAR = (amount) =>
      'R' + Number(amount).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const subject = `ClearVoice Invoice ${invoice.invoice_number} - ${invoice.billing_month}`;
    const emailBody = `Hello,

Please find your ClearVoice invoice for ${invoice.billing_month} below.

Invoice Number: ${invoice.invoice_number}
Company: ${invoice.company_name}
Billing Month: ${invoice.billing_month}

Seats: ${invoice.seat_count}
Price per Seat: ${formatZAR(invoice.price_per_seat)}
Full Month Charge: ${formatZAR(invoice.full_month_charge)}
Prorata Charge: ${formatZAR(invoice.prorata_charge)}

Total Due: ${formatZAR(invoice.total_charge)}

Please process payment within 30 days.

Questions? Contact us at support@clearvoice.africa.

Regards,
ClearVoice Billing`;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: invoice.billing_contact_email,
      subject: subject,
      body: emailBody,
    });

    await base44.asServiceRole.entities.Invoice.update(invoice_id, {
      status: 'sent',
      sent_date: new Date().toISOString(),
    });

    return Response.json({ success: true, invoice_number: invoice.invoice_number });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});