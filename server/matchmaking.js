// Multiplayer matchmaking system with Socket.io
// Handles 1vs1 and 2vs2 game modes with queue management and room creation

// Import OpenAI functionality (will create server-side version)
async function generateQuestions(category, difficulty, count) {
  // This will be implemented on the server side to protect API keys
  // For now, return fallback questions
  const fallbackQuestions = [
    {
      question: "What is the largest planet in our solar system?",
      options: ["Earth", "Jupiter", "Saturn", "Mars"],
      correctAnswer: 1,
      category: "General Knowledge",
      difficulty,
      explanation: "Jupiter is the largest planet in our solar system.",
      timeLimit: 30,
      points: difficulty === 'easy' ? 10 : difficulty === 'medium' ? 20 : 30
    },
    {
      question: "Which element has the chemical symbol 'O'?",
      options: ["Gold", "Silver", "Oxygen", "Iron"],
      correctAnswer: 2,
      category: "Science",
      difficulty,
      explanation: "Oxygen has the chemical symbol 'O'.",
      timeLimit: 30,
      points: difficulty === 'easy' ? 10 : difficulty === 'medium' ? 20 : 30
    },
    {
      question: "In which year did World War II end?",
      options: ["1944", "1945", "1946", "1947"],
      correctAnswer: 1,
      category: "History",
      difficulty,
      explanation: "World War II ended in 1945.",
      timeLimit: 30,
      points: difficulty === 'easy' ? 10 : difficulty === 'medium' ? 20 : 30
    },
    {
      question: "What is the capital of Australia?",
      options: ["Sydney", "Melbourne", "Canberra", "Perth"],
      correctAnswer: 2,
      category: "Geography",
      difficulty,
      explanation: "Canberra is the capital city of Australia.",
      timeLimit: 30,
      points: difficulty === 'easy' ? 10 : difficulty === 'medium' ? 20 : 30
    },
    {
      question: "How many players are on a basketball team on the court at one time?",
      options: ["4", "5", "6", "7"],
      correctAnswer: 1,
      category: "Sports",
      difficulty,
      explanation: "Each basketball team has 5 players on the court at one time.",
      timeLimit: 30,
      points: difficulty === 'easy' ? 10 : difficulty === 'medium' ? 20 : 30
    }
  ];

  const result = [];
  for (let i = 0; i < count; i++) {
    const questionIndex = i % fallbackQuestions.length;
    result.push({
      ...fallbackQuestions[questionIndex],
      id: `mp_${i}`,
    });
  }

  return result;
}

class MatchmakingService {
  constructor() {
    // Queue system for different game modes
    this.queues = {
      '1vs1': [],
      '2vs2': []
    };
    
    // Active game rooms
    this.rooms = new Map();
    
    // Player game limits tracking
    this.playerLimits = new Map();
    
    // Room code system for friend invites
    this.inviteCodes = new Map();
  }

  // Join matchmaking queue
  joinQueue(socket, gameMode, playerData) {
    const player = {
      id: socket.id,
      socket: socket,
      username: playerData.username || `Player${socket.id.slice(0, 6)}`,
      rank: playerData.rank || 'Bronze',
      coins: playerData.coins || 0,
      premium: playerData.premium || false,
      joinedAt: Date.now()
    };

    // Check daily game limits (5 free games, unlimited premium)
    if (!this.checkGameLimit(player)) {
      socket.emit('gameLimit', {
        message: 'Daily game limit reached. Upgrade to premium for unlimited games.',
        gamesPlayed: this.getGamesPlayedToday(player.id),
        limit: player.premium ? 'unlimited' : 5
      });
      return false;
    }

    // Add to appropriate queue
    this.queues[gameMode].push(player);
    
    console.log(`Player ${player.username} joined ${gameMode} queue. Queue size: ${this.queues[gameMode].length}`);
    
    // Notify player they're in queue
    socket.emit('queueJoined', {
      gameMode,
      position: this.queues[gameMode].length,
      estimatedWait: this.calculateWaitTime(gameMode)
    });

    // Try to create a match
    this.tryCreateMatch(gameMode);
    
    return true;
  }

  // Leave matchmaking queue
  leaveQueue(socket, gameMode) {
    if (this.queues[gameMode]) {
      this.queues[gameMode] = this.queues[gameMode].filter(p => p.id !== socket.id);
      socket.emit('queueLeft', { gameMode });
      console.log(`Player ${socket.id} left ${gameMode} queue`);
    }
  }

  // Create game room with invite code
  createPrivateRoom(socket, gameMode, playerData) {
    const roomCode = this.generateRoomCode();
    const roomId = `private_${roomCode}`;
    
    const player = {
      id: socket.id,
      socket: socket,
      username: playerData.username || `Player${socket.id.slice(0, 6)}`,
      rank: playerData.rank || 'Bronze',
      coins: playerData.coins || 0,
      premium: playerData.premium || false,
      isHost: true
    };

    const room = {
      id: roomId,
      code: roomCode,
      gameMode,
      players: [player],
      maxPlayers: gameMode === '1vs1' ? 2 : 4,
      isPrivate: true,
      createdAt: Date.now(),
      status: 'waiting'
    };

    this.rooms.set(roomId, room);
    this.inviteCodes.set(roomCode, roomId);
    
    socket.join(roomId);
    socket.emit('privateRoomCreated', {
      roomCode,
      roomId,
      gameMode,
      maxPlayers: room.maxPlayers
    });

    console.log(`Private room created: ${roomCode} for ${gameMode}`);
    return roomCode;
  }

  // Join game room with invite code
  joinPrivateRoom(socket, roomCode, playerData) {
    const roomId = this.inviteCodes.get(roomCode);
    if (!roomId) {
      socket.emit('joinRoomError', { message: 'Invalid room code' });
      return false;
    }

    const room = this.rooms.get(roomId);
    if (!room) {
      socket.emit('joinRoomError', { message: 'Room not found' });
      return false;
    }

    if (room.players.length >= room.maxPlayers) {
      socket.emit('joinRoomError', { message: 'Room is full' });
      return false;
    }

    if (room.status !== 'waiting') {
      socket.emit('joinRoomError', { message: 'Game already in progress' });
      return false;
    }

    const player = {
      id: socket.id,
      socket: socket,
      username: playerData.username || `Player${socket.id.slice(0, 6)}`,
      rank: playerData.rank || 'Bronze',
      coins: playerData.coins || 0,
      premium: playerData.premium || false,
      isHost: false
    };

    room.players.push(player);
    socket.join(roomId);

    // Notify all players in room
    socket.to(roomId).emit('playerJoined', {
      player: {
        username: player.username,
        rank: player.rank,
        premium: player.premium
      },
      playerCount: room.players.length,
      maxPlayers: room.maxPlayers
    });

    socket.emit('joinedPrivateRoom', {
      roomId,
      gameMode: room.gameMode,
      players: room.players.map(p => ({
        username: p.username,
        rank: p.rank,
        premium: p.premium,
        isHost: p.isHost
      })),
      playerCount: room.players.length,
      maxPlayers: room.maxPlayers
    });

    // Start game if room is full
    if (room.players.length === room.maxPlayers) {
      this.startGame(roomId);
    }

    return true;
  }

  // Try to create a match from queue
  async tryCreateMatch(gameMode) {
    const requiredPlayers = gameMode === '1vs1' ? 2 : 4;
    
    if (this.queues[gameMode].length >= requiredPlayers) {
      // Get players for the match
      const players = this.queues[gameMode].splice(0, requiredPlayers);
      
      // Create room
      const roomId = `match_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const room = {
        id: roomId,
        gameMode,
        players,
        maxPlayers: requiredPlayers,
        isPrivate: false,
        createdAt: Date.now(),
        status: 'starting',
        currentQuestion: 0,
        questions: [],
        scores: gameMode === '1vs1' 
          ? { [players[0].id]: 0, [players[1].id]: 0 }
          : { team1: 0, team2: 0 },
        teams: gameMode === '2vs2' 
          ? { team1: [players[0], players[1]], team2: [players[2], players[3]] }
          : null
      };

      this.rooms.set(roomId, room);

      // Add players to room
      players.forEach(player => {
        player.socket.join(roomId);
      });

      // Notify players of match found
      players.forEach(player => {
        player.socket.emit('matchFound', {
          roomId,
          gameMode,
          opponents: players
            .filter(p => p.id !== player.id)
            .map(p => ({
              username: p.username,
              rank: p.rank,
              premium: p.premium
            })),
          teams: room.teams ? this.getPlayerTeam(player.id, room.teams) : null
        });
      });

      console.log(`Match created: ${roomId} for ${gameMode} with ${players.length} players`);
      
      // Start the game after a short delay
      setTimeout(() => {
        this.startGame(roomId);
      }, 3000);
    }
  }

  // Start game in room
  async startGame(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    try {
      // Generate questions directly without HTTP request
      const questionCount = room.gameMode === '1vs1' ? 10 : 15;
      
      // Use direct fallback questions for multiplayer games
      // This ensures quick game start without API delays
      const questions = await generateQuestions('general', 'medium', questionCount);
      
      room.questions = questions;
      room.status = 'playing';
      room.gameStartTime = Date.now();
      room.currentQuestionStartTime = Date.now();

      // Increment game count for players
      room.players.forEach(player => {
        this.incrementGameCount(player.id);
      });

      // Send game start event to all players
      room.players.forEach(player => {
        player.socket.emit('gameStarted', {
          roomId,
          gameMode: room.gameMode,
          totalQuestions: questions.length,
          teams: room.teams,
          currentQuestion: questions[0],
          questionIndex: 0,
          players: room.players.map(p => ({
            id: p.id,
            username: p.username,
            rank: p.rank,
            premium: p.premium
          }))
        });
      });

      console.log(`Game started in room: ${roomId}`);
      
      // Start question timer
      this.startQuestionTimer(roomId);
      
    } catch (error) {
      console.error('Error starting game:', error);
      room.players.forEach(player => {
        player.socket.emit('gameError', { message: 'Failed to start game' });
      });
    }
  }

  // Handle answer submission
  handleAnswerSubmission(socket, roomId, answerData) {
    const room = this.rooms.get(roomId);
    if (!room || room.status !== 'playing') return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;

    const currentQuestion = room.questions[room.currentQuestion];
    if (!currentQuestion) return;

    // Calculate score
    const timeBonus = Math.max(0, 30 - (Date.now() - room.currentQuestionStartTime) / 1000);
    const isCorrect = answerData.answerIndex === currentQuestion.correctAnswer;
    const points = isCorrect ? Math.floor(10 + timeBonus) : -5;

    // Update scores
    if (room.gameMode === '1vs1') {
      room.scores[player.id] = (room.scores[player.id] || 0) + points;
    } else {
      // 2vs2 mode
      const team = this.getPlayerTeam(player.id, room.teams);
      if (team) {
        room.scores[team] = (room.scores[team] || 0) + points;
      }
    }

    // Store player answer
    if (!room.answers) room.answers = {};
    if (!room.answers[room.currentQuestion]) room.answers[room.currentQuestion] = {};
    room.answers[room.currentQuestion][player.id] = {
      answerIndex: answerData.answerIndex,
      isCorrect,
      points,
      submittedAt: Date.now()
    };

    // Notify player of result
    socket.emit('answerResult', {
      isCorrect,
      points,
      correctAnswer: currentQuestion.correctAnswer,
      explanation: currentQuestion.explanation,
      currentScores: room.scores
    });

    // Check if all players have answered
    const expectedAnswers = room.players.length;
    const actualAnswers = Object.keys(room.answers[room.currentQuestion] || {}).length;
    
    if (actualAnswers === expectedAnswers) {
      this.nextQuestion(roomId);
    }
  }

  // Move to next question or end game
  nextQuestion(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.currentQuestion++;
    
    if (room.currentQuestion >= room.questions.length) {
      this.endGame(roomId);
      return;
    }

    // Send next question
    const nextQuestion = room.questions[room.currentQuestion];
    room.currentQuestionStartTime = Date.now();

    room.players.forEach(player => {
      player.socket.emit('nextQuestion', {
        questionNumber: room.currentQuestion + 1,
        totalQuestions: room.questions.length,
        question: nextQuestion,
        currentScores: room.scores
      });
    });

    // Start timer for next question
    this.startQuestionTimer(roomId);
  }

  // End game and show results
  endGame(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.status = 'ended';
    
    // Calculate final results
    let winner;
    if (room.gameMode === '1vs1') {
      const [player1, player2] = room.players;
      const score1 = room.scores[player1.id] || 0;
      const score2 = room.scores[player2.id] || 0;
      
      if (score1 > score2) {
        winner = { type: 'player', data: player1 };
      } else if (score2 > score1) {
        winner = { type: 'player', data: player2 };
      } else {
        winner = { type: 'tie' };
      }
    } else {
      // 2vs2 mode
      const team1Score = room.scores.team1 || 0;
      const team2Score = room.scores.team2 || 0;
      
      if (team1Score > team2Score) {
        winner = { type: 'team', data: 'team1' };
      } else if (team2Score > team1Score) {
        winner = { type: 'team', data: 'team2' };
      } else {
        winner = { type: 'tie' };
      }
    }

    // Send results to all players
    room.players.forEach(player => {
      player.socket.emit('gameEnded', {
        winner,
        finalScores: room.scores,
        playerStats: this.calculatePlayerStats(player.id, room),
        gameMode: room.gameMode,
        teams: room.teams
      });
      
      // Leave room
      player.socket.leave(roomId);
    });

    console.log(`Game ended in room: ${roomId}`, winner);
    
    // Clean up room after delay
    setTimeout(() => {
      this.rooms.delete(roomId);
      if (room.code) {
        this.inviteCodes.delete(room.code);
      }
    }, 30000);
  }

  // Start question timer
  startQuestionTimer(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    // Clear any existing timer
    if (room.questionTimer) {
      clearTimeout(room.questionTimer);
    }

    room.questionTimer = setTimeout(() => {
      // Time's up - move to next question
      room.players.forEach(player => {
        player.socket.emit('timeUp', {
          correctAnswer: room.questions[room.currentQuestion].correctAnswer,
          currentScores: room.scores
        });
      });
      
      setTimeout(() => {
        this.nextQuestion(roomId);
      }, 2000);
    }, 30000); // 30 seconds per question
  }

  // Handle player disconnect
  handleDisconnect(socket) {
    // Remove from all queues
    Object.keys(this.queues).forEach(gameMode => {
      this.queues[gameMode] = this.queues[gameMode].filter(p => p.id !== socket.id);
    });

    // Handle room disconnections
    this.rooms.forEach((room, roomId) => {
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1) {
        const player = room.players[playerIndex];
        
        if (room.status === 'waiting') {
          // Remove player from waiting room
          room.players.splice(playerIndex, 1);
          
          // Notify other players
          room.players.forEach(p => {
            p.socket.emit('playerLeft', {
              username: player.username,
              playerCount: room.players.length,
              maxPlayers: room.maxPlayers
            });
          });
          
          // Clean up empty rooms
          if (room.players.length === 0) {
            this.rooms.delete(roomId);
            if (room.code) {
              this.inviteCodes.delete(room.code);
            }
          }
        } else if (room.status === 'playing') {
          // Player disconnected during game
          room.players.forEach(p => {
            if (p.id !== socket.id) {
              p.socket.emit('playerDisconnected', {
                username: player.username,
                canContinue: room.players.length > 2
              });
            }
          });
          
          // End game if not enough players
          if (room.players.length <= 1) {
            this.endGame(roomId);
          }
        }
      }
    });

    console.log(`Player ${socket.id} disconnected`);
  }

  // Utility functions
  generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  calculateWaitTime(gameMode) {
    const queueLength = this.queues[gameMode].length;
    const requiredPlayers = gameMode === '1vs1' ? 2 : 4;
    return Math.max(0, (requiredPlayers - queueLength) * 15); // Estimate 15s per missing player
  }

  getPlayerTeam(playerId, teams) {
    if (!teams) return null;
    
    if (teams.team1.some(p => p.id === playerId)) return 'team1';
    if (teams.team2.some(p => p.id === playerId)) return 'team2';
    return null;
  }

  calculatePlayerStats(playerId, room) {
    let correctAnswers = 0;
    let totalAnswers = 0;
    let totalPoints = 0;

    if (room.answers) {
      Object.values(room.answers).forEach(questionAnswers => {
        if (questionAnswers[playerId]) {
          totalAnswers++;
          if (questionAnswers[playerId].isCorrect) {
            correctAnswers++;
          }
          totalPoints += questionAnswers[playerId].points;
        }
      });
    }

    return {
      correctAnswers,
      totalAnswers,
      accuracy: totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0,
      totalPoints
    };
  }

  // Game limit management
  checkGameLimit(player) {
    if (player.premium) return true; // Unlimited for premium
    
    const today = new Date().toDateString();
    const playerKey = `${player.id}_${today}`;
    const gamesPlayed = this.playerLimits.get(playerKey) || 0;
    
    return gamesPlayed < 5;
  }

  getGamesPlayedToday(playerId) {
    const today = new Date().toDateString();
    const playerKey = `${playerId}_${today}`;
    return this.playerLimits.get(playerKey) || 0;
  }

  incrementGameCount(playerId) {
    const today = new Date().toDateString();
    const playerKey = `${playerId}_${today}`;
    const current = this.playerLimits.get(playerKey) || 0;
    this.playerLimits.set(playerKey, current + 1);
  }

  // Get current room info
  getRoomInfo(roomId) {
    return this.rooms.get(roomId);
  }

  // Get queue status
  getQueueStatus() {
    return {
      '1vs1': this.queues['1vs1'].length,
      '2vs2': this.queues['2vs2'].length,
      activeRooms: this.rooms.size
    };
  }
}

export default MatchmakingService;