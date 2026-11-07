import * as THREE from 'three'

/**
 * Shared renderer look for every WebGL view of the product (narrative stage, explore view, dev review).
 * Neutral tone mapping keeps the saturated INFINOS red red: ACES clipped it toward salmon/orange and flattened the
 * quilting, because the red channel saturated long before green/blue.
 */
export const RENDER_SETTINGS = {
  toneMapping: THREE.NeutralToneMapping,
  toneMappingExposure: 0.8, // calibrated against the Cycles frames at the sequence hand-overs (see sequences.json displayGain)
  outputColorSpace: THREE.SRGBColorSpace,
} as const

export function applyRenderSettings(gl: THREE.WebGLRenderer) {
  // in production, three.js does not read back every program's compile log (a synchronous wait on the GPU process per
  // program); development keeps the checks so shader errors are still reported
  gl.debug.checkShaderErrors = process.env.NODE_ENV !== 'production'
  gl.toneMapping = RENDER_SETTINGS.toneMapping
  gl.toneMappingExposure = RENDER_SETTINGS.toneMappingExposure
  gl.outputColorSpace = RENDER_SETTINGS.outputColorSpace
}
