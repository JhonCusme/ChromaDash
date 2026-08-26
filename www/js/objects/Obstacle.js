/**
 * ChromaDash — Obstacle Block
 * A colored block that occupies a single lane.
 */
import GameConfig from '../config/GameConfig.js';
import Colors from '../config/Colors.js';
import AudioManager from '../systems/AudioManager.js';
import HapticsManager from '../systems/HapticsManager.js';

export const ObstacleType = {
  STATIC: 'static',
  MOVING: 'moving',
};

export default class Obstacle {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} laneIndex
   * @param {function} getLaneX - function(laneIndex) returns X coord
   * @param {number} y - spawn Y
   * @param {string} type
   */
  constructor(scene, laneIndex, getLaneX, y, type = ObstacleType.STATIC) {
    this.scene      = scene;
    this.laneIndex  = laneIndex;
    this.getLaneX   = getLaneX;
    this.y          = y;
    this.type       = type;
    this.passed     = false;
    this.destroyed  = false;
    this.timeAlive  = 0;
    
    // For MOVING obstacles
    this.targetLane = laneIndex;
    this.moveTimer  = Phaser.Math.Between(1000, 2000);

    this.graphics     = scene.add.graphics();
    this.glowGraphics = scene.add.graphics();

    this.graphics.setDepth(8);
    this.glowGraphics.setDepth(7);

    // Color based on lane
    this.color = Colors.getGame(this.laneIndex);

    this._draw();
    this._startGlowAnimation();
  }

  _draw() {
    const g   = this.graphics;
    const gg  = this.glowGraphics;
    const W   = GameConfig.LANE_WIDTH - 10; // slightly smaller than full lane
    const H   = GameConfig.OBSTACLE_HEIGHT;
    const lx  = -W / 2;

    g.clear();
    gg.clear();
    
    this.color = Colors.getGame(this.laneIndex);

    // Glow behind
    gg.fillStyle(this.color.hex, 0.2);
    gg.fillRect(lx - 10, -H / 2 - 10, W + 20, H + 20);

    // Block
    g.fillStyle(this.color.hex, 1);
    g.fillRect(lx, -H / 2, W, H);
    
    // Shine / Pattern
    g.fillStyle(0xffffff, 0.2);
    g.fillRect(lx, -H / 2, W, 8);
    
    // Danger stripes
    g.lineStyle(2, 0x000000, 0.2);
    for (let i = lx + 10; i < lx + W; i += 20) {
      g.beginPath();
      g.moveTo(i, -H / 2);
      g.lineTo(i - 10, H / 2);
      g.strokePath();
    }

    // Border glow
    g.lineStyle(3, this.color.glow, 1);
    g.strokeRect(lx, -H / 2, W, H);

    const cx = this.getLaneX(this.laneIndex);
    g.setPosition(cx, this.y);
    gg.setPosition(cx, this.y);
  }

  _startGlowAnimation() {
    this._glowTween = this.scene.tweens.add({
      targets: this.glowGraphics,
      alpha: { from: 0.5, to: 1 },
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  update(speed, delta) {
    const dy = (speed * delta) / 1000;
    this.y += dy;
    this.timeAlive += delta;
    
    // Moving logic
    if (this.type === ObstacleType.MOVING) {
      this.moveTimer -= delta;
      if (this.moveTimer <= 0) {
        // Change lane to adjacent
        const dirs = [];
        if (this.laneIndex > 0) dirs.push(-1);
        if (this.laneIndex < 2) dirs.push(1);
        this.laneIndex += dirs[Math.floor(Math.random() * dirs.length)];
        this.moveTimer = 2000; // won't move again before dying usually
        this._draw(); // Redraw with new color/pos
      }
    }

    const cx = this.getLaneX(this.laneIndex);
    this.graphics.setPosition(cx, this.y);
    this.glowGraphics.setPosition(cx, this.y);
  }

  /** Check collision result: 'pass' | 'hit' | 'shield' | 'none' */
  checkPlayer(playerLane, playerY, playerHasShield) {
    const H = GameConfig.OBSTACLE_HEIGHT;
    
    // Not vertically overlapping?
    if (playerY < this.y - H / 2 - 10 || playerY > this.y + H / 2 + 10) return 'none';

    // Overlapping vertically. Check lane.
    if (playerLane === this.laneIndex) {
       // Collision!
       if (playerHasShield) {
          this.passed = true;
          this._onSuccess(); // visually destroy it
          return 'shield';
       }
       return 'hit';
    }

    // If different lane, it's a pass once we go past it (handled externally by checking playerY < obs.y)
    return 'none';
  }

  _onSuccess() {
    for (let i = 0; i < 12; i++) {
      const px   = this.graphics.x + Phaser.Math.Between(-30, 30);
      const py   = this.y;
      const size = Phaser.Math.Between(4, 9);
      const p    = this.scene.add.rectangle(px, py, size, size, this.color.hex, 1);
      p.setDepth(25);
      this.scene.tweens.add({
        targets: p,
        x: px + Phaser.Math.Between(-50, 50),
        y: py - Phaser.Math.Between(40, 100),
        alpha: 0,
        angle: Phaser.Math.Between(0, 360),
        scaleX: 0.3,
        scaleY: 0.3,
        duration: 500,
        ease: 'Power2',
        onComplete: () => p.destroy(),
      });
    }
    
    // Hide graphics immediately
    this.graphics.setVisible(false);
    this.glowGraphics.setVisible(false);
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
  }
}
