import React, { useState, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, Square, Play, FlaskConical, CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

const RECORD_SECONDS = 8;

export default function TestPanel({ isEngineActive }) {
  const [phase, setPhase] = useState('idle'); // idle | recording-raw | recorded-raw | recording-clean | done
  const [countdown, setCountdown] = useState(0);
  const [rawUrl, setRawUrl] = useState(null);
  const [cleanUrl, setCleanUrl] = useState(null);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const startRecording = useCallback(async (withSuppression) => {
    chunksRef.current = [];

    // Get mic stream — suppression flag is set via browser constraints
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: withSuppression,
        noiseSuppression: withSuppression,
        autoGainControl: withSuppression,
      }
    });

    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      stream.getTracks().forEach(t => t.stop());
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      const url = URL.createObjectURL(blob);
      if (withSuppression) {
        setCleanUrl(url);
        setPhase('done');
      } else {
        setRawUrl(url);
        setPhase('recorded-raw');
      }
    };

    recorder.start();
    setPhase(withSuppression ? 'recording-clean' : 'recording-raw');
    setCountdown(RECORD_SECONDS);

    let remaining = RECORD_SECONDS;
    timerRef.current = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(timerRef.current);
        recorder.stop();
      }
    }, 1000);
  }, []);

  const stopEarly = useCallback(() => {
    clearInterval(timerRef.current);
    mediaRecorderRef.current?.stop();
  }, []);

  const reset = useCallback(() => {
    if (rawUrl) URL.revokeObjectURL(rawUrl);
    if (cleanUrl) URL.revokeObjectURL(cleanUrl);
    setRawUrl(null);
    setCleanUrl(null);
    setPhase('idle');
    setCountdown(0);
  }, [rawUrl, cleanUrl]);

  const isRecording = phase === 'recording-raw' || phase === 'recording-clean';

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border/50 p-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <FlaskConical className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">A/B Test Recorder</h3>
          <p className="text-xs text-muted-foreground">Record & compare with/without suppression</p>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3 mb-5">
        <Step
          number={1}
          label="Record WITHOUT suppression"
          description="Capture your voice + background noise as-is"
          done={!!rawUrl || phase === 'recording-raw' || phase === 'recorded-raw' || phase === 'recording-clean' || phase === 'done'}
          active={phase === 'recording-raw'}
        />
        <Step
          number={2}
          label="Record WITH suppression"
          description="Same environment, noise filtered out"
          done={!!cleanUrl || phase === 'done'}
          active={phase === 'recording-clean'}
        />
        <Step
          number={3}
          label="Compare playback"
          description="Listen to both and hear the difference"
          done={phase === 'done'}
          active={phase === 'done'}
        />
      </div>

      {/* Recording indicator */}
      {isRecording && (
        <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
          <div className="w-2.5 h-2.5 rounded-full bg-destructive animate-pulse" />
          <span className="text-sm font-medium text-destructive">
            Recording {phase === 'recording-raw' ? '(raw)' : '(clean)'} — {countdown}s remaining
          </span>
          <Button size="sm" variant="destructive" className="ml-auto h-7 text-xs" onClick={stopEarly}>
            <Square className="w-3 h-3 mr-1" /> Stop
          </Button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {phase === 'idle' && (
          <Button onClick={() => startRecording(false)} className="gap-2">
            <Mic className="w-4 h-4" />
            Start Step 1 (Raw)
          </Button>
        )}
        {phase === 'recorded-raw' && (
          <Button onClick={() => startRecording(true)} className="gap-2">
            <Mic className="w-4 h-4" />
            Start Step 2 (Clean)
          </Button>
        )}
        {phase === 'done' && (
          <Button variant="outline" onClick={reset} className="gap-2 text-xs">
            Reset & Re-test
          </Button>
        )}
      </div>

      {/* Playback */}
      {(rawUrl || cleanUrl) && (
        <div className="space-y-3">
          {rawUrl && (
            <PlaybackRow label="Without Suppression" url={rawUrl} variant="raw" />
          )}
          {cleanUrl && (
            <PlaybackRow label="With Suppression" url={cleanUrl} variant="clean" />
          )}
        </div>
      )}
    </Card>
  );
}

function Step({ number, label, description, done, active }) {
  return (
    <div className={cn(
      "flex items-start gap-3 p-3 rounded-lg transition-colors",
      active && "bg-primary/5 border border-primary/20",
      !active && "border border-transparent"
    )}>
      <div className={cn(
        "w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold",
        done ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
      )}>
        {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : number}
      </div>
      <div>
        <p className={cn("text-sm font-medium", active && "text-primary")}>{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function PlaybackRow({ label, url, variant }) {
  return (
    <div className={cn(
      "p-3 rounded-xl border",
      variant === 'raw' ? "border-destructive/20 bg-destructive/5" : "border-primary/20 bg-primary/5"
    )}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold">{label}</span>
        <Badge
          variant="outline"
          className={cn(
            "text-xs",
            variant === 'raw' ? "border-destructive/30 text-destructive" : "border-primary/30 text-primary"
          )}
        >
          {variant === 'raw' ? 'Raw' : 'Processed'}
        </Badge>
      </div>
      <audio controls src={url} className="w-full h-8" style={{ height: '32px' }} />
    </div>
  );
}