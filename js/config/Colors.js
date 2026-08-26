/**
 * ChromaDash — Color Palette
 * The three game colors + UI theme colors
 */
const Colors = {
  // === THE 3 GAME COLORS ===
  GAME: [
    {
      id: 0,
      name: 'RED',
      label: '🔴',
      hex: 0xFF2D55,       // Vivid pink-red
      hexStr: '#FF2D55',
      dark: 0x8B0020,
      glow: 0xFF6B84,
      particle: '#FF2D55',
    },
    {
      id: 1,
      name: 'BLUE',
      label: '🔵',
      hex: 0x00AAFF,       // Electric blue
      hexStr: '#00AAFF',
      dark: 0x005580,
      glow: 0x66CCFF,
      particle: '#00AAFF',
    },
    {
      id: 2,
      name: 'GREEN',
      label: '🟢',
      hex: 0x00FF99,       // Neon green
      hexStr: '#00FF99',
      dark: 0x007744,
      glow: 0x66FFCC,
      particle: '#00FF99',
    },
  ],

  // === UI / THEME ===
  BG_DARK: 0x080818,        // Very dark navy
  BG_LANE: 0x12122A,        // Slightly lighter for the lane
  BG_LANE_BORDER: 0x252550,
  UI_TEXT: 0xFFFFFF,
  UI_DIM: 0x888899,
  UI_PANEL: 0x1A1A35,
  UI_PANEL_BORDER: 0x3333AA,
  COIN: 0xFFD700,           // Gold
  COIN_STR: '#FFD700',
  SHIELD: 0xFFAA00,
  SLOWMO: 0xAA44FF,
  MAGNET: 0xFF44AA,

  // Helpers
  getGame(index) {
    return this.GAME[index % this.GAME.length];
  },
  random() {
    return this.GAME[Math.floor(Math.random() * this.GAME.length)];
  },
  randomExcluding(excludeId) {
    const others = this.GAME.filter(c => c.id !== excludeId);
    return others[Math.floor(Math.random() * others.length)];
  },
};

export default Colors;
