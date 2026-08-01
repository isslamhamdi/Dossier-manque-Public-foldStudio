// Kubelka-Munk printing shader — GPU-side CMYK ink simulation.
//
// Model overview:
//   The Kubelka-Munk theory describes light interaction in layered turbid media.
//   For a printable packaging simulation we use a 4-layer stack:
//     Layer 0: board substrate (opaque, colored)
//     Layer 1: CMYK ink (semi-transparent absorption)
//     Layer 2: laminate / OPP (gloss/matte modifier, optional)
//     Layer 3: selective UV varnish (specular hotspot mask, optional)
//
//   The GPU approximation uses per-channel Beer-Lambert absorption for the ink
//   combined with a Saunderson correction term for the substrate reflectance.
//   This gives perceptually accurate color shifts (cyan ink on kraft = blue-grey)
//   without requiring iterative K-M solver in the fragment shader.
//
// GLSL uniforms exposed:
//   uBoardColor  : vec3  — substrate base color (sRGB 0-1)
//   uCMYK        : vec4  — ink densities C, M, Y, K (0-1 each)
//   uLaminate    : float — 0=none, 1=matte, 2=gloss (modifies roughness)
//   uVarnishMask : sampler2D — white=varnish, black=none (optional)
//   uVarnishAmt  : float — varnish intensity 0-1
//   uAlbedoTex   : sampler2D — artwork/image texture
//   uImageMix    : float — blend between KM simulation and raw image (0=KM, 1=image)
//   vUv          : vec2  — texture coordinates from vertex shader

// Absorption coefficients K (per channel) for process CMYK inks.
// Values are empirical fits to ISO 12647-2 spectral data.
const KM_ABSORPTION = `
const vec3 K_CYAN    = vec3(0.95, 0.05, 0.02);
const vec3 K_MAGENTA = vec3(0.05, 0.90, 0.05);
const vec3 K_YELLOW  = vec3(0.02, 0.05, 0.85);
const vec3 K_BLACK   = vec3(0.92, 0.92, 0.88);
`

export const printingVertexShader = /* glsl */`
uniform vec2 uUvOffset;
uniform vec2 uUvScale;

varying vec2 vUv;
varying vec2 vUv0;   // base UV (no offset/scale) — used for alpha map sampling
varying vec3 vNormal;
varying vec3 vWorldPos;

void main() {
  vUv0      = uv;
  vUv       = uv * uUvScale + uUvOffset;
  vNormal   = normalize(normalMatrix * normal);
  vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

export const printingFragmentShader = /* glsl */`
precision highp float;

uniform vec3      uBoardColor;
uniform vec4      uCMYK;           // C, M, Y, K densities
uniform float     uLaminate;       // 0=none 1=matte 2=gloss
uniform sampler2D uVarnishMask;
uniform float     uVarnishAmt;
uniform sampler2D uAlbedoTex;
uniform float     uImageMix;
uniform bool      uHasImage;
uniform vec3      uCameraPos;
uniform vec2      uUvOffset;
uniform vec2      uUvScale;
uniform sampler2D uAlphaTex;       // panel shape alpha mask (white=opaque, black=cut)
uniform bool      uHasAlpha;       // true when an alpha mask is bound

varying vec2 vUv;
varying vec2 vUv0;                 // base UV for alpha map (no offset)
varying vec3 vNormal;
varying vec3 vWorldPos;

${KM_ABSORPTION}

// Beer-Lambert absorption: transmittance T = exp(-K × density)
// Applied per RGB channel using ink-specific absorption vectors
vec3 inkAbsorption(float c, float m, float y, float k) {
  vec3 T_c = exp(-K_CYAN    * c);
  vec3 T_m = exp(-K_MAGENTA * m);
  vec3 T_y = exp(-K_YELLOW  * y);
  vec3 T_k = exp(-K_BLACK   * k);
  // Combined transmittance (inks stack multiplicatively)
  return T_c * T_m * T_y * T_k;
}

// Saunderson correction: accounts for internal reflection at paper surface
// R_corrected = (R_substrate × transmittance²) / (1 − r1×R_substrate)
// r1 ≈ 0.04 (Fresnel at ~1.5 paper refractive index)
vec3 saunderson(vec3 Rb, vec3 T) {
  const float r1 = 0.04;
  vec3 num  = Rb * T * T;
  vec3 denom = vec3(1.0) - r1 * Rb;
  return clamp(num / max(denom, vec3(0.001)), vec3(0.0), vec3(1.0));
}

// Simple Blinn-Phong specular for varnish hotspot
float specular(vec3 N, vec3 V, float roughness) {
  vec3 L   = normalize(vec3(1.0, 2.0, 1.5));
  vec3 H   = normalize(V + L);
  float nH = max(dot(N, H), 0.0);
  float exp_ = 2.0 / max(roughness * roughness, 0.001) - 2.0;
  return pow(nH, exp_) * (exp_ + 2.0) / (2.0 * 3.14159);
}

void main() {
  vec3 N   = normalize(vNormal);
  vec3 V   = normalize(uCameraPos - vWorldPos);

  // ── Kubelka-Munk layer ───────────────────────────────────────────────────
  vec3 Rb  = pow(uBoardColor, vec3(2.2));          // sRGB → linear
  vec3 T   = inkAbsorption(uCMYK.x, uCMYK.y, uCMYK.z, uCMYK.w);
  vec3 kmColor = saunderson(Rb, T);
  kmColor  = pow(kmColor, vec3(1.0 / 2.2));        // linear → sRGB

  // ── Image/artwork blend ──────────────────────────────────────────────────
  vec3 finalColor = kmColor;
  if (uHasImage) {
    vec4 imgSample  = texture2D(uAlbedoTex, vUv);
    // Linearize image (sRGB → linear) before multiply-blend, then re-encode.
    // Prevents the "too pale" artifact from multiplying in gamma space.
    vec3 imgLinear  = pow(max(imgSample.rgb, vec3(0.0001)), vec3(2.2));
    vec3 kmLinear   = pow(max(kmColor, vec3(0.0001)), vec3(2.2));
    vec3 multiply   = pow(kmLinear * imgLinear, vec3(1.0 / 2.2));
    finalColor = mix(multiply, imgSample.rgb, uImageMix);
  }

  // ── Laminate roughness tint ──────────────────────────────────────────────
  float roughness = 0.65;                           // base (uncoated board)
  if (uLaminate > 1.5) roughness = 0.08;           // gloss OPP
  else if (uLaminate > 0.5) roughness = 0.55;      // matte
  // Simple darkening for matte (forward scattering)
  if (uLaminate > 0.5 && uLaminate < 1.5) finalColor *= 0.95;

  // ── Selective UV varnish ─────────────────────────────────────────────────
  float vMask = texture2D(uVarnishMask, vUv).r;
  float vSpec = 0.0;
  if (uVarnishAmt > 0.0 && vMask > 0.1) {
    float vRough = mix(roughness, 0.04, uVarnishAmt * vMask);
    vSpec = specular(N, V, vRough) * uVarnishAmt * vMask * 0.6;
  }

  // Basic diffuse lighting
  vec3 L     = normalize(vec3(1.0, 2.0, 1.5));
  float diff = max(dot(N, L), 0.0) * 0.7 + 0.3;   // 0.3 ambient
  vec3 color = finalColor * diff + vec3(vSpec);

  float alpha = uHasAlpha ? texture2D(uAlphaTex, vUv0).r : 1.0;
  gl_FragColor = vec4(clamp(color, 0.0, 1.0), alpha);
}
`

// Default uniform values — used in PrintingMaterial.tsx to initialize the shader
export interface PrintingUniforms {
  boardColor:   [number, number, number]
  cmyk:         [number, number, number, number]
  laminate:     number   // 0=none, 1=matte, 2=gloss
  varnishAmt:   number
  imageMix:     number   // 0=pure KM, 1=pure image
}

export const DEFAULT_PRINTING_UNIFORMS: PrintingUniforms = {
  boardColor: [1, 1, 1],
  cmyk:       [0, 0, 0, 0],
  laminate:   0,
  varnishAmt: 0,
  imageMix:   0.5,
}
