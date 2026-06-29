import React, { useState } from 'react';
import { Tile } from './Tile/Tile';
import './Hand.css';

export function Hand({ tiles, onTileClick, selectedTileId = null, disabled = false }) {
  // Sort tiles for display
  const sortedTiles = [...tiles].sort((a, b) => {
    const suitOrder = { characters: 1, bamboo: 2, dots: 3, winds: 4, dragons: 5 };
    if (suitOrder[a.suit] !== suitOrder[b.suit]) {
      return suitOrder[a.suit] - suitOrder[b.suit];
    }
    if (typeof a.value === 'number' && typeof b.value === 'number') {
      return a.value - b.value;
    }
    return String(a.value).localeCompare(String(b.value));
  });
  
  return (
    <div className="hand">
      {sortedTiles.map(tile => (
        <Tile
          key={tile.id}
          tile={tile}
          onClick={() => onTileClick(tile)}
          selected={selectedTileId === tile.id}
          disabled={disabled}
        />
      ))}
    </div>
  );
}

