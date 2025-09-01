import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogOverlay } from '../ui/dialog';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  
  // Update mode when initialMode changes
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const handleSwitchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogOverlay className="bg-black/80 backdrop-blur-sm" />
      <DialogContent className="max-w-md p-0 bg-transparent border-none shadow-none">
        {mode === 'login' ? (
          <LoginForm onSwitchToRegister={handleSwitchMode} onClose={onClose} />
        ) : (
          <RegisterForm onSwitchToLogin={handleSwitchMode} onClose={onClose} />
        )}
      </DialogContent>
    </Dialog>
  );
}