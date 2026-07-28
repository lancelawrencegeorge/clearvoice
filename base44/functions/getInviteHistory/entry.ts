import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Admin or super_user (tenant owner) can view invite history
    if (!user || (user.role !== 'admin' && user.role !== 'super_user')) {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Optional query params: tenant_domain filter, date range
    const url = new URL(req.url);
    const tenantDomain = url.searchParams.get('tenant_domain');
    const statusFilter = url.searchParams.get('status');

    const filter: any = {};
    if (tenantDomain) filter.tenant_domain = tenantDomain;
    if (statusFilter) filter.status = statusFilter;

    const logs = await base44.asServiceRole.entities.InviteLog.filter(filter, '-sent_at', 500);

    // Resolve each inviter's own company from the Company entity using
    // their tenant_domain — the InviteLog.company_name is the *target*
    // company agents were registered into (which may differ from the
    // inviter's own company when an admin registers agents across tenants).
    const allCompanies = await base44.asServiceRole.entities.Company.list('-created_date', 500);
    const companyByDomain = {};
    for (const c of allCompanies) {
      if (c.domain) companyByDomain[c.domain.toLowerCase()] = c;
    }

    // Group by inviter for a summary view
    const byInviter = {};
    for (const log of logs) {
      const key = log.inviter_email || log.inviter_id;
      if (!byInviter[key]) {
        // Prefer the inviter's own company (looked up by their tenant_domain),
        // falling back to the InviteLog's company_name if not found.
        const inviterCompany = log.tenant_domain
          ? companyByDomain[log.tenant_domain.toLowerCase()]
          : null;
        byInviter[key] = {
          inviter_name: log.inviter_name,
          inviter_email: log.inviter_email,
          inviter_role: log.inviter_role,
          tenant_domain: log.tenant_domain,
          company_name: inviterCompany?.name || log.company_name,
          total_sent: 0,
          total_failed: 0,
          invites: [],
        };
      }
      if (log.status === 'sent') byInviter[key].total_sent++;
      if (log.status === 'failed') byInviter[key].total_failed++;
      byInviter[key].invites.push({
        invitee_email: log.invitee_email,
        invitee_role: log.invitee_role,
        sent_at: log.sent_at,
        status: log.status,
        failure_reason: log.failure_reason || null,
      });
    }

    return Response.json({
      total_invites: logs.length,
      total_sent: logs.filter(l => l.status === 'sent').length,
      total_failed: logs.filter(l => l.status === 'failed').length,
      invitees_by_inviter: Object.values(byInviter),
      all_logs: logs,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});