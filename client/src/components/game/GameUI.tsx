import React from 'react';
import { useTriviaGame } from '../../lib/stores/useTriviaGame';
import { useLanguage } from '../../lib/stores/useLanguage';
import { useAudio } from '../../lib/stores/useAudio';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Progress } from '../ui/progress';
import { Volume2, VolumeX, Globe } from 'lucide-react';

export default function GameUI() {
  const { 
    currentQuestion,
    timeRemaining,
    questionNumber,
    totalQuestions,
    streak
  } = useTriviaGame();
  const { language, toggleLanguage, translations } = useLanguage();
  const { isMuted, toggleMute } = useAudio();

  const progressPercentage = ((totalQuestions - questionNumber + 1) / totalQuestions) * 100;
  const timePercentage = (timeRemaining / 30) * 100; // Assuming 30 seconds per question

  return (
    <div className="absolute top-4 left-4 right-4 z-10">
      {/* Top UI Bar */}
      <div className="flex justify-between items-center mb-4">
        {/* Left side - Question progress */}
        <Card className="bg-black/70 border-gray-600 px-4 py-2">
          <div className="text-white text-sm">
            {translations.question} {questionNumber}/{totalQuestions}
          </div>
          <Progress value={progressPercentage} className="w-32 mt-1" />
        </Card>

        {/* Right side - Controls */}
        <div className="flex gap-2">
          {/* Language Toggle */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={toggleLanguage}
            className="bg-black/70 border-gray-600 text-white hover:bg-black/90"
          >
            <Globe className="h-4 w-4 mr-1" />
            {language.toUpperCase()}
          </Button>

          {/* Audio Toggle */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={toggleMute}
            className="bg-black/70 border-gray-600 text-white hover:bg-black/90"
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Time remaining bar */}
      <Card className="bg-black/70 border-gray-600 p-2 mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-white text-sm">{translations.timeRemaining}</span>
          <span className="text-white text-sm font-bold">{timeRemaining}s</span>
        </div>
        <Progress 
          value={timePercentage} 
          className="w-full"
          // Change color based on time remaining
          style={{
            '--progress-foreground': timePercentage > 50 ? '#10B981' : timePercentage > 20 ? '#F59E0B' : '#EF4444'
          } as React.CSSProperties}
        />
      </Card>

      {/* Streak indicator */}
      {streak > 1 && (
        <Card className="bg-green-600/80 border-green-500 p-2 mb-4">
          <div className="text-white text-center font-bold">
            🔥 {translations.streak}: {streak}
          </div>
        </Card>
      )}
    </div>
  );
}
