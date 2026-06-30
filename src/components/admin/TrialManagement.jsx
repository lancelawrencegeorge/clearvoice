import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Loader2, CheckCircle2, CalendarClock, AlertTriangle, Ban } from 'lucide-react';

const planBadge = (plan, isActive) => {
  if (!isActive) return <Badge variant="destructive">Deactivated</Badge>;
  if (plan === 'paid') return <Badge className="bg-green-600 hover:bg-green-600">Paid</Badge>;
  if (plan === 'suspended') return <Badge variant="destructive">Suspended</Badge>;
  return <Badge variant="secondary">Trial</Badge>;
};

const daysUntil = (dateStr) => {
  if (!dateStr) return null;
  const ms = new Date(dateStr) - new Date();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
};

export default function TrialManagement({ companies, onActionComplete }) {
  const [dialog, setDialog] = useState(null); // { company, action }
  const [extendDate, setExtendDate] = useState('');
  const [busy, setBusy] = useState(false);

  const trialCompanies = companies;

  const openExtend = (company) => {
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 14);
    setExtendDate(defaultDate.toISOString().split('T')[0]);
    setDialog({ company, action: 'extend_trial' });
  };

  const openActivate = (company) => {
    setDialog({ company, action: 'activate_paid' });
  };

  const openDeactivate = (company) => {
    setDialog({ company, action: 'deactivate' });
  };

  const handleConfirm = async () => {
    if (!dialog) return;
    setBusy(true);
    try {
      const payload = { company_id: dialog.company.id, action: dialog.action };
      if (dialog.action === 'extend_trial') {
        payload.new_end_date = extendDate;
      }
      await base44.functions.invoke('manageTrial', payload);
      setDialog(null);
      if (onActionComplete) onActionComplete();
    } catch (err) {
      console.error('Failed to manage trial:', err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarClock className="w-5 h-5 text-primary" />
          Trial Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        {trialCompanies.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No companies found.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Trial Ends</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trialCompanies.map((c) => {
                const days = daysUntil(c.trial_end_date);
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-sm">{c.domain || '—'}</TableCell>
                    <TableCell>{planBadge(c.plan, c.is_active)}</TableCell>
                    <TableCell className="text-sm">
                      {c.trial_end_date
                        ? new Date(c.trial_end_date).toLocaleDateString('en-ZA')
                        : '—'}
                    </TableCell>
                    <TableCell>
                      {c.trial_expired ? (
                        <span className="flex items-center gap-1 text-sm text-destructive">
                          <AlertTriangle className="w-3.5 h-3.5" /> Suspended
                        </span>
                      ) : days != null && days <= 3 ? (
                        <span className="flex items-center gap-1 text-sm text-orange-500">
                          <AlertTriangle className="w-3.5 h-3.5" /> {days <= 0 ? 'Ends today' : `${days}d left`}
                        </span>
                      ) : days != null ? (
                        <span className="text-sm text-muted-foreground">{days}d left</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {c.is_active ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openExtend(c)}
                            >
                              Extend Trial
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => openActivate(c)}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Activate Paid
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => openDeactivate(c)}
                            >
                              <Ban className="w-3.5 h-3.5" /> Deactivate
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => openActivate(c)}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Reactivate
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <AlertDialog open={!!dialog} onOpenChange={(open) => !open && !busy && setDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dialog?.action === 'extend_trial'
                ? `Extend trial for ${dialog?.company?.name}?`
                : dialog?.action === 'activate_paid'
                  ? `Activate paid subscription for ${dialog?.company?.name}?`
                  : `Deactivate ${dialog?.company?.name}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dialog?.action === 'extend_trial' ? (
                <>
                  Select the new trial end date. The company will remain on the trial plan and all reminder flags will be reset.
                </>
              ) : dialog?.action === 'activate_paid' ? (
                <>
                  This will move the company to the <strong>paid</strong> plan at R95/seat/month and restore access immediately.
                </>
              ) : (
                <>
                  This will <strong>immediately suspend</strong> access for this company. All agents will be blocked from logging in. A deactivation email will be sent to the billing contact.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {dialog?.action === 'extend_trial' && (
            <div className="py-2">
              <label className="text-sm font-medium">New trial end date</label>
              <Input
                type="date"
                value={extendDate}
                onChange={(e) => setExtendDate(e.target.value)}
                className="mt-1"
              />
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={busy || (dialog?.action === 'extend_trial' && !extendDate)}
              className={dialog?.action === 'deactivate' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              {dialog?.action === 'deactivate' ? 'Deactivate' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}