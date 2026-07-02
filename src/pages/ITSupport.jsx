import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Power, Loader2, FileText, Download, FileCheck, Monitor, ListChecks, Wrench, Trash2, ArrowLeft, ExternalLink, CheckCircle2, Headphones, ArrowRight, Mic, AudioLines, User, Info } from "lucide-react";
import { getCurrentAgent, clearAuth } from "@/lib/customAuth";

const PDF_URL = "https://base44.app/api/apps/69dfcacd77821fcbc01329c8/files/mp/public/69dfcacd77821fcbc01329c8/fa779b224_ClearVoice_IT_Deployment_Guide.pdf";

export default function ITSupport() {
  const navigate = useNavigate();
  const [agent, setAgent] = useState(null);
  const [checking, setChecking] = useState(true);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    const a = getCurrentAgent();
    if (!a) {
      navigate("/", { replace: true });
      return;
    }
    base44.entities.Agent.get(a.id).then((fresh) => {
      if (fresh.role !== "admin" && fresh.role !== "super_user") {
        setDenied(true);
      }
      setAgent(fresh);
      setChecking(false);
    }).catch(() => {
      setDenied(true);
      setChecking(false);
    });
  }, [navigate]);

  const handleSignOut = () => {
    clearAuth();
    navigate("/", { replace: true });
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (denied) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-lg font-semibold mb-2">Access Denied</p>
            <p className="text-sm text-muted-foreground mb-4">
              The IT Support page is restricted to administrators and IT managers.
            </p>
            <Link to="/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="https://media.base44.com/images/public/6a0fee336f48ec0bfb9b9279/ccdfa1a60_image.png"
              alt="ClearVoice"
              className="w-9 h-9 rounded-lg object-cover"
            />
            <span className="font-bold text-lg">ClearVoice</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Dashboard
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <Power className="w-4 h-4 mr-1.5" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            IT Support & Deployment Guide
          </h1>
          <p className="text-muted-foreground mt-1">
            Everything needed to deploy ClearVoice with VB-Cable virtual audio routing.
          </p>
        </div>

        <Card className="mb-6 border-primary/30 bg-primary/5">
          <CardContent className="py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/15 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Full Deployment Guide (PDF)</p>
                <p className="text-sm text-muted-foreground">Download the complete printable guide for distribution.</p>
              </div>
            </div>
            <a href={PDF_URL} target="_blank" rel="noopener noreferrer">
              <Button size="lg">
                <Download className="w-4 h-4 mr-2" />
                Download PDF Guide
              </Button>
            </a>
          </CardContent>
        </Card>

        {/* Desktop vs Web App Comparison */}
        <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-5 space-y-3 mb-6">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-400 shrink-0" />
            <h3 className="text-sm font-semibold">Desktop App vs Web App (Browser)</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-border rounded-lg p-4 space-y-1.5">
              <p className="font-medium text-sm text-foreground">🖥️ Desktop App</p>
              <ul className="list-disc list-inside space-y-0.5 text-xs text-muted-foreground">
                <li>Standalone window that can't be accidentally closed</li>
                <li>Auto-updates via installer</li>
                <li>System tray icon for quick access</li>
                <li>Requires admin rights to install</li>
              </ul>
            </div>
            <div className="border border-border rounded-lg p-4 space-y-1.5">
              <p className="font-medium text-sm text-foreground">🌐 Web App (Browser)</p>
              <ul className="list-disc list-inside space-y-0.5 text-xs text-muted-foreground">
                <li>Zero installation — just open a browser tab</li>
                <li>Works on locked-down / BYOD machines with no admin rights</li>
                <li>Agent must manually keep the browser tab open</li>
                <li>VB-Cable driver still required for full feature parity</li>
              </ul>
            </div>
          </div>
        </div>

        <Accordion type="single" collapsible defaultValue="files" className="space-y-3">

          {/* Files Required (Desktop App only — Web App needs no download) */}

          <Card>
            <AccordionItem value="files" className="border-b-0 px-4">
              <AccordionTrigger className="text-base font-semibold">
                <span className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-primary" />
                  Files Required
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground mb-4">Download both files before starting the installation. <span className="text-blue-400">Note: The Web App (Browser) path requires no downloads — just a bookmark to clearvoice.africa.</span></p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>File</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Download</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">ClearVoice Installer</TableCell>
                      <TableCell className="text-muted-foreground">Desktop application installer (Windows)</TableCell>
                      <TableCell>
                        <a href="https://github.com/lancelawrencegeorge/clearvoice/releases/download/V1.1.1/ClearVoice.Setup.1.1.1.exe" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1 text-sm">
                          Download <ExternalLink className="w-3 h-3" />
                        </a>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">VB-Cable Driver</TableCell>
                      <TableCell className="text-muted-foreground">Virtual audio cable driver for routing mic output</TableCell>
                      <TableCell>
                        <a href="https://vb-audio.com/Cable/index.htm" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1 text-sm">
                          Download <ExternalLink className="w-3 h-3" />
                        </a>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </AccordionContent>
            </AccordionItem>
          </Card>

          {/* System Requirements */}
          <Card>
            <AccordionItem value="requirements" className="border-b-0 px-4">
              <AccordionTrigger className="text-base font-semibold">
                <span className="flex items-center gap-2">
                  <Monitor className="w-5 h-5 text-primary" />
                  System Requirements
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" /> <span><strong>OS:</strong> Windows 10 or Windows 11 (64-bit)</span></li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" /> <span><strong>RAM:</strong> Minimum 4 GB (8 GB recommended)</span></li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" /> <span><strong>Internet:</strong> Required for initial login and license validation</span></li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" /> <span><strong>Admin Rights:</strong> Required to install VB-Cable driver and the ClearVoice desktop app</span></li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" /> <span><strong>Softphone:</strong> OmniVoice (or compatible softphone) must be installed for audio routing configuration</span></li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" /> <span><strong>Microphone:</strong> Working microphone or headset</span></li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Card>

          {/* Account & Role Flow */}
          <Card>
            <AccordionItem value="roles" className="border-b-0 px-4">
              <AccordionTrigger className="text-base font-semibold">
                <span className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Account &amp; Role Flow
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 text-sm">
                  <p className="text-muted-foreground">How accounts are created across the ClearVoice system:</p>
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <div className="border border-primary/30 bg-primary/5 rounded-lg p-3">
                      <p className="font-semibold text-primary text-xs mb-1">Platform Owner (Admin)</p>
                      <p className="text-xs text-muted-foreground">Invites Super Users. Manages billing, plans, seat limits &amp; invoices. Full tenant visibility.</p>
                    </div>
                    <div className="border border-border rounded-lg p-3">
                      <p className="font-semibold text-xs mb-1">Super User (Client Admin)</p>
                      <p className="text-xs text-muted-foreground">Invited → registers. Onboards company (sets domain). Invites agents individually or bulk CSV.</p>
                    </div>
                    <div className="border border-border rounded-lg p-3">
                      <p className="font-semibold text-xs mb-1">Agent</p>
                      <p className="text-xs text-muted-foreground">Invited → registers. Or bulk imported (record exists, sets password on first login). Installs ClearVoice + driver.</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">💡 Agents always log in with email + password. Bulk-imported agents skip registration — their account already exists.</p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Card>

          {/* Step-by-step install */}
          <Card>
            <AccordionItem value="install" className="border-b-0 px-4">
              <AccordionTrigger className="text-base font-semibold">
                <span className="flex items-center gap-2">
                  <ListChecks className="w-5 h-5 text-primary" />
                  Step-by-Step Installation Guide
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-5">
                  <div>
                    <p className="font-medium mb-2 text-primary">1. Install ClearVoice</p>
                    <ul className="space-y-1.5 text-sm text-muted-foreground list-disc pl-5">
                      <li>Run the ClearVoice installer as Administrator (right-click → Run as administrator).</li>
                      <li>Follow the setup wizard and accept the default installation path.</li>
                      <li>Launch ClearVoice and sign in with your agent credentials.</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium mb-2 text-primary">2. Install VB-Cable</p>
                    <ul className="space-y-1.5 text-sm text-muted-foreground list-disc pl-5">
                      <li>Download and extract VB-Cable <strong>2ch (standard) version</strong> from <strong>vb-audio.com/Cable/</strong> — only install this version, not any "16ch" variant.</li>
                      <li>Right-click <code className="px-1 py-0.5 rounded bg-secondary text-xs">VBCABLE_Setup_x64.exe</code> and select <strong>Run as administrator</strong>.</li>
                      <li>Click <strong>Install Driver</strong> and wait for confirmation.</li>
                    </ul>
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs space-y-1.5 mt-2">
                      <p className="font-medium text-amber-500">⚠️ Identifying the correct VB-Cable devices</p>
                      <p className="text-muted-foreground">After installation you'll see <strong>two active devices</strong> in Windows Sound settings:</p>
                      <ul className="list-none space-y-1 text-muted-foreground">
                        <li>🎧 <strong>Playback</strong> tab → "CABLE Input (VB-Audio Virtual Cable)" — ClearVoice routes cleaned audio here</li>
                        <li>🎤 <strong>Recording</strong> tab → "CABLE Output (VB-Audio Virtual Cable)" — select this as your softphone microphone</li>
                      </ul>
                      <p className="text-muted-foreground">You may also see <strong>"CABLE In 16ch (VB-Audio Virtual Cable)"</strong> or similar extra entries — these are leftover driver artifacts and are <strong>disabled by default. Ignore them entirely.</strong> Always select the standard "(VB-Audio Virtual Cable)" devices, never the "16ch" variants.</p>
                      <p className="text-muted-foreground">If incorrect devices appear, <strong>uninstall VB-Cable entirely</strong> via the setup tool, reboot, and reinstall the standard (2ch) version only.</p>
                    </div>
                  </div>
                  <div>
                    <p className="font-medium mb-2 text-primary">3. Reboot</p>
                    <ul className="space-y-1.5 text-sm text-muted-foreground list-disc pl-5">
                      <li>Restart the computer after VB-Cable installation for the driver to take effect.</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium mb-2 text-primary">4. Configure OmniVoice Audio</p>
                    <ul className="space-y-1.5 text-sm text-muted-foreground list-disc pl-5">
                      <li>Open OmniVoice softphone settings → Audio Devices.</li>
                      <li>Set <strong>Microphone</strong> to <strong>CABLE Output (VB-Audio Virtual Cable)</strong>.</li>
                      <li>Set <strong>Speaker</strong> to your headset or speakers as normal.</li>
                      <li>In ClearVoice, set the output device to <strong>CABLE Input</strong> so the denoised audio feeds into OmniVoice.</li>
                    </ul>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Card>

          {/* Web App (Browser) Installation */}
          <Card>
            <AccordionItem value="webapp" className="border-b-0 px-4">
              <AccordionTrigger className="text-base font-semibold">
                <span className="flex items-center gap-2">
                  <ExternalLink className="w-5 h-5 text-primary" />
                  Web App (Browser) — No Installation Required
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    ClearVoice works entirely in a browser tab with no installation. Ideal for locked-down or BYOD machines where agents can't install software.
                  </p>
                  <div>
                    <p className="font-medium mb-2 text-primary">Steps</p>
                    <ol className="space-y-1.5 text-sm text-muted-foreground list-decimal pl-5">
                      <li>Open a browser and go to <a href="https://clearvoice.africa" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">clearvoice.africa</a></li>
                      <li>Sign in with work email (no password needed)</li>
                      <li>Click <strong>"Start Session"</strong> and grant microphone access when prompted</li>
                      <li>Keep the browser tab open for the entire shift — unlike the desktop app's standalone window, a browser tab can be accidentally closed, so treat it like an active call window and don't close it mid-shift</li>
                      <li>For full dual-channel suppression (using the <strong>Customer Noise Filter</strong> toggle to also filter the other caller's audio), the same <strong>VB-Cable</strong> (Windows) / <strong>BlackHole</strong> (Mac) virtual audio driver is still required — this is a one-time OS-level driver install, completely independent of whether you use the desktop app or a plain browser tab</li>
                      <li>Set the softphone's microphone to <strong>"CABLE Output"</strong> exactly as documented in the Desktop App steps above — that part of the setup is identical either way</li>
                    </ol>
                    <p className="mt-2 text-amber-500 text-xs">⚠️ The browser tab is the suppression engine — closing it stops filtering immediately.</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Card>

          {/* Verification */}
          <Card>
            <AccordionItem value="verify" className="border-b-0 px-4">
              <AccordionTrigger className="text-base font-semibold">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  Verification Steps
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground mb-3">Confirm the virtual cable is installed correctly:</p>
                <ol className="space-y-2 text-sm list-decimal pl-5">
                  <li>Open <strong>Start → Settings → System → Sound</strong>.</li>
                  <li>Scroll to <strong>Input</strong> and click <strong>Choose a device for speaking or recording</strong>.</li>
                  <li>Verify <strong>CABLE Output (VB-Audio Virtual Cable)</strong> appears in the list.</li>
                  <li>Open <strong>Sound Control Panel</strong> → <strong>Recording</strong> tab and confirm CABLE Output is listed and enabled.</li>
                  <li>Check the <strong>Playback</strong> tab for <strong>CABLE Input</strong>.</li>
                  <li>Speak into the mic — the ClearVoice level meter should respond, and OmniVoice should receive clean audio.</li>
                </ol>
              </AccordionContent>
            </AccordionItem>
          </Card>

          {/* Audio Setup for Headset Users */}
          <Card>
            <AccordionItem value="headset" className="border-b-0 px-4">
              <AccordionTrigger className="text-base font-semibold">
                <span className="flex items-center gap-2">
                  <Headphones className="w-5 h-5 text-primary" />
                  Audio Setup for Headset Users
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-5">
                  <div>
                    <p className="font-medium mb-2 text-primary">How the Audio Chain Works</p>
                    <p className="text-sm text-muted-foreground">
                      Your physical microphone captures your voice → ClearVoice applies real-time noise suppression → the cleaned audio is sent to <strong>CABLE Output</strong> (a virtual microphone) → OmniVoice picks up that virtual mic → the customer hears clean, noise-free audio.
                    </p>
                  </div>

                  <div>
                    <p className="font-medium mb-3 text-primary">Audio Flow Diagram</p>
                    <div className="flex flex-wrap items-center gap-2 p-4 rounded-xl bg-secondary/50">
                      <div className="flex flex-col items-center gap-1.5 min-w-[90px]">
                        <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
                          <Mic className="w-5 h-5 text-primary" />
                        </div>
                        <span className="text-xs text-center font-medium">Physical Headset Mic</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      <div className="flex flex-col items-center gap-1.5 min-w-[90px]">
                        <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
                          <AudioLines className="w-5 h-5 text-primary" />
                        </div>
                        <span className="text-xs text-center font-medium">ClearVoice</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      <div className="flex flex-col items-center gap-1.5 min-w-[90px]">
                        <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
                          <FileCheck className="w-5 h-5 text-primary" />
                        </div>
                        <span className="text-xs text-center font-medium">CABLE Output</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      <div className="flex flex-col items-center gap-1.5 min-w-[90px]">
                        <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
                          <Headphones className="w-5 h-5 text-primary" />
                        </div>
                        <span className="text-xs text-center font-medium">OmniVoice</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      <div className="flex flex-col items-center gap-1.5 min-w-[90px]">
                        <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <span className="text-xs text-center font-medium">Customer</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="font-medium mb-2 text-primary">OmniVoice Settings for Headset Users</p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" /> <span><strong>Microphone:</strong> Set to <strong>CABLE Output (VB-Audio Virtual Cable)</strong> — this receives the denoised audio from ClearVoice.</span></li>
                      <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" /> <span><strong>Speaker / Headphones:</strong> Set to your headset (e.g. HONOR CHOICE, Jabra, Plantronics, or any USB/Bluetooth headset).</span></li>
                      <li className="flex items-start gap-2"><Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" /> <span><strong>Note on the CABLE Output volume slider:</strong> In Windows Sound Settings, the Recording tab's CABLE Output Levels slider will show <strong>0%</strong> and cannot be changed — this is <strong>normal</strong>. Audio passes through at full volume regardless of this slider.</span></li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-medium mb-2 text-primary">Key Point</p>
                    <p className="text-sm text-muted-foreground">
                      Headphones are <strong>output only</strong> — they carry the customer's voice to your ears and do <strong>not</strong> interfere with VB-Cable at all. VB-Cable only handles the microphone input path (your voice → ClearVoice → OmniVoice).
                    </p>
                  </div>

                  <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/10 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>Agents using headsets get the best experience — clean mic input through VB-Cable while hearing the customer clearly through their headset.</span>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Card>

          {/* Troubleshooting */}
          <Card>
            <AccordionItem value="troubleshoot" className="border-b-0 px-4">
              <AccordionTrigger className="text-base font-semibold">
                <span className="flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-primary" />
                  Troubleshooting
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <div>
                    <p className="font-medium mb-1">Blank screen on launch</p>
                    <p className="text-sm text-muted-foreground">Clear the app cache or reinstall. Check that the GPU supports hardware acceleration. Try running in compatibility mode.</p>
                  </div>
                  <div>
                    <p className="font-medium mb-1">CABLE Output missing from Sound settings</p>
                    <p className="text-sm text-muted-foreground">Reinstall VB-Cable as administrator. Reboot. Check <strong>Sound Control Panel → Recording</strong> — right-click and enable disabled/disconnected devices.</p>
                  </div>
                  <div>
                    <p className="font-medium mb-1">Icon not updating in taskbar</p>
                    <p className="text-sm text-muted-foreground">Unpin the old shortcut, uninstall the app, reinstall, and re-pin. Windows caches taskbar icons at install time.</p>
                  </div>
                  <div>
                    <p className="font-medium mb-1">UAC prompt not appearing</p>
                    <p className="text-sm text-muted-foreground">Check UAC settings in <strong>Control Panel → User Accounts → Change User Account Control settings</strong>. Ensure it's not set to "Never notify". Run the installer manually as administrator.</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Card>

          {/* Uninstall */}
          <Card>
            <AccordionItem value="uninstall" className="border-b-0 px-4">
              <AccordionTrigger className="text-base font-semibold">
                <span className="flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-primary" />
                  Uninstall Instructions
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <div>
                    <p className="font-medium mb-1 text-primary">ClearVoice</p>
                    <ol className="space-y-1.5 text-sm text-muted-foreground list-decimal pl-5">
                      <li>Open <strong>Settings → Apps → Installed apps</strong>.</li>
                      <li>Find <strong>ClearVoice</strong> and click <strong>Uninstall</strong>.</li>
                      <li>Follow the uninstaller prompts to complete removal.</li>
                    </ol>
                  </div>
                  <div>
                    <p className="font-medium mb-1 text-primary">VB-Cable</p>
                    <ol className="space-y-1.5 text-sm text-muted-foreground list-decimal pl-5">
                      <li>Run <code className="px-1 py-0.5 rounded bg-secondary text-xs">VBCABLE_Setup_x64.exe</code> as administrator.</li>
                      <li>Click <strong>Uninstall Driver</strong>.</li>
                      <li>Reboot the computer to complete removal.</li>
                    </ol>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Card>

        </Accordion>
      </main>
    </div>
  );
}