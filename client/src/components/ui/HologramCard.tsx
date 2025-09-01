import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface HologramCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  floatAnimation?: boolean;
}

export function HologramCard({ 
  children, 
  className,
  glowColor = 'rgba(139, 92, 246, 0.5)',
  floatAnimation = true
}: HologramCardProps) {
  const floatVariants = {
    animate: {
      y: [-5, 5, -5],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <motion.div
      variants={floatAnimation ? floatVariants : undefined}
      animate={floatAnimation ? "animate" : undefined}
      className={cn(
        "relative p-[2px] rounded-2xl",
        className
      )}
      style={{
        background: `linear-gradient(135deg, ${glowColor}, transparent, ${glowColor})`,
        boxShadow: `0 0 40px ${glowColor}`
      }}
    >
      {/* Main card content */}
      <div className="relative rounded-2xl bg-black/80 backdrop-blur-xl p-6 overflow-hidden">
        {/* Holographic grid pattern */}
        <div className="absolute inset-0 opacity-10">
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(0deg, rgba(139, 92, 246, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(139, 92, 246, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px'
            }}
          />
        </div>
        
        {/* Scanning line effect */}
        <motion.div
          className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50"
          animate={{
            y: [-100, 500, -100]
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>
        
        {/* Corner highlights */}
        <div className="absolute top-0 left-0 w-8 h-8">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-purple-400 to-transparent" />
          <div className="absolute top-0 left-0 h-full w-[2px] bg-gradient-to-b from-purple-400 to-transparent" />
        </div>
        <div className="absolute top-0 right-0 w-8 h-8">
          <div className="absolute top-0 right-0 w-full h-[2px] bg-gradient-to-l from-blue-400 to-transparent" />
          <div className="absolute top-0 right-0 h-full w-[2px] bg-gradient-to-b from-blue-400 to-transparent" />
        </div>
        <div className="absolute bottom-0 left-0 w-8 h-8">
          <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-purple-400 to-transparent" />
          <div className="absolute bottom-0 left-0 h-full w-[2px] bg-gradient-to-t from-purple-400 to-transparent" />
        </div>
        <div className="absolute bottom-0 right-0 w-8 h-8">
          <div className="absolute bottom-0 right-0 w-full h-[2px] bg-gradient-to-l from-blue-400 to-transparent" />
          <div className="absolute bottom-0 right-0 h-full w-[2px] bg-gradient-to-t from-blue-400 to-transparent" />
        </div>
      </div>
    </motion.div>
  );
}