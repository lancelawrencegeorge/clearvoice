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
                // Pre-create the Agent record so the invited user can log in
                // immediately — this app uses custom Agent-based auth (no
                // passwords), so creating the Agent record IS the invite.
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

                // Send branded invitation email. The built-in SendEmail can
                // only deliver to registered app users, so this may fail for
                // brand-new invitees — catch separately so the invite itself
                // still succeeds (the Agent record is created and they can
                // log in at /login with their email immediately).
                let emailSent = false;
                try {
                    await base44.asServiceRole.integrations.Core.SendEmail({
                        to: email,
                        from_name: 'ClearVoice',
                        subject: `You've been invited to join ${company.name} on ClearVoice`,
                        body: `Hi there,\n\nYou've been invited by ${requester.full_name || 'your company admin'} to join ${company.name} on the ClearVoice platform.\n\nGo to https://clearvoice.africa/login and sign in with your email (${email}) to get started.\n\nOnce logged in, you'll be able to use ClearVoice for real-time noise suppression.\n\nHave questions? Please reach out to your company admin — ${requester.full_name || 'Your ClearVoice admin'} or contact us at support@clearvoice.africa.\n\nBest,\nThe ClearVoice Team`
                    });
                    emailSent = true;
                } catch (_emailErr) {
                    // Built-in email can't send to unregistered users —
                    // the invite still succeeds; agent can log in at /login.
                }

                // Log this invite for admin audit trail
                await base44.asServiceRole.entities.InviteLog.create({
                    inviter_id: requester.id,
                    inviter_name: requester.full_name || '',
                    inviter_email: requester.email || '',
                    inviter_role: requester.role,
                    invitee_email: email,
                    invitee_role: role,
                    company_name: company.name,
                    tenant_domain: companyDomain || requester.tenant_domain || '',
                    sent_at: new Date().toISOString(),
                    status: 'sent',
                    failure_reason: emailSent ? null : 'Email not sent — invitee is not a registered user. Agent can log in at /login.',
                });

                succeeded.push({ email, role, email_sent: emailSent });
            } catch (err) {
                // Log the failure for admin audit trail
                try {
                    await base44.asServiceRole.entities.InviteLog.create({
                        inviter_id: requester.id,
                        inviter_name: requester.full_name || '',
                        inviter_email: requester.email || '',
                        inviter_role: requester.role,
                        invitee_email: email,
                        invitee_role: role,
                        company_name: company.name,
                        tenant_domain: companyDomain || requester.tenant_domain || '',
                        sent_at: new Date().toISOString(),
                        status: 'failed',
                        failure_reason: err?.message || 'Invite failed',
                    });
                } catch (_logErr) {
                    // don't let logging failure mask the original error
                }
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