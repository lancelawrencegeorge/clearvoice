import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { Activity, Clock, Users, TrendingUp, Zap, AlertCircle } from 'lucide-react';
import { subDays, format, startOfDay, eachDayOfInterval } from 'date-fns';
import { Link } from 'react-router-dom';

const ALLOWED_ROLES = ['admin', 'super_user', 'manager'];

const COLORS = ['hsl(185,80%,55%)', 'hsl(160,60%,45%)', 'hsl(30,80%,55%)', 'hsl(280,65%,60%)', 'hsl(340,75%,55%)'];

export default function Analytics() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [range, setRange] = useState('30');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.SessionLog.list('-session_start', 1000),
      base44.entities.User.list(),
      base44.entities.Company.list(),
    ]).then(([s, u, c]) => {
      setSessions(s);
      setUsers(u);
      setCompanies(c);
      setLoading(false);
    });
  }, []);

  const days = parseInt(range);
  const cutoff = subDays(new Date(), days);

  const filtered = useMemo(() =>
    sessions.filter(s => s.session_start && new Date(s.session_start) > cutoff),
    [sessions, range]
  );

  // Manager: filter to own company
  const companyFiltered = useMemo(() => {
    if (user?.role === 'manager') return filtered.filter(s => s.company_id === user.company_id);
    return filtered;
  }, [filtered, user]);

  // Daily session counts + minutes for area chart
  const dailyData = useMemo(() => {
    const dateRange = eachDayOfInterval({ start: cutoff, end: new Date() });
    return dateRange.map(day => {
      const dayStr = format(day, 'MMM d');
      const daySessions = companyFiltered.filter(s =>
        format(new Date(s.session_start), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
      );
      return {
        date: dayStr,
        sessions: daySessions.length,
        minutes: Math.round(daySessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0)),
      };
    });
  }, [companyFiltered, range]);

  // Usage by company (admin/super_user only)
  const companyUsage = useMemo(() => {
    return companies.map(c => ({
      name: c.name.length > 12 ? c.name.slice(0, 12) + '…' : c.name,
      sessions: companyFiltered.filter(s => s.company_id === c.id).length,
      minutes: Math.round(companyFiltered.filter(s => s.company_id === c.id)
        .reduce((sum, s) => sum + (s.duration_minutes || 0), 0)),
    })).filter(c => c.sessions > 0).sort((a, b) => b.sessions - a.sessions).slice(0, 8);
  }, [companyFiltered, companies]);

  // Suppression level distribution
  const suppressionDist = useMemo(() => {
    const buckets = { '0–30': 0, '31–60': 0, '61–80': 0, '81–100': 0 };
    companyFiltered.forEach(s => {
      const lvl = s.suppression_level || 70;
      if (lvl <= 30) buckets['0–30']++;
      else if (lvl <= 60) buckets['31–60']++;
      else if (lvl <= 80) buckets['61–80']++;
      else buckets['81–100']++;
    });
    return Object.entries(buckets).map(([name, value]) => ({ name, value })).filter(b => b.value > 0);
  }, [companyFiltered]);

  // Top agents by usage
  const topAgents = useMemo(() => {
    const agentMap = {};
    companyFiltered.forEach(s => {
      if (!agentMap[s.user_id]) agentMap[s.user_id] = { email: s.user_email, sessions: 0, minutes: 0 };
      agentMap[s.user_id].sessions++;
      agentMap[s.user_id].minutes += s.duration_minutes || 0;
    });
    return Object.values(agentMap).sort((a, b) => b.minutes - a.minutes).slice(0, 5).map(a => ({
      ...a, minutes: Math.round(a.minutes)
    }));
  }, [companyFiltered]);

  const totalSessions = companyFiltered.length;
  const totalMinutes = Math.round(companyFiltered.reduce((sum, s) => sum + (s.duration_minutes || 0), 0));
  const avgDuration = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0;
  const uniqueUsers = new Set(companyFiltered.map(s => s.user_id)).size;
  const totalAgents = user?.role === 'manager'
    ? users.filter(u => u.role === 'user' && u.company_id === user.company_id).length
    : users.filter(u => u.role === 'user').length;
  const adoptionRate = totalAgents > 0 ? Math.round((uniqueUsers / totalAgents) * 100) : 0;

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-card border border-border rounded-lg p-3 text-xs shadow-lg">
        <p className="font-medium mb-1">{label}</p>
        {payload.map(p => (
          <p key={p.name} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
        ))}
      </div>
    );
  };

  if (user && !ALLOWED_ROLES.includes(user.role)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
          <h2 className="text-lg font-semibold">Access Denied</h2>
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Dashboard</Link>
            <h1 className="text-2xl font-bold mt-3">Analytics</h1>
            <p className="text-muted-foreground text-sm mt-1">Overall usage, activity trends and adoption insights.</p>
          </div>
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Sessions', value: totalSessions, icon: Activity, color: 'text-primary' },
            { label: 'Total Minutes', value: `${totalMinutes}m`, icon: Clock, color: 'text-primary' },
            { label: 'Avg Duration', value: `${avgDuration}m`, icon: TrendingUp, color: 'text-yellow-400' },
            { label: 'Adoption Rate', value: `${adoptionRate}%`, icon: Zap, color: adoptionRate >= 70 ? 'text-primary' : 'text-yellow-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="p-4 bg-card/80 border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-xl font-bold">{value}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Daily Sessions Area Chart */}
        <Card className="p-5 bg-card/80 border-border/50 mb-6">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Daily Sessions & Minutes</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={dailyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="sessionGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(185,80%,55%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(185,80%,55%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="minuteGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(160,60%,45%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(160,60%,45%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,18%)" />
              <XAxis dataKey="date" tick={{ fill: 'hsl(215,15%,50%)', fontSize: 11 }} tickLine={false} axisLine={false}
                interval={Math.floor(dailyData.length / 6)} />
              <YAxis tick={{ fill: 'hsl(215,15%,50%)', fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="sessions" name="Sessions" stroke="hsl(185,80%,55%)" fill="url(#sessionGrad)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="minutes" name="Minutes" stroke="hsl(160,60%,45%)" fill="url(#minuteGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Company usage bar chart (admin only) */}
          {user?.role !== 'manager' && (
            <Card className="p-5 bg-card/80 border-border/50">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Sessions by Company</h2>
              {companyUsage.length === 0 ? (
                <p className="text-muted-foreground text-sm py-8 text-center">No data for this period.</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={companyUsage} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,18%)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: 'hsl(215,15%,50%)', fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: 'hsl(215,15%,50%)', fontSize: 11 }} tickLine={false} axisLine={false} width={80} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="sessions" name="Sessions" fill="hsl(185,80%,55%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          )}

          {/* Suppression level distribution */}
          <Card className="p-5 bg-card/80 border-border/50">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Suppression Level Distribution</h2>
            {suppressionDist.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">No data for this period.</p>
            ) : (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="50%" height={180}>
                  <PieChart>
                    <Pie data={suppressionDist} cx="50%" cy="50%" innerRadius={50} outerRadius={75}
                      dataKey="value" paddingAngle={3}>
                      {suppressionDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {suppressionDist.map((b, i) => (
                    <div key={b.name} className="flex items-center gap-2 text-sm">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-muted-foreground">{b.name}%</span>
                      <span className="font-medium ml-auto pl-4">{b.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Top agents */}
        <Card className="p-5 bg-card/80 border-border/50">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Top Agents by Usage</h2>
          {topAgents.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">No sessions recorded in this period.</p>
          ) : (
            <div className="space-y-3">
              {topAgents.map((a, i) => (
                <div key={a.email} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{a.email}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${(a.minutes / (topAgents[0]?.minutes || 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold">{a.minutes}m</p>
                    <p className="text-xs text-muted-foreground">{a.sessions} sessions</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}