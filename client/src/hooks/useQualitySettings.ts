import { useState, useEffect } from 'react';

type QualityLevel = 'low' | 'medium' | 'high' | 'ultra';

interface QualitySettings {
  quality: QualityLevel;
  postProcessing: boolean;
  shadows: boolean;
  particleCount: number;
  starCount: number;
  setQuality: (level: QualityLevel) => void;
  autoDetect: () => void;
}

export function useQualitySettings(): QualitySettings {
  const [quality, setQuality] = useState<QualityLevel>('high');
  const [fps, setFps] = useState<number[]>([]);

  // Auto-detect quality based on device and performance
  useEffect(() => {
    const detectQuality = () => {
      // Check if mobile
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobile) {
        setQuality('medium');
        return;
      }

      // Check device memory if available
      const deviceMemory = (navigator as any).deviceMemory;
      if (deviceMemory) {
        if (deviceMemory <= 4) {
          setQuality('medium');
        } else if (deviceMemory >= 8) {
          setQuality('ultra');
        } else {
          setQuality('high');
        }
        return;
      }

      // Default to high for desktop
      setQuality('high');
    };

    detectQuality();
  }, []);

  // Monitor FPS and adjust quality if needed
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        const currentFps = Math.round(frameCount * 1000 / (currentTime - lastTime));
        setFps(prev => [...prev.slice(-4), currentFps]);
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      animationId = requestAnimationFrame(measureFPS);
    };

    measureFPS();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  // Auto-adjust quality based on FPS
  useEffect(() => {
    if (fps.length >= 5) {
      const avgFps = fps.reduce((a, b) => a + b, 0) / fps.length;
      
      if (avgFps < 30 && quality !== 'low') {
        // Downgrade quality
        if (quality === 'ultra') setQuality('high');
        else if (quality === 'high') setQuality('medium');
        else if (quality === 'medium') setQuality('low');
      }
    }
  }, [fps, quality]);

  const qualitySettings = {
    low: {
      postProcessing: false,
      shadows: false,
      particleCount: 100,
      starCount: 500
    },
    medium: {
      postProcessing: false,
      shadows: false,
      particleCount: 250,
      starCount: 1500
    },
    high: {
      postProcessing: true,
      shadows: false,
      particleCount: 500,
      starCount: 3000
    },
    ultra: {
      postProcessing: true,
      shadows: true,
      particleCount: 1000,
      starCount: 5000
    }
  };

  const settings = qualitySettings[quality];

  return {
    quality,
    ...settings,
    setQuality,
    autoDetect: () => {
      // Re-run detection
      setFps([]);
    }
  };
}