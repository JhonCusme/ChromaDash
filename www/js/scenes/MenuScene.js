/**
 * ChromaDash — Menu Scene
 */
import Colors from '../config/Colors.js';
import SaveSystem from '../systems/SaveSystem.js';
import AudioManager from '../systems/AudioManager.js';
import AdMobBridge from '../systems/AdMobBridge.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // Show banner ad in menu (never during gameplay)
    AdMobBridge.showBanner().catch(() => {});

    // === BACKGROUND ===
    this._createBackground(W, H);

    // === LOGO ===
    this._createLogo(W, H);

    // === STATS ===
    this._createStats(W, H);

    // === BUTTONS ===
    this._createButtons(W, H);

    // === FLOATING COLOR ORBS ===
    this._createFloatingOrbs(W, H);

    // === HOW TO PLAY (first run only) ===
    const gamesPlayed = SaveSystem.get('gamesPlayed') || 0;
    if (gamesPlayed === 0) {
      this._showHowToPlay(W, H);
    }

    // === VERSION ===
    this.add.text(W / 2, H - 16, 'v1.0.0', {
      fontFamily: '"Exo 2", sans-serif',
      fontSize: '11px',
      color: '#333355',
    }).setOrigin(0.5, 1);
  }

  _createBackground(W, H) {
    const bg = this.add.graphics();
    bg.fillStyle(Colors.BG_DARK, 1);
    bg.fillRect(0, 0, W, H);

    // Gradient overlay
    const grad = this.add.graphics();
    grad.fillGradientStyle(0x080818, 0x080818, 0x0D0D2A, 0x0D0D2A, 1);
    grad.fillRect(0, 0, W, H);

    // Subtle grid
    for (let y = 0; y < H; y += 60) {
      grad.lineStyle(1, 0x111130, 0.5);
      grad.beginPath();
      grad.moveTo(0, y);
      grad.lineTo(W, y);
      grad.strokePath();
    }
    for (let x = 0; x < W; x += 60) {
      grad.lineStyle(1, 0x111130, 0.5);
      grad.beginPath();
      grad.moveTo(x, 0);
      grad.lineTo(x, H);
      grad.strokePath();
    }
  }

  _createLogo(W, H) {
    // Glow behind logo
    const logoGlow = this.add.graphics();
    logoGlow.fillStyle(0x00AAFF, 0.06);
    logoGlow.fillCircle(W / 2, H * 0.22, 120);

    // CHROMA
    const chroma = this.add.text(W / 2, H * 0.16, 'CHROMA', {
      fontFamily: '"Orbitron", "Exo 2", sans-serif',
      fontSize: '48px',
      fontStyle: 'bold',
      color: '#FFFFFF',
      stroke: '#00AAFF',
      strokeThickness: 2,
    }).setOrigin(0.5);

    // DASH
    const dash = this.add.text(W / 2, H * 0.24, 'DASH', {
      fontFamily: '"Orbitron", "Exo 2", sans-serif',
      fontSize: '52px',
      fontStyle: 'bold',
      color: '#00FF99',
    }).setOrigin(0.5);

    // Color dots decorations
    const dotY = H * 0.31;
    [Colors.GAME[0].hex, Colors.GAME[1].hex, Colors.GAME[2].hex].forEach((c, i) => {
      const dotG = this.add.graphics();
      dotG.fillStyle(c, 1);
      dotG.fillCircle(W / 2 - 28 + i * 28, dotY, 8);
      this.tweens.add({
        targets: dotG,
        y: -5,
        duration: 600 + i * 150,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });

    // Pulse logo
    this.tweens.add({
      targets: [chroma, dash],
      scaleX: 1.02,
      scaleY: 1.02,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  _createStats(W, H) {
    const best = SaveSystem.get('bestScore') || 0;
    const coins = SaveSystem.get('totalCoins') || 0;

    // Stats panel
    const panelW = W * 0.7;
    const panelH = 72;
    const panelX = W / 2 - panelW / 2;
    const panelY = H * 0.38;

    const panel = this.add.graphics();
    panel.fillStyle(Colors.UI_PANEL, 0.9);
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, 16);
    panel.lineStyle(1, Colors.UI_PANEL_BORDER, 0.7);
    panel.strokeRoundedRect(panelX, panelY, panelW, panelH, 16);

    this.add.text(W / 2 - panelW / 4, panelY + 14, 'BEST SCORE', {
      fontFamily: '"Exo 2", sans-serif',
      fontSize: '10px',
      color: '#888899',
      letterSpacing: 1,
    }).setOrigin(0.5, 0);

    this.add.text(W / 2 - panelW / 4, panelY + 30, String(best), {
      fontFamily: '"Orbitron", sans-serif',
      fontSize: '24px',
      fontStyle: 'bold',
      color: '#FFFFFF',
    }).setOrigin(0.5, 0);

    this.add.text(W / 2 + panelW / 4, panelY + 14, 'COINS', {
      fontFamily: '"Exo 2", sans-serif',
      fontSize: '10px',
      color: '#888899',
      letterSpacing: 1,
    }).setOrigin(0.5, 0);

    this.add.text(W / 2 + panelW / 4, panelY + 30, `🪙 ${coins}`, {
      fontFamily: '"Orbitron", sans-serif',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#FFD700',
    }).setOrigin(0.5, 0);
  }

  _createButtons(W, H) {
    // === PLAY BUTTON ===
    const playY = H * 0.57;
    const playW = W * 0.65;
    const playH = 68;

    const playBg = this.add.graphics();
    this._drawGradientButton(playBg, W / 2 - playW / 2, playY, playW, playH, Colors.GAME[1].hex, Colors.GAME[2].hex);

    const playTxt = this.add.text(W / 2, playY + playH / 2, '▶  PLAY', {
      fontFamily: '"Orbitron", "Exo 2", sans-serif',
      fontSize: '26px',
      fontStyle: 'bold',
      color: '#FFFFFF',
    }).setOrigin(0.5);

    const playZone = this.add.zone(W / 2, playY + playH / 2, playW, playH)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        AudioManager.tap();
        AdMobBridge.hideBanner().catch(() => {});
        SaveSystem.resetRevive();
        this._buttonPressAnim(playBg, playTxt, () => {
          this.scene.start('GameScene');
        });
      });

    this._addHoverEffect(playZone, playBg, playTxt, W, playY, playW, playH);

    // === SHOP BUTTON ===
    const shopY = playY + playH + 18;
    const shopW = W * 0.5;
    const shopH = 52;

    const shopBg = this.add.graphics();
    this._drawOutlineButton(shopBg, W / 2 - shopW / 2, shopY, shopW, shopH, Colors.COIN);

    const shopTxt = this.add.text(W / 2, shopY + shopH / 2, '🎨  SKINS', {
      fontFamily: '"Exo 2", sans-serif',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#FFD700',
    }).setOrigin(0.5);

    this.add.zone(W / 2, shopY + shopH / 2, shopW, shopH)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        AudioManager.tap();
        this.scene.start('ShopScene');
      });

    // === MISSIONS BUTTON ===
    const misY = shopY + shopH + 12;
    const misW = W * 0.5;
    const misH = 52;

    const misBg = this.add.graphics();
    this._drawOutlineButton(misBg, W / 2 - misW / 2, misY, misW, misH, 0x00FF99);

    const misTxt = this.add.text(W / 2, misY + misH / 2, '🎯 MISSIONS', {
      fontFamily: '"Exo 2", sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#00FF99',
    }).setOrigin(0.5);

    this.add.zone(W / 2, misY + misH / 2, misW, misH)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        AudioManager.tap();
        this.scene.start('MissionsScene');
      });

    // Pulse PLAY button
    this.tweens.add({
      targets: playBg,
      scaleX: 1.03,
      scaleY: 1.03,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  _drawGradientButton(g, x, y, w, h, c1, c2) {
    g.fillStyle(c1, 1);
    g.fillRoundedRect(x, y, w, h, 18);
    g.lineStyle(2, 0xffffff, 0.25);
    g.strokeRoundedRect(x, y, w, h, 18);
    // Shine
    g.fillStyle(0xffffff, 0.1);
    g.fillRoundedRect(x + 4, y + 4, w - 8, h / 2 - 4, 14);
  }

  _drawOutlineButton(g, x, y, w, h, color) {
    g.fillStyle(Colors.UI_PANEL, 0.8);
    g.fillRoundedRect(x, y, w, h, 14);
    g.lineStyle(2, color, 0.8);
    g.strokeRoundedRect(x, y, w, h, 14);
  }

  _buttonPressAnim(bg, txt, onComplete) {
    this.tweens.add({
      targets: [bg, txt],
      scaleX: 0.95,
      scaleY: 0.95,
      duration: 80,
      yoyo: true,
      onComplete,
    });
  }

  _addHoverEffect(zone, bg, txt, W, y, w, h) {
    zone.on('pointerover', () => {
      this.tweens.add({ targets: [bg, txt], scaleX: 1.04, scaleY: 1.04, duration: 100 });
    });
    zone.on('pointerout', () => {
      this.tweens.add({ targets: [bg, txt], scaleX: 1, scaleY: 1, duration: 100 });
    });
  }

  _createFloatingOrbs(W, H) {
    // Decorative floating color orbs in background
    Colors.GAME.forEach((c, i) => {
      const orb = this.add.graphics().setDepth(0);
      const x = [W * 0.15, W * 0.85, W * 0.1][i];
      const y = [H * 0.72, H * 0.65, H * 0.88][i];
      const r = [50, 40, 35][i];
      orb.fillStyle(c.hex, 0.07);
      orb.fillCircle(x, y, r);
      orb.fillStyle(c.hex, 0.03);
      orb.fillCircle(x, y, r * 1.6);

      this.tweens.add({
        targets: orb,
        y: -20,
        x: Phaser.Math.Between(-10, 10),
        duration: 3000 + i * 700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });
  }

  /** Tutorial modal — shown only on first launch */
  _showHowToPlay(W, H) {
    const overlay = this.add.graphics().setDepth(100);
    overlay.fillStyle(0x000000, 0.82);
    overlay.fillRect(0, 0, W, H);

    const panelW = W * 0.86;
    const panelH = H * 0.62;
    const panelX = W / 2 - panelW / 2;
    const panelY = H * 0.14;

    const panel = this.add.graphics().setDepth(101);
    panel.fillStyle(0x1A1A35, 1);
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, 20);
    panel.lineStyle(2, Colors.GAME[1].hex, 0.7);
    panel.strokeRoundedRect(panelX, panelY, panelW, panelH, 20);

    this.add.text(W / 2, panelY + 26, 'HOW TO PLAY', {
      fontFamily: '"Orbitron", sans-serif',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#FFFFFF',
    }).setOrigin(0.5, 0).setDepth(102);

    const steps = [
      { icon: '👆', title: 'SWIPE OR TAP', sub: 'Move left and right across lanes' },
      { icon: '🚧', title: 'DODGE OBSTACLES', sub: 'Avoid walls. Color changes automatically!' },
      { icon: '🏃', title: 'RUN FAR',  sub: 'Score is based on meters traveled' },
      { icon: '🪙', title: 'COLLECT COINS', sub: 'Buy skins in the shop' },
    ];

    steps.forEach((step, i) => {
      const sy = panelY + 76 + i * 70;
      // Icon circle
      const g = this.add.graphics().setDepth(102);
      g.fillStyle(Colors.GAME[i % 3].hex, 0.18);
      g.fillCircle(panelX + 36, sy + 16, 22);
      this.add.text(panelX + 36, sy + 16, step.icon, { fontSize: '22px' })
        .setOrigin(0.5, 0.5).setDepth(103);

      this.add.text(panelX + 68, sy + 4, step.title, {
        fontFamily: '"Exo 2", sans-serif',
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#FFFFFF',
      }).setDepth(103);

      this.add.text(panelX + 68, sy + 24, step.sub, {
        fontFamily: '"Exo 2", sans-serif',
        fontSize: '12px',
        color: '#888899',
      }).setDepth(103);
    });

    // GOT IT button
    const btnY = panelY + panelH - 52;
    const btnG = this.add.graphics().setDepth(102);
    btnG.fillStyle(Colors.GAME[1].hex, 1);
    btnG.fillRoundedRect(panelX + 24, btnY, panelW - 48, 44, 12);

    const btnTxt = this.add.text(W / 2, btnY + 22, "LET'S GO! ▶", {
      fontFamily: '"Exo 2", sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#FFFFFF',
    }).setOrigin(0.5).setDepth(103);

    const zone = this.add.zone(W / 2, btnY + 22, panelW - 48, 44)
      .setInteractive({ useHandCursor: true })
      .setDepth(104);

    zone.on('pointerdown', () => {
      AudioManager.tap();
      this.tweens.add({
        targets: [overlay, panel, btnG, btnTxt],
        alpha: 0,
        duration: 250,
        onComplete: () => {
          [overlay, panel, btnG, btnTxt].forEach(o => o.destroy());
          zone.destroy();
        },
      });
    });

    // Entrance animation
    panel.setAlpha(0);
    this.tweens.add({ targets: panel, alpha: 1, duration: 300, ease: 'Power2' });
  }
}
