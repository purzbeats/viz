// Geodesic - Geodesic sphere wireframe, vertices displaced by spectrum

uniform float uTime;
uniform float uBass;
uniform float uMid;
uniform float uHigh;
uniform float uEnergy;
uniform float uBeat;
uniform float uBassAccum;
uniform float uBeatCount;
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

// Rotation matrices
mat3 rotX(float a) {
  float c = cos(a), s = sin(a);
  return mat3(1,0,0, 0,c,-s, 0,s,c);
}

mat3 rotY(float a) {
  float c = cos(a), s = sin(a);
  return mat3(c,0,s, 0,1,0, -s,0,c);
}

mat3 rotZ(float a) {
  float c = cos(a), s = sin(a);
  return mat3(c,-s,0, s,c,0, 0,0,1);
}

// Line SDF in 2D
float sdSegment(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

// Project 3D point to 2D
vec2 project(vec3 p, float fov) {
  float perspective = fov / (fov - p.z);
  return p.xy * perspective;
}

void main() {
  vec2 uv = vUv - 0.5;
  uv.x *= uResolution.x / uResolution.y;

  vec3 color = vec3(0.0);

  // Rotation
  float rotSpeed = 0.3 + uEnergy * 0.5;
  mat3 rot = rotY(uTime * rotSpeed) * rotX(uTime * rotSpeed * 0.7 + uBassAccum * 0.2);

  // Icosahedron vertices
  float phi = (1.0 + sqrt(5.0)) / 2.0;
  vec3 verts[12];
  verts[0] = normalize(vec3(-1.0, phi, 0.0));
  verts[1] = normalize(vec3(1.0, phi, 0.0));
  verts[2] = normalize(vec3(-1.0, -phi, 0.0));
  verts[3] = normalize(vec3(1.0, -phi, 0.0));
  verts[4] = normalize(vec3(0.0, -1.0, phi));
  verts[5] = normalize(vec3(0.0, 1.0, phi));
  verts[6] = normalize(vec3(0.0, -1.0, -phi));
  verts[7] = normalize(vec3(0.0, 1.0, -phi));
  verts[8] = normalize(vec3(phi, 0.0, -1.0));
  verts[9] = normalize(vec3(phi, 0.0, 1.0));
  verts[10] = normalize(vec3(-phi, 0.0, -1.0));
  verts[11] = normalize(vec3(-phi, 0.0, 1.0));

  // Scale based on bass
  float scale = 0.35 + uBass * 0.15 + uBeat * 0.1;

  // Apply spectrum displacement and rotation to vertices
  vec3 displaced[12];
  for (int i = 0; i < 12; i++) {
    vec3 v = verts[i];

    // Sample spectrum based on vertex position
    float specIdx = float(i) / 12.0;
    float specVal = texture2D(uSpectrum, vec2(specIdx, 0.5)).r / 255.0;

    // Displace along normal (which is the vertex itself for a sphere)
    float displacement = 1.0 + specVal * 0.4 + uEnergy * 0.1;
    v *= displacement * scale;

    // Rotate
    v = rot * v;

    displaced[i] = v;
  }

  // Icosahedron edges (connecting vertices)
  int edges[60];
  edges[0]=0; edges[1]=1; edges[2]=0; edges[3]=5; edges[4]=0; edges[5]=7;
  edges[6]=0; edges[7]=10; edges[8]=0; edges[9]=11;
  edges[10]=1; edges[11]=5; edges[12]=1; edges[13]=7; edges[14]=1; edges[15]=8; edges[16]=1; edges[17]=9;
  edges[18]=2; edges[19]=3; edges[20]=2; edges[21]=4; edges[22]=2; edges[23]=6; edges[24]=2; edges[25]=10; edges[26]=2; edges[27]=11;
  edges[28]=3; edges[29]=4; edges[30]=3; edges[31]=6; edges[32]=3; edges[33]=8; edges[34]=3; edges[35]=9;
  edges[36]=4; edges[37]=5; edges[38]=4; edges[39]=9; edges[40]=4; edges[41]=11;
  edges[42]=5; edges[43]=9; edges[44]=5; edges[45]=11;
  edges[46]=6; edges[47]=7; edges[48]=6; edges[49]=8; edges[50]=6; edges[51]=10;
  edges[52]=7; edges[53]=8; edges[54]=7; edges[55]=10;
  edges[56]=8; edges[57]=9; edges[58]=10; edges[59]=11;

  // Draw edges
  float fov = 2.0;
  float lineIntensity = 0.0;

  for (int i = 0; i < 30; i++) {
    int idx1 = edges[i * 2];
    int idx2 = edges[i * 2 + 1];

    vec3 v1 = displaced[idx1];
    vec3 v2 = displaced[idx2];

    // Project to 2D
    vec2 p1 = project(v1, fov);
    vec2 p2 = project(v2, fov);

    // Distance to edge
    float d = sdSegment(uv, p1, p2);

    // Line thickness based on depth
    float avgZ = (v1.z + v2.z) * 0.5;
    float thickness = 0.003 + 0.002 * (1.0 + avgZ);

    // Glow
    float glow = smoothstep(thickness * 3.0, 0.0, d);

    // Brightness based on depth (further = dimmer)
    float brightness = 0.5 + 0.5 * (1.0 + avgZ);

    lineIntensity += glow * brightness;
  }

  // Color
  float hue = uTime * 0.05 + uMid * 0.3;
  float sat = 0.6 + uHigh * 0.4;
  color = hsv2rgb(vec3(hue, sat, 1.0)) * lineIntensity;

  // Add vertex points
  for (int i = 0; i < 12; i++) {
    vec2 p = project(displaced[i], fov);
    float d = length(uv - p);
    float pointSize = 0.015 + uBeat * 0.01;
    float point = smoothstep(pointSize, 0.0, d);

    float pointHue = float(i) / 12.0 + uTime * 0.1;
    color += hsv2rgb(vec3(pointHue, 0.8, 1.0)) * point;
  }

  // Beat flash
  color += uBeat * 0.2;

  // Vignette
  float dist = length(vUv - 0.5);
  color *= 1.0 - dist * 0.6;

  gl_FragColor = vec4(color, 1.0);
}
