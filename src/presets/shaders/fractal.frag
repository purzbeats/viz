// Fractal - Julia set with audio-reactive parameters

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

  // Zoom based on bass
  float zoom = 1.5 - uBass * 0.3;
  uv *= zoom;

  // Julia set constant - varies with audio
  float cAngle = uTime * 0.2 + uBassAccum * 0.1;
  float cRadius = 0.7885 + uMid * 0.1;
  vec2 c = vec2(
    cos(cAngle) * cRadius,
    sin(cAngle) * cRadius
  );

  // Julia iteration
  vec2 z = uv;
  float iter = 0.0;
  float maxIter = 100.0;

  for (float i = 0.0; i < 100.0; i++) {
    // z = z^2 + c
    z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;

    if (dot(z, z) > 4.0) {
      iter = i;
      break;
    }
    iter = i;
  }

  // Smooth iteration count
  float smoothIter = iter;
  if (iter < maxIter - 1.0) {
    float log_zn = log(dot(z, z)) / 2.0;
    float nu = log(log_zn / log(2.0)) / log(2.0);
    smoothIter = iter + 1.0 - nu;
  }

  // Normalize
  float t = smoothIter / maxIter;

  // Sample spectrum for color variation
  float specVal = texture2D(uSpectrum, vec2(t, 0.5)).r / 255.0;

  // Color mapping
  float hue = t * 0.5 + uTime * 0.05 + specVal * 0.3;
  float sat = 0.8 - t * 0.3 + uHigh * 0.2;
  float val = 1.0 - t;

  // Inside the set
  if (iter >= maxIter - 1.0) {
    // Pulsing interior
    float interior = sin(length(z) * 10.0 + uTime * 2.0) * 0.5 + 0.5;
    interior *= uEnergy;
    hue = uTime * 0.1;
    sat = 0.5;
    val = interior * 0.3;
  }

  vec3 color = hsv2rgb(vec3(hue, sat, val));

  // Edge glow based on iteration gradient
  float edgeGlow = 1.0 / (abs(t - 0.5) * 10.0 + 1.0);
  edgeGlow *= uEnergy * 0.3;
  color += hsv2rgb(vec3(hue + 0.2, 0.5, edgeGlow));

  // Beat flash
  color += uBeat * 0.15;

  // Vignette
  float dist = length(vUv - 0.5);
  color *= 1.0 - dist * 0.3;

  gl_FragColor = vec4(color, 1.0);
}
