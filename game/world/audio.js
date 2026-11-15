/**
 * SOLIQ: The Seventh Field - Web Audio Procedural Sound Synthesizer
 * Zero external audio files required: 100% offline, zero-latency, authentic Delta atmosphere.
 * Synthesizes diesel engine, rushing canal water, bird calls, and mechanical SFX.
 */

export class DeltaAudioSynthesizer {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.isMuted = false;
    this.engineGain = null;
    this.engineOsc = null;
    this.waterGain = null;
    this.waterFilter = null;
    this.ambienceGain = null;
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      this.ctx = new AudioContext();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this._setupEngineSynth();
      this._setupWaterSynth();
      this._setupAmbienceSynth();
      this.isInitialized = true;
    } catch (err) {
      console.warn('[AudioSynth] Web Audio not allowed or failed:', err);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  _setupEngineSynth() {
    // Lister single-cylinder diesel motor combustion sound
    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0.0, this.ctx.currentTime); // Off by default

    // Low-frequency periodic thump (18 Hz - 28 Hz)
    const engineFilter = this.ctx.createBiquadFilter();
    engineFilter.type = 'lowpass';
    engineFilter.frequency.setValueAtTime(140, this.ctx.currentTime);
    engineFilter.Q.setValueAtTime(4.0, this.ctx.currentTime);

    // Oscillator
    this.engineOsc = this.ctx.createOscillator();
    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.setValueAtTime(22, this.ctx.currentTime);

    // Sub-harmonic oscillator
    const subOsc = this.ctx.createOscillator();
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(11, this.ctx.currentTime);

    this.engineOsc.connect(engineFilter);
    subOsc.connect(engineFilter);
    engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.masterGain);

    this.engineOsc.start();
    subOsc.start();
  }

  _setupWaterSynth() {
    // Flowing canal water stream using filtered white noise
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    this.waterFilter = this.ctx.createBiquadFilter();
    this.waterFilter.type = 'bandpass';
    this.waterFilter.frequency.setValueAtTime(450, this.ctx.currentTime);
    this.waterFilter.Q.setValueAtTime(1.8, this.ctx.currentTime);

    this.waterGain = this.ctx.createGain();
    this.waterGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    whiteNoise.connect(this.waterFilter);
    this.waterFilter.connect(this.waterGain);
    this.waterGain.connect(this.masterGain);
    whiteNoise.start();
  }

  _setupAmbienceSynth() {
    // Gentle Delta rural wind ambience
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const windNoise = this.ctx.createBufferSource();
    windNoise.buffer = noiseBuffer;
    windNoise.loop = true;

    const windFilter = this.ctx.createBiquadFilter();
    windFilter.type = 'lowpass';
    windFilter.frequency.setValueAtTime(260, this.ctx.currentTime);

    this.ambienceGain = this.ctx.createGain();
    this.ambienceGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

    windNoise.connect(windFilter);
    windFilter.connect(this.ambienceGain);
    this.ambienceGain.connect(this.masterGain);
    windNoise.start();
  }

  setPumpSound(isRunning, isOverloaded = false) {
    if (!this.engineGain || !this.ctx) return;
    const t = this.ctx.currentTime;
    if (isRunning) {
      const targetGain = isOverloaded ? 0.38 : 0.22;
      const targetFreq = isOverloaded ? 36 : 24;
      this.engineGain.gain.setTargetAtTime(targetGain, t, 0.4);
      if (this.engineOsc) this.engineOsc.frequency.setTargetAtTime(targetFreq, t, 0.3);
    } else {
      this.engineGain.gain.setTargetAtTime(0.0, t, 0.3);
    }
  }

  setWaterFlowSound(flowIntensity) {
    // flowIntensity between 0.0 and 1.0
    if (!this.waterGain || !this.ctx) return;
    const t = this.ctx.currentTime;
    const targetGain = Math.min(0.28, flowIntensity * 0.28);
    this.waterGain.gain.setTargetAtTime(targetGain, t, 0.5);
    if (this.waterFilter) {
      this.waterFilter.frequency.setTargetAtTime(350 + flowIntensity * 300, t, 0.5);
    }
  }

  playGateTurnSFX() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.35);

    g.gain.setValueAtTime(0.18, t);
    g.gain.linearRampToValueAtTime(0.0, t + 0.35);

    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.36);
  }

  playNotebookChime() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(659.25, t); // E5
    osc.frequency.setValueAtTime(880.0, t + 0.08); // A5

    g.gain.setValueAtTime(0.15, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.42);
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.5, this.ctx.currentTime);
    }
    return this.isMuted;
  }
}
