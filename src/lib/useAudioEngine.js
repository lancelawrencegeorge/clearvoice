import { useState, useRef, useCallback, useEffect } from 'react';
import { NoiseSuppressionEngine } from './audioEngine';

export function useAudioEngine() {
  const [status, setStatus] = useState('idle'); // idle, connecting, active, paused, error
  const [error, setError] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [suppressionLevel, setSuppressionLevel] = useState(70);
  const [frequencyData, setFrequencyData] = useState(new Uint8Array(0));
  const engineRef = useRef(null);
  const animFrameRef = useRef(null);

  const updateMetrics = useCallback(() => {
    if (engineRef.current && engineRef.current.isActive) {
      setAudioLevel(engineRef.current.getAudioLevel());
      setFrequencyData(new Uint8Array(engineRef.current.getFrequencyData()));
    }
    animFrameRef.current = requestAnimationFrame(updateMetrics);
  }, []);

  const start = useCallback(async () => {
    setStatus('connecting');
    setError(null);

    const engine = new NoiseSuppressionEngine();
    engine.setSuppressionLevel(suppressionLevel);

    try {
      await engine.initialize();
      engineRef.current = engine;
      setStatus('active');
      animFrameRef.current = requestAnimationFrame(updateMetrics);
    } catch (err) {
      setError(err.message || 'Failed to access microphone');
      setStatus('error');
      engine.destroy();
    }
  }, [suppressionLevel, updateMetrics]);

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
    if (engineRef.current) {
      engineRef.current.setSuppressionLevel(level);
    }
  }, []);

  const changeGain = useCallback((value) => {
    if (engineRef.current) {
      engineRef.current.setGain(value);
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
    start,
    stop,
    pause,
    resume,
    changeSuppressionLevel,
    changeGain
  };
}