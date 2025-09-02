import React from 'react';
import { motion } from 'framer-motion';
import { useTriviaGame } from '../../lib/stores/useTriviaGame';
import { useAuth } from '../../lib/stores/useAuth';
import { useLanguage } from '../../lib/stores/useLanguage';
import { Button } from './button';
import { 
  Home, 
  Play, 
  User, 
  Coins,
  Trophy
} from 'lucide-react';

// Bottom navigation component for mobile-first design
export default function BottomNavigation() {
  const { gameState, setGameState } = useTriviaGame();
  const { isAuthenticated } = useAuth();
  const { language } = useLanguage();

  const navItems = [
    {
      id: 'home',
      icon: Home,
      label: language === 'ar' ? 'الرئيسية' : 'Home',
      route: 'home'
    },
    {
      id: 'quiz',
      icon: Play,
      label: language === 'ar' ? 'اختبار' : 'Quiz',
      route: 'quiz-zone'
    },
    {
      id: 'leaderboard',
      icon: Trophy,
      label: language === 'ar' ? 'الترتيب' : 'Ranks',
      route: 'leaderboard'
    },
    {
      id: 'coins',
      icon: Coins,
      label: language === 'ar' ? 'المتجر' : 'Store',
      route: 'coin-store'
    },
    {
      id: 'profile',
      icon: User,
      label: language === 'ar' ? 'الملف' : 'Profile',
      route: 'profile'
    }
  ];

  // Don't show navigation during gameplay or certain screens
  const hideNavigation = ['playing', 'question', 'results', 'multiplayer'].includes(gameState);
  
  if (hideNavigation) return null;

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      exit={{ y: 100 }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border"
    >
      <div className="max-w-md mx-auto px-4 py-2">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = gameState === item.route;
            
            return (
              <motion.div
                key={item.id}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setGameState(item.route as any)}
                  className={`flex flex-col items-center gap-1 h-auto py-2 px-3 ${
                    isActive 
                      ? 'text-primary bg-primary/10' 
                      : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : ''}`} />
                  <span className="text-xs font-medium">{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full"
                    />
                  )}
                </Button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}