import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Search, Users, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { getCurrentAgent } from '@/lib/customAuth';

export default function Reports() {
  const [agents, setAgents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterTenant, setFilterTenant] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const currentAgent = getCurrentAgent();

  const loadData = () => {
    setLoading(true);
    setError(null);
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out after 10 seconds')), 10000)
    );
    Promise.race([
      Promise.all([
        base44.entities.Agent.list('-created_date', 500),
        base44.entities.Session.list('-login_at', 500),
      ]),
      timeout,
    ]).then(([a, s]) => {
      const scoped = currentAgent?.tenant_domain
        ? a.filter(x => x.tenant_domain === currentAgent.tenant_domain)
        : a;
      setAgents(scoped);
      setSessions(s);
      setLoading(false);
    }).catch(err => {
      console.error('Reports data load failed:', err);
      setError(err.message || 'Failed to load data');
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const tenants = [...new Set(agents.map(a => a.tenant_domain).filter(Boolean))];

  const enriched = agents.map(a => {
    const userSessions = sessions.filter(s => s.agent_id === a.id);
    const lastSession = userSessions.sort((x, y) => new Date(y.login_at) - new Date(x.login_at))[0];
    const sessionsThisMonth = userSessions.filter(s => s.login_at && new Date(s.login_at) > thirtyDaysAgo).length;
    const minutesThisMonth = userSessions
      .filter(s => s.login_at && new Date(s.login_at) > thirtyDaysAgo)
      .reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
    const lastActive = a.last_login || lastSession?.login_at;
    const isActiveRecently = lastActive && new Date(lastActive) > sevenDaysAgo;
    return { ...a, lastSession, sessionsThisMonth, minutesThisMonth: Math.round(minutesThisMonth), lastActive, isActiveRecently };
  });

  const filtered = enriched.filter(a => {
    const matchSearch = search === '' ||
      (a.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.email || '').toLowerCase().includes(search.toLowerCase());
    const matchTenant = filterTenant === 'all' || a.tenant_domain === filterTenant;
    const matchStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && a.isActiveRecently) ||
      (filterStatus === 'inactive' && !a.isActiveRecently) ||
      (filterStatus === 'never' && !a.lastActive);
    return matchSearch && matchTenant && matchStatus;
  });

  const stats = {
    total: agents.length,
    activeWeek: enriched.filter(a => a.isActiveRecently).length,
    neverActive: enriched.filter(a => !a.lastActive).length,
    inactive: enriched.filter(a => a.lastActive && !a.isActiveRecently).length,
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
        <h2 className="text-lg font-semibold">Failed to Load Reports</h2>
        <p className="text-muted-foreground text-sm mt-1">{error}</p>
        <Button onClick={loadData} className="mt-4">Retry</Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-6 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">← Dashboard</Link>
          <h1 className="text-2xl font-bold mt-3">Agent Usage Report</h1>
          <p className="text-muted-foreground text-sm mt-1">See which agents are using ClearVoice and when they were last active.</p>
        </div>

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

        <Card className="bg-card/80 border-border/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-muted-foreground text-xs uppercase tracking-wider">
                  <th className="text-left px-5 py-3 font-medium">Agent</th>
                  <th className="text-left px-5 py-3 font-medium">Tenant</th>
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
                  filtered.map(a => (
                    <tr key={a.id} className="border-b border-border/30 last:border-0 hover:bg-secondary/20 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-medium">{a.full_name || '—'}</p>
                        <p className="text-xs text-muted-foreground">{a.email}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Building2 className="w-3.5 h-3.5 shrink-0" />
                          <span className="text-sm">{a.tenant_domain || '—'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {!a.lastActive ? (
                          <Badge variant="outline" className="text-destructive border-destructive/30 bg-destructive/5 text-xs">Never Used</Badge>
                        ) : a.isActiveRecently ? (
                          <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5 text-xs">● Active</Badge>
                        ) : (
                          <Badge variant="outline" className="text-yellow-400 border-yellow-400/30 bg-yellow-400/5 text-xs">Inactive</Badge>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground text-sm">
                        {a.lastActive
                          ? formatDistanceToNow(new Date(a.lastActive), { addSuffix: true })
                          : <span className="italic opacity-50">—</span>}
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium">{a.sessionsThisMonth}</td>
                      <td className="px-5 py-3.5 text-right text-muted-foreground">{a.minutesThisMonth}m</td>
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