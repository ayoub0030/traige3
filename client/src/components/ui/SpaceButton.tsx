import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface SpaceButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  glow?: boolean;
  children: React.ReactNode;
}

export function SpaceButton({
  variant = 'primary',
  size = 'md',
  glow = true,
  className,
  children,
  disabled,
  ...props
}: SpaceButtonProps) {
  const baseStyles = `
    relative overflow-hidden
    backdrop-blur-md
    border border-white/20
    transition-all duration-300
    disabled:opacity-50 disabled:cursor-not-allowed
    before:absolute before:inset-0
    before:bg-gradient-to-r before:opacity-0
    before:transition-opacity before:duration-300
    hover:before:opacity-100
  `;

  const variants = {
    primary: `
      bg-gradient-to-r from-purple-600/20 to-blue-600/20
      hover:from-purple-600/40 hover:to-blue-600/40
      before:from-purple-400/30 before:to-blue-400/30
      text-white
      ${glow ? 'shadow-[0_0_20px_rgba(139,92,246,0.5)]' : ''}
    `,
    secondary: `
      bg-gradient-to-r from-cyan-600/20 to-teal-600/20
      hover:from-cyan-600/40 hover:to-teal-600/40
      before:from-cyan-400/30 before:to-teal-400/30
      text-cyan-100
      ${glow ? 'shadow-[0_0_20px_rgba(6,182,212,0.5)]' : ''}
    `,
    danger: `
      bg-gradient-to-r from-red-600/20 to-orange-600/20
      hover:from-red-600/40 hover:to-orange-600/40
      before:from-red-400/30 before:to-orange-400/30
      text-red-100
      ${glow ? 'shadow-[0_0_20px_rgba(239,68,68,0.5)]' : ''}
    `
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm rounded-lg',
    md: 'px-5 py-2.5 text-base rounded-xl',
    lg: 'px-7 py-3.5 text-lg rounded-2xl'
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled}
      {...props}
    >
      <span className="relative z-10 font-medium">{children}</span>
      
      {/* Animated border effect */}
      <motion.div
        className="absolute inset-0 rounded-inherit"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="absolute inset-0 rounded-inherit animate-pulse bg-gradient-to-r from-purple-400/20 via-blue-400/20 to-purple-400/20" />
      </motion.div>
      
      {/* Click ripple effect */}
      <motion.div
        className="absolute inset-0 rounded-inherit"
        initial={{ scale: 0, opacity: 0 }}
        whileTap={{ scale: 2, opacity: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          background: 'radial-gradient(circle, rgba(255,255,255,0.5) 0%, transparent 70%)'
        }}
      />
    </motion.button>
  );
}