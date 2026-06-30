import React, { useState } from 'react';
import { Headphones, Info, X, MonitorUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

export default function CustomerFilter({ active, error, onToggle }) {
  const [showHelp, setShowHelp] = useState(false);
  const [showPrep, setShowPrep] = useState(false);

  const handleToggleClick = () => {
    if (active) {
      onToggle();
    } else {
      setShowPrep(true);
    }
  };

  const handleConfirm = () => {
    setShowPrep(false);
    onToggle();
  };

  return (
    <div className="space-y-2">
      <div className={cn(
        "flex items-center justify-between p-4 rounded-xl border transition-colors",
        active ? "border-primary/30 bg-primary/5" : "border-border bg-secondary/50"
      )}>
        <div className="flex items-center gap-3">
          <Headphones className={cn("w-5 h-5", active ? "text-primary" : "text-muted-foreground")} />
          <div>
            <p className="font-medium text-sm">Customer Noise Filter</p>
            <p className="text-xs text-muted-foreground">
              {error ? error : active ? "Active — filtering customer audio" : "Filters background noise from the caller's audio"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHelp(s => !s)}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
            title="How to use"
          >
            <Info className="w-4 h-4" />
          </button>
          <button
            onClick={handleToggleClick}
            role="switch"
            aria-checked={active}
            className={cn(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0",
              active ? "bg-primary" : "bg-muted"
            )}
          >
            <span className={cn(
              "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
              active ? "translate-x-6" : "translate-x-1"
            )} />
          </button>
        </div>
      </div>

      {showHelp && !active && (
        <div className="relative p-3 rounded-lg bg-secondary/70 border border-border text-xs space-y-1.5">
          <button
            onClick={() => setShowHelp(false)}
            className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-3 h-3" />
          </button>
          <p className="font-medium text-sm mb-1">How to connect caller audio:</p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>Toggle the switch — a "Share your screen" dialog opens.</li>
            <li>Select the <strong className="text-foreground">Chrome Tab</strong> option (not Window or Entire Screen).</li>
            <li>Click your softphone tab (e.g. your VoIP/calling app tab).</li>
            <li>Turn <strong className="text-foreground">ON</strong> the "Also share tab audio" toggle at the bottom.</li>
            <li>Click <strong className="text-foreground">Share</strong>.</li>
          </ol>
          <p className="text-muted-foreground pt-1">
            The caller's audio is then filtered through RNNoise and played to your headset.
          </p>
        </div>
      )}

      <AlertDialog open={showPrep} onOpenChange={setShowPrep}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <MonitorUp className="w-5 h-5 text-primary" />
              </div>
              <AlertDialogTitle>Connect Caller Audio</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              When you continue, your browser will show a "Share your screen" dialog.
              Follow these steps to connect the caller's audio:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground my-2">
            <li>Select the <strong className="text-foreground">Chrome Tab</strong> option at the top.</li>
            <li>Click on your softphone / calling app tab.</li>
            <li>Turn <strong className="text-foreground">ON</strong> the "Also share tab audio" toggle at the bottom.</li>
            <li>Click <strong className="text-foreground">Share</strong>.</li>
          </ol>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              <MonitorUp className="w-4 h-4" />
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}