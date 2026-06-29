import React from 'react';
import { useGameStore } from '../store/gameStore';
import { PlayerPanel } from '../components/PlayerPanel';
import { POSITION_ORDER } from '../../../shared/constants.js';
import './Room.css';

export function Room() {
  const { roomState, roomCode, startGame, leaveRoom, getMyPlayerId, getMyPosition } = useGameStore();
  const myId = getMyPlayerId();
  const isHost = roomState?.hostId === myId;
  const playerCount = Object.keys(roomState?.players || {}).length;
  const canStart = playerCount === 4 && isHost && roomState?.phase === 'LOBBY';
  
  const getPlayerAtPosition = (position) => {
    const playerId = roomState?.seats[position];
    if (!playerId) return null;
    return roomState?.players[playerId];
  };
  
  return (
    <div className="room">
      <div className="room-header">
        <div className="room-info">
          <h2>Room: {roomCode}</h2>
          <p>{playerCount} / 4 players</p>
        </div>
        <button className="btn btn-secondary" onClick={leaveRoom}>
          Leave Room
        </button>
      </div>
      
      <div className="room-seats">
        {POSITION_ORDER.map(position => {
          const player = getPlayerAtPosition(position);
          const isMe = player?.id === myId;
          
          return (
            <PlayerPanel
              key={position}
              player={player}
              position={position}
              isMe={isMe}
            />
          );
        })}
      </div>
      
      {canStart && (
        <div className="room-actions">
          <button className="btn btn-primary btn-large" onClick={startGame}>
            Start Game
          </button>
        </div>
      )}
      
      {!canStart && playerCount < 4 && (
        <div className="room-waiting">
          <p>Waiting for {4 - playerCount} more player{4 - playerCount > 1 ? 's' : ''}...</p>
        </div>
      )}
    </div>
  );
}



