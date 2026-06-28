import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Send, Loader2, AlertCircle, Receipt, CheckCircle, Sparkles } from "lucide-react";
import { getCurrentAgent } from "@/lib/customAuth";
import { formatZAR } from "@/lib/billing";

export default function Invoices() {
  const [currentAgent, setCurrentAgent] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [sendingId, setSendingId] = useState(null);
  const [sendingAll, setSendingAll] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");

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
    if (currentAgent?.role === "admin") {
      loadInvoices();
    } else {
      setLoading(false);
    }
  }, [currentAgent]);

  const loadInvoices = async () => {
    try {
      const data = await base44.entities.Invoice.list("-billing_month", 500);
      setInvoices(data);
    } catch (err) {
      console.error("Failed to load invoices:", err);
    } finally {
      setLoading(false);
    }
  };

  const monthOptions = useMemo(() => {
    const set = new Set();
    invoices.forEach((inv) => { if (inv.billing_month) set.add(inv.billing_month); });
    return Array.from(set).sort().reverse();
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    let result = invoices;
    if (statusFilter !== "all") result = result.filter((i) => i.status === statusFilter);
    if (monthFilter !== "all") result = result.filter((i) => i.billing_month === monthFilter);
    return result;
  }, [invoices, statusFilter, monthFilter]);

  const draftInvoices = useMemo(() => filteredInvoices.filter((i) => i.status === "draft"), [filteredInvoices]);
  const sentInvoices = useMemo(() => filteredInvoices.filter((i) => i.status === "sent"), [filteredInvoices]);
  const totalDraft = draftInvoices.reduce((s, i) => s + (i.total_charge || 0), 0);
  const totalSent = sentInvoices.reduce((s, i) => s + (i.total_charge || 0), 0);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await base44.functions.invoke("generateMonthlyInvoices", {});
      await loadInvoices();
    } catch (err) {
      console.error("Failed to generate invoices:", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleSend = async (invoiceId) => {
    setSendingId(invoiceId);
    try {
      await base44.functions.invoke("sendInvoice", { invoice_id: invoiceId });
      await loadInvoices();
    } catch (err) {
      console.error("Failed to send invoice:", err);
    } finally {
      setSendingId(null);
    }
  };

  const handleSendAllDrafts = async () => {
    setSendingAll(true);
    try {
      for (const inv of draftInvoices) {
        if (inv.billing_contact_email) {
          await base44.functions.invoke("sendInvoice", { invoice_id: inv.id });
        }
      }
      await loadInvoices();
    } catch (err) {
      console.error("Failed to send invoices:", err);
    } finally {
      setSendingAll(false);
    }
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
            <span className="font-bold text-lg">ClearVoice Invoicing</span>
          </div>
          <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to Admin
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
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">Invoicing</h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Invoices auto-generate on the 25th of each month. Review and send by month-end.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleGenerate} disabled={generating}>
                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Generate Now
                </Button>
                <Button size="sm" onClick={handleSendAllDrafts} disabled={sendingAll || draftInvoices.length === 0}>
                  {sendingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Send All Drafts ({draftInvoices.length})
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Drafts</p>
                      <p className="text-2xl font-bold">{draftInvoices.length}</p>
                      <p className="text-xs text-muted-foreground">{formatZAR(totalDraft)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Sent</p>
                      <p className="text-2xl font-bold">{sentInvoices.length}</p>
                      <p className="text-xs text-muted-foreground">{formatZAR(totalSent)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Receipt className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Billed</p>
                      <p className="text-2xl font-bold">{formatZAR(totalDraft + totalSent)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All months" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All months</SelectItem>
                  {monthOptions.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Month</TableHead>
                      <TableHead>Seats</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                          No invoices yet. Click "Generate Now" to create this month's invoices.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredInvoices.map((inv) => (
                        <TableRow key={inv.id}>
                          <TableCell className="font-mono text-sm">{inv.invoice_number}</TableCell>
                          <TableCell className="font-medium">{inv.company_name}</TableCell>
                          <TableCell>{inv.billing_month}</TableCell>
                          <TableCell>{inv.seat_count}</TableCell>
                          <TableCell className="font-medium">{formatZAR(inv.total_charge)}</TableCell>
                          <TableCell>
                            <Badge variant={inv.status === "sent" ? "default" : inv.status === "draft" ? "secondary" : "outline"}>
                              {inv.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {inv.sent_date ? new Date(inv.sent_date).toLocaleDateString('en-ZA') : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            {inv.status === "draft" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSend(inv.id)}
                                disabled={sendingId === inv.id || !inv.billing_contact_email}
                                title={!inv.billing_contact_email ? "No billing contact email on file" : ""}
                              >
                                {sendingId === inv.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                Send
                              </Button>
                            )}
                          </TableCell>
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