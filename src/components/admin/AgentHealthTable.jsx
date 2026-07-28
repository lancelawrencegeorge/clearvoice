import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronDown, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { STATUS_CONFIG } from "@/lib/agentHealth";

function formatRelative(dateStr) {
  if (!dateStr) return "Never";
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return "—";
  }
}

function formatDuration(minutes) {
  if (minutes == null) return "—";
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center text-xs font-medium px-2 py-1 rounded-full border ${config.badge}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} mr-1.5`} />
      {config.label}
    </span>
  );
}

function TimelineItem({ label, value }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span>{value || "—"}</span>
    </div>
  );
}

function ExpandedDetail({ row }) {
  const { agent, health } = row;
  const firstLogin =
    health.sessions.length > 0
      ? health.sessions[health.sessions.length - 1].login_at
      : null;

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div>
        <h4 className="text-sm font-semibold mb-2">
          Sessions ({health.sessions.length})
        </h4>
        {health.sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No sessions recorded.</p>
        ) : (
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {health.sessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-2 text-xs py-1.5 border-b border-border/50"
              >
                <span className="text-muted-foreground">
                  {new Date(s.login_at).toLocaleString()}
                </span>
                <span className="text-muted-foreground">
                  {formatDuration(s.duration_minutes)}
                </span>
                <span>Suppression: {s.suppression_level ?? "—"}</span>
                <span className="text-muted-foreground">v{s.app_version || "?"}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div>
        <h4 className="text-sm font-semibold mb-2">Setup Timeline</h4>
        <div className="space-y-2">
          <TimelineItem
            label="Agent Created"
            value={
              agent.created_date
                ? new Date(agent.created_date).toLocaleString()
                : "—"
            }
          />
          <TimelineItem
            label="Onboarding Complete"
            value={agent.onboarding_complete ? "Yes" : "No"}
          />
          <TimelineItem
            label="First Login"
            value={firstLogin ? new Date(firstLogin).toLocaleString() : "Never"}
          />
          <TimelineItem
            label="Last Login"
            value={agent.last_login ? new Date(agent.last_login).toLocaleString() : "Never"}
          />
        </div>
        {health.issues.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold mb-1">Issues</h4>
            <ul className="space-y-1">
              {health.issues.map((issue, i) => (
                <li key={i} className="text-xs text-muted-foreground">
                  • {issue}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AgentHealthTable({ rows, companies }) {
  const [expandedId, setExpandedId] = useState(null);

  const companyMap = useMemo(() => {
    const m = {};
    companies.forEach((c) => {
      m[c.domain] = c;
    });
    return m;
  }, [companies]);

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-8"></TableHead>
            <TableHead>Agent Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Company / Tenant</TableHead>
            <TableHead>Setup Date</TableHead>
            <TableHead>Last Login</TableHead>
            <TableHead className="text-center">Sessions</TableHead>
            <TableHead>Suppression</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Issues</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const isExpanded = expandedId === row.agent.id;
            const company = companyMap[row.agent.tenant_domain];
            return (
              <React.Fragment key={row.agent.id}>
                <TableRow
                  className="cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : row.agent.id)}
                >
                  <TableCell className="w-8">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {row.agent.full_name || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.agent.email}
                  </TableCell>
                  <TableCell>
                    {row.agent.company || company?.name || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatRelative(row.agent.created_date)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatRelative(row.agent.last_login)}
                  </TableCell>
                  <TableCell className="text-center">
                    {row.health.sessions.length}
                  </TableCell>
                  <TableCell>
                    {row.health.lastSession ? (
                      row.health.lastSession.suppression_active ? (
                        <span className="text-green-400">✅ Active</span>
                      ) : (
                        <span className="text-yellow-400">⚠️ Off</span>
                      )
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={row.health.status} />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-xs">
                    {row.health.issues.length > 0
                      ? row.health.issues[0]
                      : "✓ No issues"}
                  </TableCell>
                </TableRow>
                {isExpanded && (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={10} className="bg-muted/30 p-4">
                      <ExpandedDetail row={row} />
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}