// Hexagons - Reactive hexagonal grid

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

// Hexagonal distance
float hexDist(vec2 p) {
  p = abs(p);
  return max(dot(p, normalize(vec2(1.0, 1.73))), p.x);
}

// Get hex cell coordinates
vec4 hexCoords(vec2 uv) {
  vec2 r = vec2(1.0, 1.73);
  vec2 h = r * 0.5;
  vec2 a = mod(uv, r) - h;
  vec2 b = mod(uv - h, r) - h;

  vec2 gv;
  vec2 id;

  if (length(a) < length(b)) {
    gv = a;
    id = floor(uv / r);
  } else {
    gv = b;
    id = floor((uv - h) / r);
  }

  return vec4(gv, id);
}

void main() {
  vec2 uv = vUv - 0.5;
  uv.x *= uResolution.x / uResolution.y;

  // Scale and animate
  float scale = 8.0;
  vec2 hexUv = uv * scale;

  // Slight rotation
  float angle = uTime * 0.1 + uBassAccum * 0.05;
  float c = cos(angle);
  float s = sin(angle);
  hexUv = mat2(c, -s, s, c) * hexUv;

  // Get hex coordinates
  vec4 hex = hexCoords(hexUv);
  vec2 gv = hex.xy;
  vec2 id = hex.zw;

  // Distance to hex edge
  float d = hexDist(gv);

  // Spectrum sample based on hex position
  float specIdx = fract(length(id) * 0.1 + id.x * 0.05);
  float specVal = texture2D(uSpectrum, vec2(specIdx, 0.5)).r / 255.0;

  // Hex fill based on audio
  float fillLevel = specVal * 0.8 + uEnergy * 0.2;
  float fill = smoothstep(fillLevel + 0.05, fillLevel - 0.05, d);

  // Edge highlight
  float edge = smoothstep(0.5, 0.45, d) - smoothstep(0.45, 0.4, d);

  // Wave propagation from center
  float distFromCenter = length(id);
  float wave = sin(distFromCenter * 0.5 - uTime * 3.0 + uBassAccum);
  wave = smoothstep(0.0, 1.0, wave);

  // Color
  float hue = specIdx + uTime * 0.05 + uMid * 0.3;
  float sat = 0.7 + uHigh * 0.3;
  float val = fill * (0.4 + specVal * 0.4) + edge * 0.6;

  // Add wave influence
  val *= 0.7 + wave * 0.3;

  vec3 color = hsv2rgb(vec3(hue, sat, val));

  // Beat pulse on edges
  color += edge * uBeat * hsv2rgb(vec3(hue + 0.5, 0.5, 1.0));

  // Glow from filled hexes
  float glow = fill * specVal * 0.3;
  color += hsv2rgb(vec3(hue, 0.3, glow));

  // Vignette
  float dist = length(vUv - 0.5);
  color *= 1.0 - dist * 0.5;

  gl_FragColor = vec4(color, 1.0);
}
