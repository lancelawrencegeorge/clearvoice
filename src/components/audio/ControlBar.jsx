import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Square, Power } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ControlBar({ status, onStart, onStop, onPause, onResume }) {
  const isIdle = status === 'idle' || status === 'error';
  const isActive = status === 'active';
  const isPaused = status === 'paused';
  const isConnecting = status === 'connecting';

  return (
    <div className="flex items-center gap-3">
      {isIdle && (
        <Button
          onClick={onStart}
          size="lg"
          className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 px-8 shadow-lg shadow-primary/20"
        >
          <Power className="w-4 h-4" />
          Start Session
        </Button>
      )}

      {isConnecting && (
        <Button size="lg" disabled className="gap-2 px-8">
          <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
          Connecting...
        </Button>
      )}

      {isActive && (
        <>
          <Button
            onClick={onPause}
            variant="secondary"
            size="lg"
            className="gap-2"
          >
            <Pause className="w-4 h-4" />
            Pause
          </Button>
          <Button
            onClick={onStop}
            variant="destructive"
            size="lg"
            className="gap-2"
          >
            <Square className="w-4 h-4" />
            End Session
          </Button>
        </>
      )}

      {isPaused && (
        <>
          <Button
            onClick={onResume}
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
          >
            <Play className="w-4 h-4" />
            Resume
          </Button>
          <Button
            onClick={onStop}
            variant="destructive"
            size="lg"
            className="gap-2"
          >
            <Square className="w-4 h-4" />
            End Session
          </Button>
        </>
      )}
    </div>
  );
}