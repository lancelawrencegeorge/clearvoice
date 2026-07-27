import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Loader2, ShieldCheck } from "lucide-react";
import { getCurrentAgent, setCurrentAgent } from "@/lib/customAuth";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const normalizedEmail = email.toLowerCase().trim();
      const response = await base44.functions.invoke("agentLogin", { email: normalizedEmail });
      const { agent, session_id } = response.data;
      setCurrentAgent(agent, session_id);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || "Something went wrong. Please try again.";
      setError(msg);
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
          <h2 className="text-xl font-semibold mb-2">Sign in</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Access is invite-only. Use your registered work email below.
          </p>
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSignIn} className="space-y-4">
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
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
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