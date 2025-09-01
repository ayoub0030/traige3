import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Text, Float } from '@react-three/drei';
import * as THREE from 'three';

interface PlanetProps {
  position: [number, number, number];
  category: string;
  label: string;
  color: string;
  emissiveColor: string;
  onClick: () => void;
  icon?: string;
}

function Planet({ position, category, label, color, emissiveColor, onClick, icon }: PlanetProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      // Base rotation
      meshRef.current.rotation.y += hovered ? 0.01 : 0.002;
      
      // Pulsing effect when hovered
      if (hovered) {
        const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.05;
        meshRef.current.scale.setScalar(scale);
      } else if (!clicked) {
        meshRef.current.scale.setScalar(1);
      }
    }
  });

  const handleClick = () => {
    setClicked(true);
    setTimeout(() => {
      onClick();
      setClicked(false);
    }, 600);
  };

  return (
    <Float
      speed={2}
      rotationIntensity={0.5}
      floatIntensity={0.5}
    >
      <group position={position}>
        <Sphere
          ref={meshRef}
          args={[2, 32, 32]}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
          onClick={handleClick}
        >
          <meshStandardMaterial
            color={color}
            emissive={emissiveColor}
            emissiveIntensity={hovered ? 0.8 : 0.3}
            roughness={0.3}
            metalness={0.7}
          />
        </Sphere>
        
        {/* Glow effect */}
        {hovered && (
          <Sphere args={[2.2, 16, 16]}>
            <meshBasicMaterial
              color={emissiveColor}
              transparent
              opacity={0.2}
              side={THREE.BackSide}
            />
          </Sphere>
        )}
        
        {/* Planet label */}
        <Text
          position={[0, -3, 0]}
          fontSize={0.5}
          color={hovered ? '#fbbf24' : '#ffffff'}
          anchorX="center"
          anchorY="middle"
        >
          {label}
        </Text>
        
        {/* Category icon */}
        {icon && (
          <Text
            position={[0, 0, 2.1]}
            fontSize={1}
            anchorX="center"
            anchorY="middle"
          >
            {icon}
          </Text>
        )}
        
        {/* Orbital ring when hovered */}
        {hovered && (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[3, 0.05, 8, 64]} />
            <meshBasicMaterial color={emissiveColor} />
          </mesh>
        )}
      </group>
    </Float>
  );
}

interface InteractivePlanetsProps {
  onCategorySelect: (category: string) => void;
}

export function InteractivePlanets({ onCategorySelect }: InteractivePlanetsProps) {
  const planets = [
    {
      category: 'general-knowledge',
      label: 'Knowledge',
      position: [-8, 4, -5] as [number, number, number],
      color: '#6b46c1',
      emissiveColor: '#a78bfa',
      icon: '🧠'
    },
    {
      category: 'sports',
      label: 'Sports',
      position: [8, 2, -5] as [number, number, number],
      color: '#059669',
      emissiveColor: '#10b981',
      icon: '⚽'
    },
    {
      category: 'science',
      label: 'Science',
      position: [-6, -3, -8] as [number, number, number],
      color: '#2563eb',
      emissiveColor: '#60a5fa',
      icon: '🔬'
    },
    {
      category: 'history',
      label: 'History',
      position: [6, -2, -6] as [number, number, number],
      color: '#92400e',
      emissiveColor: '#d97706',
      icon: '🏛️'
    },
    {
      category: 'music',
      label: 'Music',
      position: [0, 5, -10] as [number, number, number],
      color: '#db2777',
      emissiveColor: '#f472b6',
      icon: '🎵'
    },
    {
      category: 'movies',
      label: 'Movies',
      position: [-10, 0, -7] as [number, number, number],
      color: '#7c3aed',
      emissiveColor: '#c084fc',
      icon: '🎬'
    },
    {
      category: 'news',
      label: 'News',
      position: [10, -4, -9] as [number, number, number],
      color: '#dc2626',
      emissiveColor: '#f87171',
      icon: '📰'
    },
    {
      category: 'nature',
      label: 'Nature',
      position: [0, -5, -12] as [number, number, number],
      color: '#059669',
      emissiveColor: '#34d399',
      icon: '🌿'
    }
  ];

  return (
    <>
      {planets.map((planet) => (
        <Planet
          key={planet.category}
          {...planet}
          onClick={() => onCategorySelect(planet.category)}
        />
      ))}
    </>
  );
}