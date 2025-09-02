import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../lib/stores/useAuth';
import { useLanguage } from '../../lib/stores/useLanguage';
import { useTriviaGame } from '../../lib/stores/useTriviaGame';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { SpaceScene } from '../3d/SpaceScene';
import { SpaceButton } from '../ui/SpaceButton';
import { HologramCard } from '../ui/HologramCard';
import { WarpSpeed } from '../effects/WarpSpeed';
import { 
  Trophy, 
  Coins, 
  Crown, 
  Zap, 
  Users, 
  Swords, 
  Gift,
  TrendingUp,
  Star
} from 'lucide-react';
import { 
  FaGift, 
  FaTrophy, 
  FaCoins, 
  FaBolt,
  FaUserFriends
} from 'react-icons/fa';

// Home page component with rank, coins, score, ad rewards, contests, and battles
export default function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const { translations, language } = useLanguage();
  const { highScore, setGameState } = useTriviaGame();
  const [warpActive, setWarpActive] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setWarpActive(true);
    setTimeout(() => {
      setGameState('quiz-zone');
    }, 1000);
  };

  // Animation variants for stagger effect
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.1,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        damping: 20,
        stiffness: 300
      }
    }
  };

  // User stats for display
  const userStats = {
    rank: user?.rank || 'Bronze',
    coins: user?.coins || 0,
    score: highScore,
    level: user ? Math.floor(user.coins / 100) + 1 : 1,
    premium: user?.premium || false
  };

  return (
    <>
      {/* 3D Space Background */}
      <SpaceScene 
        onCategorySelect={handleCategorySelect}
        enableInteraction={!warpActive}
      />
      
      {/* Warp Speed Transition */}
      <WarpSpeed 
        active={warpActive} 
        duration={1}
        onComplete={() => setWarpActive(false)}
      />
      
      <div className="min-h-screen p-4 overflow-y-auto relative z-10" style={{ height: '100vh' }}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-md mx-auto space-y-4 pb-32"
        >
          {/* Header with user info */}
          <motion.div variants={itemVariants}>
            <HologramCard 
              glowColor="rgba(59, 130, 246, 0.5)"
              floatAnimation={true}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <Trophy className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-primary">
                      {isAuthenticated ? user?.username : 'Guest Player'}
                    </h2>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {userStats.rank}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Level {userStats.level}
                      </Badge>
                      {userStats.premium && (
                        <Crown className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-1">
                    <Coins className="h-4 w-4 text-yellow-500" />
                    <span className="text-lg font-bold text-yellow-500">
                      {userStats.coins.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Coins</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-1">
                    <Trophy className="h-4 w-4 text-primary" />
                    <span className="text-lg font-bold text-primary">
                      {userStats.score.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Best Score</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-1">
                    <Star className="h-4 w-4 text-accent" />
                    <span className="text-lg font-bold text-accent">
                      {userStats.level}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Level</p>
                </div>
              </div>
            </HologramCard>
          </motion.div>

        {/* Quick actions */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
          {/* Ad Rewards Button */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              className="w-full h-20 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0 flex flex-col gap-1"
              onClick={async () => {
                try {
                  // Call ad reward API
                  const response = await fetch('/api/rewards/ad', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      userId: user?.id || 1 // Use actual user ID
                    })
                  });
                  
                  const data = await response.json();
                  
                  if (data.success) {
                    console.log(`Earned ${data.reward} coins! New balance: ${data.newBalance}`);
                    // You could add a toast notification here
                  }
                } catch (error) {
                  console.error('Error claiming ad reward:', error);
                }
              }}
            >
              <FaGift className="h-5 w-5" />
              <span className="text-xs font-medium">
                {language === 'ar' ? 'عملات مجانية' : 'Free Coins'}
              </span>
              <span className="text-xs opacity-80">
                {language === 'ar' ? 'شاهد إعلان' : 'Watch Ad'}
              </span>
            </Button>
          </motion.div>

          {/* Leaderboard */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              className="w-full h-20 bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-0 flex flex-col gap-1"
              onClick={async () => {
                if (!isAuthenticated || !user) {
                  console.log('User must be logged in to claim daily bonus');
                  return;
                }
                
                try {
                  // Call daily bonus API
                  const response = await fetch('/api/rewards/daily-bonus', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                      userId: user.id
                    })
                  });
                  
                  if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                  }
                  
                  const data = await response.json();
                  console.log('Daily bonus response:', data);
                  
                  if (data.success) {
                    console.log(`Daily bonus claimed! Earned ${data.reward} coins! New balance: ${data.newBalance}`);
                    alert(language === 'ar' ? 
                      `مكافأة يومية! حصلت على ${data.reward} عملة` : 
                      `Daily bonus! Earned ${data.reward} coins`
                    );
                    // Refresh the page to update coin balance
                    window.location.reload();
                  } else {
                    console.log(`Daily bonus error: ${data.error}`);
                    if (data.error && data.error.includes('already claimed')) {
                      alert(language === 'ar' ? 'تم استلام المكافأة اليومية بالفعل! عد غداً.' : 'Daily bonus already claimed! Come back tomorrow.');
                    } else {
                      alert(language === 'ar' ? `خطأ: ${data.error}` : `Error: ${data.error}`);
                    }
                  }
                } catch (error) {
                  console.error('Error claiming daily bonus:', error);
                  alert(language === 'ar' ? 'خطأ في استلام المكافأة' : 'Error claiming daily bonus');
                }
              }}
            >
              <Zap className="h-5 w-5" />
              <span className="text-xs font-medium">
                {language === 'ar' ? 'مكافأة يومية' : 'Daily Bonus'}
              </span>
              <span className="text-xs opacity-80">
                +{user?.premium ? '50' : '25'} {language === 'ar' ? 'عملة' : 'Coins'}
              </span>
            </Button>
          </motion.div>
        </motion.div>

        {/* Main game modes */}
        <motion.div variants={itemVariants} className="space-y-3">
          {/* Quiz Zone */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button 
              className="w-full h-16 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-white border-0 flex items-center justify-between px-6"
              onClick={() => setGameState('quiz-zone')}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <FaBolt className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">Quiz Zone</p>
                  <p className="text-xs opacity-80">Solo Challenge</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs opacity-80">Play Now</p>
              </div>
            </Button>
          </motion.div>

          {/* Contests */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button 
              className="w-full h-16 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white border-0 flex items-center justify-between px-6"
              onClick={() => {
                console.log('Open contests');
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <FaTrophy className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">{language === 'ar' ? 'مسابقه' : 'Contests'}</p>
                  <p className="text-xs opacity-80">Weekly Tournaments</p>
                </div>
              </div>
              <div className="text-right">
                <Badge className="bg-yellow-500 text-black text-xs">
                  🏆 Live
                </Badge>
              </div>
            </Button>
          </motion.div>

          {/* Battles */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button 
              className="w-full h-16 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0 flex items-center justify-between px-6"
              onClick={() => setGameState('lobby')}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <Swords className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">Battles</p>
                  <p className="text-xs opacity-80">1v1 & Team Matches</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs opacity-80">
                  <Users className="inline h-3 w-3 mr-1" />
                  23 Online
                </p>
              </div>
            </Button>
          </motion.div>
        </motion.div>

        {/* Bottom actions */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
          {/* Coin Store */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              variant="outline"
              className="w-full h-14 border-primary/30 hover:bg-primary/10 flex flex-col gap-1"
              onClick={() => setGameState('coin-store')}
            >
              <FaCoins className="h-4 w-4 text-yellow-500" />
              <span className="text-xs">Coin Store</span>
            </Button>
          </motion.div>

          {/* Friends */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              variant="outline"
              className="w-full h-14 border-primary/30 hover:bg-primary/10 flex flex-col gap-1"
              onClick={() => setGameState('friends')}
            >
              <FaUserFriends className="h-4 w-4 text-primary" />
              <span className="text-xs">Friends</span>
            </Button>
          </motion.div>
        </motion.div>

        {/* Progress indicator */}
        <motion.div variants={itemVariants}>
          <Card className="bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Level Progress</span>
                <span className="text-xs text-muted-foreground">
                  {userStats.coins % 100}/100
                </span>
              </div>
              <div className="w-full bg-muted/30 rounded-full h-2">
                <motion.div 
                  className="bg-gradient-to-r from-primary to-accent h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(userStats.coins % 100)}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
    </>
  );
}