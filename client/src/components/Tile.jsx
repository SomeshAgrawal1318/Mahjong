import React from 'react';
import './Tile.css';

export function Tile({ tile, onClick, selected = false, disabled = false, size = 'normal' }) {
  if (!tile) return null;
  
  const getTileDisplay = () => {
    if (tile.suit === 'winds') {
      const windMap = { east: '東', south: '南', west: '西', north: '北' };
      return windMap[tile.value] || tile.value;
    }
    if (tile.suit === 'dragons') {
      const dragonMap = { red: '中', green: '發', white: '白' };
      return dragonMap[tile.value] || tile.value;
    }
    return tile.value;
  };
  
  const getSuitClass = () => {
    if (tile.suit === 'characters') return 'tile-characters';
    if (tile.suit === 'bamboo') return 'tile-bamboo';
    if (tile.suit === 'dots') return 'tile-dots';
    if (tile.suit === 'winds') return 'tile-winds';
    if (tile.suit === 'dragons') return 'tile-dragons';
    return '';
  };
  
  return (
    <div
      className={`tile ${getSuitClass()} ${size} ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
      onClick={disabled ? undefined : onClick}
    >
      <div className="tile-content">
        <div className="tile-value">{getTileDisplay()}</div>
        {tile.suit !== 'winds' && tile.suit !== 'dragons' && (
          <div className="tile-suit">{tile.suit[0].toUpperCase()}</div>
        )}
      </div>
    </div>
  );
}



