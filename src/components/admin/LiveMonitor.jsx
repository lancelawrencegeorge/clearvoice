import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Wifi, MicOff, Mic, Clock } from "lucide-react";

function timeAgo(dateStr) {
  if (!dateStr) return "—";
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function LiveMonitor({ tenantFilter, agentRole, agentDomain }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    const load = async () => {
      try {
        const isSuperUser = agentRole === "super_user";
        const all = isSuperUser
          ? await base44.entities.Session.filter({ tenant_domain: agentDomain }, "-login_at", 500)
          : await base44.entities.Session.list("-login_at", 500);
        const cutoff = Date.now() - 8 * 60 * 60 * 1000;
        const online = all.filter(
          (s) => !s.logout_at && s.login_at && new Date(s.login_at).getTime() > cutoff
        );
        setSessions(online);
      } catch (e) {
        console.error("LiveMonitor load error:", e);
      } finally {
        setLoading(false);
      }
    };

    load();

    const unsubscribe = base44.entities.Session.subscribe((event) => {
      setSessions((prev) => {
        if (event.type === "delete") {
          return prev.filter((s) => s.id !== event.id);
        }
        const updated = event.data;
        const isOnline = !updated.logout_at;
        const exists = prev.some((s) => s.id === event.id);
        if (isOnline && exists) {
          return prev.map((s) => (s.id === event.id ? updated : s));
        }
        if (isOnline && !exists) {
          return [updated, ...prev];
        }
        if (!isOnline) {
          return prev.filter((s) => s.id !== event.id);
        }
        return prev;
      });
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const filtered = tenantFilter === "all"
    ? sessions
    : sessions.filter((s) => s.tenant_domain === tenantFilter);

  const activeCount = filtered.filter((s) => s.suppression_active).length;

  if (loading) {
    return (
      <Card>
        <CardContent className="py-10 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Wifi className="w-5 h-5 text-primary" />
            Live Monitor
          </span>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              {filtered.length} online
            </Badge>
            <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
              {activeCount} suppressing
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 text-sm">
            No agents currently online.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((s) => (
              <div
                key={s.id}
                className={`rounded-lg border p-4 transition-colors ${
                  s.suppression_active
                    ? "border-green-500/30 bg-green-500/5"
                    : "border-border bg-secondary/30"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{s.agent_name || "—"}</p>
                    <p className="text-xs text-muted-foreground font-mono truncate">{s.agent_email}</p>
                  </div>
                  <div className={`flex items-center gap-1.5 shrink-0 ml-2 ${s.suppression_active ? "text-green-400" : "text-muted-foreground"}`}>
                    {s.suppression_active ? (
                      <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse-glow" />
                    ) : (
                      <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/40" />
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{s.tenant_domain || "—"}</span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {timeAgo(s.login_at)}
                  </span>
                </div>
                <div className="mt-2 pt-2 border-t border-border/40">
                  {s.suppression_active ? (
                    <span className="flex items-center gap-1.5 text-xs text-green-400 font-medium">
                      <Mic className="w-3.5 h-3.5" />
                      Suppression active · {s.suppression_level ?? 70}%
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MicOff className="w-3.5 h-3.5" />
                      Suppression inactive
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}