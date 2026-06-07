// app.config.js
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
      // Override by setting EXPO_PUBLIC_API_URL in your environment
      // For local dev on iPhone via Expo Go, use your machine's LAN IP:
      //   e.g. EXPO_PUBLIC_API_URL=http://192.168.x.x:8000/api/v1 npx expo start
      // For production, point to your Render URL.
      apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
    },
  },
};
