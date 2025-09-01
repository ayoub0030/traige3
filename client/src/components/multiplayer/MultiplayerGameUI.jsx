import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMultiplayerGame } from '../../lib/hooks/useSocket';
import { useAuth } from '../../lib/stores/useAuth';
import { useLanguage } from '../../lib/stores/useLanguage';
import { useTriviaGame } from '../../lib/stores/useTriviaGame';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { 
  Clock, 
  Users, 
  Trophy, 
  Zap,
  Crown,
  Target,
  CheckCircle,
  XCircle
} from 'lucide-react';

// Multiplayer Game UI component with real-time opponent tracking
export default function MultiplayerGameUI() {
  const { user } = useAuth();
  const { translations, language } = useLanguage();
  const { setGameState } = useTriviaGame();
  const {
    gameState,
    room,
    opponents,
    currentQuestion,
    scores,
    gameMode,
    submitAnswer,
    leaveGame
  } = useMultiplayerGame();

  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [showResults, setShowResults] = useState(false);
  const [roundResults, setRoundResults] = useState(null);

  // Handle question timer
  useEffect(() => {
    if (gameState === 'playing' && currentQuestion && !hasAnswered) {
      setTimeRemaining(30);
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            // Auto-submit if time runs out
            if (!hasAnswered) {
              handleAnswerSubmit(-1); // -1 indicates no answer
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [currentQuestion, hasAnswered, gameState]);

  // Handle answer submission
  const handleAnswerSubmit = (answerIndex) => {
    if (hasAnswered) return;
    
    setSelectedAnswer(answerIndex);
    setHasAnswered(true);
    
    // Submit to server
    submitAnswer(answerIndex);
  };

  // Reset for next question
  useEffect(() => {
    if (currentQuestion) {
      setSelectedAnswer(null);
      setHasAnswered(false);
      setShowResults(false);
      setQuestionNumber(prev => prev + 1);
    }
  }, [currentQuestion]);

  // Handle game end
  const handleLeaveGame = () => {
    leaveGame();
    setGameState('home');
  };

  if (gameState !== 'playing' || !currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold mb-4">Waiting for game...</h2>
            <Button onClick={handleLeaveGame} variant="outline">
              Leave Game
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const timeProgress = (timeRemaining / 30) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-4xl mx-auto space-y-4"
      >
        {/* Header with scores and timer */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
        >
          {/* Game Info */}
          <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Trophy className="h-5 w-5 text-primary" />
                <Badge variant="outline">{gameMode}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">Question {questionNumber}</p>
            </CardContent>
          </Card>

          {/* Timer */}
          <Card className={timeRemaining <= 10 ? 'border-red-500/50' : 'border-primary/20'}>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className={`h-5 w-5 ${timeRemaining <= 10 ? 'text-red-500' : 'text-primary'}`} />
                <span className={`text-xl font-bold ${timeRemaining <= 10 ? 'text-red-500' : 'text-primary'}`}>
                  {timeRemaining}s
                </span>
              </div>
              <Progress 
                value={timeProgress} 
                className={`h-2 ${timeRemaining <= 10 ? 'bg-red-500' : ''}`}
              />
            </CardContent>
          </Card>

          {/* Scores */}
          <Card>
            <CardContent className="p-4">
              {gameMode === '1vs1' ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{user?.username || 'You'}</span>
                    <span className="font-bold text-primary">
                      {Object.entries(scores).find(([id]) => id.includes('user'))?.[1] || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      {opponents[0]?.username || 'Opponent'}
                    </span>
                    <span className="font-bold text-accent">
                      {Object.entries(scores).find(([id]) => !id.includes('user'))?.[1] || 0}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Team 1</span>
                    <span className="font-bold text-primary">{scores.team1 || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Team 2</span>
                    <span className="font-bold text-accent">{scores.team2 || 0}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Question */}
        <motion.div
          key={currentQuestion.question}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
        >
          <Card className="bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <Badge variant="secondary" className="mb-4">
                  {currentQuestion.category} • {currentQuestion.difficulty}
                </Badge>
                <h2 className="text-xl md:text-2xl font-bold">
                  {currentQuestion.question}
                </h2>
              </div>

              {/* Answer Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = selectedAnswer === index;
                  const isDisabled = hasAnswered;
                  
                  return (
                    <motion.div
                      key={index}
                      whileHover={!isDisabled ? { scale: 1.02 } : {}}
                      whileTap={!isDisabled ? { scale: 0.98 } : {}}
                    >
                      <Button
                        onClick={() => handleAnswerSubmit(index)}
                        disabled={isDisabled}
                        variant={isSelected ? "default" : "outline"}
                        className={`w-full h-auto p-4 text-left justify-start ${
                          isSelected 
                            ? 'bg-primary text-primary-foreground' 
                            : 'hover:bg-primary/10'
                        } ${isDisabled ? 'opacity-60' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                            isSelected 
                              ? 'border-primary-foreground bg-primary-foreground text-primary' 
                              : 'border-muted-foreground'
                          }`}>
                            {String.fromCharCode(65 + index)}
                          </div>
                          <span className="flex-1">{option}</span>
                          {isSelected && hasAnswered && (
                            <CheckCircle className="h-5 w-5" />
                          )}
                        </div>
                      </Button>
                    </motion.div>
                  );
                })}
              </div>

              {/* Answer Status */}
              {hasAnswered && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 text-center"
                >
                  <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Answer submitted!</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Waiting for other players...
                  </p>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Players Status */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {/* Current Player */}
          <Card className="border-primary/30">
            <CardContent className="p-3 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-sm font-medium">
                    {(user?.username || 'You')[0].toUpperCase()}
                  </span>
                </div>
                {user?.premium && <Crown className="h-4 w-4 text-yellow-500" />}
              </div>
              <p className="text-sm font-medium">{user?.username || 'You'}</p>
              <div className="flex items-center justify-center mt-1">
                {hasAnswered ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Clock className="h-4 w-4 text-orange-500" />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Opponents */}
          {opponents.map((opponent, index) => (
            <Card key={index}>
              <CardContent className="p-3 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                    <span className="text-sm font-medium">
                      {opponent.username[0].toUpperCase()}
                    </span>
                  </div>
                  {opponent.premium && <Crown className="h-4 w-4 text-yellow-500" />}
                </div>
                <p className="text-sm font-medium">{opponent.username}</p>
                <div className="flex items-center justify-center mt-1">
                  <Clock className="h-4 w-4 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Empty slots for team mode */}
          {gameMode === '2vs2' && Array.from({ 
            length: Math.max(0, 4 - opponents.length - 1) 
          }).map((_, index) => (
            <Card key={`empty-${index}`} className="opacity-50">
              <CardContent className="p-3 text-center">
                <div className="w-8 h-8 rounded-full bg-muted/30 flex items-center justify-center mb-2 mx-auto">
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">Waiting...</p>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Leave Game Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center pt-4"
        >
          <Button
            onClick={handleLeaveGame}
            variant="outline"
            className="border-red-500/30 text-red-500 hover:bg-red-500/10"
          >
            Leave Game
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}