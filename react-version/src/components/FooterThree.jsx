import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

function FooterParticles() {
  const ref = useRef();
  
  // Generate particles with varying sizes and positions
  const { positions, sizes } = useMemo(() => {
    const pos = new Float32Array(2500 * 3);
    const sz = new Float32Array(2500);
    for (let i = 0; i < 2500; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 3;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 5;
      sz[i] = Math.random();
    }
    return { positions: pos, sizes: sz };
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    ref.current.rotation.y = t * 0.1;
    ref.current.rotation.x = Math.sin(t * 0.2) * 0.05;
    ref.current.position.y = Math.sin(t * 0.3) * 0.15;
  });

  return (
    <group>
      <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#00f2ff"
          size={0.06}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          opacity={0.6}
        />
      </Points>
      
      {/* Secondary golden glow particles */}
      <Points positions={useMemo(() => {
        const p = new Float32Array(400 * 3);
        for (let i = 0; i < 400; i++) {
          p[i * 3] = (Math.random() - 0.5) * 8;
          p[i * 3 + 1] = (Math.random() - 0.5) * 2;
          p[i * 3 + 2] = (Math.random() - 0.5) * 4;
        }
        return p;
      }, [])} stride={3}>
        <PointMaterial
          transparent
          color="#ffcc00"
          size={0.04}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          opacity={0.3}
        />
      </Points>
    </group>
  );
}

export default function FooterThree() {
  return (
    <div className="absolute inset-0 z-0">
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
      <Canvas 
        camera={{ position: [0, 0, 4], fov: 50 }}
        style={{ height: '100%', width: '100%', pointerEvents: 'none' }}
      >
        <FooterParticles />
      </Canvas>
    </div>
  );
}
