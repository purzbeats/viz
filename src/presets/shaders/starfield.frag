// Starfield - Hyperspace starfield

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

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

void main() {
  vec2 uv = vUv - 0.5;
  uv.x *= uResolution.x / uResolution.y;

  vec3 color = vec3(0.0);

  // Speed based on energy
  float speed = uTime * (1.0 + uEnergy * 3.0) + uBassAccum;

  // Multiple star layers
  for (float layer = 0.0; layer < 4.0; layer++) {
    float layerDepth = 1.0 + layer * 0.5;
    float layerSpeed = speed / layerDepth;

    // Star field grid
    float gridSize = 10.0 + layer * 5.0;
    vec2 grid = uv * gridSize;

    // Scroll through space
    grid.y -= layerSpeed;

    vec2 gridId = floor(grid);
    vec2 gridUv = fract(grid) - 0.5;

    // Random star position within cell
    float rnd = hash(gridId + layer * 100.0);
    float rnd2 = hash(gridId + layer * 100.0 + 50.0);

    if (rnd > 0.7) { // Only some cells have stars
      vec2 starPos = vec2(rnd - 0.5, rnd2 - 0.5) * 0.8;
      float dist = length(gridUv - starPos);

      // Star size - varies and pulses
      float baseSize = 0.02 + rnd * 0.03;
      float pulse = sin(uTime * 5.0 + rnd * 10.0) * 0.3 + 0.7;

      // Spectrum influence
      float specVal = texture2D(uSpectrum, vec2(rnd, 0.5)).r / 255.0;
      float starSize = baseSize * (1.0 + specVal * 0.5) * pulse;

      // Star brightness with trail
      float star = starSize / (dist + 0.001);
      star = pow(star, 1.5) * 0.1;

      // Star trail (motion blur)
      float trailLength = (0.1 + uEnergy * 0.2) / layerDepth;
      float trail = starSize / (abs(gridUv.x - starPos.x) + 0.01);
      trail *= smoothstep(starPos.y + trailLength, starPos.y, gridUv.y);
      trail *= smoothstep(starPos.y - 0.02, starPos.y, gridUv.y);
      trail = trail * 0.02;

      // Combine
      float brightness = star + trail;
      brightness /= layerDepth * 0.5; // Distant layers dimmer

      // Color based on "temperature"
      float hue = rnd * 0.1 + 0.6; // Blue-white
      if (rnd > 0.9) hue = 0.05; // Some orange stars
      if (rnd > 0.95) hue = 0.0; // Some red giants

      float sat = 0.3 + rnd2 * 0.3;
      color += hsv2rgb(vec3(hue, sat, brightness));
    }
  }

  // Central warp effect
  float warpDist = length(uv);
  float warp = 1.0 / (warpDist * 10.0 + 1.0);
  warp *= uEnergy * 0.3;
  color += vec3(warp * 0.5, warp * 0.7, warp);

  // Beat flash
  color += uBeat * 0.1;

  // Vignette
  color *= 1.0 - warpDist * 0.5;

  gl_FragColor = vec4(color, 1.0);
}
