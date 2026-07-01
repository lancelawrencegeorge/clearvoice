import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, Loader2, Activity, AlertCircle, Filter, Download, FileText, Calendar, Mail, Trash2 } from "lucide-react";
import { getCurrentAgent, getTenantDomain } from "@/lib/customAuth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TenantBilling from "@/components/admin/TenantBilling";
import LiveMonitor from "@/components/admin/LiveMonitor";
import TrialManagement from "@/components/admin/TrialManagement";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { exportBillingPDF, exportBillingCSV } from "@/lib/billingExport";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";

export default function Admin() {
  const [currentAgent, setCurrentAgent] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [agents, setAgents] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadedRole, setLoadedRole] = useState(null);
  const [tenantFilter, setTenantFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedSessions, setSelectedSessions] = useState(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  useEffect(() => {
    const cached = getCurrentAgent();
    if (!cached) {
      setAuthChecking(false);
      return;
    }
    // Only set currentAgent after fetching the fresh role from the server.
    // Setting it from the cached value first causes a race: loadData runs
    // with a potentially stale role, and if that (filtered) request resolves
    // after the corrected one, it overwrites the correct unfiltered data.
    base44.entities.Agent.get(cached.id)
      .then((fresh) => setCurrentAgent(fresh))
      .catch(() => setCurrentAgent(cached))
      .finally(() => setAuthChecking(false));
  }, []);

  useEffect(() => {
    if (["admin", "super_user"].includes(currentAgent?.role) && loadedRole !== currentAgent.role) {
      setLoadedRole(currentAgent.role);
      setLoading(true);
      loadData();
    }
  }, [currentAgent, loadedRole]);

  const loadData = async () => {
    try {
      const isSuperUser = currentAgent.role === "super_user";
      const domain = isSuperUser ? getTenantDomain(currentAgent.email) : null;
      const [s, a, c] = await Promise.all([
        isSuperUser
          ? base44.entities.Session.filter({ tenant_domain: domain }, "-login_at", 200)
          : base44.entities.Session.list("-login_at", 200),
        isSuperUser
          ? base44.entities.Agent.filter({ tenant_domain: domain }, "-created_date", 200)
          : base44.entities.Agent.list("-created_date", 200),
        isSuperUser
          ? base44.entities.Company.filter({ domain })
          : base44.entities.Company.list(),
      ]);
      setSessions(s);
      setAgents(a);
      setCompanies(c);
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

  const tenantOptions = useMemo(() => {
    const set = new Set();
    agents.forEach((a) => { if (a.tenant_domain) set.add(a.tenant_domain); });
    companies.forEach((c) => { if (c.domain) set.add(c.domain); });
    sessions.forEach((s) => { if (s.tenant_domain) set.add(s.tenant_domain); });
    return Array.from(set).sort();
  }, [agents, companies, sessions]);

  const filteredSessions = useMemo(() => {
    let result = sessions;
    if (tenantFilter !== "all") result = result.filter((s) => s.tenant_domain === tenantFilter);
    if (dateFrom) {
      const from = new Date(dateFrom + "T00:00:00");
      result = result.filter((s) => new Date(s.login_at) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo + "T23:59:59");
      result = result.filter((s) => new Date(s.login_at) <= to);
    }
    return result;
  }, [sessions, tenantFilter, dateFrom, dateTo]);
  const filteredAgents = useMemo(() =>
    tenantFilter === "all" ? agents : agents.filter((a) => a.tenant_domain === tenantFilter),
    [agents, tenantFilter]
  );
  const filteredCompanies = useMemo(() =>
    tenantFilter === "all" ? companies : companies.filter((c) => c.domain === tenantFilter),
    [companies, tenantFilter]
  );

  const tenantLabel = tenantFilter === "all" ? "All Tenants" : tenantFilter;

  const handleExportPDF = () => {
    exportBillingPDF({
      agents: filteredAgents,
      companies: filteredCompanies,
      sessions: filteredSessions,
      dateFrom,
      dateTo,
      tenantLabel,
    });
  };

  const handleExportCSV = () => {
    exportBillingCSV({
      agents: filteredAgents,
      companies: filteredCompanies,
      sessions: filteredSessions,
      dateFrom,
      dateTo,
      tenantLabel,
    });
  };

  const handleDeleteSession = async () => {
    if (!sessionToDelete) return;
    setDeleting(true);
    try {
      await base44.entities.Session.delete(sessionToDelete.id);
      setSessions((prev) => prev.filter((s) => s.id !== sessionToDelete.id));
      setSessionToDelete(null);
    } catch (err) {
      console.error("Failed to delete session:", err);
    } finally {
      setDeleting(false);
    }
  };

  const toggleSessionSelection = (id) => {
    setSelectedSessions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedSessions((prev) => {
      if (prev.size === filteredSessions.length) return new Set();
      return new Set(filteredSessions.map((s) => s.id));
    });
  };

  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    try {
      const ids = Array.from(selectedSessions);
      await base44.entities.Session.deleteMany({ id: { $in: ids } });
      setSessions((prev) => prev.filter((s) => !selectedSessions.has(s.id)));
      setSelectedSessions(new Set());
      setBulkDeleteOpen(false);
    } catch (err) {
      console.error("Failed to delete sessions:", err);
    } finally {
      setBulkDeleting(false);
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentAgent || !["admin", "super_user"].includes(currentAgent.role)) {
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
          <div className="flex items-center gap-4">
            {currentAgent?.role === "admin" && (
              <Link to="/email-templates" className="text-sm text-primary hover:underline flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" /> Email Templates
              </Link>
            )}
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
              Back to app
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex flex-wrap items-center gap-3">
              {currentAgent?.role === "admin" && tenantOptions.length > 0 && (
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <Select value={tenantFilter} onValueChange={setTenantFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="All tenants" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All tenants</SelectItem>
                      {tenantOptions.map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" />
                <span className="text-muted-foreground text-sm">to</span>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" />
              </div>
              <div className="flex items-center gap-2 ml-auto">
                {currentAgent?.role === "admin" && selectedSessions.size > 0 && (
                  <Button variant="destructive" size="sm" onClick={() => setBulkDeleteOpen(true)}>
                    <Trash2 className="w-4 h-4" /> Delete ({selectedSessions.size})
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={handleExportPDF}>
                  <FileText className="w-4 h-4" /> PDF
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportCSV}>
                  <Download className="w-4 h-4" /> CSV
                </Button>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Agents</p>
                      <p className="text-2xl font-bold">{filteredAgents.length}</p>
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
                      <p className="text-2xl font-bold">{filteredSessions.length}</p>
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
                        {formatDuration(filteredSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0))}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <LiveMonitor tenantFilter={tenantFilter} agentRole={currentAgent?.role} agentDomain={currentAgent ? getTenantDomain(currentAgent.email) : null} />

            {currentAgent?.role === 'admin' && (
              <TrialManagement companies={filteredCompanies} onActionComplete={loadData} />
            )}

            {currentAgent?.role === 'admin' && (
              <TenantBilling agents={filteredAgents} companies={filteredCompanies} sessions={filteredSessions} />
            )}

            <Card>
              <CardHeader>
                <CardTitle>Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      {currentAgent?.role === "admin" && (
                        <TableHead className="w-12">
                          <Checkbox
                            checked={filteredSessions.length > 0 && selectedSessions.size === filteredSessions.length}
                            onCheckedChange={toggleSelectAll}
                          />
                        </TableHead>
                      )}
                      <TableHead>Agent</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Login</TableHead>
                      <TableHead>Logout</TableHead>
                      <TableHead>Duration</TableHead>
                      {currentAgent?.role === "admin" && <TableHead className="w-10"></TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSessions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={currentAgent?.role === "admin" ? 8 : 7} className="text-center text-muted-foreground py-8">
                          No sessions yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSessions.map((s) => (
                        <TableRow key={s.id}>
                          {currentAgent?.role === "admin" && (
                            <TableCell>
                              <Checkbox
                                checked={selectedSessions.has(s.id)}
                                onCheckedChange={() => toggleSessionSelection(s.id)}
                              />
                            </TableCell>
                          )}
                          <TableCell className="font-medium">{s.agent_name || "—"}</TableCell>
                          <TableCell>{s.agent_email || "—"}</TableCell>
                          <TableCell>{s.tenant_domain || "—"}</TableCell>
                          <TableCell className="text-sm">{formatDate(s.login_at)}</TableCell>
                          <TableCell className="text-sm">{formatDate(s.logout_at)}</TableCell>
                          <TableCell>{formatDuration(s.duration_minutes)}</TableCell>
                          {currentAgent?.role === "admin" && (
                            <TableCell>
                              <Button variant="ghost" size="icon" onClick={() => setSessionToDelete(s)}>
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </TableCell>
                          )}
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
                    {filteredAgents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No agents yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAgents.map((a) => (
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

      <AlertDialog open={!!sessionToDelete} onOpenChange={(open) => !open && setSessionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the session for {sessionToDelete?.agent_name || "this agent"} ({sessionToDelete?.agent_email || ""}). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSession}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteOpen} onOpenChange={(open) => !open && setBulkDeleteOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedSessions.size} session{selectedSessions.size === 1 ? "" : "s"}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedSessions.size} session{selectedSessions.size === 1 ? "" : "s"}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {bulkDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete All"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}