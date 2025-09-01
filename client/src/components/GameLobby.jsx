import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../lib/stores/useAuth';
import { useLanguage } from '../lib/stores/useLanguage';
import { useTriviaGame } from '../lib/stores/useTriviaGame';
import { useSocket } from '../lib/hooks/useSocket';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { 
  ArrowLeft, 
  Users, 
  Crown, 
  Clock, 
  Copy,
  Share,
  Loader2,
  Swords,
  UserPlus,
  Trophy,
  Zap
} from 'lucide-react';

// Game Lobby component with mode selection and waiting animations
export default function GameLobby() {
  const { user, isAuthenticated } = useAuth();
  const { translations, language } = useLanguage();
  const { setGameState } = useTriviaGame();
  const { socket, isConnected } = useSocket();
  
  // Lobby state
  const [selectedMode, setSelectedMode] = useState(null);
  const [lobbyState, setLobbyState] = useState('modeSelection'); // modeSelection, queue, privateRoom, inGame
  const [queuePosition, setQueuePosition] = useState(0);
  const [estimatedWait, setEstimatedWait] = useState(0);
  const [roomCode, setRoomCode] = useState('');
  const [privateRoomCode, setPrivateRoomCode] = useState('');
  const [roomPlayers, setRoomPlayers] = useState([]);
  const [gameLimit, setGameLimit] = useState(null);
  const [matchFoundData, setMatchFoundData] = useState(null);

  // Game modes configuration
  const gameModes = [
    {
      id: '1vs1',
      title: '1 vs 1 Battle',
      description: 'Face off against one opponent in a direct knowledge duel',
      icon: Swords,
      color: 'from-red-500 to-red-600',
      maxPlayers: 2,
      rewards: '+15 coins for win, +5 for participation'
    },
    {
      id: '2vs2',
      title: '2 vs 2 Team Battle',
      description: 'Team up with a partner to defeat another duo',
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      maxPlayers: 4,
      rewards: '+20 coins for win, +8 for participation'
    }
  ];

  // Socket event listeners
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Queue events
    socket.on('queueJoined', (data) => {
      setQueuePosition(data.position);
      setEstimatedWait(data.estimatedWait);
      setLobbyState('queue');
    });

    socket.on('queueLeft', () => {
      setLobbyState('modeSelection');
      setQueuePosition(0);
      setEstimatedWait(0);
    });

    // Match found
    socket.on('matchFound', (data) => {
      setMatchFoundData(data);
      setLobbyState('matchFound');
    });

    // Private room events
    socket.on('privateRoomCreated', (data) => {
      setPrivateRoomCode(data.roomCode);
      setRoomPlayers([{
        username: user?.username || 'You',
        rank: user?.rank || 'Bronze',
        premium: user?.premium || false,
        isHost: true
      }]);
      setLobbyState('privateRoom');
    });

    socket.on('joinedPrivateRoom', (data) => {
      setRoomPlayers(data.players);
      setLobbyState('privateRoom');
    });

    socket.on('playerJoined', (data) => {
      setRoomPlayers(prev => [...prev, data.player]);
    });

    socket.on('playerLeft', (data) => {
      setRoomPlayers(prev => prev.filter(p => p.username !== data.username));
    });

    // Game events
    socket.on('gameStarted', (data) => {
      setGameState('playing');
    });

    // Error and limit events
    socket.on('gameLimit', (data) => {
      setGameLimit(data);
    });

    socket.on('joinRoomError', (data) => {
      alert(data.message); // Replace with toast notification
    });

    return () => {
      // Cleanup listeners
      socket.off('queueJoined');
      socket.off('queueLeft');
      socket.off('matchFound');
      socket.off('privateRoomCreated');
      socket.off('joinedPrivateRoom');
      socket.off('playerJoined');
      socket.off('playerLeft');
      socket.off('gameStarted');
      socket.off('gameLimit');
      socket.off('joinRoomError');
    };
  }, [socket, isConnected, user, setGameState]);

  // Handle mode selection
  const handleModeSelect = (mode) => {
    if (!isAuthenticated) {
      alert('Please login to play multiplayer games');
      return;
    }

    if (!isConnected) {
      alert('Not connected to server. Please try again.');
      return;
    }

    setSelectedMode(mode);
  };

  // Join matchmaking queue
  const joinQueue = () => {
    if (!socket || !selectedMode) return;

    socket.emit('joinQueue', {
      gameMode: selectedMode.id,
      playerData: {
        username: user?.username,
        rank: user?.rank,
        coins: user?.coins,
        premium: user?.premium
      }
    });
  };

  // Leave queue
  const leaveQueue = () => {
    if (!socket || !selectedMode) return;

    socket.emit('leaveQueue', { gameMode: selectedMode.id });
  };

  // Create private room
  const createPrivateRoom = () => {
    if (!socket || !selectedMode) return;

    socket.emit('createPrivateRoom', {
      gameMode: selectedMode.id,
      playerData: {
        username: user?.username,
        rank: user?.rank,
        coins: user?.coins,
        premium: user?.premium
      }
    });
  };

  // Join private room
  const joinPrivateRoom = () => {
    if (!socket || !roomCode.trim()) return;

    socket.emit('joinPrivateRoom', {
      roomCode: roomCode.trim().toUpperCase(),
      playerData: {
        username: user?.username,
        rank: user?.rank,
        coins: user?.coins,
        premium: user?.premium
      }
    });
  };

  // Copy room code to clipboard
  const copyRoomCode = () => {
    navigator.clipboard.writeText(privateRoomCode);
    // Show success toast
  };

  // Animation variants
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

  const pulseVariants = {
    pulse: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 overflow-y-auto" style={{ height: '100vh' }}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-md mx-auto space-y-4 pb-32"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setGameState('home')}
            className="text-primary hover:bg-primary/10"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-primary">Multiplayer</h1>
            <p className="text-sm text-muted-foreground">
              {isConnected ? `${123} players online` : 'Connecting...'}
            </p>
          </div>
        </motion.div>

        {/* Game Limit Warning */}
        <AnimatePresence>
          {gameLimit && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="border-yellow-500/30 bg-yellow-500/10">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-yellow-500" />
                    <div className="flex-1">
                      <p className="font-medium text-yellow-700 dark:text-yellow-300">
                        Daily Limit Reached
                      </p>
                      <p className="text-sm text-yellow-600 dark:text-yellow-400">
                        {gameLimit.message}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mode Selection */}
        {lobbyState === 'modeSelection' && (
          <motion.div variants={itemVariants} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  Choose Game Mode
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {gameModes.map((mode) => {
                  const IconComponent = mode.icon;
                  const isSelected = selectedMode?.id === mode.id;
                  
                  return (
                    <motion.div
                      key={mode.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`border rounded-lg overflow-hidden cursor-pointer transition-all ${
                        isSelected ? 'border-primary border-2 bg-primary/5' : 'border-border'
                      }`}
                      onClick={() => handleModeSelect(mode)}
                    >
                      <div className={`h-1 bg-gradient-to-r ${mode.color}`} />
                      
                      <div className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${mode.color} flex items-center justify-center`}>
                            <IconComponent className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold">{mode.title}</h3>
                            <p className="text-sm text-muted-foreground">{mode.description}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {mode.maxPlayers} players
                          </Badge>
                        </div>
                        
                        <div className="text-xs text-green-600 dark:text-green-400">
                          💰 {mode.rewards}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Action buttons */}
            {selectedMode && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <Button
                  onClick={joinQueue}
                  className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white border-0 h-12"
                  disabled={!isConnected}
                >
                  <Zap className="h-5 w-5 mr-2" />
                  Quick Match
                </Button>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={createPrivateRoom}
                    variant="outline"
                    className="border-primary/30 hover:bg-primary/10"
                    disabled={!isConnected}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create Room
                  </Button>
                  
                  <div className="space-y-2">
                    <Input
                      placeholder="Room Code"
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                      className="text-center text-lg font-mono"
                      maxLength={6}
                    />
                    <Button
                      onClick={joinPrivateRoom}
                      variant="outline"
                      className="w-full border-primary/30 hover:bg-primary/10"
                      disabled={!isConnected || !roomCode.trim()}
                    >
                      Join Room
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Queue State */}
        {lobbyState === 'queue' && (
          <motion.div
            variants={itemVariants}
            className="space-y-4"
          >
            <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
              <CardContent className="p-6 text-center">
                <motion.div
                  variants={pulseVariants}
                  animate="pulse"
                  className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center"
                >
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </motion.div>
                
                <h3 className="text-lg font-semibold mb-2">Finding Opponents...</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {selectedMode?.title} • {queuePosition} in queue
                </p>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Estimated wait:</span>
                    <span className="font-medium">{estimatedWait}s</span>
                  </div>
                  
                  <div className="w-full bg-muted/30 rounded-full h-2">
                    <motion.div
                      className="bg-gradient-to-r from-primary to-accent h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, ((30 - estimatedWait) / 30) * 100)}%` }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                </div>
                
                <Button
                  onClick={leaveQueue}
                  variant="outline"
                  className="mt-4 border-red-500/30 text-red-500 hover:bg-red-500/10"
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Private Room State */}
        {lobbyState === 'privateRoom' && (
          <motion.div variants={itemVariants} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Private Room</span>
                  <Badge variant="outline">{selectedMode?.title}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Room code */}
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Room Code</p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-2xl font-mono font-bold tracking-wider">
                      {privateRoomCode}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={copyRoomCode}
                      className="text-primary hover:bg-primary/10"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Players list */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    Players ({roomPlayers.length}/{selectedMode?.maxPlayers})
                  </p>
                  
                  {roomPlayers.map((player, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted/20 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-sm font-medium">
                            {player.username[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{player.username}</p>
                          <p className="text-xs text-muted-foreground">{player.rank}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {player.premium && <Crown className="h-4 w-4 text-yellow-500" />}
                        {player.isHost && (
                          <Badge variant="secondary" className="text-xs">Host</Badge>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Empty slots */}
                  {Array.from({ length: selectedMode?.maxPlayers - roomPlayers.length }).map((_, index) => (
                    <div
                      key={`empty-${index}`}
                      className="flex items-center justify-center p-3 border-2 border-dashed border-muted rounded-lg"
                    >
                      <span className="text-sm text-muted-foreground">Waiting for player...</span>
                    </div>
                  ))}
                </div>

                {/* Share button */}
                <Button
                  variant="outline"
                  className="w-full border-primary/30 hover:bg-primary/10"
                  onClick={() => {
                    // Share room code
                    navigator.share?.({
                      title: 'Join my trivia game!',
                      text: `Use code ${privateRoomCode} to join my ${selectedMode?.title} game`,
                    });
                  }}
                >
                  <Share className="h-4 w-4 mr-2" />
                  Invite Friends
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Match Found State */}
        {lobbyState === 'matchFound' && matchFoundData && (
          <motion.div
            variants={itemVariants}
            className="space-y-4"
          >
            <Card className="bg-gradient-to-r from-green-500/10 to-green-600/10 border-green-500/20">
              <CardContent className="p-6 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 15, stiffness: 300 }}
                  className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center"
                >
                  <Trophy className="h-8 w-8 text-green-500" />
                </motion.div>
                
                <h3 className="text-lg font-semibold mb-2 text-green-700 dark:text-green-300">
                  Match Found!
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Starting {selectedMode?.title} in 3 seconds...
                </p>
                
                {/* Opponent list */}
                <div className="space-y-2">
                  {matchFoundData.opponents.map((opponent, index) => (
                    <div key={index} className="flex items-center justify-center gap-2 text-sm">
                      <span className="font-medium">{opponent.username}</span>
                      <Badge variant="outline" className="text-xs">{opponent.rank}</Badge>
                      {opponent.premium && <Crown className="h-3 w-3 text-yellow-500" />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Connection status */}
        {!isConnected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-red-500 text-sm"
          >
            Connecting to server...
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}