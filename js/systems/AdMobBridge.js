/**
 * ChromaDash — AdMob Bridge
 *
 * Wraps @capacitor/admob for rewarded, interstitial and banner ads.
 * Falls back gracefully in browser mode (no Capacitor runtime).
 *
 * ╔══════════════════════════════════════════════╗
 * ║  TEST IDS — Safe to use during development  ║
 * ║  Replace with PRODUCTION IDs before release ║
 * ╚══════════════════════════════════════════════╝
 */

// ─── PRODUCTION AD UNIT IDs ─────────────────────────────
// ─── PRODUCTION AD UNIT IDs ─────────────────────────────
const AD_IDS = {
  android: {
    appId:        'ca-app-pub-9365652468083873~6420290842',
    banner:       'ca-app-pub-9365652468083873/5107209173',
    interstitial: 'ca-app-pub-9365652468083873/5765684726',
    rewarded:     'ca-app-pub-9365652468083873/3751106929',
  },
  ios: {
    appId:        'ca-app-pub-9365652468083873~6420290842',
    banner:       'ca-app-pub-9365652468083873/5107209173',
    interstitial: 'ca-app-pub-9365652468083873/5765684726',
    rewarded:     'ca-app-pub-9365652468083873/3751106929',
  },
};
// ─────────────────────────────────────────────────────────────────────────────


let AdMobPlugin = null;
let isNative = false;

/**
 * Initialize AdMob. Call once on app start.
 */
async function initAdMob() {
  try {
    // Try to load Capacitor AdMob plugin (only available in native builds)
    const cap = window.Capacitor;
    if (cap && cap.isNativePlatform && cap.isNativePlatform()) {
      const module = await import('@capacitor-community/admob');
      AdMobPlugin = module.AdMob;
      isNative = true;

      const platform = cap.getPlatform(); // 'android' | 'ios'
      const ids = AD_IDS[platform] || AD_IDS.android;

      await AdMobPlugin.initialize({
        testingDevices: [],   // Add device IDs here for physical test devices
        initializeForTesting: false,
      });

      console.log('[AdMob] Initialized on', platform);
    } else {
      console.log('[AdMob] Browser mode — ads disabled, using mock callbacks');
    }
  } catch (err) {
    console.warn('[AdMob] Init failed (continuing without ads):', err);
  }
}

/**
 * Get the correct ad unit ID for current platform
 */
function getAdId(type) {
  try {
    const platform = window.Capacitor?.getPlatform() || 'android';
    return AD_IDS[platform]?.[type] || AD_IDS.android[type];
  } catch {
    return AD_IDS.android.rewarded;
  }
}

// ── BANNER ────────────────────────────────────────────────────────────────────

async function showBanner() {
  if (!isNative || !AdMobPlugin) return;
  try {
    const { BannerAdSize, BannerAdPosition } = await import('@capacitor-community/admob');
    await AdMobPlugin.showBanner({
      adId: getAdId('banner'),
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
      isTesting: false,
    });
  } catch (err) {
    console.warn('[AdMob] Banner failed:', err);
  }
}

async function hideBanner() {
  if (!isNative || !AdMobPlugin) return;
  try {
    await AdMobPlugin.hideBanner();
  } catch (err) {
    console.warn('[AdMob] Hide banner failed:', err);
  }
}

// ── INTERSTITIAL ──────────────────────────────────────────────────────────────

let interstitialReady = false;

async function prepareInterstitial() {
  if (!isNative || !AdMobPlugin) return;
  try {
    await AdMobPlugin.prepareInterstitial({
      adId: getAdId('interstitial'),
      isTesting: false,
    });
    interstitialReady = true;
  } catch (err) {
    console.warn('[AdMob] Interstitial prepare failed:', err);
    interstitialReady = false;
  }
}

/**
 * Show interstitial if ready. Non-blocking — never stops the game flow.
 * @param {Function} onClose - called when ad closes or if ad not available
 */
async function showInterstitial(onClose) {
  if (!isNative || !AdMobPlugin || !interstitialReady) {
    console.log('[AdMob] Interstitial not ready — skipping');
    if (onClose) onClose();
    return;
  }
  try {
    // Listen for dismissal
    const listener = await AdMobPlugin.addListener('interstitialAdDismissed', () => {
      listener.remove();
      interstitialReady = false;
      if (onClose) onClose();
      // Pre-load next one
      prepareInterstitial();
    });
    await AdMobPlugin.showInterstitial();
  } catch (err) {
    console.warn('[AdMob] Interstitial show failed:', err);
    interstitialReady = false;
    if (onClose) onClose();
  }
}

// ── REWARDED ──────────────────────────────────────────────────────────────────

let rewardedReady = false;

async function prepareRewarded() {
  if (!isNative || !AdMobPlugin) return;
  try {
    await AdMobPlugin.prepareRewardVideoAd({
      adId: getAdId('rewarded'),
      isTesting: false,
    });
    rewardedReady = true;
  } catch (err) {
    console.warn('[AdMob] Rewarded prepare failed:', err);
    rewardedReady = false;
  }
}

/**
 * Show rewarded ad.
 * @param {Function} onReward  - called if user completes the ad (grant reward)
 * @param {Function} onDismiss - called when ad closes (reward or not)
 */
async function showRewarded(onReward, onDismiss) {
  // Browser fallback: simulate reward after 1.5s
  if (!isNative || !AdMobPlugin) {
    console.log('[AdMob] Browser mode — simulating rewarded ad');
    setTimeout(() => {
      if (onReward) onReward();
      if (onDismiss) onDismiss();
    }, 1500);
    return;
  }

  if (!rewardedReady) {
    console.warn('[AdMob] Rewarded ad not ready');
    if (onDismiss) onDismiss();
    return;
  }

  try {
    let rewarded = false;

    const rewardListener = await AdMobPlugin.addListener('onRewardedVideoAdReward', () => {
      rewarded = true;
    });

    const dismissListener = await AdMobPlugin.addListener('onRewardedVideoAdClosed', () => {
      rewardListener.remove();
      dismissListener.remove();
      rewardedReady = false;
      if (rewarded && onReward) onReward();
      if (onDismiss) onDismiss();
      // Pre-load next one
      prepareRewarded();
    });

    await AdMobPlugin.showRewardVideoAd();
  } catch (err) {
    console.warn('[AdMob] Rewarded show failed:', err);
    rewardedReady = false;
    if (onDismiss) onDismiss();
  }
}

const AdMobBridge = {
  init: initAdMob,
  showBanner,
  hideBanner,
  prepareInterstitial,
  showInterstitial,
  prepareRewarded,
  showRewarded,
  isNative: () => isNative,
};

export default AdMobBridge;
