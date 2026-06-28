import { jsPDF } from 'jspdf';
import { calculateTenantBilling, formatZAR } from './billing';

const buildTenantRows = (agents, companies) => {
  const tenantMap = {};
  agents.forEach((a) => {
    const t = a.tenant_domain || '(unassigned)';
    if (!tenantMap[t]) tenantMap[t] = { domain: t, agents: [], company: null };
    tenantMap[t].agents.push(a);
  });
  companies.forEach((c) => {
    const d = c.domain || '(unassigned)';
    if (tenantMap[d]) {
      tenantMap[d].company = c;
    } else {
      tenantMap[d] = { domain: d, agents: [], company: c };
    }
  });
  return Object.values(tenantMap).map((t) => {
    const b = calculateTenantBilling(t.agents, t.company);
    return {
      domain: t.domain,
      companyName: t.company?.name || t.domain,
      plan: b.plan,
      seats: b.seatCount,
      pricePerSeat: b.pricePerSeat,
      fullMonth: b.fullMonthCharge,
      prorata: b.prorataCharge,
      total: b.totalCharge,
    };
  });
};

const formatDuration = (minutes) => {
  if (!minutes) return '0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

export const exportBillingPDF = ({ agents, companies, sessions, dateFrom, dateTo, tenantLabel }) => {
  const doc = new jsPDF();
  const rows = buildTenantRows(agents, companies);
  const grandTotal = rows.reduce((s, r) => s + r.total, 0);
  const totalDuration = sessions.reduce((s, x) => s + (x.duration_minutes || 0), 0);

  doc.setFontSize(18);
  doc.text('ClearVoice Billing Report', 14, 20);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Tenant: ${tenantLabel}`, 14, 28);
  const periodLabel = dateFrom || dateTo
    ? `Period: ${dateFrom || 'N/A'} to ${dateTo || 'N/A'}`
    : 'Period: All time';
  doc.text(periodLabel, 14, 34);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 40);
  doc.setTextColor(0);

  doc.setFontSize(14);
  doc.text('Billing Breakdown (Current Month)', 14, 52);
  doc.setFontSize(9);
  let y = 60;
  const colX = [14, 70, 92, 105, 130, 158, 185];
  const headers = ['Tenant', 'Plan', 'Seats', 'Per Seat', 'Full Month', 'Prorata', 'Total'];
  headers.forEach((h, i) => doc.text(h, colX[i], y));
  y += 5;
  doc.setDrawColor(200);
  doc.line(14, y - 2, 200, y - 2);

  rows.forEach((r) => {
    doc.text(r.companyName.substring(0, 25), colX[0], y);
    doc.text(String(r.plan), colX[1], y);
    doc.text(String(r.seats), colX[2], y);
    doc.text(formatZAR(r.pricePerSeat), colX[3], y);
    doc.text(formatZAR(r.fullMonth), colX[4], y);
    doc.text(r.prorata > 0 ? formatZAR(r.prorata) : '-', colX[5], y);
    doc.text(formatZAR(r.total), colX[6], y);
    y += 5;
    if (y > 270) { doc.addPage(); y = 20; }
  });

  y += 2;
  doc.setFont(undefined, 'bold');
  doc.text(`Grand Total: ${formatZAR(grandTotal)}`, 14, y);
  doc.setFont(undefined, 'normal');

  y += 14;
  doc.setFontSize(14);
  doc.text('Usage Summary', 14, y);
  y += 8;
  doc.setFontSize(10);
  doc.text(`Total Sessions: ${sessions.length}`, 14, y);
  y += 6;
  doc.text(`Total Usage: ${formatDuration(totalDuration)}`, 14, y);

  doc.save(`billing-report-${new Date().toISOString().split('T')[0]}.pdf`);
};

export const exportBillingCSV = ({ agents, companies, sessions, dateFrom, dateTo, tenantLabel }) => {
  const rows = buildTenantRows(agents, companies);
  const grandTotal = rows.reduce((s, r) => s + r.total, 0);
  const totalDuration = sessions.reduce((s, x) => s + (x.duration_minutes || 0), 0);
  const periodLabel = dateFrom || dateTo
    ? `${dateFrom || 'N/A'} to ${dateTo || 'N/A'}`
    : 'All time';

  const lines = [
    'ClearVoice Billing Report',
    `Tenant,${tenantLabel}`,
    `Period,${periodLabel}`,
    `Generated,${new Date().toLocaleString()}`,
    '',
    'Tenant,Plan,Seats,Per Seat (R),Full Month (R),Prorata (R),Total (R)',
    ...rows.map((r) =>
      `"${r.companyName}","${r.plan}",${r.seats},${r.pricePerSeat},${r.fullMonth.toFixed(2)},${r.prorata.toFixed(2)},${r.total.toFixed(2)}`
    ),
    `Grand Total,,,,,,${grandTotal.toFixed(2)}`,
    '',
    `Total Sessions,${sessions.length}`,
    `Total Usage (minutes),${totalDuration}`,
  ];

  const csv = lines.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `billing-report-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};