import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../lib/stores/useLanguage';

export default function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);
  const { language } = useLanguage();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineMessage(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineMessage(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Show offline message if already offline
    if (!navigator.onLine) {
      setShowOfflineMessage(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-hide online message after 3 seconds
  useEffect(() => {
    if (isOnline && showOfflineMessage) {
      const timer = setTimeout(() => {
        setShowOfflineMessage(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isOnline, showOfflineMessage]);

  const messages = {
    en: {
      offline: 'No internet connection',
      online: 'Connection restored',
      offlineDesc: 'Some features may not work properly',
      onlineDesc: 'All features are now available'
    },
    ar: {
      offline: 'لا يوجد اتصال بالإنترنت',
      online: 'تم استعادة الاتصال',
      offlineDesc: 'قد لا تعمل بعض الميزات بشكل صحيح',
      onlineDesc: 'جميع الميزات متاحة الآن'
    }
  };

  const content = messages[language as keyof typeof messages] || messages.en;

  return (
    <AnimatePresence>
      {showOfflineMessage && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-4 left-4 right-4 z-50 pointer-events-none"
        >
          <div className={`
            mx-auto max-w-sm p-3 rounded-lg shadow-lg pointer-events-auto
            ${isOnline 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
            }
          `}>
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="h-4 w-4" />
              ) : (
                <WifiOff className="h-4 w-4" />
              )}
              <div className="flex-1">
                <p className="font-medium text-sm">
                  {isOnline ? content.online : content.offline}
                </p>
                <p className="text-xs opacity-90">
                  {isOnline ? content.onlineDesc : content.offlineDesc}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}