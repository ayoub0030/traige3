import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { io, Socket } from "socket.io-client";

// Types for multiplayer
export interface MultiplayerPlayer {
  id: string;
  name: string;
  level: number;
  wins: number;
  country: string;
  score?: number;
  streak?: number;
  isReady?: boolean;
}

export interface GameRoom {
  id: string;
  mode: '1v1' | '2v2';
  status: 'waiting' | 'in_progress' | 'completed';
  players: MultiplayerPlayer[];
  currentQuestion?: any;
  questionIndex: number;
  totalQuestions: number;
  timeRemaining: number;
}

export interface Challenge {
  from: MultiplayerPlayer;
  mode: '1v1' | '2v2';
}

interface MultiplayerState {
  // Connection state
  socket: Socket | null;
  isConnected: boolean;
  connectionError: string | null;
  
  // Player state
  currentPlayer: MultiplayerPlayer | null;
  onlinePlayers: MultiplayerPlayer[];
  onlinePlayersCount: number;
  
  // Matchmaking state
  isSearchingMatch: boolean;
  matchmakingMode: '1v1' | '2v2' | null;
  
  // Game room state
  currentRoom: GameRoom | null;
  gameStarted: boolean;
  
  // Challenge state
  pendingChallenge: Challenge | null;
  
  // Round results
  roundResults: any | null;
  gameResults: any | null;
  
  // Actions
  connect: (playerData: { name: string; level: number; wins: number; country: string }) => void;
  disconnect: () => void;
  findMatch: (mode: '1v1' | '2v2', category: string, difficulty: string) => void;
  cancelMatchmaking: () => void;
  challengePlayer: (targetPlayerId: string, mode: '1v1' | '2v2') => void;
  respondToChallenge: (accepted: boolean) => void;
  setPlayerReady: () => void;
  submitAnswer: (answer: number, timeSpent: number) => void;
  
  // State setters
  setOnlinePlayers: (players: MultiplayerPlayer[]) => void;
  setCurrentRoom: (room: GameRoom | null) => void;
  setPendingChallenge: (challenge: Challenge | null) => void;
  setRoundResults: (results: any) => void;
  setGameResults: (results: any) => void;
}

export const useMultiplayer = create<MultiplayerState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    socket: null,
    isConnected: false,
    connectionError: null,
    
    currentPlayer: null,
    onlinePlayers: [],
    onlinePlayersCount: 0,
    
    isSearchingMatch: false,
    matchmakingMode: null,
    
    currentRoom: null,
    gameStarted: false,
    
    pendingChallenge: null,
    roundResults: null,
    gameResults: null,
    
    // Actions
    connect: (playerData) => {
      const state = get();
      
      if (state.socket) {
        state.socket.disconnect();
      }
      
      const socket = io('/', {
        transports: ['websocket', 'polling'],
        autoConnect: true
      });
      
      // Connection events
      socket.on('connect', () => {
        console.log('Connected to multiplayer server');
        set({ isConnected: true, connectionError: null });
        
        // Join multiplayer system
        socket.emit('join_multiplayer', playerData);
      });
      
      socket.on('disconnect', () => {
        console.log('Disconnected from multiplayer server');
        set({ 
          isConnected: false, 
          currentRoom: null,
          gameStarted: false,
          isSearchingMatch: false,
          matchmakingMode: null,
          roundResults: null,
          gameResults: null
        });
      });
      
      socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        set({ connectionError: error.message, isConnected: false });
      });
      
      // Player events
      socket.on('player_joined', (data) => {
        const player: MultiplayerPlayer = {
          id: data.playerId,
          ...playerData
        };
        set({ currentPlayer: player });
        console.log('Joined multiplayer as:', player);
      });
      
      socket.on('online_players', (players: MultiplayerPlayer[]) => {
        set({ onlinePlayers: players, onlinePlayersCount: players.length });
      });
      
      socket.on('player_online', (data) => {
        const currentPlayers = get().onlinePlayers;
        set({ 
          onlinePlayers: [...currentPlayers, data.player],
          onlinePlayersCount: currentPlayers.length + 1
        });
      });
      
      socket.on('player_offline', (data) => {
        const currentPlayers = get().onlinePlayers;
        const filteredPlayers = currentPlayers.filter(p => p.id !== data.playerId);
        set({ 
          onlinePlayers: filteredPlayers,
          onlinePlayersCount: filteredPlayers.length
        });
      });
      
      socket.on('online_players_count', (count: number) => {
        set({ onlinePlayersCount: count });
      });
      
      // Matchmaking events
      socket.on('searching_for_match', (data) => {
        set({ isSearchingMatch: true, matchmakingMode: data.mode });
      });
      
      // Listen for matchFound event (consistent with server)
      socket.on('matchFound', (data) => {
        const room: GameRoom = {
          id: data.roomId,
          mode: data.gameMode || '1v1',
          status: 'waiting',
          players: data.opponents || [],
          questionIndex: 0,
          totalQuestions: 0,
          timeRemaining: 30
        };
        
        set({ 
          currentRoom: room,
          isSearchingMatch: false,
          matchmakingMode: null
        });
        
        console.log('Match found! Room:', data.roomId);
      });
      
      socket.on('match_timeout', () => {
        set({ isSearchingMatch: false, matchmakingMode: null });
        console.log('Match search timed out');
      });
      
      socket.on('matchmaking_cancelled', () => {
        set({ isSearchingMatch: false, matchmakingMode: null });
      });
      
      // Challenge events
      socket.on('challenge_received', (data) => {
        set({ pendingChallenge: data });
      });
      
      socket.on('challenge_declined', () => {
        console.log('Challenge was declined');
        // Could show a notification here
      });
      
      // Game room events
      socket.on('player_ready_update', (data) => {
        const room = get().currentRoom;
        if (room) {
          // Update room state
          console.log('Player ready update:', data);
        }
      });
      
      socket.on('gameStarted', (data) => {
        const room: GameRoom = {
          id: get().currentRoom?.id || '',
          mode: get().currentRoom?.mode || '1v1',
          status: 'in_progress',
          players: data.players,
          currentQuestion: data.currentQuestion,
          questionIndex: data.questionIndex,
          totalQuestions: data.totalQuestions,
          timeRemaining: 30
        };
        
        set({ 
          currentRoom: room,
          gameStarted: true,
          roundResults: null,
          gameResults: null
        });
        
        console.log('Game started!', data);
      });
      
      socket.on('timer_update', (data) => {
        const room = get().currentRoom;
        if (room) {
          set({ currentRoom: { ...room, timeRemaining: data.timeRemaining } });
        }
      });
      
      socket.on('answer_submitted', (data) => {
        console.log('Answer submitted:', data);
      });
      
      socket.on('round_results', (data) => {
        set({ roundResults: data });
        console.log('Round results:', data);
      });
      
      socket.on('next_question', (data) => {
        const room = get().currentRoom;
        if (room) {
          const updatedRoom: GameRoom = {
            ...room,
            currentQuestion: data.currentQuestion,
            questionIndex: data.questionIndex,
            timeRemaining: 30
          };
          set({ currentRoom: updatedRoom, roundResults: null });
        }
      });
      
      socket.on('game_ended', (data) => {
        set({ 
          gameResults: data,
          gameStarted: false,
          roundResults: null
        });
        console.log('Game ended:', data);
      });
      
      socket.on('player_disconnected', (data) => {
        if (data.gameEnded) {
          set({ 
            currentRoom: null,
            gameStarted: false,
            roundResults: null,
            gameResults: null
          });
          console.log('Game ended due to player disconnect');
        }
      });
      
      socket.on('error', (error) => {
        console.error('Socket error:', error);
        set({ connectionError: error.message });
      });
      
      set({ socket });
    },
    
    disconnect: () => {
      const socket = get().socket;
      if (socket) {
        socket.disconnect();
        set({ 
          socket: null,
          isConnected: false,
          currentPlayer: null,
          onlinePlayers: [],
          currentRoom: null,
          gameStarted: false,
          isSearchingMatch: false,
          matchmakingMode: null,
          pendingChallenge: null,
          roundResults: null,
          gameResults: null
        });
      }
    },
    
    findMatch: (mode, category, difficulty) => {
      const socket = get().socket;
      if (socket && get().isConnected) {
        socket.emit('find_match', { mode, category, difficulty });
      }
    },
    
    cancelMatchmaking: () => {
      const socket = get().socket;
      if (socket) {
        socket.emit('cancel_matchmaking');
        set({ isSearchingMatch: false, matchmakingMode: null });
      }
    },
    
    challengePlayer: (targetPlayerId, mode) => {
      const socket = get().socket;
      if (socket) {
        socket.emit('challenge_player', { targetPlayerId, mode });
      }
    },
    
    respondToChallenge: (accepted) => {
      const socket = get().socket;
      const challenge = get().pendingChallenge;
      
      if (socket && challenge) {
        socket.emit('challenge_response', {
          challengerId: challenge.from.id,
          accepted,
          mode: challenge.mode
        });
        
        set({ pendingChallenge: null });
      }
    },
    
    setPlayerReady: () => {
      const socket = get().socket;
      const room = get().currentRoom;
      
      if (socket && room) {
        socket.emit('player_ready', { roomId: room.id });
      }
    },
    
    submitAnswer: (answer, timeSpent) => {
      const socket = get().socket;
      const room = get().currentRoom;
      
      if (socket && room) {
        socket.emit('submit_answer', {
          roomId: room.id,
          answer,
          timeSpent
        });
      }
    },
    
    // State setters
    setOnlinePlayers: (players) => set({ onlinePlayers: players }),
    setCurrentRoom: (room) => set({ currentRoom: room }),
    setPendingChallenge: (challenge) => set({ pendingChallenge: challenge }),
    setRoundResults: (results) => set({ roundResults: results }),
    setGameResults: (results) => set({ gameResults: results })
  }))
);