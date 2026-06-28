import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Building2, ChevronDown, ChevronRight, Receipt } from 'lucide-react';
import { calculateTenantBilling, formatZAR, formatBillingPeriod } from '@/lib/billing';

const planBadge = (plan) => {
  const styles = {
    trial: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    paid: 'bg-primary/10 text-primary border-primary/20',
    suspended: 'bg-destructive/10 text-destructive border-destructive/20',
  };
  return styles[plan] || styles.trial;
};

export default function TenantBilling({ agents, companies, sessions }) {
  const [expanded, setExpanded] = useState({});

  // Group agents by tenant domain
  const tenantMap = {};
  agents.forEach((a) => {
    const t = a.tenant_domain || '(unassigned)';
    if (!tenantMap[t]) tenantMap[t] = { domain: t, agents: [], company: null };
    tenantMap[t].agents.push(a);
  });

  // Match companies to tenants by domain
  companies.forEach((c) => {
    const d = c.domain || '(unassigned)';
    if (tenantMap[d]) {
      tenantMap[d].company = c;
    } else {
      // Company with no agents yet — still show it for billing visibility
      tenantMap[d] = { domain: d, agents: [], company: c };
    }
  });

  const tenants = Object.values(tenantMap).sort((a, b) => {
    // Sort by total charge descending
    const ca = calculateTenantBilling(a.agents, a.company).totalCharge;
    const cb = calculateTenantBilling(b.agents, b.company).totalCharge;
    return cb - ca;
  });

  const refDate = new Date();
  const grandTotal = tenants.reduce((sum, t) => sum + calculateTenantBilling(t.agents, t.company).totalCharge, 0);
  const grandProrata = tenants.reduce((sum, t) => sum + calculateTenantBilling(t.agents, t.company).prorataCharge, 0);

  const toggle = (domain) => setExpanded((e) => ({ ...e, [domain]: !e[domain] }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" />
            Tenant Billing Breakdown
          </span>
          <span className="text-sm font-normal text-muted-foreground">{formatBillingPeriod(refDate)}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tenant</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead className="text-right">Seats</TableHead>
              <TableHead className="text-right">Per Seat</TableHead>
              <TableHead className="text-right">Full Month</TableHead>
              <TableHead className="text-right">Prorata</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No tenants yet.
                </TableCell>
              </TableRow>
            ) : (
              tenants.map((t) => {
                const b = calculateTenantBilling(t.agents, t.company, refDate);
                const isExpanded = expanded[t.domain];
                const hasProrata = b.prorataSeats.length > 0;
                return (
                  <React.Fragment key={t.domain}>
                    <TableRow
                      className={hasProrata ? 'cursor-pointer hover:bg-secondary/30' : ''}
                      onClick={hasProrata ? () => toggle(t.domain) : undefined}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {hasProrata && (
                            <span className="text-muted-foreground">
                              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                            </span>
                          )}
                          <div>
                            <div className="flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                              {t.company?.name || t.domain}
                            </div>
                            <span className="text-xs text-muted-foreground">@{t.domain}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${planBadge(b.plan)}`}>
                          {b.plan}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-bold">{b.seatCount}</span>
                        {b.seatLimit != null && (
                          <span className="text-xs text-muted-foreground"> / {b.seatLimit}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">{formatZAR(b.pricePerSeat)}</TableCell>
                      <TableCell className="text-right">{formatZAR(b.fullMonthCharge)}</TableCell>
                      <TableCell className="text-right">
                        {b.prorataCharge > 0 ? (
                          <span className="text-primary">{formatZAR(b.prorataCharge)}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                        {hasProrata && (
                          <span className="text-xs text-muted-foreground block">{b.prorataSeats.length} new</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-bold">{formatZAR(b.totalCharge)}</TableCell>
                    </TableRow>
                    {isExpanded && hasProrata && (
                      <TableRow className="bg-secondary/20">
                        <TableCell colSpan={7} className="py-3">
                          <div className="pl-8">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                              Prorata Agents (added this month)
                            </p>
                            <div className="space-y-1.5">
                              {b.prorataSeats.map((a) => (
                                <div key={a.id} className="flex items-center justify-between text-sm">
                                  <div>
                                    <span className="font-medium">{a.full_name || '—'}</span>
                                    <span className="text-muted-foreground ml-2">{a.email}</span>
                                  </div>
                                  <div className="flex items-center gap-4 text-muted-foreground">
                                    <span className="text-xs">{a.daysActive} days active</span>
                                    <span className="font-medium text-foreground">{formatZAR(a.prorataCharge)}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })
            )}
            <TableRow className="border-t-2 border-border/50">
              <TableCell colSpan={5} className="text-right font-semibold">
                Grand Total
              </TableCell>
              <TableCell className="text-right text-primary font-medium">{formatZAR(grandProrata)}</TableCell>
              <TableCell className="text-right font-bold text-lg">{formatZAR(grandTotal)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <p className="text-xs text-muted-foreground mt-3">
          Prices exclude VAT · prorata calculated for agents added during the current billing period · click a tenant row to see prorata breakdown.
        </p>
      </CardContent>
    </Card>
  );
}