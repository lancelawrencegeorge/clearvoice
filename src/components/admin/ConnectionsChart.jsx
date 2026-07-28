import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Builds a 30-day timeline of daily active connections from session data.
 * An agent is counted as "active" on a given day if they have a session
 * whose login_at falls on that day.
 */
function buildDailyConnections(sessions, days = 30) {
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const buckets = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    buckets.push({
      date: d,
      key: `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`,
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      count: 0,
    });
  }

  const cutoff = buckets[0].date.getTime();
  const endOfToday = today.getTime();

  for (const s of sessions) {
    if (!s.login_at) continue;
    const t = new Date(s.login_at).getTime();
    if (t < cutoff || t > endOfToday) continue;
    const d = new Date(s.login_at);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const bucket = buckets.find((b) => b.key === key);
    if (bucket) bucket.count++;
  }

  return buckets;
}

export default function ConnectionsChart({ sessions }) {
  const data = useMemo(() => buildDailyConnections(sessions, 30), [sessions]);

  const peak = useMemo(
    () => Math.max(...data.map((d) => d.count), 0),
    [data]
  );

  const total = useMemo(
    () => data.reduce((sum, d) => sum + d.count, 0),
    [data]
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="w-5 h-5 text-primary" />
          Active Connections — Last 30 Days
        </CardTitle>
        <div className="flex items-center gap-4 text-sm">
          <div className="text-right">
            <p className="text-muted-foreground text-xs">Total Sessions</p>
            <p className="font-bold text-primary">{total}</p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground text-xs">Peak Day</p>
            <p className="font-bold">{peak}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="connGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              interval={Math.ceil(data.length / 6)}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              width={30}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
              formatter={(value) => [`${value} connection${value !== 1 ? "s" : ""}`, "Active"]}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#connGrad)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}