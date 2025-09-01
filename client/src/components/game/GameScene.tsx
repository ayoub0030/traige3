import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Box, Sphere, Plane } from '@react-three/drei';
import * as THREE from 'three';
import { useTriviaGame } from '../../lib/stores/useTriviaGame';
import { useLanguage } from '../../lib/stores/useLanguage';

// Floating geometric shapes for visual appeal
function FloatingShape({ position, color, shape }: { position: [number, number, number], color: string, shape: 'box' | 'sphere' }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime + position[0]) * 0.2;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.1;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.3;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      {shape === 'box' ? (
        <boxGeometry args={[1, 1, 1]} />
      ) : (
        <sphereGeometry args={[0.5, 16, 16]} />
      )}
      <meshStandardMaterial color={color} transparent opacity={0.7} />
    </mesh>
  );
}

// Particle system for background effect
function BackgroundParticles() {
  const pointsRef = useRef<THREE.Points>(null);
  
  const particlesCount = 100;
  const positions = React.useMemo(() => {
    const positions = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 50;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 50;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 50;
    }
    return positions;
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.02;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particlesCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial color="#4A90E2" size={0.05} sizeAttenuation transparent opacity={0.6} />
    </points>
  );
}

// Main game scene component
export default function GameScene() {
  const { gameState, score } = useTriviaGame();
  const { language, translations } = useLanguage();

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={0.8}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight position={[0, 0, 0]} intensity={0.5} color="#4A90E2" />

      {/* Background particles */}
      <BackgroundParticles />

      {/* Floating geometric shapes */}
      <FloatingShape position={[-5, 2, -3]} color="#E74C3C" shape="box" />
      <FloatingShape position={[5, 3, -2]} color="#3498DB" shape="sphere" />
      <FloatingShape position={[-3, -2, -5]} color="#F39C12" shape="box" />
      <FloatingShape position={[3, -1, -4]} color="#9B59B6" shape="sphere" />
      <FloatingShape position={[0, 4, -6]} color="#1ABC9C" shape="box" />

      {/* Ground plane */}
      <Plane args={[100, 100]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, 0]} receiveShadow>
        <meshStandardMaterial color="#2C3E50" transparent opacity={0.8} />
      </Plane>

      {/* Main display sphere */}
      <Sphere args={[1.5, 32, 32]} position={[0, 0, 0]}>
        <meshStandardMaterial 
          color="#34495E" 
          transparent 
          opacity={0.9}
          emissive="#1A252F"
          emissiveIntensity={0.2}
        />
      </Sphere>

      {/* Game title in 3D space */}
      {gameState === 'menu' && (
        <Text
          position={[0, 2, 2]}
          fontSize={1.2}
          color="#ECF0F1"
          anchorX="center"
          anchorY="middle"
          font="/fonts/inter.json"
        >
          MIRAGE
        </Text>
      )}

      {/* Score display during game */}
      {(gameState === 'playing' || gameState === 'results') && (
        <Text
          position={[0, 3, 2]}
          fontSize={0.6}
          color="#F39C12"
          anchorX="center"
          anchorY="middle"
          font="/fonts/inter.json"
        >
          {translations.score}: {score}
        </Text>
      )}
    </>
  );
}
