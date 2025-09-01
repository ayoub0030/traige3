import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../lib/stores/useLanguage';
import { useTriviaGame } from '../../lib/stores/useTriviaGame';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { 
  ArrowLeft, 
  Lightbulb, 
  Send, 
  Clock, 
  Heart,
  Zap
} from 'lucide-react';

// Question Screen component with image, scrambled letters input, hint/back/submit buttons
export default function QuestionScreen() {
  const { translations, language } = useLanguage();
  const { 
    currentQuestion, 
    questionNumber, 
    totalQuestions, 
    timeRemaining, 
    score,
    streak,
    answerQuestion,
    setGameState
  } = useTriviaGame();

  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [scrambledLetters, setScrambledLetters] = useState<string[]>([]);
  const [usedHint, setUsedHint] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Scramble the correct answer letters
  useEffect(() => {
    if (currentQuestion) {
      const correctAnswer = currentQuestion.options[currentQuestion.correctAnswer];
      const letters = correctAnswer.split('').filter(char => char !== ' ');
      // Add some extra random letters to make it challenging
      const extraLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.max(3, Math.floor(letters.length * 0.3)));
      
      const allLetters = [...letters, ...extraLetters]
        .sort(() => Math.random() - 0.5);
      
      setScrambledLetters(allLetters);
    }
  }, [currentQuestion]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        delayChildren: 0.1,
        staggerChildren: 0.1
      }
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: { duration: 0.3 }
    }
  };

  const letterVariants = {
    hidden: { scale: 0, rotate: 180 },
    visible: {
      scale: 1,
      rotate: 0,
      transition: {
        type: "spring",
        damping: 20,
        stiffness: 300
      }
    }
  };

  const handleLetterClick = (letter: string, index: number) => {
    if (selectedAnswer.length < 20) { // Reasonable limit
      setSelectedAnswer(prev => prev + letter);
      // Remove letter from available letters
      setScrambledLetters(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleBackspace = () => {
    if (selectedAnswer.length > 0) {
      const lastLetter = selectedAnswer[selectedAnswer.length - 1];
      setSelectedAnswer(prev => prev.slice(0, -1));
      // Add letter back to scrambled letters
      setScrambledLetters(prev => [...prev, lastLetter]);
    }
  };

  const handleSubmit = () => {
    if (selectedAnswer.trim()) {
      // Find the matching option
      const matchingIndex = currentQuestion?.options.findIndex(
        option => option.toLowerCase().replace(/\s/g, '') === selectedAnswer.toLowerCase().replace(/\s/g, '')
      ) ?? -1;
      
      if (matchingIndex !== -1) {
        answerQuestion(matchingIndex);
      } else {
        // Wrong answer - still submit as first option to trigger incorrect logic
        answerQuestion(0);
      }
    }
  };

  const handleHint = () => {
    if (!usedHint && currentQuestion) {
      setUsedHint(true);
      setShowHint(true);
      // Auto-hide hint after 5 seconds
      setTimeout(() => setShowHint(false), 5000);
    }
  };

  if (!currentQuestion) {
    return <div>Loading...</div>;
  }

  const progress = ((questionNumber - 1) / totalQuestions) * 100;
  const timeProgress = (timeRemaining / 30) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 overflow-y-auto" style={{ height: '100vh' }}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="max-w-md mx-auto space-y-4 pb-32"
      >
        {/* Header with progress */}
        <motion.div className="space-y-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setGameState('quiz-zone')}
              className="text-primary hover:bg-primary/10"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Question {questionNumber}/{totalQuestions}
              </Badge>
              <div className="flex items-center gap-1">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-bold text-yellow-500">{streak}</span>
              </div>
            </div>
          </div>

          {/* Progress bars */}
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{timeRemaining}s</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium">{score.toLocaleString()}</span>
              </div>
            </div>
            <Progress 
              value={timeProgress} 
              className="h-1" 
              color={timeRemaining < 10 ? 'bg-red-500' : 'bg-primary'}
            />
          </div>
        </motion.div>

        {/* Question image */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="overflow-hidden">
            <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              {/* Placeholder for question image */}
              <div className="text-center p-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-2xl">🧠</span>
                </div>
                <p className="text-sm text-muted-foreground">Question Image</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Question text */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <h2 className="text-lg font-semibold mb-2">
                {currentQuestion.question}
              </h2>
              <Badge variant="secondary" className="text-xs">
                {currentQuestion.category} • {currentQuestion.difficulty}
              </Badge>
            </CardContent>
          </Card>
        </motion.div>

        {/* Hint display */}
        <AnimatePresence>
          {showHint && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3"
            >
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                💡 Hint: {currentQuestion.explanation || 'Think about the category and context of the question.'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Answer input */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          {/* Answer display */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="min-h-[60px] flex items-center justify-center">
                <div className="text-xl font-mono tracking-widest">
                  {selectedAnswer || (
                    <span className="text-muted-foreground">Tap letters below...</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scrambled letters */}
          <div className="grid grid-cols-6 gap-2">
            <AnimatePresence>
              {scrambledLetters.map((letter, index) => (
                <motion.button
                  key={`${letter}-${index}`}
                  variants={letterVariants}
                  initial="hidden"
                  animate="visible"
                  exit={{ scale: 0, rotate: 180 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="aspect-square bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-white rounded-lg text-lg font-bold shadow-lg"
                  onClick={() => handleLetterClick(letter, index)}
                >
                  {letter}
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-3 gap-3"
        >
          {/* Hint button */}
          <Button
            variant="outline"
            onClick={handleHint}
            disabled={usedHint}
            className="flex flex-col gap-1 h-16 border-yellow-500/30 hover:bg-yellow-500/10"
          >
            <Lightbulb className={`h-4 w-4 ${usedHint ? 'text-muted-foreground' : 'text-yellow-500'}`} />
            <span className="text-xs">
              {usedHint ? 'Used' : 'Hint'}
            </span>
          </Button>

          {/* Backspace button */}
          <Button
            variant="outline"
            onClick={handleBackspace}
            disabled={selectedAnswer.length === 0}
            className="flex flex-col gap-1 h-16 border-red-500/30 hover:bg-red-500/10"
          >
            <ArrowLeft className="h-4 w-4 text-red-500" />
            <span className="text-xs">Back</span>
          </Button>

          {/* Submit button */}
          <Button
            onClick={handleSubmit}
            disabled={selectedAnswer.length === 0}
            className="flex flex-col gap-1 h-16 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0"
          >
            <Send className="h-4 w-4" />
            <span className="text-xs">Submit</span>
          </Button>
        </motion.div>

        {/* Score display */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Current Score:</span>
                  <span className="font-bold text-primary">{score.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Streak:</span>
                  <span className="font-bold text-yellow-500">🔥 {streak}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}