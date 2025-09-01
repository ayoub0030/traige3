import React, { useState, useEffect } from 'react';
import { useTriviaGame } from '../../lib/stores/useTriviaGame';
import { useLanguage } from '../../lib/stores/useLanguage';
import { useMultiplayer, type Challenge } from '../../lib/stores/useMultiplayer';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Users, Search, ArrowLeft, Crown, Wifi, WifiOff, UserCheck, Loader } from 'lucide-react';

export default function MultiplayerLobby() {
  const { setGameState, category, difficulty } = useTriviaGame();
  const { translations } = useLanguage();
  const { 
    connect, 
    disconnect, 
    findMatch, 
    cancelMatchmaking, 
    challengePlayer, 
    respondToChallenge,
    isConnected, 
    onlinePlayers, 
    onlinePlayersCount,
    isSearchingMatch,
    matchmakingMode,
    currentRoom,
    pendingChallenge,
    connectionError
  } = useMultiplayer();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [showNameDialog, setShowNameDialog] = useState(true);

  // Initialize connection when component mounts
  useEffect(() => {
    if (!isConnected && playerName) {
      const playerData = {
        name: playerName,
        level: Math.floor(Math.random() * 50) + 1, // Random level for demo
        wins: Math.floor(Math.random() * 100),     // Random wins for demo
        country: 'US' // Default country
      };
      connect(playerData);
    }

    return () => {
      // Don't disconnect here as we want to maintain connection
      // disconnect();
    };
  }, [playerName, isConnected, connect]);

  // Navigate to game when room is found
  useEffect(() => {
    if (currentRoom) {
      setGameState('playing'); // Navigate to multiplayer game
    }
  }, [currentRoom, setGameState]);

  // Handle quick match
  const handleQuickMatch = (mode: '1v1' | '2v2') => {
    if (!isConnected) {
      alert('Not connected to server. Please refresh and try again.');
      return;
    }
    findMatch(mode, category, difficulty);
  };

  // Handle player name submission
  const handleJoinMultiplayer = () => {
    if (playerName.trim()) {
      setShowNameDialog(false);
    }
  };

  // Handle challenge response
  const handleChallengeResponse = (accepted: boolean) => {
    respondToChallenge(accepted);
  };

  // Filter players based on search
  const filteredPlayers = onlinePlayers.filter(player =>
    player.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Name Input Dialog */}
      <Dialog open={showNameDialog} onOpenChange={() => {}}>
        <DialogContent className="bg-black/90 border-gray-600 text-white">
          <DialogHeader>
            <DialogTitle>Join Multiplayer</DialogTitle>
            <DialogDescription>
              Enter your player name to join the multiplayer lobby
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Enter your player name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="bg-gray-800 border-gray-600 text-white"
              onKeyPress={(e) => e.key === 'Enter' && handleJoinMultiplayer()}
            />
            <Button 
              onClick={handleJoinMultiplayer}
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={!playerName.trim()}
            >
              Join Multiplayer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Challenge Dialog */}
      {pendingChallenge && (
        <Dialog open={!!pendingChallenge} onOpenChange={() => {}}>
          <DialogContent className="bg-black/90 border-gray-600 text-white">
            <DialogHeader>
              <DialogTitle>Challenge Received!</DialogTitle>
              <DialogDescription>
                {pendingChallenge.from.name} challenged you to a {pendingChallenge.mode} match
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3">
              <Button 
                onClick={() => handleChallengeResponse(true)}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Accept
              </Button>
              <Button 
                onClick={() => handleChallengeResponse(false)}
                variant="outline"
                className="flex-1 border-gray-600 text-white hover:bg-white/10"
              >
                Decline
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-4xl space-y-6">
        {/* Header */}
        <Card className="bg-black/90 border-gray-600 text-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    disconnect(); // Disconnect when leaving
                    setGameState('menu');
                  }}
                  className="text-white hover:bg-white/10"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-6 w-6 text-blue-400" />
                  {translations.multiplayer}
                </CardTitle>
              </div>
              
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <Badge className="bg-green-600">
                    <Wifi className="h-4 w-4 mr-1" />
                    {translations.online}
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <WifiOff className="h-4 w-4 mr-1" />
                    {connectionError ? 'Connection Error' : translations.offline}
                  </Badge>
                )}
                <Badge variant="outline" className="border-blue-500 text-blue-400">
                  {onlinePlayersCount} {translations.playersOnline}
                </Badge>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Panel - Game Modes */}
          <Card className="bg-black/90 border-gray-600 text-white">
            <CardHeader>
              <CardTitle>{translations.gameModes}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Quick Match 1v1 */}
              <Button
                onClick={() => handleQuickMatch('1v1')}
                disabled={isSearchingMatch || !isConnected}
                className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <div className="text-center">
                  <div className="text-lg font-bold">1 vs 1</div>
                  <div className="text-sm opacity-80">{translations.quickMatch}</div>
                </div>
              </Button>

              {/* Quick Match 2v2 */}
              <Button
                onClick={() => handleQuickMatch('2v2')}
                disabled={isSearchingMatch || !isConnected}
                className="w-full h-16 bg-purple-600 hover:bg-purple-700 text-white"
              >
                <div className="text-center">
                  <div className="text-lg font-bold">2 vs 2</div>
                  <div className="text-sm opacity-80">{translations.teamMatch}</div>
                </div>
              </Button>

              {/* Search for Player */}
              <div className="space-y-2">
                <label className="text-sm text-gray-300">{translations.findPlayer}</label>
                <div className="flex gap-2">
                  <Input
                    placeholder={translations.enterPlayerName}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    disabled={!isConnected}
                  />
                  <Button 
                    variant="outline"
                    className="border-gray-600 text-white hover:bg-white/10"
                    disabled={!isConnected}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Searching State */}
              {isSearchingMatch && (
                <Card className="bg-yellow-900/50 border-yellow-600 p-4">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-2"></div>
                    <div className="text-yellow-200">
                      {translations.searchingForOpponent}...
                    </div>
                    <div className="text-sm text-yellow-300 mt-1">
                      {matchmakingMode} {translations.mode}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={cancelMatchmaking}
                      className="mt-3 border-yellow-600 text-yellow-200 hover:bg-yellow-800/20"
                    >
                      {translations.cancel}
                    </Button>
                  </div>
                </Card>
              )}
            </CardContent>
          </Card>

          {/* Right Panel - Online Players */}
          <Card className="bg-black/90 border-gray-600 text-white">
            <CardHeader>
              <CardTitle>{translations.onlinePlayers}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {filteredPlayers.map((player) => (
                  <Card key={player.id} className="bg-gray-800 border-gray-700 p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-blue-600 text-white">
                            {player.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold flex items-center gap-2">
                            {player.name}
                            {player.level > 25 && (
                              <Crown className="h-4 w-4 text-yellow-400" />
                            )}
                          </div>
                          <div className="text-sm text-gray-400">
                            {translations.level} {player.level} • {player.wins} {translations.wins}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="border-gray-600">
                          {player.country}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-blue-600 text-blue-400 hover:bg-blue-900/20"
                          disabled={!isConnected}
                          onClick={() => challengePlayer(player.id, '1v1')}
                        >
                          {translations.challenge}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {!isConnected && (
                <div className="text-center py-8 text-gray-400">
                  <WifiOff className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <div>{translations.offlineMessage}</div>
                </div>
              )}

              {isConnected && filteredPlayers.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <UserCheck className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <div>No other players online</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Connection Status */}
        {!isConnected && (
          <Card className="bg-red-900/30 border-red-600">
            <CardContent className="p-4">
              <div className="text-red-200 text-sm text-center">
                {connectionError ? `Connection Error: ${connectionError}` : 'Connecting to multiplayer server...'}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
    </>
  );
}
