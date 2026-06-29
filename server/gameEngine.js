import { generateAllTiles, TILES_PER_PLAYER, WALL_TILES, GAME_PHASE, POSITION_ORDER, ACTION_TYPES } from '../shared/constants.js';
import { checkWin, isValidChow, isValidPong } from '../shared/gameRules.js';

/**
 * Create initial room state
 */
export function createRoomState(roomCode, hostId) {
  return {
    roomCode,
    hostId,
    phase: GAME_PHASE.LOBBY,
    players: {},
    seats: {
      [POSITION_ORDER[0]]: null,
      [POSITION_ORDER[1]]: null,
      [POSITION_ORDER[2]]: null,
      [POSITION_ORDER[3]]: null
    },
    gameState: null,
    seed: Math.floor(Math.random() * 1000000)
  };
}

/**
 * Shuffle tiles using Fisher-Yates with seed
 */
function shuffleTiles(tiles, seed) {
  const shuffled = [...tiles];
  let rng = seed;
  
  // Simple seeded RNG
  function random() {
    rng = (rng * 9301 + 49297) % 233280;
    return rng / 233280;
  }
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}

/**
 * Start a new game
 */
export function startGame(roomState) {
  if (Object.keys(roomState.players).length !== 4) {
    throw new Error('Need exactly 4 players to start');
  }
  
  // Generate and shuffle tiles
  const allTiles = generateAllTiles();
  const shuffled = shuffleTiles(allTiles, roomState.seed);
  
  // Deal tiles to players
  const hands = {};
  let tileIndex = 0;
  
  for (const position of POSITION_ORDER) {
    const playerId = roomState.seats[position];
    if (!playerId) continue;
    
    hands[playerId] = shuffled.slice(tileIndex, tileIndex + TILES_PER_PLAYER);
    tileIndex += TILES_PER_PLAYER;
  }
  
  // Remaining tiles form the wall
  const wall = shuffled.slice(tileIndex);
  
  // Determine starting player (East)
  const eastPlayer = roomState.seats[POSITION_ORDER[0]];
  
  roomState.gameState = {
    hands,
    discards: {
      [POSITION_ORDER[0]]: [],
      [POSITION_ORDER[1]]: [],
      [POSITION_ORDER[2]]: [],
      [POSITION_ORDER[3]]: []
    },
    melds: {
      [POSITION_ORDER[0]]: [],
      [POSITION_ORDER[1]]: [],
      [POSITION_ORDER[2]]: [],
      [POSITION_ORDER[3]]: []
    },
    wall,
    currentPlayer: eastPlayer,
    lastDiscard: null,
    lastDiscardBy: null,
    turnNumber: 0,
    canClaim: null, // { playerId, tile, actions: ['PONG', 'CHOW'] }
    hasDrawn: false, // Track if current player has drawn this turn
    mustDiscard: false // Track if player must discard (after draw or claim)
  };
  
  roomState.phase = GAME_PHASE.PLAYING;
  
  return roomState;
}

/**
 * Draw a tile from the wall
 */
export function drawTile(roomState, playerId) {
  if (roomState.phase !== GAME_PHASE.PLAYING) {
    throw new Error('Game is not in playing phase');
  }
  
  if (roomState.gameState.currentPlayer !== playerId) {
    throw new Error('Not your turn');
  }
  
  if (roomState.gameState.hasDrawn) {
    throw new Error('You have already drawn this turn. You must discard a tile.');
  }
  
  if (roomState.gameState.mustDiscard) {
    throw new Error('You must discard a tile before drawing again.');
  }
  
  if (roomState.gameState.wall.length === 0) {
    throw new Error('Wall is empty');
  }
  
  const tile = roomState.gameState.wall.shift();
  roomState.gameState.hands[playerId].push(tile);
  roomState.gameState.hasDrawn = true;
  roomState.gameState.mustDiscard = true;
  
  // Check for win (hand should now have 14 tiles)
  const winCheck = checkWin(roomState.gameState.hands[playerId]);
  if (winCheck.isWin) {
    roomState.phase = GAME_PHASE.ROUND_END;
    roomState.winner = playerId;
    roomState.winHand = winCheck;
    return roomState;
  }
  
  return roomState;
}

/**
 * Discard a tile
 */
export function discardTile(roomState, playerId, tileId) {
  if (roomState.phase !== GAME_PHASE.PLAYING) {
    throw new Error('Game is not in playing phase');
  }
  
  if (roomState.gameState.currentPlayer !== playerId) {
    throw new Error('Not your turn');
  }
  
  // Must discard after drawing or after claiming
  if (!roomState.gameState.mustDiscard) {
    throw new Error('You must draw a tile first, or you have already discarded this turn.');
  }
  
  const hand = roomState.gameState.hands[playerId];
  const tileIndex = hand.findIndex(t => t.id === tileId);
  
  if (tileIndex === -1) {
    throw new Error('Tile not in hand');
  }
  
  const tile = hand.splice(tileIndex, 1)[0];
  
  // Find player position
  const position = Object.keys(roomState.seats).find(
    pos => roomState.seats[pos] === playerId
  );
  
  roomState.gameState.discards[position].push(tile);
  roomState.gameState.lastDiscard = tile;
  roomState.gameState.lastDiscardBy = playerId;
  
  // Reset turn state
  roomState.gameState.hasDrawn = false;
  roomState.gameState.mustDiscard = false;
  
  // Check if other players can claim
  roomState.gameState.canClaim = checkClaims(roomState, tile, playerId);
  
  // If no one can claim, move to next turn
  if (!roomState.gameState.canClaim) {
    nextTurn(roomState);
  }
  
  return roomState;
}

/**
 * Check if any player can claim the discarded tile
 */
function checkClaims(roomState, tile, discarderId) {
  const claims = [];
  
  for (const position of POSITION_ORDER) {
    const playerId = roomState.seats[position];
    if (!playerId || playerId === discarderId) continue;
    
    const hand = roomState.gameState.hands[playerId];
    const availableActions = [];
    
    // Check for pong (3 of a kind)
    const matchingTiles = hand.filter(t => 
      t.suit === tile.suit && t.value === tile.value
    );
    if (matchingTiles.length >= 2) {
      availableActions.push(ACTION_TYPES.CLAIM_PONG);
    }
    
    // Check for chow (sequence) - only for number tiles and only for next player
    const discarderPosition = Object.keys(roomState.seats).find(
      pos => roomState.seats[pos] === discarderId
    );
    const discarderIndex = POSITION_ORDER.indexOf(discarderPosition);
    const playerIndex = POSITION_ORDER.indexOf(position);
    const isNextPlayer = (playerIndex === (discarderIndex + 1) % 4);
    
    if (isNextPlayer && ['characters', 'bamboo', 'dots'].includes(tile.suit)) {
      // Check if tile can form a chow
      const suitTiles = hand.filter(t => t.suit === tile.suit);
      const values = suitTiles.map(t => t.value).sort((a, b) => a - b);
      
      // Check if tile.value can form a sequence with existing tiles
      for (const value of values) {
        if (Math.abs(value - tile.value) <= 2) {
          // Potential chow
          const needed = [tile.value - 2, tile.value - 1, tile.value, tile.value + 1, tile.value + 2]
            .filter(v => v >= 1 && v <= 9 && v !== tile.value);
          
          if (needed.some(v => values.includes(v))) {
            availableActions.push(ACTION_TYPES.CLAIM_CHOW);
            break;
          }
        }
      }
    }
    
    if (availableActions.length > 0) {
      claims.push({ playerId, actions: availableActions });
    }
  }
  
  // For MVP, only allow one claimer (first in order)
  if (claims.length > 0) {
    return {
      playerId: claims[0].playerId,
      tile,
      actions: claims[0].actions
    };
  }
  
  return null;
}

/**
 * Apply a claim action (pong or chow)
 */
export function applyClaim(roomState, playerId, actionType, tileId = null) {
  if (roomState.phase !== GAME_PHASE.PLAYING) {
    throw new Error('Game is not in playing phase');
  }
  
  if (!roomState.gameState.canClaim || roomState.gameState.canClaim.playerId !== playerId) {
    throw new Error('No claim available for you');
  }
  
  if (!roomState.gameState.canClaim.actions.includes(actionType)) {
    throw new Error('Invalid claim action');
  }
  
  const tile = roomState.gameState.lastDiscard;
  if (!tile) {
    throw new Error('No tile to claim');
  }
  
  const hand = roomState.gameState.hands[playerId];
  const position = Object.keys(roomState.seats).find(
    pos => roomState.seats[pos] === playerId
  );
  
  if (actionType === ACTION_TYPES.CLAIM_PONG) {
    // Find 2 matching tiles
    const matchingTiles = hand.filter(t => 
      t.suit === tile.suit && t.value === tile.value
    );
    
    if (matchingTiles.length < 2) {
      throw new Error('Not enough matching tiles for pong');
    }
    
    const meldTiles = [matchingTiles[0], matchingTiles[1], tile];
    
    // Remove from hand
    hand.splice(hand.indexOf(matchingTiles[0]), 1);
    hand.splice(hand.indexOf(matchingTiles[1]), 1);
    
    // Add to melds
    roomState.gameState.melds[position].push({
      type: 'pong',
      tiles: meldTiles
    });
    
    // Remove from discards
    const discardPosition = Object.keys(roomState.seats).find(
      pos => roomState.seats[pos] === roomState.gameState.lastDiscardBy
    );
    roomState.gameState.discards[discardPosition].pop();
    
    // Current player becomes the claimer - must discard after claim
    roomState.gameState.currentPlayer = playerId;
    roomState.gameState.lastDiscard = null;
    roomState.gameState.lastDiscardBy = null;
    roomState.gameState.canClaim = null;
    roomState.gameState.hasDrawn = false; // Claim counts as "draw" for turn purposes
    roomState.gameState.mustDiscard = true; // Must discard after claiming
    
  } else if (actionType === ACTION_TYPES.CLAIM_CHOW) {
    // Find tiles that form a chow with the discarded tile
    const suitTiles = hand.filter(t => t.suit === tile.suit);
    
    // Try to find a valid chow combination
    let chowFound = false;
    const values = suitTiles.map(t => t.value).sort((a, b) => a - b);
    
    // Check all possible sequences that include the discarded tile
    for (let i = 0; i < values.length; i++) {
      for (let j = i + 1; j < values.length; j++) {
        const val1 = values[i];
        const val2 = values[j];
        const tileVal = tile.value;
        
        // Check if these three values form a consecutive sequence
        const allValues = [val1, val2, tileVal].sort((a, b) => a - b);
        const isSequence = allValues[0] + 1 === allValues[1] && allValues[1] + 1 === allValues[2];
        
        if (isSequence) {
          const t1 = suitTiles.find(t => t.value === val1);
          const t2 = suitTiles.find(t => t.value === val2);
          const meldTiles = [tile, t1, t2].sort((a, b) => {
            if (a.value !== b.value) return a.value - b.value;
            return 0;
          });
          
          // Remove from hand
          const idx1 = hand.findIndex(t => t.id === t1.id);
          const idx2 = hand.findIndex(t => t.id === t2.id);
          if (idx1 !== -1 && idx2 !== -1) {
            hand.splice(Math.max(idx1, idx2), 1);
            hand.splice(Math.min(idx1, idx2), 1);
            
            // Add to melds
            roomState.gameState.melds[position].push({
              type: 'chow',
              tiles: meldTiles
            });
            
            // Remove from discards
            const discardPosition = Object.keys(roomState.seats).find(
              pos => roomState.seats[pos] === roomState.gameState.lastDiscardBy
            );
            roomState.gameState.discards[discardPosition].pop();
            
            chowFound = true;
            break;
          }
        }
      }
      if (chowFound) break;
    }
    
    if (!chowFound) {
      throw new Error('Cannot form a valid chow');
    }
    
    // Current player becomes the claimer - must discard after claim
    roomState.gameState.currentPlayer = playerId;
    roomState.gameState.lastDiscard = null;
    roomState.gameState.lastDiscardBy = null;
    roomState.gameState.canClaim = null;
    roomState.gameState.hasDrawn = false; // Claim counts as "draw" for turn purposes
    roomState.gameState.mustDiscard = true; // Must discard after claiming
  }
  
  return roomState;
}

/**
 * Pass on a claim
 */
export function passClaim(roomState, playerId) {
  if (roomState.gameState.canClaim && roomState.gameState.canClaim.playerId === playerId) {
    // This player passed, check if there are other potential claimers
    // For MVP, if the eligible player passes, move to next turn
    roomState.gameState.canClaim = null;
    nextTurn(roomState);
  }
  
  return roomState;
}

/**
 * Move to next player's turn
 */
export function nextTurn(roomState) {
  const currentPosition = Object.keys(roomState.seats).find(
    pos => roomState.seats[pos] === roomState.gameState.currentPlayer
  );
  const currentIndex = POSITION_ORDER.indexOf(currentPosition);
  const nextIndex = (currentIndex + 1) % 4;
  const nextPosition = POSITION_ORDER[nextIndex];
  roomState.gameState.currentPlayer = roomState.seats[nextPosition];
  roomState.gameState.turnNumber++;
  roomState.gameState.hasDrawn = false;
  roomState.gameState.mustDiscard = false;
  
  return roomState;
}

/**
 * Declare win
 */
export function declareWin(roomState, playerId) {
  if (roomState.phase !== GAME_PHASE.PLAYING) {
    throw new Error('Game is not in playing phase');
  }
  
  if (roomState.gameState.currentPlayer !== playerId) {
    throw new Error('Not your turn');
  }
  
  // Can only declare win after drawing (hand must have 14 tiles)
  if (!roomState.gameState.hasDrawn && !roomState.gameState.mustDiscard) {
    throw new Error('You must draw a tile before declaring win');
  }
  
  const hand = roomState.gameState.hands[playerId];
  const winCheck = checkWin(hand);
  
  if (!winCheck.isWin) {
    throw new Error('Hand is not a winning hand');
  }
  
  roomState.phase = GAME_PHASE.ROUND_END;
  roomState.winner = playerId;
  roomState.winHand = winCheck;
  return roomState;
}

