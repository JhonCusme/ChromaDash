/**
 * ChromaDash — Game Configuration
 * Central constants for the entire game
 */
const GameConfig = {
  // === CANVAS ===
  WIDTH: 480,
  HEIGHT: 854,

  // === COLORS (index matches Colors array) ===
  COLOR_COUNT: 3,
  COLOR_RED: 0,
  COLOR_BLUE: 1,
  COLOR_GREEN: 2,

  // === PLAYER ===
  PLAYER_Y_RATIO: 0.75,        // Player position: 75% down the screen
  PLAYER_SIZE: 44,
  PLAYER_COLOR_CHANGE_DURATION: 80, // ms for color tween

  // === LANE ===
  LANE_COUNT: 3,
  LANE_WIDTH: 100,             // Width of a single lane
  TOTAL_LANE_WIDTH: 300,       // Total width of all 3 lanes combined
  LANE_BORDER: 4,
  PLAYER_LANE_SWITCH_SPEED: 120, // ms for lane switch animation

  // === OBSTACLES ===
  OBSTACLE_START_SPEED: 320,   // px/sec at start
  OBSTACLE_MAX_SPEED: 780,     // px/sec max
  OBSTACLE_SPEED_INCREMENT: 8, // Added per second
  OBSTACLE_WIDTH: 220,
  OBSTACLE_HEIGHT: 60,
  OBSTACLE_GAP: 90,            // Gap in gate the player passes through
  OBSTACLE_SPAWN_INTERVAL_MIN: 900,  // ms
  OBSTACLE_SPAWN_INTERVAL_MAX: 1600, // ms
  OBSTACLE_SPAWN_INTERVAL_MIN_HARD: 500,

  // === COINS ===
  COIN_SIZE: 22,
  COIN_VALUE: 1,
  COIN_MAGNET_RADIUS: 200,

  // === POWER-UPS ===
  POWERUP_SIZE: 36,
  POWERUP_SPAWN_CHANCE: 0.12,  // 12% chance per obstacle group
  POWERUP_SHIELD_DURATION: 0,  // absorbs 1 hit
  POWERUP_SLOWMO_DURATION: 5000,
  POWERUP_MAGNET_DURATION: 8000,

  // === DIFFICULTY THRESHOLDS (seconds) ===
  DIFFICULTY_MEDIUM: 15,
  DIFFICULTY_HARD: 35,
  DIFFICULTY_EXPERT: 65,

  // === SCORING ===
  SCORE_PER_METER: 1,
  SCORE_SPEED_DIVISOR: 60,     // score = speed / divisor per frame

  // === ADS ===
  INTERSTITIAL_EVERY_N_GAMES: 3,  // Show interstitial every N games

  // === BACKGROUND SCROLL ===
  BG_SCROLL_SPEED_RATIO: 0.5,  // bg scrolls at 50% of obstacle speed

  // === CAMERA SHAKE ===
  SHAKE_DURATION: 350,
  SHAKE_INTENSITY: 12,

  // === PARTICLES ===
  PARTICLE_COUNT_CHANGE: 16,
  PARTICLE_COUNT_HIT: 30,
  PARTICLE_COUNT_COIN: 8,
};

export default GameConfig;
