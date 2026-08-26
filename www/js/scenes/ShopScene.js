/**
 * ChromaDash — Shop Scene
 * Cosmetic skins unlockable with in-game coins
 */
import Colors from '../config/Colors.js';
import SaveSystem from '../systems/SaveSystem.js';
import AudioManager from '../systems/AudioManager.js';

const SKINS = [
  { id: 'default',  name: 'CUBE',     price: 0,    desc: 'The OG runner', emoji: '⬛' },
  { id: 'triangle', name: 'SPIKE',    price: 200,  desc: 'Sharp & fast',   emoji: '🔺' },
  { id: 'star',     name: 'STAR',     price: 500,  desc: 'Shine bright',   emoji: '⭐' },
  { id: 'diamond',  name: 'CRYSTAL',  price: 1000, desc: 'Rare & sleek',   emoji: '💎' },
  { id: 'ghost',    name: 'PHANTOM',  price: 1500, desc: 'Haunting speed', emoji: '👻' },
];

export default class ShopScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ShopScene' });
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this.unlockedSkins = SaveSystem.get('unlockedSkins') || ['default'];
    this.activeSkin = SaveSystem.get('activeSkin') || 'default';
    this.coins = SaveSystem.get('totalCoins') || 0;

    this._createBackground(W, H);
    this._createHeader(W, H);
    this._createSkinList(W, H);
    this._createBackButton(W, H);
  }

  _createBackground(W, H) {
    const bg = this.add.graphics();
    bg.fillStyle(Colors.BG_DARK, 1);
    bg.fillRect(0, 0, W, H);

    // Subtle grid
    for (let y = 0; y < H; y += 60) {
      bg.lineStyle(1, 0x111130, 0.5);
      bg.beginPath(); bg.moveTo(0, y); bg.lineTo(W, y); bg.strokePath();
    }
  }

  _createHeader(W, H) {
    this.add.text(W / 2, 38, 'SKIN SHOP', {
      fontFamily: '"Orbitron", "Exo 2", sans-serif',
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#FFFFFF',
    }).setOrigin(0.5);

    this.add.text(W / 2, 70, 'Cosmetic only — no pay-to-win', {
      fontFamily: '"Exo 2", sans-serif',
      fontSize: '12px',
      color: '#555566',
    }).setOrigin(0.5);

    // Coin display
    this.coinDisplay = this.add.text(W / 2, 92, `🪙 ${this.coins}`, {
      fontFamily: '"Exo 2", sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#FFD700',
    }).setOrigin(0.5);
  }

  _createSkinList(W, H) {
    const cardH = 90;
    const cardW = W * 0.85;
    const cardX = W / 2 - cardW / 2;
    const startY = 125;
    const gap = 12;

    SKINS.forEach((skin, i) => {
      const cardY = startY + i * (cardH + gap);
      this._createSkinCard(skin, cardX, cardY, cardW, cardH, W);
    });
  }

  _createSkinCard(skin, x, y, w, h, W) {
    const isUnlocked = this.unlockedSkins.includes(skin.id);
    const isActive = this.activeSkin === skin.id;
    const isFree = skin.price === 0;
    const canAfford = this.coins >= skin.price;

    // Card bg
    const card = this.add.graphics();
    card.fillStyle(isActive ? 0x1A2A1A : Colors.UI_PANEL, 1);
    card.fillRoundedRect(x, y, w, h, 16);

    // Border
    let borderColor = Colors.UI_PANEL_BORDER;
    if (isActive) borderColor = Colors.GAME[2].hex;
    else if (isUnlocked) borderColor = Colors.GAME[1].hex;
    card.lineStyle(2, borderColor, isActive ? 1 : 0.5);
    card.strokeRoundedRect(x, y, w, h, 16);

    // Emoji preview
    this.add.text(x + 20, y + h / 2, skin.emoji, {
      fontSize: '36px',
    }).setOrigin(0, 0.5);

    // Name
    this.add.text(x + 70, y + 16, skin.name, {
      fontFamily: '"Orbitron", sans-serif',
      fontSize: '17px',
      fontStyle: 'bold',
      color: isActive ? '#00FF99' : '#FFFFFF',
    });

    // Desc
    this.add.text(x + 70, y + 40, skin.desc, {
      fontFamily: '"Exo 2", sans-serif',
      fontSize: '12px',
      color: '#666677',
    });

    // Price / status badge
    const badgeX = x + w - 12;
    const badgeY = y + h / 2;

    if (isActive) {
      this.add.text(badgeX, badgeY, '✓ ACTIVE', {
        fontFamily: '"Exo 2", sans-serif',
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#00FF99',
      }).setOrigin(1, 0.5);
    } else if (isUnlocked) {
      const equip = this.add.text(badgeX, badgeY, '  EQUIP  ', {
        fontFamily: '"Exo 2", sans-serif',
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#000000',
        backgroundColor: '#00AAFF',
        padding: { x: 10, y: 5 },
      }).setOrigin(1, 0.5);

      const zone = this.add.zone(badgeX - 45, badgeY, 90, 34).setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => {
        AudioManager.tap();
        this.activeSkin = skin.id;
        SaveSystem.setActiveSkin(skin.id);
        this.scene.restart();
      });
    } else if (!canAfford) {
      // Locked + not enough coins
      this.add.text(badgeX, badgeY - 8, `🪙 ${skin.price}`, {
        fontFamily: '"Exo 2", sans-serif',
        fontSize: '14px',
        color: '#444455',
      }).setOrigin(1, 0.5);
      this.add.text(badgeX, badgeY + 10, 'Not enough 🪙', {
        fontFamily: '"Exo 2", sans-serif',
        fontSize: '10px',
        color: '#333344',
      }).setOrigin(1, 0.5);

      // Lock icon overlay
      card.fillStyle(0x000000, 0.25);
      card.fillRoundedRect(x, y, w, h, 16);
    } else {
      // Can buy!
      const buyTxt = this.add.text(badgeX, badgeY, `🪙 ${skin.price}  BUY`, {
        fontFamily: '"Exo 2", sans-serif',
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#000000',
        backgroundColor: '#FFD700',
        padding: { x: 10, y: 5 },
      }).setOrigin(1, 0.5);

      const zone = this.add.zone(badgeX - 55, badgeY, 110, 36).setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => {
        if (SaveSystem.spendCoins(skin.price)) {
          SaveSystem.unlockSkin(skin.id);
          AudioManager.powerUp();
          this.coins = SaveSystem.get('totalCoins');
          this.scene.restart();
        }
      });
    }
  }

  _createBackButton(W, H) {
    const backW = W * 0.45;
    const backY = H - 70;

    const backG = this.add.graphics();
    backG.fillStyle(Colors.UI_PANEL, 0.9);
    backG.fillRoundedRect(W / 2 - backW / 2, backY, backW, 46, 14);
    backG.lineStyle(1, Colors.UI_PANEL_BORDER, 0.7);
    backG.strokeRoundedRect(W / 2 - backW / 2, backY, backW, 46, 14);

    this.add.text(W / 2, backY + 23, '← BACK', {
      fontFamily: '"Exo 2", sans-serif',
      fontSize: '18px',
      color: '#AAAACC',
    }).setOrigin(0.5);

    this.add.zone(W / 2, backY + 23, backW, 46)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        AudioManager.tap();
        this.scene.start('MenuScene');
      });
  }
}
