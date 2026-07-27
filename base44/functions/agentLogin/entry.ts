import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { email } = body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const agents = await base44.asServiceRole.entities.Agent.filter({ email: normalizedEmail });

    if (agents.length === 0) {
      return Response.json({ error: 'No account found for this email. Access to ClearVoice is invite-only — please contact your administrator to be invited.' }, { status: 404 });
    }

    const agent = agents[0];

    if (agent.status === 'Suspended') {
      return Response.json({ error: 'This account has been suspended. Contact your super user.' }, { status: 403 });
    }

    // Update last_login and create session record
    const now = new Date().toISOString();
    await base44.asServiceRole.entities.Agent.update(agent.id, { last_login: now });

    const session = await base44.asServiceRole.entities.Session.create({
      agent_id: agent.id,
      agent_email: agent.email,
      agent_name: agent.full_name,
      tenant_domain: agent.tenant_domain,
      login_at: now,
      app_version: '1.0.0',
    });

    return Response.json({
      agent: {
        id: agent.id,
        email: agent.email,
        full_name: agent.full_name,
        role: agent.role,
        status: agent.status,
        tenant_domain: agent.tenant_domain,
        company: agent.company,
        onboarding_complete: agent.onboarding_complete,
        last_login: now,
      },
      session_id: session.id,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}