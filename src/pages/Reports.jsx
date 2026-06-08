import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Search, Users, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';

const ALLOWED_ROLES = ['admin', 'super_user', 'manager'];

export default function Reports() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [companies, setCompanies] = useState([]);
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCompany, setFilterCompany] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    Promise.all([
      base44.entities.Company.list(),
      base44.entities.User.list(),
      base44.entities.SessionLog.list('-session_start', 500),
    ]).then(([c, u, s]) => {
      setCompanies(c);
      // For managers, only show their own company
      const filteredUsers = user?.role === 'manager'
        ? u.filter(x => x.company_id === user.company_id)
        : u;
      setUsers(filteredUsers);
      setSessions(s);
      if (user?.role === 'manager') setFilterCompany(user.company_id || 'all');
      setLoading(false);
    });
  }, []);

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const agentUsers = users.filter(u => u.role === 'user');

  const enriched = agentUsers.map(u => {
    const userSessions = sessions.filter(s => s.user_id === u.id);
    const lastSession = userSessions.sort((a, b) => new Date(b.session_start) - new Date(a.session_start))[0];
    const sessionsThisMonth = userSessions.filter(s => s.session_start && new Date(s.session_start) > thirtyDaysAgo).length;
    const minutesThisMonth = userSessions
      .filter(s => s.session_start && new Date(s.session_start) > thirtyDaysAgo)
      .reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
    const isActiveRecently = u.last_active_date && new Date(u.last_active_date) > sevenDaysAgo;
    const company = companies.find(c => c.id === u.company_id);
    return { ...u, lastSession, sessionsThisMonth, minutesThisMonth: Math.round(minutesThisMonth), isActiveRecently, company };
  });

  const filtered = enriched.filter(u => {
    const matchSearch = search === '' ||
      (u.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase());
    const matchCompany = filterCompany === 'all' || u.company_id === filterCompany;
    const matchStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && u.isActiveRecently) ||
      (filterStatus === 'inactive' && !u.isActiveRecently) ||
      (filterStatus === 'never' && !u.last_active_date);
    return matchSearch && matchCompany && matchStatus;
  });

  const stats = {
    total: agentUsers.length,
    activeWeek: agentUsers.filter(u => u.last_active_date && new Date(u.last_active_date) > sevenDaysAgo).length,
    neverActive: agentUsers.filter(u => !u.last_active_date).length,
    inactive: agentUsers.filter(u => u.last_active_date && new Date(u.last_active_date) <= sevenDaysAgo).length,
  };

  if (user && !ALLOWED_ROLES.includes(user.role)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
          <h2 className="text-lg font-semibold">Access Denied</h2>
          <p className="text-muted-foreground text-sm mt-1">You don't have permission to view reports.</p>
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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Dashboard</Link>
          <h1 className="text-2xl font-bold mt-3">Agent Usage Report</h1>
          <p className="text-muted-foreground text-sm mt-1">See which agents are using ClearVoice and when they were last active.</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Agents', value: stats.total, icon: Users, color: '' },
            { label: 'Active (7d)', value: stats.activeWeek, icon: CheckCircle2, color: 'text-primary' },
            { label: 'Inactive (7d)', value: stats.inactive, icon: Clock, color: 'text-yellow-400' },
            { label: 'Never Used', value: stats.neverActive, icon: AlertCircle, color: 'text-destructive' },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="p-4 bg-card/80 border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
                  <Icon className={`w-4 h-4 ${color || 'text-muted-foreground'}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-xl font-bold">{value}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search agents..."
              className="pl-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {user?.role !== 'manager' && (
            <Select value={filterCompany} onValueChange={setFilterCompany}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All companies" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Companies</SelectItem>
                {companies.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active (7d)</SelectItem>
              <SelectItem value="inactive">Inactive (7d)</SelectItem>
              <SelectItem value="never">Never Used</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card className="bg-card/80 border-border/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-muted-foreground text-xs uppercase tracking-wider">
                  <th className="text-left px-5 py-3 font-medium">Agent</th>
                  {user?.role !== 'manager' && <th className="text-left px-5 py-3 font-medium">Company</th>}
                  <th className="text-left px-5 py-3 font-medium">Status</th>
                  <th className="text-left px-5 py-3 font-medium">Last Active</th>
                  <th className="text-right px-5 py-3 font-medium">Sessions (30d)</th>
                  <th className="text-right px-5 py-3 font-medium">Minutes (30d)</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-muted-foreground">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      No agents found.
                    </td>
                  </tr>
                ) : (
                  filtered.map(u => (
                    <tr key={u.id} className="border-b border-border/30 last:border-0 hover:bg-secondary/20 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-medium">{u.full_name || '—'}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                        {u.job_title && <p className="text-xs text-muted-foreground/60">{u.job_title}</p>}
                      </td>
                      {user?.role !== 'manager' && (
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Building2 className="w-3.5 h-3.5 shrink-0" />
                            <span className="text-sm">{u.company?.name || <span className="italic opacity-50">Unassigned</span>}</span>
                          </div>
                        </td>
                      )}
                      <td className="px-5 py-3.5">
                        {!u.last_active_date ? (
                          <Badge variant="outline" className="text-destructive border-destructive/30 bg-destructive/5 text-xs">Never Used</Badge>
                        ) : u.isActiveRecently ? (
                          <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5 text-xs">● Active</Badge>
                        ) : (
                          <Badge variant="outline" className="text-yellow-400 border-yellow-400/30 bg-yellow-400/5 text-xs">Inactive</Badge>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground text-sm">
                        {u.last_active_date
                          ? formatDistanceToNow(new Date(u.last_active_date), { addSuffix: true })
                          : <span className="italic opacity-50">—</span>}
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium">{u.sessionsThisMonth}</td>
                      <td className="px-5 py-3.5 text-right text-muted-foreground">{u.minutesThisMonth}m</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <p className="text-xs text-muted-foreground mt-4 text-right">{filtered.length} agents shown</p>
      </div>
    </div>
  );
}