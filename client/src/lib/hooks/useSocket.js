import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

// Custom hook for Socket.io connection management  
export function useSocket(serverUrl = window.location.origin) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    // Create socket connection
    const newSocket = io(serverUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      forceNew: true
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('Connected to server:', newSocket.id);
      setIsConnected(true);
      setConnectionError(null);
      reconnectAttempts.current = 0;
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason);
      setIsConnected(false);
      
      if (reason === 'io server disconnect') {
        // Server disconnected the socket, need manual reconnection
        newSocket.connect();
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setConnectionError(error.message);
      reconnectAttempts.current++;
      
      if (reconnectAttempts.current >= maxReconnectAttempts) {
        setConnectionError('Unable to connect to server. Please check your internet connection.');
      }
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('Reconnected after', attemptNumber, 'attempts');
      setIsConnected(true);
      setConnectionError(null);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('Failed to reconnect to server');
      setConnectionError('Failed to reconnect to server');
    });

    // Global events
    newSocket.on('onlineCount', (count) => {
      setOnlineCount(count);
    });

    newSocket.on('playersOnline', (count) => {
      setOnlineCount(count);
    });

    // Error handling
    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
      setConnectionError(error.message);
    });

    // Heartbeat to keep connection alive
    const heartbeat = setInterval(() => {
      if (newSocket.connected) {
        newSocket.emit('ping');
      }
    }, 30000); // Ping every 30 seconds

    newSocket.on('pong', () => {
      // Server responded to heartbeat
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      clearInterval(heartbeat);
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [serverUrl]);

  // Socket helper functions
  const emit = (event, data) => {
    if (socket && isConnected) {
      socket.emit(event, data);
      return true;
    }
    console.warn('Cannot emit event: socket not connected');
    return false;
  };

  const on = (event, handler) => {
    if (socket) {
      socket.on(event, handler);
      return () => socket.off(event, handler);
    }
    return () => {};
  };

  const off = (event, handler) => {
    if (socket) {
      socket.off(event, handler);
    }
  };

  const connect = () => {
    if (socket && !isConnected) {
      socket.connect();
    }
  };

  const disconnect = () => {
    if (socket && isConnected) {
      socket.disconnect();
    }
  };

  return {
    socket,
    isConnected,
    connectionError,
    onlineCount,
    emit,
    on,
    off,
    connect,
    disconnect
  };
}

// Hook for multiplayer game state
export function useMultiplayerGame() {
  const { socket, isConnected, emit, on, off } = useSocket();
  const [gameState, setGameState] = useState('idle'); // idle, queue, room, playing, ended
  const [room, setRoom] = useState(null);
  const [opponents, setOpponents] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [scores, setScores] = useState({});
  const [gameMode, setGameMode] = useState(null);

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Queue events
    const unsubscribeQueueJoined = on('queueJoined', (data) => {
      setGameState('queue');
      console.log('Joined queue:', data);
    });

    const unsubscribeQueueLeft = on('queueLeft', () => {
      setGameState('idle');
      setGameMode(null);
    });

    const unsubscribeMatchFound = on('matchFound', (data) => {
      setGameState('matchFound');
      setOpponents(data.opponents);
      setRoom(data.roomId);
      console.log('Match found:', data);
    });

    // Room events
    const unsubscribeRoomCreated = on('privateRoomCreated', (data) => {
      setGameState('room');
      setRoom(data.roomId);
      console.log('Room created:', data);
    });

    const unsubscribeJoinedRoom = on('joinedPrivateRoom', (data) => {
      setGameState('room');
      setRoom(data.roomId);
      setOpponents(data.players.filter(p => p.username !== 'You'));
      console.log('Joined room:', data);
    });

    // Game events
    const unsubscribeGameStarted = on('gameStarted', (data) => {
      setGameState('playing');
      setCurrentQuestion(data.firstQuestion);
      setScores(data.teams ? { team1: 0, team2: 0 } : {});
      console.log('Game started:', data);
    });

    const unsubscribeNextQuestion = on('nextQuestion', (data) => {
      setCurrentQuestion(data.question);
      setScores(data.currentScores);
    });

    const unsubscribeAnswerResult = on('answerResult', (data) => {
      setScores(data.currentScores);
    });

    const unsubscribeGameEnded = on('gameEnded', (data) => {
      setGameState('ended');
      setScores(data.finalScores);
      console.log('Game ended:', data);
    });

    // Error events
    const unsubscribeGameLimit = on('gameLimit', (data) => {
      console.warn('Game limit reached:', data);
    });

    const unsubscribeJoinRoomError = on('joinRoomError', (data) => {
      console.error('Join room error:', data);
    });

    return () => {
      unsubscribeQueueJoined();
      unsubscribeQueueLeft();
      unsubscribeMatchFound();
      unsubscribeRoomCreated();
      unsubscribeJoinedRoom();
      unsubscribeGameStarted();
      unsubscribeNextQuestion();
      unsubscribeAnswerResult();
      unsubscribeGameEnded();
      unsubscribeGameLimit();
      unsubscribeJoinRoomError();
    };
  }, [socket, isConnected, on]);

  // Action functions
  const joinQueue = (mode, playerData) => {
    setGameMode(mode);
    return emit('joinQueue', { gameMode: mode, playerData });
  };

  const leaveQueue = () => {
    return emit('leaveQueue', { gameMode });
  };

  const createPrivateRoom = (mode, playerData) => {
    setGameMode(mode);
    return emit('createPrivateRoom', { gameMode: mode, playerData });
  };

  const joinPrivateRoom = (roomCode, playerData) => {
    return emit('joinPrivateRoom', { roomCode, playerData });
  };

  const submitAnswer = (answerIndex) => {
    if (room) {
      return emit('answerSubmit', { roomId: room, answerIndex, timestamp: Date.now() });
    }
    return false;
  };

  const requestNextQuestion = () => {
    if (room) {
      return emit('requestNextQuestion', { roomId: room });
    }
    return false;
  };

  const leaveGame = () => {
    setGameState('idle');
    setRoom(null);
    setOpponents([]);
    setCurrentQuestion(null);
    setScores({});
    setGameMode(null);
  };

  return {
    socket,
    isConnected,
    gameState,
    room,
    opponents,
    currentQuestion,
    scores,
    gameMode,
    joinQueue,
    leaveQueue,
    createPrivateRoom,
    joinPrivateRoom,
    submitAnswer,
    requestNextQuestion,
    leaveGame
  };
}