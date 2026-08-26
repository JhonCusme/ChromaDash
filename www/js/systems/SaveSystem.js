/**
 * ChromaDash — Save System
 * Wraps localStorage for game persistence
 */
const SAVE_KEY = 'chromadash_save_v1';

const DEFAULT_SAVE = {
  bestScore: 0,
  totalCoins: 0,
  sessionCoins: 0,       // coins earned this session (not yet saved)
  gamesPlayed: 0,        // total games played (for interstitial counter)
  gamesForAd: 0,         // counter for interstitial ad trigger
  unlockedSkins: ['default'],
  activeSkin: 'default',
  hasUsedRevive: false,  // reset each game
  settings: {
    sfx: true,
    music: true,
    haptics: true,
  },
};

const SaveSystem = {
  _data: null,

  /** Load save data from localStorage */
  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        this._data = { ...DEFAULT_SAVE, ...JSON.parse(raw) };
        // Deep merge settings
        this._data.settings = { ...DEFAULT_SAVE.settings, ...this._data.settings };
      } else {
        this._data = { ...DEFAULT_SAVE };
      }
    } catch (e) {
      console.warn('[SaveSystem] Failed to load, using defaults:', e);
      this._data = { ...DEFAULT_SAVE };
    }
    return this._data;
  },

  /** Persist current data to localStorage */
  save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this._data));
    } catch (e) {
      console.warn('[SaveSystem] Failed to save:', e);
    }
  },

  /** Get a value */
  get(key) {
    if (!this._data) this.load();
    return this._data[key];
  },

  /** Set a value and auto-save */
  set(key, value) {
    if (!this._data) this.load();
    this._data[key] = value;
    this.save();
  },

  /** Update best score if new score is higher. Returns true if new record. */
  updateBestScore(score) {
    if (!this._data) this.load();
    const isNew = score > this._data.bestScore;
    if (isNew) {
      this._data.bestScore = score;
      this.save();
    }
    return isNew;
  },

  /** Add coins and save */
  addCoins(amount) {
    if (!this._data) this.load();
    this._data.totalCoins += amount;
    this.save();
    return this._data.totalCoins;
  },

  /** Spend coins. Returns true if successful, false if not enough */
  spendCoins(amount) {
    if (!this._data) this.load();
    if (this._data.totalCoins < amount) return false;
    this._data.totalCoins -= amount;
    this.save();
    return true;
  },

  /** Unlock a skin. Returns true if newly unlocked. */
  unlockSkin(skinId) {
    if (!this._data) this.load();
    if (this._data.unlockedSkins.includes(skinId)) return false;
    this._data.unlockedSkins.push(skinId);
    this.save();
    return true;
  },

  /** Set active skin */
  setActiveSkin(skinId) {
    if (!this._data) this.load();
    this._data.activeSkin = skinId;
    this.save();
  },

  /** Increment games played, return whether to show interstitial */
  recordGameEnd() {
    if (!this._data) this.load();
    this._data.gamesPlayed++;
    this._data.gamesForAd++;
    const showAd = this._data.gamesForAd >= 3;
    if (showAd) this._data.gamesForAd = 0;
    this.save();
    return showAd;
  },

  /** Toggle a setting */
  toggleSetting(key) {
    if (!this._data) this.load();
    this._data.settings[key] = !this._data.settings[key];
    this.save();
    return this._data.settings[key];
  },

  /** Reset revive flag for new game */
  resetRevive() {
    if (!this._data) this.load();
    this._data.hasUsedRevive = false;
    this.save();
  },

  /** Mark revive as used */
  useRevive() {
    if (!this._data) this.load();
    this._data.hasUsedRevive = true;
    this.save();
  },

  /** Check if revive is available */
  canRevive() {
    if (!this._data) this.load();
    return !this._data.hasUsedRevive;
  },

  /** Full reset (debug only) */
  resetAll() {
    this._data = { ...DEFAULT_SAVE };
    this.save();
  },
};

export default SaveSystem;
