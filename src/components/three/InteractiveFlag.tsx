import { useEffect, useMemo, useRef, Suspense } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import * as THREE from 'three'
import flagImg from '../../assets/flag.png'

// Import from local flagwaver library
import Flag from '../../../flagwaver/src/assets/js/flagwaver/subjects/Flag'
import Wind from '../../../flagwaver/src/assets/js/flagwaver/subjects/Wind'
import applyWindForceToCloth from '../../../flagwaver/src/assets/js/flagwaver/interactions/applyWindForceToCloth'
import applyGravityToCloth from '../../../flagwaver/src/assets/js/flagwaver/interactions/applyGravityToCloth'


function FlagScene({ isMobile }: { isMobile: boolean }) {
    // Load Texture
    const flagTexture = useLoader(THREE.TextureLoader, flagImg)
    flagTexture.anisotropy = 16
    flagTexture.wrapS = THREE.RepeatWrapping
    flagTexture.flipY = true // Fix upside down text

    // Initialize Flag and Wind
    const { flag, wind } = useMemo(() => {
        const wind = new Wind({
            speed: isMobile ? 18: 15, // Smoother initial speed
            direction: new THREE.Vector3(1, 0, 0)
        })

        const flag = new Flag({
            mass: isMobile ? 0.32 : 0.2,
            restDistance: 0.2,
            texture: flagTexture,
            width: isMobile ? 3.5 : 3.5,
            height: 2.3,
            pin: { edges: ['left'] } // Pin left edge
        })

        // Adjust Material props after creation if desired
        if (flag.mesh.material) {
            flag.mesh.material.metalness = 0.1
            flag.mesh.material.roughness = 0.6
            flag.mesh.material.side = THREE.DoubleSide
        }

        return { flag, wind }
    }, [flagTexture, isMobile])

    // Physics state
    const physicsState = useRef({
        accumulator: 0,
        lastTime: 0
    })

    const FIXED_TIME_STEP = 1 / 60
    const MAX_ACCUMULATOR = 0.25 // Prevent spiral of death

    // Update Loop
    useFrame(({ clock }) => {
        const currentTime = clock.getElapsedTime()
        // Calculate delta ourselves since r3f delta can be affected by other factors
        // or just use r3f delta, but manual calculation is sometimes safer with accumulators
        let frameTime = currentTime - physicsState.current.lastTime
        physicsState.current.lastTime = currentTime

        // Clamp frame time to avoid huge jumps if tab was backgrounded
        if (frameTime > MAX_ACCUMULATOR) frameTime = MAX_ACCUMULATOR

        physicsState.current.accumulator += frameTime

        // Consume accumulator in fixed steps
        while (physicsState.current.accumulator >= FIXED_TIME_STEP) {
            // 1. Update Wind
            wind.update()

            // 2. Apply Forces
            applyGravityToCloth(flag.cloth, flag.object)
            applyWindForceToCloth(flag.cloth, wind, flag.object)

            // 3. Simulate with fixed step
            flag.simulate(FIXED_TIME_STEP)

            physicsState.current.accumulator -= FIXED_TIME_STEP
        }

        // 4. Render Updates (interpolating would be even better but simple render is fine for cloth)
        flag.render()
    })

    // Cleanup
    useEffect(() => {
        return () => {
            flag.destroy()
        }
    }, [flag])

    // Adjust position: 
    // Desktop: Move flag left (-4.5) and slightly down (-3.8)
    // Mobile: Adjusted left (-1.2) and slightly up from bottom (-4.2)
    const position: [number, number, number] = isMobile ? [-1.2, -4.2, 0] : [-5.0, -3.8, 0]
    const scale = isMobile ? 0.6 : 1

    return (
        <group position={position} scale={scale}>
            {/* The Pole */}
            <mesh position={[0, -4, 0]}>
                <cylinderGeometry args={[0.08, 0.08, 20, 16]} />
                <meshStandardMaterial color="#e5e5e5" metalness={1.0} roughness={0.2} />
            </mesh>

            {/* Pole Cap */}
            <mesh position={[0, 6, 0]}>
                <cylinderGeometry args={[0.15, 0.15, 0.4, 16]} />
                <meshStandardMaterial color="#e5e5e5" metalness={1.0} roughness={0.2} />
            </mesh>

            {/* The Cloth (Flag Object from library) */}
            <primitive object={flag.object} position={[0, 5.8, 0]} />
        </group>
    )
}

export function InteractiveFlag({ isMobile }: { isMobile: boolean }) {
    return (
        <div style={{ width: '100%', height: '100%' }}>
            <Canvas
                camera={{ position: [0, 0, 8], fov: 45 }}
                dpr={[1, 2]} // Allow higher DPR but handle it safely
                gl={{
                    antialias: true,
                    stencil: false,
                    depth: true,
                    powerPreference: 'high-performance', // Request high perf
                    preserveDrawingBuffer: false,
                    failIfMajorPerformanceCaveat: false
                }}
                onCreated={({ gl }) => {
                    // Monitor for context loss
                    gl.domElement.addEventListener('webglcontextlost', (event) => {
                        event.preventDefault();
                        console.warn('WebGL Context Lost - Attempting to recover...');
                    }, false);
                }}
            >
                <ambientLight intensity={0.6} />
                <directionalLight position={[10, 10, 10]} intensity={2.0} />
                <pointLight position={[-5, 5, 2]} intensity={1.5} color="#ff3b3b" />
                <Suspense fallback={null}>
                    <FlagScene isMobile={isMobile} />
                </Suspense>
            </Canvas>
        </div>
    )
}
