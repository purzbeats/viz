// Vortex - Spiraling vortex pulled by bass

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

vec2 rotate(vec2 v, float a) {
  float s = sin(a);
  float c = cos(a);
  return mat2(c, -s, s, c) * v;
}

void main() {
  vec2 uv = vUv - 0.5;
  uv.x *= uResolution.x / uResolution.y;

  float dist = length(uv);
  float angle = atan(uv.y, uv.x);

  // Spiral twist - more twist near center
  float twist = (1.0 / (dist + 0.1)) * 0.5;
  twist *= 1.0 + uBass * 2.0;

  // Rotation over time
  float rotation = uTime * (0.5 + uEnergy) + uBassAccum * 0.5;

  // Apply twist
  angle += twist + rotation;

  // Number of spiral arms
  float arms = 5.0 + floor(uBeat * 3.0);

  // Spiral pattern
  float spiral = sin(angle * arms + dist * 20.0 - uTime * 5.0);
  spiral = smoothstep(-0.2, 0.2, spiral);

  // Secondary spiral (counter-rotating)
  float spiral2 = sin(-angle * 3.0 + dist * 15.0 + uTime * 3.0);
  spiral2 = smoothstep(-0.3, 0.3, spiral2);

  // Combine
  float pattern = spiral * 0.6 + spiral2 * 0.4;

  // Spectrum influence
  float specAngle = fract(angle / TAU + 0.5);
  float specVal = texture2D(uSpectrum, vec2(specAngle, 0.5)).r / 255.0;
  pattern *= 1.0 + specVal * 0.5;

  // Color
  float hue = angle / TAU + dist * 0.5 + uTime * 0.1 + uMid * 0.3;
  float sat = 0.7 + uHigh * 0.3;
  float val = pattern * (0.6 + uEnergy * 0.4);

  // Center glow
  float glow = 1.0 / (dist * 5.0 + 1.0);
  glow *= uEnergy * 0.5 + 0.2;

  vec3 color = hsv2rgb(vec3(hue, sat, val));
  color += hsv2rgb(vec3(hue + 0.5, 0.5, glow));

  // Beat pulse rings
  float beatRing = sin(dist * 30.0 - uBeat * 10.0);
  beatRing = smoothstep(0.8, 1.0, beatRing) * uBeat;
  color += beatRing * 0.5;

  // Vignette
  color *= 1.0 - dist * 0.5;

  gl_FragColor = vec4(color, 1.0);
}
