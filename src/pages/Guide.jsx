import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Info } from 'lucide-react';
import jsPDF from 'jspdf';

const POPUP_HTML_AGENT = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { width: 300px; padding: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f1117; color: #e8eaf0; }
    .header { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
    h2 { font-size: 16px; color: #2dd4bf; margin-bottom: 2px; }
    .subtitle { font-size: 11px; color: #6b7280; }
    .status-bar { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-radius: 10px; background: #1a1f2e; border: 1px solid #2a2f3e; margin-bottom: 14px; font-size: 12px; }
    .dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .dot.on  { background: #2dd4bf; box-shadow: 0 0 6px #2dd4bf88; animation: pulse 2s infinite; }
    .dot.off { background: #4b5563; }
    @keyframes pulse { 0%,100%{opacity:.6} 50%{opacity:1} }
    .toggle-btn { width: 100%; padding: 11px; border-radius: 10px; border: none; font-size: 14px; font-weight: 600; cursor: pointer; transition: all .2s; }
    .toggle-btn.off { background: #2dd4bf; color: #0f1117; }
    .toggle-btn.on  { background: #1a1f2e; color: #ef4444; border: 1px solid #ef444444; }
    .slider-row { display: flex; align-items: center; justify-content: space-between; margin-top: 14px; font-size: 12px; color: #9ca3af; }
    input[type=range] { width: 100%; margin-top: 6px; accent-color: #2dd4bf; }
    .footer { margin-top: 12px; text-align: right; font-size: 10px; color: #374151; cursor: pointer; }
    .footer span:hover { color: #6b7280; }
    #autoBadge { display: none; font-size: 10px; background: #2dd4bf22; color: #2dd4bf; border: 1px solid #2dd4bf44; padding: 2px 7px; border-radius: 20px; margin-left: auto; }
  </style>
</head>
<body>
  <div class="header">
    <div><h2>🎙 ClearVoice</h2><div class="subtitle">Noise suppression for any softphone</div></div>
    <span id="autoBadge">Auto</span>
  </div>
  <div class="status-bar">
    <div class="dot off" id="dot"></div>
    <span id="statusText">Inactive on this page</span>
  </div>
  <button class="toggle-btn off" id="toggleBtn">Enable Suppression</button>
  <div class="slider-row"><span>Suppression Level</span><span id="levelVal">70%</span></div>
  <input type="range" id="slider" min="0" max="100" value="70">
  <div class="footer"><span id="optionsLink">⚙ Manage auto-start URLs</span></div>
  <script src="popup.js"></script>
</body>
</html>`;

const POPUP_HTML_ADMIN = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { width: 300px; padding: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f1117; color: #e8eaf0; }
    .header { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
    h2 { font-size: 16px; color: #2dd4bf; margin-bottom: 2px; }
    .subtitle { font-size: 11px; color: #6b7280; }
    .status-bar { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-radius: 10px; background: #1a1f2e; border: 1px solid #2a2f3e; margin-bottom: 14px; font-size: 12px; }
    .dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .dot.on  { background: #2dd4bf; box-shadow: 0 0 6px #2dd4bf88; animation: pulse 2s infinite; }
    .dot.off { background: #4b5563; }
    @keyframes pulse { 0%,100%{opacity:.6} 50%{opacity:1} }
    .toggle-btn { width: 100%; padding: 11px; border-radius: 10px; border: none; font-size: 14px; font-weight: 600; cursor: pointer; transition: all .2s; }
    .toggle-btn.off { background: #2dd4bf; color: #0f1117; }
    .toggle-btn.on  { background: #1a1f2e; color: #ef4444; border: 1px solid #ef444444; }
    .slider-row { display: flex; align-items: center; justify-content: space-between; margin-top: 14px; font-size: 12px; color: #9ca3af; }
    input[type=range] { width: 100%; margin-top: 6px; accent-color: #2dd4bf; }
    .footer { margin-top: 12px; text-align: right; font-size: 10px; color: #374151; cursor: pointer; }
    .footer span:hover { color: #6b7280; }
    #autoBadge { display: none; font-size: 10px; background: #2dd4bf22; color: #2dd4bf; border: 1px solid #2dd4bf44; padding: 2px 7px; border-radius: 20px; margin-left: auto; }
    .ab-btn { width: 100%; margin-top: 10px; padding: 9px; border-radius: 10px; border: 1px solid #2a2f3e; background: #1a1f2e; color: #9ca3af; font-size: 13px; font-weight: 500; cursor: pointer; transition: all .2s; }
    .ab-btn:hover { border-color: #2dd4bf55; color: #e8eaf0; }
    #abPanel { display: none; margin-top: 12px; background: #1a1f2e; border: 1px solid #2a2f3e; border-radius: 10px; padding: 12px; }
    #abPanel h3 { font-size: 12px; color: #9ca3af; margin-bottom: 10px; letter-spacing: .04em; text-transform: uppercase; }
    .rec-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .rec-label { font-size: 12px; width: 80px; color: #d1d5db; flex-shrink: 0; }
    .rec-btn { flex: 1; padding: 6px 0; border-radius: 7px; border: none; font-size: 12px; font-weight: 600; cursor: pointer; transition: all .2s; background: #2a2f3e; color: #9ca3af; }
    .rec-btn.recording { background: #ef444422; color: #ef4444; border: 1px solid #ef444455; animation: pulse 1s infinite; }
    .rec-btn.done { background: #2dd4bf22; color: #2dd4bf; border: 1px solid #2dd4bf55; }
    .play-btn { width: 28px; height: 28px; border-radius: 50%; border: 1px solid #2a2f3e; background: #0f1117; color: #9ca3af; cursor: pointer; font-size: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all .2s; }
    .play-btn:hover { border-color: #2dd4bf55; color: #2dd4bf; }
    .play-btn:disabled { opacity: 0.3; cursor: default; }
    .ab-hint { font-size: 10px; color: #4b5563; margin-top: 6px; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="header">
    <div><h2>🎙 ClearVoice</h2><div class="subtitle">Noise suppression for any softphone</div></div>
    <span id="autoBadge">Auto</span>
  </div>
  <div class="status-bar">
    <div class="dot off" id="dot"></div>
    <span id="statusText">Inactive on this page</span>
  </div>
  <button class="toggle-btn off" id="toggleBtn">Enable Suppression</button>
  <div class="slider-row"><span>Suppression Level</span><span id="levelVal">70%</span></div>
  <input type="range" id="slider" min="0" max="100" value="70">
  <button class="ab-btn" id="abToggle">🔬 A/B Test</button>
  <div id="abPanel">
    <h3>A/B Recording Test</h3>
    <div class="rec-row">
      <span class="rec-label">Raw (no filter)</span>
      <button class="rec-btn" id="recRaw">⏺ Record</button>
      <button class="play-btn" id="playRaw" disabled>▶</button>
    </div>
    <div class="rec-row">
      <span class="rec-label">Clean (filtered)</span>
      <button class="rec-btn" id="recClean">⏺ Record</button>
      <button class="play-btn" id="playClean" disabled>▶</button>
    </div>
    <p class="ab-hint">Record ~10s of speech for each. Compare playback to hear the difference.</p>
  </div>
  <div class="footer"><span id="optionsLink">⚙ Manage auto-start URLs</span></div>
  <script src="popup.js"></script>
</body>
</html>`;

const POPUP_JS_AGENT = `const btn = document.getElementById('toggleBtn');
const dot = document.getElementById('dot');
const statusText = document.getElementById('statusText');
const slider = document.getElementById('slider');
const levelVal = document.getElementById('levelVal');
const autoBadge = document.getElementById('autoBadge');

let currentTabId = null;
let isActive = false;

function sendToTab(msg) {
  chrome.scripting.executeScript({
    target: { tabId: currentTabId },
    world: 'MAIN',
    func: (m) => window.postMessage(m, '*'),
    args: [msg]
  });
}

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  currentTabId = tabs[0].id;
  const hostname = new URL(tabs[0].url).hostname;
  chrome.storage.sync.get(['suppression', 'autoUrls', 'tabStates'], (data) => {
    const suppression = data.suppression ?? 70;
    const autoUrls = data.autoUrls ?? [];
    const tabStates = data.tabStates ?? {};
    slider.value = suppression;
    levelVal.textContent = suppression + '%';
    const isAutoUrl = autoUrls.some(url => hostname.includes(url));
    const tabActive = tabStates[currentTabId] ?? isAutoUrl;
    if (isAutoUrl) autoBadge.style.display = 'block';
    setUI(tabActive);
  });
});

btn.addEventListener('click', () => {
  isActive = !isActive;
  chrome.storage.sync.get('tabStates', (data) => {
    const tabStates = data.tabStates ?? {};
    tabStates[currentTabId] = isActive;
    chrome.storage.sync.set({ tabStates });
  });
  sendToTab({ type: 'CLEARVOICE_TOGGLE', active: isActive, suppression: parseInt(slider.value) });
  setUI(isActive);
});

slider.addEventListener('input', () => {
  const val = parseInt(slider.value);
  levelVal.textContent = val + '%';
  chrome.storage.sync.set({ suppression: val });
  sendToTab({ type: 'CLEARVOICE_SET_SUPPRESSION', suppression: val });
});

document.getElementById('optionsLink').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

function setUI(active) {
  isActive = active;
  btn.textContent = active ? 'Disable Suppression' : 'Enable Suppression';
  btn.className = 'toggle-btn ' + (active ? 'on' : 'off');
  dot.className = 'dot ' + (active ? 'on' : 'off');
  statusText.textContent = active ? 'Active — microphone is being filtered' : 'Inactive on this page';
}`;

const POPUP_JS_ADMIN = POPUP_JS_AGENT + `

// A/B TEST
document.getElementById('abToggle').addEventListener('click', () => {
  const panel = document.getElementById('abPanel');
  panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
});

let rawUrl = null, cleanUrl = null;
let mediaRecorder = null;

async function startRecording(type) {
  if (mediaRecorder && mediaRecorder.state === 'recording') { mediaRecorder.stop(); return; }
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const chunks = [];
  mediaRecorder = new MediaRecorder(stream);
  const recBtn = document.getElementById(type === 'raw' ? 'recRaw' : 'recClean');
  recBtn.textContent = '⏹ Stop';
  recBtn.className = 'rec-btn recording';
  mediaRecorder.ondataavailable = e => chunks.push(e.data);
  mediaRecorder.onstop = () => {
    stream.getTracks().forEach(t => t.stop());
    const url = URL.createObjectURL(new Blob(chunks, { type: 'audio/webm' }));
    if (type === 'raw') { rawUrl = url; document.getElementById('playRaw').disabled = false; }
    else { cleanUrl = url; document.getElementById('playClean').disabled = false; }
    recBtn.textContent = '✔ Done';
    recBtn.className = 'rec-btn done';
  };
  mediaRecorder.start();
}

document.getElementById('recRaw').addEventListener('click', () => startRecording('raw'));
document.getElementById('recClean').addEventListener('click', () => startRecording('clean'));
document.getElementById('playRaw').addEventListener('click', () => { if (rawUrl) new Audio(rawUrl).play(); });
document.getElementById('playClean').addEventListener('click', () => { if (cleanUrl) new Audio(cleanUrl).play(); });`;

function downloadFile(filename, content) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function Guide() {
  const handleDownload = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
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
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(30, 30, 30);
      doc.text(text, margin, y);
      y += 30;
    };

    const addH2 = (text) => {
      checkPage(30);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(50, 50, 50);
      doc.text(text, margin, y);
      y += 20;
    };

    const addH3 = (text) => {
      checkPage(25);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(60, 60, 60);
      doc.text(text, margin, y);
      y += 18;
    };

    const addBody = (text, indent = 0) => {
      doc.setFont('helvetica', 'normal');
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
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      const lines = doc.splitTextToSize(text, maxWidth - indent - 10);
      checkPage(14);
      doc.text('•', margin + indent, y);
      lines.forEach((line, i) => {
        checkPage(14);
        doc.text(line, margin + indent + 12, y);
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
    addTitle('ClearVoice — Setup Guide');
    addBody('ClearVoice runs as an installable web app. Install it once and it runs in its own window, staying active throughout your calls. All audio is processed locally on your device.');
    addSpace();
    addDivider();
    addH2('Account & Role Flow');
    addBody('This diagram explains how accounts are created and who manages what:');
    addSpace();
    addH3('Platform Owner (ClearVoice Admin)');
    addBullet('Registers Super Users at each client company');
    addBullet('Manages billing, plans, seat limits, and invoices across all tenants');
    addBullet('Has full visibility into all companies');
    addSpace();
    addH3('Super User (Client Company Admin)');
    addBullet('Is registered by the platform owner — no password needed, signs in with email only');
    addBullet('Completes company onboarding (sets the email domain, e.g. acme.com)');
    addBullet('Registers agents into their company via individual registration or bulk CSV import');
    addBullet('Manages their own company agents, reports, and billing details');
    addSpace();
    addH3('Agent');
    addBullet('Is registered by their Super User — account is created instantly, no password needed');
    addBullet('Signs in with their work email at the login page — no password required');
    addBullet('Installs the ClearVoice desktop app and VB-Cable (with IT help)');
    addBullet('Uses ClearVoice for daily call noise suppression');
    addSpace();
    addH3('Bulk Import (CSV)');
    addBullet('The Super User uploads a CSV with agent names and work emails');
    addBullet('All agent records are created instantly — accounts already exist in the system');
    addBullet('Agents sign in with their email at the login page — no password or invite email needed');
    addSpace();
    addBody('Note: Agents always log in with their email only — no passwords are needed. Once registered (individually or via bulk import), the agent can sign in immediately.', 10);
    addSpace();
    addDivider();
    addH2('Before You Begin: Super User Setup');
    addBody('Before agents can use ClearVoice, your company\'s Super User (admin) must register and complete onboarding first. This sets up the company domain and enables user invitations.');
    addSpace();
    addH3('Step 1: Super User Registration');
    addBullet('The platform owner registers the Super User — the account is created instantly');
    addBullet('The Super User signs in with their work email at the login page — no password needed');
    addBullet('On first login, they are guided through onboarding — this includes setting the company email domain (e.g. acme.com)');
    addBullet('The domain controls data isolation — only users with a matching email domain will see the company\'s data');
    addSpace();
    addH3('Step 2: Register Agents');
    addBullet('Once onboarding is complete, the Super User goes to the Billing Dashboard');
    addBullet('They click "Register Agent" and enter each agent\'s work email');
    addBullet('Agent accounts are created instantly — agents can sign in with their email right away, no password or invite email needed');
    addBullet('The Super User can also bulk-import agents via CSV from the Import page');
    addSpace();
    addBody('Only after the Super User has registered and set the domain can agents be registered.', 10);
    addSpace();
    addDivider();

    addH2('Installation');
    addBody('ClearVoice can be used as a desktop app or directly in a browser tab — choose whichever fits your environment.');
    addSpace();

    addH3('Desktop App vs Web App');
    addBullet('Desktop App: standalone window that can\'t be accidentally closed, auto-updates via installer, system tray icon');
    addBullet('Web App: zero installation, works on locked-down/BYOD machines with no admin rights, but the agent must manually keep the browser tab open');
    addSpace();

    addH3('Desktop App (Recommended)');
    addBody('Install the ClearVoice desktop app for the best experience — standalone window, auto-updates, and persistent settings.');
    addSpace();
    addH3('Step 1: Download & Install');
    addBullet('Download the installer: https://github.com/lancelawrencegeorge/clearvoice/releases/download/V1.1.1/ClearVoice.Setup.1.1.1.exe');
    addBullet('Run ClearVoice Setup 1.1.1.exe');
    addBullet('ClearVoice installs and launches automatically');
    addBullet('Pin it to your taskbar for quick access');
    addBody('✅ Success check: ClearVoice opens as a standalone desktop app.', 10);
    addSpace();

    addH3('Web App (Browser) — No Installation Required');
    addBody('ClearVoice works entirely in a browser tab with no installation. Ideal for locked-down or BYOD machines where you can\'t install software.');
    addSpace();
    addH3('Steps');
    addBullet('Open your browser and go to clearvoice.africa');
    addBullet('Sign in with your work email (no password needed)');
    addBullet('Click "Start Session" and grant microphone access when prompted');
    addBullet('Keep this browser tab open for your entire shift — unlike the desktop app\'s standalone window, a browser tab can be accidentally closed, so treat it like an active call window and don\'t close it mid-shift');
    addBullet('For full dual-channel suppression (using the Customer Noise Filter toggle to also filter the other caller\'s audio), the same VB-Cable (Windows) / BlackHole (Mac) virtual audio driver is still required — this is a one-time OS-level driver install, completely independent of whether you use the desktop app or a plain browser tab');
    addBullet('Set your softphone\'s microphone to "CABLE Output" exactly as documented in the Desktop App section above — that part of the setup is identical either way');
    addBody('⚠️ The browser tab is your suppression engine — closing it stops filtering immediately.', 10);
    addSpace();

    addH3('Step 2: Set Up Virtual Audio Cable (One-Time, IT Required)');
    addBody('ClearVoice processes audio in its own window. To route the clean audio into your softphone, a virtual audio cable driver must be installed on each agent\'s machine. This requires local admin privileges and should be deployed by the client\'s IT team.');
    addSpace();
    addH3('Windows — VB-Cable');
    addBullet('Download VB-Cable from vb-audio.com/Cable/ (free) — get the standard "Virtual Audio Cable (2ch)" version');
    addBullet('Right-click the installer and "Run as administrator"');
    addBullet('Reboot the machine after installation');
    addSpace();
    addH3('Identifying the correct VB-Cable device');
    addBody('After installing VB-Cable, you will see two virtual devices appear in your Windows sound settings:');
    addBullet('Playback tab → "CABLE Input (VB-Audio Virtual Cable)" — set this as your default playback device for ClearVoice to receive audio');
    addBullet('Recording tab → "CABLE Output (VB-Audio Virtual Cable)" — select this as your microphone in Teams / Zoom / softphone');
    addBody('⚠️ You may see other devices like "CABLE In 16ch (VB-Audio Virtual Cable)" — these are leftover driver artifacts and are DISABLED by default. Ignore them entirely. Always select the standard "(VB-Audio Virtual Cable)" devices listed above — not the "16ch" variant. If you do not see the correct devices, uninstall VB-Cable entirely, reboot, then reinstall the standard 2-channel version only.', 10);
    addBody('The Windows CABLE Output volume slider (Recording > Properties > Levels) will typically show 0% and cannot be changed — this is normal and does not affect audio. Audio passes through at full volume regardless.', 10);
    addSpace();
    addH3('Mac — BlackHole');
    addBullet('Download BlackHole from existential.audio/blackhole/ (free)');
    addBullet('Run the installer package');
    addBullet('Reboot the machine after installation');
    addSpace();
    addH3('Configure the Softphone');
    addBullet('Open your softphone\'s audio/microphone settings');
    addBullet('Set the microphone input to "VB-Cable" (Windows) or "BlackHole 2ch" (Mac)');
    addBullet('In ClearVoice, the app automatically routes processed audio to the virtual cable');
    addBody('✅ Success check: Make a test call — the other person should hear your voice with background noise removed.', 10);
    addSpace();

    addH3('Step 3: Start Your Day');
    addBullet('Open ClearVoice from your taskbar / dock');
    addBullet('Click "Start Session" once to grant microphone access');
    addBullet('Your saved suppression level and channel gains load automatically');
    addBullet('Minimize the window — the engine keeps running while you take calls');
    addSpace();

    addH3('Step 4: During Calls');
    addBullet('ClearVoice filters your mic in real time — no per-call action needed');
    addBullet('Adjust the Suppression slider if a call is noisy (higher = more aggressive)');
    addBullet('Use Pause if you need to step away; the engine auto-resumes when you return to the window');
    addSpace();

    addH3('Step 5: End of Day');
    addBullet('Just close the window — your session is logged automatically');
    addBullet('No need to click "End Session" — closing the window stops the engine and saves your session');
    addSpace();

    addDivider();
    addH2('Enterprise / IT-Managed Deployment');
    addBody('For larger contact centres, IT can automate most of the setup across all agent machines. Here is what can and cannot be pushed centrally today:');
    addSpace();
    addH3('What IT Can Push Centrally');
    addBullet('Virtual audio cable driver (VB-Cable on Windows / BlackHole on Mac) — standard MSI/PKG installers deployable via SCCM, Intune, Jamf, or Group Policy');
    addBullet('Chrome managed storage policy — pre-configure auto-start URLs and suppression settings for all users');
    addSpace();
    addH3('What Requires Manual Action Per Agent (Today)');
    addBullet('Desktop app installer — standard .exe install; IT can package and deploy it via SCCM, Intune, or Group Policy');
    addBody('Alternatively, IT can provision a bookmarked link to clearvoice.africa for the Web App path instead of deploying the .exe installer — useful for locked-down or BYOD machines. The VB-Cable driver push is still required either way for full feature parity (dual-channel suppression via the Customer Noise Filter).', 10);
    addSpace();
    addBody('Summary: IT can handle the driver today, and the desktop installer can be centrally deployed via SCCM, Intune, or Group Policy — or skipped entirely in favour of a bookmarked web link.', 10);
    addSpace();

    addDivider();
    addH2('📋 Agent Quick-Start Sheet (Print This Page)');
    addBody('Hand this one-page guide to each agent for a 5-minute setup. No IT knowledge needed beyond the initial VB-Cable installation.');
    addSpace();
    addH3('Your 1-Minute Morning Routine');
    addBullet('Open ClearVoice from your taskbar');
    addBullet('Click "Start Session" — grant microphone permission when asked');
    addBullet('Minimize the window (the engine stays running)');
    addBody('That\'s it. You\'re ready for calls all day.', 10);
    addSpace();
    addH3('To Check It\'s Working (Quick Test)');
    addBullet('In your softphone, look in the audio settings: your microphone should read "CABLE Output"');
    addBullet('Make a test call and ask: "Can you hear me clearly with background noise gone?"');
    addBullet('If your voice sounds muffled → lower the Suppression slider in ClearVoice');
    addBullet('If background noise is still coming through → raise the Suppression slider');
    addSpace();
    addH3('Important Tips');
    addBullet('ClearVoice filters YOUR microphone by default — use the "Customer Noise Filter" toggle to also filter the other caller\'s audio');
    addBullet('Choose your softphone\'s MICROPHONE (not speaker) to "CABLE Output"');
    addBullet('Leave your SPEAKER setting on your headset so you can hear callers normally');
    addBullet('The Windows sound "CABLE Output" volume slider will show 0% — ignore it, your audio works at full volume');
    addBullet('Start ClearVoice BEFORE joining a call, not during');
    addSpace();
    addH3('Session Timeout');
    addBody('For security, ClearVoice automatically signs you out after 2 hours of inactivity (no mouse, keyboard, scroll, or touch activity). Your session is properly closed with a logout timestamp so it won\'t appear as a stale "open" session. Simply sign back in to resume.');
    addSpace();
    addH3('Troubleshooting Checklist');
    addBullet('☐ Is ClearVoice showing "Active" (not "Idle")?');
    addBullet('☐ Does the audio bar move green when you speak?');
    addBullet('☐ Is your softphone microphone set to "CABLE Output (VB-Audio Virtual Cable)"?');
    addBullet('☐ Is your softphone SPEAKER set to your headset/microspeaker (NOT the cable)?');
    addBullet('☐ Did you click "Start Session" in ClearVoice?');
    addBullet('☐ Is the suppression slider above 50%?');
    addSpace();
    addBody('If all checks pass and it still isn\'t working: quit ClearVoice, re-open it, click Start Session, and rejoin the call.', 10);
    addSpace();

    addDivider();
    addH2('What to Look Out For');

    addH3('Signs the test is working correctly');
    addBullet('The audio visualizer shows activity when you speak');
    addBullet('The status indicator shows "Active" (not "Idle")');
    addBullet('Background noise is clearly reduced when you toggle suppression on');
    addBullet('Your voice remains natural and clear — not robotic or muffled');
    addBullet('No noticeable audio delay (latency should be under ~20ms)');
    addSpace();

    addH3('Common issues to watch for');
    addBullet('Suppression doesn\'t activate — click "Start Session" before joining the call, or refresh and retry');
    addBullet('No suppression effect — check the suppression slider is above 50%');
    addBullet('Voice sounds robotic — lower the suppression slider (try 60–70%) for a better balance');
    addBullet('Mic access not granted — check your browser\'s microphone permissions and site settings');
    addBullet('Not working on your softphone — confirm your platform URL and let us know');
    addSpace();

    addDivider();
    addH2('Sending Us Feedback');
    addBody('Please share the following after your test:');
    addBullet('Which softphone platform you tested on');
    addBullet('A/B comparison notes (suppression on vs off)');
    addBullet('Any errors or unexpected behaviour');
    addBullet('Your overall audio quality rating (1–5)');
    addSpace(20);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(130, 130, 130);
    doc.text('ClearVoice processes all audio locally in your browser. No audio is ever sent to external servers.', margin, y);

    doc.save('ClearVoice-Test-Guide.pdf');
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Setup Guide</h1>
            <p className="text-muted-foreground text-sm mt-1">Install ClearVoice and start taking clearer calls</p>
          </div>
          <Button onClick={handleDownload} className="gap-2">
            <Download className="w-4 h-4" />
            Download PDF
          </Button>
        </div>

        {/* Before You Begin */}
        <section className="border border-border rounded-xl p-6 space-y-4 mb-8">
          <h2 className="text-lg font-semibold">Before You Begin: Super User Setup</h2>
          <p className="text-sm text-muted-foreground">
            Before agents can use ClearVoice, your company's Super User (admin) must register and complete onboarding first. This sets up the company domain and enables agent registration.
          </p>
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-medium text-sm mb-2">Step 1: Super User Registration</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>The platform owner registers the Super User — the account is created instantly</li>
                <li>The Super User signs in with their work email at the login page — no password needed</li>
                <li>On first login, they are guided through onboarding — this includes setting the company email domain (e.g. <strong>acme.com</strong>)</li>
                <li>The domain controls data isolation — only users with a matching email domain will see the company's data</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-sm mb-2">Step 2: Register Agents</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Once onboarding is complete, the Super User goes to the <strong>Billing Dashboard</strong></li>
                <li>They click <strong>"Register Agent"</strong> and enter each agent's work email</li>
                <li>Agent accounts are created instantly — agents can sign in with their email right away, no password or invite email needed</li>
                <li>The Super User can also bulk-import agents via CSV from the <strong>Import</strong> page</li>
              </ul>
            </div>
            <p className="text-primary text-xs">✅ Only after the Super User has registered and set the domain can agents be registered.</p>
          </div>
        </section>

        {/* Account & Role Flow */}
        <section className="border border-border rounded-xl p-6 space-y-4 mb-8">
          <h2 className="text-lg font-semibold">Account &amp; Role Flow</h2>
          <p className="text-sm text-muted-foreground">
            This diagram explains how accounts are created in ClearVoice and who manages what at each level.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="border border-primary/30 bg-primary/5 rounded-xl p-4 space-y-2">
              <h3 className="font-semibold text-sm text-primary">Platform Owner (Admin)</h3>
              <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground">
                <li>Registers Super Users at each client company</li>
                <li>Manages billing, plans, seat limits &amp; invoices</li>
                <li>Full visibility into all tenants</li>
              </ul>
            </div>
            <div className="border border-border rounded-xl p-4 space-y-2">
              <h3 className="font-semibold text-sm">Super User (Client Admin)</h3>
              <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground">
                <li>Registered by platform owner → signs in with email only (no password)</li>
                <li>Completes onboarding (sets company domain)</li>
                <li>Registers agents individually or via bulk CSV import</li>
              </ul>
            </div>
            <div className="border border-border rounded-xl p-4 space-y-2">
              <h3 className="font-semibold text-sm">Agent</h3>
              <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground">
                <li>Registered by Super User → account created instantly (no password needed)</li>
                <li>Or bulk imported: record created, signs in with email right away</li>
                <li>Installs ClearVoice + VB-Cable, uses daily suppression</li>
              </ul>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            💡 Agents always log in with their email only — no passwords are needed. Once registered (individually or via bulk import), the agent can sign in immediately.
          </p>
        </section>

        {/* What to Expect */}
        <div className="mb-8 rounded-xl border border-blue-500/30 bg-blue-500/5 p-6">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-5 h-5 text-blue-400 shrink-0" />
            <h2 className="text-lg font-semibold">What to Expect — Noise Suppression Performance</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            ClearVoice uses AI-powered noise suppression to significantly reduce background noise on your calls. Here's what you can realistically expect:
          </p>
          <ul className="space-y-1.5 text-sm text-muted-foreground mb-4">
            <li className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">•</span><span><strong className="text-foreground">Keyboard / typing noise:</strong> 70–80% reduction</span></li>
            <li className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">•</span><span><strong className="text-foreground">HVAC / air conditioning hum:</strong> 75–80% reduction</span></li>
            <li className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">•</span><span><strong className="text-foreground">General office chatter:</strong> 60–75% reduction</span></li>
            <li className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">•</span><span><strong className="text-foreground">Loud environments (TV, crowds):</strong> 50–65% reduction</span></li>
          </ul>
          <p className="text-sm text-muted-foreground">
            <span className="text-amber-500">⚠️</span> ClearVoice does not eliminate noise 100%. Typical real-world suppression is 60–80%, which delivers a significant improvement in call clarity for most contact centre environments. For best results, use a quality closed-back headset and close unnecessary applications during calls.
          </p>
        </div>

        {/* Installation Options */}
        <section className="space-y-6 mb-8">
          <div>
            <h2 className="text-lg font-semibold mb-1">Installation</h2>
            <p className="text-sm text-muted-foreground">ClearVoice can be used as a desktop app or directly in a browser tab — choose whichever fits your environment.</p>
          </div>

          {/* Desktop vs Web App Comparison */}
          <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-400 shrink-0" />
              <h3 className="text-sm font-semibold">Desktop App vs Web App</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-border rounded-lg p-4 space-y-1.5">
                <p className="font-medium text-sm text-foreground">🖥️ Desktop App</p>
                <ul className="list-disc list-inside space-y-0.5 text-xs text-muted-foreground">
                  <li>Standalone window that can't be accidentally closed</li>
                  <li>Auto-updates via installer</li>
                  <li>System tray icon for quick access</li>
                </ul>
              </div>
              <div className="border border-border rounded-lg p-4 space-y-1.5">
                <p className="font-medium text-sm text-foreground">🌐 Web App (Browser)</p>
                <ul className="list-disc list-inside space-y-0.5 text-xs text-muted-foreground">
                  <li>Zero installation — just open a browser tab</li>
                  <li>Works on locked-down / BYOD machines with no admin rights</li>
                  <li>Agent must manually keep the browser tab open</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Option A: Desktop App */}
          <div className="border border-primary/30 rounded-xl p-6 space-y-4 bg-primary/5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">Recommended</span>
            </div>
            <div>
              <h3 className="text-base font-semibold mb-1">Desktop App</h3>
              <p className="text-sm text-muted-foreground">
                Install the ClearVoice desktop app for the best experience — standalone window, auto-updates, and persistent settings.
              </p>
            </div>
            <div className="text-sm">
              <h4 className="font-medium text-sm mb-2">Step 1: Download &amp; Install</h4>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Download the installer: <a href="https://github.com/lancelawrencegeorge/clearvoice/releases/download/V1.1.1/ClearVoice.Setup.1.1.1.exe" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">ClearVoice Setup 1.1.1.exe</a></li>
                <li>Run <strong>ClearVoice Setup 1.1.1.exe</strong></li>
                <li>ClearVoice installs and launches automatically</li>
                <li>Pin it to your taskbar for quick access</li>
              </ol>
              <p className="mt-2 text-primary text-xs">✅ Success check: ClearVoice opens as a standalone desktop app.</p>
            </div>
          </div>

          {/* Option B: Web App (Browser) */}
          <div className="border border-border rounded-xl p-6 space-y-4">
            <div>
              <h3 className="text-base font-semibold mb-1">Web App (Browser) — No Installation Required</h3>
              <p className="text-sm text-muted-foreground">
                ClearVoice works entirely in a browser tab with no installation. Ideal for locked-down or BYOD machines where you can't install software.
              </p>
            </div>
            <div className="text-sm">
              <h4 className="font-medium text-sm mb-2">Steps</h4>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Open your browser and go to <a href="https://clearvoice.africa" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">clearvoice.africa</a></li>
                <li>Sign in with your work email (no password needed)</li>
                <li>Click <strong>"Start Session"</strong> and grant microphone access when prompted</li>
                <li>Keep this browser tab open for your entire shift — unlike the desktop app's standalone window, a browser tab can be accidentally closed, so treat it like an active call window and don't close it mid-shift</li>
                <li>For full dual-channel suppression (using the <strong>Customer Noise Filter</strong> toggle to also filter the other caller's audio), the same <strong>VB-Cable</strong> (Windows) / <strong>BlackHole</strong> (Mac) virtual audio driver is still required — this is a one-time OS-level driver install, completely independent of whether you use the desktop app or a plain browser tab</li>
                <li>Set your softphone's microphone to <strong>"CABLE Output"</strong> exactly as documented in the Desktop App section above — that part of the setup is identical either way</li>
              </ol>
              <p className="mt-2 text-amber-500 text-xs">⚠️ The browser tab is your suppression engine — closing it stops filtering immediately.</p>
            </div>
          </div>

        </section>

        {/* Shared Setup Steps */}
        <section className="border border-border rounded-xl p-6 space-y-6 mb-8">
          <div className="space-y-4 text-sm">

            <div>
              <h3 className="font-medium text-sm mb-2">Step 2: Set Up Virtual Audio Cable</h3>
              <p className="text-xs text-amber-500 font-medium mb-3">⚠ One-time setup — requires IT / local admin</p>
              <p className="text-muted-foreground mb-3">
                ClearVoice processes audio in its own window. To route the clean audio into your softphone, a virtual audio cable driver must be installed on each agent's machine. This requires local admin privileges and should be deployed by the client's IT team.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                <div className="border border-border rounded-lg p-4 space-y-2">
                  <p className="font-medium text-sm text-foreground">Windows — VB-Cable</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-xs">
                    <li>Download from <strong>vb-audio.com/Cable/</strong> (free) — get the standard <strong>"Virtual Audio Cable (2ch)"</strong> version</li>
                    <li>Right-click installer → <strong>"Run as administrator"</strong></li>
                    <li>Reboot after installation</li>
                  </ol>
                  <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs space-y-1.5">
                    <p className="font-medium text-amber-500">🔍 Identifying the correct devices</p>
                    <p className="text-muted-foreground">After install you'll see two devices:</p>
                    <ul className="list-none space-y-1 text-muted-foreground">
                      <li>🎧 <strong>Playback</strong> tab → "CABLE Input (VB-Audio Virtual Cable)" — set as ClearVoice output</li>
                      <li>🎤 <strong>Recording</strong> tab → "CABLE Output (VB-Audio Virtual Cable)" — select as mic in softphone</li>
                    </ul>
                    <p className="text-muted-foreground"><strong>Ignore</strong> any "CABLE In 16ch (VB-Audio Virtual Cable)" devices — those are leftovers and stay disabled. Always pick the standard "(VB-Audio Virtual Cable)" variants, never the "16ch" ones.</p>
                    <p className="text-muted-foreground">The CABLE Output Levels slider will show 0% and cannot be changed — this is normal and does not affect audio.</p>
                    <p className="text-xs text-amber-500/60">If the wrong devices appear, uninstall VB-Cable entirely, reboot, and reinstall the standard (2ch) version only.</p>
                  </div>
                </div>
                <div className="border border-border rounded-lg p-4 space-y-2">
                  <p className="font-medium text-sm text-foreground">Mac — BlackHole</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-xs">
                    <li>Download from <strong>existential.audio/blackhole/</strong> (free)</li>
                    <li>Run the installer package</li>
                    <li>Reboot after installation</li>
                  </ol>
                </div>
              </div>
              <div className="mt-3">
                <p className="font-medium text-sm mb-1 text-foreground">Configure the Softphone</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Open your softphone's audio / microphone settings</li>
                  <li>Set the microphone input to <strong>"VB-Cable"</strong> (Windows) or <strong>"BlackHole 2ch"</strong> (Mac)</li>
                  <li>ClearVoice automatically routes processed audio to the virtual cable</li>
                </ul>
                <p className="mt-2 text-primary text-xs">✅ Success check: Make a test call — the other person should hear your voice with background noise removed.</p>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-sm mb-2">Step 3: Start Your Day</h3>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Open ClearVoice from your taskbar / dock</li>
                <li>Click <strong>"Start Session"</strong> once to grant microphone access</li>
                <li>Your saved suppression level and channel gains load automatically</li>
                <li>Minimize the window — the engine keeps running while you take calls</li>
              </ol>
            </div>

            <div>
              <h3 className="font-medium text-sm mb-2">Step 4: During Calls</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>ClearVoice filters your mic in real time — no per-call action needed</li>
                <li>Adjust the Suppression slider if a call is noisy (higher = more aggressive)</li>
                <li>Use <strong>Pause</strong> if you step away; the engine auto-resumes when you return to the window</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sm mb-2">Step 5: End of Day</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Just close the window — your session is logged automatically</li>
                <li>No need to click "End Session" — closing stops the engine and saves your session</li>
              </ul>
            </div>
          </div>
        </section>

        <div className="space-y-8 text-sm leading-relaxed">

          <section className="border border-primary/30 rounded-xl p-5 space-y-4 bg-primary/5">
            <h2 className="text-lg font-semibold">Enterprise / IT-Managed Deployment</h2>
            <p className="text-sm text-muted-foreground">
              For larger contact centres, IT can automate most of the setup across all agent machines. Here is what can and cannot be pushed centrally today:
            </p>
            <div>
              <h3 className="font-medium text-sm mb-2 text-primary">What IT Can Push Centrally</h3>
              <ul className="space-y-1 text-muted-foreground">
                <li>✅ <strong>Virtual audio cable driver</strong> (VB-Cable on Windows / BlackHole on Mac) — standard MSI/PKG installers deployable via SCCM, Intune, Jamf, or Group Policy</li>
                <li>✅ <strong>Chrome managed storage policy</strong> — pre-configure auto-start URLs and suppression settings for all users</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-sm mb-2 text-amber-500">What Requires Manual Action Per Agent (Today)</h3>
              <ul className="space-y-1 text-muted-foreground">
                <li>⚠️ <strong>Desktop app installer</strong> — standard .exe install; IT can package and deploy it via SCCM, Intune, or Group Policy</li>
              </ul>
              <p className="text-xs text-muted-foreground mt-2">
                💡 Alternatively, IT can provision a <strong>bookmarked link to clearvoice.africa</strong> for the Web App path instead of deploying the .exe installer — useful for locked-down or BYOD machines. The VB-Cable driver push is still required either way for full feature parity (dual-channel suppression via the Customer Noise Filter).
              </p>
            </div>
            <p className="text-xs text-muted-foreground italic pt-2 border-t border-border">
              Summary: IT can handle the driver today, and the desktop installer can be centrally deployed via SCCM, Intune, or Group Policy — or skipped entirely in favour of a bookmarked web link.
            </p>
          </section>

          <section className="border border-primary bg-primary/5 rounded-xl p-5 space-y-4 border-primary/30">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className="text-lg">📋</span>
              Agent Quick-Start Sheet
              <span className="inline-block ml-auto text-[10px] font-normal uppercase tracking-wider bg-primary/20 text-primary px-2 py-0.5 rounded">Print &amp; Hand Out</span>
            </h2>
            <p className="text-sm text-muted-foreground">
              Hand this one-page guide to each agent for a 5-minute setup. No IT knowledge needed beyond the initial VB-Cable installation.
            </p>

            <div className="space-y-3 text-sm">
              <div>
                <h3 className="font-medium text-sm mb-1">Your 1-Minute Morning Routine</h3>
                <ol className="list-decimal list-inside space-y-0.5 text-muted-foreground">
                  <li>Open ClearVoice from your taskbar</li>
                  <li>Click <strong>"Start Session"</strong> — grant microphone permission when asked</li>
                  <li>Minimize the window (the engine stays running)</li>
                </ol>
                <p className="mt-1 text-primary text-xs">That's it. You're ready for calls all day.</p>
              </div>

              <div>
                <h3 className="font-medium text-sm mb-1">Quick Test (Check It's Working)</h3>
                <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                  <li>In your softphone audio settings, confirm microphone is set to <strong>"CABLE Output"</strong></li>
                  <li>Make a test call — "Can you hear me with background noise gone?"</li>
                  <li>If muffled → <strong>lower</strong> the Suppression slider</li>
                  <li>If noisy → <strong>raise</strong> the Suppression slider</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-sm mb-1">Important Tips</h3>
                <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                  <li>ClearVoice filters <strong>your mic</strong> by default — toggle on <strong>Customer Noise Filter</strong> to also filter the other caller\'s audio</li>
                  <li>Set <strong>MICROPHONE</strong> to "CABLE Output", leave <strong>SPEAKER</strong> on your headset</li>
                  <li>The Windows CABLE Output slider at 0% is <strong>normal</strong> — audio passes at full volume</li>
                  <li>Start ClearVoice <strong>before</strong> joining a call, not during</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-sm mb-1">Session Timeout</h3>
                <p className="text-muted-foreground">
                  For security, ClearVoice automatically signs you out after <strong>2 hours of inactivity</strong> (no mouse, keyboard, scroll, or touch activity). Your session is properly closed with a logout timestamp so it won't appear as a stale "open" session. Simply sign back in to resume.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-sm mb-1">Troubleshooting Checklist</h3>
                <p className="text-xs text-muted-foreground mb-1">Go through each check:</p>
                <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                  <li>☐ ClearVoice showing <strong>"Active"</strong> (not "Idle")?</li>
                  <li>☐ Audio bar moving green when you speak?</li>
                  <li>☐ Softphone mic set to <strong>"CABLE Output (VB-Audio Virtual Cable)"</strong>?</li>
                  <li>☐ Softphone <strong>speaker</strong> set to headset (NOT the cable)?</li>
                  <li>☐ Did you click <strong>"Start Session"</strong>?</li>
                  <li>☐ Suppression slider above <strong>50%</strong>?</li>
                </ul>
              </div>

              <p className="text-xs text-muted-foreground">Still not working? Quit ClearVoice, re-open it, click Start Session, and rejoin the call.</p>
            </div>
          </section>

          <section className="border border-border rounded-xl p-5 space-y-4">
            <h2 className="text-lg font-semibold">What to Look Out For</h2>
            <div>
              <h3 className="font-medium text-sm mb-2 text-primary">Signs the test is working correctly</h3>
              <ul className="space-y-1 text-muted-foreground">
                <li>🟢 The visualizer shows audio activity when you speak</li>
                <li>🟢 Status indicator shows <strong>"Active"</strong></li>
                <li>🟢 Background noise is clearly reduced when you toggle suppression on</li>
                <li>🟢 Your voice sounds natural — not robotic or muffled</li>
                <li>🟢 No noticeable audio delay (under ~20ms)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-sm mb-2 text-destructive">Common issues to watch for</h3>
              <ul className="space-y-1 text-muted-foreground">
                <li>🔴 <strong>Audio doesn't activate</strong> — click "Start" before joining the call, or refresh and retry</li>
                <li>🔴 <strong>No suppression effect</strong> — check the suppression slider is above 50%</li>
                <li>🔴 <strong>Voice sounds robotic</strong> — lower suppression to 60–70%</li>
                <li>🔴 <strong>Mic access not granted</strong> — check your browser's microphone permissions and site settings</li>
                <li>🔴 <strong>Not working on your softphone</strong> — confirm your platform URL and let us know</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">Sending Us Feedback</h2>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Which softphone platform you tested on</li>
              <li>A/B comparison notes (suppression on vs off)</li>
              <li>Any errors or unexpected behaviour</li>
              <li>Your overall audio quality rating (1–5)</li>
            </ul>
          </section>

          <p className="text-xs text-muted-foreground italic border-t border-border pt-4">
            ClearVoice processes all audio locally in your browser. No audio is ever sent to external servers.
          </p>
        </div>
      </div>
    </div>
  );
}