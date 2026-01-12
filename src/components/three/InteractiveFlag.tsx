import { useEffect, useMemo } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import * as THREE from 'three'
import flagImg from '../../assets/flag.png'

// Import from local flagwaver library
import Flag from '../../../flagwaver/src/assets/js/flagwaver/subjects/Flag'
import Wind from '../../../flagwaver/src/assets/js/flagwaver/subjects/Wind'
import applyWindForceToCloth from '../../../flagwaver/src/assets/js/flagwaver/interactions/applyWindForceToCloth'
import applyGravityToCloth from '../../../flagwaver/src/assets/js/flagwaver/interactions/applyGravityToCloth'

function FlagScene() {
    // Load Texture
    const flagTexture = useLoader(THREE.TextureLoader, flagImg)
    flagTexture.anisotropy = 16
    flagTexture.wrapS = THREE.RepeatWrapping
    flagTexture.flipY = true // Fix upside down text

    // Initialize Flag and Wind
    const { flag, wind } = useMemo(() => {
        const wind = new Wind({
            speed: 10, // Smoother initial speed
            direction: new THREE.Vector3(1, 0, 0)
        })

        const flag = new Flag({
            mass: 0.1, // Adjust mass for feel
            restDistance: 0.1, // Grid density
            texture: flagTexture,
            width: 3.5, // Even Larger flag
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
    }, [flagTexture])

    // Update Loop
    useFrame((_, delta) => {
        // Limit delta to avoid instability on lag spikes
        const d = Math.min(delta, 0.05)

        // 1. Update Wind
        wind.update()

        // 2. Apply Forces
        applyGravityToCloth(flag.cloth, flag.object)
        applyWindForceToCloth(flag.cloth, wind, flag.object)

        // 3. Simulate
        flag.simulate(d)

        // 4. Render Updates (Geometry etc)
        flag.render()
    })

    // Cleanup
    useEffect(() => {
        return () => {
            flag.destroy()
        }
    }, [flag])

    // Adjust position: Keep at -5.5 (Left) and -3.5 (Vertical)
    return (
        <group position={[-5.5, -3.5, 0]}>
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
            {/* Flag object's mesh is typically positioned at (0, -height, 0) inside object. 
                We place the object at the top of the pole mount point (y=5.8). */}
            <primitive object={flag.object} position={[0, 5.8, 0]} />
        </group>
    )
}

export function InteractiveFlag() {
    return (
        <div style={{ width: '100%', height: '100%' }}>
            <Canvas camera={{ position: [0, 0, 8], fov: 45 }} dpr={[1, 2]}>
                <ambientLight intensity={0.6} />
                <directionalLight position={[10, 10, 10]} intensity={2.0} />
                <pointLight position={[-5, 5, 2]} intensity={1.5} color="#ff3b3b" />
                <FlagScene />
            </Canvas>
        </div>
    )
}
