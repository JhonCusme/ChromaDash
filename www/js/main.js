/**
 * ChromaDash — Main Entry Point
 * Configures and boots Phaser 3 game instance
 */
import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
import GameOverScene from './scenes/GameOverScene.js';
import ShopScene from './scenes/ShopScene.js';

// Target portrait dimensions (will scale to device)
const BASE_WIDTH = 480;
const BASE_HEIGHT = 854;

const config = {
  type: Phaser.AUTO,       // WebGL preferred, Canvas fallback
  width: BASE_WIDTH,
  height: BASE_HEIGHT,
  backgroundColor: '#080818',
  parent: 'game-container',

  // Responsive scaling — letterbox with full height priority
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: BASE_WIDTH,
    height: BASE_HEIGHT,
  },

  // 60fps target — hard limit for smooth hyper-casual feel
  fps: {
    target: 60,
    forceSetTimeOut: false,
    smoothStep: true,
  },

  physics: {
    default: 'arcade',
    arcade: {
      debug: false,    // Set to true to show collision boxes during dev
    },
  },

  scene: [
    BootScene,
    MenuScene,
    GameScene,
    GameOverScene,
    ShopScene,
  ],
};

// Boot the game
window.addEventListener('load', () => {
  new Phaser.Game(config);
});
