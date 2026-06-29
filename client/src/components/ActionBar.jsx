import React from 'react';
import { ACTION_TYPES } from '../../../shared/constants.js';
import './ActionBar.css';

export function ActionBar({ 
  isMyTurn, 
  canClaim, 
  selectedTile,
  hasDrawn = false,
  mustDiscard = false,
  onDraw, 
  onDiscard, 
  onClaimPong, 
  onClaimChow, 
  onPass,
  onDeclareWin 
}) {
  if (canClaim) {
    return (
      <div className="action-bar claim-actions">
        <div className="action-bar-title">You can claim the discarded tile!</div>
        <div className="action-buttons">
          {canClaim.actions.includes(ACTION_TYPES.CLAIM_PONG) && (
            <button className="btn btn-primary" onClick={onClaimPong}>
              Claim Pong
            </button>
          )}
          {canClaim.actions.includes(ACTION_TYPES.CLAIM_CHOW) && (
            <button className="btn btn-primary" onClick={onClaimChow}>
              Claim Chow
            </button>
          )}
          <button className="btn btn-secondary" onClick={onPass}>
            Pass
          </button>
        </div>
      </div>
    );
  }
  
  if (!isMyTurn) {
    return (
      <div className="action-bar">
        <div className="action-bar-message">Waiting for your turn...</div>
      </div>
    );
  }
  
  // Disable draw if already drawn this turn
  const canDraw = !hasDrawn && !mustDiscard;
  // Can only discard if must discard (after draw or claim)
  const canDiscardNow = mustDiscard && selectedTile;
  // Can declare win only after drawing
  const canDeclareWin = (hasDrawn || mustDiscard) && !canClaim;
  
  return (
    <div className="action-bar">
      <div className="action-buttons">
        <button 
          className="btn btn-primary" 
          onClick={onDraw}
          disabled={!canDraw}
        >
          Draw Tile
        </button>
        <button 
          className="btn btn-secondary" 
          onClick={onDiscard}
          disabled={!canDiscardNow}
        >
          Discard Selected
        </button>
        <button 
          className="btn btn-success" 
          onClick={onDeclareWin}
          disabled={!canDeclareWin}
        >
          Declare Win
        </button>
      </div>
      {mustDiscard && !selectedTile && (
        <div className="action-bar-message">Select a tile to discard</div>
      )}
    </div>
  );
}

