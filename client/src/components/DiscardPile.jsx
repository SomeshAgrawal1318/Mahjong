import React from 'react';
import { Tile } from './Tile/Tile';
import './DiscardPile.css';

export function DiscardPile({ tiles, title }) {
  return (
    <div className="discard-pile">
      {title && <div className="discard-pile-title">{title}</div>}
      <div className="discard-pile-tiles">
        {tiles.map((tile, index) => (
          <Tile key={`${tile.id}-${index}`} tile={tile} size="small" disabled />
        ))}
      </div>
    </div>
  );
}

