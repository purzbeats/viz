// Waveform3D - 3D waveform ribbon that twists and morphs

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

mat2 rot2D(float a) {
  float s = sin(a);
  float c = cos(a);
  return mat2(c, -s, s, c);
}

// 3D rotation
vec3 rotateY(vec3 p, float a) {
  float c = cos(a);
  float s = sin(a);
  return vec3(p.x * c + p.z * s, p.y, -p.x * s + p.z * c);
}

vec3 rotateX(vec3 p, float a) {
  float c = cos(a);
  float s = sin(a);
  return vec3(p.x, p.y * c - p.z * s, p.y * s + p.z * c);
}

void main() {
  vec2 uv = vUv - 0.5;
  uv.x *= uResolution.x / uResolution.y;

  vec3 color = vec3(0.0);

  // Multiple ribbon layers
  for (float layer = 0.0; layer < 5.0; layer++) {
    float layerOffset = layer / 5.0;
    float depth = 1.0 - layerOffset * 0.3;

    // Ribbon parameters
    float ribbonY = (layer - 2.0) * 0.15;
    ribbonY += sin(uTime * 0.5 + layer) * 0.05 * uEnergy;

    // Sample waveform for this layer
    for (float i = 0.0; i < 64.0; i++) {
      float t = i / 64.0;

      // Get waveform sample
      float waveVal = texture2D(uWaveform, vec2(t, 0.5)).r / 255.0 - 0.5;

      // 3D position of ribbon segment
      vec3 pos = vec3(
        (t - 0.5) * 2.0,
        ribbonY + waveVal * (0.3 + uBass * 0.3),
        -0.5 - layer * 0.2
      );

      // Rotate based on audio
      float rotY = uTime * 0.3 + uBassAccum * 0.2;
      float rotX = sin(uTime * 0.2) * 0.3 + uMid * 0.5;
      pos = rotateY(pos, rotY);
      pos = rotateX(pos, rotX);

      // Project to 2D
      float perspective = 1.0 / (1.5 - pos.z);
      vec2 projected = pos.xy * perspective;

      // Distance to this point
      float dist = length(uv - projected);

      // Line thickness based on spectrum
      float specVal = texture2D(uSpectrum, vec2(t, 0.5)).r / 255.0;
      float thickness = 0.01 + specVal * 0.02 + uEnergy * 0.01;

      // Glow
      float glow = thickness / (dist + 0.001);
      glow = pow(glow, 1.5) * 0.02;

      // Color
      float hue = t + layer * 0.1 + uTime * 0.1;
      float sat = 0.7 + uHigh * 0.3;
      float val = glow * depth * (0.5 + specVal * 0.5);

      color += hsv2rgb(vec3(hue, sat, val));
    }
  }

  // Beat pulse
  float centerDist = length(uv);
  color += (1.0 - smoothstep(0.0, 0.3, centerDist)) * uBeat * 0.3;

  // Tone mapping
  color = color / (color + 1.0);

  gl_FragColor = vec4(color, 1.0);
}
