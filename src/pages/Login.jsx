import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AudioLines, Mail, Loader2, User, Building, ArrowLeft, ShieldCheck } from "lucide-react";
import { getCurrentAgent, setCurrentAgent, getTenantDomain } from "@/lib/customAuth";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("email");



  const handleContinue = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const normalizedEmail = email.toLowerCase().trim();
      const agents = await base44.entities.Agent.filter({ email: normalizedEmail }, '-created_date', 1);
      if (agents.length > 0) {
        const agent = agents[0];
        if (agent.status === "Suspended") {
          setError("This account has been suspended. Contact your super user.");
          setLoading(false);
          return;
        }
        await base44.entities.Agent.update(agent.id, {
          last_login: new Date().toISOString(),
        });
        const session = await base44.entities.Session.create({
          agent_id: agent.id,
          agent_email: agent.email,
          agent_name: agent.full_name,
          tenant_domain: agent.tenant_domain,
          login_at: new Date().toISOString(),
          app_version: "1.0.0",
        });
        setCurrentAgent({ ...agent, last_login: new Date().toISOString() }, session.id);
        navigate("/dashboard", { replace: true });
      } else {
        setMode("register");
        setLoading(false);
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const normalizedEmail = email.toLowerCase().trim();
      const tenantDomain = getTenantDomain(normalizedEmail);
      const existing = await base44.entities.Agent.filter({ email: normalizedEmail }, '-created_date', 1);
      let agent;
      if (existing.length > 0) {
        agent = existing[0];
        await base44.entities.Agent.update(agent.id, {
          full_name: fullName || agent.full_name,
          company: company || agent.company,
          last_login: new Date().toISOString(),
        });
      } else {
        agent = await base44.entities.Agent.create({
          full_name: fullName,
          email: normalizedEmail,
          company,
          tenant_domain: tenantDomain,
          status: "Active",
          last_login: new Date().toISOString(),
        });
      }
      const session = await base44.entities.Session.create({
        agent_id: agent.id,
        agent_email: agent.email,
        agent_name: agent.full_name,
        tenant_domain: agent.tenant_domain,
        login_at: new Date().toISOString(),
        app_version: "1.0.0",
      });
      setCurrentAgent(agent, session.id);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <img
            src="https://media.base44.com/images/public/6a0fee336f48ec0bfb9b9279/ccdfa1a60_image.png"
            alt="ClearVoice"
            className="w-24 h-24 object-cover rounded-2xl mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold tracking-tight">ClearVoice</h1>
          <p className="text-muted-foreground mt-2">Zero-latency noise suppression</p>
          <p className="text-[11px] mt-4">
            A product of <span style={{ color: '#007A4D' }}>Contact Centre</span>{' '}
            <span style={{ color: '#FFB612', fontWeight: 700 }}>SA</span>
          </p>
        </div>

        <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
          {mode === "email" ? (
            <>
              <h2 className="text-xl font-semibold mb-2">Sign in</h2>
              <p className="text-sm text-muted-foreground mb-6">
                 Choose an option below.
               </p>
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}
              <form onSubmit={handleContinue} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      autoFocus
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  "Sign In — My account already exists"
                )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 font-medium"
                  disabled={loading || !email.trim()}
                  onClick={(e) => {
                    if (!email.trim()) { setError("Enter your email first."); return; }
                    handleRegister(e);
                  }}
                >
                  Register — New user
                </Button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold mb-2">Create your account</h2>
              <p className="text-sm text-muted-foreground mb-6">
                No account found for <span className="text-foreground font-medium">{email}</span>. Let's set you up.
              </p>
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      type="text"
                      autoFocus
                      placeholder="Jane Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-10 h-12"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="company"
                      type="text"
                      placeholder="Acme Inc."
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="pl-10 h-12"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create account"
                  )}
                </Button>
                <button
                  type="button"
                  onClick={() => { setMode("email"); setError(""); }}
                  className="w-full text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" />
                  Back
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          By continuing, you agree to our Terms of Service and{' '}
          <Link to="/privacy" className="text-primary hover:underline inline-flex items-center gap-0.5">
            <ShieldCheck className="w-3 h-3" />
            Privacy Policy
          </Link>.
        </p>
      </div>
    </div>
  );
}