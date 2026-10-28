'use client'

import { Environment, Lightformer } from '@react-three/drei'

/**
 * Photographic studio: no external HDR (works offline). A procedural environment of softboxes gives wrapped light and
 * natural fabric highlights, while a directional key from the upper front-left carries the form. The key has to stay
 * dominant over the diffuse environment: with soft, symmetric light (strong overhead + floor bounce) the quilting,
 * padding and seams that read clearly in the reference photographs go flat.
 */
export function LightingSystem({ isMobile = false }: { isMobile?: boolean }) {
  return (
    <>
      <Environment resolution={isMobile ? 128 : 256} frames={1} environmentIntensity={0.7}>
        {/* key softbox: front-left, above */}
        <Lightformer form="rect" intensity={7} color="#fff3e6" position={[-4.5, 4.6, 4.6]} scale={[5, 3.5, 1]} target={[0, 1, 0]} />
        {/* fill: front-right, low and large, cool */}
        <Lightformer form="rect" intensity={2.8} color="#e8f0ff" position={[5, 1.6, 4]} scale={[5, 3, 1]} target={[0, 1, 0]} />
        {/* overhead */}
        <Lightformer form="rect" intensity={2.6} position={[0, 7, 0]} rotation-x={Math.PI / 2} scale={[7, 7, 1]} />
        {/* rim strips behind the product */}
        <Lightformer form="rect" intensity={5} color="#ffffff" position={[-5, 2.5, -4]} scale={[1.2, 6, 1]} target={[0, 1, 0]} />
        <Lightformer form="rect" intensity={5} color="#ffffff" position={[5, 2.5, -4]} scale={[1.2, 6, 1]} target={[0, 1, 0]} />
        {/* faint floor bounce */}
        <Lightformer form="rect" intensity={0.45} color="#e6dfd8" position={[0, -0.5, 3]} rotation-x={-Math.PI / 2} scale={[10, 10, 1]} />
      </Environment>
      <hemisphereLight args={['#dfe6f0', '#1c1a18', 0.4]} />
      {/* physical units (diffuse = albedo / pi x intensity x N.L): key matches the softbox, cool fill keeps the far side red */}
      <directionalLight position={[-2.6, 5.2, 3.6]} intensity={5.2} color="#fff6ec" />
      <directionalLight position={[3.4, 2.0, 1.6]} intensity={2.1} color="#dfe8ff" />
      {/* soft rear fill: the straps and back panel stay readable when the product is rotated */}
      <directionalLight position={[-0.6, 3.0, -4.2]} intensity={1.3} color="#f2f0ee" />
      {/* shadow only (no light: intensity 0, so the product's shading is unchanged). The open sequence begins with a
          forward shadow from the lights behind the bag (Cycles); from behind-left, this one gives the live model the same
          wedge where it hands over to those frames. Only the studio floor receives it (ShadowCatcher in
          ProductCanvasInner), and only near that hand-over (studioLight.ts) */}
      <directionalLight
        position={[-2.0, 3.0, -4.2]}
        intensity={0}
        castShadow
        shadow-mapSize={isMobile ? [512, 512] : [1024, 1024]}
        shadow-radius={isMobile ? 12 : 24}
        shadow-blurSamples={isMobile ? 8 : 16}
        shadow-bias={-0.0004}
        shadow-camera-left={-3.5}
        shadow-camera-right={3.5}
        shadow-camera-top={3.5}
        shadow-camera-bottom={-3.5}
        shadow-camera-near={0.5}
        shadow-camera-far={14}
      />
    </>
  )
}
