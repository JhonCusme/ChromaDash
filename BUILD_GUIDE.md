# ChromaDash — Android & iOS Build Guide

## Prerequisites
- Node.js 18+ installed
- Android Studio installed (✅ confirmed)
- For iOS: Xcode 14+ on macOS

---

## Step 1 — Install dependencies

```powershell
cd "c:\Users\JHON\Documents\Color Match Runner"
npm install
```

---

## Step 2 — Initialize Capacitor (first time only)

```powershell
# This creates android/ and ios/ folders
npx cap init ChromaDash com.chromadash.game --web-dir .
```

---

## Step 3 — Add Android platform

```powershell
npx cap add android
```

This creates `android/` folder with a full Android Studio project.

---

## Step 4 — Sync web assets to Android

Run this every time you change game code:

```powershell
npx cap sync android
```

---

## Step 5 — Open in Android Studio

```powershell
npx cap open android
```

In Android Studio:
1. Wait for Gradle sync to complete
2. Connect your Android device (USB debugging enabled) OR use AVD (emulator)
3. Click **Run ▶** (green play button)

---

## Step 6 — Build release APK

In Android Studio:
1. **Build → Generate Signed Bundle / APK**
2. Choose **APK**
3. Create a new keystore (save it safely!)
4. Build type: **release**

Or via command line:
```powershell
cd android
.\gradlew assembleRelease
```

APK will be at: `android\app\build\outputs\apk\release\app-release.apk`

---

## AdMob Setup (before publishing)

### 1. Create AdMob account
Go to [https://apps.admob.com](https://apps.admob.com) and create:
- App: ChromaDash (Android)
- App: ChromaDash (iOS)

### 2. Create ad units
- Banner ad unit
- Interstitial ad unit  
- Rewarded ad unit

### 3. Replace test IDs in code

Open `js/systems/AdMobBridge.js` and replace:

```javascript
// CURRENT (TEST IDs):
const AD_IDS = {
  android: {
    appId:        'ca-app-pub-3940256099942544~3347511713',
    banner:       'ca-app-pub-3940256099942544/6300978111',
    interstitial: 'ca-app-pub-3940256099942544/1033173712',
    rewarded:     'ca-app-pub-3940256099942544/5224354917',
  },
  ...
};

// REPLACE WITH YOUR PRODUCTION IDs:
const AD_IDS = {
  android: {
    appId:        'ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX',
    banner:       'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
    interstitial: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
    rewarded:     'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
  },
  ios: {
    appId:        'ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX',
    ...
  },
};
```

### 4. Update capacitor.config.json

```json
"AdMob": {
  "appId": {
    "android": "ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX",
    "ios": "ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX"
  }
}
```

---

## iOS Build (requires macOS + Xcode)

```bash
npx cap add ios
npx cap sync ios
npx cap open ios
```

In Xcode:
1. Set your Team in Signing & Capabilities
2. Set Bundle ID: `com.chromadash.game`
3. Product → Archive for App Store submission

---

## Quick Dev Workflow

```powershell
# 1. Make code changes
# 2. Sync to Android
npx cap sync android
# 3. Open Android Studio and run
npx cap open android
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Gradle sync fails | File → Invalidate Caches → Restart |
| White screen on device | Check USB debugging is enabled |
| AdMob not loading | Verify App ID in capacitor.config.json matches AdMob dashboard |
| Fonts not loading | Check internet connection (fonts loaded from Google CDN) |
