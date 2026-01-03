import * as THREE from 'three';
import { AudioEngine } from './AudioEngine';

export interface AudioUniforms {
  uTime: THREE.IUniform<number>;
  uBass: THREE.IUniform<number>;
  uMid: THREE.IUniform<number>;
  uHigh: THREE.IUniform<number>;
  uEnergy: THREE.IUniform<number>;
  uBeat: THREE.IUniform<number>;
  uBassAccum: THREE.IUniform<number>;
  uBeatCount: THREE.IUniform<number>;
  uSpectrum: THREE.IUniform<THREE.DataTexture>;
  uWaveform: THREE.IUniform<THREE.DataTexture>;
  uResolution: THREE.IUniform<THREE.Vector2>;
}

export class AudioData {
  private engine: AudioEngine;
  private startTime: number;

  private spectrumTexture: THREE.DataTexture;
  private waveformTexture: THREE.DataTexture;
  private spectrumData: Uint8Array;
  private waveformData: Uint8Array;

  // Smoothed values
  private bass = 0;
  private mid = 0;
  private high = 0;
  private energy = 0;
  private beat = 0;
  private bassAccum = 0;
  private beatCount = 0;

  // Beat detection state
  private lastBassValue = 0;
  private beatThreshold = 1.4;
  private beatDecay = 0.95;
  private beatCooldown = 0;

  readonly uniforms: AudioUniforms;

  constructor(engine: AudioEngine) {
    this.engine = engine;
    this.startTime = performance.now();

    // Create spectrum texture (512x1)
    this.spectrumData = new Uint8Array(512);
    this.spectrumTexture = new THREE.DataTexture(
      this.spectrumData,
      512, 1,
      THREE.RedFormat,
      THREE.UnsignedByteType
    );
    this.spectrumTexture.needsUpdate = true;

    // Create waveform texture (512x1)
    this.waveformData = new Uint8Array(512);
    this.waveformTexture = new THREE.DataTexture(
      this.waveformData,
      512, 1,
      THREE.RedFormat,
      THREE.UnsignedByteType
    );
    this.waveformTexture.needsUpdate = true;

    this.uniforms = {
      uTime: { value: 0 },
      uBass: { value: 0 },
      uMid: { value: 0 },
      uHigh: { value: 0 },
      uEnergy: { value: 0 },
      uBeat: { value: 0 },
      uBassAccum: { value: 0 },
      uBeatCount: { value: 0 },
      uSpectrum: { value: this.spectrumTexture },
      uWaveform: { value: this.waveformTexture },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
    };
  }

  update(): void {
    // Update time
    const elapsed = (performance.now() - this.startTime) / 1000;
    this.uniforms.uTime.value = elapsed;

    if (!this.engine.isReady) return;

    // Get raw data
    const freqData = this.engine.getFrequencyData();
    const timeData = this.engine.getTimeDomainData();

    // Update spectrum texture (resample to 512)
    const binCount = freqData.length;
    for (let i = 0; i < 512; i++) {
      const idx = Math.floor((i / 512) * binCount);
      this.spectrumData[i] = freqData[idx];
    }
    this.spectrumTexture.needsUpdate = true;

    // Update waveform texture
    for (let i = 0; i < 512; i++) {
      const idx = Math.floor((i / 512) * timeData.length);
      this.waveformData[i] = timeData[idx];
    }
    this.waveformTexture.needsUpdate = true;

    // Calculate frequency bands
    // FFT bin frequency = (sampleRate / fftSize) * binIndex
    // With 2048 FFT and 44100 sample rate, each bin is ~21.5Hz
    const binWidth = this.engine.sampleRate / 2048;

    // Bass: 20-250Hz
    const bassEnd = Math.floor(250 / binWidth);
    let bassSum = 0;
    for (let i = 0; i < bassEnd; i++) {
      bassSum += freqData[i];
    }
    const rawBass = bassSum / (bassEnd * 255);

    // Mid: 250-2000Hz
    const midStart = bassEnd;
    const midEnd = Math.floor(2000 / binWidth);
    let midSum = 0;
    for (let i = midStart; i < midEnd; i++) {
      midSum += freqData[i];
    }
    const rawMid = midSum / ((midEnd - midStart) * 255);

    // High: 2000-20000Hz
    const highStart = midEnd;
    const highEnd = Math.min(Math.floor(20000 / binWidth), binCount);
    let highSum = 0;
    for (let i = highStart; i < highEnd; i++) {
      highSum += freqData[i];
    }
    const rawHigh = highSum / ((highEnd - highStart) * 255);

    // Overall energy
    let totalSum = 0;
    for (let i = 0; i < binCount; i++) {
      totalSum += freqData[i];
    }
    const rawEnergy = totalSum / (binCount * 255);

    // Smooth values
    const smoothing = 0.3;
    this.bass = this.bass * (1 - smoothing) + rawBass * smoothing;
    this.mid = this.mid * (1 - smoothing) + rawMid * smoothing;
    this.high = this.high * (1 - smoothing) + rawHigh * smoothing;
    this.energy = this.energy * (1 - smoothing) + rawEnergy * smoothing;

    // Beat detection
    if (this.beatCooldown > 0) {
      this.beatCooldown--;
    }

    if (rawBass > this.lastBassValue * this.beatThreshold && this.beatCooldown === 0) {
      this.beat = 1.0;
      this.beatCount++;
      this.beatCooldown = 10; // ~166ms at 60fps
    } else {
      this.beat *= this.beatDecay;
    }
    this.lastBassValue = rawBass;

    // Accumulate bass (slow-evolving value)
    this.bassAccum += this.bass * 0.01;

    // Update uniforms
    this.uniforms.uBass.value = this.bass;
    this.uniforms.uMid.value = this.mid;
    this.uniforms.uHigh.value = this.high;
    this.uniforms.uEnergy.value = this.energy;
    this.uniforms.uBeat.value = this.beat;
    this.uniforms.uBassAccum.value = this.bassAccum;
    this.uniforms.uBeatCount.value = this.beatCount;
  }

  updateResolution(width: number, height: number): void {
    this.uniforms.uResolution.value.set(width, height);
  }
}
