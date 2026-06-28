import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only admin or super_user can bulk invite
        if (!['admin', 'super_user'].includes(user.role)) {
            return Response.json({ error: 'Forbidden: Admin or super user access required' }, { status: 403 });
        }

        const body = await req.json();
        const { users, company_id } = body;

        if (!Array.isArray(users) || users.length === 0) {
            return Response.json({ error: 'No users provided' }, { status: 400 });
        }
        if (!company_id) {
            return Response.json({ error: 'Company ID is required' }, { status: 400 });
        }

        // Resolve the company (RLS scopes super_user to their own domain automatically)
        const companies = await base44.entities.Company.filter({ id: company_id });
        const company = companies[0];
        if (!company) {
            return Response.json({ error: 'Company not found' }, { status: 404 });
        }

        // Super_users can only invite into their own tenant
        if (user.role === 'super_user' && company.domain && user.domain !== company.domain) {
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
            if (user.role === 'super_user' && companyDomain) {
                const emailDomain = email.split('@')[1];
                if (emailDomain !== companyDomain) {
                    failed.push({ email, reason: `Email domain must be @${companyDomain}` });
                    continue;
                }
            }

            try {
                await base44.asServiceRole.users.inviteUser(email, role);
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