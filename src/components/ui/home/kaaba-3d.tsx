"use client"

import { useRef, useMemo } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Float, MeshDistortMaterial, Environment } from "@react-three/drei"
import * as THREE from "three"

function KaabaBody() {
  const meshRef = useRef<THREE.Mesh>(null)
  const timeRef = useRef(0)

  useFrame((_state, delta) => {
    timeRef.current += delta
    if (meshRef.current) {
      meshRef.current.rotation.y = timeRef.current * 0.15
    }
  })

  const blackMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#0a0a0a",
        metalness: 0.3,
        roughness: 0.4,
      }),
    []
  )

  const goldMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#D4A843",
        metalness: 0.8,
        roughness: 0.2,
        emissive: "#D4A843",
        emissiveIntensity: 0.15,
      }),
    []
  )

  const goldDarkMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#B8922E",
        metalness: 0.7,
        roughness: 0.3,
      }),
    []
  )

  return (
    <group ref={meshRef}>
      {/* Main cube body */}
      <mesh material={blackMaterial} castShadow>
        <boxGeometry args={[2, 2.2, 2]} />
      </mesh>

      {/* Gold band - bottom */}
      <mesh position={[0, -0.85, 0]} material={goldMaterial}>
        <boxGeometry args={[2.02, 0.08, 2.02]} />
      </mesh>

      {/* Gold band - middle */}
      <mesh position={[0, 0.1, 0]} material={goldMaterial}>
        <boxGeometry args={[2.02, 0.06, 2.02]} />
      </mesh>

      {/* Gold band - top */}
      <mesh position={[0, 0.85, 0]} material={goldMaterial}>
        <boxGeometry args={[2.02, 0.05, 2.02]} />
      </mesh>

      {/* Kiswah calligraphy band */}
      <mesh position={[0, 0.45, 1.01]} material={goldDarkMaterial}>
        <boxGeometry args={[1.6, 0.35, 0.02]} />
      </mesh>
      <mesh position={[0, 0.45, -1.01]} material={goldDarkMaterial}>
        <boxGeometry args={[1.6, 0.35, 0.02]} />
      </mesh>
      <mesh position={[1.01, 0.45, 0]} material={goldDarkMaterial}>
        <boxGeometry args={[0.02, 0.35, 1.6]} />
      </mesh>
      <mesh position={[-1.01, 0.45, 0]} material={goldDarkMaterial}>
        <boxGeometry args={[0.02, 0.35, 1.6]} />
      </mesh>

      {/* Door (Baab al-Rahmah) */}
      <mesh position={[0, -0.15, 1.015]} material={goldMaterial}>
        <boxGeometry args={[0.5, 0.8, 0.03]} />
      </mesh>

      {/* Black stone frame */}
      <mesh position={[0.65, -0.15, 1.015]} material={goldMaterial}>
        <boxGeometry args={[0.15, 0.15, 0.04]} />
      </mesh>

      {/* Top ornament (gold crescent) */}
      <mesh position={[0, 1.2, 0]} material={goldMaterial}>
        <sphereGeometry args={[0.08, 16, 16]} />
      </mesh>
      <mesh position={[0, 1.35, 0]} material={goldMaterial}>
        <cylinderGeometry args={[0.02, 0.02, 0.15, 8]} />
      </mesh>
      <mesh position={[0, 1.45, 0]} material={goldMaterial}>
        <sphereGeometry args={[0.05, 12, 12]} />
      </mesh>
    </group>
  )
}

function Particles() {
  const count = 60
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 10
      pos[i * 3 + 1] = (Math.random() - 0.5) * 8
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10
    }
    return pos
  }, [])

  const pointsRef = useRef<THREE.Points>(null)
  const ptTimeRef = useRef(0)

  useFrame((_state, delta) => {
    ptTimeRef.current += delta
    if (pointsRef.current) {
      pointsRef.current.rotation.y = ptTimeRef.current * 0.03
      pointsRef.current.rotation.x = Math.sin(ptTimeRef.current * 0.02) * 0.1
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#D4A843"
        size={0.04}
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  )
}

function GlowRing() {
  const ringRef = useRef<THREE.Mesh>(null)
  const ringTimeRef = useRef(0)

  useFrame((_state, delta) => {
    ringTimeRef.current += delta
    if (ringRef.current) {
      ringRef.current.rotation.z = ringTimeRef.current * 0.1
    }
  })

  return (
    <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]} position={[0, -0.3, 0]}>
      <torusGeometry args={[2.2, 0.015, 16, 64]} />
      <meshStandardMaterial
        color="#D4A843"
        emissive="#D4A843"
        emissiveIntensity={0.5}
        transparent
        opacity={0.4}
      />
    </mesh>
  )
}

export default function Kaaba3D() {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 1.5, 5.5], fov: 40 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} color="#ffffff" />
        <directionalLight position={[-3, 3, -3]} intensity={0.4} color="#D4A843" />
        <pointLight position={[0, 3, 0]} intensity={0.6} color="#D4A843" distance={10} />

        <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
          <KaabaBody />
        </Float>

        <GlowRing />
        <Particles />

        <Environment preset="night" />
      </Canvas>
    </div>
  )
}
