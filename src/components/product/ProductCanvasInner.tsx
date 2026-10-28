'use client'

import { ContactShadows } from '@react-three/drei'
import { Canvas, advance, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { Vector2, type Group, type Mesh, type MeshBasicMaterial } from 'three'
import { LightingSystem } from './LightingSystem'
import { ProductRoot } from './ProductRoot'
import { ExplodedViewController } from './ExplodedViewController'
import { CameraController } from './CameraController'
import { TelemetryVisualization } from './TelemetryVisualization'
import { applyRenderSettings } from './renderSettings'
import { useExperienceStore } from '@/state/experienceStore'
import { FILM, sequenceFirstCamera } from '@/motion/sequences'
import { heroInteractionWeight } from '@/motion/cameraTrack'
import { addRenderer, requestFrame, warmUp } from '@/motion/frameLoop'
import { liveLayerActive } from './liveLayer'
import { contactShadowOpacity, forwardShadowWeight } from '@/motion/studioLight'

/** the rotation rig's group: the floor shadow is re-rendered when the bag turns */
const rig: { current: Group | null } = { current: null }

/** Interactive yaw (drag / hotspots) in the hero chapter. Its weight is a function of scroll that is zero at both hero
 *  boundaries, so the product is always at the reference pose (yaw 0, as rendered in the sequences) when it hands
 *  over to the reveal frames or the detail path — in either scroll direction, without a time-based return. */
function RotationRig({ children }: { children: React.ReactNode }) {
  const ref = useRef<Group>(null)
  useFrame((_, delta) => {
    const st = useExperienceStore.getState()
    const goal = st.yaw * heroInteractionWeight(st.phase, st.chapterProgress)
    const g = ref.current
    if (!g) return
    // eased so the visitor's drags and hotspot turns feel physical; keeps asking for frames until it has settled
    const t = st.reducedMotion ? 1 : 1 - Math.pow(0.0005, Math.min(delta, 0.1))
    g.rotation.y += (goal - g.rotation.y) * t
    if (Math.abs(goal - g.rotation.y) > 1e-4) requestFrame()
    else g.rotation.y = goal
  })
  return (
    <group
      ref={(g) => {
        ref.current = g
        rig.current = g
      }}
    >
      {children}
    </group>
  )
}

/**
 * The contact shadow is rendered only when the pose changes (opening stages / model loaded), not
 * every frame: ContactShadows renders `frames` passes after each re-render. It sits inside the rotation rig, so the
 * drag yaw turns the baked shadow with the bag at no cost. (It is mounted after ExplodedViewController, so its single
 * pass runs after the new pose has been applied in the same frame.)
 *
 * It sits just below the floor: drei draws its blur passes on a plane at the world origin, seen by the shadow camera at
 * this position looking up. Above the origin (it used to be at +1 mm), that plane was behind the camera, so every blur
 * pass cleared the shadow to nothing and the live chapters showed no contact shadow at all. Its strength follows the
 * frames it hands over to (studioLight.ts): a material uniform, written every rendered frame.
 */
function StudioShadow({ isMobile }: { isMobile: boolean }) {
  // opening stages only, in 1/24 steps: in the exploded overview the lower compartment never leaves the floor, so its
  // footprint (all a contact shadow shows) does not change while the upper layers lift
  const key = useExperienceStore((s) => {
    const q = (v: number) => Math.round(v * 24)
    const st = s.stages
    return `${s.modelReady}:${q(st.flap)}:${q(st.lid)}:${q(st.drop)}:${q(st.boxOut)}:${q(st.boxLid)}`
  })
  const ref = useRef<Group>(null)
  useFrame(() => {
    const plane = ref.current?.children.find((c) => (c as Mesh).isMesh) as Mesh | undefined
    if (plane) (plane.material as MeshBasicMaterial).opacity = contactShadowOpacity(useExperienceStore.getState().progress)
  })
  return (
    <ContactShadows
      ref={ref}
      frames={1}
      position={[0, -0.005, 0]}
      opacity={0.6}
      scale={isMobile ? 6 : 8}
      blur={1.6}
      far={1.5}
      resolution={isMobile ? 256 : 512}
      color="#000000"
      // a changing prop re-renders the component, which re-arms its frame counter
      userData={{ pose: key }}
    />
  )
}

/**
 * The floor that receives the forward shadow (LightingSystem's shadow-only light): the open sequence begins with one, so
 * the live model needs it where it hands over to those frames. Its weight is a material uniform (studioLight.ts), and
 * like an area light's shadow it fades with distance from the bag. The shadow map is re-rendered only when the bag's pose or
 * turn changes (shadowMap.autoUpdate is off). The floor lives on layer 1, which the camera renders but ContactShadows'
 * depth pass (layer 0) never sees.
 */
const catcher = { uWeight: { value: 0 }, uFade: { value: new Vector2(0.45, 1.8) } }

function ShadowCatcher() {
  const mesh = useRef<Mesh>(null)
  const last = useRef('')
  const compiled = useRef(false)
  useFrame(({ camera, gl }) => {
    camera.layers.enable(1)
    const st = useExperienceStore.getState()
    const w = forwardShadowWeight(st.progress)
    catcher.uWeight.value = w
    const on = w > 0.002
    // the first rendered frame is the warm-up under the opening frames: draw the floor once (weight 0, invisible) so
    // its program compiles there and not mid-scroll when chapter 02 first needs it
    if (mesh.current) mesh.current.visible = on || !compiled.current
    compiled.current = true
    if (!on) return
    // the shadow map is re-rendered only while the shadow shows, and then only when the bag's pose or turn changes
    const q = (v: number) => Math.round(v * 48)
    const s = st.stages
    const key = `${st.modelReady}:${q(s.flap)}:${q(s.lid)}:${q(s.drop)}:${q(s.boxOut)}:${q(s.boxLid)}:${q(st.explodedAmount)}:${q(rig.current?.rotation.y ?? 0)}`
    if (key !== last.current) {
      last.current = key
      gl.shadowMap.needsUpdate = true
    }
  })
  return (
    <mesh ref={mesh} rotation-x={-Math.PI / 2} receiveShadow layers={1} renderOrder={-1} visible={false}>
      <planeGeometry args={[16, 16]} />
      <shadowMaterial
        transparent
        depthWrite={false}
        onBeforeCompile={(shader) => {
          shader.uniforms.uWeight = catcher.uWeight
          shader.uniforms.uFade = catcher.uFade
          shader.vertexShader = 'varying vec3 vFloor;\n' + shader.vertexShader.replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\n\tvFloor = (modelMatrix * vec4(transformed, 1.0)).xyz;')
          shader.fragmentShader = 'uniform float uWeight;\nuniform vec2 uFade;\nvarying vec3 vFloor;\n' + shader.fragmentShader
            .replace('#include <shadowmask_pars_fragment>', SHADOW_MASK)
            .replace('#include <fog_fragment>', '#include <fog_fragment>\n\tgl_FragColor.a *= 1.0 - smoothstep(uFade.x, uFade.y, length(vFloor.xz));')
        }}
      />
    </mesh>
  )
}

/** three's shadow mask for directional lights, with the weight as a material uniform instead of light.shadow.intensity
 *  (light uniforms are only re-uploaded when the scene's light setup changes, so that one cannot follow the scroll) */
const SHADOW_MASK = `float getShadowMask() {
\tfloat shadow = 1.0;
\t#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
\tDirectionalLightShadow directionalLight;
\t#pragma unroll_loop_start
\tfor ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
\t\tdirectionalLight = directionalLightShadows[ i ];
\t\tshadow *= getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, uWeight, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] );
\t}
\t#pragma unroll_loop_end
\t#endif
\treturn shadow;
}`

/** Renders this canvas from the shared frame loop (motion/frameLoop.ts), only while the live layer is on screen. */
function FrameLoopBridge() {
  const get = useThree((s) => s.get)
  useEffect(() => addRenderer((now) => {
    if (!liveLayerActive(useExperienceStore.getState()) && !warmUp.pending) return
    warmUp.pending = false
    advance(now, true, get())
  }, 30), [get])
  return null
}

const START = sequenceFirstCamera('reveal')

export function ProductCanvasInner() {
  const isMobile = useExperienceStore((s) => s.isMobile)

  return (
    <Canvas
      // variance shadow maps: smooth, noise-free penumbrae for the rear light's floor shadow (ShadowCatcher)
      shadows="variance"
      frameloop="never"
      // 1.5 device pixels per CSS pixel is visually indistinguishable here (the frames carry the fine detail) and
      // halves the fill cost of a full-screen canvas on 2x/3x displays
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ fov: START.fov, aspect: FILM.aspect, position: START.pos, near: 0.1, far: 60 }}
      onCreated={({ gl }) => {
        applyRenderSettings(gl)
        gl.setClearColor(0x000000, 0)
        gl.shadowMap.autoUpdate = false
        gl.shadowMap.needsUpdate = true
        requestFrame()
      }}
      style={{ pointerEvents: 'none' }}
    >
      <FrameLoopBridge />
      <LightingSystem isMobile={isMobile} />
      <TelemetryVisualization />
      <ShadowCatcher />
      <RotationRig>
        <ProductRoot />
        <ExplodedViewController />
        {/* the studio floor is the CSS backdrop shared with the image sequences; only the shadows are 3D */}
        <StudioShadow isMobile={isMobile} />
      </RotationRig>
      <CameraController />
    </Canvas>
  )
}
