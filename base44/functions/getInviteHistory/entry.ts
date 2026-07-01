import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Admin-only: only the platform owner can view invite history
    if (!user || user.role !== 'admin') {
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

    // Group by inviter for a summary view
    const byInviter = {};
    for (const log of logs) {
      const key = log.inviter_email || log.inviter_id;
      if (!byInviter[key]) {
        byInviter[key] = {
          inviter_name: log.inviter_name,
          inviter_email: log.inviter_email,
          inviter_role: log.inviter_role,
          tenant_domain: log.tenant_domain,
          company_name: log.company_name,
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