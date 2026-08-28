import { base44 } from "@/api/base44Client";

const AGENT_KEY = 'clearvoice_agent';
const SESSION_KEY = 'clearvoice_session';

/**
 * Mark the current session's noise suppression as active (idempotent — the
 * backend function never flips suppression_active back to false once true).
 * Best-effort: errors are swallowed so audio UI never blocks on this write.
 */
export const markSuppressionActive = async (sessionId, level) => {
  if (!sessionId) return;
  try {
    await base44.functions.invoke("updateSessionSuppression", {
      session_id: sessionId,
      mode: "active",
      suppression_level: level,
    });
  } catch (e) {
    /* best-effort */
  }
};

/**
 * Close out the current session: fills logout_at and duration_minutes on the
 * server. suppression_active is left as-is so the health warning only fires
 * when suppression was genuinely never turned on during the session.
 */
export const closeSession = async (sessionId) => {
  if (!sessionId) return;
  try {
    await base44.functions.invoke("updateSessionSuppression", {
      session_id: sessionId,
      mode: "close",
    });
  } catch (e) {
    /* best-effort */
  }
};

export const getCurrentAgent = () => {
  try {
    const raw = localStorage.getItem(AGENT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setCurrentAgent = (agent, sessionId) => {
  localStorage.setItem(AGENT_KEY, JSON.stringify(agent));
  if (sessionId) localStorage.setItem(SESSION_KEY, sessionId);
};

export const getCurrentSessionId = () => {
  return localStorage.getItem(SESSION_KEY);
};

export const clearAuth = () => {
  localStorage.removeItem(AGENT_KEY);
  localStorage.removeItem(SESSION_KEY);
};

export const getTenantDomain = (email) => {
  if (!email) return '';
  const parts = email.split('@');
  return parts.length > 1 ? parts[1] : '';
};