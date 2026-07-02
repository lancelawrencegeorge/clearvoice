import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Power, Loader2, FileText, Download, FileCheck, Monitor, ListChecks, Wrench, Trash2, ArrowLeft, ExternalLink, CheckCircle2, Headphones, ArrowRight, Mic, AudioLines, User, Info } from "lucide-react";
import { getCurrentAgent, clearAuth } from "@/lib/customAuth";
import jsPDF from "jspdf";

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

  const handleDownloadPDF = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 50;
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxWidth = pageWidth - margin * 2;
    let y = margin;

    const checkPage = (needed = 20) => {
      if (y + needed > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        y = margin;
      }
    };

    const addTitle = (text) => {
      checkPage(40);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(30, 30, 30);
      doc.text(text, margin, y);
      y += 30;
    };

    const addH2 = (text) => {
      checkPage(30);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(50, 50, 50);
      doc.text(text, margin, y);
      y += 20;
    };

    const addH3 = (text) => {
      checkPage(25);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(60, 60, 60);
      doc.text(text, margin, y);
      y += 18;
    };

    const addBody = (text, indent = 0) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      const lines = doc.splitTextToSize(text, maxWidth - indent);
      lines.forEach(line => {
        checkPage(14);
        doc.text(line, margin + indent, y);
        y += 14;
      });
    };

    const addBullet = (text, indent = 10) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      const lines = doc.splitTextToSize(text, maxWidth - indent - 10);
      checkPage(14);
      doc.text("•", margin + indent, y);
      lines.forEach(line => {
        checkPage(14);
        doc.text(line, margin + indent + 12, y);
        y += 14;
      });
    };

    const addNumbered = (text, indent = 10) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      const lines = doc.splitTextToSize(text, maxWidth - indent - 15);
      checkPage(14);
      lines.forEach((line, i) => {
        checkPage(14);
        if (i === 0) {
          doc.text(text.replace(/^(\d+)\..*/, "$1."), margin + indent, y);
          doc.text(line.replace(/^\d+\.\s*/, ""), margin + indent + 18, y);
        } else {
          doc.text(line, margin + indent + 18, y);
        }
        y += 14;
      });
    };

    const addSpace = (n = 10) => { y += n; };

    const addDivider = () => {
      checkPage(15);
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, pageWidth - margin, y);
      y += 15;
    };

    // --- CONTENT ---
    addTitle("ClearVoice — IT Deployment Guide");
    addBody("Everything needed to deploy ClearVoice with VB-Cable virtual audio routing.");
    addSpace();
    addDivider();

    // Desktop vs Web App
    addH2("Desktop App vs Web App (Browser)");
    addBullet("Desktop App: standalone window that can't be accidentally closed, auto-updates via installer, system tray icon, requires admin rights to install");
    addBullet("Web App: zero installation, works on locked-down/BYOD machines with no admin rights, agent must manually keep the browser tab open, VB-Cable driver still required for full feature parity");
    addSpace();
    addDivider();

    // Files Required
    addH2("Files Required");
    addBody("Download both files before starting the installation. Note: The Web App (Browser) path requires no downloads — just a bookmark to clearvoice.africa.");
    addSpace();
    addH3("ClearVoice Installer");
    addBullet("Desktop application installer (Windows)");
    addBullet("Download: https://github.com/lancelawrencegeorge/clearvoice/releases/download/V1.1.1/ClearVoice.Setup.1.1.1.exe");
    addSpace();
    addH3("VB-Cable Driver");
    addBullet("Virtual audio cable driver for routing mic output");
    addBullet("Download: https://vb-audio.com/Cable/index.htm");
    addSpace();
    addDivider();

    // System Requirements
    addH2("System Requirements");
    addBullet("OS: Windows 10 or Windows 11 (64-bit)");
    addBullet("RAM: Minimum 4 GB (8 GB recommended)");
    addBullet("Internet: Required for initial login and license validation");
    addBullet("Admin Rights: Required to install VB-Cable driver and the ClearVoice desktop app");
    addBullet("Softphone: OmniVoice (or compatible softphone) must be installed for audio routing configuration");
    addBullet("Microphone: Working microphone or headset");
    addSpace();
    addDivider();

    // Account & Role Flow
    addH2("Account & Role Flow");
    addBody("How accounts are created across the ClearVoice system:");
    addSpace();
    addH3("Platform Owner (Admin)");
    addBullet("Invites Super Users at each client company");
    addBullet("Manages billing, plans, seat limits & invoices");
    addBullet("Full visibility into all tenants");
    addSpace();
    addH3("Super User (Client Admin)");
    addBullet("Invited by platform owner, then registers");
    addBullet("Completes onboarding (sets company domain)");
    addBullet("Invites agents individually or via bulk CSV import");
    addSpace();
    addH3("Agent");
    addBullet("Invited, then registers. Or bulk imported (record already exists)");
    addBullet("Installs ClearVoice + VB-Cable driver");
    addSpace();
    addBody("Agents always log in with email + password. Bulk-imported agents skip registration — their account already exists.", 10);
    addSpace();
    addDivider();

    // Step-by-Step Installation
    addH2("Step-by-Step Installation Guide (Desktop App)");
    addSpace();
    addH3("1. Install ClearVoice");
    addBullet("Run the ClearVoice installer as Administrator (right-click → Run as administrator)");
    addBullet("Follow the setup wizard and accept the default installation path");
    addBullet("Launch ClearVoice and sign in with your agent credentials");
    addSpace();
    addH3("2. Install VB-Cable");
    addBullet('Download and extract VB-Cable 2ch (standard) version from vb-audio.com/Cable/ — only install this version, not any "16ch" variant');
    addBullet("Right-click VBCABLE_Setup_x64.exe and select Run as administrator");
    addBullet("Click Install Driver and wait for confirmation");
    addSpace();
    addH3("Identifying the correct VB-Cable devices");
    addBody("After installation you'll see two active devices in Windows Sound settings:", 10);
    addBullet("Playback tab → \"CABLE Input (VB-Audio Virtual Cable)\" — ClearVoice routes cleaned audio here", 20);
    addBullet("Recording tab → \"CABLE Output (VB-Audio Virtual Cable)\" — select this as your softphone microphone", 20);
    addBody('You may also see "CABLE In 16ch (VB-Audio Virtual Cable)" or similar extra entries — these are leftover driver artifacts and are disabled by default. Ignore them entirely. Always select the standard "(VB-Audio Virtual Cable)" devices, never the "16ch" variants.', 10);
    addBody("If incorrect devices appear, uninstall VB-Cable entirely via the setup tool, reboot, and reinstall the standard (2ch) version only.", 10);
    addSpace();
    addH3("3. Reboot");
    addBullet("Restart the computer after VB-Cable installation for the driver to take effect");
    addSpace();
    addH3("4. Configure OmniVoice Audio");
    addBullet("Open OmniVoice softphone settings → Audio Devices");
    addBullet("Set Microphone to CABLE Output (VB-Audio Virtual Cable)");
    addBullet("Set Speaker to your headset or speakers as normal");
    addBullet("In ClearVoice, set the output device to CABLE Input so the denoised audio feeds into OmniVoice");
    addSpace();
    addDivider();

    // Web App (Browser)
    addH2("Web App (Browser) — No Installation Required");
    addBody("ClearVoice works entirely in a browser tab with no installation. Ideal for locked-down or BYOD machines where agents can't install software.");
    addSpace();
    addH3("Steps");
    addBullet("Open a browser and go to clearvoice.africa");
    addBullet("Sign in with work email (no password needed)");
    addBullet('Click "Start Session" and grant microphone access when prompted');
    addBullet("Keep the browser tab open for the entire shift — unlike the desktop app's standalone window, a browser tab can be accidentally closed, so treat it like an active call window and don't close it mid-shift");
    addBullet("For full dual-channel suppression (using the Customer Noise Filter toggle to also filter the other caller's audio), the same VB-Cable (Windows) / BlackHole (Mac) virtual audio driver is still required — this is a one-time OS-level driver install, completely independent of whether you use the desktop app or a plain browser tab");
    addBullet('Set the softphone\'s microphone to "CABLE Output" exactly as documented in the Desktop App steps above — that part of the setup is identical either way');
    addBody("⚠️ The browser tab is the suppression engine — closing it stops filtering immediately.", 10);
    addSpace();
    addDivider();

    // Verification
    addH2("Verification Steps");
    addBody("Confirm the virtual cable is installed correctly:");
    addSpace();
    addBullet("Open Start → Settings → System → Sound");
    addBullet("Scroll to Input and click Choose a device for speaking or recording");
    addBullet("Verify CABLE Output (VB-Audio Virtual Cable) appears in the list");
    addBullet("Open Sound Control Panel → Recording tab and confirm CABLE Output is listed and enabled");
    addBullet("Check the Playback tab for CABLE Input");
    addBullet("Speak into the mic — the ClearVoice level meter should respond, and OmniVoice should receive clean audio");
    addSpace();
    addDivider();

    // Audio Setup for Headset Users
    addH2("Audio Setup for Headset Users");
    addSpace();
    addH3("How the Audio Chain Works");
    addBody("Your physical microphone captures your voice → ClearVoice applies real-time noise suppression → the cleaned audio is sent to CABLE Output (a virtual microphone) → OmniVoice picks up that virtual mic → the customer hears clean, noise-free audio.");
    addSpace();
    addH3("Audio Flow Diagram");
    addBody("Physical Headset Mic → ClearVoice → CABLE Output → OmniVoice → Customer");
    addSpace();
    addH3("OmniVoice Settings for Headset Users");
    addBullet("Microphone: Set to CABLE Output (VB-Audio Virtual Cable) — this receives the denoised audio from ClearVoice");
    addBullet("Speaker / Headphones: Set to your headset (e.g. HONOR CHOICE, Jabra, Plantronics, or any USB/Bluetooth headset)");
    addBullet("Note on the CABLE Output volume slider: In Windows Sound Settings, the Recording tab's CABLE Output Levels slider will show 0% and cannot be changed — this is normal. Audio passes through at full volume regardless of this slider.");
    addSpace();
    addH3("Key Point");
    addBody("Headphones are output only — they carry the customer's voice to your ears and do not interfere with VB-Cable at all. VB-Cable only handles the microphone input path (your voice → ClearVoice → OmniVoice).");
    addSpace();
    addDivider();

    // Troubleshooting
    addH2("Troubleshooting");
    addSpace();
    addH3("Blank screen on launch");
    addBody("Clear the app cache or reinstall. Check that the GPU supports hardware acceleration. Try running in compatibility mode.");
    addSpace();
    addH3("CABLE Output missing from Sound settings");
    addBody("Reinstall VB-Cable as administrator. Reboot. Check Sound Control Panel → Recording — right-click and enable disabled/disconnected devices.");
    addSpace();
    addH3("Icon not updating in taskbar");
    addBody("Unpin the old shortcut, uninstall the app, reinstall, and re-pin. Windows caches taskbar icons at install time.");
    addSpace();
    addH3("UAC prompt not appearing");
    addBody("Check UAC settings in Control Panel → User Accounts → Change User Account Control settings. Ensure it's not set to \"Never notify\". Run the installer manually as administrator.");
    addSpace();
    addDivider();

    // Uninstall
    addH2("Uninstall Instructions");
    addSpace();
    addH3("ClearVoice");
    addBullet("Open Settings → Apps → Installed apps");
    addBullet("Find ClearVoice and click Uninstall");
    addBullet("Follow the uninstaller prompts to complete removal");
    addSpace();
    addH3("VB-Cable");
    addBullet("Run VBCABLE_Setup_x64.exe as administrator");
    addBullet("Click Uninstall Driver");
    addBullet("Reboot the computer to complete removal");
    addSpace(20);

    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(130, 130, 130);
    doc.text("ClearVoice — A product of Contact Centre SA", margin, y);

    doc.save("ClearVoice_IT_Deployment_Guide.pdf");
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
            <Button size="lg" onClick={handleDownloadPDF}>
              <Download className="w-4 h-4 mr-2" />
              Download PDF Guide
            </Button>
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