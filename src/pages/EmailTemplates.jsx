import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check, Mail, Building2, Users, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import { getCurrentAgent } from "@/lib/customAuth";

const REGISTER_SUPER_USER_TEMPLATE = {
    subject: "You've been registered to manage [Company Name] on ClearVoice",
    body: `Hi there,

You've been appointed the Super User for [Company Name] on ClearVoice.

As Super User, you'll be responsible for:
• Managing your team's agents and accounts
• Assigning seats within your company's plan
• Setting up your company profile during onboarding

Getting started:
1. Go to clearvoice.africa/login and sign in with your work email — no password needed
2. Complete your company setup in the onboarding wizard
3. Register your agents and assign their seats

Your company has access to a 14-day free trial to get started.

Need help? Contact us at support@clearvoice.africa

Best,
The ClearVoice Team`
};

const REGISTER_AGENT_TEMPLATE = {
    subject: "You've been registered on ClearVoice",
    body: `Hi there,

You've been registered as an Agent for [Company Name] on ClearVoice.

What you'll do:
• Download and install the ClearVoice desktop app
• Use real-time noise suppression during calls
• Test your audio setup in your dashboard

Getting started:
1. Go to clearvoice.africa/login and sign in with your work email — no password needed
2. Follow the setup guide to configure your audio
3. Start taking clearer calls!

Need help? Ask your Super User at [Company Name] or contact us at support@clearvoice.africa

Best,
The ClearVoice Team`
};

export default function EmailTemplates() {
    const [currentAgent, setCurrentAgent] = useState(null);
    const [authChecking, setAuthChecking] = useState(true);
    const [copiedIndex, setCopiedIndex] = useState(null);

    useEffect(() => {
        const cached = getCurrentAgent();
        if (!cached) {
            setAuthChecking(false);
            return;
        }
        setCurrentAgent(cached);
        base44.entities.Agent.get(cached.id)
            .then((fresh) => setCurrentAgent(fresh))
            .catch(() => {})
            .finally(() => setAuthChecking(false));
    }, []);

    const templates = [
        { id: "super_user", title: "Super User Registration", icon: Building2, template: REGISTER_SUPER_USER_TEMPLATE },
        { id: "agent", title: "Agent Registration", icon: Users, template: REGISTER_AGENT_TEMPLATE },
    ];

    const formatEmail = (template) => {
        return `To: ________________________

Subject: ${template.subject}

${template.body}`;
    };

    const handleCopy = async (index) => {
        const text = formatEmail(templates[index].template);
        try {
            await navigator.clipboard.writeText(text);
            setCopiedIndex(index);
            setTimeout(() => setCopiedIndex(null), 2500);
        } catch {
            const ta = document.createElement("textarea");
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            document.body.removeChild(ta);
            setCopiedIndex(index);
            setTimeout(() => setCopiedIndex(null), 2500);
        }
    };

    if (authChecking) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!currentAgent || currentAgent.role !== "admin") {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
                    <h2 className="text-lg font-semibold">Access Denied</h2>
                    <p className="text-muted-foreground text-sm mt-1">Email templates are only available to platform owners.</p>
                    <Link to="/" className="text-primary text-sm mt-4 inline-block">← Back to app</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b border-border">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link to="/admin" className="text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <Mail className="w-5 h-5 text-primary" />
                        <span className="font-bold text-lg">Email Templates</span>
                    </div>
                    <div>
                        <Link to="/register" className="text-sm text-primary hover:underline">
                            Go to Register →
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
                <p className="text-muted-foreground text-sm">
                    These templates can be used when notifying users that they've been registered on your platform. Copy and paste into your email client,
                    replacing <code className="text-primary bg-primary/10 px-1.5 py-0.5 rounded text-xs">[Company Name]</code> with the actual company name before sending.
                </p>

                {templates.map((item, index) => (
                    <Card key={item.id} className="border-border/60">
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <item.icon className="w-4 h-4 text-primary" />
                                </div>
                                <CardTitle className="text-lg">{item.title}</CardTitle>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCopy(index)}
                                className="gap-2"
                            >
                                {copiedIndex === index ? (
                                    <><Check className="w-3.5 h-3.5 text-green-500" /> Copied</>
                                ) : (
                                    <><Copy className="w-3.5 h-3.5" /> Copy</>
                                )}
                            </Button>
                        </CardHeader>
                        <CardContent className="text-sm space-y-2">
                            <div className="flex gap-2">
                                <span className="text-muted-foreground shrink-0">Subject:</span>
                                <span className="font-medium">{item.template.subject}</span>
                            </div>
                            <pre className="bg-card border border-border rounded-lg p-4 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                                {item.template.body}
                            </pre>
                        </CardContent>
                    </Card>
                ))}
            </main>
        </div>
    );
}