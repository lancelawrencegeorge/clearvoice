export const STATUS_CONFIG = {
  healthy: {
    label: "Healthy",
    badge: "bg-green-500/15 text-green-400 border-green-500/30",
    dot: "bg-green-500",
  },
  warning: {
    label: "Warning",
    badge: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    dot: "bg-yellow-500",
  },
  incomplete: {
    label: "Incomplete",
    badge: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    dot: "bg-orange-500",
  },
  stale: {
    label: "Stale",
    badge: "bg-red-500/15 text-red-400 border-red-500/30",
    dot: "bg-red-500",
  },
  never_logged_in: {
    label: "Never Logged In",
    badge: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
    dot: "bg-zinc-500",
  },
};

export const STATUS_SORT_ORDER = {
  never_logged_in: 0,
  incomplete: 1,
  warning: 2,
  stale: 3,
  healthy: 4,
};

export const STATUS_FILTERS = [
  { value: "all", label: "All Statuses" },
  { value: "healthy", label: "Healthy" },
  { value: "warning", label: "Warning" },
  { value: "incomplete", label: "Incomplete" },
  { value: "stale", label: "Stale" },
  { value: "never_logged_in", label: "Never Logged In" },
];

const ISSUE = {
  no_suppression:
    "Noise suppression was off in last session — likely VB-Cable not configured correctly",
  no_sessions:
    "Agent has never logged in — onboarding may be incomplete or login credentials not shared",
  onboarding_incomplete:
    "Agent setup not completed — super user may not have finished registration",
  stale: "Agent hasn't logged in recently — may have left or stopped using the app",
};

/**
 * Compute the health status of a single agent based on their sessions.
 * @param {object} agent - Agent entity record
 * @param {object[]} allSessions - All Session records
 * @param {Date} now - Current time (for testability)
 */
export function computeAgentHealth(agent, allSessions, now = new Date()) {
  const agentSessions = allSessions
    .filter(
      (s) =>
        s.agent_id === agent.id ||
        (s.agent_email &&
          agent.email &&
          s.agent_email.toLowerCase() === agent.email.toLowerCase())
    )
    .sort((a, b) => new Date(b.login_at) - new Date(a.login_at));

  const hasSessions = agentSessions.length > 0;
  const lastSession = hasSessions ? agentSessions[0] : null;
  // A super_user or admin is considered onboarded by virtue of their role —
  // the onboarding_complete flag is only meaningful for ordinary agents whose
  // super user may not have finished registering them.
  const effectivelyOnboarded =
    agent.onboarding_complete === true ||
    agent.role === 'super_user' ||
    agent.role === 'admin';
  const createdDate = new Date(agent.created_date);
  const hoursSinceCreated = (now - createdDate) / (1000 * 60 * 60);
  const issues = [];

  // No sessions at all
  if (!hasSessions) {
    if (hoursSinceCreated > 24) {
      issues.push(ISSUE.no_sessions);
      return { status: "never_logged_in", issues, sessions: agentSessions, lastSession: null };
    }
    if (!effectivelyOnboarded) {
      issues.push(ISSUE.onboarding_incomplete);
      return { status: "incomplete", issues, sessions: agentSessions, lastSession: null };
    }
    // Onboarding complete, no sessions, but created < 24h — not stale enough
    issues.push(ISSUE.stale);
    return { status: "stale", issues, sessions: agentSessions, lastSession: null };
  }

  // Has sessions
  const daysSinceLastSession = (now - new Date(lastSession.login_at)) / (1000 * 60 * 60 * 24);

  // Edge case: sessions exist but onboarding incomplete
  if (!effectivelyOnboarded) {
    issues.push(ISSUE.onboarding_incomplete);
    if (lastSession.suppression_active === false) {
      issues.push(ISSUE.no_suppression);
    }
    return { status: "warning", issues, sessions: agentSessions, lastSession };
  }

  // Stale: onboarding complete but no recent session
  if (daysSinceLastSession > 14) {
    issues.push(ISSUE.stale);
    return { status: "stale", issues, sessions: agentSessions, lastSession };
  }

  // Warning: suppression was off in last session
  if (lastSession.suppression_active === false) {
    issues.push(ISSUE.no_suppression);
    return { status: "warning", issues, sessions: agentSessions, lastSession };
  }

  // All good
  return { status: "healthy", issues: [], sessions: agentSessions, lastSession };
}