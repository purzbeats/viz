// Tunnel - Classic demoscene tunnel flying through

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

  // Tunnel coordinates
  float angle = atan(uv.y, uv.x);
  float radius = length(uv);

  // Prevent division by zero
  radius = max(radius, 0.001);

  // Tunnel depth - inverse of radius
  float depth = 0.5 / radius;

  // Speed based on energy
  float speed = uTime * (1.0 + uEnergy * 2.0) + uBassAccum * 0.5;

  // Texture coordinates in tunnel
  float tx = angle / TAU + 0.5;
  float ty = depth - speed;

  // Sample spectrum for wall pattern
  float specVal = texture2D(uSpectrum, vec2(fract(tx * 4.0), 0.5)).r / 255.0;

  // Create tunnel walls pattern
  float segments = 8.0;
  float segmentAngle = fract(tx * segments);
  float wall = smoothstep(0.0, 0.1, segmentAngle) * smoothstep(1.0, 0.9, segmentAngle);

  // Rings down the tunnel
  float rings = sin(ty * 20.0) * 0.5 + 0.5;
  rings = smoothstep(0.3, 0.7, rings);

  // Combine patterns
  float pattern = wall * 0.5 + rings * 0.5;
  pattern *= 1.0 + specVal * 0.5;

  // Color based on depth and audio
  float hue = ty * 0.1 + uMid * 0.3 + angle / TAU * 0.2;
  float sat = 0.7 + uHigh * 0.3;
  float val = pattern * (0.5 + uEnergy * 0.5);

  // Depth fog
  float fog = 1.0 - smoothstep(0.0, 3.0, depth);
  val *= fog;

  // Beat flash on walls
  val += uBeat * wall * 0.3;

  vec3 color = hsv2rgb(vec3(hue, sat, val));

  // Center glow
  float centerGlow = 1.0 - smoothstep(0.0, 0.3, radius);
  color += centerGlow * hsv2rgb(vec3(uTime * 0.1, 0.5, uBeat * 0.5));

  gl_FragColor = vec4(color, 1.0);
}
