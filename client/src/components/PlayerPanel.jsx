import React from 'react';
import './PlayerPanel.css';

export function PlayerPanel({ player, position, isCurrentTurn, isMe, melds = [], discards = [] }) {
  if (!player) {
    return (
      <div className="player-panel empty">
        <div className="player-name">Empty Seat</div>
        <div className="player-position">{position.toUpperCase()}</div>
      </div>
    );
  }
  
  return (
    <div className={`player-panel ${isCurrentTurn ? 'current-turn' : ''} ${isMe ? 'me' : ''}`}>
      <div className="player-header">
        <div className="player-name">{player.name}</div>
        <div className="player-position">{position.toUpperCase()}</div>
      </div>
      {melds.length > 0 && (
        <div className="player-melds">
          Melds: {melds.length}
        </div>
      )}
      {discards.length > 0 && (
        <div className="player-discards-count">
          Discards: {discards.length}
        </div>
      )}
    </div>
  );
}



