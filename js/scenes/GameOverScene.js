/**
 * ChromaDash — Game Over Scene
 * Shows score, new record, revive option, and interstitial ad logic
 */
import Colors from '../config/Colors.js';
import SaveSystem from '../systems/SaveSystem.js';
import AudioManager from '../systems/AudioManager.js';
import AdMobBridge from '../systems/AdMobBridge.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data) {
    this.finalScore         = data.score            || 0;
    this.bestScore          = data.bestScore         || 0;
    this.sessionCoins       = data.coins             || 0;
    this.isNewBest          = data.isNewBest         || false;
    this.shouldShowInterstitial = data.showInterstitial || false;
    this.canRevive          = data.canRevive         !== false;
    this.comboMax           = data.comboMax          || 0;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this._createBackground(W, H);
    this._createScorePanel(W, H);
    this._createButtons(W, H);

    // Entrance animation
    this._playEntrance();

    // If interstitial needed, show after a delay (so player can read score first)
    if (this.shouldShowInterstitial) {
      // Queue interstitial for when they choose to leave
    }
  }

  _createBackground(W, H) {
    // Dark overlay
    const bg = this.add.graphics();
    bg.fillStyle(0x080818, 0.95);
    bg.fillRect(0, 0, W, H);

    // Diagonal stripes (subtle)
    for (let i = -H; i < W + H; i += 80) {
      bg.lineStyle(40, 0xFF2D55, 0.015);
      bg.beginPath();
      bg.moveTo(i, 0);
      bg.lineTo(i + H, H);
      bg.strokePath();
    }
  }

  _createScorePanel(W, H) {
    const panelW = W * 0.82;
    const panelH = H * 0.48;
    const panelX = W / 2 - panelW / 2;
    const panelY = H * 0.1;

    // Panel
    const panel = this.add.graphics();
    panel.fillStyle(Colors.UI_PANEL, 0.95);
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, 24);
    panel.lineStyle(2, Colors.GAME[0].hex, 0.6);
    panel.strokeRoundedRect(panelX, panelY, panelW, panelH, 24);

    // GAME OVER text
    this.add.text(W / 2, panelY + 28, 'GAME OVER', {
      fontFamily: '"Orbitron", "Exo 2", sans-serif',
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#FF2D55',
    }).setOrigin(0.5, 0);

    // Score
    this.add.text(W / 2, panelY + 72, 'SCORE', {
      fontFamily: '"Exo 2", sans-serif',
      fontSize: '12px',
      color: '#888899',
      letterSpacing: 3,
    }).setOrigin(0.5, 0);

    this.scoreTxt = this.add.text(W / 2, panelY + 90, '0', {
      fontFamily: '"Orbitron", sans-serif',
      fontSize: '52px',
      fontStyle: 'bold',
      color: '#FFFFFF',
    }).setOrigin(0.5, 0);

    // Animate score counting up
    this._animateScore(this.finalScore);

    // New record badge
    if (this.isNewBest) {
      const badge = this.add.text(W / 2, panelY + 158, '🏆 NEW RECORD!', {
        fontFamily: '"Exo 2", sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#FFD700',
      }).setOrigin(0.5, 0);
      this.tweens.add({
        targets: badge,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    // Divider
    const divY = panelY + 185;
    const divG = this.add.graphics();
    divG.lineStyle(1, 0x333355, 1);
    divG.beginPath();
    divG.moveTo(panelX + 20, divY);
    divG.lineTo(panelX + panelW - 20, divY);
    divG.strokePath();

    // Stats row: BEST | COMBO | COINS
    const third = panelW / 3;

    this.add.text(panelX + third * 0.5, divY + 16, 'BEST', {
      fontFamily: '"Exo 2", sans-serif', fontSize: '10px', color: '#888899', letterSpacing: 2,
    }).setOrigin(0.5, 0);
    this.add.text(panelX + third * 0.5, divY + 30, String(this.bestScore), {
      fontFamily: '"Orbitron", sans-serif', fontSize: '20px', fontStyle: 'bold', color: '#FFD700',
    }).setOrigin(0.5, 0);

    this.add.text(panelX + third * 1.5, divY + 16, 'COMBO', {
      fontFamily: '"Exo 2", sans-serif', fontSize: '10px', color: '#888899', letterSpacing: 2,
    }).setOrigin(0.5, 0);
    this.add.text(panelX + third * 1.5, divY + 30, `x${this.comboMax}`, {
      fontFamily: '"Orbitron", sans-serif', fontSize: '20px', fontStyle: 'bold',
      color: this.comboMax >= 5 ? '#FF2D55' : this.comboMax >= 3 ? '#FF9900' : '#FFFFFF',
    }).setOrigin(0.5, 0);

    this.add.text(panelX + third * 2.5, divY + 16, 'COINS', {
      fontFamily: '"Exo 2", sans-serif', fontSize: '10px', color: '#888899', letterSpacing: 2,
    }).setOrigin(0.5, 0);
    this.add.text(panelX + third * 2.5, divY + 30, `+${this.sessionCoins} 🪙`, {
      fontFamily: '"Orbitron", sans-serif', fontSize: '18px', fontStyle: 'bold', color: '#FFD700',
    }).setOrigin(0.5, 0);
  }

  _animateScore(target) {
    let current = 0;
    const duration = Math.min(1500, target * 8);
    const startTime = this.time.now;
    const timer = this.time.addEvent({
      delay: 16,
      repeat: -1,
      callback: () => {
        const elapsed = this.time.now - startTime;
        const t = Math.min(elapsed / duration, 1);
        current = Math.floor(t * target);
        this.scoreTxt.setText(String(current));
        if (t >= 1) timer.remove();
      },
    });
  }

  _createButtons(W, H) {
    const btnW = W * 0.72;
    const reviveY = H * 0.63;
    const retryY = H * 0.73;
    const menuY = H * 0.83;

    // === REVIVE BUTTON (if available) ===
    if (this.canRevive) {
      const revG = this.add.graphics();
      revG.fillStyle(Colors.GAME[2].hex, 1);
      revG.fillRoundedRect(W / 2 - btnW / 2, reviveY, btnW, 58, 16);
      revG.lineStyle(2, 0xffffff, 0.2);
      revG.strokeRoundedRect(W / 2 - btnW / 2, reviveY, btnW, 58, 16);

      this.add.text(W / 2, reviveY + 29, '▶  REVIVE  (watch ad)', {
        fontFamily: '"Exo 2", sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#000000',
      }).setOrigin(0.5);

      this.add.zone(W / 2, reviveY + 29, btnW, 58)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this._onRevive());

      // Pulsing glow on revive
      this.tweens.add({
        targets: revG,
        alpha: { from: 0.85, to: 1 },
        duration: 700,
        yoyo: true,
        repeat: -1,
      });
    } else {
      // Already used revive — show grayed out version with notice
      const grayG = this.add.graphics();
      grayG.fillStyle(0x222233, 1);
      grayG.fillRoundedRect(W / 2 - btnW / 2, reviveY, btnW, 58, 16);
      this.add.text(W / 2, reviveY + 29, '▶  REVIVE  (used)', {
        fontFamily: '"Exo 2", sans-serif',
        fontSize: '18px',
        color: '#444455',
      }).setOrigin(0.5);
    }

    // === RETRY BUTTON ===
    const retryG = this.add.graphics();
    retryG.fillStyle(Colors.GAME[1].hex, 1);
    retryG.fillRoundedRect(W / 2 - btnW / 2, retryY, btnW, 52, 14);

    this.add.text(W / 2, retryY + 26, '↺  RETRY', {
      fontFamily: '"Exo 2", sans-serif',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#FFFFFF',
    }).setOrigin(0.5);

    this.add.zone(W / 2, retryY + 26, btnW, 52)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this._onRetry());

    // === MENU BUTTON ===
    const menuG = this.add.graphics();
    menuG.fillStyle(Colors.UI_PANEL, 0.9);
    menuG.fillRoundedRect(W / 2 - btnW / 2, menuY, btnW, 48, 14);
    menuG.lineStyle(1, Colors.UI_PANEL_BORDER, 0.7);
    menuG.strokeRoundedRect(W / 2 - btnW / 2, menuY, btnW, 48, 14);

    this.add.text(W / 2, menuY + 24, '⌂  MENU', {
      fontFamily: '"Exo 2", sans-serif',
      fontSize: '18px',
      color: '#AAAACC',
    }).setOrigin(0.5);

    this.add.zone(W / 2, menuY + 24, btnW, 48)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this._onMenu());
  }

  _onRevive() {
    AudioManager.tap();
    // Disable the button visually
    // Show rewarded ad
    AdMobBridge.showRewarded(
      () => {
        // Reward granted — revive!
        SaveSystem.useRevive();
        AudioManager.revive();
        this.scene.start('GameScene', {
          revive: true,
          score: this.finalScore,
          coins: this.sessionCoins,
        });
      },
      () => {
        // Ad dismissed without reward — do nothing special
        console.log('[GameOver] Rewarded ad closed without reward');
      }
    );
  }

  _onRetry() {
    AudioManager.tap();
    SaveSystem.resetRevive();

    if (this.shouldShowInterstitial) {
      AdMobBridge.showInterstitial(() => {
        this.scene.start('GameScene');
      });
    } else {
      this.scene.start('GameScene');
    }
  }

  _onMenu() {
    AudioManager.tap();
    if (this.shouldShowInterstitial) {
      AdMobBridge.showInterstitial(() => {
        this.scene.start('MenuScene');
      });
    } else {
      this.scene.start('MenuScene');
    }
  }

  _playEntrance() {
    // Slide in from bottom
    this.cameras.main.setAlpha(0);
    this.tweens.add({
      targets: this.cameras.main,
      alpha: 1,
      duration: 400,
      ease: 'Power2',
    });
  }
}
