import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Building2, Users, Activity, Clock, Plus, ChevronDown, ChevronRight, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

export default function BillingDashboard() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [newCompany, setNewCompany] = useState({ name: '', billing_contact_email: '', plan: 'trial', seat_limit: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      base44.entities.Company.list(),
      base44.entities.User.list(),
      base44.entities.SessionLog.list('-session_start', 500)
    ]).then(([c, u, s]) => {
      setCompanies(c);
      setUsers(u);
      setSessions(s);
      setLoading(false);
    });
  }, []);

  const planColors = {
    trial: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    starter: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    pro: 'bg-primary/10 text-primary border-primary/20',
    enterprise: 'bg-purple-500/10 text-purple-400 border-purple-500/20'
  };

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const getCompanyStats = (companyId) => {
    const companyUsers = users.filter(u => u.company_id === companyId);
    const companySessions = sessions.filter(s => s.company_id === companyId);
    const activeLast7 = companyUsers.filter(u =>
      u.last_active_date && new Date(u.last_active_date) > sevenDaysAgo
    ).length;
    const sessionsThisMonth = companySessions.filter(s =>
      s.session_start && new Date(s.session_start) > thirtyDaysAgo
    ).length;
    const totalMinutes = companySessions
      .filter(s => s.session_start && new Date(s.session_start) > thirtyDaysAgo)
      .reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
    return { companyUsers, activeLast7, sessionsThisMonth, totalMinutes: Math.round(totalMinutes) };
  };

  const handleAddCompany = async () => {
    if (!newCompany.name.trim()) return;
    setSaving(true);
    const created = await base44.entities.Company.create({
      ...newCompany,
      seat_limit: newCompany.seat_limit ? Number(newCompany.seat_limit) : undefined,
      is_active: true
    });
    setCompanies(prev => [...prev, created]);
    setNewCompany({ name: '', billing_contact_email: '', plan: 'trial', seat_limit: '' });
    setShowAddCompany(false);
    setSaving(false);
  };

  const filtered = companies.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalSeats = users.filter(u => u.role !== 'admin').length;
  const activeToday = users.filter(u =>
    u.last_active_date && new Date(u.last_active_date) > new Date(Date.now() - 24 * 60 * 60 * 1000)
  ).length;

  if (user && !['admin', 'super_user'].includes(user.role)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
          <h2 className="text-lg font-semibold">Access Denied</h2>
          <p className="text-muted-foreground text-sm mt-1">You need admin or super user access to view billing.</p>
          <Link to="/" className="text-primary text-sm mt-4 inline-block">← Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-6 sm:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Billing Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">Company seats & activity overview</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setShowAddCompany(true)}>
              <Building2 className="w-4 h-4" /> Add Company
            </Button>
            <Link to="/invite">
              <Button className="gap-2">
                <Plus className="w-4 h-4" /> Invite Agent
              </Button>
            </Link>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Companies', value: companies.length, icon: Building2 },
            { label: 'Total Seats', value: totalSeats, icon: Users },
            { label: 'Active Today', value: activeToday, icon: Activity },
            { label: 'Sessions (30d)', value: sessions.filter(s => new Date(s.session_start) > thirtyDaysAgo).length, icon: Clock }
          ].map(({ label, value, icon: Icon }) => (
            <Card key={label} className="p-4 bg-card/80 border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-xl font-bold">{value}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Search */}
        <Input
          placeholder="Search companies..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="mb-4"
        />

        {/* Company List */}
        <div className="space-y-3">
          {filtered.map(company => {
            const { companyUsers, activeLast7, sessionsThisMonth, totalMinutes } = getCompanyStats(company.id);
            const isExpanded = expanded[company.id];

            return (
              <Card key={company.id} className="bg-card/80 border-border/50 overflow-hidden">
                <button
                  className="w-full p-5 flex items-center gap-4 text-left hover:bg-secondary/30 transition-colors"
                  onClick={() => setExpanded(e => ({ ...e, [company.id]: !e[company.id] }))}
                >
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{company.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${planColors[company.plan] || planColors.trial}`}>
                        {company.plan}
                      </span>
                      {!company.is_active && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">inactive</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{company.billing_contact_email || 'No billing email'}</p>
                  </div>
                  <div className="flex items-center gap-6 text-right shrink-0">
                    <div>
                      <p className="text-lg font-bold">{companyUsers.length}</p>
                      <p className="text-xs text-muted-foreground">seats{company.seat_limit ? ` / ${company.seat_limit}` : ''}</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-primary">{activeLast7}</p>
                      <p className="text-xs text-muted-foreground">active 7d</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">{sessionsThisMonth}</p>
                      <p className="text-xs text-muted-foreground">sessions</p>
                    </div>
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-border/50 px-5 py-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Agents</p>
                    {companyUsers.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No agents assigned yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {companyUsers.map(user => {
                          const isRecentlyActive = user.last_active_date && new Date(user.last_active_date) > sevenDaysAgo;
                          return (
                            <div key={user.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                              <div>
                                <p className="text-sm font-medium">{user.full_name || user.email}</p>
                                <p className="text-xs text-muted-foreground">{user.email}</p>
                              </div>
                              <div className="text-right">
                                {user.last_active_date ? (
                                  <span className={`text-xs ${isRecentlyActive ? 'text-primary' : 'text-muted-foreground'}`}>
                                    {isRecentlyActive ? '● ' : ''}Active {formatDistanceToNow(new Date(user.last_active_date), { addSuffix: true })}
                                  </span>
                                ) : (
                                  <span className="text-xs text-muted-foreground">Never active</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {totalMinutes > 0 && (
                      <p className="text-xs text-muted-foreground mt-3">{totalMinutes} minutes filtered this month</p>
                    )}
                  </div>
                )}
              </Card>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No companies found.</p>
              <Link to="/invite" className="text-primary text-sm mt-2 inline-block">Add your first company →</Link>
            </div>
          )}
        </div>
      </div>

      {/* Add Company Dialog */}
      <Dialog open={showAddCompany} onOpenChange={setShowAddCompany}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Company</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Company Name *</Label>
              <Input placeholder="Acme Corp" value={newCompany.name} onChange={e => setNewCompany(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Billing Email</Label>
              <Input placeholder="billing@company.com" value={newCompany.billing_contact_email} onChange={e => setNewCompany(p => ({ ...p, billing_contact_email: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Plan</Label>
              <Select value={newCompany.plan} onValueChange={v => setNewCompany(p => ({ ...p, plan: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Seat Limit</Label>
              <Input type="number" placeholder="e.g. 10" value={newCompany.seat_limit} onChange={e => setNewCompany(p => ({ ...p, seat_limit: e.target.value }))} />
            </div>
            <Button className="w-full" onClick={handleAddCompany} disabled={saving || !newCompany.name.trim()}>
              {saving ? 'Creating...' : 'Create Company'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}