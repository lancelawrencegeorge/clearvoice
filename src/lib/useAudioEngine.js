import { useState, useRef, useCallback, useEffect } from 'react';
import { NoiseSuppressionEngine } from './audioEngine';

export function useAudioEngine() {
  const [status, setStatus] = useState('idle'); // idle, connecting, active, paused, error
  const [error, setError] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [suppressionLevel, setSuppressionLevel] = useState(() => {
    try {
      const saved = localStorage.getItem('clearvoice_suppression');
      const val = saved ? Number(saved) : 70;
      return Math.max(5, Math.min(95, isNaN(val) ? 70 : val));
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
  const [customerFilterActive, setCustomerFilterActive] = useState(false);
  const [customerFilterError, setCustomerFilterError] = useState(null);
  const engineRef = useRef(null);
  const customerEngineRef = useRef(null);
  const animFrameRef = useRef(null);

  const refreshOutputDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      setOutputDevices(devices.filter((d) => d.kind === 'audiooutput' && d.deviceId));
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
    // Clamp to the safe range (5-95%) before signalling the worklet.
    const startLevel = Math.max(5, Math.min(95, suppressionLevel));
    engine.setSuppressionLevel(startLevel);

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
    // Guard: never let suppression drop below 5% or rise above 95% —
    // 0% = pure dry (noise) and 100% distorts, so clamp to the safe range.
    const safeLevel = Math.max(5, Math.min(95, level));
    setSuppressionLevel(safeLevel);
    try { localStorage.setItem('clearvoice_suppression', String(safeLevel)); } catch {}
    if (engineRef.current) {
      engineRef.current.setSuppressionLevel(safeLevel);
    }
    if (customerEngineRef.current) {
      customerEngineRef.current.setCustomerFilterLevel(safeLevel);
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

  const startCustomerFilter = useCallback(async () => {
    setCustomerFilterError(null);
    try {
      const engine = new NoiseSuppressionEngine();
      engine.setSuppressionLevel(suppressionLevel);
      await engine.startCustomerFilter({
        outputDeviceId: selectedOutputDevice !== 'default' ? selectedOutputDevice : undefined,
      });
      customerEngineRef.current = engine;
      setCustomerFilterActive(true);
    } catch (err) {
      setCustomerFilterError(err.message || 'Failed to start customer filter');
      setCustomerFilterActive(false);
    }
  }, [suppressionLevel, selectedOutputDevice]);

  const stopCustomerFilter = useCallback(() => {
    if (customerEngineRef.current) {
      customerEngineRef.current.stopCustomerFilter();
      customerEngineRef.current = null;
    }
    setCustomerFilterActive(false);
  }, []);

  const toggleCustomerFilter = useCallback(() => {
    if (customerFilterActive) {
      stopCustomerFilter();
    } else {
      startCustomerFilter();
    }
  }, [customerFilterActive, startCustomerFilter, stopCustomerFilter]);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (engineRef.current) engineRef.current.destroy();
      if (customerEngineRef.current) {
        customerEngineRef.current.stopCustomerFilter();
        customerEngineRef.current = null;
      }
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
    customerFilterActive,
    customerFilterError,
    toggleCustomerFilter,
    refreshOutputDevices
  };
}