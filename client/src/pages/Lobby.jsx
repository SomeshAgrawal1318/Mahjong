import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import './Lobby.css';

export function Lobby() {
  const { createRoom, joinRoom, playerName, setPlayerName } = useGameStore();
  const [roomCode, setRoomCode] = useState('');
  const [showJoin, setShowJoin] = useState(false);
  
  const handleCreateRoom = () => {
    if (!playerName.trim()) {
      alert('Please enter your name');
      return;
    }
    createRoom(playerName);
  };
  
  const handleJoinRoom = () => {
    if (!playerName.trim()) {
      alert('Please enter your name');
      return;
    }
    if (!roomCode.trim()) {
      alert('Please enter a room code');
      return;
    }
    joinRoom(roomCode.toUpperCase(), playerName);
  };
  
  return (
    <div className="lobby">
      <div className="lobby-container">
        <h1 className="lobby-title">🀄 Mahjong</h1>
        <p className="lobby-subtitle">Multiplayer Online Mahjong</p>
        
        <div className="lobby-form">
          <input
            type="text"
            placeholder="Enter your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="lobby-input"
            maxLength={20}
          />
          
          {!showJoin ? (
            <div className="lobby-actions">
              <button className="btn btn-primary btn-large" onClick={handleCreateRoom}>
                Create Room
              </button>
              <button className="btn btn-secondary btn-large" onClick={() => setShowJoin(true)}>
                Join Room
              </button>
            </div>
          ) : (
            <div className="lobby-actions">
              <input
                type="text"
                placeholder="Enter room code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="lobby-input"
                maxLength={6}
                style={{ marginBottom: '12px' }}
              />
              <button className="btn btn-primary btn-large" onClick={handleJoinRoom}>
                Join
              </button>
              <button className="btn btn-secondary" onClick={() => setShowJoin(false)}>
                Back
              </button>
            </div>
          )}
        </div>
        
        <div className="lobby-info">
          <h3>How to Play</h3>
          <ul>
            <li>Create or join a room with 4 players</li>
            <li>Host can start the game when all players are ready</li>
            <li>Draw and discard tiles to form melds</li>
            <li>Win by forming 4 melds (chow/pong) + 1 pair</li>
            <li>Claim discarded tiles to form pongs or chows</li>
          </ul>
        </div>
      </div>
    </div>
  );
}



