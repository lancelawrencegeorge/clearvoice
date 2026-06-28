import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // If authenticated, must be admin; if not (scheduled automation), proceed.
    const isAuthenticated = await base44.auth.isAuthenticated();
    if (isAuthenticated) {
      const user = await base44.auth.me();
      if (user.role !== 'admin') {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    let body = {};
    try { body = await req.json(); } catch (e) {}
    const refDate = body.billing_month ? new Date(body.billing_month + '-01T00:00:00') : new Date();
    const billingMonth = `${refDate.getFullYear()}-${String(refDate.getMonth() + 1).padStart(2, '0')}`;

    // Fetch all agents and companies (service role — cross-tenant)
    const agents = await base44.asServiceRole.entities.Agent.list('-created_date', 500);
    const companies = await base44.asServiceRole.entities.Company.list('-created_date', 500);

    // Group agents by tenant
    const tenantMap = {};
    agents.forEach((a) => {
      const t = a.tenant_domain || '(unassigned)';
      if (!tenantMap[t]) tenantMap[t] = { domain: t, agents: [], company: null };
      tenantMap[t].agents.push(a);
    });
    companies.forEach((c) => {
      const d = c.domain || '(unassigned)';
      if (tenantMap[d]) {
        tenantMap[d].company = c;
      } else {
        tenantMap[d] = { domain: d, agents: [], company: c };
      }
    });

    // Skip tenants that already have an invoice for this month
    const existingInvoices = await base44.asServiceRole.entities.Invoice.filter({ billing_month: billingMonth });
    const existingDomains = new Set(existingInvoices.map((inv) => inv.tenant_domain));

    const year = refDate.getFullYear();
    const month = refDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const getPricePerSeat = (seatCount) => {
      if (seatCount <= 50) return 110;
      if (seatCount <= 100) return 95;
      if (seatCount <= 250) return 85;
      return 75;
    };

    const results = [];
    for (const [domain, t] of Object.entries(tenantMap)) {
      if (existingDomains.has(domain)) {
        results.push({ domain, status: 'already_exists' });
        continue;
      }

      const activeAgents = t.agents.filter((a) => a.status !== 'Suspended');
      const seatCount = activeAgents.length;
      if (seatCount === 0) {
        results.push({ domain, status: 'no_active_agents' });
        continue;
      }

      const pricePerSeat = getPricePerSeat(seatCount);
      let fullMonthSeats = 0;
      let prorataCharge = 0;

      activeAgents.forEach((agent) => {
        const created = new Date(agent.created_date);
        if (created.getFullYear() === year && created.getMonth() === month) {
          const dayCreated = created.getDate();
          const daysActive = daysInMonth - dayCreated + 1;
          const prorataFraction = daysActive / daysInMonth;
          prorataCharge += pricePerSeat * prorataFraction;
        } else {
          fullMonthSeats++;
        }
      });

      const fullMonthCharge = fullMonthSeats * pricePerSeat;
      const totalCharge = fullMonthCharge + prorataCharge;

      const invoiceNumber = `INV-${billingMonth.replace('-', '')}-${domain.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6).toUpperCase()}`;

      await base44.asServiceRole.entities.Invoice.create({
        invoice_number: invoiceNumber,
        tenant_domain: domain,
        company_name: t.company?.name || domain,
        billing_month: billingMonth,
        seat_count: seatCount,
        price_per_seat: pricePerSeat,
        full_month_charge: fullMonthCharge,
        prorata_charge: prorataCharge,
        total_charge: totalCharge,
        status: 'draft',
        billing_contact_email: t.company?.billing_contact_email || null,
        generated_date: new Date().toISOString(),
      });

      results.push({ domain, status: 'created', totalCharge });
    }

    return Response.json({ billingMonth, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});