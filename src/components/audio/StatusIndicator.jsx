import React from 'react';
import { cn } from '@/lib/utils';

const statusConfig = {
  idle: { label: 'Standby', color: 'bg-muted-foreground' },
  connecting: { label: 'Connecting...', color: 'bg-yellow-500' },
  active: { label: 'Active', color: 'bg-emerald-500' },
  paused: { label: 'Paused', color: 'bg-amber-500' },
  error: { label: 'Error', color: 'bg-destructive' }
};

export default function StatusIndicator({ status }) {
  const config = statusConfig[status] || statusConfig.idle;

  return (
    <div className="flex items-center gap-2.5">
      <div className="relative">
        <div className={cn("w-2.5 h-2.5 rounded-full", config.color)} />
        {(status === 'active' || status === 'connecting') && (
          <div className={cn(
            "absolute inset-0 w-2.5 h-2.5 rounded-full animate-ping opacity-75",
            config.color
          )} />
        )}
      </div>
      <span className="text-sm font-medium text-muted-foreground tracking-wide uppercase">
        {config.label}
      </span>
    </div>
  );
}