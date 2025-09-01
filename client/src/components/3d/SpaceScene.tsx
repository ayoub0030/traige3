import React, { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stars, Preload } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing';
import { SpaceBackground } from './SpaceBackground';
import { InteractivePlanets } from './InteractivePlanets';
import { ParticleField } from './ParticleField';
import { NebulaClouds } from './NebulaClouds';
import { useQualitySettings } from '../../hooks/useQualitySettings';

interface SpaceSceneProps {
  onCategorySelect?: (category: string) => void;
  enableInteraction?: boolean;
}

export function SpaceScene({ onCategorySelect, enableInteraction = true }: SpaceSceneProps) {
  const { quality, postProcessing } = useQualitySettings();

  return (
    <div className="fixed inset-0 -z-10">
      <Canvas
        dpr={[1, 2]}
        gl={{ 
          antialias: quality !== 'low',
          alpha: true,
          powerPreference: 'high-performance'
        }}
      >
        <Suspense fallback={null}>
          <PerspectiveCamera
            makeDefault
            position={[0, 0, 20]}
            fov={75}
            near={0.1}
            far={1000}
          />
          
          {/* Lighting */}
          <ambientLight intensity={0.2} />
          <pointLight position={[10, 10, 10]} intensity={0.5} color="#fbbf24" />
          <pointLight position={[-10, -10, -10]} intensity={0.3} color="#60a5fa" />
          <directionalLight position={[0, 5, 5]} intensity={0.4} color="#a78bfa" />
          
          {/* Space environment */}
          <SpaceBackground quality={quality} />
          <Stars
            radius={300}
            depth={100}
            count={quality === 'ultra' ? 10000 : quality === 'high' ? 7000 : 5000}
            factor={4}
            saturation={0.5}
            fade
            speed={0.5}
          />
          
          {/* Nebula clouds */}
          {quality !== 'low' && <NebulaClouds />}
          
          {/* Particle effects */}
          {quality !== 'low' && <ParticleField quality={quality} />}
          
          {/* Interactive planets */}
          {enableInteraction && onCategorySelect && (
            <InteractivePlanets onCategorySelect={onCategorySelect} />
          )}
          
          {/* Camera controls */}
          <OrbitControls
            enablePan={false}
            enableZoom={enableInteraction}
            maxDistance={50}
            minDistance={10}
            autoRotate
            autoRotateSpeed={0.2}
            rotateSpeed={0.5}
          />
          
          {/* Post-processing effects */}
          {postProcessing && quality !== 'low' && (
            <EffectComposer>
              <Bloom
                intensity={0.5}
                luminanceThreshold={0.3}
                luminanceSmoothing={0.9}
                radius={0.8}
              />
              {quality === 'ultra' && (
                <ChromaticAberration
                  offset={[0.001, 0.001]}
                  radialModulation={false}
                  modulationOffset={0}
                />
              )}
            </EffectComposer>
          )}
          
          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  );
}