import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const body = await req.json();
        const { users, company_id, agent_id } = body;

        if (!Array.isArray(users) || users.length === 0) {
            return Response.json({ error: 'No users provided' }, { status: 400 });
        }
        if (!company_id) {
            return Response.json({ error: 'Company ID is required' }, { status: 400 });
        }
        if (!agent_id) {
            return Response.json({ error: 'Agent ID is required' }, { status: 400 });
        }

        // Identify the requester via the Agent entity (the app uses a custom
        // Agent-based auth model, not Base44's built-in User auth).
        let requester = null;
        try {
            const requesterAgents = await base44.asServiceRole.entities.Agent.filter({ id: agent_id });
            requester = requesterAgents[0];
        } catch (_e) {
            // filter throws on invalid id — treat as not found
        }
        if (!requester) {
            return Response.json({ error: 'Requester not found' }, { status: 403 });
        }
        if (!['admin', 'super_user'].includes(requester.role)) {
            return Response.json({ error: 'Forbidden: Admin or super user access required' }, { status: 403 });
        }

        // Resolve the company
        const companies = await base44.asServiceRole.entities.Company.filter({ id: company_id });
        const company = companies[0];
        if (!company) {
            return Response.json({ error: 'Company not found' }, { status: 404 });
        }

        // Super_users can only invite into their own tenant
        if (requester.role === 'super_user' && company.domain && requester.tenant_domain !== company.domain) {
            return Response.json({ error: 'You can only invite users to your own company' }, { status: 403 });
        }

        const allowedRoles = ['user', 'manager', 'super_user'];
        const companyDomain = company.domain ? company.domain.toLowerCase() : null;
        const succeeded = [];
        const failed = [];
        const validRoleForRole = (r) => (r && allowedRoles.includes(r) ? r : 'user');

        // Seat limit enforcement: count existing agents in this tenant
        const seatLimit = company.seat_limit ?? 20;
        if (companyDomain) {
            const existingAgents = await base44.asServiceRole.entities.Agent.filter({ tenant_domain: companyDomain });
            const activeAgents = existingAgents.filter(a => a.status !== 'Suspended');
            const validNewUsers = users.filter(u => {
                const email = (u.email || '').trim().toLowerCase();
                return email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
            });
            if (activeAgents.length + validNewUsers.length > seatLimit) {
                return Response.json({
                    error: `Seat limit reached. Your plan allows ${seatLimit} agents and you currently have ${activeAgents.length}. Remove or suspend agents before inviting more.`,
                }, { status: 403 });
            }
        }

        for (const entry of users) {
            const email = (entry.email || '').trim().toLowerCase();
            const role = validRoleForRole(entry.role);

            // Validate email
            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                failed.push({ email: email || '(empty)', reason: 'Invalid email address' });
                continue;
            }

            // Domain guard: emails must match the company domain (skip for platform admin)
            if (requester.role === 'super_user' && companyDomain) {
                const emailDomain = email.split('@')[1];
                if (emailDomain !== companyDomain) {
                    failed.push({ email, reason: `Email domain must be @${companyDomain}` });
                    continue;
                }
            }

            try {
                // Pre-create the Agent record so the invited user is counted in
                // billing immediately and can log in without registering.
                const existing = await base44.asServiceRole.entities.Agent.filter({ email });
                if (existing.length === 0) {
                    const namePart = email.split('@')[0];
                    const agentRole = role === 'super_user' ? 'super_user' : 'agent';
                    await base44.asServiceRole.entities.Agent.create({
                        full_name: namePart.charAt(0).toUpperCase() + namePart.slice(1),
                        email,
                        company: company.name,
                        tenant_domain: companyDomain,
                        role: agentRole,
                        status: 'Active',
                        onboarding_complete: false,
                    });
                }
                await base44.users.inviteUser(email, role);
                succeeded.push({ email, role });
            } catch (err) {
                failed.push({ email, reason: err?.message || 'Invite failed' });
            }
        }

        return Response.json({
            company: company.name,
            succeeded,
            failed,
            summary: {
                total: users.length,
                invited: succeeded.length,
                failed: failed.length,
            },
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});