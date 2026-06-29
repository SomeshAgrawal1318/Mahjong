import React from 'react';
import './Tile.css';

// SVG-based tile rendering for authentic Mahjong appearance
function TileSVG({ tile, size = 'normal' }) {
  const isSmall = size === 'small';
  const width = isSmall ? 35 : 50;
  const height = isSmall ? 50 : 70;
  
  // Get tile content
  const getTileContent = () => {
    if (tile.suit === 'winds') {
      const windMap = { 
        east: '東', 
        south: '南', 
        west: '西', 
        north: '北' 
      };
      return { symbol: windMap[tile.value] || tile.value, isNumber: false };
    }
    if (tile.suit === 'dragons') {
      const dragonMap = { 
        red: '中', 
        green: '發', 
        white: '白' 
      };
      return { symbol: dragonMap[tile.value] || tile.value, isNumber: false };
    }
    // Number tiles
    const numberMap = {
      1: '一', 2: '二', 3: '三', 4: '四', 5: '五',
      6: '六', 7: '七', 8: '八', 9: '九'
    };
    return { 
      symbol: numberMap[tile.value] || tile.value, 
      isNumber: true,
      number: tile.value 
    };
  };
  
  const content = getTileContent();
  const fontSize = isSmall ? 18 : 26;
  const numberSize = isSmall ? 8 : 10;
  
  // Get suit color
  const getSuitColor = () => {
    if (tile.suit === 'characters') return '#c41e3a'; // Red
    if (tile.suit === 'bamboo') return '#228b22'; // Green
    if (tile.suit === 'dots') return '#1e3a8a'; // Blue
    if (tile.suit === 'winds') return '#1a1a1a'; // Black
    if (tile.suit === 'dragons') {
      if (tile.value === 'red') return '#c41e3a';
      if (tile.value === 'green') return '#228b22';
      return '#2c2c2c'; // White dragon
    }
    return '#1a1a1a';
  };
  
  const suitColor = getSuitColor();
  
  const gradientId = `tile-gradient-${tile.id.replace(/[^a-zA-Z0-9]/g, '-')}`;
  const shadowId = `tile-shadow-${tile.id.replace(/[^a-zA-Z0-9]/g, '-')}`;
  
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Tile base with bevel effect */}
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#faf8f3" />
          <stop offset="100%" stopColor="#f0ede5" />
        </linearGradient>
        <filter id={shadowId}>
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.2"/>
        </filter>
      </defs>
      
      {/* Tile body */}
      <rect
        x="2"
        y="2"
        width={width - 4}
        height={height - 4}
        rx="4"
        ry="4"
        fill={`url(#${gradientId})`}
        stroke="#d4c5b9"
        strokeWidth="1"
        filter={`url(#${shadowId})`}
      />
      
      {/* Inner bevel highlight */}
      <rect
        x="3"
        y="3"
        width={width - 8}
        height="8"
        rx="2"
        fill="rgba(255, 255, 255, 0.4)"
      />
      
      {/* Main symbol */}
      <text
        x={width / 2}
        y={height / 2 + (isSmall ? 6 : 8)}
        fontSize={fontSize}
        fill={suitColor}
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="serif"
        fontWeight="bold"
        style={{ userSelect: 'none' }}
      >
        {content.symbol}
      </text>
      
      {/* Number indicator for number tiles */}
      {content.isNumber && (
        <text
          x={width / 2}
          y={height - (isSmall ? 8 : 12)}
          fontSize={numberSize}
          fill={suitColor}
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="sans-serif"
          fontWeight="500"
          opacity="0.7"
          style={{ userSelect: 'none' }}
        >
          {content.number}
        </text>
      )}
      
      {/* Suit indicator for number tiles */}
      {content.isNumber && (
        <g transform={`translate(${width / 2}, ${isSmall ? 6 : 8})`}>
          {tile.suit === 'characters' && (
            <text
              fontSize={numberSize - 2}
              fill={suitColor}
              textAnchor="middle"
              dominantBaseline="middle"
              fontFamily="serif"
              opacity="0.6"
            >
              万
            </text>
          )}
          {tile.suit === 'bamboo' && (
            <text
              fontSize={numberSize - 2}
              fill={suitColor}
              textAnchor="middle"
              dominantBaseline="middle"
              fontFamily="serif"
              opacity="0.6"
            >
              索
            </text>
          )}
          {tile.suit === 'dots' && (
            <text
              fontSize={numberSize - 2}
              fill={suitColor}
              textAnchor="middle"
              dominantBaseline="middle"
              fontFamily="serif"
              opacity="0.6"
            >
              筒
            </text>
          )}
        </g>
      )}
    </svg>
  );
}

export function Tile({ tile, onClick, selected = false, disabled = false, size = 'normal' }) {
  if (!tile) return null;
  
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
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={`${tile.suit} ${tile.value}`}
    >
      <TileSVG tile={tile} size={size} />
    </div>
  );
}

