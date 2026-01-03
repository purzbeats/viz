import { Preset } from './types';

// Import shaders
import ringsShader from './shaders/rings.frag';
import particlesShader from './shaders/particles.frag';
import kaleidoscopeShader from './shaders/kaleidoscope.frag';
import waveform3dShader from './shaders/waveform3d.frag';
import geodesicShader from './shaders/geodesic.frag';
import tunnelShader from './shaders/tunnel.frag';
import plasmaShader from './shaders/plasma.frag';
import barsShader from './shaders/bars.frag';
import vortexShader from './shaders/vortex.frag';
import gridShader from './shaders/grid.frag';
import blobShader from './shaders/blob.frag';
import starfieldShader from './shaders/starfield.frag';
import hexagonsShader from './shaders/hexagons.frag';
import fractalShader from './shaders/fractal.frag';
import wavesShader from './shaders/waves.frag';

const PRESETS: Preset[] = [
  { name: 'Rings', fragmentShader: ringsShader },
  { name: 'Particles', fragmentShader: particlesShader },
  { name: 'Kaleidoscope', fragmentShader: kaleidoscopeShader },
  { name: 'Waveform 3D', fragmentShader: waveform3dShader },
  { name: 'Geodesic', fragmentShader: geodesicShader },
  { name: 'Tunnel', fragmentShader: tunnelShader },
  { name: 'Plasma', fragmentShader: plasmaShader },
  { name: 'Bars', fragmentShader: barsShader },
  { name: 'Vortex', fragmentShader: vortexShader },
  { name: 'Grid', fragmentShader: gridShader },
  { name: 'Blob', fragmentShader: blobShader },
  { name: 'Starfield', fragmentShader: starfieldShader },
  { name: 'Hexagons', fragmentShader: hexagonsShader },
  { name: 'Fractal', fragmentShader: fractalShader },
  { name: 'Waves', fragmentShader: wavesShader },
];

export type PresetChangeCallback = (preset: Preset) => void;

export class PresetManager {
  private presets: Preset[] = PRESETS;
  private currentIndex = 0;
  private onChangeCallback: PresetChangeCallback | null = null;

  get current(): Preset {
    return this.presets[this.currentIndex];
  }

  get all(): Preset[] {
    return this.presets;
  }

  get currentName(): string {
    return this.current.name;
  }

  onChange(callback: PresetChangeCallback): void {
    this.onChangeCallback = callback;
  }

  select(index: number): void {
    if (index >= 0 && index < this.presets.length) {
      this.currentIndex = index;
      if (this.onChangeCallback) {
        this.onChangeCallback(this.current);
      }
    }
  }

  selectByName(name: string): void {
    const index = this.presets.findIndex(p => p.name === name);
    if (index !== -1) {
      this.select(index);
    }
  }

  next(): void {
    this.select((this.currentIndex + 1) % this.presets.length);
  }

  previous(): void {
    this.select((this.currentIndex - 1 + this.presets.length) % this.presets.length);
  }

  addPreset(preset: Preset): void {
    this.presets.push(preset);
  }
}
