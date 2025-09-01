import React, { useState, useEffect } from 'react';
import { useTriviaGame } from '../../lib/stores/useTriviaGame';
import { useLanguage } from '../../lib/stores/useLanguage';
import { useAuth } from '../../lib/stores/useAuth';
import { Button } from '../ui/button';
import { HologramCard } from '../ui/HologramCard';
import { SpaceButton } from '../ui/SpaceButton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Play, Users, CreditCard, Trophy, Globe, Settings, LogIn, LogOut, Coins, Crown } from 'lucide-react';
import AuthModal from '../auth/AuthModal';

export default function MainMenu() {
  const { 
    startGame, 
    setGameState, 
    setCategory, 
    setDifficulty, 
    category, 
    difficulty,
    highScore
  } = useTriviaGame();
  const { language, toggleLanguage, translations } = useLanguage();
  const { user, isAuthenticated, logout, getCurrentUser } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Check for authenticated user on component mount
  useEffect(() => {
    getCurrentUser();
  }, [getCurrentUser]);

  const categories = [
    { value: 'general', labelEn: 'General Knowledge', labelAr: 'معلومات عامة' },
    { value: 'science', labelEn: 'Science & Nature', labelAr: 'علوم وطبيعة' },
    { value: 'history', labelEn: 'History', labelAr: 'تاريخ' },
    { value: 'geography', labelEn: 'Geography', labelAr: 'جغرافيا' },
    { value: 'sports', labelEn: 'Sports', labelAr: 'رياضة' },
    { value: 'entertainment', labelEn: 'Entertainment', labelAr: 'ترفيه' },
  ];

  const difficulties = [
    { value: 'easy', labelEn: 'Easy', labelAr: 'سهل' },
    { value: 'medium', labelEn: 'Medium', labelAr: 'متوسط' },
    { value: 'hard', labelEn: 'Hard', labelAr: 'صعب' },
  ];

  const handleAuthAction = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  return (
    <>
      <div className="flex items-center justify-center min-h-screen p-4">
        <HologramCard className="w-full max-w-md">
          <div className="p-6 text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-yellow-400 bg-clip-text text-transparent mb-2">
              MIRAGE
            </h1>
            <p className="text-blue-300/80">{translations.gameSubtitle}</p>
          </div>
          
          <div className="px-6 pb-6 space-y-4">
            {/* User Information */}
            {isAuthenticated && user ? (
              <div className="p-4 rounded-lg bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/30">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium">{user.username}</div>
                      {user.premium && (
                        <Crown className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                    <Badge variant="secondary">{user.rank}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Coins className="h-4 w-4 text-yellow-500" />
                      {user.coins}
                    </div>
                    <div className="flex items-center gap-1">
                      <Trophy className="h-4 w-4 text-primary" />
                      {translations.highScore}: {highScore}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">Sign in to save your progress</p>
                <div className="flex gap-2">
                  <SpaceButton 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => handleAuthAction('login')}
                    className="flex-1"
                  >
                    <LogIn className="h-4 w-4 mr-1" />
                    Login
                  </SpaceButton>
                  <SpaceButton 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => handleAuthAction('register')}
                    className="flex-1"
                  >
                    Register
                  </SpaceButton>
                </div>
              </div>
            )}

            {/* High Score Display for non-authenticated users */}
            {!isAuthenticated && highScore > 0 && (
              <div className="text-center">
                <Badge variant="outline" className="border-primary text-primary">
                  <Trophy className="h-4 w-4 mr-1" />
                  {translations.highScore}: {highScore}
                </Badge>
              </div>
            )}

          {/* Language Toggle */}
          <SpaceButton
            variant="secondary"
            onClick={toggleLanguage}
            className="w-full"
          >
            <Globe className="h-4 w-4 mr-2" />
            {language === 'en' ? 'العربية' : 'English'}
          </SpaceButton>

          {/* Category Selection */}
          <div>
            <label className="text-sm text-gray-300 mb-2 block">
              {translations.category}
            </label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="bg-black/50 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-black border-gray-600">
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value} className="text-white focus:bg-white/10">
                    {language === 'en' ? cat.labelEn : cat.labelAr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Difficulty Selection */}
          <div>
            <label className="text-sm text-gray-300 mb-2 block">
              {translations.difficulty}
            </label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className="bg-black/50 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-black border-gray-600">
                {difficulties.map((diff) => (
                  <SelectItem key={diff.value} value={diff.value} className="text-white focus:bg-white/10">
                    {language === 'en' ? diff.labelEn : diff.labelAr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-4">
            <SpaceButton 
              onClick={startGame}
              className="w-full"
            >
              <Play className="h-4 w-4 mr-2" />
              {translations.startGame}
            </SpaceButton>

            <SpaceButton 
              onClick={() => setGameState('multiplayer')}
              variant="secondary"
              className="w-full"
            >
              <Users className="h-4 w-4 mr-2" />
              {translations.multiplayer}
            </SpaceButton>

            <SpaceButton 
              onClick={() => setGameState('payment')}
              variant="secondary"
              className="w-full"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              {translations.premium}
            </SpaceButton>
          </div>
          </div>
        </HologramCard>
    </div>

    {/* Authentication Modal */}
    <AuthModal 
      isOpen={showAuthModal}
      onClose={() => setShowAuthModal(false)}
      initialMode={authMode}
    />
  </>
  );
}
