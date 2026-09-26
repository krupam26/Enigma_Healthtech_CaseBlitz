import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * The premium 3D capsule — MedCheck's core visual identity.
 * `progress` (0–1) is scroll-driven from the Landing page: at 0 the pill
 * idles with a slow auto-rotation; as progress rises it spins faster,
 * scales up slightly, and the two halves separate to "open".
 * A standalone <Pill3D size="sm" /> (progress fixed at ~0.05) is reused as
 * the recurring transition motif between sections and on the auth screens.
 */
function CapsuleHalf({ top, separation, tiltIn }: { top: boolean; separation: number; tiltIn: number }) {
  const group = useRef<THREE.Group>(null)
  const sign = top ? 1 : -1

  useFrame(() => {
    if (!group.current) return
    group.current.position.y = sign * (0.55 + separation)
    group.current.rotation.x = sign * tiltIn * -1
  })

  return (
    <group ref={group}>
      {/* dome/cap */}
      <mesh position={[0, sign * 0.35, 0]} castShadow>
        <sphereGeometry args={[0.62, 48, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color={top ? '#9FE0CB' : '#0E4744'}
          roughness={0.25}
          metalness={0.1}
        />
      </mesh>
      {/* cylinder body of this half */}
      <mesh position={[0, sign * 0.02, 0]} rotation={[top ? Math.PI : 0, 0, 0]} castShadow>
        <cylinderGeometry args={[0.62, 0.62, 0.66, 48, 1, true]} />
        <meshStandardMaterial
          color={top ? '#CFF3E4' : '#177670'}
          roughness={0.3}
          metalness={0.08}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}

function Capsule({ progress }: { progress: number }) {
  const spin = useRef<THREE.Group>(null)
  const clamped = Math.max(0, Math.min(1, progress))

  useFrame((_, delta) => {
    if (!spin.current) return
    const idleSpeed = 0.28
    const speed = idleSpeed + clamped * 1.6
    spin.current.rotation.y += delta * speed
    spin.current.rotation.x = THREE.MathUtils.lerp(0.12, 0.32, clamped)
    const s = 1 + clamped * 0.18
    spin.current.scale.setScalar(s)
  })

  const separation = clamped * 0.85
  const tilt = clamped * 0.35

  return (
    <group ref={spin}>
      <CapsuleHalf top separation={separation} tiltIn={tilt} />
      <CapsuleHalf top={false} separation={separation} tiltIn={tilt} />
    </group>
  )
}

export default function Pill3D({
  progress = 0,
  height = 480,
}: {
  progress?: number
  height?: number
}) {
  const dpr = useMemo(() => (typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1), [])
  return (
    <div style={{ height, width: '100%' }}>
      <Canvas
        dpr={dpr}
        shadows
        camera={{ position: [0, 0, 4.2], fov: 38 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.65} />
        <directionalLight position={[3, 4, 5]} intensity={1.1} castShadow />
        <directionalLight position={[-3, -2, -4]} intensity={0.35} color="#9FE0CB" />
        <Capsule progress={progress} />
      </Canvas>
    </div>
  )
}
