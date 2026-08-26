/**
 * ChromaDash — Coin Collectible
 * Uses native GameObjects (Arc/Image) for correct position tweening
 */
import GameConfig from '../config/GameConfig.js';
import Colors from '../config/Colors.js';
import AudioManager from '../systems/AudioManager.js';
import HapticsManager from '../systems/HapticsManager.js';

export default class Coin {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.collected = false;

    // === OUTER GLOW (graphics, static — no position tween on this) ===
    this.glowGraphics = scene.add.graphics();
    this.glowGraphics.fillStyle(Colors.COIN, 0.12);
    this.glowGraphics.fillCircle(0, 0, 18);
    this.glowGraphics.setPosition(x, y);
    this.glowGraphics.setDepth(5);

    // === MAIN COIN BODY — Arc GameObject (has real x/y, tweens correctly) ===
    this.body = scene.add.arc(x, y, 11, 0, 360, false, Colors.COIN, 1);
    this.body.setDepth(6);

    // === INNER RING ===
    this.ring = scene.add.arc(x, y, 8, 0, 360, false, 0xCC9900, 0);
    this.ring.setStrokeStyle(2, 0xCC9900, 0.8);
    this.ring.setDepth(7);

    // === SHINE DOT ===
    this.shine = scene.add.arc(x - 3, y - 3, 4, 0, 360, false, 0xFFFFFF, 0.45);
    this.shine.setDepth(8);

    // Float animation — tweeens the actual objects' y position
    this._baseY = y;
    this._floatTween = scene.tweens.add({
      targets: [this.body, this.ring, this.glowGraphics, this.shine],
      y: y - 8,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Coin flip (scale X oscillation)
    this._angle = 0;
    this._spinTimer = scene.time.addEvent({
      delay: 50,
      callback: this._spin,
      callbackScope: this,
      loop: true,
    });
  }

  _spin() {
    if (this.collected || !this.body?.active) return;
    this._angle += 0.14;
    const scale = 0.4 + Math.abs(Math.cos(this._angle)) * 0.6;
    this.body.setScale(scale, 1);
    this.ring.setScale(scale, 1);
    this.shine.setScale(scale, 1);
  }

  update(speed, delta, magnetActive, playerX, playerY) {
    if (this.collected) return;

    const dy = (speed * delta) / 1000;
    this._baseY += dy;
    this.x = this.body.x;

    // Move all parts down (the float tween offsets from current y)
    this.body.y += dy;
    this.ring.y += dy;
    this.shine.x = this.body.x - 3;
    this.shine.y = this.body.y - 3;
    this.glowGraphics.y += dy;

    if (magnetActive) {
      const dx = playerX - this.body.x;
      const dist = Math.hypot(dx, playerY - this.body.y);
      if (dist < GameConfig.COIN_MAGNET_RADIUS) {
        const force = (1 - dist / GameConfig.COIN_MAGNET_RADIUS) * 12;
        const mx = dx * force * delta / 1000;
        const my = (playerY - this.body.y) * force * delta / 1000;
        this.body.x += mx;
        this.body.y += my;
        this.ring.x += mx;
        this.ring.y += my;
        this.shine.x += mx;
        this.shine.y += my;
        this.glowGraphics.x += mx;
        this.glowGraphics.y += my;
        this.x = this.body.x;
      }
    }
  }

  checkCollect(playerX, playerY) {
    if (this.collected) return false;
    const dist = Math.hypot(playerX - this.body.x, playerY - this.body.y);
    if (dist < 28) {
      this._collect();
      return true;
    }
    return false;
  }

  _collect() {
    this.collected = true;
    if (this._spinTimer) this._spinTimer.remove();
    if (this._floatTween) this._floatTween.remove();
    AudioManager.coin();
    HapticsManager.light();

    // Particles
    for (let i = 0; i < GameConfig.PARTICLE_COUNT_COIN; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Phaser.Math.Between(50, 120);
      const size  = Phaser.Math.Between(2, 5);
      const p = this.scene.add.arc(this.body.x, this.body.y, size, 0, 360, false, Colors.COIN, 1);
      p.setDepth(20);

      this.scene.tweens.add({
        targets: p,
        x: this.body.x + Math.cos(angle) * speed,
        y: this.body.y + Math.sin(angle) * speed,
        alpha: 0,
        scaleX: 0.2,
        scaleY: 0.2,
        duration: Phaser.Math.Between(400, 600),
        ease: 'Power2',
        onComplete: () => p.destroy(),
      });
    }

    // Pop animation
    this.scene.tweens.add({
      targets: [this.body, this.ring],
      scaleX: 1.8,
      scaleY: 1.8,
      alpha: 0,
      duration: 200,
      ease: 'Power2',
      onComplete: () => this.destroy(),
    });

    // +1 text popup
    const txt = this.scene.add.text(this.body.x, this.body.y - 10, '+1', {
      fontFamily: '"Exo 2", sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: Colors.COIN_STR,
    }).setOrigin(0.5).setDepth(30);

    this.scene.tweens.add({
      targets: txt,
      y: this.body.y - 55,
      alpha: 0,
      duration: 600,
      ease: 'Power2',
      onComplete: () => txt.destroy(),
    });
  }

  isOffScreen(h) { return this.body.y > h + 30; }

  destroy() {
    if (this._spinTimer) this._spinTimer.remove();
    if (this._floatTween) this._floatTween.remove();
    this.body?.destroy();
    this.ring?.destroy();
    this.shine?.destroy();
    this.glowGraphics?.destroy();
  }
}
