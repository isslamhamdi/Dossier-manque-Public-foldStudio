// Stress-whitening shader — polymer crazing visualization.
//
// When a living hinge is bent beyond its whitening threshold, the polymer
// matrix micro-cracks (crazes), scattering light and appearing milky white.
// This is a characteristic visual of PP living hinges in injection-moulded
// packaging (e.g., cosmetics flip-caps, yogurt lids).
//
// The whitening zone is modeled as a Gaussian bell function:
//   W(x) = intensity × exp(−(x − crease)² / (2σ²))
// where σ = whiteningWidth / 3 so the bell reaches near-zero at the zone edge.
//
// The shader overlays a white tint on top of the base panel material.
// It is applied as a second render pass (transparent mesh on top of Panel).

export const stressWhiteningVertexShader = /* glsl */`
varying vec2 vUv;

void main() {
  vUv         = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

export const stressWhiteningFragmentShader = /* glsl */`
precision highp float;

// 0-1: overall whitening intensity from computeLivingHinge().whiteningIntensity
uniform float uWhiteningIntensity;

// Which axis the hinge is on: 0 = horizontal (fold along X), 1 = vertical (fold along Y)
uniform int   uHingeAxis;

// Panel dimensions in UV space (0-1) — crease position along the hinge axis
uniform float uCreaseUV;    // e.g. 0.0 for bottom edge, 1.0 for top edge

// Width of whitening zone in UV space (fraction of panel size)
uniform float uZoneWidth;   // e.g. 0.15 for 15% of panel height near crease

varying vec2 vUv;

void main() {
  if (uWhiteningIntensity < 0.01) discard;

  // Distance from crease in UV space
  float uvPos  = uHingeAxis == 0 ? vUv.y : vUv.x;
  float d      = abs(uvPos - uCreaseUV);
  float sigma  = uZoneWidth / 3.0;
  float bell   = exp(-d * d / (2.0 * sigma * sigma));

  float alpha  = bell * uWhiteningIntensity * 0.85;
  if (alpha < 0.01) discard;

  // Add slight blue tint at fracture — crazing scatters slightly blue
  vec3 whiteColor = mix(vec3(1.0), vec3(0.92, 0.94, 1.0), uWhiteningIntensity * 0.3);

  gl_FragColor = vec4(whiteColor, alpha);
}
`

export interface StressWhiteningUniforms {
  whiteningIntensity: number   // 0-1
  hingeAxis:          0 | 1   // 0=horizontal, 1=vertical
  creaseUV:           number   // 0-1 position of crease in UV space
  zoneWidth:          number   // UV-space width of whitening zone
}

export const DEFAULT_WHITENING_UNIFORMS: StressWhiteningUniforms = {
  whiteningIntensity: 0,
  hingeAxis:          0,
  creaseUV:           0,
  zoneWidth:          0.12,
}
