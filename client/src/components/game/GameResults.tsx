import React, { useEffect } from 'react';
import { useTriviaGame } from '../../lib/stores/useTriviaGame';
import { useLanguage } from '../../lib/stores/useLanguage';
import { SpaceButton } from '../ui/SpaceButton';
import { HologramCard } from '../ui/HologramCard';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Trophy, Star, Target, Clock, RotateCcw, Home, Share2 } from 'lucide-react';

export default function GameResults() {
  const { 
    score,
    correctAnswers,
    totalQuestions,
    totalTime,
    streak,
    maxStreak,
    resetGame,
    setGameState,
    highScore,
    isNewHighScore
  } = useTriviaGame();
  const { translations } = useLanguage();

  const percentage = Math.round((correctAnswers / totalQuestions) * 100);
  const averageTime = Math.round(totalTime / totalQuestions);

  // Performance rating
  const getPerformanceRating = () => {
    if (percentage >= 90) return { rating: 'excellent', color: 'text-yellow-400', icon: '🏆' };
    if (percentage >= 75) return { rating: 'great', color: 'text-green-400', icon: '🌟' };
    if (percentage >= 60) return { rating: 'good', color: 'text-blue-400', icon: '👍' };
    if (percentage >= 40) return { rating: 'fair', color: 'text-orange-400', icon: '📈' };
    return { rating: 'needsImprovement', color: 'text-red-400', icon: '💪' };
  };

  const performance = getPerformanceRating();

  return (
    <div className="h-screen overflow-y-auto overflow-x-hidden" style={{ WebkitOverflowScrolling: 'touch' }}>
      <div className="p-4 min-h-full flex items-center justify-center">
        <HologramCard className="w-full max-w-lg">
          <div className="p-6 text-center">
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            {translations.gameComplete}
          </h2>
          
          {isNewHighScore && (
            <div className="mb-4">
              <Badge className="bg-gradient-to-r from-yellow-500/50 to-yellow-600/50 text-yellow-200 px-4 py-2 border border-yellow-400/50">
                <Trophy className="h-4 w-4 mr-2" />
                {translations.newHighScore}!
              </Badge>
            </div>
          )}
          
          <div className={`text-6xl font-bold mb-2 ${performance.color}`}>
            {performance.icon}
          </div>
          
          <div className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-yellow-400 bg-clip-text text-transparent mb-2">
            {score}
          </div>
          
          <Badge className={`bg-black/50 border-2 ${performance.color}`}>
            {translations[performance.rating]}
          </Badge>
        </div>

        <div className="px-6 pb-6 space-y-6">
          {/* Score Progress */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>{translations.accuracy}</span>
              <span>{percentage}%</span>
            </div>
            <Progress value={percentage} className="h-3" />
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-lg p-3">
              <div className="text-center">
                <Target className="h-6 w-6 mx-auto mb-2 text-green-400" />
                <div className="text-lg font-bold">{correctAnswers}/{totalQuestions}</div>
                <div className="text-xs text-gray-400">{translations.correct}</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-lg p-3">
              <div className="text-center">
                <Clock className="h-6 w-6 mx-auto mb-2 text-blue-400" />
                <div className="text-lg font-bold">{averageTime}s</div>
                <div className="text-xs text-gray-400">{translations.avgTime}</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-lg p-3">
              <div className="text-center">
                <Star className="h-6 w-6 mx-auto mb-2 text-yellow-400" />
                <div className="text-lg font-bold">{maxStreak}</div>
                <div className="text-xs text-gray-400">{translations.bestStreak}</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-lg p-3">
              <div className="text-center">
                <Trophy className="h-6 w-6 mx-auto mb-2 text-purple-400" />
                <div className="text-lg font-bold">{highScore}</div>
                <div className="text-xs text-gray-400">{translations.highScore}</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            <SpaceButton 
              onClick={resetGame}
              className="w-full"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              {translations.playAgain}
            </SpaceButton>

            <div className="grid grid-cols-2 gap-2">
              <SpaceButton 
                onClick={() => setGameState('home')}
                variant="secondary"
                className=""
              >
                <Home className="h-4 w-4 mr-2" />
                {translations.home || 'Home'}
              </SpaceButton>

              <SpaceButton 
                onClick={() => {
                  // Mock share functionality
                  if (navigator.share) {
                    navigator.share({
                      title: 'Mirage Trivia',
                      text: `I just scored ${score} points in Mirage Trivia! Can you beat it?`,
                      url: window.location.href,
                    });
                  }
                }}
                variant="secondary"
                className=""
              >
                <Share2 className="h-4 w-4 mr-2" />
                {translations.share}
              </SpaceButton>
            </div>
          </div>
        </div>
      </HologramCard>
      </div>
    </div>
  );
}
