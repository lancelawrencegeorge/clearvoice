import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  ShieldAlert,
  Activity,
  Users,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  ShieldCheck,
  Headset,
} from "lucide-react";
import { getCurrentAgent } from "@/lib/customAuth";
import AgentHealthTable from "@/components/admin/AgentHealthTable";
import ConnectionsChart from "@/components/admin/ConnectionsChart";
import {
  computeAgentHealth,
  STATUS_CONFIG,
  STATUS_SORT_ORDER,
  STATUS_FILTERS,
} from "@/lib/agentHealth";

function StatTile({ icon: Icon, label, value, color }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{label}</span>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
        <div className={`text-2xl font-bold mt-1 ${color}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

export default function AgentHealth() {
  const [currentAgent, setCurrentAgent] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [agents, setAgents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tenantFilter, setTenantFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [alertsOpen, setAlertsOpen] = useState(true);

  useEffect(() => {
    const cached = getCurrentAgent();
    if (!cached) {
      setAuthChecking(false);
      return;
    }
    base44.entities.Agent.get(cached.id)
      .then((fresh) => setCurrentAgent(fresh))
      .catch(() => setCurrentAgent(cached))
      .finally(() => setAuthChecking(false));
  }, []);

  useEffect(() => {
    if (currentAgent?.role !== "admin") return;
    const load = async () => {
      try {
        const [a, s, c] = await Promise.all([
          base44.entities.Agent.list("-created_date", 500),
          base44.entities.Session.list("-login_at", 500),
          base44.entities.Company.list(),
        ]);
        setAgents(a);
        setSessions(s);
        setCompanies(c);
      } catch (err) {
        console.error("Failed to load data:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentAgent]);

  const rows = useMemo(() => {
    return agents
      .map((agent) => ({
        agent,
        health: computeAgentHealth(agent, sessions),
      }))
      .sort(
        (a, b) =>
          STATUS_SORT_ORDER[a.health.status] - STATUS_SORT_ORDER[b.health.status]
      );
  }, [agents, sessions]);

  const tenantOptions = useMemo(() => {
    const set = new Set();
    agents.forEach((a) => {
      if (a.tenant_domain) set.add(a.tenant_domain);
    });
    return Array.from(set).sort();
  }, [agents]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (tenantFilter !== "all" && row.agent.tenant_domain !== tenantFilter)
        return false;
      if (statusFilter !== "all" && row.health.status !== statusFilter)
        return false;
      if (roleFilter !== "all" && row.agent.role !== roleFilter)
        return false;
      return true;
    });
  }, [rows, tenantFilter, statusFilter, roleFilter]);

  const stats = useMemo(() => {
    const s = {
      total: rows.length,
      healthy: 0,
      warning: 0,
      issues: 0,
      superUsers: 0,
      agents: 0,
    };
    rows.forEach((r) => {
      if (r.health.status === "healthy") s.healthy++;
      else if (r.health.status === "warning") s.warning++;
      else s.issues++;
      if (r.agent.role === "super_user") s.superUsers++;
      else if (r.agent.role === "agent") s.agents++;
    });
    return s;
  }, [rows]);

  const alertItems = useMemo(() => {
    return rows.filter(
      (r) =>
        r.health.status === "never_logged_in" || r.health.status === "warning"
    );
  }, [rows]);

  if (authChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (currentAgent?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <ShieldAlert className="w-12 h-12 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
            <p className="text-muted-foreground text-sm mb-4">
              This page is only accessible to platform administrators.
            </p>
            <Link to="/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Agent Health Monitor</h1>
          <p className="text-sm text-muted-foreground">
            Real-time setup &amp; readiness status for all registered agents across all
            tenants
          </p>
        </div>

        {/* Active Connections Chart */}
        {!loading && <ConnectionsChart sessions={sessions} />}

        {/* Alerts Panel */}
        {alertItems.length > 0 && (
          <Card className="border-destructive/40 bg-destructive/5">
            <button
              className="w-full flex items-center justify-between p-4"
              onClick={() => setAlertsOpen(!alertsOpen)}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <span className="font-semibold text-destructive">
                  {alertItems.length} agent{alertItems.length !== 1 ? "s" : ""} require
                  attention
                </span>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-destructive transition-transform ${
                  alertsOpen ? "" : "-rotate-90"
                }`}
              />
            </button>
            {alertsOpen && (
              <div className="px-4 pb-4 space-y-1">
                {alertItems.map((r) => (
                  <div
                    key={r.agent.id}
                    className="text-sm flex items-start gap-2"
                  >
                    <span className="text-destructive">•</span>
                    <span>
                      <span className="font-medium">
                        {r.agent.full_name || r.agent.email}
                      </span>
                      {" — "}
                      {r.health.issues[0]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Summary Tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatTile
            icon={Users}
            label="Total Accounts"
            value={stats.total}
            color="text-primary"
          />
          <StatTile
            icon={ShieldCheck}
            label="Super Users"
            value={stats.superUsers}
            color="text-blue-400"
          />
          <StatTile
            icon={Headset}
            label="Agents"
            value={stats.agents}
            color="text-primary"
          />
          <StatTile
            icon={CheckCircle}
            label="Healthy"
            value={stats.healthy}
            color="text-green-400"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={tenantFilter} onValueChange={setTenantFilter}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="Filter by tenant" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tenants</SelectItem>
              {tenantOptions.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTERS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="super_user">Super Users</SelectItem>
              <SelectItem value="agent">Agents</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No agents match the current filters.
          </div>
        ) : (
          <AgentHealthTable rows={filteredRows} companies={companies} />
        )}
      </div>
    </div>
  );
}