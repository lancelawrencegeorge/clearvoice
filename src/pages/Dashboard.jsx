import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AudioLines, Power, Activity, Clock, Mail, Building, Loader2, AlertCircle, Mic, ShieldCheck, BarChart3, Users, LifeBuoy, UserPlus, Upload, Receipt, Volume2 } from "lucide-react";
import { Link } from "react-router-dom";
import { getCurrentAgent, getCurrentSessionId, clearAuth } from "@/lib/customAuth";
import { useAudioEngine } from "@/lib/useAudioEngine";

export default function Dashboard() {
  const navigate = useNavigate();
  const [agent, setAgent] = useState(null);
  const [loginTime, setLoginTime] = useState(null);
  const [sessionStartMs, setSessionStartMs] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [signingOut, setSigningOut] = useState(false);
  const { status, error, audioLevel, suppressionLevel, outputDevices, selectedOutputDevice, setSinkIdSupported, start, stop, changeSuppressionLevel, changeOutputDevice } = useAudioEngine();
  const suppressionActive = status === 'active' || status === 'connecting';
  const isConnecting = status === 'connecting';

  useEffect(() => {
    const a = getCurrentAgent();
    if (!a) {
      navigate("/", { replace: true });
      return;
    }
    setAgent(a);
    // Use the server-generated created_date as the login time — it's set by the
    // server in UTC and is more reliable than login_at (which is set by the
    // frontend clock and may be wrong). created_date is UTC but has no 'Z' suffix
    // and may carry microseconds, so we normalize before parsing.
    const parseServerUTC = (raw) => {
      if (!raw) return new Date();
      const base = raw.split('.')[0];
      return new Date(base + 'Z');
    };
    const sessionId = getCurrentSessionId();
    if (sessionId) {
      base44.entities.Session.get(sessionId).then((session) => {
        setLoginTime(parseServerUTC(session.created_date || session.login_at));
        setSessionStartMs(Date.now());
      }).catch(() => {
        setLoginTime(new Date());
        setSessionStartMs(Date.now());
      });
    } else {
      setLoginTime(new Date());
      setSessionStartMs(Date.now());
    }
    // Fetch latest agent data to ensure role is current
    base44.entities.Agent.get(a.id).then(async (fresh) => {
      setAgent(fresh);
      try {
        if (fresh.role === "super_user" && !fresh.onboarding_complete) {
          const companies = await base44.entities.Company.filter({ domain: fresh.tenant_domain });
          if (companies.length === 0) {
            navigate("/onboarding", { replace: true });
          }
        }
      } catch (e) {}
    }).catch(() => {});
  }, [navigate]);

  useEffect(() => {
    if (!sessionStartMs) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - sessionStartMs) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionStartMs]);

  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    const sessionId = getCurrentSessionId();
    if (sessionId && sessionStartMs) {
      const duration = Math.max(1, Math.round((Date.now() - sessionStartMs) / 60000));
      try {
        await base44.entities.Session.update(sessionId, {
          logout_at: new Date().toISOString(),
          duration_minutes: duration,
        });
      } catch (err) {
        console.error("Failed to update session:", err);
      }
    }
    stop();
    clearAuth();
    navigate("/", { replace: true });
  };

  if (!agent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
            <span className="font-bold text-lg">ClearVoice</span>
          </div>
          <div className="flex items-center gap-4">
            {(agent.role === "super_user" || agent.role === "admin") && (
              <nav className="flex items-center gap-1">
                <Link to="/invite" className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                  <UserPlus className="w-4 h-4" />
                  Invite
                </Link>
                <Link to="/bulk-import" className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                  <Upload className="w-4 h-4" />
                  Bulk Import
                </Link>
                {(agent.role === "admin" || agent.role === "super_user") && (
                  <Link to="/admin" className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                    <ShieldCheck className="w-4 h-4" />
                    Admin
                  </Link>
                )}
                {agent.role === "super_user" && (
                  <>
                    <Link to="/reports" className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                      <BarChart3 className="w-4 h-4" />
                      Reports
                    </Link>
                    <Link to="/users" className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                      <Users className="w-4 h-4" />
                      Users
                    </Link>
                    <Link to="/it-support" className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                      <LifeBuoy className="w-4 h-4" />
                      IT Support
                    </Link>
                  </>
                )}
                {agent.role === "admin" && (
                  <>
                    <Link to="/it-support" className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                      <LifeBuoy className="w-4 h-4" />
                      IT Support
                    </Link>
                    <Link to="/invoices" className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                      <Receipt className="w-4 h-4" />
                      Invoices
                    </Link>
                  </>
                )}
              </nav>
            )}
            <Button variant="outline" onClick={handleSignOut} disabled={signingOut}>
              <Power className="w-4 h-4 mr-2" />
              {signingOut ? "Signing out..." : "Sign Out"}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Welcome, {agent.full_name}</h1>
          <p className="text-muted-foreground mt-1">Your noise suppression session is ready.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Noise Suppression
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-6 rounded-xl bg-secondary/50">
                <div>
                  <p className="font-medium text-lg">
                    Suppression {isConnecting ? "Starting…" : suppressionActive ? "Active" : "Inactive"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {suppressionActive
                      ? "Filtering background noise in real-time"
                      : "Click to activate your microphone and start filtering"}
                  </p>
                </div>
                {suppressionActive ? (
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-primary animate-pulse-glow" />
                    <span className="text-sm font-medium text-primary">
                      {isConnecting ? "Connecting…" : "Live"}
                    </span>
                  </div>
                ) : (
                  <Button onClick={start} disabled={isConnecting}>
                    <Mic className="w-4 h-4 mr-2" />
                    Start Session
                  </Button>
                )}
              </div>
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium">Suppression Level</label>
                  <span className="text-sm text-muted-foreground">{suppressionLevel}%</span>
                </div>
                <Slider
                  value={[suppressionLevel]}
                  onValueChange={(v) => changeSuppressionLevel(v[0])}
                  max={100}
                  step={5}
                  disabled={!suppressionActive}
                />
              </div>

              {setSinkIdSupported && (
                <div className="mt-6">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Volume2 className="w-4 h-4" />
                    Output Device
                  </label>
                  <p className="text-xs text-muted-foreground mt-1 mb-2">
                    Select "CABLE Input" to route cleaned audio to Teams or Zoom via VB-Cable.
                  </p>
                  <Select
                    value={selectedOutputDevice}
                    onValueChange={changeOutputDevice}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default speakers</SelectItem>
                      {outputDevices.map((d) => (
                        <SelectItem key={d.deviceId} value={d.deviceId}>
                          {d.label || 'Unknown audio device'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {error && (
                <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {suppressionActive && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">Live Audio Level</label>
                    <span className="text-sm text-muted-foreground">{isConnecting ? 'Starting…' : 'Processing'}</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-75"
                      style={{ width: `${Math.min(100, audioLevel * 200)}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Session Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Session Duration</p>
                <p className="text-xl font-mono font-bold">{formatDuration(elapsed)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Login Time</p>
                <p className="text-sm">
                  {loginTime?.toLocaleString('en-ZA', {
                    timeZone: 'Africa/Johannesburg',
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="text-sm flex items-center gap-1.5 truncate">
                  <Mail className="w-3 h-3 shrink-0" />
                  {agent.email}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tenant</p>
                <p className="text-sm flex items-center gap-1.5">
                  <Building className="w-3 h-3 shrink-0" />
                  {agent.tenant_domain || "—"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}