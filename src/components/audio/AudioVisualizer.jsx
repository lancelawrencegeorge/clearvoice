import React, { useRef, useEffect } from 'react';

export default function AudioVisualizer({ frequencyData, isActive, height = 120 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const h = rect.height;

    // Clear
    ctx.clearRect(0, 0, width, h);

    if (!isActive || frequencyData.length === 0) {
      // Draw idle line
      ctx.beginPath();
      ctx.strokeStyle = 'hsla(185, 80%, 55%, 0.15)';
      ctx.lineWidth = 1;
      ctx.moveTo(0, h / 2);
      ctx.lineTo(width, h / 2);
      ctx.stroke();
      return;
    }

    const barCount = Math.min(frequencyData.length, 64);
    const barWidth = width / barCount;
    const gap = 2;

    for (let i = 0; i < barCount; i++) {
      const value = frequencyData[i] / 255;
      const barHeight = Math.max(2, value * h * 0.85);
      const x = i * barWidth;
      const y = (h - barHeight) / 2;

      // Gradient from primary to a lighter shade
      const alpha = 0.3 + value * 0.7;
      ctx.fillStyle = `hsla(185, 80%, 55%, ${alpha})`;

      // Rounded bars
      const radius = Math.min((barWidth - gap) / 2, barHeight / 2, 3);
      const bw = barWidth - gap;

      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + bw - radius, y);
      ctx.quadraticCurveTo(x + bw, y, x + bw, y + radius);
      ctx.lineTo(x + bw, y + barHeight - radius);
      ctx.quadraticCurveTo(x + bw, y + barHeight, x + bw - radius, y + barHeight);
      ctx.lineTo(x + radius, y + barHeight);
      ctx.quadraticCurveTo(x, y + barHeight, x, y + barHeight - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.fill();
    }
  }, [frequencyData, isActive, height]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full rounded-lg"
      style={{ height: `${height}px` }}
    />
  );
}