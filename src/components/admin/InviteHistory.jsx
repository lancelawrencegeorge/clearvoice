import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Loader2, ChevronDown, ChevronRight, CheckCircle, XCircle } from "lucide-react";

export default function InviteHistory() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(new Set());

  const loadHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("getInviteHistory", {});
      setData(res.data);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to load invite history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const toggleExpand = (idx) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Mail className="w-5 h-5" /> Registration History</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Mail className="w-5 h-5" /> Registration History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={loadHistory}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  const groups = data?.invitees_by_inviter || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" /> Registration History
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          All agents registered by super users / tenants — {data?.total_sent || 0} registered, {data?.total_failed || 0} failed
        </p>
      </CardHeader>
      <CardContent>
        {groups.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No agents have been registered yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Registered By</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead className="text-center">Sent</TableHead>
                <TableHead className="text-center">Failed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map((g, idx) => (
                <React.Fragment key={idx}>
                  <TableRow
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => toggleExpand(idx)}
                  >
                    <TableCell>
                      {expanded.has(idx)
                        ? <ChevronDown className="w-4 h-4" />
                        : <ChevronRight className="w-4 h-4" />}
                    </TableCell>
                    <TableCell className="font-medium">
                      {g.inviter_name || "—"}
                      <div className="text-xs text-muted-foreground">{g.inviter_email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{g.inviter_role}</Badge>
                    </TableCell>
                    <TableCell>{g.company_name || "—"}</TableCell>
                    <TableCell>{g.tenant_domain || "—"}</TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center gap-1 text-green-500">
                        <CheckCircle className="w-3.5 h-3.5" /> {g.total_sent}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {g.total_failed > 0 ? (
                        <span className="inline-flex items-center gap-1 text-destructive">
                          <XCircle className="w-3.5 h-3.5" /> {g.total_failed}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                  </TableRow>
                  {expanded.has(idx) && (
                    <TableRow className="bg-muted/20">
                      <TableCell colSpan={7} className="p-0">
                        <div className="px-8 py-4">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Invitee Email</TableHead>
                                <TableHead>Assigned Role</TableHead>
                                <TableHead>Sent At</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {g.invites.map((inv, i) => (
                                <TableRow key={i}>
                                  <TableCell>{inv.invitee_email}</TableCell>
                                  <TableCell>
                                    <Badge variant="secondary">{inv.invitee_role}</Badge>
                                  </TableCell>
                                  <TableCell className="text-sm">{formatDate(inv.sent_at)}</TableCell>
                                  <TableCell>
                                    {inv.status === "sent" ? (
                                      <Badge variant="default" className="bg-green-600">Sent</Badge>
                                    ) : (
                                      <div>
                                        <Badge variant="destructive">Failed</Badge>
                                        {inv.failure_reason && (
                                          <span className="text-xs text-muted-foreground ml-2">{inv.failure_reason}</span>
                                        )}
                                      </div>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}