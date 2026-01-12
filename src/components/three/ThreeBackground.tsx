import { useRef, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// Interactive floating particles
function Particles({ count = 200 }: { count?: number }) {
    const mesh = useRef<THREE.Points>(null)
    const mouseRef = useRef({ x: 0, y: 0 })

    const { viewport } = useThree()

    // Generate random particle positions
    const particles = useMemo(() => {
        const positions = new Float32Array(count * 3)
        const sizes = new Float32Array(count)
        const speeds = new Float32Array(count)

        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 10
            positions[i * 3 + 1] = (Math.random() - 0.5) * 10
            positions[i * 3 + 2] = (Math.random() - 0.5) * 5 - 2
            sizes[i] = Math.random() * 0.5 + 0.1
            speeds[i] = Math.random() * 0.5 + 0.5
        }

        return { positions, sizes, speeds }
    }, [count])

    // Update mouse position
    useFrame(({ mouse, clock }) => {
        if (!mesh.current) return

        const positions = mesh.current.geometry.attributes.position.array as Float32Array
        const time = clock.getElapsedTime()

        // Smooth mouse tracking
        mouseRef.current.x += (mouse.x * viewport.width * 0.5 - mouseRef.current.x) * 0.05
        mouseRef.current.y += (mouse.y * viewport.height * 0.5 - mouseRef.current.y) * 0.05

        for (let i = 0; i < count; i++) {
            const i3 = i * 3
            const speed = particles.speeds[i]

            // Gentle floating motion
            positions[i3 + 1] += Math.sin(time * speed + i) * 0.002
            positions[i3] += Math.cos(time * speed * 0.5 + i) * 0.001

            // Mouse influence - particles drift toward mouse
            const dx = mouseRef.current.x - positions[i3]
            const dy = mouseRef.current.y - positions[i3 + 1]
            const dist = Math.sqrt(dx * dx + dy * dy)

            if (dist < 3) {
                const force = (3 - dist) / 3 * 0.01
                positions[i3] += dx * force
                positions[i3 + 1] += dy * force
            }
        }

        mesh.current.geometry.attributes.position.needsUpdate = true
        mesh.current.rotation.y = time * 0.02
    })

    return (
        <points ref={mesh}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={count}
                    array={particles.positions}
                    itemSize={3}
                    args={[particles.positions, 3]}
                />
                <bufferAttribute
                    attach="attributes-size"
                    count={count}
                    array={particles.sizes}
                    itemSize={1}
                    args={[particles.sizes, 1]}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.08}
                color="#ff3b3b"
                transparent
                opacity={0.6}
                sizeAttenuation
                blending={THREE.AdditiveBlending}
            />
        </points>
    )
}

// Central morphing blob
function MorphingBlob() {
    const mesh = useRef<THREE.Mesh>(null)
    const mouseRef = useRef({ x: 0, y: 0 })

    useFrame(({ mouse, clock }) => {
        if (!mesh.current) return

        const time = clock.getElapsedTime()

        // Smooth mouse tracking for rotation
        mouseRef.current.x += (mouse.x - mouseRef.current.x) * 0.05
        mouseRef.current.y += (mouse.y - mouseRef.current.y) * 0.05

        mesh.current.rotation.x = mouseRef.current.y * 0.3
        mesh.current.rotation.y = time * 0.1 + mouseRef.current.x * 0.3

        // Pulsing scale
        const scale = 1 + Math.sin(time * 0.5) * 0.1
        mesh.current.scale.setScalar(scale)
    })

    return (
        <mesh ref={mesh} position={[0, 0, -2]}>
            <icosahedronGeometry args={[1.2, 2]} />
            <meshBasicMaterial
                color="#1a8a5c"
                wireframe
                transparent
                opacity={0.15}
            />
        </mesh>
    )
}

// Connecting lines effect
function ConnectionLines({ count = 50 }: { count?: number }) {
    const linesRef = useRef<THREE.LineSegments>(null)

    const geometry = useMemo(() => {
        const positions = new Float32Array(count * 6)

        for (let i = 0; i < count; i++) {
            const i6 = i * 6
            const theta = (i / count) * Math.PI * 2
            const radius = 2 + Math.random() * 2

            // Start point
            positions[i6] = Math.cos(theta) * radius
            positions[i6 + 1] = (Math.random() - 0.5) * 4
            positions[i6 + 2] = Math.sin(theta) * radius - 2

            // End point
            positions[i6 + 3] = Math.cos(theta + 0.1) * (radius + 0.5)
            positions[i6 + 4] = positions[i6 + 1] + (Math.random() - 0.5) * 0.5
            positions[i6 + 5] = Math.sin(theta + 0.1) * (radius + 0.5) - 2
        }

        return new THREE.BufferGeometry().setAttribute(
            'position',
            new THREE.BufferAttribute(positions, 3)
        )
    }, [count])

    useFrame(({ clock }) => {
        if (!linesRef.current) return
        linesRef.current.rotation.y = clock.getElapsedTime() * 0.05
        linesRef.current.rotation.z = Math.sin(clock.getElapsedTime() * 0.2) * 0.1
    })

    return (
        <lineSegments ref={linesRef} geometry={geometry}>
            <lineBasicMaterial color="#ff3b3b" transparent opacity={0.08} />
        </lineSegments>
    )
}

// Main scene component
function Scene() {
    return (
        <>
            <ambientLight intensity={0.5} />
            <Particles count={150} />
            <MorphingBlob />
            <ConnectionLines count={60} />
        </>
    )
}

// Export the Three.js canvas
export function ThreeBackground() {
    return (
        <Canvas
            camera={{ position: [0, 0, 5], fov: 50 }}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'auto',
            }}
            dpr={[1, 2]}
        >
            <Scene />
        </Canvas>
    )
}
