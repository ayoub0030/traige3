import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../lib/stores/useLanguage';
import { useTriviaGame } from '../../lib/stores/useTriviaGame';
import { useMultiplayer } from '../../lib/stores/useMultiplayer';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  Trophy,
  Star,
  Zap,
  Crown,
  Target,
  Users,
  TrendingUp,
  Award,
  ChevronUp,
  ChevronDown,
  Coins,
  Gift
} from 'lucide-react';

interface Player {
  id: string;
  username: string;
  score: number;
  rank: string;
  streak: number;
  correctAnswers: number;
  totalQuestions: number;
  isOnline: boolean;
}

interface ScoreboardOverlayProps {
  players: Player[];
  currentPlayer?: Player;
  gameMode: '1v1' | '2v2' | 'single';
  isVisible: boolean;
  onToggle: () => void;
  showAdReward?: boolean;
  onAdReward?: () => void;
}

export default function ScoreboardOverlay({
  players,
  currentPlayer,
  gameMode,
  isVisible,
  onToggle,
  showAdReward = false,
  onAdReward
}: ScoreboardOverlayProps) {
  const { language } = useLanguage();
  const { score, correctAnswers, streak } = useTriviaGame();
  const { currentRoom } = useMultiplayer();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [sortedPlayers, setSortedPlayers] = useState<Player[]>([]);

  // Sort players by score
  useEffect(() => {
    const sorted = [...players].sort((a, b) => b.score - a.score);
    setSortedPlayers(sorted);
  }, [players]);

  // Get rank display
  const getRankIcon = (position: number) => {
    if (position === 1) return <Crown className="h-4 w-4 text-yellow-500" />;
    if (position === 2) return <Trophy className="h-4 w-4 text-gray-400" />;
    if (position === 3) return <Award className="h-4 w-4 text-amber-600" />;
    return <span className="text-sm font-medium">#{position}</span>;
  };

  // Get accuracy percentage
  const getAccuracy = (correct: number, total: number) => {
    return total > 0 ? Math.round((correct / total) * 100) : 0;
  };

  // Simulate ad reward
  const handleAdReward = async () => {
    if (!onAdReward) return;
    
    try {
      // Call ad reward API
      const response = await fetch('/api/rewards/ad', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentPlayer?.id || 1 // Default to 1 for demo
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        onAdReward();
        // Show success notification
        console.log(`Earned ${data.reward} coins! New balance: ${data.newBalance}`);
      }
    } catch (error) {
      console.error('Error claiming ad reward:', error);
    }
  };

  const containerVariants = {
    hidden: { 
      opacity: 0, 
      y: -20,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        damping: 20,
        stiffness: 300
      }
    },
    exit: { 
      opacity: 0, 
      y: -20,
      scale: 0.95,
      transition: { 
        duration: 0.2 
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { 
        type: "spring",
        damping: 20,
        stiffness: 300
      }
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed top-4 right-4 z-50 w-80 max-w-sm"
      >
        <Card className="bg-card/95 backdrop-blur-lg border-border shadow-xl">
          {/* Header */}
          <div 
            className="p-3 border-b border-border cursor-pointer hover:bg-accent/20 transition-colors"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-primary/10 rounded-lg">
                  {gameMode === '1v1' ? (
                    <Target className="h-4 w-4 text-primary" />
                  ) : gameMode === '2v2' ? (
                    <Users className="h-4 w-4 text-primary" />
                  ) : (
                    <Trophy className="h-4 w-4 text-primary" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-sm">
                    {language === 'ar' ? 'النتائج' : 'Scoreboard'}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {gameMode === '1v1' && (language === 'ar' ? 'واحد ضد واحد' : '1vs1')}
                    {gameMode === '2v2' && (language === 'ar' ? 'فريق ضد فريق' : '2vs2')}
                    {gameMode === 'single' && (language === 'ar' ? 'فردي' : 'Solo')}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                {isExpanded ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>

          <CardContent className="p-0">
            {/* Compact View */}
            {!isExpanded && currentPlayer && (
              <div className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {currentPlayer.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{currentPlayer.username}</div>
                      <div className="text-xs text-muted-foreground">
                        {currentPlayer.score} {language === 'ar' ? 'نقطة' : 'points'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <Zap className="h-3 w-3 text-orange-500" />
                      <span className="text-sm font-medium">{streak}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {getAccuracy(correctAnswers, currentPlayer.totalQuestions)}% 
                      {language === 'ar' ? ' دقة' : ' accuracy'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Expanded View */}
            {isExpanded && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-3 space-y-3">
                  {/* Current Player Stats */}
                  {currentPlayer && (
                    <motion.div
                      variants={itemVariants}
                      className="p-3 bg-primary/5 rounded-lg border border-primary/20"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {currentPlayer.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-sm">{currentPlayer.username}</div>
                            <Badge variant="secondary" className="text-xs">
                              {currentPlayer.rank}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg">{currentPlayer.score}</div>
                          <div className="text-xs text-muted-foreground">
                            {language === 'ar' ? 'نقاط' : 'points'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <div className="flex items-center justify-center gap-1">
                            <Zap className="h-3 w-3 text-orange-500" />
                            <span className="font-medium text-sm">{streak}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {language === 'ar' ? 'سلسلة' : 'Streak'}
                          </div>
                        </div>
                        <div>
                          <div className="font-medium text-sm text-green-600">
                            {correctAnswers}/{currentPlayer.totalQuestions}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {language === 'ar' ? 'صحيح' : 'Correct'}
                          </div>
                        </div>
                        <div>
                          <div className="font-medium text-sm">
                            {getAccuracy(correctAnswers, currentPlayer.totalQuestions)}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {language === 'ar' ? 'دقة' : 'Accuracy'}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Other Players */}
                  {sortedPlayers.length > 1 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {language === 'ar' ? 'اللاعبين الآخرين' : 'Other Players'}
                      </h4>
                      
                      {sortedPlayers
                        .filter(player => player.id !== currentPlayer?.id)
                        .slice(0, 3)
                        .map((player, index) => (
                          <motion.div
                            key={player.id}
                            variants={itemVariants}
                            className="flex items-center justify-between p-2 bg-accent/5 rounded-lg"
                          >
                            <div className="flex items-center gap-2">
                              {getRankIcon(sortedPlayers.findIndex(p => p.id === player.id) + 1)}
                              <div>
                                <div className="font-medium text-sm">{player.username}</div>
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                  <div className={`w-2 h-2 rounded-full ${player.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                                  {player.isOnline ? 
                                    (language === 'ar' ? 'متصل' : 'Online') : 
                                    (language === 'ar' ? 'غير متصل' : 'Offline')
                                  }
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium text-sm">{player.score}</div>
                              <div className="text-xs text-muted-foreground">
                                {getAccuracy(player.correctAnswers, player.totalQuestions)}%
                              </div>
                            </div>
                          </motion.div>
                        ))
                      }
                    </div>
                  )}

                  {/* Ad Reward Section */}
                  {showAdReward && (
                    <motion.div
                      variants={itemVariants}
                      className="pt-2 border-t border-border"
                    >
                      <Button
                        onClick={handleAdReward}
                        className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0 h-10"
                      >
                        <Gift className="h-4 w-4 mr-2" />
                        {language === 'ar' ? 'احصل على 5 عملات' : 'Get 5 Coins'}
                        <span className="ml-1 text-xs opacity-80">
                          {language === 'ar' ? '(إعلان)' : '(Ad)'}
                        </span>
                      </Button>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}