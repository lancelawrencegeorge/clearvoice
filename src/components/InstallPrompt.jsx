import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X, Monitor } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function InstallPrompt({ canInstall, onInstall, onDismiss }) {
  const [dismissed, setDismissed] = useState(false);
  const show = canInstall && !dismissed;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mb-6 p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-start gap-3"
        >
          <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
            <Monitor className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Install ClearVoice as an app</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Runs in its own window so it stays on during calls — harder to accidentally close.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" onClick={onInstall} className="gap-2">
              <Download className="w-3.5 h-3.5" />
              Install
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => { setDismissed(true); onDismiss?.(); }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}