// Grid - Reactive cyberpunk grid

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

  // Perspective transform for 3D grid effect
  float horizon = 0.0;
  float perspectiveY = uv.y - horizon;

  vec3 color = vec3(0.0);

  if (perspectiveY < -0.01) {
    // Ground plane
    float depth = -0.5 / perspectiveY;
    float x = uv.x * depth;
    float z = depth + uTime * (2.0 + uEnergy * 3.0) + uBassAccum;

    // Grid lines
    float gridX = abs(fract(x) - 0.5) * 2.0;
    float gridZ = abs(fract(z * 0.5) - 0.5) * 2.0;

    float lineX = smoothstep(0.95, 1.0, gridX);
    float lineZ = smoothstep(0.95, 1.0, gridZ);

    // Spectrum-based height at grid intersections
    float specIdx = fract(x * 0.1);
    float specVal = texture2D(uSpectrum, vec2(abs(specIdx), 0.5)).r / 255.0;

    // Grid brightness
    float grid = max(lineX, lineZ);
    grid *= 1.0 + specVal * 2.0;

    // Fog based on depth
    float fog = 1.0 / (1.0 + depth * 0.1);

    // Color
    float hue = 0.6 + uMid * 0.2; // Cyan-ish
    color = hsv2rgb(vec3(hue, 0.8, grid * fog));

    // Pulse lines traveling along Z
    float pulse = sin(z * 2.0 - uTime * 10.0);
    pulse = smoothstep(0.9, 1.0, pulse) * fog;
    color += hsv2rgb(vec3(hue + 0.1, 0.5, pulse * uEnergy));

    // Beat flash on grid
    color += grid * fog * uBeat * 0.5;

  } else {
    // Sky / horizon glow
    float skyGradient = smoothstep(0.0, 0.3, perspectiveY);

    // Horizon glow
    float horizonGlow = 1.0 / (abs(perspectiveY) * 20.0 + 1.0);
    horizonGlow *= uEnergy * 0.5 + 0.3;

    float hue = 0.6 + uMid * 0.2;
    color = hsv2rgb(vec3(hue + 0.15, 0.6, horizonGlow));

    // Sun/moon
    vec2 sunPos = vec2(0.0, 0.15);
    float sunDist = length(uv - sunPos);
    float sun = smoothstep(0.15, 0.0, sunDist);
    sun += smoothstep(0.3, 0.1, sunDist) * 0.3; // Glow

    color += hsv2rgb(vec3(0.05, 0.8, sun * (0.8 + uBass * 0.5)));

    // Scanlines
    float scanline = sin(uv.y * 200.0 + uTime * 5.0) * 0.5 + 0.5;
    color *= 0.9 + scanline * 0.1;
  }

  // Overall scanlines
  float scanlines = sin(gl_FragCoord.y * 0.5) * 0.5 + 0.5;
  color *= 0.95 + scanlines * 0.05;

  // Vignette
  float dist = length(vUv - 0.5);
  color *= 1.0 - dist * 0.5;

  gl_FragColor = vec4(color, 1.0);
}
