/**
 * ChromaDash — Player Object
 * Handles color cycling, visual state, and skin rendering
 */
import GameConfig from '../config/GameConfig.js';
import Colors from '../config/Colors.js';
import AudioManager from '../systems/AudioManager.js';
import HapticsManager from '../systems/HapticsManager.js';

export default class Player {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {string} skinId
   */
  constructor(scene, x, y, skinId = 'default') {
    this.scene = scene;
    this.colorIndex = 0;
    this.shieldActive = false;
    this.isChangingColor = false;
    this.skinId = skinId;

    // === GLOW BACKGROUND (behind player) ===
    this.glow = scene.add.graphics();
    this.glow.setDepth(5);

    // === MAIN PLAYER GRAPHICS ===
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(10);

    // Position
    this.x = x;
    this.y = y;

    // Trail effect
    this.trail = scene.add.graphics();
    this.trail.setDepth(4);
    this.trailPoints = [];

    // Color label (the colored indicator dots)
    this.colorDots = this._createColorDots();

    // Draw initial state
    this._draw();

    // Pulse tween
    this._startPulseTween();
  }

  _createColorDots() {
    const dots = [];
    const spacing = 22;
    const startX = this.x - spacing;
    for (let i = 0; i < 3; i++) {
      const g = this.scene.add.graphics();
      g.setDepth(12);
      const c = Colors.GAME[i];
      g.fillStyle(c.hex, 1);
      g.fillCircle(startX + i * spacing, this.y + 42, 6);
      dots.push(g);
    }
    return dots;
  }

  _updateColorDots() {
    const spacing = 22;
    const startX = this.x - spacing;
    this.colorDots.forEach((dot, i) => {
      dot.clear();
      const c = Colors.GAME[i];
      const isActive = (i === this.colorIndex);
      dot.fillStyle(c.hex, isActive ? 1 : 0.3);
      dot.fillCircle(startX + i * spacing, this.y + 42, isActive ? 8 : 5);
      if (isActive) {
        dot.lineStyle(2, 0xffffff, 0.6);
        dot.strokeCircle(startX + i * spacing, this.y + 42, 9);
      }
    });
  }

  /** Draw the player shape based on skin */
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
      glow.strokeCircle(this.x, this.y, size * 0.9);
      glow.lineStyle(2, Colors.SHIELD, 0.4);
      glow.strokeCircle(this.x, this.y, size * 1.1);
    }

    // Outer glow
    glow.fillStyle(color.hex, 0.12);
    glow.fillCircle(this.x, this.y, size * 1.3);
    glow.fillStyle(color.hex, 0.07);
    glow.fillCircle(this.x, this.y, size * 1.7);

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

    this._updateColorDots();
  }

  _drawRoundedSquare(g, size) {
    const h = size * 0.85;
    g.fillRoundedRect(this.x - h / 2, this.y - h / 2, h, h, 10);
    g.strokeRoundedRect(this.x - h / 2, this.y - h / 2, h, h, 10);
  }

  _drawTriangle(g, size) {
    const pts = [
      { x: this.x, y: this.y - size * 0.7 },
      { x: this.x + size * 0.6, y: this.y + size * 0.45 },
      { x: this.x - size * 0.6, y: this.y + size * 0.45 },
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
      const px = this.x + Math.cos(angle) * r;
      const py = this.y + Math.sin(angle) * r;
      i === 0 ? g.moveTo(px, py) : g.lineTo(px, py);
    }
    g.closePath();
    g.fillPath();
    g.strokePath();
  }

  _drawDiamond(g, size) {
    const h = size * 0.9;
    g.beginPath();
    g.moveTo(this.x, this.y - h * 0.55);
    g.lineTo(this.x + h * 0.4, this.y);
    g.lineTo(this.x, this.y + h * 0.55);
    g.lineTo(this.x - h * 0.4, this.y);
    g.closePath();
    g.fillPath();
    g.strokePath();
  }

  _drawGhost(g, size, strokeOnly = false) {
    const w = size * 0.85;
    const h = size * 0.95;
    const x = this.x - w / 2;
    const y = this.y - h / 2;
    g.beginPath();
    g.moveTo(x, y + h);
    g.lineTo(x, y + h * 0.45);
    g.arc(this.x, y + h * 0.45, w / 2, Math.PI, 0, false);
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

  /** Called by scene on every tap */
  cycleColor() {
    if (this.isChangingColor) return;
    this.isChangingColor = true;

    const prevIndex = this.colorIndex;
    this.colorIndex = (this.colorIndex + 1) % GameConfig.COLOR_COUNT;
    const newColor = Colors.getGame(this.colorIndex);

    AudioManager.colorChange();
    HapticsManager.light();

    // Flash white then new color
    this.scene.tweens.add({
      targets: this.graphics,
      scaleX: 1.25,
      scaleY: 1.25,
      duration: 60,
      yoyo: true,
      onComplete: () => {
        this._draw();
        this.isChangingColor = false;
      },
    });

    // Burst particles
    this._emitColorParticles(newColor);

    return this.colorIndex;
  }

  _emitColorParticles(colorData) {
    const scene = this.scene;
    for (let i = 0; i < GameConfig.PARTICLE_COUNT_CHANGE; i++) {
      const angle = (i / GameConfig.PARTICLE_COUNT_CHANGE) * Math.PI * 2;
      const speed = Phaser.Math.Between(60, 150);
      const size  = Phaser.Math.Between(3, 8);

      // Use Arc (real GameObject with x/y position) so tweening works correctly
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

      // Rectangle particle — use real GameObject so tween x/y works correctly
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
  get bounds() {
    const s = GameConfig.PLAYER_SIZE * 0.7;
    return new Phaser.Geom.Rectangle(this.x - s, this.y - s, s * 2, s * 2);
  }

  destroy() {
    this.graphics.destroy();
    this.glow.destroy();
    this.trail.destroy();
    this.colorDots.forEach(d => d.destroy());
  }
}
