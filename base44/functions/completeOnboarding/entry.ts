import { createClientFromRequest, createClient } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { agent_id, company_name, domain, billing_email } = body;

    if (!agent_id || !company_name || !domain) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Look up the agent record (service role — the Agent entity is app-managed).
    let agent;
    try {
      const agents = await base44.asServiceRole.entities.Agent.filter({ id: agent_id });
      agent = agents[0];
    } catch (_e) {
      // filter throws on invalid id — treat as not found
    }
    if (!agent) {
      return Response.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Security: the authenticated platform user must own this agent record
    // (matched by email) to prevent self-elevation of other people's accounts.
    if (!agent.email || agent.email.toLowerCase() !== (user.email || '').toLowerCase()) {
      return Response.json({ error: 'You can only complete your own onboarding' }, { status: 403 });
    }

    if (agent.onboarding_complete) {
      return Response.json({ error: 'Onboarding already complete' }, { status: 400 });
    }

    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + 14);

    // Create the company with service role (bypasses RLS that requires admin).
    const company = await base44.asServiceRole.entities.Company.create({
      name: company_name.trim(),
      domain: domain.toLowerCase().trim(),
      billing_contact_email: billing_email ? billing_email.trim() : null,
      plan: 'trial',
      trial_start_date: now.toISOString(),
      trial_end_date: trialEnd.toISOString(),
      seat_limit: 20,
      is_active: true,
    });

    // Elevate the agent to super_user and mark onboarding complete.
    const updated = await base44.asServiceRole.entities.Agent.update(agent_id, {
      role: 'super_user',
      company: company_name.trim(),
      tenant_domain: domain.toLowerCase().trim(),
      onboarding_complete: true,
    });

    // Auto-create a Tenant record in the Wayne Superagent app for domain isolation.
    // Non-blocking: tenant creation failure should not fail onboarding.
    try {
      const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
      const token = authHeader ? authHeader.replace(/^Bearer\s+/i, '') : null;

      if (token) {
        const wayneClient = createClient({
          appId: '69dfcacd77821fcbc01329c8',
          token,
        });

        const normalizedDomain = domain.toLowerCase().trim();
        const existingTenants = await wayneClient.entities.Tenant.filter({ primary_domain: normalizedDomain });

        if (existingTenants.length === 0) {
          const slug = company_name.trim().toLowerCase().replace(/\s+/g, '');
          await wayneClient.entities.Tenant.create({
            name: company_name.trim(),
            slug,
            primary_domain: normalizedDomain,
            status: 'active',
            region: 'sa',
            auth_provider: 'local',
            agent_count: 0,
            notes: `Auto-created on Super User onboarding. Super User: ${agent.email}`,
          });
        }
      }
    } catch (tenantError) {
      // Log but don't fail onboarding — tenant can be created manually if needed.
      console.error('Tenant auto-creation failed:', tenantError.message);
    }

    return Response.json({ company, agent: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});