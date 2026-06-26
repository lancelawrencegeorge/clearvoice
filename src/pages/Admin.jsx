import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AudioLines, Users, Clock, Loader2, Activity } from "lucide-react";

export default function Admin() {
  const [sessions, setSessions] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <AudioLines className="w-5 h-5 text-primary-foreground" />
            </div>
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