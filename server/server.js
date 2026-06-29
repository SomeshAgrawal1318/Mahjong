import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { createRoomState, startGame, drawTile, discardTile, applyClaim, passClaim, declareWin } from './gameEngine.js';
import { SOCKET_EVENTS, ACTION_TYPES, POSITION_ORDER } from '../shared/constants.js';

const app = express();
app.use(cors());
app.use(express.json());

// Health check / landing route so the host doesn't 404 on the root URL.
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'mahjong-server', rooms: rooms.size });
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// In-memory room storage
const rooms = new Map();
const playerRooms = new Map(); // socketId -> roomCode

// Generate room code
function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Get available seat
function getAvailableSeat(roomState) {
  for (const position of POSITION_ORDER) {
    if (!roomState.seats[position]) {
      return position;
    }
  }
  return null;
}

// Broadcast state to all players in room
function broadcastState(roomCode, event = SOCKET_EVENTS.STATE_UPDATE) {
  const roomState = rooms.get(roomCode);
  if (!roomState) return;
  
  // Create sanitized state (don't send other players' hands)
  const sanitizedState = {
    ...roomState,
    gameState: roomState.gameState ? {
      ...roomState.gameState,
      hands: Object.keys(roomState.gameState.hands).reduce((acc, playerId) => {
        acc[playerId] = roomState.gameState.hands[playerId].map(t => ({
          suit: t.suit,
          value: t.value,
          id: t.id
        }));
        return acc;
      }, {})
    } : null
  };
  
  io.to(roomCode).emit(event, sanitizedState);
}

// Send notification
function sendNotification(roomCode, message, type = 'info') {
  io.to(roomCode).emit(SOCKET_EVENTS.NOTIFICATION, { message, type });
}

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Create room
  socket.on(SOCKET_EVENTS.ROOM_CREATE, ({ playerName }) => {
    try {
      const roomCode = generateRoomCode();
      const roomState = createRoomState(roomCode, socket.id);
      
      roomState.players[socket.id] = {
        id: socket.id,
        name: playerName || `Player ${socket.id.substring(0, 6)}`,
        position: POSITION_ORDER[0]
      };
      
      roomState.seats[POSITION_ORDER[0]] = socket.id;
      
      rooms.set(roomCode, roomState);
      playerRooms.set(socket.id, roomCode);
      socket.join(roomCode);
      
      socket.emit(SOCKET_EVENTS.ROOM_CREATED, { roomCode, roomState });
      broadcastState(roomCode);
      
      console.log(`Room created: ${roomCode} by ${socket.id}`);
    } catch (error) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: error.message });
    }
  });
  
  // Join room
  socket.on(SOCKET_EVENTS.ROOM_JOIN, ({ roomCode, playerName }) => {
    try {
      const roomState = rooms.get(roomCode);
      
      if (!roomState) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: 'Room not found' });
        return;
      }
      
      if (roomState.phase !== 'LOBBY') {
        socket.emit(SOCKET_EVENTS.ERROR, { message: 'Game already in progress' });
        return;
      }
      
      if (Object.keys(roomState.players).length >= 4) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: 'Room is full' });
        return;
      }
      
      const seat = getAvailableSeat(roomState);
      if (!seat) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: 'No available seats' });
        return;
      }
      
      roomState.players[socket.id] = {
        id: socket.id,
        name: playerName || `Player ${socket.id.substring(0, 6)}`,
        position: seat
      };
      
      roomState.seats[seat] = socket.id;
      playerRooms.set(socket.id, roomCode);
      socket.join(roomCode);
      
      socket.emit(SOCKET_EVENTS.ROOM_JOINED, { roomCode, roomState });
      broadcastState(roomCode);
      sendNotification(roomCode, `${roomState.players[socket.id].name} joined the room`);
      
      console.log(`Player ${socket.id} joined room ${roomCode}`);
    } catch (error) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: error.message });
    }
  });
  
  // Leave room
  socket.on(SOCKET_EVENTS.ROOM_LEAVE, () => {
    const roomCode = playerRooms.get(socket.id);
    if (!roomCode) return;
    
    const roomState = rooms.get(roomCode);
    if (!roomState) return;
    
    // Remove player
    const player = roomState.players[socket.id];
    if (player) {
      const position = player.position;
      roomState.seats[position] = null;
      delete roomState.players[socket.id];
      
      sendNotification(roomCode, `${player.name} left the room`);
      
      // If host left and game not started, assign new host
      if (roomState.hostId === socket.id && roomState.phase === 'LOBBY') {
        const remainingPlayers = Object.keys(roomState.players);
        if (remainingPlayers.length > 0) {
          roomState.hostId = remainingPlayers[0];
        }
      }
    }
    
    playerRooms.delete(socket.id);
    socket.leave(roomCode);
    broadcastState(roomCode);
    
    // Clean up empty rooms
    if (Object.keys(roomState.players).length === 0) {
      rooms.delete(roomCode);
    }
  });
  
  // Request state (for reconnection)
  socket.on(SOCKET_EVENTS.STATE_REQUEST, () => {
    const roomCode = playerRooms.get(socket.id);
    if (roomCode) {
      const roomState = rooms.get(roomCode);
      if (roomState) {
        socket.emit(SOCKET_EVENTS.STATE_UPDATE, roomState);
      }
    }
  });
  
  // Start game
  socket.on(SOCKET_EVENTS.GAME_START, () => {
    const roomCode = playerRooms.get(socket.id);
    if (!roomCode) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: 'Not in a room' });
      return;
    }
    
    const roomState = rooms.get(roomCode);
    if (!roomState) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: 'Room not found' });
      return;
    }
    
    if (roomState.hostId !== socket.id) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: 'Only host can start the game' });
      return;
    }
    
    if (Object.keys(roomState.players).length !== 4) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: 'Need 4 players to start' });
      return;
    }
    
    try {
      startGame(roomState);
      broadcastState(roomCode, SOCKET_EVENTS.GAME_STARTED);
      sendNotification(roomCode, 'Game started!');
      console.log(`Game started in room ${roomCode}`);
    } catch (error) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: error.message });
    }
  });
  
  // Game action
  socket.on(SOCKET_EVENTS.GAME_ACTION, ({ type, tileId, meldTiles }) => {
    const roomCode = playerRooms.get(socket.id);
    if (!roomCode) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: 'Not in a room' });
      return;
    }
    
    const roomState = rooms.get(roomCode);
    if (!roomState || !roomState.gameState) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: 'Game not started' });
      return;
    }
    
    try {
      let updatedState;
      let notificationMessage = '';
      
      switch (type) {
        case ACTION_TYPES.DRAW:
          updatedState = drawTile(roomState, socket.id);
          if (updatedState.winner) {
            notificationMessage = `${roomState.players[socket.id].name} wins!`;
            sendNotification(roomCode, notificationMessage, 'success');
          }
          break;
          
        case ACTION_TYPES.DISCARD:
          updatedState = discardTile(roomState, socket.id, tileId);
          notificationMessage = `${roomState.players[socket.id].name} discarded a tile`;
          sendNotification(roomCode, notificationMessage);
          break;
          
        case ACTION_TYPES.CLAIM_PONG:
          updatedState = applyClaim(roomState, socket.id, ACTION_TYPES.CLAIM_PONG);
          notificationMessage = `${roomState.players[socket.id].name} claimed Pong!`;
          sendNotification(roomCode, notificationMessage, 'success');
          break;
          
        case ACTION_TYPES.CLAIM_CHOW:
          updatedState = applyClaim(roomState, socket.id, ACTION_TYPES.CLAIM_CHOW);
          notificationMessage = `${roomState.players[socket.id].name} claimed Chow!`;
          sendNotification(roomCode, notificationMessage, 'success');
          break;
          
        case ACTION_TYPES.PASS:
          updatedState = passClaim(roomState, socket.id);
          break;
          
        case ACTION_TYPES.DECLARE_WIN:
          updatedState = declareWin(roomState, socket.id);
          notificationMessage = `${roomState.players[socket.id].name} wins!`;
          sendNotification(roomCode, notificationMessage, 'success');
          break;
          
        default:
          socket.emit(SOCKET_EVENTS.ERROR, { message: 'Invalid action type' });
          return;
      }
      
      rooms.set(roomCode, updatedState);
      broadcastState(roomCode);
      
    } catch (error) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: error.message });
    }
  });
  
  // Disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    const roomCode = playerRooms.get(socket.id);
    if (roomCode) {
      const roomState = rooms.get(roomCode);
      if (roomState) {
        const player = roomState.players[socket.id];
        if (player) {
          const position = player.position;
          roomState.seats[position] = null;
          delete roomState.players[socket.id];
          
          sendNotification(roomCode, `${player.name} disconnected`);
          
          if (roomState.hostId === socket.id && roomState.phase === 'LOBBY') {
            const remainingPlayers = Object.keys(roomState.players);
            if (remainingPlayers.length > 0) {
              roomState.hostId = remainingPlayers[0];
            }
          }
        }
      }
      
      playerRooms.delete(socket.id);
      broadcastState(roomCode);
    }
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});



