// Core audio processing engine using Web Audio API
// Handles noise suppression via biquad filters and dynamics compressor

export class NoiseSuppressionEngine {
  constructor() {
    this.audioContext = null;
    this.micStream = null;
    this.sourceNode = null;
    this.analyserNode = null;
    this.gainNode = null;
    this.filters = [];
    this.compressor = null;
    this.isActive = false;
    this.suppressionLevel = 70; // 0-100
    this.onAudioData = null;
  }

  async initialize() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
      sampleRate: 48000,
      latencyHint: 'interactive'
    });

    // Request microphone access
    this.micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true, // Browser native
        autoGainControl: true,
        channelCount: 1,
        sampleRate: 48000
      }
    });

    this.sourceNode = this.audioContext.createMediaStreamSource(this.micStream);
    this._buildFilterChain();
    this.isActive = true;

    return this.micStream;
  }

  _buildFilterChain() {
    // Clear existing filters
    this.filters.forEach(f => f.disconnect());
    this.filters = [];

    const ctx = this.audioContext;

    // High-pass filter — remove rumble/hum below 80Hz
    const highPass = ctx.createBiquadFilter();
    highPass.type = 'highpass';
    highPass.frequency.value = 80;
    highPass.Q.value = 0.7;
    this.filters.push(highPass);

    // Notch filter at 50Hz (mains hum)
    const notch50 = ctx.createBiquadFilter();
    notch50.type = 'notch';
    notch50.frequency.value = 50;
    notch50.Q.value = 10;
    this.filters.push(notch50);

    // Notch filter at 60Hz (mains hum US)
    const notch60 = ctx.createBiquadFilter();
    notch60.type = 'notch';
    notch60.frequency.value = 60;
    notch60.Q.value = 10;
    this.filters.push(notch60);

    // Bandpass to focus on voice frequencies (300Hz - 3400Hz telephony range)
    const voiceBand = ctx.createBiquadFilter();
    voiceBand.type = 'bandpass';
    voiceBand.frequency.value = 1500;
    voiceBand.Q.value = 0.5;
    this.filters.push(voiceBand);

    // Peaking EQ to boost presence (2-4kHz)
    const presence = ctx.createBiquadFilter();
    presence.type = 'peaking';
    presence.frequency.value = 3000;
    presence.gain.value = 3;
    presence.Q.value = 1;
    this.filters.push(presence);

    // Low-pass to cut harsh highs
    const lowPass = ctx.createBiquadFilter();
    lowPass.type = 'lowpass';
    lowPass.frequency.value = 8000;
    lowPass.Q.value = 0.7;
    this.filters.push(lowPass);

    // Dynamics compressor for leveling
    this.compressor = ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -24;
    this.compressor.knee.value = 12;
    this.compressor.ratio.value = 4;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.25;

    // Gain node
    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = 1.0;

    // Analyser for visualization
    this.analyserNode = ctx.createAnalyser();
    this.analyserNode.fftSize = 256;
    this.analyserNode.smoothingTimeConstant = 0.8;

    // Chain: source -> filters -> compressor -> gain -> analyser -> destination
    let prev = this.sourceNode;
    this.filters.forEach(filter => {
      prev.connect(filter);
      prev = filter;
    });
    prev.connect(this.compressor);
    this.compressor.connect(this.gainNode);
    this.gainNode.connect(this.analyserNode);

    // Connect to destination so it processes (but audio goes through system normally)
    this.analyserNode.connect(this.audioContext.destination);

    this._applySuppressionLevel();
  }

  _applySuppressionLevel() {
    const level = this.suppressionLevel / 100;

    // Adjust highpass cutoff based on suppression level (80-200Hz)
    if (this.filters[0]) {
      this.filters[0].frequency.value = 80 + (level * 120);
    }

    // Adjust bandpass Q (wider = more aggressive)
    if (this.filters[3]) {
      this.filters[3].Q.value = 0.3 + (level * 0.7);
    }

    // Adjust compressor threshold
    if (this.compressor) {
      this.compressor.threshold.value = -24 - (level * 16);
    }

    // Adjust lowpass cutoff
    if (this.filters[5]) {
      this.filters[5].frequency.value = 8000 - (level * 3000);
    }
  }

  setSuppressionLevel(level) {
    this.suppressionLevel = Math.max(0, Math.min(100, level));
    if (this.isActive) {
      this._applySuppressionLevel();
    }
  }

  setGain(value) {
    if (this.gainNode) {
      this.gainNode.gain.value = value;
    }
  }

  getFrequencyData() {
    if (!this.analyserNode) return new Uint8Array(0);
    const data = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.analyserNode.getByteFrequencyData(data);
    return data;
  }

  getTimeDomainData() {
    if (!this.analyserNode) return new Uint8Array(0);
    const data = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.analyserNode.getByteTimeDomainData(data);
    return data;
  }

  getAudioLevel() {
    const data = this.getTimeDomainData();
    if (data.length === 0) return 0;
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const value = (data[i] - 128) / 128;
      sum += value * value;
    }
    return Math.sqrt(sum / data.length);
  }

  pause() {
    if (this.audioContext && this.audioContext.state === 'running') {
      this.audioContext.suspend();
      this.isActive = false;
    }
  }

  resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
      this.isActive = true;
    }
  }

  destroy() {
    this.isActive = false;
    if (this.micStream) {
      this.micStream.getTracks().forEach(track => track.stop());
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
    this.filters = [];
    this.sourceNode = null;
    this.analyserNode = null;
    this.gainNode = null;
    this.compressor = null;
  }
}