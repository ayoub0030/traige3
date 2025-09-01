import React, { useEffect, useState } from 'react';
import { useMultiplayer } from '../../lib/stores/useMultiplayer';
import { useLanguage } from '../../lib/stores/useLanguage';
import { useAudio } from '../../lib/stores/useAudio';
import { useTriviaGame } from '../../lib/stores/useTriviaGame';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { CheckCircle, XCircle, Clock, Users, Trophy, Star, Zap } from 'lucide-react';

export default function MultiplayerGame() {
  const { 
    currentRoom,
    gameStarted,
    roundResults,
    gameResults,
    setPlayerReady,
    submitAnswer,
    disconnect
  } = useMultiplayer();
  
  const { translations } = useLanguage();
  const { playHit, playSuccess } = useAudio();
  const { setGameState } = useTriviaGame();
  
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Handle room state changes
  useEffect(() => {
    if (!currentRoom) {
      setGameState('menu');
      return;
    }
  }, [currentRoom, setGameState]);

  // Handle round results
  useEffect(() => {
    if (roundResults) {
      setShowResults(true);
      setHasAnswered(false);
      setSelectedAnswer(null);
      
      // Play sound based on result
      const myResult = roundResults.results?.find((r: any) => r.playerId === currentRoom?.players[0]?.id);
      if (myResult?.isCorrect) {
        playSuccess();
      } else {
        playHit();
      }
    }
  }, [roundResults, playSuccess, playHit, currentRoom]);

  // Handle game end
  useEffect(() => {
    if (gameResults) {
      setShowResults(true);
    }
  }, [gameResults]);

  // Auto-hide results after delay
  useEffect(() => {
    if (showResults && !gameResults) {
      const timer = setTimeout(() => {
        setShowResults(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showResults, gameResults]);

  const handleAnswer = (answerIndex: number) => {
    if (hasAnswered || !currentRoom?.currentQuestion) return;
    
    setSelectedAnswer(answerIndex);
    setHasAnswered(true);
    
    const timeSpent = 30 - (currentRoom.timeRemaining || 0);
    submitAnswer(answerIndex, timeSpent);
  };

  const handleReady = () => {
    setPlayerReady();
  };

  const handleLeaveGame = () => {
    disconnect();
    setGameState('menu');
  };

  if (!currentRoom) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="bg-black/80 border-gray-600 p-6">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            Loading multiplayer game...
          </div>
        </Card>
      </div>
    );
  }

  // Waiting room
  if (currentRoom.status === 'waiting' || !gameStarted) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-2xl bg-black/90 border-gray-600 text-white">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Users className="h-6 w-6 text-blue-400" />
              <h2 className="text-2xl font-bold">
                {currentRoom.mode.toUpperCase()} Match
              </h2>
            </div>
            <p className="text-gray-300">Waiting for all players to be ready...</p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Players */}
            <div className="space-y-3">
              {currentRoom.players.map((player, index) => (
                <div key={player.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-blue-600 text-white">
                        {player.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold">{player.name}</div>
                      <div className="text-sm text-gray-400">
                        Level {player.level} • {player.wins} wins
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-gray-600">
                      {player.country}
                    </Badge>
                    {player.isReady ? (
                      <Badge className="bg-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Ready
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-yellow-600 text-yellow-400">
                        Waiting...
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Ready Button */}
            <div className="text-center space-y-4">
              <Button 
                onClick={handleReady}
                className="bg-green-600 hover:bg-green-700 text-white px-8"
                size="lg"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                I'm Ready!
              </Button>
              
              <Button 
                onClick={handleLeaveGame}
                variant="outline"
                className="border-gray-600 text-white hover:bg-white/10"
              >
                Leave Game
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Game ended
  if (gameResults) {
    const sortedResults = [...gameResults.results].sort((a, b) => b.score - a.score);
    const winner = gameResults.winner;
    const isDraw = gameResults.isDraw;

    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-lg bg-black/90 border-gray-600 text-white">
          <CardHeader className="text-center">
            <div className="text-6xl mb-4">
              {isDraw ? '🤝' : '🏆'}
            </div>
            <h2 className="text-2xl font-bold mb-2">
              {isDraw ? 'It\'s a Draw!' : 'Game Complete!'}
            </h2>
            {winner && !isDraw && (
              <p className="text-lg text-yellow-400">
                🎉 {winner.name} wins with {winner.score} points!
              </p>
            )}
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Final Scores */}
            <div className="space-y-2">
              <h3 className="font-semibold text-center mb-3">Final Scores</h3>
              {sortedResults.map((result, index) => (
                <div key={result.playerId} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                      #{index + 1}
                    </div>
                    <div>
                      <div className="font-semibold">{result.playerName}</div>
                      <div className="text-sm text-gray-400">
                        Best streak: {result.streak}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-400">
                      {result.score}
                    </div>
                    <div className="text-xs text-gray-400">points</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="pt-4 space-y-2">
              <Button 
                onClick={handleLeaveGame}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Back to Lobby
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show round results
  if (showResults && roundResults) {
    const myResult = roundResults.results?.find((r: any) => r.playerId === currentRoom?.players[0]?.id);
    const isCorrect = myResult?.isCorrect;

    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-2xl bg-black/90 border-gray-600 text-white">
          <CardHeader className="text-center">
            <div className={`text-6xl mb-4 ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
              {isCorrect ? '✅' : '❌'}
            </div>
            <h2 className={`text-2xl font-bold ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
              {isCorrect ? 'Correct!' : 'Incorrect'}
            </h2>
            {roundResults.explanation && (
              <p className="text-gray-300 text-sm mt-2">
                {roundResults.explanation}
              </p>
            )}
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Player Scores */}
            <div className="space-y-2">
              <h3 className="font-semibold text-center mb-3">Round Results</h3>
              {roundResults.results?.map((result: any) => (
                <div key={result.playerId} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      result.isCorrect ? 'bg-green-600' : 'bg-red-600'
                    }`}>
                      {result.isCorrect ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold">{result.playerName}</div>
                      <div className="text-sm text-gray-400">
                        Streak: {result.streak}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-400">
                      {result.score}
                    </div>
                    <div className="text-xs text-gray-400">total</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Active game
  const currentQuestion = currentRoom.currentQuestion;
  const timeRemaining = currentRoom.timeRemaining || 0;
  const timePercentage = (timeRemaining / 30) * 100;

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="bg-black/80 border-gray-600 p-6">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            Loading next question...
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      {/* Top UI Bar */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="flex justify-between items-center mb-4">
          {/* Question Progress */}
          <Card className="bg-black/70 border-gray-600 px-4 py-2">
            <div className="text-white text-sm">
              Question {currentRoom.questionIndex + 1}/{currentRoom.totalQuestions}
            </div>
            <Progress 
              value={((currentRoom.questionIndex + 1) / currentRoom.totalQuestions) * 100} 
              className="w-32 mt-1" 
            />
          </Card>

          {/* Players */}
          <div className="flex gap-2">
            {currentRoom.players.map((player) => (
              <Card key={player.id} className="bg-black/70 border-gray-600 px-3 py-2">
                <div className="text-white text-xs">
                  {player.name}
                </div>
                <div className="text-blue-400 font-bold">
                  {player.score || 0}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Timer */}
        <Card className="bg-black/70 border-gray-600 p-2">
          <div className="flex justify-between items-center mb-1">
            <span className="text-white text-sm">Time Remaining</span>
            <span className={`text-white text-sm font-bold ${timeRemaining <= 10 ? 'text-red-400' : ''}`}>
              {timeRemaining}s
            </span>
          </div>
          <Progress 
            value={timePercentage} 
            className="w-full"
            style={{
              '--progress-foreground': timePercentage > 50 ? '#10B981' : timePercentage > 20 ? '#F59E0B' : '#EF4444'
            } as React.CSSProperties}
          />
        </Card>
      </div>

      {/* Question */}
      <div className="flex items-center justify-center">
        <Card className="w-full max-w-2xl bg-black/90 border-gray-600 text-white">
          <CardHeader className="text-center">
            <Badge className="bg-gray-700 text-gray-300 mb-4">
              {currentQuestion.category}
            </Badge>
            <h2 className="text-xl font-semibold leading-relaxed">
              {currentQuestion.question}
            </h2>
          </CardHeader>

          <CardContent className="space-y-3">
            {/* Answer Options */}
            {currentQuestion.options.map((option: string, index: number) => {
              const isSelected = selectedAnswer === index;
              
              let buttonClass = "w-full p-4 text-left transition-all duration-200 ";
              
              if (hasAnswered && isSelected) {
                buttonClass += "bg-blue-600 border-blue-500 text-white";
              } else if (hasAnswered) {
                buttonClass += "bg-gray-700 border-gray-600 text-gray-300 opacity-50";
              } else if (isSelected) {
                buttonClass += "bg-blue-600 hover:bg-blue-700 border-blue-500 text-white";
              } else {
                buttonClass += "bg-gray-800 hover:bg-gray-700 border-gray-600 text-white";
              }

              return (
                <Button
                  key={index}
                  variant="outline"
                  onClick={() => handleAnswer(index)}
                  disabled={hasAnswered}
                  className={buttonClass}
                >
                  <span className="text-base">{option}</span>
                </Button>
              );
            })}

            {/* Answer Status */}
            {hasAnswered && (
              <div className="text-center pt-4">
                <div className="text-blue-400">
                  ✓ Answer submitted! Waiting for other players...
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}