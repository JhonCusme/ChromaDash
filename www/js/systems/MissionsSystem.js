/**
 * ChromaDash — Missions System
 * Manages daily missions generation, progress, and rewards.
 */
import SaveSystem from './SaveSystem.js';
import AudioManager from './AudioManager.js';

const MISSION_TEMPLATES = [
  { type: 'distance',   desc: 'Run {target}m total',        targets: [500, 1000, 2000, 5000],  rewards: [50, 100, 250, 600] },
  { type: 'coins',      desc: 'Collect {target} coins',     targets: [50, 100, 200, 500],      rewards: [20, 50, 100, 250] },
  { type: 'dodges',     desc: 'Dodge {target} obstacles',   targets: [20, 50, 100, 250],       rewards: [20, 50, 100, 250] },
  { type: 'combo',      desc: 'Reach Combo x{target}',      targets: [5, 10, 15, 20],          rewards: [10, 50, 100, 300] },
];

const MissionsSystem = {
  
  /** Initialize missions, generate new ones if day changed */
  init() {
    this._checkDailyReset();
  },

  _getTodayString() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  },

  _checkDailyReset() {
    const today = this._getTodayString();
    const lastDate = SaveSystem.get('lastMissionDate');

    if (lastDate !== today || !SaveSystem.get('dailyMissions') || SaveSystem.get('dailyMissions').length === 0) {
      this._generateNewMissions();
      SaveSystem.set('lastMissionDate', today);
    }
  },

  _generateNewMissions() {
    const missions = [];
    
    // Pick 3 random unique mission types
    const available = [...MISSION_TEMPLATES];
    
    for (let i = 0; i < 3; i++) {
      if (available.length === 0) break;
      const idx = Math.floor(Math.random() * available.length);
      const template = available.splice(idx, 1)[0];
      
      // Pick random difficulty
      const diffIdx = Math.floor(Math.random() * template.targets.length);
      
      missions.push({
        id: `m_${Date.now()}_${i}`,
        type: template.type,
        desc: template.desc.replace('{target}', template.targets[diffIdx]),
        target: template.targets[diffIdx],
        progress: 0,
        reward: template.rewards[diffIdx],
        completed: false,
        claimed: false
      });
    }
    
    SaveSystem.set('dailyMissions', missions);
  },

  getMissions() {
    this._checkDailyReset();
    return SaveSystem.get('dailyMissions') || [];
  },

  /** Add progress to a specific mission type */
  addProgress(type, amount, isMax = false) {
    if (amount <= 0) return;
    
    let missions = this.getMissions();
    let updated = false;

    missions.forEach(m => {
      if (m.type === type && !m.completed) {
        if (isMax) {
          if (amount > m.progress) {
             m.progress = amount;
             updated = true;
          }
        } else {
          m.progress += amount;
          updated = true;
        }

        if (m.progress >= m.target) {
          m.progress = m.target;
          m.completed = true;
          updated = true;
        }
      }
    });

    if (updated) {
      SaveSystem.set('dailyMissions', missions);
    }
  },

  /** Claim reward for a completed mission */
  claimReward(missionId) {
    let missions = this.getMissions();
    let success = false;
    
    missions.forEach(m => {
      if (m.id === missionId && m.completed && !m.claimed) {
        m.claimed = true;
        SaveSystem.addCoins(m.reward);
        success = true;
        AudioManager.powerUp();
      }
    });
    
    if (success) {
      SaveSystem.set('dailyMissions', missions);
    }
    return success;
  }
};

export default MissionsSystem;
