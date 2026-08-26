/**
 * ChromaDash — Missions Scene
 * Displays daily missions and allows claiming rewards.
 */
import Colors from '../config/Colors.js';
import SaveSystem from '../systems/SaveSystem.js';
import AudioManager from '../systems/AudioManager.js';
import MissionsSystem from '../systems/MissionsSystem.js';

export default class MissionsScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MissionsScene' });
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // Background
    this.add.graphics()
      .fillStyle(Colors.BG_DARK, 1)
      .fillRect(0, 0, W, H);

    // Title
    this.add.text(W / 2, 40, 'MISSIONS', {
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

    this._renderMissions();

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

  _renderMissions() {
    const W = this.scale.width;
    const missions = MissionsSystem.getMissions();
    
    const startY = 160;
    const spacing = 110;

    missions.forEach((mission, index) => {
      this._createMissionCard(mission, W / 2, startY + index * spacing);
    });
  }

  _createMissionCard(mission, x, y) {
    const W = this.scale.width;
    const rowContainer = this.add.container(x, y);

    // Background panel
    const bg = this.add.graphics();
    bg.fillStyle(mission.claimed ? 0x112211 : 0x111122, 1);
    bg.fillRoundedRect(-W * 0.4, -40, W * 0.8, 80, 10);
    bg.lineStyle(2, mission.completed && !mission.claimed ? 0x00FF99 : 0x333344);
    bg.strokeRoundedRect(-W * 0.4, -40, W * 0.8, 80, 10);
    rowContainer.add(bg);

    // Description
    const descTxt = this.add.text(-W * 0.35, -20, mission.desc, {
      fontFamily: '"Exo 2", sans-serif',
      fontSize: '16px',
      color: mission.claimed ? '#668866' : '#FFFFFF',
    }).setOrigin(0, 0.5);
    rowContainer.add(descTxt);

    // Progress text
    const progTxt = this.add.text(W * 0.35, -20, `${mission.progress} / ${mission.target}`, {
      fontFamily: '"Orbitron", sans-serif',
      fontSize: '14px',
      color: mission.completed ? '#00FF99' : '#AAAAAA',
    }).setOrigin(1, 0.5);
    rowContainer.add(progTxt);

    // Progress bar bg
    const barBg = this.add.graphics();
    barBg.fillStyle(0x000000, 0.5);
    barBg.fillRoundedRect(-W * 0.35, 5, W * 0.7, 10, 5);
    rowContainer.add(barBg);

    // Progress bar fill
    if (mission.progress > 0) {
      const fillW = (mission.progress / mission.target) * (W * 0.7);
      const barFill = this.add.graphics();
      barFill.fillStyle(mission.completed ? 0x00FF99 : 0x00AAFF, 1);
      barFill.fillRoundedRect(-W * 0.35, 5, fillW, 10, 5);
      rowContainer.add(barFill);
    }

    // Claim Button
    if (mission.completed && !mission.claimed) {
      const claimBg = this.add.graphics();
      claimBg.fillStyle(0xFFD700, 1);
      claimBg.fillRoundedRect(-W * 0.4, -40, W * 0.8, 80, 10);
      claimBg.alpha = 0.1;
      rowContainer.add(claimBg);

      const claimBtn = this.add.text(0, 25, `CLAIM ${mission.reward} COINS`, {
        fontFamily: '"Orbitron", sans-serif',
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#FFD700',
      }).setOrigin(0.5);
      rowContainer.add(claimBtn);

      const hitArea = this.add.zone(0, 0, W * 0.8, 80)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          if (MissionsSystem.claimReward(mission.id)) {
            this.scene.restart();
          }
        });
      rowContainer.add(hitArea);

      // Pulse
      this.tweens.add({
        targets: claimBtn,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 500,
        yoyo: true,
        repeat: -1
      });
    } else if (mission.claimed) {
       const doneTxt = this.add.text(0, 25, `COMPLETED`, {
        fontFamily: '"Orbitron", sans-serif',
        fontSize: '14px',
        color: '#446644',
      }).setOrigin(0.5);
      rowContainer.add(doneTxt);
    }
  }
}
