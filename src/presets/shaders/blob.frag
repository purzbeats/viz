// Blob - Metaballs / organic shapes

uniform float uTime;
uniform float uBass;
uniform float uMid;
uniform float uHigh;
uniform float uEnergy;
uniform float uBeat;
uniform float uBassAccum;
uniform sampler2D uSpectrum;
uniform vec2 uResolution;

varying vec2 vUv;

#define PI 3.14159265359

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

float metaball(vec2 uv, vec2 pos, float radius) {
  float d = length(uv - pos);
  return radius / (d * d + 0.001);
}

void main() {
  vec2 uv = vUv - 0.5;
  uv.x *= uResolution.x / uResolution.y;

  float t = uTime * 0.5;

  // Multiple metaballs influenced by audio
  float field = 0.0;

  // Central blob - pulses with bass
  float centralRadius = 0.1 + uBass * 0.15 + uBeat * 0.1;
  field += metaball(uv, vec2(0.0), centralRadius);

  // Orbiting blobs - positions influenced by spectrum
  for (float i = 0.0; i < 8.0; i++) {
    float angle = i / 8.0 * PI * 2.0 + t * (0.5 + i * 0.1);

    // Spectrum influence on orbit radius
    float specVal = texture2D(uSpectrum, vec2(i / 8.0, 0.5)).r / 255.0;
    float orbitRadius = 0.25 + specVal * 0.15 + sin(t * 2.0 + i) * 0.05;

    vec2 pos = vec2(cos(angle), sin(angle)) * orbitRadius;

    // Blob size based on audio
    float blobSize = 0.03 + specVal * 0.04 + uEnergy * 0.02;

    field += metaball(uv, pos, blobSize);
  }

  // Inner ring of smaller blobs
  for (float i = 0.0; i < 5.0; i++) {
    float angle = i / 5.0 * PI * 2.0 - t * 0.8;
    float orbitRadius = 0.12 + uMid * 0.05;
    vec2 pos = vec2(cos(angle), sin(angle)) * orbitRadius;
    field += metaball(uv, pos, 0.02 + uHigh * 0.02);
  }

  // Threshold to create blob surface
  float threshold = 15.0 + uEnergy * 5.0;
  float blob = smoothstep(threshold - 2.0, threshold + 2.0, field);

  // Edge glow
  float edge = smoothstep(threshold - 5.0, threshold, field) -
               smoothstep(threshold, threshold + 5.0, field);
  edge = max(edge, 0.0);

  // Interior gradient
  float interior = field / (threshold * 2.0);

  // Color
  float hue = uBassAccum * 0.1 + interior * 0.3 + uMid * 0.2;
  float sat = 0.6 + uHigh * 0.4;
  float val = blob * 0.7 + edge * 0.8;

  vec3 color = hsv2rgb(vec3(hue, sat, val));

  // Inner glow
  color += hsv2rgb(vec3(hue + 0.1, 0.3, interior * blob * 0.5));

  // Beat flash
  color += edge * uBeat * 0.5;

  // Subtle background
  float bgField = field * 0.02;
  color += hsv2rgb(vec3(hue + 0.5, 0.5, bgField));

  gl_FragColor = vec4(color, 1.0);
}
