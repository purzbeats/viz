// Bars - Classic spectrum analyzer bars

uniform float uTime;
uniform float uBass;
uniform float uMid;
uniform float uHigh;
uniform float uEnergy;
uniform float uBeat;
uniform sampler2D uSpectrum;
uniform vec2 uResolution;

varying vec2 vUv;

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
  vec2 uv = vUv;
  uv.x *= uResolution.x / uResolution.y;

  // Center the bars
  uv.x -= (uResolution.x / uResolution.y - 1.0) * 0.5;

  vec3 color = vec3(0.0);

  // Number of bars
  float numBars = 64.0;
  float barWidth = 1.0 / numBars;
  float gap = 0.2; // Gap ratio

  // Which bar are we in?
  float barIndex = floor(uv.x / barWidth);
  float barLocalX = fract(uv.x / barWidth);

  if (barIndex >= 0.0 && barIndex < numBars) {
    // Sample spectrum for this bar
    float specIdx = barIndex / numBars;
    float specVal = texture2D(uSpectrum, vec2(specIdx, 0.5)).r / 255.0;

    // Bar height
    float barHeight = specVal * 0.9 + 0.05;

    // Mirror from center
    float y = abs(uv.y - 0.5) * 2.0;

    // Are we inside the bar?
    float inBar = step(y, barHeight) * step(gap * 0.5, barLocalX) * step(barLocalX, 1.0 - gap * 0.5);

    // Segmented bars (LED style)
    float segments = 20.0;
    float segmentY = fract(y * segments);
    float segmentLine = smoothstep(0.0, 0.1, segmentY) * smoothstep(1.0, 0.9, segmentY);

    // Color gradient based on height
    float hue = specIdx * 0.3 + y * 0.3 + uTime * 0.05;
    float sat = 0.8;
    float val = inBar * segmentLine * (0.7 + uEnergy * 0.3);

    // Peak indicator (brighter at top)
    float peak = smoothstep(barHeight - 0.05, barHeight, y) * inBar;
    val += peak * 0.5;

    color = hsv2rgb(vec3(hue, sat, val));

    // Glow effect
    float glow = (1.0 - abs(barLocalX - 0.5) * 2.0) * specVal * 0.3;
    color += hsv2rgb(vec3(hue, 0.5, glow));
  }

  // Background pulse
  color += vec3(0.02) * uBeat;

  // Reflection at bottom
  if (uv.y < 0.3) {
    float reflectY = 0.3 - uv.y;
    float reflectAlpha = (1.0 - reflectY / 0.3) * 0.3;
    // Sample from mirrored position
    vec2 reflectUv = vec2(uv.x, 0.3 + reflectY);
    float rBarIndex = floor(reflectUv.x / barWidth);
    if (rBarIndex >= 0.0 && rBarIndex < numBars) {
      float rSpecVal = texture2D(uSpectrum, vec2(rBarIndex / numBars, 0.5)).r / 255.0;
      float rY = abs(reflectUv.y - 0.5) * 2.0;
      if (rY < rSpecVal * 0.9 + 0.05) {
        color += hsv2rgb(vec3(rBarIndex / numBars * 0.3, 0.5, reflectAlpha));
      }
    }
  }

  gl_FragColor = vec4(color, 1.0);
}
