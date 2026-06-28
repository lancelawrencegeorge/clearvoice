import { useState, useRef, useCallback, useEffect } from 'react';
import { NoiseSuppressionEngine } from './audioEngine';

export function useAudioEngine() {
  const [status, setStatus] = useState('idle'); // idle, connecting, active, paused, error
  const [error, setError] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [suppressionLevel, setSuppressionLevel] = useState(() => {
    try {
      const saved = localStorage.getItem('clearvoice_suppression');
      return saved ? Number(saved) : 70;
    } catch { return 70; }
  });
  const [frequencyData, setFrequencyData] = useState(new Uint8Array(0));
  const [outputDevices, setOutputDevices] = useState([]);
  const [selectedOutputDevice, setSelectedOutputDevice] = useState(() => {
    try {
      return localStorage.getItem('clearvoice_output_device') || 'default';
    } catch { return 'default'; }
  });
  const [setSinkIdSupported] = useState(() => typeof HTMLMediaElement.prototype.setSinkId === 'function');
  const engineRef = useRef(null);
  const animFrameRef = useRef(null);

  const refreshOutputDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      setOutputDevices(devices.filter((d) => d.kind === 'audiooutput'));
    } catch {}
  }, []);

  const updateMetrics = useCallback(() => {
    if (engineRef.current && engineRef.current.isActive) {
      setAudioLevel(engineRef.current.getAudioLevel());
      setFrequencyData(new Uint8Array(engineRef.current.getFrequencyData()));
    }
    animFrameRef.current = requestAnimationFrame(updateMetrics);
  }, []);

  useEffect(() => {
    refreshOutputDevices();
    if (navigator.mediaDevices?.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', refreshOutputDevices);
      return () => navigator.mediaDevices.removeEventListener('devicechange', refreshOutputDevices);
    }
  }, [refreshOutputDevices]);

  const start = useCallback(async () => {
    setStatus('connecting');
    setError(null);

    const engine = new NoiseSuppressionEngine();
    engine.setSuppressionLevel(suppressionLevel);

    try {
      await engine.initialize({
        outputDeviceId: selectedOutputDevice !== 'default' ? selectedOutputDevice : undefined,
      });
      engineRef.current = engine;
      setStatus('active');
      animFrameRef.current = requestAnimationFrame(updateMetrics);
      refreshOutputDevices();
    } catch (err) {
      setError(err.message || 'Failed to access microphone');
      setStatus('error');
      engine.destroy();
    }
  }, [suppressionLevel, updateMetrics, selectedOutputDevice, refreshOutputDevices]);

  const stop = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    if (engineRef.current) {
      engineRef.current.destroy();
      engineRef.current = null;
    }
    setStatus('idle');
    setAudioLevel(0);
    setFrequencyData(new Uint8Array(0));
  }, []);

  const pause = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.pause();
      setStatus('paused');
    }
  }, []);

  const resume = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.resume();
      setStatus('active');
    }
  }, []);

  const changeSuppressionLevel = useCallback((level) => {
    setSuppressionLevel(level);
    try { localStorage.setItem('clearvoice_suppression', String(level)); } catch {}
    if (engineRef.current) {
      engineRef.current.setSuppressionLevel(level);
    }
  }, []);

  const changeGain = useCallback((value) => {
    if (engineRef.current) {
      engineRef.current.setGain(value);
    }
  }, []);

  const changeOutputDevice = useCallback(async (deviceId) => {
    setSelectedOutputDevice(deviceId);
    try { localStorage.setItem('clearvoice_output_device', deviceId); } catch {}
    if (engineRef.current) {
      try {
        await engineRef.current.setOutputDevice(deviceId === 'default' ? '' : deviceId);
      } catch (e) {
        setError('Failed to switch output device: ' + (e.message || ''));
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (engineRef.current) engineRef.current.destroy();
    };
  }, []);

  return {
    status,
    error,
    audioLevel,
    frequencyData,
    suppressionLevel,
    outputDevices,
    selectedOutputDevice,
    setSinkIdSupported,
    start,
    stop,
    pause,
    resume,
    changeSuppressionLevel,
    changeGain,
    changeOutputDevice,
    refreshOutputDevices
  };
}