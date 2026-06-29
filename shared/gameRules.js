// Simplified Mahjong win condition checker
// Win condition: 4 melds (chow/pong) + 1 pair

import { MELD_TYPES } from './constants.js';

/**
 * Check if a hand is a winning hand
 * @param {Array} hand - Array of tiles
 * @param {Object} tile - The tile that completes the hand (if any)
 * @returns {Object} { isWin: boolean, melds: Array, pair: Object }
 */
export function checkWin(hand, tile = null) {
  const fullHand = tile ? [...hand, tile] : [...hand];
  
  if (fullHand.length !== 14) {
    return { isWin: false, melds: [], pair: null };
  }
  
  // Try to find a valid combination
  const result = findMeldsAndPair(fullHand);
  
  return {
    isWin: result !== null,
    melds: result ? result.melds : [],
    pair: result ? result.pair : null
  };
}

/**
 * Find 4 melds and 1 pair from a hand
 */
function findMeldsAndPair(tiles) {
  // Group tiles by suit and value
  const grouped = groupTiles(tiles);
  
  // Try all possible pair combinations
  const pairs = findPairs(tiles);
  
  for (const pair of pairs) {
    const remaining = removeTiles(tiles, pair);
    const melds = findMelds(remaining);
    
    if (melds.length === 4) {
      return { melds, pair };
    }
  }
  
  return null;
}

/**
 * Group tiles by suit and value
 */
function groupTiles(tiles) {
  const groups = {};
  
  for (const tile of tiles) {
    const key = `${tile.suit}-${tile.value}`;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(tile);
  }
  
  return groups;
}

/**
 * Find all possible pairs
 */
function findPairs(tiles) {
  const pairs = [];
  const grouped = groupTiles(tiles);
  
  for (const key in grouped) {
    if (grouped[key].length >= 2) {
      pairs.push([grouped[key][0], grouped[key][1]]);
    }
  }
  
  return pairs;
}

/**
 * Find all possible melds (chows and pongs)
 */
function findMelds(tiles) {
  const melds = [];
  const remaining = [...tiles];
  
  // Find pongs first (three of a kind)
  const grouped = groupTiles(remaining);
  for (const key in grouped) {
    if (grouped[key].length >= 3) {
      melds.push({
        type: MELD_TYPES.PONG,
        tiles: grouped[key].slice(0, 3)
      });
      // Remove these tiles
      for (let i = 0; i < 3; i++) {
        const index = remaining.findIndex(t => 
          t.suit === grouped[key][0].suit && t.value === grouped[key][0].value
        );
        if (index !== -1) remaining.splice(index, 1);
      }
    }
  }
  
  // Find chows (sequences) - only for number tiles
  const numberTiles = remaining.filter(t => 
    ['characters', 'bamboo', 'dots'].includes(t.suit)
  );
  
  const chows = findChows(numberTiles);
  melds.push(...chows);
  
  return melds;
}

/**
 * Find chows (sequences of 3 consecutive tiles)
 */
function findChows(tiles) {
  const chows = [];
  const remaining = [...tiles];
  
  // Group by suit
  const bySuit = {};
  for (const tile of remaining) {
    if (!bySuit[tile.suit]) {
      bySuit[tile.suit] = [];
    }
    bySuit[tile.suit].push(tile);
  }
  
  // Find sequences in each suit
  for (const suit in bySuit) {
    const suitTiles = bySuit[suit].sort((a, b) => a.value - b.value);
    const values = suitTiles.map(t => t.value);
    
    for (let i = 1; i <= 7; i++) {
      if (values.includes(i) && values.includes(i + 1) && values.includes(i + 2)) {
        // Find the actual tiles
        const tile1 = suitTiles.find(t => t.value === i);
        const tile2 = suitTiles.find(t => t.value === i + 1);
        const tile3 = suitTiles.find(t => t.value === i + 2);
        
        if (tile1 && tile2 && tile3) {
          chows.push({
            type: MELD_TYPES.CHOW,
            tiles: [tile1, tile2, tile3]
          });
          
          // Remove these tiles
          const idx1 = remaining.findIndex(t => t.id === tile1.id);
          const idx2 = remaining.findIndex(t => t.id === tile2.id);
          const idx3 = remaining.findIndex(t => t.id === tile3.id);
          if (idx1 !== -1) remaining.splice(idx1, 1);
          if (idx2 !== -1) remaining.splice(idx2, 1);
          if (idx3 !== -1) remaining.splice(idx3, 1);
          
          // Update suitTiles
          bySuit[suit] = remaining.filter(t => t.suit === suit);
        }
      }
    }
  }
  
  return chows;
}

/**
 * Remove specific tiles from array
 */
function removeTiles(tiles, tilesToRemove) {
  const result = [...tiles];
  for (const tile of tilesToRemove) {
    const index = result.findIndex(t => t.id === tile.id);
    if (index !== -1) {
      result.splice(index, 1);
    }
  }
  return result;
}

/**
 * Check if a chow is valid (3 consecutive tiles of same suit)
 */
export function isValidChow(tiles) {
  if (tiles.length !== 3) return false;
  
  // Must be same suit
  const suit = tiles[0].suit;
  if (!['characters', 'bamboo', 'dots'].includes(suit)) return false;
  if (tiles.some(t => t.suit !== suit)) return false;
  
  // Must be consecutive numbers
  const values = tiles.map(t => t.value).sort((a, b) => a - b);
  return values[0] + 1 === values[1] && values[1] + 1 === values[2];
}

/**
 * Check if a pong is valid (3 identical tiles)
 */
export function isValidPong(tiles) {
  if (tiles.length !== 3) return false;
  
  const first = tiles[0];
  return tiles.every(t => t.suit === first.suit && t.value === first.value);
}



