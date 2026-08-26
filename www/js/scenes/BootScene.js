/**
 * ChromaDash — Boot Scene
 * Preloads assets and initializes systems
 */
import SaveSystem from '../systems/SaveSystem.js';
import AdMobBridge from '../systems/AdMobBridge.js';
import HapticsManager from '../systems/HapticsManager.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // No external assets — everything is procedurally generated
    // Show loading screen
    const { width, height } = this.scale;

    // Background
    this.add.rectangle(0, 0, width, height, 0x080818).setOrigin(0);

    // Logo text
    this.add.text(width / 2, height * 0.38, 'CHROMA', {
      fontFamily: '"Orbitron", "Exo 2", sans-serif',
      fontSize: '52px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#00AAFF',
      strokeThickness: 3,
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.48, 'DASH', {
      fontFamily: '"Orbitron", "Exo 2", sans-serif',
      fontSize: '52px',
      fontStyle: 'bold',
      color: '#00FF99',
      stroke: '#00FF99',
      strokeThickness: 2,
    }).setOrigin(0.5);

    // Loading bar
    const barBg = this.add.rectangle(width / 2, height * 0.65, width * 0.7, 8, 0x333355).setOrigin(0.5);
    const bar = this.add.rectangle(width / 2 - width * 0.35, height * 0.65, 0, 8, 0x00AAFF).setOrigin(0, 0.5);

    this.add.text(width / 2, height * 0.72, 'Loading...', {
      fontFamily: '"Exo 2", sans-serif',
      fontSize: '16px',
      color: '#888899',
    }).setOrigin(0.5);

    this.load.on('progress', (value) => {
      bar.width = width * 0.7 * value;
    });
  }

  async create() {
    // Load save data
    SaveSystem.load();

    // Initialize systems (non-blocking)
    try {
      await Promise.all([
        AdMobBridge.init(),
        HapticsManager.init(),
      ]);
    } catch (e) {
      // Systems are optional, game runs without them
    }

    // Pre-load ads for later use
    AdMobBridge.prepareRewarded().catch(() => {});
    AdMobBridge.prepareInterstitial().catch(() => {});

    // Short intro then go to menu
    this.time.delayedCall(800, () => {
      this.scene.start('MenuScene');
    });
  }
}
