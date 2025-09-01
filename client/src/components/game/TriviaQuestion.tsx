import React, { useEffect } from 'react';
import { useTriviaGame } from '../../lib/stores/useTriviaGame';
import { useLanguage } from '../../lib/stores/useLanguage';
import { useAudio } from '../../lib/stores/useAudio';
import { SpaceButton } from '../ui/SpaceButton';
import { HologramCard } from '../ui/HologramCard';
import { Badge } from '../ui/badge';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

export default function TriviaQuestion() {
  const { 
    currentQuestion, 
    selectedAnswer, 
    showAnswer,
    answerQuestion,
    nextQuestion,
    questionNumber,
    totalQuestions,
    timeRemaining
  } = useTriviaGame();
  const { translations } = useLanguage();
  const { playHit, playSuccess } = useAudio();

  // Play sound when answer is revealed
  useEffect(() => {
    if (showAnswer) {
      if (selectedAnswer === currentQuestion?.correctAnswer) {
        playSuccess();
      } else {
        playHit();
      }
    }
  }, [showAnswer, selectedAnswer, currentQuestion?.correctAnswer, playHit, playSuccess]);

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center p-4 py-20">
        <HologramCard className="p-6">
          <div className="text-blue-300 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
            {translations.loadingQuestion}...
          </div>
        </HologramCard>
      </div>
    );
  }

  const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

  return (
    <div className="flex items-center justify-center p-4 py-20">
      <HologramCard className="w-full max-w-2xl">
        <div className="p-6 text-center">
          <div className="flex justify-between items-center mb-4">
            <Badge className="bg-blue-900/50 border-blue-500 text-blue-300">
              {questionNumber}/{totalQuestions}
            </Badge>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-400" />
              <span className={`font-bold ${timeRemaining <= 10 ? 'text-red-400' : 'text-white'}`}>
                {timeRemaining}s
              </span>
            </div>
            <Badge className="bg-purple-900/50 border-purple-500 text-purple-300">
              {currentQuestion.difficulty}
            </Badge>
          </div>
          
          <Badge className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 text-yellow-300 mb-4">
            {currentQuestion.category}
          </Badge>
        </div>

        <div className="px-6 pb-6 space-y-6">
          {/* Question Text */}
          <div className="text-center">
            <h2 className="text-xl font-semibold leading-relaxed mb-6">
              {currentQuestion.question}
            </h2>
          </div>

          {/* Answer Options */}
          <div className="grid grid-cols-1 gap-3">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrectAnswer = index === currentQuestion.correctAnswer;
              
              let buttonClass = "w-full p-4 text-left transition-all duration-200 ";
              let icon = null;

              if (showAnswer) {
                if (isCorrectAnswer) {
                  buttonClass += "bg-green-600 hover:bg-green-700 border-green-500 text-white";
                  icon = <CheckCircle className="h-5 w-5 ml-auto text-green-200" />;
                } else if (isSelected) {
                  buttonClass += "bg-red-600 hover:bg-red-700 border-red-500 text-white";
                  icon = <XCircle className="h-5 w-5 ml-auto text-red-200" />;
                } else {
                  buttonClass += "bg-gray-700 border-gray-600 text-gray-300";
                }
              } else {
                if (isSelected) {
                  buttonClass += "bg-blue-600 hover:bg-blue-700 border-blue-500 text-white";
                } else {
                  buttonClass += "bg-gray-800 hover:bg-gray-700 border-gray-600 text-white";
                }
              }

              return (
                <button
                  key={index}
                  onClick={() => !showAnswer && answerQuestion(index)}
                  disabled={showAnswer}
                  className={buttonClass + "rounded-lg border-2 font-medium transition-all"}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-base">{option}</span>
                    {icon}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Answer Feedback */}
          {showAnswer && (
            <div className="text-center pt-4">
              <div className={`text-lg font-bold mb-2 ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                {isCorrect ? '✅ ' + translations.correct : '❌ ' + translations.incorrect}
              </div>
              
              {currentQuestion.explanation && (
                <p className="text-gray-300 text-sm mb-4">
                  {currentQuestion.explanation}
                </p>
              )}

              <SpaceButton 
                onClick={nextQuestion}
                className="px-8"
              >
                {questionNumber === totalQuestions ? translations.seeResults : translations.nextQuestion}
              </SpaceButton>
            </div>
          )}
        </div>
      </HologramCard>
    </div>
  );
}
