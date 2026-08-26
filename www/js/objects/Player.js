/**
 * ChromaDash — Player Object
 * Handles 3-lane movement, automatic color switching, and skin rendering
 */
import GameConfig from '../config/GameConfig.js';
import Colors from '../config/Colors.js';
import AudioManager from '../systems/AudioManager.js';
import HapticsManager from '../systems/HapticsManager.js';

export default class Player {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} initialLane
   * @param {function} getLaneX - function(laneIndex) returns X coordinate
   * @param {number} y
   * @param {string} skinId
   */
  constructor(scene, initialLane, getLaneX, y, skinId = 'default') {
    this.scene = scene;
    this.currentLane = initialLane;
    this.getLaneX = getLaneX;
    this.y = y;
    this.x = getLaneX(initialLane);
    this.colorIndex = initialLane; // Color matches lane
    this.shieldActive = false;
    this.skinId = skinId;
    this.isSwitching = false;

    // === GLOW BACKGROUND ===
    this.glow = scene.add.graphics();
    this.glow.setDepth(5);

    // === MAIN PLAYER GRAPHICS ===
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(10);

    // Position them
    this.glow.setPosition(this.x, this.y);
    this.graphics.setPosition(this.x, this.y);

    // Trail effect
    this.trail = scene.add.graphics();
    this.trail.setDepth(4);
    this.trailPoints = [];

    // Removed colorDots (no longer needed for manual cycle)

    // Draw initial state
    this._draw();

    // Pulse tween
    this._startPulseTween();
  }

  /** Draw the player shape based on skin at (0,0) */
  _draw() {
    const g = this.graphics;
    const glow = this.glow;
    const color = Colors.getGame(this.colorIndex);
    const size = GameConfig.PLAYER_SIZE;

    g.clear();
    glow.clear();

    // Shield aura
    if (this.shieldActive) {
      glow.lineStyle(4, Colors.SHIELD, 0.9);
      glow.strokeCircle(0, 0, size * 0.9);
      glow.lineStyle(2, Colors.SHIELD, 0.4);
      glow.strokeCircle(0, 0, size * 1.1);
    }

    // Outer glow
    glow.fillStyle(color.hex, 0.12);
    glow.fillCircle(0, 0, size * 1.3);
    glow.fillStyle(color.hex, 0.07);
    glow.fillCircle(0, 0, size * 1.7);

    // Draw skin shape
    g.fillStyle(color.hex, 1);
    g.lineStyle(3, 0xffffff, 0.8);

    switch (this.skinId) {
      case 'triangle':
        this._drawTriangle(g, size);
        break;
      case 'star':
        this._drawStar(g, size * 0.7, size * 0.38);
        break;
      case 'diamond':
        this._drawDiamond(g, size);
        break;
      case 'ghost':
        g.fillStyle(color.hex, 0.7);
        this._drawGhost(g, size);
        g.lineStyle(3, 0xffffff, 0.5);
        this._drawGhost(g, size, true);
        break;
      default: // rounded square
        this._drawRoundedSquare(g, size);
    }
  }

  _drawRoundedSquare(g, size) {
    const h = size * 0.85;
    g.fillRoundedRect(-h / 2, -h / 2, h, h, 10);
    g.strokeRoundedRect(-h / 2, -h / 2, h, h, 10);
  }

  _drawTriangle(g, size) {
    const pts = [
      { x: 0, y: -size * 0.7 },
      { x: size * 0.6, y: size * 0.45 },
      { x: -size * 0.6, y: size * 0.45 },
    ];
    g.fillTriangle(pts[0].x, pts[0].y, pts[1].x, pts[1].y, pts[2].x, pts[2].y);
    g.strokeTriangle(pts[0].x, pts[0].y, pts[1].x, pts[1].y, pts[2].x, pts[2].y);
  }

  _drawStar(g, outerR, innerR) {
    const points = 5;
    const step = Math.PI / points;
    g.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = i * step - Math.PI / 2;
      const px = Math.cos(angle) * r;
      const py = Math.sin(angle) * r;
      i === 0 ? g.moveTo(px, py) : g.lineTo(px, py);
    }
    g.closePath();
    g.fillPath();
    g.strokePath();
  }

  _drawDiamond(g, size) {
    const h = size * 0.9;
    g.beginPath();
    g.moveTo(0, -h * 0.55);
    g.lineTo(h * 0.4, 0);
    g.lineTo(0, h * 0.55);
    g.lineTo(-h * 0.4, 0);
    g.closePath();
    g.fillPath();
    g.strokePath();
  }

  _drawGhost(g, size, strokeOnly = false) {
    const w = size * 0.85;
    const h = size * 0.95;
    const x = -w / 2;
    const y = -h / 2;
    g.beginPath();
    g.moveTo(x, y + h);
    g.lineTo(x, y + h * 0.45);
    g.arc(0, y + h * 0.45, w / 2, Math.PI, 0, false);
    g.lineTo(x + w, y + h);
    // Wavy bottom
    const waves = 3;
    for (let i = 0; i < waves; i++) {
      const wx = x + w - (i + 0.5) * (w / waves);
      g.lineTo(wx, y + h * 0.82);
    }
    g.closePath();
    strokeOnly ? g.strokePath() : g.fillPath();
  }

  _startPulseTween() {
    this.scene.tweens.add({
      targets: this.graphics,
      scaleX: 1.04,
      scaleY: 1.04,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /** Move to a different lane */
  moveToLane(laneIndex) {
    if (laneIndex < 0 || laneIndex > 2 || laneIndex === this.currentLane) return;
    
    this.currentLane = laneIndex;
    this.colorIndex = laneIndex;
    this.isSwitching = true;
    
    const newX = this.getLaneX(this.currentLane);
    const newColor = Colors.getGame(this.colorIndex);

    AudioManager.colorChange();
    HapticsManager.light();

    // Tween position
    this.scene.tweens.add({
      targets: this,
      x: newX,
      duration: GameConfig.PLAYER_LANE_SWITCH_SPEED,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        this.graphics.x = this.x;
        this.glow.x = this.x;
      },
      onComplete: () => {
        this.isSwitching = false;
      }
    });

    // Flash white then new color
    this.scene.tweens.add({
      targets: this.graphics,
      scaleX: 1.25,
      scaleY: 1.25,
      duration: 60,
      yoyo: true,
      onComplete: () => {
        this._draw();
      },
    });

    // Burst particles
    this._emitColorParticles(newColor);
  }

  _emitColorParticles(colorData) {
    const scene = this.scene;
    for (let i = 0; i < GameConfig.PARTICLE_COUNT_CHANGE; i++) {
      const angle = (i / GameConfig.PARTICLE_COUNT_CHANGE) * Math.PI * 2;
      const speed = Phaser.Math.Between(60, 150);
      const size  = Phaser.Math.Between(3, 8);

      const p = scene.add.arc(this.x, this.y, size, 0, 360, false, colorData.hex, 1);
      p.setDepth(20);

      scene.tweens.add({
        targets: p,
        x: this.x + Math.cos(angle) * speed * 0.5,
        y: this.y + Math.sin(angle) * speed * 0.5,
        alpha: 0,
        scaleX: 0.2,
        scaleY: 0.2,
        duration: 350,
        ease: 'Power2',
        onComplete: () => p.destroy(),
      });
    }
  }

  /** Emit hit particles on collision */
  emitHitParticles() {
    const scene = this.scene;
    const color = Colors.getGame(this.colorIndex);
    for (let i = 0; i < GameConfig.PARTICLE_COUNT_HIT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Phaser.Math.Between(80, 220);
      const sz    = Phaser.Math.Between(4, 12);

      const p = scene.add.rectangle(
        this.x, this.y,
        sz, sz,
        color.hex, 1
      );
      p.setDepth(30);

      scene.tweens.add({
        targets: p,
        x: this.x + Math.cos(angle) * speed * 0.8,
        y: this.y + Math.sin(angle) * speed * 0.8,
        alpha: 0,
        angle: Phaser.Math.Between(0, 360),
        scaleX: 0.3,
        scaleY: 0.3,
        duration: 500 + Math.random() * 300,
        ease: 'Power2',
        onComplete: () => p.destroy(),
      });
    }
  }

  activateShield() {
    this.shieldActive = true;
    this._draw();
    AudioManager.powerUp();
  }

  consumeShield() {
    this.shieldActive = false;
    this._draw();
    HapticsManager.medium();
  }

  updateTrail() {
    this.trailPoints.unshift({ x: this.x, y: this.y, color: Colors.getGame(this.colorIndex).hex });
    if (this.trailPoints.length > 12) this.trailPoints.pop();

    this.trail.clear();
    this.trailPoints.forEach((pt, i) => {
      const alpha = (1 - i / this.trailPoints.length) * 0.25;
      const size = (1 - i / this.trailPoints.length) * (GameConfig.PLAYER_SIZE * 0.5);
      this.trail.fillStyle(pt.color, alpha);
      this.trail.fillCircle(pt.x, pt.y + i * 3, size);
    });
  }

  get currentColorIndex() { return this.colorIndex; }
  get hasShield() { return this.shieldActive; }

  destroy() {
    this.graphics.destroy();
    this.glow.destroy();
    this.trail.destroy();
  }
}
