import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Stars } from '@react-three/drei';
import * as THREE from 'three';

function Scene() {
  const cubesRef = useRef();
  
  const cubeData = useMemo(() => {
    return Array.from({ length: 30 }, () => ({
      position: [
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 15
      ],
      speed: Math.random() * 0.4 + 0.1,
      rotation: [Math.random() * Math.PI, Math.random() * Math.PI, 0],
      color: ['#00f2ff', '#0077ff', '#00ccff'][Math.floor(Math.random() * 3)],
      size: Math.random() * 1.2 + 0.4
    }));
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (cubesRef.current) {
      cubesRef.current.children.forEach((child, i) => {
        child.position.y += Math.sin(t * cubeData[i].speed) * 0.008;
        child.rotation.x += 0.005;
        child.rotation.y += 0.005;
      });
    }
  });

  return (
    <group>
      <ambientLight intensity={1} />
      <pointLight position={[15, 15, 15]} intensity={2.5} color="#00f2ff" />
      <pointLight position={[-15, -15, -15]} intensity={1.5} color="#0077ff" />
      
      <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />

      <group ref={cubesRef}>
        {cubeData.map((data, i) => (
          <Float key={i} speed={data.speed} rotationIntensity={0.5} floatIntensity={1}>
            <mesh position={data.position} rotation={data.rotation}>
              <boxGeometry args={[data.size, data.size, data.size]} />
              <meshStandardMaterial 
                color={data.color} 
                emissive={data.color}
                emissiveIntensity={1.5}
                transparent 
                opacity={0.3}
              />
            </mesh>
          </Float>
        ))}
      </group>
      
      <group rotation={[-Math.PI / 2, 0, 0]} position={[0, -10, 0]}>
        <gridHelper args={[100, 30, "#002233", "#002233"]} />
      </group>
    </group>
  );
}

export default function HowToPlayThree() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden min-h-[600px]">
      <Suspense fallback={null}>
        <Canvas 
          camera={{ position: [0, 0, 25], fov: 45 }} 
          dpr={[1, 2]}
          style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
        >
          <Scene />
        </Canvas>
      </Suspense>
    </div>
  );
}
