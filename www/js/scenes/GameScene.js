/**
 * ChromaDash — Game Scene (Core Loop)
 * Main gameplay: runner + color-match + obstacles + coins + power-ups
 *
 * New in v1.1:
 * - Countdown 3-2-1-GO! before play
 * - Pause button + overlay
 * - Combo multiplier (consecutive correct passes)
 * - Speed / distance meter in HUD
 * - Distance displayed in meters
 */
import GameConfig from '../config/GameConfig.js';
import Colors from '../config/Colors.js';
import Player from '../objects/Player.js';
import Obstacle, { ObstacleType } from '../objects/Obstacle.js';
import Coin from '../objects/Coin.js';
import PowerUp, { PowerUpType } from '../objects/PowerUp.js';
import SaveSystem from '../systems/SaveSystem.js';
import AudioManager from '../systems/AudioManager.js';
import HapticsManager from '../systems/HapticsManager.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init(data) {
    this.isRevive    = data && data.revive === true;
    this.reviveScore = data ? (data.score  || 0) : 0;
    this.reviveCoins = data ? (data.coins  || 0) : 0;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    this.W = W;
    this.H = H;

    // ── STATE ──────────────────────────────────────────────────────────────────
    this.score        = this.isRevive ? this.reviveScore : 0;
    this.sessionCoins = this.isRevive ? this.reviveCoins : 0;
    this.speed        = GameConfig.OBSTACLE_START_SPEED;
    this.gameOver     = false;
    this.paused       = false;
    this.counting     = !this.isRevive; // countdown active on fresh start
    this.elapsedMs    = 0;
    this.distanceM    = this.isRevive ? this.reviveScore : 0; // meters

    // Combo system
    this.combo        = 0;
    this.comboMax     = 0;

    // Power-up timers
    this.shieldActive = false;
    this.slowmoActive = false;
    this.magnetActive = false;
    this.slowmoTimer  = 0;
    this.magnetTimer  = 0;

    // Object pools
    this.obstacles = [];
    this.coins     = [];
    this.powerups  = [];

    // Spawn timers
    this.nextObstacleIn = 1200; // give player a moment before first obstacle
    this.nextCoinIn     = 800;
    this.nextPowerupIn  = Phaser.Math.Between(6000, 10000);

    this.laneX = W / 2;

    // ── BUILD SCENE ────────────────────────────────────────────────────────────
    this._createBackground();
    this._createLane();
    this._createPlayer();
    this._createHUD();
    this._createPowerUpHUD();
    this._createPauseButton();
    this._createInputs();

    // Countdown or instant start (revive)
    if (this.isRevive) {
      this._flashScreen(Colors.GAME[2].hex, 0.2);
      AudioManager.revive();
    } else {
      this._startCountdown();
    }
  }

  // ── SCENE CREATION ──────────────────────────────────────────────────────────

  _createBackground() {
    const W = this.W, H = this.H;

    this.bg = this.add.graphics();
    this.bg.fillStyle(Colors.BG_DARK, 1);
    this.bg.fillRect(0, 0, W, H);
    this.bg.setDepth(0);

    // Scrolling grid lines
    this.gridLines  = [];
    this.gridOffset = 0;
    const lineCount = Math.ceil(H / 80) + 2;
    for (let i = 0; i < lineCount; i++) {
      const g = this.add.graphics().setDepth(1);
      g.lineStyle(1, 0x1A1A40, 1);
      g.beginPath();
      g.moveTo(0, i * 80);
      g.lineTo(W, i * 80);
      g.strokePath();
      this.gridLines.push({ g, baseY: i * 80 });
    }

    // Ambient side glows
    this.leftGlow  = this.add.graphics().setDepth(1);
    this.rightGlow = this.add.graphics().setDepth(1);
    this._updateAmbientGlow(Colors.GAME[0].hex);
  }

  _updateAmbientGlow(colorHex) {
    const W = this.W, H = this.H;
    const lx = this.laneX - GameConfig.LANE_WIDTH / 2;
    const rx = this.laneX + GameConfig.LANE_WIDTH / 2;
    this.leftGlow.clear();
    this.rightGlow.clear();
    this.leftGlow.fillStyle(colorHex, 0.06);
    this.leftGlow.fillRect(0, 0, lx, H);
    this.rightGlow.fillStyle(colorHex, 0.06);
    this.rightGlow.fillRect(rx, 0, W - rx, H);
  }

  _createLane() {
    const W = this.W, H = this.H;
    const lx = this.laneX - GameConfig.LANE_WIDTH / 2;

    this.add.graphics()
      .setDepth(2)
      .fillStyle(Colors.BG_LANE, 1)
      .fillRect(lx, 0, GameConfig.LANE_WIDTH, H);

    this.laneBorderL = this.add.graphics().setDepth(3);
    this.laneBorderR = this.add.graphics().setDepth(3);
    this._drawLaneBorders(Colors.BG_LANE_BORDER);

    // Center dashed line
    const cl = this.add.graphics().setDepth(3);
    cl.lineStyle(1, 0x252550, 0.5);
    for (let y = 0; y < H; y += 35) {
      cl.beginPath();
      cl.moveTo(this.laneX, y);
      cl.lineTo(this.laneX, y + 20);
      cl.strokePath();
    }
  }

  _drawLaneBorders(color) {
    const lx = this.laneX - GameConfig.LANE_WIDTH / 2;
    const rx = this.laneX + GameConfig.LANE_WIDTH / 2;
    const H  = this.H;
    this.laneBorderL.clear();
    this.laneBorderL.lineStyle(GameConfig.LANE_BORDER, color, 1);
    this.laneBorderL.beginPath();
    this.laneBorderL.moveTo(lx, 0);
    this.laneBorderL.lineTo(lx, H);
    this.laneBorderL.strokePath();
    this.laneBorderR.clear();
    this.laneBorderR.lineStyle(GameConfig.LANE_BORDER, color, 1);
    this.laneBorderR.beginPath();
    this.laneBorderR.moveTo(rx, 0);
    this.laneBorderR.lineTo(rx, H);
    this.laneBorderR.strokePath();
  }

  _createPlayer() {
    const skin = SaveSystem.get('activeSkin') || 'default';
    this.player = new Player(this, this.laneX, this.H * GameConfig.PLAYER_Y_RATIO, skin);
    this._updateAmbientGlow(Colors.GAME[this.player.colorIndex].hex);
  }

  _createHUD() {
    const W = this.W;

    // ── SCORE ──
    const scoreBg = this.add.graphics().setDepth(50);
    scoreBg.fillStyle(0x000000, 0.5);
    scoreBg.fillRoundedRect(W / 2 - 80, 16, 160, 54, 14);

    this.scoreLabel = this.add.text(W / 2, 24, 'SCORE', {
      fontFamily: '"Exo 2", sans-serif',
      fontSize: '10px',
      color: '#888899',
      letterSpacing: 3,
    }).setOrigin(0.5, 0).setDepth(51);

    this.scoreTxt = this.add.text(W / 2, 34, '0', {
      fontFamily: '"Orbitron", "Exo 2", sans-serif',
      fontSize: '26px',
      fontStyle: 'bold',
      color: '#FFFFFF',
    }).setOrigin(0.5, 0).setDepth(51);

    // ── BEST ──
    const best = SaveSystem.get('bestScore') || 0;
    this.bestTxt = this.add.text(W - 14, 24, `BEST\n${best}`, {
      fontFamily: '"Exo 2", sans-serif',
      fontSize: '12px',
      color: '#FFD700',
      align: 'right',
    }).setOrigin(1, 0).setDepth(51);

    // ── COINS ──
    this.coinHudTxt = this.add.text(14, 24, `🪙 0`, {
      fontFamily: '"Exo 2", sans-serif',
      fontSize: '16px',
      color: '#FFD700',
    }).setOrigin(0, 0).setDepth(51);

    // ── COMBO ──
    this.comboContainer = this.add.container(W / 2, 84).setDepth(51);
    this.comboTxt = this.add.text(0, 0, '', {
      fontFamily: '"Orbitron", sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#FF2D55',
    }).setOrigin(0.5);
    this.comboContainer.add(this.comboTxt);
    this.comboContainer.setAlpha(0);

    // ── SPEED BAR (bottom) ──
    this.speedBarBg = this.add.graphics().setDepth(51);
    this.speedBarFill = this.add.graphics().setDepth(52);
    this._drawSpeedBar(0);

    // ── COLOR BAR (bottom strip) ──
    this.colorBar = this.add.graphics().setDepth(53);
    this._drawColorBar();
  }

  _drawSpeedBar(ratio) {
    const W  = this.W, H = this.H;
    const bw = W * 0.5;
    const bh = 4;
    const bx = W / 2 - bw / 2;
    const by = H - 14;

    this.speedBarBg.clear();
    this.speedBarBg.fillStyle(0x1A1A35, 1);
    this.speedBarBg.fillRoundedRect(bx, by, bw, bh, 2);

    this.speedBarFill.clear();
    if (ratio > 0) {
      const col = ratio < 0.5 ? Colors.GAME[2].hex : ratio < 0.8 ? Colors.GAME[1].hex : Colors.GAME[0].hex;
      this.speedBarFill.fillStyle(col, 0.85);
      this.speedBarFill.fillRoundedRect(bx, by, bw * ratio, bh, 2);
    }
  }

  _drawColorBar() {
    const W = this.W, H = this.H;
    const c = Colors.getGame(this.player ? this.player.colorIndex : 0);
    this.colorBar.clear();
    this.colorBar.fillStyle(c.hex, 0.9);
    this.colorBar.fillRect(0, H - 6, W, 6);
  }

  _createPowerUpHUD() {
    const W = this.W;
    this.powerupHud = this.add.container(W / 2, 96).setDepth(51);
    this.shieldIcon = this.add.text(-60, 0, '', { fontSize: '20px' }).setOrigin(0.5);
    this.slowmoIcon = this.add.text(  0, 0, '', { fontSize: '20px' }).setOrigin(0.5);
    this.magnetIcon = this.add.text( 60, 0, '', { fontSize: '20px' }).setOrigin(0.5);
    this.powerupHud.add([this.shieldIcon, this.slowmoIcon, this.magnetIcon]);
  }

  _updatePowerUpHUD() {
    this.shieldIcon.setText(this.shieldActive ? '🛡' : '');
    this.slowmoIcon.setText(this.slowmoActive ? `⏱${Math.ceil(this.slowmoTimer / 1000)}s` : '');
    this.magnetIcon.setText(this.magnetActive ? `🧲${Math.ceil(this.magnetTimer / 1000)}s` : '');
  }

  _createPauseButton() {
    const W = this.W;
    // Pause button top-left (below coins)
    const pauseBg = this.add.graphics().setDepth(55);
    pauseBg.fillStyle(0x000000, 0.45);
    pauseBg.fillRoundedRect(10, 52, 40, 30, 8);

    this.pauseBtn = this.add.text(30, 67, '⏸', {
      fontSize: '18px',
    }).setOrigin(0.5).setDepth(56);

    this.add.zone(30, 67, 40, 30)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this._togglePause())
      .setDepth(57);
  }

  _createInputs() {
    this.input.on('pointerdown', (pointer) => {
      if (this.gameOver || this.counting || this.paused) return;
      this.player.cycleColor();
      this._drawColorBar();
      this._updateAmbientGlow(Colors.getGame(this.player.colorIndex).hex);
    });
  }

  // ── COUNTDOWN ───────────────────────────────────────────────────────────────

  _startCountdown() {
    const W = this.W, H = this.H;

    // Semi-transparent overlay
    const overlay = this.add.graphics().setDepth(80);
    overlay.fillStyle(0x000000, 0.55);
    overlay.fillRect(0, 0, W, H);

    const countTxt = this.add.text(W / 2, H * 0.42, '3', {
      fontFamily: '"Orbitron", sans-serif',
      fontSize: '96px',
      fontStyle: 'bold',
      color: '#FFFFFF',
      stroke: Colors.GAME[1].hexStr,
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(81);

    const tapHint = this.add.text(W / 2, H * 0.62, 'TAP TO CHANGE COLOR', {
      fontFamily: '"Exo 2", sans-serif',
      fontSize: '15px',
      color: '#AAAACC',
      letterSpacing: 2,
    }).setOrigin(0.5).setDepth(81);

    // Color dots hint
    const dotY = H * 0.70;
    [Colors.GAME[0], Colors.GAME[1], Colors.GAME[2]].forEach((c, i) => {
      const g = this.add.graphics().setDepth(81);
      g.fillStyle(c.hex, 1);
      g.fillCircle(W / 2 - 28 + i * 28, dotY, 9);
      g.lineStyle(2, 0xffffff, 0.4);
      g.strokeCircle(W / 2 - 28 + i * 28, dotY, 9);
    });

    const counts = ['3', '2', '1', 'GO!'];
    const colors = [Colors.GAME[0].hexStr, Colors.GAME[1].hexStr, Colors.GAME[2].hexStr, '#FFFFFF'];
    let idx = 0;

    const tick = () => {
      AudioManager.colorChange();

      countTxt.setText(counts[idx]);
      countTxt.setColor(colors[idx]);

      // Punch scale animation
      countTxt.setScale(1.4);
      this.tweens.add({
        targets: countTxt,
        scaleX: 1,
        scaleY: 1,
        duration: 220,
        ease: 'Back.easeOut',
      });

      idx++;
      if (idx < counts.length) {
        this.time.delayedCall(idx < 3 ? 900 : 600, tick);
      } else {
        // GO! shown — start game
        this.time.delayedCall(400, () => {
          this.tweens.add({
            targets: [overlay, countTxt, tapHint],
            alpha: 0,
            duration: 300,
            onComplete: () => {
              overlay.destroy();
              countTxt.destroy();
              tapHint.destroy();
              this.counting = false;
            },
          });
        });
      }
    };

    tick();
  }

  // ── PAUSE ───────────────────────────────────────────────────────────────────

  _togglePause() {
    if (this.gameOver || this.counting) return;
    this.paused = !this.paused;

    if (this.paused) {
      this._showPauseOverlay();
      this.pauseBtn.setText('▶');
      AudioManager.tap();
    } else {
      this._hidePauseOverlay();
      this.pauseBtn.setText('⏸');
      AudioManager.tap();
    }
  }

  _showPauseOverlay() {
    const W = this.W, H = this.H;
    this.pauseOverlay = this.add.graphics().setDepth(70);
    this.pauseOverlay.fillStyle(0x000000, 0.7);
    this.pauseOverlay.fillRect(0, 0, W, H);

    this.pauseTitle = this.add.text(W / 2, H * 0.38, '⏸ PAUSED', {
      fontFamily: '"Orbitron", sans-serif',
      fontSize: '36px',
      fontStyle: 'bold',
      color: '#FFFFFF',
    }).setOrigin(0.5).setDepth(71);

    this.pauseResumeTxt = this.add.text(W / 2, H * 0.52, 'TAP TO RESUME', {
      fontFamily: '"Exo 2", sans-serif',
      fontSize: '18px',
      color: '#00AAFF',
      letterSpacing: 3,
    }).setOrigin(0.5).setDepth(71);

    this.tweens.add({
      targets: this.pauseResumeTxt,
      alpha: { from: 1, to: 0.3 },
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // Menu shortcut
    const menuTxt = this.add.text(W / 2, H * 0.65, '⌂  QUIT TO MENU', {
      fontFamily: '"Exo 2", sans-serif',
      fontSize: '15px',
      color: '#888899',
    }).setOrigin(0.5).setDepth(71);

    this._pauseMenuBtn = this.add.zone(W / 2, H * 0.65, 200, 36)
      .setInteractive({ useHandCursor: true })
      .setDepth(72)
      .on('pointerdown', () => {
        AudioManager.tap();
        this.scene.start('MenuScene');
      });

    this._pauseObjects = [this.pauseOverlay, this.pauseTitle, this.pauseResumeTxt, menuTxt];

    // Tap anywhere on overlay to resume
    this.input.once('pointerdown', () => {
      if (this.paused) this._togglePause();
    });
  }

  _hidePauseOverlay() {
    if (this._pauseObjects) {
      this._pauseObjects.forEach(o => o.destroy());
      this._pauseObjects = null;
    }
    if (this._pauseMenuBtn) {
      this._pauseMenuBtn.destroy();
      this._pauseMenuBtn = null;
    }
  }

  // ── UPDATE LOOP ─────────────────────────────────────────────────────────────

  update(time, delta) {
    if (this.gameOver || this.paused || this.counting) return;

    this.elapsedMs += delta;

    this._updateDifficulty(delta);
    this._scrollGrid(delta);
    this._updateSpawners(delta);
    this._updateObstacles(delta);
    this._updateCoins(delta);
    this._updatePowerUps(delta);
    this.player.updateTrail();
    this._updateScore(delta);
    this._updatePowerUpTimers(delta);
  }

  _updateDifficulty(delta) {
    let targetSpeed = GameConfig.OBSTACLE_START_SPEED
      + (this.elapsedMs / 1000) * GameConfig.OBSTACLE_SPEED_INCREMENT;
    targetSpeed = Math.min(targetSpeed, GameConfig.OBSTACLE_MAX_SPEED);
    if (this.slowmoActive) targetSpeed *= 0.5;
    this.speed += (targetSpeed - this.speed) * 0.03;

    // Update speed bar
    const ratio = (this.speed - GameConfig.OBSTACLE_START_SPEED)
      / (GameConfig.OBSTACLE_MAX_SPEED - GameConfig.OBSTACLE_START_SPEED);
    this._drawSpeedBar(Math.max(0, Math.min(1, ratio)));
  }

  _scrollGrid(delta) {
    const dy = (this.speed * GameConfig.BG_SCROLL_SPEED_RATIO * delta) / 1000;
    this.gridOffset = (this.gridOffset + dy) % 80;
    this.gridLines.forEach(({ g, baseY }) => {
      const y = ((baseY + this.gridOffset) % (this.H + 80)) - 40;
      g.clear();
      g.lineStyle(1, 0x1A1A40, 1);
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(this.W, y);
      g.strokePath();
    });
  }

  _updateSpawners(delta) {
    // Obstacles
    this.nextObstacleIn -= delta;
    if (this.nextObstacleIn <= 0) {
      this._spawnObstacle();
      const elapsed = this.elapsedMs;
      const minI = Math.max(
        GameConfig.OBSTACLE_SPAWN_INTERVAL_MIN_HARD,
        GameConfig.OBSTACLE_SPAWN_INTERVAL_MIN - elapsed / 100
      );
      this.nextObstacleIn = Phaser.Math.Between(minI, GameConfig.OBSTACLE_SPAWN_INTERVAL_MAX);
    }

    // Coins
    this.nextCoinIn -= delta;
    if (this.nextCoinIn <= 0) {
      this._spawnCoinGroup();
      this.nextCoinIn = Phaser.Math.Between(700, 1600);
    }

    // Power-ups
    this.nextPowerupIn -= delta;
    if (this.nextPowerupIn <= 0) {
      this._spawnPowerUp();
      this.nextPowerupIn = Phaser.Math.Between(8000, 14000);
    }
  }

  _spawnObstacle() {
    const elapsed = this.elapsedMs;
    let type = ObstacleType.SINGLE;
    if (elapsed > GameConfig.DIFFICULTY_HARD * 1000) {
      const r = Math.random();
      if (r < 0.25) type = ObstacleType.DOUBLE;
      else if (r < 0.40) type = ObstacleType.RAPID;
    } else if (elapsed > GameConfig.DIFFICULTY_MEDIUM * 1000) {
      if (Math.random() < 0.12) type = ObstacleType.DOUBLE;
    }

    const colorIndex = Math.floor(Math.random() * GameConfig.COLOR_COUNT);

    if (type === ObstacleType.DOUBLE) {
      const c2 = (colorIndex + 1) % GameConfig.COLOR_COUNT;
      this.obstacles.push(new Obstacle(this, this.laneX, -60,  colorIndex, ObstacleType.SINGLE, GameConfig.LANE_WIDTH));
      this.obstacles.push(new Obstacle(this, this.laneX, -130, c2,         ObstacleType.SINGLE, GameConfig.LANE_WIDTH));
    } else {
      this.obstacles.push(new Obstacle(this, this.laneX, -60, colorIndex, type, GameConfig.LANE_WIDTH));
    }
  }

  _spawnCoinGroup() {
    const count   = Phaser.Math.Between(3, 7);
    const pattern = Math.random() < 0.5 ? 'line' : 'zigzag';
    for (let i = 0; i < count; i++) {
      let cx = this.laneX;
      if (pattern === 'zigzag') cx += (i % 2 === 0 ? -32 : 32);
      this.coins.push(new Coin(this, cx, -40 - i * 44));
    }
  }

  _spawnPowerUp() {
    const types = [PowerUpType.SHIELD, PowerUpType.SLOWMO, PowerUpType.MAGNET];
    const type  = types[Math.floor(Math.random() * types.length)];
    this.powerups.push(new PowerUp(this, this.laneX + Phaser.Math.Between(-44, 44), -60, type));
  }

  _updateObstacles(delta) {
    const px = this.player.x;
    const py = this.player.y;
    const pc = this.player.colorIndex;
    const ps = this.player.hasShield;

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.update(this.speed, delta);

      const result = obs.checkPlayer(px, py, pc, ps);
      if (result === 'hit') {
        this._triggerGameOver();
        return;
      } else if (result === 'shield') {
        this.player.consumeShield();
        this.shieldActive = false;
        this._flashLaneBorder(Colors.SHIELD);
        this._showFloatingText('SHIELD!', Colors.SHIELD);
      } else if (result === 'pass') {
        this._onObstaclePassed();
      }

      if (obs.isOffScreen(this.H)) {
        obs.destroy();
        this.obstacles.splice(i, 1);
      }
    }
  }

  _onObstaclePassed() {
    this.combo++;
    if (this.combo > this.comboMax) this.comboMax = this.combo;

    if (this.combo >= 3) {
      this._showCombo();
      // Bonus score for high combo
      const bonus = Math.floor(this.combo * 2);
      this.score += bonus;
      this._showFloatingText(`+${bonus} COMBO x${this.combo}`, Colors.GAME[2].hex);
    }
  }

  _showCombo() {
    if (this.combo < 3) return;
    this.comboTxt.setText(`🔥 COMBO x${this.combo}`);
    this.comboContainer.setAlpha(1);

    this.tweens.killTweensOf(this.comboContainer);
    this.tweens.add({
      targets: this.comboContainer,
      scaleX: 1.15,
      scaleY: 1.15,
      duration: 120,
      yoyo: true,
      onComplete: () => {
        this.tweens.add({
          targets: this.comboContainer,
          alpha: 0,
          delay: 1200,
          duration: 400,
        });
      },
    });
  }

  _updateCoins(delta) {
    const px = this.player.x;
    const py = this.player.y;
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const coin = this.coins[i];
      coin.update(this.speed, delta, this.magnetActive, px, py);
      if (coin.checkCollect(px, py)) {
        this.sessionCoins++;
        this.coinHudTxt.setText(`🪙 ${this.sessionCoins}`);
        // Coin pulse on HUD
        this.tweens.add({
          targets: this.coinHudTxt,
          scaleX: 1.3, scaleY: 1.3,
          duration: 80, yoyo: true,
        });
        this.coins.splice(i, 1);
        continue;
      }
      if (coin.isOffScreen(this.H)) {
        coin.destroy();
        this.coins.splice(i, 1);
      }
    }
  }

  _updatePowerUps(delta) {
    const px = this.player.x;
    const py = this.player.y;
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const pu = this.powerups[i];
      pu.update(this.speed, delta);
      if (pu.checkCollect(px, py)) {
        this._activatePowerUp(pu.type);
        this.powerups.splice(i, 1);
        continue;
      }
      if (pu.isOffScreen(this.H)) {
        pu.destroy();
        this.powerups.splice(i, 1);
      }
    }
  }

  _activatePowerUp(type) {
    switch (type) {
      case PowerUpType.SHIELD:
        this.shieldActive = true;
        this.player.activateShield();
        this._showFloatingText('🛡 SHIELD!', Colors.SHIELD);
        break;
      case PowerUpType.SLOWMO:
        this.slowmoActive = true;
        this.slowmoTimer  = GameConfig.POWERUP_SLOWMO_DURATION;
        this._flashScreen(Colors.SLOWMO, 0.1);
        this._showFloatingText('⏱ SLOW-MO!', Colors.SLOWMO);
        break;
      case PowerUpType.MAGNET:
        this.magnetActive = true;
        this.magnetTimer  = GameConfig.POWERUP_MAGNET_DURATION;
        this._flashScreen(Colors.MAGNET, 0.1);
        this._showFloatingText('🧲 MAGNET!', Colors.MAGNET);
        break;
    }
    this._updatePowerUpHUD();
  }

  _updatePowerUpTimers(delta) {
    if (this.slowmoActive) {
      this.slowmoTimer -= delta;
      if (this.slowmoTimer <= 0) { this.slowmoActive = false; this.slowmoTimer = 0; }
    }
    if (this.magnetActive) {
      this.magnetTimer -= delta;
      if (this.magnetTimer <= 0) { this.magnetActive = false; this.magnetTimer = 0; }
    }
    this._updatePowerUpHUD();
  }

  _updateScore(delta) {
    const gained = (this.speed / GameConfig.SCORE_SPEED_DIVISOR) * delta / 1000 * 10;
    this.score = Math.floor(this.score + gained);
    this.distanceM = Math.floor(this.distanceM + gained);
    this.scoreTxt.setText(String(this.score));
  }

  // ── FLOATING TEXT ────────────────────────────────────────────────────────────

  _showFloatingText(text, color = 0xFFFFFF) {
    const W  = this.W;
    const py = this.H * 0.35;
    const t  = this.add.text(W / 2, py, text, {
      fontFamily: '"Exo 2", sans-serif',
      fontSize: '20px',
      fontStyle: 'bold',
      color: typeof color === 'string' ? color : `#${color.toString(16).padStart(6, '0')}`,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(60);

    this.tweens.add({
      targets: t,
      y: py - 60,
      alpha: 0,
      duration: 900,
      ease: 'Power2',
      onComplete: () => t.destroy(),
    });
  }

  // ── GAME OVER ────────────────────────────────────────────────────────────────

  _triggerGameOver() {
    if (this.gameOver) return;
    this.gameOver = true;

    // Reset combo on death
    this.combo = 0;

    AudioManager.gameOver();
    HapticsManager.heavy();
    this.player.emitHitParticles();

    this.cameras.main.shake(GameConfig.SHAKE_DURATION, GameConfig.SHAKE_INTENSITY / 1000);
    this._flashScreen(0xFF2D55, 0.4);

    // Dramatic slow-motion death
    this.tweens.timeScale = 0.25;
    this.time.delayedCall(150, () => { this.tweens.timeScale = 1; });

    this.time.delayedCall(520, () => {
      const isNew       = SaveSystem.updateBestScore(this.score);
      SaveSystem.addCoins(this.sessionCoins);
      const showIntAd   = SaveSystem.recordGameEnd();

      this.scene.start('GameOverScene', {
        score:            this.score,
        bestScore:        SaveSystem.get('bestScore'),
        coins:            this.sessionCoins,
        isNewBest:        isNew,
        showInterstitial: showIntAd,
        canRevive:        SaveSystem.canRevive(),
        comboMax:         this.comboMax,
      });
    });
  }

  // ── HELPERS ──────────────────────────────────────────────────────────────────

  _flashScreen(colorHex, alpha = 0.3) {
    const flash = this.add.graphics().setDepth(90);
    flash.fillStyle(colorHex, alpha);
    flash.fillRect(0, 0, this.W, this.H);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 300,
      onComplete: () => flash.destroy(),
    });
  }

  _flashLaneBorder(colorHex) {
    this._drawLaneBorders(colorHex);
    this.time.delayedCall(280, () => this._drawLaneBorders(Colors.BG_LANE_BORDER));
  }
}
