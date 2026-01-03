// Particles - Particle field that explodes on beats, density follows energy

uniform float uTime;
uniform float uBass;
uniform float uMid;
uniform float uHigh;
uniform float uEnergy;
uniform float uBeat;
uniform float uBeatCount;
uniform float uBassAccum;
uniform sampler2D uSpectrum;
uniform vec2 uResolution;

varying vec2 vUv;

#define PI 3.14159265359

// Hash function for pseudo-random
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
  vec2 uv = vUv - 0.5;
  uv.x *= uResolution.x / uResolution.y;

  vec3 color = vec3(0.0);

  // Number of particles based on energy
  float numLayers = 3.0;

  for (float layer = 0.0; layer < 3.0; layer++) {
    float layerOffset = layer * 0.33;
    float layerSpeed = 1.0 + layer * 0.5;

    // Grid of particles
    float gridSize = 15.0 + layer * 5.0;
    vec2 grid = uv * gridSize;
    vec2 gridId = floor(grid);
    vec2 gridUv = fract(grid) - 0.5;

    // Random offset per particle
    float rnd = hash(gridId + layer * 100.0);
    float rnd2 = hash(gridId + layer * 100.0 + 50.0);

    // Particle motion - explode on beat
    float explosionPhase = mod(uBeatCount + layerOffset, 4.0) / 4.0;
    float explode = uBeat * 2.0;

    vec2 offset = vec2(
      sin(rnd * PI * 2.0 + uTime * layerSpeed) * 0.3,
      cos(rnd2 * PI * 2.0 + uTime * layerSpeed * 0.7) * 0.3
    );
    offset += normalize(gridUv + 0.001) * explode * rnd;

    vec2 particlePos = gridUv + offset;

    // Particle size based on spectrum
    float specIdx = fract(rnd * 0.8);
    float specVal = texture2D(uSpectrum, vec2(specIdx, 0.5)).r;
    float size = 0.05 + specVal * 0.15 + uEnergy * 0.1;

    // Draw particle
    float dist = length(particlePos);
    float particle = 1.0 - smoothstep(0.0, size, dist);
    particle *= particle; // Softer falloff

    // Color based on position and audio
    float hue = rnd + uMid * 0.5 + layer * 0.2;
    float sat = 0.6 + uHigh * 0.4;
    float val = particle * (0.5 + uEnergy * 0.5);

    color += hsv2rgb(vec3(hue, sat, val)) * (1.0 - layer * 0.2);
  }

  // Add center glow on beats
  float centerDist = length(uv);
  float glow = (1.0 - smoothstep(0.0, 0.5, centerDist)) * uBeat * 0.5;
  color += vec3(glow);

  // Vignette
  float vignette = 1.0 - centerDist * 0.5;
  color *= vignette;

  gl_FragColor = vec4(color, 1.0);
}
