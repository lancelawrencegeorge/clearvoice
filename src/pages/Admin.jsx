import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, Loader2, Activity, Building2, AlertCircle } from "lucide-react";
import { getCurrentAgent } from "@/lib/customAuth";

export default function Admin() {
  const [currentAgent, setCurrentAgent] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    const cached = getCurrentAgent();
    if (!cached) {
      setAuthChecking(false);
      return;
    }
    setCurrentAgent(cached);
    base44.entities.Agent.get(cached.id)
      .then((fresh) => setCurrentAgent(fresh))
      .catch(() => {})
      .finally(() => setAuthChecking(false));
  }, []);

  useEffect(() => {
    if (currentAgent?.role === "admin" && !dataLoaded) {
      setDataLoaded(true);
      loadData();
    }
  }, [currentAgent, dataLoaded]);

  const loadData = async () => {
    try {
      const [s, a] = await Promise.all([
        base44.entities.Session.list("-login_at", 200),
        base44.entities.Agent.list("-created_date", 200),
      ]);
      setSessions(s);
      setAgents(a);
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString();
  };

  const formatDuration = (minutes) => {
    if (minutes == null) return "—";
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };

  const tenantStats = () => {
    const map = {};
    agents.forEach((a) => {
      const t = a.tenant_domain || "(unassigned)";
      if (!map[t]) map[t] = { tenant: t, total: 0, active: 0, suspended: 0, sessions: 0, minutes: 0 };
      map[t].total++;
      if (a.status === "Suspended") map[t].suspended++;
      else map[t].active++;
    });
    sessions.forEach((s) => {
      const t = s.tenant_domain || "(unassigned)";
      if (!map[t]) map[t] = { tenant: t, total: 0, active: 0, suspended: 0, sessions: 0, minutes: 0 };
      map[t].sessions++;
      map[t].minutes += s.duration_minutes || 0;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentAgent || currentAgent.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
          <h2 className="text-lg font-semibold">Access Denied</h2>
          <p className="text-muted-foreground text-sm mt-1">This area is restricted to the platform owner.</p>
          <Link to="/dashboard" className="text-primary text-sm mt-4 inline-block">← Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="https://media.base44.com/images/public/6a0fee336f48ec0bfb9b9279/ccdfa1a60_image.png"
              alt="ClearVoice"
              className="w-9 h-9 rounded-lg object-cover"
            />
            <span className="font-bold text-lg">ClearVoice Admin</span>
          </div>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            Back to app
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Agents</p>
                      <p className="text-2xl font-bold">{agents.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Activity className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Sessions</p>
                      <p className="text-2xl font-bold">{sessions.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Usage</p>
                      <p className="text-2xl font-bold">
                        {formatDuration(sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0))}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5 text-primary" /> Tenant Billing Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tenant</TableHead>
                      <TableHead className="text-right">Total Seats</TableHead>
                      <TableHead className="text-right">Active</TableHead>
                      <TableHead className="text-right">Suspended</TableHead>
                      <TableHead className="text-right">Sessions</TableHead>
                      <TableHead className="text-right">Usage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tenantStats().length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No tenants yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      tenantStats().map((t) => (
                        <TableRow key={t.tenant}>
                          <TableCell className="font-medium">{t.tenant}</TableCell>
                          <TableCell className="text-right font-bold">{t.total}</TableCell>
                          <TableCell className="text-right text-primary">{t.active}</TableCell>
                          <TableCell className="text-right text-destructive">{t.suspended}</TableCell>
                          <TableCell className="text-right">{t.sessions}</TableCell>
                          <TableCell className="text-right text-muted-foreground">{formatDuration(t.minutes)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Login</TableHead>
                      <TableHead>Logout</TableHead>
                      <TableHead>Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No sessions yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      sessions.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium">{s.agent_name || "—"}</TableCell>
                          <TableCell>{s.agent_email || "—"}</TableCell>
                          <TableCell>{s.tenant_domain || "—"}</TableCell>
                          <TableCell className="text-sm">{formatDate(s.login_at)}</TableCell>
                          <TableCell className="text-sm">{formatDate(s.logout_at)}</TableCell>
                          <TableCell>{formatDuration(s.duration_minutes)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Agents</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No agents yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      agents.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell className="font-medium">{a.full_name || "—"}</TableCell>
                          <TableCell>{a.email || "—"}</TableCell>
                          <TableCell>{a.company || "—"}</TableCell>
                          <TableCell>{a.tenant_domain || "—"}</TableCell>
                          <TableCell>
                            <Badge variant={a.status === "Active" ? "default" : "destructive"}>
                              {a.status || "Active"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{formatDate(a.last_login)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}