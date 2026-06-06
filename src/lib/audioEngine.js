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

    // [0] High-pass filter — remove low-frequency rumble/hum below 80Hz
    // Does NOT touch voice (voice starts at ~100Hz)
    const highPass = ctx.createBiquadFilter();
    highPass.type = 'highpass';
    highPass.frequency.value = 80;
    highPass.Q.value = 0.5;
    this.filters.push(highPass);

    // [1] Notch filter at 50Hz (EU mains hum) — surgical, doesn't affect voice
    const notch50 = ctx.createBiquadFilter();
    notch50.type = 'notch';
    notch50.frequency.value = 50;
    notch50.Q.value = 30;
    this.filters.push(notch50);

    // [2] Notch filter at 60Hz (US mains hum) — surgical, doesn't affect voice
    const notch60 = ctx.createBiquadFilter();
    notch60.type = 'notch';
    notch60.frequency.value = 60;
    notch60.Q.value = 30;
    this.filters.push(notch60);

    // [3] Low-shelf cut to gently reduce low-end noise (below 200Hz)
    // Voice fundamentals are mostly above 150Hz — this is gentle, not a bandpass
    const lowShelf = ctx.createBiquadFilter();
    lowShelf.type = 'lowshelf';
    lowShelf.frequency.value = 200;
    lowShelf.gain.value = -6; // reduce but not eliminate
    this.filters.push(lowShelf);

    // [4] High-shelf cut to reduce high-frequency hiss (above 8kHz)
    // Voice intelligibility lives below 8kHz, so this only removes air/hiss
    const highShelf = ctx.createBiquadFilter();
    highShelf.type = 'highshelf';
    highShelf.frequency.value = 8000;
    highShelf.gain.value = -12;
    this.filters.push(highShelf);

    // [5] Subtle presence boost in voice clarity range (1kHz–4kHz)
    const presence = ctx.createBiquadFilter();
    presence.type = 'peaking';
    presence.frequency.value = 2500;
    presence.gain.value = 2;
    presence.Q.value = 0.8;
    this.filters.push(presence);

    // Dynamics compressor — gentle, just to even out volume spikes
    this.compressor = ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -18;
    this.compressor.knee.value = 20;
    this.compressor.ratio.value = 3;
    this.compressor.attack.value = 0.01;
    this.compressor.release.value = 0.15;

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

    // [0] High-pass: raise cutoff slightly with more suppression (80Hz → 120Hz max)
    // Stays well below voice fundamentals (150Hz+)
    if (this.filters[0]) {
      this.filters[0].frequency.value = 80 + (level * 40);
    }

    // [3] Low-shelf: cut more low-end noise at higher suppression levels (-6 → -18dB)
    // Still leaves voice fundamentals intact
    if (this.filters[3]) {
      this.filters[3].gain.value = -6 - (level * 12);
    }

    // [4] High-shelf: cut more hiss at higher suppression levels (-12 → -24dB)
    // Voice intelligibility is below 8kHz so this is safe
    if (this.filters[4]) {
      this.filters[4].gain.value = -12 - (level * 12);
    }

    // Compressor: tighten slightly at higher suppression to reduce noise bursts
    if (this.compressor) {
      this.compressor.threshold.value = -18 - (level * 8);
      this.compressor.ratio.value = 3 + (level * 2);
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