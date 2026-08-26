/**
 * ChromaDash — Shop Scene
 * Let players buy and equip new player skins using collected coins.
 */
import Colors from '../config/Colors.js';
import SaveSystem from '../systems/SaveSystem.js';
import AudioManager from '../systems/AudioManager.js';

export default class ShopScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ShopScene' });
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // Background
    this.add.graphics()
      .fillStyle(Colors.BG_DARK, 1)
      .fillRect(0, 0, W, H);

    // Title
    this.add.text(W / 2, 40, 'SHOP', {
      fontFamily: '"Orbitron", sans-serif',
      fontSize: '32px',
      fontStyle: 'bold',
      color: '#FFFFFF',
      letterSpacing: 2,
    }).setOrigin(0.5);

    // Coins display
    this.coinsTxt = this.add.text(W / 2, 80, `🪙 ${SaveSystem.get('totalCoins')}`, {
      fontFamily: '"Exo 2", sans-serif',
      fontSize: '24px',
      color: '#FFD700',
    }).setOrigin(0.5);

    // Skins configuration
    const skins = [
      { id: 'default', name: 'BLOCK', price: 0 },
      { id: 'triangle', name: 'TRIANGLE', price: 100 },
      { id: 'diamond', name: 'DIAMOND', price: 250 },
      { id: 'star', name: 'STAR', price: 500 },
      { id: 'ghost', name: 'GHOST', price: 1000 },
    ];

    const startY = 160;
    const spacing = 80;

    skins.forEach((skin, index) => {
      this._createSkinRow(skin, W / 2, startY + index * spacing);
    });

    // Back button
    this.add.text(W / 2, H - 50, '⌂ BACK TO MENU', {
      fontFamily: '"Exo 2", sans-serif',
      fontSize: '18px',
      color: '#888899',
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        AudioManager.tap();
        this.scene.start('MenuScene');
      });
  }

  _createSkinRow(skin, x, y) {
    const W = this.scale.width;
    const isUnlocked = skin.price === 0 || SaveSystem.get('unlockedSkins').includes(skin.id);
    const isActive = SaveSystem.get('activeSkin') === skin.id;

    const rowContainer = this.add.container(x, y);

    // Background panel
    const bg = this.add.graphics();
    bg.fillStyle(isActive ? 0x224422 : 0x111122, 1);
    bg.fillRoundedRect(-W * 0.4, -30, W * 0.8, 60, 10);
    bg.lineStyle(2, isActive ? 0x00FF99 : 0x333344);
    bg.strokeRoundedRect(-W * 0.4, -30, W * 0.8, 60, 10);
    rowContainer.add(bg);

    // Name
    const nameTxt = this.add.text(-W * 0.35, 0, skin.name, {
      fontFamily: '"Orbitron", sans-serif',
      fontSize: '16px',
      color: isUnlocked ? '#FFFFFF' : '#666677',
    }).setOrigin(0, 0.5);
    rowContainer.add(nameTxt);

    // Button / Status
    let btnText = '';
    let btnColor = '#FFFFFF';
    if (isActive) {
      btnText = 'EQUIPPED';
      btnColor = '#00FF99';
    } else if (isUnlocked) {
      btnText = 'EQUIP';
      btnColor = '#00AAFF';
    } else {
      btnText = `🪙 ${skin.price}`;
      btnColor = '#FFD700';
    }

    const actionTxt = this.add.text(W * 0.35, 0, btnText, {
      fontFamily: '"Exo 2", sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
      color: btnColor,
    }).setOrigin(1, 0.5);
    rowContainer.add(actionTxt);

    // Interaction
    const hitArea = this.add.zone(0, 0, W * 0.8, 60)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        AudioManager.tap();
        if (isUnlocked && !isActive) {
          SaveSystem.setActiveSkin(skin.id);
          this.scene.restart();
        } else if (!isUnlocked) {
          if (SaveSystem.spendCoins(skin.price)) {
            SaveSystem.unlockSkin(skin.id);
            SaveSystem.setActiveSkin(skin.id);
            AudioManager.powerUp(); // celebratory sound
            this.scene.restart();
          } else {
            // Not enough coins feedback
            this.tweens.add({
              targets: actionTxt,
              x: actionTxt.x + 5,
              duration: 50,
              yoyo: true,
              repeat: 3
            });
          }
        }
      });
    rowContainer.add(hitArea);
  }
}
