import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { MeshDistortMaterial, Float } from '@react-three/drei';
import * as THREE from 'three';

function Ring({ radius, speed, color, opacity }) {
  const ref = useRef();
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    ref.current.rotation.x = t * speed * 0.5;
    ref.current.rotation.y = t * speed;
  });

  return (
    <mesh ref={ref}>
      <torusGeometry args={[radius, 0.05, 16, 100]} />
      <meshStandardMaterial 
        color={color} 
        emissive={color} 
        emissiveIntensity={2} 
        transparent 
        opacity={opacity} 
      />
    </mesh>
  );
}

function Scene() {
  const rings = useMemo(() => [
    { radius: 5, speed: 0.2, color: '#ffd700', opacity: 0.6 },
    { radius: 7, speed: -0.3, color: '#00f2ff', opacity: 0.4 },
    { radius: 9, speed: 0.1, color: '#8b5cf6', opacity: 0.3 },
    { radius: 11, speed: -0.15, color: '#10b981', opacity: 0.2 },
    { radius: 3, speed: 0.4, color: '#ffd700', opacity: 0.8 },
  ], []);

  const particles = useMemo(() => {
    const pos = new Float32Array(500 * 3);
    for (let i = 0; i < 500; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 30;
    }
    return pos;
  }, []);

  return (
    <group>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={2} color="#ffd700" />
      <pointLight position={[-10, -10, -10]} intensity={1} color="#00f2ff" />
      
      {rings.map((ring, i) => (
        <Ring key={i} {...ring} />
      ))}

      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particles.length / 3}
            array={particles}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial size={0.05} color="#ffd700" transparent opacity={0.5} />
      </points>
    </group>
  );
}

export default function CTAThree() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      <Suspense fallback={null}>
        <Canvas camera={{ position: [0, 0, 15], fov: 50 }} dpr={[1, 2]}>
          <Scene />
        </Canvas>
      </Suspense>
      {/* Cinematic gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background opacity-80" />
    </div>
  );
}
