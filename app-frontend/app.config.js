// app.config.js
// ─── PRODUCTION API URL ────────────────────────────────────────────────────────
// iPhone hits this Render URL directly — works even when laptop is OFF.
const PROD_API_URL = 'https://personal-os-c6lc.onrender.com/api/v1';

export default {
  expo: {
    name: 'Personal OS',
    slug: 'personal-os',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'dark',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#0f0f0f',
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.raghav.personalos',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#0f0f0f',
      },
      package: 'com.raghav.personalos',
    },
    plugins: ['expo-secure-store'],
    extra: {
      // Priority: env var (local dev LAN IP) → hardcoded production URL
      // For local dev on iPhone via Expo Go, use your machine's LAN IP:
      //   EXPO_PUBLIC_API_URL=http://192.168.x.x:8000/api/v1 npx expo start
      // When laptop is OFF, app falls back to PROD_API_URL automatically.
      apiUrl: process.env.EXPO_PUBLIC_API_URL || PROD_API_URL,
      eas: {
        projectId: '5c2ae4b2-300a-45eb-adf6-4c8ae5926d6f',
      },
    },
  },
};
