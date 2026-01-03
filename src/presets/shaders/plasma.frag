// Plasma - Classic plasma effect with audio modulation

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

void main() {
  vec2 uv = vUv - 0.5;
  uv.x *= uResolution.x / uResolution.y;

  float t = uTime * 0.5 + uBassAccum * 0.3;

  // Multiple overlapping sine waves
  float plasma = 0.0;

  // Wave 1 - horizontal
  plasma += sin(uv.x * 10.0 + t * 2.0 + uBass * 5.0);

  // Wave 2 - vertical
  plasma += sin(uv.y * 10.0 + t * 1.5 + uMid * 5.0);

  // Wave 3 - diagonal
  plasma += sin((uv.x + uv.y) * 8.0 + t * 1.8);

  // Wave 4 - radial
  float dist = length(uv);
  plasma += sin(dist * 15.0 - t * 3.0 + uBass * 10.0);

  // Wave 5 - circular
  plasma += sin(atan(uv.y, uv.x) * 5.0 + t + uHigh * 8.0);

  // Normalize
  plasma = plasma / 5.0;

  // Add spectrum influence
  float specX = texture2D(uSpectrum, vec2(abs(uv.x), 0.5)).r / 255.0;
  float specY = texture2D(uSpectrum, vec2(abs(uv.y), 0.5)).r / 255.0;
  plasma += (specX + specY) * 0.3;

  // Color mapping
  float hue = plasma * 0.5 + uTime * 0.05 + uMid * 0.2;
  float sat = 0.8 + uHigh * 0.2;
  float val = 0.6 + uEnergy * 0.4 + uBeat * 0.2;

  vec3 color = hsv2rgb(vec3(hue, sat, val));

  // Add some contrast
  color = pow(color, vec3(0.9));

  gl_FragColor = vec4(color, 1.0);
}
