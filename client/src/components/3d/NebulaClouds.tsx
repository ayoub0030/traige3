import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Clouds, Cloud } from '@react-three/drei';
import * as THREE from 'three';

export function NebulaClouds() {
  const cloudsRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y = state.clock.elapsedTime * 0.001;
      cloudsRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.0005) * 0.05;
    }
  });

  return (
    <group ref={cloudsRef}>
      <Clouds material={THREE.MeshBasicMaterial}>
        <Cloud 
          segments={40} 
          bounds={[30, 20, 30]} 
          volume={50}
          position={[20, 5, -30]}
          color="#6b46c1"
          opacity={0.3}
          fade={100}
        />
        <Cloud 
          segments={40} 
          bounds={[30, 20, 30]} 
          volume={50}
          position={[-20, -5, -35]}
          color="#2563eb"
          opacity={0.3}
          fade={100}
        />
        <Cloud 
          segments={30} 
          bounds={[20, 15, 20]} 
          volume={30}
          position={[0, 10, -40]}
          color="#a78bfa"
          opacity={0.25}
          fade={100}
        />
      </Clouds>
      
      {/* Additional nebula fog layers */}
      <mesh position={[10, 0, -50]} scale={[40, 40, 1]}>
        <planeGeometry />
        <meshBasicMaterial
          color="#581c87"
          transparent
          opacity={0.2}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      <mesh position={[-10, 5, -45]} scale={[35, 35, 1]} rotation={[0, 0.5, 0]}>
        <planeGeometry />
        <meshBasicMaterial
          color="#1e3a8a"
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}