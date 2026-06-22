// RNNoise-powered audio engine using AudioWorklet + @jitsi/rnnoise-wasm
// RNNoise uses a recurrent neural network trained to separate voice from noise —
// this works on call-centre background voices unlike simple biquad filters.

const RNNOISE_CDN = 'https://cdn.jsdelivr.net/npm/@jitsi/rnnoise-wasm@0.2.0/dist/rnnoise-sync.js';

// The AudioWorklet processor code (runs in a separate thread)
// We inline it as a string so it can be loaded via a Blob URL — no separate file needed.
const WORKLET_CODE = `
// Load RNNoise sync WASM inside the worklet thread
let rnnoiseModule = null;
let denoiseState = null;
const FRAME_SIZE = 480;
let inputBuffer = new Float32Array(FRAME_SIZE);
let inputFilled = 0;
let outputBuffer = new Float32Array(FRAME_SIZE);
let outputFilled = 0;
let outputRead = 0;
let suppressionLevel = 0.7; // 0-1, used as a blend factor

async function initRNNoise() {
  try {
    importScripts('${RNNOISE_CDN}');
    rnnoiseModule = await createRNNoise();
    denoiseState = rnnoiseModule.newState();
  } catch(e) {
    console.error('[ClearVoice Worklet] RNNoise init failed:', e);
  }
}

class RNNoiseProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    initRNNoise().catch(e => console.error('[ClearVoice Worklet] RNNoise init failed:', e));
    this.port.onmessage = (e) => {
      if (e.data.type === 'SET_LEVEL') {
        suppressionLevel = e.data.level;
      }
    };
  }

  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];

    if (!input || !input[0] || !output || !output[0]) return true;

    const inputCh = input[0];
    const outputCh = output[0];

    if (!rnnoiseModule || !denoiseState) {
      // RNNoise not ready yet — pass through
      outputCh.set(inputCh);
      return true;
    }

    // Feed input samples into our buffer, process 480-sample frames
    for (let i = 0; i < inputCh.length; i++) {
      inputBuffer[inputFilled++] = inputCh[i];

      if (inputFilled >= FRAME_SIZE) {
        // Convert float32 -> int16 (RNNoise expects PCM)
        const pcm = new Int16Array(FRAME_SIZE);
        for (let j = 0; j < FRAME_SIZE; j++) {
          const s = Math.max(-1, Math.min(1, inputBuffer[j]));
          pcm[j] = s < 0 ? s * 32768 : s * 32767;
        }

        // Run RNNoise — this modifies pcm in place
        rnnoiseModule.processFrame(denoiseState, pcm);

        // Convert back to float32 and store in output ring
        const denoised = new Float32Array(FRAME_SIZE);
        for (let j = 0; j < FRAME_SIZE; j++) {
          denoised[j] = pcm[j] / 32768;
        }

        // Blend denoised with dry signal based on suppression level
        for (let j = 0; j < FRAME_SIZE; j++) {
          outputBuffer[j] = denoised[j] * suppressionLevel + inputBuffer[j] * (1 - suppressionLevel);
        }

        outputFilled = FRAME_SIZE;
        outputRead = 0;
        inputFilled = 0;
      }
    }

    // Write from output ring to output channel
    for (let i = 0; i < outputCh.length; i++) {
      if (outputRead < outputFilled) {
        outputCh[i] = outputBuffer[outputRead++];
      } else {
        outputCh[i] = inputCh[i]; // fallback: passthrough while buffer fills
      }
    }

    return true;
  }
}

registerProcessor('rnnoise-processor', RNNoiseProcessor);
`;

export class NoiseSuppressionEngine {
  constructor() {
    this.audioContext = null;
    this.micStream = null;
    this.sourceNode = null;
    this.analyserNode = null;
    this.gainNode = null;
    this.workletNode = null;
    this.isActive = false;
    this.suppressionLevel = 70; // 0-100
  }

  async initialize() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
      sampleRate: 48000, // RNNoise requires 48kHz
      latencyHint: 'interactive'
    });

    // Load the worklet from a Blob URL (no separate file needed)
    const blob = new Blob([WORKLET_CODE], { type: 'application/javascript' });
    const workletUrl = URL.createObjectURL(blob);
    await this.audioContext.audioWorklet.addModule(workletUrl);
    URL.revokeObjectURL(workletUrl);

    // Request microphone
    this.micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false, // Let RNNoise handle it
        noiseSuppression: false,
        autoGainControl: false,
        channelCount: 1,
        sampleRate: 48000
      }
    });

    this.sourceNode = this.audioContext.createMediaStreamSource(this.micStream);

    // RNNoise AudioWorklet node
    this.workletNode = new AudioWorkletNode(this.audioContext, 'rnnoise-processor', {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [1]
    });
    this.workletNode.port.postMessage({ type: 'SET_LEVEL', level: this.suppressionLevel / 100 });

    // Gain node
    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = 1.0;

    // Analyser for visualization
    this.analyserNode = this.audioContext.createAnalyser();
    this.analyserNode.fftSize = 256;
    this.analyserNode.smoothingTimeConstant = 0.8;

    // Chain: mic -> RNNoise worklet -> gain -> analyser -> destination
    this.sourceNode.connect(this.workletNode);
    this.workletNode.connect(this.gainNode);
    this.gainNode.connect(this.analyserNode);
    this.analyserNode.connect(this.audioContext.destination);

    this.isActive = true;
    return this.micStream;
  }

  setSuppressionLevel(level) {
    this.suppressionLevel = Math.max(0, Math.min(100, level));
    if (this.workletNode) {
      this.workletNode.port.postMessage({ type: 'SET_LEVEL', level: this.suppressionLevel / 100 });
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
    this.sourceNode = null;
    this.workletNode = null;
    this.gainNode = null;
    this.analyserNode = null;
  }
}