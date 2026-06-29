import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { Hand } from '../components/Hand';
import { DiscardPile } from '../components/DiscardPile';
import { PlayerPanel } from '../components/PlayerPanel';
import { ActionBar } from '../components/ActionBar';
import { Tile } from '../components/Tile/Tile';
import { ACTION_TYPES, POSITION_ORDER } from '../../../shared/constants.js';
import './Game.css';

export function Game() {
  const {
    roomState,
    getMyHand,
    getMyPosition,
    isMyTurn,
    canClaim,
    hasDrawn,
    mustDiscard,
    gameAction,
    leaveRoom
  } = useGameStore();
  
  const [selectedTileId, setSelectedTileId] = useState(null);
  
  if (!roomState?.gameState) {
    return <div>Loading game...</div>;
  }
  
  const myHand = getMyHand();
  const myPosition = getMyPosition();
  const myTurn = isMyTurn();
  const claimInfo = canClaim();
  const playerHasDrawn = hasDrawn();
  const playerMustDiscard = mustDiscard();
  
  const handleDraw = () => {
    gameAction({ type: ACTION_TYPES.DRAW });
    setSelectedTileId(null);
  };
  
  const handleDiscard = () => {
    if (!selectedTileId) return;
    gameAction({ type: ACTION_TYPES.DISCARD, tileId: selectedTileId });
    setSelectedTileId(null);
  };
  
  const handleClaimPong = () => {
    gameAction({ type: ACTION_TYPES.CLAIM_PONG });
    setSelectedTileId(null);
  };
  
  const handleClaimChow = () => {
    gameAction({ type: ACTION_TYPES.CLAIM_CHOW });
    setSelectedTileId(null);
  };
  
  const handlePass = () => {
    gameAction({ type: ACTION_TYPES.PASS });
    setSelectedTileId(null);
  };
  
  const handleDeclareWin = () => {
    gameAction({ type: ACTION_TYPES.DECLARE_WIN });
  };
  
  const getPlayerAtPosition = (position) => {
    const playerId = roomState.seats[position];
    if (!playerId) return null;
    return roomState.players[playerId];
  };
  
  const getPlayerDiscards = (position) => {
    return roomState.gameState.discards[position] || [];
  };
  
  const getPlayerMelds = (position) => {
    return roomState.gameState.melds[position] || [];
  };
  
  // Find my position index to determine layout
  const myIndex = POSITION_ORDER.indexOf(myPosition);
  const positions = [
    POSITION_ORDER[(myIndex + 2) % 4], // Top (opposite)
    POSITION_ORDER[(myIndex + 1) % 4], // Right
    POSITION_ORDER[(myIndex + 3) % 4], // Left
  ];
  
  return (
    <div className="game">
      <div className="game-header">
        <h2>Room: {roomState.roomCode}</h2>
        <div className="game-info">
          <span>Wall: {roomState.gameState.wall.length} tiles</span>
          <button className="btn btn-secondary btn-small" onClick={leaveRoom}>
            Leave
          </button>
        </div>
      </div>
      
      {roomState.phase === 'ROUND_END' && roomState.winner && (
        <div className="game-winner">
          <h1>🎉 {roomState.players[roomState.winner]?.name} Wins! 🎉</h1>
        </div>
      )}
      
      <div className="game-table">
        {/* Top player */}
        <div className="game-player-top">
          {positions[0] && (
            <>
              <PlayerPanel
                player={getPlayerAtPosition(positions[0])}
                position={positions[0]}
                isCurrentTurn={roomState.gameState.currentPlayer === roomState.seats[positions[0]]}
                melds={getPlayerMelds(positions[0])}
              />
              <DiscardPile tiles={getPlayerDiscards(positions[0])} />
            </>
          )}
        </div>
        
        {/* Middle row: left and right players */}
        <div className="game-middle">
          <div className="game-player-side">
            {positions[2] && (
              <>
                <PlayerPanel
                  player={getPlayerAtPosition(positions[2])}
                  position={positions[2]}
                  isCurrentTurn={roomState.gameState.currentPlayer === roomState.seats[positions[2]]}
                  melds={getPlayerMelds(positions[2])}
                />
                <DiscardPile tiles={getPlayerDiscards(positions[2])} />
              </>
            )}
          </div>
          
          <div className="game-center">
            {roomState.gameState.lastDiscard && (
              <div className="last-discard">
                <div className="last-discard-label">Last Discard</div>
                <div className="last-discard-tile-wrapper">
                  <Tile 
                    tile={roomState.gameState.lastDiscard} 
                    size="normal"
                    disabled
                  />
                </div>
              </div>
            )}
          </div>
          
          <div className="game-player-side">
            {positions[1] && (
              <>
                <PlayerPanel
                  player={getPlayerAtPosition(positions[1])}
                  position={positions[1]}
                  isCurrentTurn={roomState.gameState.currentPlayer === roomState.seats[positions[1]]}
                  melds={getPlayerMelds(positions[1])}
                />
                <DiscardPile tiles={getPlayerDiscards(positions[1])} />
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* My hand and actions */}
      <div className="game-bottom">
        <div className="my-hand-section">
          <div className="my-hand-label">Your Hand ({myHand.length} tiles)</div>
          <Hand
            tiles={myHand}
            onTileClick={(tile) => setSelectedTileId(tile.id)}
            selectedTileId={selectedTileId}
            disabled={!myTurn && !claimInfo}
          />
        </div>
        
        <ActionBar
          isMyTurn={myTurn}
          canClaim={claimInfo}
          selectedTile={selectedTileId}
          hasDrawn={playerHasDrawn}
          mustDiscard={playerMustDiscard}
          onDraw={handleDraw}
          onDiscard={handleDiscard}
          onClaimPong={handleClaimPong}
          onClaimChow={handleClaimChow}
          onPass={handlePass}
          onDeclareWin={handleDeclareWin}
        />
      </div>
    </div>
  );
}

