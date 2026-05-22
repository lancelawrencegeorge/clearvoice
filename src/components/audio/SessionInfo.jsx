import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Clock, Shield, Cpu, Wifi } from 'lucide-react';

export default function SessionInfo({ status, startTime }) {
  const [elapsed, setElapsed] = useState('00:00:00');

  useEffect(() => {
    if (status !== 'active' || !startTime) {
      setElapsed('00:00:00');
      return;
    }

    const interval = setInterval(() => {
      const diff = Date.now() - startTime;
      const h = String(Math.floor(diff / 3600000)).padStart(2, '0');
      const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
      setElapsed(`${h}:${m}:${s}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [status, startTime]);

  const stats = [
    { icon: Clock, label: 'Session Time', value: elapsed },
    { icon: Shield, label: 'Encryption', value: 'Local Only' },
    { icon: Cpu, label: 'Processing', value: 'Browser' },
    { icon: Wifi, label: 'Latency', value: '< 10ms' }
  ];

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border/50 p-5">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
        Session Details
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {stats.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-sm font-mono font-medium">{value}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}