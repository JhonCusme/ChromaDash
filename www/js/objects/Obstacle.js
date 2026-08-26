/**
 * ChromaDash — Obstacle Gate
 * A colored gate that the player must match to pass through.
 *
 * Architecture: Graphics draw at (0,0) relative coords.
 * Position is tracked via this.y (logical) and graphics.setPosition(x, y).
 */
import GameConfig from '../config/GameConfig.js';
import Colors from '../config/Colors.js';
import AudioManager from '../systems/AudioManager.js';
import HapticsManager from '../systems/HapticsManager.js';

export const ObstacleType = {
  SINGLE: 'single',
  DOUBLE: 'double',
  RAPID:  'rapid',
};

export default class Obstacle {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} centerX - lane center X
   * @param {number} y       - spawn Y (above screen, e.g. -60)
   * @param {number} colorIndex
   * @param {string} type
   * @param {number} laneWidth
   */
  constructor(scene, centerX, y, colorIndex, type = ObstacleType.SINGLE, laneWidth = GameConfig.LANE_WIDTH) {
    this.scene      = scene;
    this.centerX    = centerX;
    this.y          = y;           // logical center Y
    this.colorIndex = colorIndex;
    this.type       = type;
    this.laneWidth  = laneWidth;
    this.passed     = false;
    this.destroyed  = false;

    // Graphics draw RELATIVE to their own position (0,0 = gate center)
    this.graphics     = scene.add.graphics();
    this.glowGraphics = scene.add.graphics();

    this.graphics.setDepth(8);
    this.glowGraphics.setDepth(7);

    // Color label
    const color = Colors.getGame(colorIndex);
    this.label = scene.add.text(centerX, y, color.name, {
      fontFamily: '"Exo 2", "Orbitron", sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: color.hexStr,
      alpha: 0.85,
    }).setOrigin(0.5, 0.5).setDepth(9);

    this._draw();
    this._startGlowAnimation();
  }

  /** Draw at (0,0) local coords — graphics.setPosition() handles world position */
  _draw() {
    const g   = this.graphics;
    const gg  = this.glowGraphics;
    const color = Colors.getGame(this.colorIndex);
    const W     = this.laneWidth;
    const H     = GameConfig.OBSTACLE_HEIGHT;
    const GAP   = this.type === ObstacleType.RAPID
      ? GameConfig.OBSTACLE_GAP * 0.75
      : GameConfig.OBSTACLE_GAP;
    const halfGap  = GAP / 2;
    const lx       = this.centerX - W / 2;
    const leftBarW = W / 2 - halfGap;

    g.clear();
    gg.clear();

    // Glow behind (drawn at world coords, positioned via setPosition)
    gg.fillStyle(color.hex, 0.08);
    gg.fillRect(lx - 10, -H / 2 - 4, W + 20, H + 8);

    // Left bar
    g.fillStyle(color.hex, 1);
    g.fillRect(lx, -H / 2, leftBarW, H);

    // Right bar
    g.fillRect(lx + W / 2 + halfGap, -H / 2, leftBarW, H);

    // Shine
    g.fillStyle(0xffffff, 0.18);
    g.fillRect(lx, -H / 2, leftBarW, 4);
    g.fillRect(lx + W / 2 + halfGap, -H / 2, leftBarW, 4);

    // Gap guide lines
    g.lineStyle(2, color.hex, 0.6);
    g.beginPath();
    g.moveTo(this.centerX - halfGap, -H / 2 - 8);
    g.lineTo(this.centerX - halfGap,  H / 2 + 8);
    g.moveTo(this.centerX + halfGap, -H / 2 - 8);
    g.lineTo(this.centerX + halfGap,  H / 2 + 8);
    g.strokePath();

    // Color border glow
    g.lineStyle(3, color.glow, 1);
    g.strokeRect(lx, -H / 2, leftBarW, H);
    g.strokeRect(lx + W / 2 + halfGap, -H / 2, leftBarW, H);

    // Position at current world Y
    g.setPosition(0, this.y);
    gg.setPosition(0, this.y);
    this.label.setPosition(this.centerX, this.y);
    this.label.setColor(color.hexStr);
  }

  _startGlowAnimation() {
    this._glowTween = this.scene.tweens.add({
      targets: this.glowGraphics,
      alpha: { from: 0.5, to: 1 },
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /** Move the obstacle downward each frame */
  update(speed, delta) {
    const dy = (speed * delta) / 1000;
    this.y += dy;
    // Update graphics world position
    this.graphics.y     = this.y;
    this.glowGraphics.y = this.y;
    this.label.y        = this.y;
  }

  /** Check collision result: 'pass' | 'hit' | 'shield' | 'none' */
  checkPlayer(playerX, playerY, playerColorIndex, playerHasShield) {
    const H       = GameConfig.OBSTACLE_HEIGHT;
    const GAP     = this.type === ObstacleType.RAPID
      ? GameConfig.OBSTACLE_GAP * 0.75
      : GameConfig.OBSTACLE_GAP;
    const halfGap = GAP / 2;

    // Vertical overlap?
    if (playerY < this.y - H / 2 - 8 || playerY > this.y + H / 2 + 8) return 'none';

    const inGap     = playerX > this.centerX - halfGap + 6 && playerX < this.centerX + halfGap - 6;
    const colorMatch = playerColorIndex === this.colorIndex;

    if (!this.passed) {
      if (inGap && colorMatch) {
        this.passed = true;
        this._onSuccess();
        return 'pass';
      } else if (!inGap) {
        if (playerHasShield) {
          this.passed = true;
          return 'shield';
        }
        return 'hit';
      }
    }
    return 'none';
  }

  _onSuccess() {
    // Success burst — Arc GameObjects so position tweening works correctly
    const color = Colors.getGame(this.colorIndex);
    for (let i = 0; i < 10; i++) {
      const px   = this.centerX + Phaser.Math.Between(-30, 30);
      const py   = this.y;
      const size = Phaser.Math.Between(3, 7);
      const p    = this.scene.add.arc(px, py, size, 0, 360, false, color.hex, 1);
      p.setDepth(25);
      this.scene.tweens.add({
        targets: p,
        x: px + Phaser.Math.Between(-40, 40),
        y: py - Phaser.Math.Between(30, 80),
        alpha: 0,
        scaleX: 0.3,
        scaleY: 0.3,
        duration: 400,
        ease: 'Power2',
        onComplete: () => p.destroy(),
      });
    }
    AudioManager.colorMatch();
    HapticsManager.medium();
  }

  isOffScreen(screenHeight) {
    return this.y > screenHeight + 80;
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    if (this._glowTween) this._glowTween.remove();
    this.graphics.destroy();
    this.glowGraphics.destroy();
    this.label.destroy();
  }
}
