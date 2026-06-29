// Tile definitions
export const TILE_TYPES = {
  CHARACTERS: 'characters',
  BAMBOO: 'bamboo',
  DOTS: 'dots',
  WINDS: 'winds',
  DRAGONS: 'dragons'
};

export const TILE_SUITS = {
  [TILE_TYPES.CHARACTERS]: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  [TILE_TYPES.BAMBOO]: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  [TILE_TYPES.DOTS]: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  [TILE_TYPES.WINDS]: ['east', 'south', 'west', 'north'],
  [TILE_TYPES.DRAGONS]: ['red', 'green', 'white']
};

// Generate all tiles
export function generateAllTiles() {
  const tiles = [];
  
  // Number tiles (4 copies each)
  [TILE_TYPES.CHARACTERS, TILE_TYPES.BAMBOO, TILE_TYPES.DOTS].forEach(suit => {
    TILE_SUITS[suit].forEach(value => {
      for (let i = 0; i < 4; i++) {
        tiles.push({ suit, value, id: `${suit}-${value}-${i}` });
      }
    });
  });
  
  // Wind tiles (4 copies each)
  TILE_SUITS[TILE_TYPES.WINDS].forEach(value => {
    for (let i = 0; i < 4; i++) {
      tiles.push({ suit: TILE_TYPES.WINDS, value, id: `winds-${value}-${i}` });
    }
  });
  
  // Dragon tiles (4 copies each)
  TILE_SUITS[TILE_TYPES.DRAGONS].forEach(value => {
    for (let i = 0; i < 4; i++) {
      tiles.push({ suit: TILE_TYPES.DRAGONS, value, id: `dragons-${value}-${i}` });
    }
  });
  
  return tiles;
}

// Total tiles: 108 number tiles + 16 wind tiles + 12 dragon tiles = 136 tiles
export const TOTAL_TILES = 136;
export const TILES_PER_PLAYER = 13;
export const WALL_TILES = TOTAL_TILES - (TILES_PER_PLAYER * 4);

// Game phases
export const GAME_PHASE = {
  LOBBY: 'LOBBY',
  DEALING: 'DEALING',
  PLAYING: 'PLAYING',
  ROUND_END: 'ROUND_END'
};

// Player positions
export const POSITIONS = {
  EAST: 'east',
  SOUTH: 'south',
  WEST: 'west',
  NORTH: 'north'
};

export const POSITION_ORDER = [POSITIONS.EAST, POSITIONS.SOUTH, POSITIONS.WEST, POSITIONS.NORTH];

// Action types
export const ACTION_TYPES = {
  DRAW: 'DRAW',
  DISCARD: 'DISCARD',
  CLAIM_PONG: 'CLAIM_PONG',
  CLAIM_CHOW: 'CLAIM_CHOW',
  PASS: 'PASS',
  DECLARE_WIN: 'DECLARE_WIN'
};

// Socket event names
export const SOCKET_EVENTS = {
  // Client -> Server
  ROOM_CREATE: 'room:create',
  ROOM_JOIN: 'room:join',
  ROOM_LEAVE: 'room:leave',
  GAME_START: 'game:start',
  GAME_ACTION: 'game:action',
  STATE_REQUEST: 'state:request',
  
  // Server -> Client
  ROOM_CREATED: 'room:created',
  ROOM_JOINED: 'room:joined',
  ROOM_LEFT: 'room:left',
  PLAYER_JOINED: 'player:joined',
  PLAYER_LEFT: 'player:left',
  GAME_STARTED: 'game:started',
  STATE_UPDATE: 'state:update',
  ERROR: 'error',
  NOTIFICATION: 'notification'
};

// Meld types
export const MELD_TYPES = {
  PAIR: 'pair',
  CHOW: 'chow',      // Sequence of 3 consecutive tiles
  PONG: 'pong',      // Three of a kind
  KONG: 'kong'       // Four of a kind (not in MVP)
};



