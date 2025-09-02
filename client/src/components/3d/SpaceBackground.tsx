import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SpaceBackgroundProps {
  quality?: 'low' | 'medium' | 'high' | 'ultra';
}

export function SpaceBackground({ quality = 'high' }: SpaceBackgroundProps) {
  const starsRef = useRef<THREE.Points>(null);
  
  // Determine star count based on quality
  const starCount = useMemo(() => {
    switch (quality) {
      case 'ultra': return 5000;
      case 'high': return 3000;
      case 'medium': return 1500;
      case 'low': return 500;
      default: return 3000;
    }
  }, [quality]);

  // Generate star positions and colors
  const [positions, colors] = useMemo(() => {
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    
    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      
      // Random position in sphere
      const radius = 100 + Math.random() * 500;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);
      
      // Star colors (white to yellow gradient)
      const intensity = 0.5 + Math.random() * 0.5;
      colors[i3] = intensity; // R
      colors[i3 + 1] = intensity * (0.8 + Math.random() * 0.2); // G
      colors[i3 + 2] = intensity * (0.6 + Math.random() * 0.4); // B
    }
    
    return [positions, colors];
  }, [starCount]);

  // Store original colors for twinkling effect
  const originalColors = useMemo(() => new Float32Array(colors), [colors]);
  
  // Animate star twinkling and rotation
  useFrame((state) => {
    if (starsRef.current) {
      starsRef.current.rotation.y += 0.0001;
      starsRef.current.rotation.x += 0.00005;
      
      // Twinkling effect
      const time = state.clock.elapsedTime;
      const colorAttribute = starsRef.current.geometry.attributes.color;
      const currentColors = colorAttribute.array as Float32Array;
      
      for (let i = 0; i < starCount; i++) {
        const i3 = i * 3;
        const twinkle = Math.sin(time * (1 + i * 0.1)) * 0.1 + 0.9;
        currentColors[i3] = originalColors[i3] * twinkle;
        currentColors[i3 + 1] = originalColors[i3 + 1] * twinkle;
        currentColors[i3 + 2] = originalColors[i3 + 2] * twinkle;
      }
      
      colorAttribute.needsUpdate = true;
    }
  });

  return (
    <points ref={starsRef} key={starCount}>
      <bufferGeometry key={starCount}>
        <bufferAttribute
          attach="attributes-position"
          count={starCount}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={starCount}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={quality === 'ultra' ? 2 : quality === 'high' ? 1.5 : 1}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}