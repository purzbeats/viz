// Kaleidoscope - Kaleidoscopic fractal, rotation speed tied to energy

uniform float uTime;
uniform float uBass;
uniform float uMid;
uniform float uHigh;
uniform float uEnergy;
uniform float uBeat;
uniform float uBassAccum;
uniform sampler2D uSpectrum;
uniform sampler2D uWaveform;
uniform vec2 uResolution;

varying vec2 vUv;

#define PI 3.14159265359
#define TAU 6.28318530718

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec2 rotate(vec2 v, float a) {
  float s = sin(a);
  float c = cos(a);
  return mat2(c, -s, s, c) * v;
}

// Kaleidoscope fold
vec2 kaleidoscope(vec2 uv, float segments) {
  float angle = atan(uv.y, uv.x);
  float segmentAngle = TAU / segments;
  angle = mod(angle, segmentAngle);
  angle = abs(angle - segmentAngle * 0.5);
  float radius = length(uv);
  return vec2(cos(angle), sin(angle)) * radius;
}

void main() {
  vec2 uv = vUv - 0.5;
  uv.x *= uResolution.x / uResolution.y;

  // Rotation based on accumulated audio
  float rotation = uTime * 0.2 * (0.5 + uEnergy * 1.5) + uBassAccum * 0.3;
  uv = rotate(uv, rotation);

  // Number of kaleidoscope segments based on beat
  float segments = 6.0 + floor(uBeat * 4.0);

  // Apply kaleidoscope
  vec2 kUv = kaleidoscope(uv, segments);

  // Zoom based on bass
  float zoom = 1.0 + uBass * 0.5;
  kUv *= zoom;

  // Create fractal pattern
  vec3 color = vec3(0.0);
  float scale = 1.0;

  for (int i = 0; i < 5; i++) {
    vec2 p = kUv * scale;

    // Sample waveform for displacement
    float waveIdx = fract(length(p) * 0.5);
    float wave = texture2D(uWaveform, vec2(waveIdx, 0.5)).r / 255.0 - 0.5;
    p += wave * 0.2;

    // Triangle pattern
    float d = abs(p.x) + abs(p.y);
    d = sin(d * 10.0 - uTime * 2.0);

    // Color
    float hue = float(i) * 0.15 + uMid * 0.5 + uTime * 0.05;
    float sat = 0.8;
    float val = smoothstep(0.8, 0.0, abs(d)) * (0.6 + uEnergy * 0.4);

    color += hsv2rgb(vec3(hue, sat, val)) / float(i + 2);

    scale *= 2.0;
  }

  // Beat flash
  color += uBeat * 0.3;

  // High frequency sparkles
  float sparkle = texture2D(uSpectrum, vec2(length(kUv) * 0.5, 0.5)).r / 255.0;
  sparkle = pow(sparkle, 4.0) * uHigh * 2.0;
  color += sparkle;

  // Vignette
  float dist = length(vUv - 0.5);
  color *= 1.0 - dist * 0.5;

  gl_FragColor = vec4(color, 1.0);
}
