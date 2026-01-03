// Waves - Ocean-like waves

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

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

float wave(vec2 uv, float freq, float amp, float speed, float phase) {
  return sin(uv.x * freq + uTime * speed + phase) * amp;
}

void main() {
  vec2 uv = vUv - 0.5;
  uv.x *= uResolution.x / uResolution.y;

  // Multiple wave layers
  float waveHeight = 0.0;

  // Base waves
  waveHeight += wave(uv, 8.0, 0.05 + uBass * 0.05, 2.0, 0.0);
  waveHeight += wave(uv, 12.0, 0.03 + uMid * 0.03, 3.0, 1.0);
  waveHeight += wave(uv, 20.0, 0.02 + uHigh * 0.02, 4.0, 2.0);

  // Waveform-influenced waves
  float waveIdx = fract(uv.x * 0.5 + 0.5);
  float waveformVal = texture2D(uWaveform, vec2(waveIdx, 0.5)).r / 255.0 - 0.5;
  waveHeight += waveformVal * 0.1;

  // Cross waves
  waveHeight += wave(uv.yx, 6.0, 0.02, 1.5, 3.0);

  // Wave surface
  float surface = uv.y - waveHeight;

  vec3 color = vec3(0.0);

  if (surface < 0.0) {
    // Below surface (water)
    float depth = -surface;

    // Water color with depth fog
    float fog = exp(-depth * 3.0);
    float hue = 0.55 + uMid * 0.05; // Cyan-blue

    // Caustics
    float caustic1 = sin((uv.x + waveHeight) * 30.0 + uTime * 2.0) * 0.5 + 0.5;
    float caustic2 = sin((uv.x - waveHeight) * 25.0 - uTime * 1.5) * 0.5 + 0.5;
    float caustics = caustic1 * caustic2;
    caustics = pow(caustics, 2.0) * fog;

    // Spectrum ripples
    float specVal = texture2D(uSpectrum, vec2(fract(uv.x + 0.5), 0.5)).r / 255.0;
    caustics += specVal * fog * 0.3;

    float sat = 0.6 + depth * 0.2;
    float val = (0.3 + caustics * 0.5) * fog + 0.1;

    color = hsv2rgb(vec3(hue, sat, val));

    // Deep glow
    color += hsv2rgb(vec3(hue + 0.1, 0.5, (1.0 - fog) * uEnergy * 0.3));

  } else {
    // Above surface (sky reflection)
    float skyGradient = surface * 2.0;
    skyGradient = clamp(skyGradient, 0.0, 1.0);

    // Gradient from horizon to sky
    float hue = 0.6 - skyGradient * 0.1;
    float sat = 0.4 - skyGradient * 0.2;
    float val = 0.8 - skyGradient * 0.3;

    color = hsv2rgb(vec3(hue, sat, val));

    // Sun reflection
    float sunDist = length(vec2(uv.x, surface - 0.3));
    float sun = smoothstep(0.1, 0.0, sunDist);
    color += vec3(1.0, 0.9, 0.7) * sun;
  }

  // Foam at wave peaks
  float foam = smoothstep(0.02, 0.0, abs(surface));
  foam *= 0.5 + uEnergy * 0.5;
  color += foam * 0.5;

  // Beat makes waves splash
  float splash = uBeat * smoothstep(0.05, 0.0, abs(surface));
  color += splash * 0.3;

  // Vignette
  float dist = length(vUv - 0.5);
  color *= 1.0 - dist * 0.3;

  gl_FragColor = vec4(color, 1.0);
}
