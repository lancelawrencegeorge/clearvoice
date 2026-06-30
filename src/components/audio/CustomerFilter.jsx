import React from 'react';
import { Headphones } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CustomerFilter({ active, error, onToggle }) {
  return (
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
      <button
        onClick={onToggle}
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
  );
}