import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface ParticleFieldProps {
  count?: number;
  quality?: 'low' | 'medium' | 'high' | 'ultra';
}

export function ParticleField({ quality = 'high' }: ParticleFieldProps) {
  const particlesRef = useRef<THREE.Points>(null);
  const { mouse } = useThree();
  
  const particleCount = useMemo(() => {
    switch (quality) {
      case 'ultra': return 1000;
      case 'high': return 500;
      case 'medium': return 250;
      case 'low': return 100;
      default: return 500;
    }
  }, [quality]);

  const [positions, velocities] = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Random position in space
      positions[i3] = (Math.random() - 0.5) * 100;
      positions[i3 + 1] = (Math.random() - 0.5) * 100;
      positions[i3 + 2] = (Math.random() - 0.5) * 50 - 10;
      
      // Random velocity
      velocities[i3] = (Math.random() - 0.5) * 0.02;
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.02;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.02;
    }
    
    return [positions, velocities];
  }, [particleCount]);

  useFrame((state) => {
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      const time = state.clock.elapsedTime;
      
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        
        // Update position based on velocity
        positions[i3] += velocities[i3];
        positions[i3 + 1] += velocities[i3 + 1];
        positions[i3 + 2] += velocities[i3 + 2];
        
        // Add mouse influence
        const mouseInfluence = 0.1;
        positions[i3] += mouse.x * mouseInfluence * 0.01;
        positions[i3 + 1] += mouse.y * mouseInfluence * 0.01;
        
        // Wrap around boundaries
        if (Math.abs(positions[i3]) > 50) positions[i3] *= -0.95;
        if (Math.abs(positions[i3 + 1]) > 50) positions[i3 + 1] *= -0.95;
        if (Math.abs(positions[i3 + 2]) > 30) positions[i3 + 2] *= -0.95;
        
        // Add wave motion
        positions[i3 + 1] += Math.sin(time * 0.5 + i * 0.1) * 0.01;
      }
      
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={particlesRef} key={particleCount}>
      <bufferGeometry key={particleCount}>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#60a5fa"
        size={0.1}
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}