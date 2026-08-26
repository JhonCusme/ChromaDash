/**
 * ChromaDash — Haptics Manager
 * Wraps Capacitor Haptics + Web Vibration API fallback
 */

let HapticsPlugin = null;

async function initHaptics() {
  try {
    const cap = window.Capacitor;
    if (cap && cap.isNativePlatform && cap.isNativePlatform()) {
      const module = await import('@capacitor/haptics');
      HapticsPlugin = module.Haptics;
    }
  } catch (e) {
    console.log('[Haptics] Native not available, using Web Vibration API');
  }
}

/**
 * Light tap — color change feedback
 */
async function tapLight() {
  if (HapticsPlugin) {
    try {
      const { ImpactStyle } = await import('@capacitor/haptics');
      await HapticsPlugin.impact({ style: ImpactStyle.Light });
    } catch (e) { /* silent */ }
  } else if (navigator.vibrate) {
    navigator.vibrate(20);
  }
}

/**
 * Medium tap — coin collected / obstacle passed
 */
async function tapMedium() {
  if (HapticsPlugin) {
    try {
      const { ImpactStyle } = await import('@capacitor/haptics');
      await HapticsPlugin.impact({ style: ImpactStyle.Medium });
    } catch (e) { /* silent */ }
  } else if (navigator.vibrate) {
    navigator.vibrate(35);
  }
}

/**
 * Heavy — crash / game over
 */
async function tapHeavy() {
  if (HapticsPlugin) {
    try {
      const { ImpactStyle } = await import('@capacitor/haptics');
      await HapticsPlugin.impact({ style: ImpactStyle.Heavy });
    } catch (e) { /* silent */ }
  } else if (navigator.vibrate) {
    navigator.vibrate([50, 30, 80]);
  }
}

const HapticsManager = {
  init: initHaptics,
  light: tapLight,
  medium: tapMedium,
  heavy: tapHeavy,
};

export default HapticsManager;
