import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

function ParticleField() {
  const ref = useRef();
  const { mouse } = useThree();
  
  const positions = useMemo(() => {
    const pos = new Float32Array(3000 * 3);
    for (let i = 0; i < 3000; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 15;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 15;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 15;
    }
    return pos;
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    ref.current.rotation.y = t * 0.02;
    ref.current.position.x = THREE.MathUtils.lerp(ref.current.position.x, mouse.x * 0.5, 0.05);
    ref.current.position.y = THREE.MathUtils.lerp(ref.current.position.y, mouse.y * 0.5, 0.05);
    ref.current.rotation.z = Math.sin(t * 0.2) * 0.05;
  });

  return (
    <group>
      <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#00f2ff"
          size={0.03}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          opacity={0.8}
        />
      </Points>
      
      <Points positions={useMemo(() => {
        const pos = new Float32Array(500 * 3);
        for (let i = 0; i < 500; i++) {
          pos[i * 3] = (Math.random() - 0.5) * 10;
          pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
          pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
        }
        return pos;
      }, [])} stride={3}>
        <PointMaterial
          transparent
          color="#ffcc00"
          size={0.05}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          opacity={0.6}
        />
      </Points>
    </group>
  );
}

export default function ThreeBackground() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
      {/* Deep atmospheric base layer */}
      <div 
        className="absolute inset-0" 
        style={{ 
          background: 'radial-gradient(circle at 50% 0%, oklch(0.25 0.1 280) 0%, oklch(0.14 0.05 270) 100%)' 
        }} 
      />
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
        <ParticleField />
      </Canvas>
    </div>
  );
}
