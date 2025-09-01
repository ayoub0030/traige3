import { Server as SocketIOServer } from 'socket.io';
import MatchmakingService from './matchmaking.js';

// Initialize matchmaking service
const matchmaking = new MatchmakingService();

export function setupMultiplayer(io: SocketIOServer) {
  console.log('Setting up multiplayer functionality...');
  
  io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);
    
    // Send online players count
    socket.emit('playersOnline', io.engine.clientsCount);
    io.emit('onlineCount', io.engine.clientsCount);
    
    // Matchmaking events
    socket.on('joinQueue', (data) => {
      const success = matchmaking.joinQueue(socket, data.gameMode, data.playerData);
      if (success) {
        console.log(`Player ${data.playerData?.username || socket.id} joined ${data.gameMode} queue`);
      }
    });
    
    socket.on('leaveQueue', (data) => {
      matchmaking.leaveQueue(socket, data.gameMode);
    });
    
    // Private room events
    socket.on('createPrivateRoom', (data) => {
      const roomCode = matchmaking.createPrivateRoom(socket, data.gameMode, data.playerData);
      console.log(`Private room created with code: ${roomCode}`);
    });
    
    socket.on('joinPrivateRoom', (data) => {
      const success = matchmaking.joinPrivateRoom(socket, data.roomCode, data.playerData);
      if (success) {
        console.log(`Player joined private room: ${data.roomCode}`);
      }
    });
    
    // Game events
    socket.on('answerSubmit', (data) => {
      matchmaking.handleAnswerSubmission(socket, data.roomId, data);
    });
    
    socket.on('requestNextQuestion', (data) => {
      // Handle explicit next question requests
      const room = matchmaking.getRoomInfo(data.roomId);
      if (room && room.status === 'playing') {
        matchmaking.nextQuestion(data.roomId);
      }
    });
    
    socket.on('requestRoomInfo', (data) => {
      const room = matchmaking.getRoomInfo(data.roomId);
      if (room) {
        socket.emit('roomInfo', {
          roomId: data.roomId,
          gameMode: room.gameMode,
          players: room.players.map(p => ({
            username: p.username,
            rank: p.rank,
            premium: p.premium
          })),
          status: room.status,
          currentQuestion: room.currentQuestion,
          scores: room.scores
        });
      }
    });
    
    // Admin/debug events
    socket.on('getQueueStatus', () => {
      socket.emit('queueStatus', matchmaking.getQueueStatus());
    });
    
    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Player disconnected:', socket.id);
      matchmaking.handleDisconnect(socket);
      
      // Update online count
      io.emit('onlineCount', io.engine.clientsCount - 1);
    });
    
    // Heartbeat to keep connection alive
    socket.on('ping', () => {
      socket.emit('pong');
    });
  });
  
  console.log('Multiplayer functionality setup complete');
}