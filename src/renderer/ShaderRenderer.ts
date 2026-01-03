import * as THREE from 'three';
import { AudioUniforms } from '../audio/AudioData';
import { Preset } from '../presets/types';

const DEFAULT_VERTEX_SHADER = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

const FALLBACK_FRAGMENT_SHADER = `
uniform float uTime;
uniform vec2 uResolution;

varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  vec3 color = vec3(0.5 + 0.5 * sin(uTime), 0.5 + 0.5 * cos(uTime * 0.7), 0.5);
  gl_FragColor = vec4(color, 1.0);
}
`;

export class ShaderRenderer {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private quad: THREE.Mesh;
  private material: THREE.ShaderMaterial;
  private audioUniforms: AudioUniforms;

  constructor(canvas: HTMLCanvasElement, audioUniforms: AudioUniforms) {
    this.audioUniforms = audioUniforms;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    // Scene
    this.scene = new THREE.Scene();

    // Orthographic camera for fullscreen quad
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // Fullscreen quad geometry
    const geometry = new THREE.PlaneGeometry(2, 2);

    // Initial material
    this.material = new THREE.ShaderMaterial({
      uniforms: { ...audioUniforms },
      vertexShader: DEFAULT_VERTEX_SHADER,
      fragmentShader: FALLBACK_FRAGMENT_SHADER
    });

    this.quad = new THREE.Mesh(geometry, this.material);
    this.scene.add(this.quad);

    // Handle resize
    window.addEventListener('resize', this.onResize.bind(this));
  }

  private onResize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.renderer.setSize(width, height);
    this.audioUniforms.uResolution.value.set(width, height);
  }

  setPreset(preset: Preset): void {
    // Create new material with the preset's shaders
    this.material.vertexShader = preset.vertexShader || DEFAULT_VERTEX_SHADER;
    this.material.fragmentShader = preset.fragmentShader;
    this.material.needsUpdate = true;
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.renderer.dispose();
    this.material.dispose();
    (this.quad.geometry as THREE.BufferGeometry).dispose();
  }
}
