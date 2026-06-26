const AGENT_KEY = 'clearvoice_agent';
const SESSION_KEY = 'clearvoice_session';

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