import React from 'react';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import LevelMeter from './LevelMeter';
import AudioVisualizer from './AudioVisualizer';
import { cn } from '@/lib/utils';

export default function ChannelCard({
  title,
  icon: Icon,
  isActive,
  audioLevel,
  frequencyData,
  suppressionLevel,
  onSuppressionChange,
  gain,
  onGainChange
}) {
  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border/50 overflow-hidden">
      {/* Top glow line when active */}
      <div className={cn(
        "h-0.5 transition-all duration-500",
        isActive ? "bg-gradient-to-r from-transparent via-primary to-transparent opacity-100" : "opacity-0"
      )} />

      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-300",
              isActive ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"
            )}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">{title}</h3>
              <p className="text-xs text-muted-foreground">
                {isActive ? 'Processing' : 'Inactive'}
              </p>
            </div>
          </div>
          <Badge
            variant={isActive ? "default" : "secondary"}
            className={cn(
              "text-xs",
              isActive && "bg-primary/15 text-primary border-primary/30 hover:bg-primary/20"
            )}
          >
            {isActive ? 'ON' : 'OFF'}
          </Badge>
        </div>

        {/* Visualizer */}
        <div className="bg-background/50 rounded-lg p-3 border border-border/30">
          <AudioVisualizer
            frequencyData={frequencyData}
            isActive={isActive}
            height={80}
          />
        </div>

        {/* Level Meter */}
        <LevelMeter level={audioLevel} label="Input Level" />

        {/* Suppression Control */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground font-medium">
              Noise Suppression
            </span>
            <span className="text-xs font-mono text-primary">{suppressionLevel}%</span>
          </div>
          <Slider
            value={[suppressionLevel]}
            onValueChange={(v) => onSuppressionChange(v[0])}
            max={100}
            min={0}
            step={1}
            className="w-full"
          />
        </div>

        {/* Gain Control */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground font-medium">
              Volume
            </span>
            <span className="text-xs font-mono text-muted-foreground">
              {Math.round(gain * 100)}%
            </span>
          </div>
          <Slider
            value={[gain * 100]}
            onValueChange={(v) => onGainChange(v[0] / 100)}
            max={150}
            min={0}
            step={1}
            className="w-full"
          />
        </div>
      </div>
    </Card>
  );
}