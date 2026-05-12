import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

function DataCubes() {
  const group = useRef();
  
  const nodes = useMemo(() => {
    return Array.from({ length: 40 }, () => ({
      position: [
        (Math.random() - 0.5) * 35,
        (Math.random() - 0.5) * 25,
        (Math.random() - 0.5) * 15
      ],
      speed: Math.random() * 0.3 + 0.1,
      size: Math.random() * 0.8 + 0.2,
      rotation: [Math.random() * Math.PI, Math.random() * Math.PI, 0],
      color: ['#00f2ff', '#0077ff', '#00ccff'][Math.floor(Math.random() * 3)]
    }));
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (group.current) {
      group.current.children.forEach((child, i) => {
        child.position.y += Math.sin(t * nodes[i].speed) * 0.005;
        child.rotation.x += 0.005;
        child.rotation.y += 0.005;
      });
    }
  });

  return (
    <group ref={group}>
      {nodes.map((node, i) => (
        <Float key={i} speed={node.speed * 2} rotationIntensity={0.5} floatIntensity={1}>
          <mesh position={node.position} rotation={node.rotation}>
            <boxGeometry args={[node.size, node.size, node.size]} />
            <meshStandardMaterial 
              color={node.color} 
              emissive={node.color} 
              emissiveIntensity={1.5} 
              transparent 
              opacity={0.4} 
            />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

function TechGrid() {
  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, -8, 0]}>
      <gridHelper args={[100, 40, "#002233", "#002233"]} />
    </group>
  );
}

export default function FeaturesThree() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden min-h-[500px]">
      <Suspense fallback={null}>
        <Canvas 
          camera={{ position: [0, 0, 20], fov: 45 }} 
          dpr={[1, 2]}
          style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
        >
          <ambientLight intensity={0.8} />
          <pointLight position={[10, 10, 10]} intensity={2} color="#00f2ff" />
          <pointLight position={[-10, -10, -10]} intensity={1.5} color="#0077ff" />
          <DataCubes />
          <TechGrid />
        </Canvas>
      </Suspense>
    </div>
  );
}
