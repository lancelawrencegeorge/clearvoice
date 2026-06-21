import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
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

    addH2('Option A: Install the ClearVoice App (Recommended)');
    addBody('The app installs as a standalone window — harder to accidentally close than a browser tab, and your settings persist between sessions.');
    addSpace();

    addH3('Step 1: Install the App');
    addBullet('Open the ClearVoice link in Chrome or Edge (Chromium-based browser required)');
    addBullet('Sign in with your work email');
    addBullet('On the Dashboard, click the "Install" button in the banner at the top');
    addBullet('Confirm the install prompt — ClearVoice opens in its own window');
    addBullet('Pin it to your taskbar / dock for quick access');
    addBody('✅ Success check: ClearVoice opens in a standalone window (no browser address bar).', 10);
    addSpace();

    addH3('Step 2: Start Your Day');
    addBullet('Open ClearVoice from your taskbar / dock');
    addBullet('Click "Start Session" once to grant microphone access');
    addBullet('Your saved suppression level and channel gains load automatically');
    addBullet('Minimize the window — the engine keeps running while you take calls');
    addSpace();

    addH3('Step 3: During Calls');
    addBullet('ClearVoice filters your mic in real time — no per-call action needed');
    addBullet('Adjust the Suppression slider if a call is noisy (higher = more aggressive)');
    addBullet('Use Pause if you need to step away; the engine auto-resumes when you return to the window');
    addSpace();

    addH3('Step 4: End of Day');
    addBullet('Just close the window — your session is logged automatically');
    addBullet('No need to click "End Session" — closing the window stops the engine and saves your session');
    addSpace();

    addDivider();
    addH2('Option B: Browser Extension (Advanced / Fallback)');
    addBody('For environments where the installable app isn\'t suitable, ClearVoice can also be loaded as a Chrome extension. This is intended for advanced users and IT-led pilots.');
    addSpace();

    addH3('What You\'ll Need');
    addBullet('Google Chrome (or Chromium-based browser: Edge, Brave, Arc)');
    addBullet('The ClearVoice extension folder (provided as a .zip — unzip it first)');
    addBullet('Access to your softphone platform in the browser');
    addSpace();

    addH3('Step 1: Install the Extension');
    addBullet('Open Chrome and go to chrome://extensions');
    addBullet('Toggle "Developer mode" ON (top-right corner)');
    addBullet('Click "Load unpacked"');
    addBullet('Select the ClearVoice folder you unzipped');
    addBullet('The ClearVoice icon should appear in your Chrome toolbar');
    addBody('✅ Success check: The extension card shows no errors and the icon is visible in the toolbar.', 10);
    addSpace();

    addH3('Step 2: Pin the Extension');
    addBullet('Click the puzzle piece icon in the Chrome toolbar');
    addBullet('Find ClearVoice and click the pin icon next to it');
    addBullet('The ClearVoice icon should now be permanently visible');
    addSpace();

    addH3('Step 3: Run a Test Call');
    addBullet('Open your softphone in Chrome (e.g. Genesys, Twilio Flex, RingCentral, etc.)');
    addBullet('Click the ClearVoice icon in the toolbar — the popup should open');
    addBullet('Click "Start" to activate noise suppression');
    addBullet('Make a test call (internal call to a colleague works fine)');
    addBullet('Have the other person confirm audio quality');
    addSpace();

    addH3('Step 4: A/B Test (Admin Build Only)');
    addBullet('In the ClearVoice popup, click "A/B Test"');
    addBullet('Click "Record Raw" — speak for ~10 seconds with background noise present');
    addBullet('Click "Record Clean" — repeat the same speech with ClearVoice active');
    addBullet('Play both recordings back and compare the difference');
    addSpace();

    addDivider();
    addH2('What to Look Out For');

    addH3('Signs the test is working correctly');
    addBullet('The visualizer in the popup shows audio activity when you speak');
    addBullet('The status indicator shows "Active" (not "Idle")');
    addBullet('Background noise is clearly reduced in the Clean recording vs Raw');
    addBullet('Your voice remains natural and clear — not robotic or muffled');
    addBullet('No noticeable audio delay (latency should be under ~20ms)');
    addSpace();

    addH3('Common issues to watch for');
    addBullet('Extension loads but audio doesn\'t activate — click "Start" before joining the call, or refresh and try again');
    addBullet('No difference between Raw and Clean — check the suppression slider is above 50%');
    addBullet('Voice sounds robotic — lower the suppression slider (try 60–70%) for a better balance');
    addBullet('Popup shows an error — right-click the extension icon → "Inspect popup" and send us the console output');
    addBullet('Extension not working on your softphone — confirm your softphone URL and let us know');
    addSpace();

    addDivider();
    addH2('Sending Us Feedback');
    addBody('Please share the following after your test:');
    addBullet('Which softphone platform you tested on');
    addBullet('A/B recordings (if captured)');
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

        {/* Option A: PWA Install */}
        <section className="border border-primary/30 rounded-xl p-6 space-y-6 mb-8 bg-primary/5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">Option A — Recommended</span>
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-2">Install the ClearVoice App</h2>
            <p className="text-sm text-muted-foreground">
              Installs as a standalone window — harder to accidentally close than a browser tab, and your settings persist between sessions.
            </p>
          </div>

          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-medium text-sm mb-2">Step 1: Install the App</h3>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Open the ClearVoice link in <strong>Chrome</strong> or <strong>Edge</strong></li>
                <li>Sign in with your work email</li>
                <li>On the Dashboard, click the <strong>"Install"</strong> button in the banner at the top</li>
                <li>Confirm the install prompt — ClearVoice opens in its own window</li>
                <li>Pin it to your taskbar / dock for quick access</li>
              </ol>
              <p className="mt-2 text-primary text-xs">✅ Success check: ClearVoice opens in a standalone window (no browser address bar).</p>
            </div>

            <div>
              <h3 className="font-medium text-sm mb-2">Step 2: Start Your Day</h3>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Open ClearVoice from your taskbar / dock</li>
                <li>Click <strong>"Start Session"</strong> once to grant microphone access</li>
                <li>Your saved suppression level and channel gains load automatically</li>
                <li>Minimize the window — the engine keeps running while you take calls</li>
              </ol>
            </div>

            <div>
              <h3 className="font-medium text-sm mb-2">Step 3: During Calls</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>ClearVoice filters your mic in real time — no per-call action needed</li>
                <li>Adjust the Suppression slider if a call is noisy (higher = more aggressive)</li>
                <li>Use <strong>Pause</strong> if you step away; the engine auto-resumes when you return to the window</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sm mb-2">Step 4: End of Day</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Just close the window — your session is logged automatically</li>
                <li>No need to click "End Session" — closing stops the engine and saves your session</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Option B: Browser Extension */}
        <div className="mb-3 flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Option B — Advanced / Fallback</span>
        </div>
        <h2 className="text-lg font-semibold mb-3">Browser Extension</h2>
        <p className="text-sm text-muted-foreground mb-6">
          For environments where the installable app isn't suitable, ClearVoice can also be loaded as a Chrome extension. Intended for advanced users and IT-led pilots.
        </p>

        {/* Extension Downloads */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="border border-border rounded-xl p-5 space-y-3">
            <div>
              <p className="font-semibold text-sm">Agent Build</p>
              <p className="text-xs text-muted-foreground mt-1">No A/B test. For production rollout to agents.</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1 gap-1 text-xs" onClick={() => downloadFile('popup.html', POPUP_HTML_AGENT)}>
                <Download className="w-3 h-3" /> popup.html
              </Button>
              <Button size="sm" variant="outline" className="flex-1 gap-1 text-xs" onClick={() => downloadFile('popup.js', POPUP_JS_AGENT)}>
                <Download className="w-3 h-3" /> popup.js
              </Button>
            </div>
          </div>
          <div className="border border-primary/30 rounded-xl p-5 space-y-3 bg-primary/5">
            <div>
              <p className="font-semibold text-sm">Admin Build</p>
              <p className="text-xs text-muted-foreground mt-1">Includes 🔬 A/B test. For QA and admin testing only.</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1 gap-1 text-xs" onClick={() => downloadFile('popup.html', POPUP_HTML_ADMIN)}>
                <Download className="w-3 h-3" /> popup.html
              </Button>
              <Button size="sm" variant="outline" className="flex-1 gap-1 text-xs" onClick={() => downloadFile('popup.js', POPUP_JS_ADMIN)}>
                <Download className="w-3 h-3" /> popup.js
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-8 text-sm leading-relaxed">
          <section>
            <h3 className="font-medium text-sm mb-2 text-muted-foreground uppercase tracking-wide">What You'll Need</h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Google Chrome (or Chromium-based browser: Edge, Brave, Arc)</li>
              <li>The ClearVoice extension folder (provided as a .zip — unzip it first)</li>
              <li>Access to your softphone platform in the browser</li>
            </ul>
          </section>

          <section>
            <h3 className="font-medium text-sm mb-2">Step 1: Install the Extension</h3>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Open Chrome and go to <code className="bg-secondary px-1 rounded text-xs">chrome://extensions</code></li>
              <li>Toggle <strong>"Developer mode"</strong> ON (top-right corner)</li>
              <li>Click <strong>"Load unpacked"</strong></li>
              <li>Select the ClearVoice folder you unzipped</li>
              <li>The ClearVoice icon should appear in your Chrome toolbar</li>
            </ol>
            <p className="mt-2 text-primary text-xs">✅ Success check: The extension card shows no errors and the icon is visible in the toolbar.</p>
          </section>

          <section>
            <h3 className="font-medium text-sm mb-2">Step 2: Pin the Extension</h3>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Click the puzzle piece icon (🧩) in the Chrome toolbar</li>
              <li>Find ClearVoice and click the pin icon next to it</li>
              <li>The ClearVoice icon should now be permanently visible</li>
            </ol>
          </section>

          <section>
            <h3 className="font-medium text-sm mb-2">Step 3: Run a Test Call</h3>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Open your softphone in Chrome (e.g. Genesys, Twilio Flex, RingCentral, etc.)</li>
              <li>Click the ClearVoice icon in the toolbar — the popup should open</li>
              <li>Click <strong>"Start"</strong> to activate noise suppression</li>
              <li>Make a test call (internal call to a colleague works fine)</li>
              <li>Have the other person confirm audio quality</li>
            </ol>
          </section>

          <section>
            <h3 className="font-medium text-sm mb-2">Step 4: A/B Test (Admin Build Only)</h3>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>In the ClearVoice popup, click <strong>"A/B Test"</strong></li>
              <li>Click <strong>"Record Raw"</strong> — speak for ~10 seconds with background noise present</li>
              <li>Click <strong>"Record Clean"</strong> — repeat the same speech with ClearVoice active</li>
              <li>Play both recordings back and compare</li>
            </ol>
          </section>

          <section className="border border-border rounded-xl p-5 space-y-4">
            <h2 className="text-lg font-semibold">What to Look Out For</h2>
            <div>
              <h3 className="font-medium text-sm mb-2 text-primary">Signs the test is working correctly</h3>
              <ul className="space-y-1 text-muted-foreground">
                <li>🟢 The visualizer shows audio activity when you speak</li>
                <li>🟢 Status indicator shows <strong>"Active"</strong></li>
                <li>🟢 Background noise is clearly reduced in Clean vs Raw recording</li>
                <li>🟢 Your voice sounds natural — not robotic or muffled</li>
                <li>🟢 No noticeable audio delay (under ~20ms)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-sm mb-2 text-destructive">Common issues to watch for</h3>
              <ul className="space-y-1 text-muted-foreground">
                <li>🔴 <strong>Audio doesn't activate</strong> — click "Start" before joining the call, or refresh and retry</li>
                <li>🔴 <strong>No difference in recordings</strong> — check suppression slider is above 50%</li>
                <li>🔴 <strong>Voice sounds robotic</strong> — lower suppression to 60–70%</li>
                <li>🔴 <strong>Popup shows an error</strong> — right-click icon → "Inspect popup" and send us the console output</li>
                <li>🔴 <strong>Not working on your softphone</strong> — let us know your platform URL</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">Sending Us Feedback</h2>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Which softphone platform you tested on</li>
              <li>A/B recordings (if captured)</li>
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