import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import jsPDF from 'jspdf';

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
    addTitle('ClearVoice — Installation & Test Guide');
    addBody('Follow the steps below to install the ClearVoice Chrome extension and run a successful noise suppression test.');
    addSpace();
    addDivider();

    addH2('What You\'ll Need');
    addBullet('Google Chrome (or Chromium-based browser: Edge, Brave, Arc)');
    addBullet('The ClearVoice extension folder (provided as a .zip — unzip it first)');
    addBullet('Access to your softphone platform in the browser');
    addSpace();

    addH2('Step 1: Install the Extension');
    addBullet('Open Chrome and go to chrome://extensions');
    addBullet('Toggle "Developer mode" ON (top-right corner)');
    addBullet('Click "Load unpacked"');
    addBullet('Select the ClearVoice folder you unzipped');
    addBullet('The ClearVoice icon should appear in your Chrome toolbar');
    addBody('✅ Success check: The extension card shows no errors and the icon is visible in the toolbar.', 10);
    addSpace();

    addH2('Step 2: Pin the Extension');
    addBullet('Click the puzzle piece icon in the Chrome toolbar');
    addBullet('Find ClearVoice and click the pin icon next to it');
    addBullet('The ClearVoice icon should now be permanently visible');
    addSpace();

    addH2('Step 3: Run a Test Call');
    addBullet('Open your softphone in Chrome (e.g. Genesys, Twilio Flex, RingCentral, etc.)');
    addBullet('Click the ClearVoice icon in the toolbar — the popup should open');
    addBullet('Click "Start" to activate noise suppression');
    addBullet('Make a test call (internal call to a colleague works fine)');
    addBullet('Have the other person confirm audio quality');
    addSpace();

    addH2('Step 4: A/B Test (Recommended)');
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
            <h1 className="text-2xl font-bold">Client Test Guide</h1>
            <p className="text-muted-foreground text-sm mt-1">Installation & testing instructions for ClearVoice</p>
          </div>
          <Button onClick={handleDownload} className="gap-2">
            <Download className="w-4 h-4" />
            Download PDF
          </Button>
        </div>

        <div className="space-y-8 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground">What You'll Need</h2>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Google Chrome (or Chromium-based browser: Edge, Brave, Arc)</li>
              <li>The ClearVoice extension folder (provided as a .zip — unzip it first)</li>
              <li>Access to your softphone platform in the browser</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">Step 1: Install the Extension</h2>
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
            <h2 className="text-lg font-semibold mb-3">Step 2: Pin the Extension</h2>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Click the puzzle piece icon (🧩) in the Chrome toolbar</li>
              <li>Find ClearVoice and click the pin icon next to it</li>
              <li>The ClearVoice icon should now be permanently visible</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">Step 3: Run a Test Call</h2>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Open your softphone in Chrome (e.g. Genesys, Twilio Flex, RingCentral, etc.)</li>
              <li>Click the ClearVoice icon in the toolbar — the popup should open</li>
              <li>Click <strong>"Start"</strong> to activate noise suppression</li>
              <li>Make a test call (internal call to a colleague works fine)</li>
              <li>Have the other person confirm audio quality</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">Step 4: A/B Test (Recommended)</h2>
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