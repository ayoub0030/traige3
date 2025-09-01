import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WarpSpeedProps {
  active: boolean;
  duration?: number;
  onComplete?: () => void;
}

export function WarpSpeed({ active, duration = 1, onComplete }: WarpSpeedProps) {
  const [lines, setLines] = useState<Array<{ id: number; x: number; y: number }>>([]);

  useEffect(() => {
    if (active) {
      const newLines = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight
      }));
      setLines(newLines);
    }
  }, [active]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="fixed inset-0 z-50 pointer-events-none overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onAnimationComplete={onComplete}
        >
          {/* Background fade */}
          <motion.div
            className="absolute inset-0 bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            exit={{ opacity: 0 }}
            transition={{ duration: duration * 0.5 }}
          />
          
          {/* Warp lines */}
          {lines.map((line) => (
            <motion.div
              key={line.id}
              className="absolute w-[2px] bg-gradient-to-b from-transparent via-white to-transparent"
              style={{
                left: line.x,
                top: line.y,
                transformOrigin: 'center'
              }}
              initial={{ 
                height: 2,
                opacity: 0,
                scale: 0
              }}
              animate={{ 
                height: Math.random() * 200 + 100,
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
                x: (window.innerWidth / 2 - line.x) * 2,
                y: (window.innerHeight / 2 - line.y) * 2
              }}
              transition={{
                duration: duration,
                ease: "easeInOut",
                delay: Math.random() * 0.2
              }}
            />
          ))}
          
          {/* Center burst */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: [0, 20, 25],
              opacity: [0, 0.5, 0]
            }}
            transition={{
              duration: duration,
              ease: "easeOut"
            }}
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-400 to-blue-400 blur-xl" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}