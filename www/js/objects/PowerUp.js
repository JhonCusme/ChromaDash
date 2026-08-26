/**
 * ChromaDash — Power-Up Object
 * Three types: Shield, Slow-mo, Magnet
 * Uses correct position management: draw at (0,0), use setPosition for world position.
 */
import GameConfig from '../config/GameConfig.js';
import Colors from '../config/Colors.js';
import AudioManager from '../systems/AudioManager.js';

export const PowerUpType = {
  SHIELD: 'shield',
  SLOWMO: 'slowmo',
  MAGNET: 'magnet',
};

const POWERUP_STYLES = {
  [PowerUpType.SHIELD]: { color: Colors.SHIELD, symbol: '🛡', label: 'SHIELD' },
  [PowerUpType.SLOWMO]: { color: Colors.SLOWMO, symbol: '⏱', label: 'SLOW-MO' },
  [PowerUpType.MAGNET]: { color: Colors.MAGNET, symbol: '🧲', label: 'MAGNET' },
};

export default class PowerUp {
  constructor(scene, x, y, type = PowerUpType.SHIELD) {
    this.scene     = scene;
    this.x         = x;
    this.y         = y;
    this.type      = type;
    this.collected = false;
    this.style     = POWERUP_STYLES[type];

    // Graphics draws at (0,0), positioned via setPosition
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(7);
    this._drawLocal();

    // Label text (positioned directly)
    this.labelText = scene.add.text(x, y + 28, this.style.label, {
      fontFamily: '"Exo 2", sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(8);

    // Emoji symbol
    this.symbolText = scene.add.text(x, y, this.style.symbol, {
      fontSize: '22px',
    }).setOrigin(0.5, 0.5).setDepth(9);

    // Float animation — directly tween the text/symbol positions
    this._floatTween = scene.tweens.add({
      targets: [this.symbolText, this.labelText],
      y: `-=10`,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Glow pulse on graphics
    this._glowTween = scene.tweens.add({
      targets: this.graphics,
      alpha: { from: 0.7, to: 1 },
      duration: 500,
      yoyo: true,
      repeat: -1,
    });
  }

  /** Draw hexagon at local (0,0) — world pos set via graphics.setPosition */
  _drawLocal() {
    const g    = this.graphics;
    const c    = this.style.color;
    const size = GameConfig.POWERUP_SIZE;

    g.clear();

    // Outer glow
    g.fillStyle(c, 0.12);
    g.fillCircle(0, 0, size * 1.5);

    // Main hex
    g.fillStyle(c, 0.9);
    g.lineStyle(3, 0xffffff, 0.6);
    this._drawHex(g, 0, 0, size * 0.72);

    // Inner dark hex
    g.fillStyle(0x000000, 0.3);
    this._drawHex(g, 0, 0, size * 0.5, true);

    // Set world position
    this.graphics.setPosition(this.x, this.y);
  }

  _drawHex(g, cx, cy, r, inner = false) {
    g.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      const px = cx + r * Math.cos(angle);
      const py = cy + r * Math.sin(angle);
      i === 0 ? g.moveTo(px, py) : g.lineTo(px, py);
    }
    g.closePath();
    inner ? g.fillPath() : (g.fillPath(), g.strokePath());
  }

  update(speed, delta) {
    if (this.collected) return;
    const dy = (speed * delta) / 1000;
    this.y += dy;

    // Move all visual elements
    this.graphics.y += dy;
    this.symbolText.y += dy;
    this.labelText.y  += dy;
  }

  checkCollect(playerX, playerY) {
    if (this.collected) return false;
    const dist = Math.hypot(playerX - this.x, playerY - this.y);
    if (dist < 38) {
      this._collect();
      return true;
    }
    return false;
  }

  _collect() {
    this.collected = true;
    if (this._floatTween) this._floatTween.remove();
    if (this._glowTween)  this._glowTween.remove();

    AudioManager.powerUp();

    // Burst expand
    this.scene.tweens.add({
      targets: this.graphics,
      scaleX: 2.5,
      scaleY: 2.5,
      alpha: 0,
      duration: 350,
      ease: 'Power2',
      onComplete: () => this.destroy(),
    });

    this.scene.tweens.add({
      targets: [this.symbolText, this.labelText],
      y: this.y - 60,
      alpha: 0,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 400,
      ease: 'Power2',
    });
  }

  isOffScreen(h) { return this.y > h + 50; }

  destroy() {
    if (this._floatTween) this._floatTween.remove();
    if (this._glowTween)  this._glowTween.remove();
    this.graphics.destroy();
    this.symbolText.destroy();
    this.labelText.destroy();
  }
}
