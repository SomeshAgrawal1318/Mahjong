import { create } from 'zustand';
import { socketService } from '../services/socket';
import { SOCKET_EVENTS, ACTION_TYPES } from '../../../shared/constants.js';

export const useGameStore = create((set, get) => {
  // Initialize socket listeners
  const setupSocketListeners = () => {
    socketService.on(SOCKET_EVENTS.ROOM_CREATED, (data) => {
      set({ roomState: data.roomState, roomCode: data.roomCode });
    });

    socketService.on(SOCKET_EVENTS.ROOM_JOINED, (data) => {
      set({ roomState: data.roomState, roomCode: data.roomCode });
    });

    socketService.on(SOCKET_EVENTS.STATE_UPDATE, (roomState) => {
      set({ roomState });
    });

    socketService.on(SOCKET_EVENTS.GAME_STARTED, (roomState) => {
      set({ roomState });
    });

    socketService.on(SOCKET_EVENTS.NOTIFICATION, (notification) => {
      const { notifications } = get();
      const notificationId = Date.now() + Math.random(); // Ensure unique ID
      const newNotification = { ...notification, id: notificationId };
      
      // Limit to max 5 notifications, remove oldest first
      const currentNotifications = [...notifications];
      if (currentNotifications.length >= 5) {
        currentNotifications.shift(); // Remove oldest
      }
      
      const newNotifications = [...currentNotifications, newNotification];
      set({ notifications: newNotifications });
      
      // Auto-remove after 4 seconds
      setTimeout(() => {
        const current = get().notifications;
        set({ notifications: current.filter(n => n.id !== notificationId) });
      }, 4000);
    });

    socketService.on(SOCKET_EVENTS.ERROR, (error) => {
      const { notifications } = get();
      const notificationId = Date.now() + Math.random(); // Ensure unique ID
      const newNotification = { message: error.message, type: 'error', id: notificationId };
      
      // Limit to max 5 notifications, remove oldest first
      const currentNotifications = [...notifications];
      if (currentNotifications.length >= 5) {
        currentNotifications.shift(); // Remove oldest
      }
      
      const newNotifications = [...currentNotifications, newNotification];
      set({ notifications: newNotifications });
      
      // Auto-remove after 5 seconds (errors stay a bit longer)
      setTimeout(() => {
        const current = get().notifications;
        set({ notifications: current.filter(n => n.id !== notificationId) });
      }, 5000);
    });
  };

  // Initialize
  socketService.connect();
  setupSocketListeners();

  return {
    roomCode: null,
    roomState: null,
    playerName: '',
    notifications: [],
    
    setPlayerName: (name) => set({ playerName: name }),
    
    createRoom: (playerName) => {
      socketService.emit(SOCKET_EVENTS.ROOM_CREATE, { playerName });
    },
    
    joinRoom: (roomCode, playerName) => {
      socketService.emit(SOCKET_EVENTS.ROOM_JOIN, { roomCode, playerName });
    },
    
    leaveRoom: () => {
      socketService.emit(SOCKET_EVENTS.ROOM_LEAVE);
      set({ roomCode: null, roomState: null });
    },
    
    startGame: () => {
      socketService.emit(SOCKET_EVENTS.GAME_START);
    },
    
    gameAction: (action) => {
      socketService.emit(SOCKET_EVENTS.GAME_ACTION, action);
    },
    
    getMyPlayerId: () => {
      return socketService.getSocketId();
    },
    
    getMyHand: () => {
      const { roomState } = get();
      if (!roomState?.gameState) return [];
      const myId = socketService.getSocketId();
      return roomState.gameState.hands[myId] || [];
    },
    
    getMyPosition: () => {
      const { roomState } = get();
      if (!roomState) return null;
      const myId = socketService.getSocketId();
      const player = roomState.players[myId];
      return player?.position || null;
    },
    
    isMyTurn: () => {
      const { roomState } = get();
      if (!roomState?.gameState) return false;
      const myId = socketService.getSocketId();
      return roomState.gameState.currentPlayer === myId;
    },
    
    canClaim: () => {
      const { roomState } = get();
      if (!roomState?.gameState?.canClaim) return null;
      const myId = socketService.getSocketId();
      if (roomState.gameState.canClaim.playerId === myId) {
        return roomState.gameState.canClaim;
      }
      return null;
    },
    
    hasDrawn: () => {
      const { roomState } = get();
      if (!roomState?.gameState) return false;
      const myId = socketService.getSocketId();
      return roomState.gameState.currentPlayer === myId && roomState.gameState.hasDrawn === true;
    },
    
    mustDiscard: () => {
      const { roomState } = get();
      if (!roomState?.gameState) return false;
      const myId = socketService.getSocketId();
      return roomState.gameState.currentPlayer === myId && roomState.gameState.mustDiscard === true;
    },
    
    removeNotification: (id) => {
      const { notifications } = get();
      set({ notifications: notifications.filter(n => n.id !== id) });
    }
  };
});

