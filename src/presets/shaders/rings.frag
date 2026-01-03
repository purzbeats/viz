// Rings - Concentric rings that pulse with bass, colors shift with mids

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
#define TAU 6.28318530718

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
  vec2 uv = vUv - 0.5;
  uv.x *= uResolution.x / uResolution.y;

  float dist = length(uv);
  float angle = atan(uv.y, uv.x);

  // Create rings that expand outward
  float ringSpeed = uTime * 0.5 + uBassAccum * 0.5;
  float rings = sin((dist * 20.0 - ringSpeed) * PI);

  // Modulate ring thickness with bass
  float ringThickness = 0.3 + uBass * 0.7;
  rings = smoothstep(ringThickness, ringThickness + 0.1, abs(rings));

  // Add radial variation based on spectrum
  float specSample = texture2D(uSpectrum, vec2(fract(angle / TAU + 0.5), 0.5)).r;
  float radialWave = specSample * 0.3;

  // Beat flash
  float flash = uBeat * 0.5;

  // Color based on distance and audio
  float hue = dist * 0.5 + uMid * 0.3 + uTime * 0.1;
  float sat = 0.7 + uHigh * 0.3;
  float val = rings * (0.8 + uEnergy * 0.4) + flash;

  // Add glow in center
  float glow = 1.0 - smoothstep(0.0, 0.5 + uBass * 0.3, dist);
  glow *= 0.3 + uEnergy * 0.3;

  vec3 color = hsv2rgb(vec3(hue, sat, val));
  color += glow * hsv2rgb(vec3(hue + 0.1, 0.5, 1.0));

  // Add some radial lines on beats
  float radialLines = sin(angle * 8.0) * 0.5 + 0.5;
  color += radialLines * uBeat * 0.3;

  gl_FragColor = vec4(color, 1.0);
}
