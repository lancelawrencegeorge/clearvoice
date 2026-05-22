import React from 'react';
import { cn } from '@/lib/utils';

export default function LevelMeter({ level, label }) {
  const percentage = Math.min(100, Math.round(level * 400)); // Amplify for visibility
  
  const getColor = () => {
    if (percentage > 80) return 'bg-destructive';
    if (percentage > 50) return 'bg-amber-500';
    return 'bg-primary';
  };

  return (
    <div className="space-y-1.5">
      {label && (
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground font-medium">{label}</span>
          <span className="text-xs font-mono text-muted-foreground">{percentage}%</span>
        </div>
      )}
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-75", getColor())}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}