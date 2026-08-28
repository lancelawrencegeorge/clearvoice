import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

/**
 * Write the agent's suppression state back to their current Session record.
 *
 * Payload: { session_id: string, mode: 'active' | 'close', suppression_level?: number }
 *
 * - 'active': set suppression_active = true (idempotent — never flipped back to false)
 *             and suppression_level. Called when the noise engine first goes active.
 * - 'close':  set logout_at = now and duration_minutes = (now - login_at) / 60000.
 *             Called on logout / best-effort on tab close. suppression_active is
 *             left untouched so the health warning only fires when suppression
 *             was genuinely never turned on during the session.
 *
 * The caller must be the agent who owns the session (agent_email === user.email
 * or created_by_id === user.id). Updates run as service role so the record can
 * be written regardless of the user-scoped client's RLS.
 */
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { session_id, mode, suppression_level } = body || {};

    if (!session_id || typeof session_id !== 'string') {
      return Response.json({ error: 'session_id is required' }, { status: 400 });
    }
    if (mode !== 'active' && mode !== 'close') {
      return Response.json({ error: "mode must be 'active' or 'close'" }, { status: 400 });
    }

    // Fetch the session as service role, then verify ownership against the caller.
    const session = await base44.asServiceRole.entities.Session.get(session_id);
    if (!session) {
      return Response.json({ error: 'Session not found' }, { status: 404 });
    }

    const ownerEmail = session.agent_email?.toLowerCase();
    const callerEmail = user.email?.toLowerCase();
    const owns = (ownerEmail && callerEmail && ownerEmail === callerEmail) ||
                 session.created_by_id === user.id;
    if (!owns) {
      return Response.json({ error: 'Forbidden: session does not belong to caller' }, { status: 403 });
    }

    if (mode === 'active') {
      const update = { suppression_active: true };
      if (typeof suppression_level === 'number' && !Number.isNaN(suppression_level)) {
        update.suppression_level = Math.max(5, Math.min(95, suppression_level));
      }
      // Idempotent: only set true once. We never clear it back to false.
      await base44.asServiceRole.entities.Session.update(session_id, update);
      return Response.json({ ok: true, session_id, suppression_active: true });
    }

    // mode === 'close'
    const now = new Date();
    const loginAt = session.login_at ? new Date(session.login_at) : null;
    const duration_minutes = loginAt
      ? Math.max(0, Math.round((now - loginAt) / 60000))
      : null;

    const update = { logout_at: now.toISOString() };
    if (duration_minutes !== null) update.duration_minutes = duration_minutes;

    await base44.asServiceRole.entities.Session.update(session_id, update);
    return Response.json({ ok: true, session_id, logout_at: update.logout_at, duration_minutes });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}