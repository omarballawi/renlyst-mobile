import type { ConfigContext, ExpoConfig } from 'expo/config';

const isProduction = process.env.RENLYST_APP_VARIANT === 'production';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: isProduction ? 'Renlyst' : 'Renlyst Next',
  slug: 'renlyst',
  version: '0.2.0',
  orientation: 'portrait',
  icon: './assets/brand/renlyst-icon-v2.png',
  scheme: 'renlyst',
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier: isProduction ? 'com.renlyst.app' : 'com.renlyst.app.next',
    buildNumber: '2',
    supportsTablet: true,
    requireFullScreen: false,
    infoPlist: {
      CFBundleAllowMixedLocalizations: true,
      ITSAppUsesNonExemptEncryption: false,
      LSSupportsOpeningDocumentsInPlace: true,
      NSCameraUsageDescription:
        'Renlyst uses the camera to capture medicine packages for your private learning library.',
      NSPhotoLibraryUsageDescription:
        'Renlyst imports medicine package photos you choose for your private learning library.',
      NSPhotoLibraryAddUsageDescription:
        'Renlyst can save an exported image only when you ask it to.',
      UIFileSharingEnabled: true,
    },
  },
  android: {
    package: isProduction ? 'com.renlyst.app' : 'com.renlyst.app.next',
    adaptiveIcon: {
      backgroundColor: '#F5F0E7',
      foregroundImage: './assets/brand/renlyst-adaptive-foreground-v2.png',
      monochromeImage: './assets/brand/renlyst-adaptive-monochrome-v2.png',
    },
    predictiveBackGestureEnabled: true,
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#F7F3EC',
        image: './assets/brand/renlyst-splash-v2.png',
        imageWidth: 210,
        resizeMode: 'contain',
        dark: {
          backgroundColor: '#101A24',
          image: './assets/brand/renlyst-splash-dark-v2.png',
        },
      },
    ],
    ['expo-sqlite', { enableFTS: true }],
    'expo-sharing',
    [
      'expo-secure-store',
      {
        configureAndroidBackup: true,
        faceIDPermission: 'Allow Renlyst to unlock protected provider credentials.',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission: 'Choose medicine package photos for your private learning library.',
        cameraPermission: 'Capture medicine packages for your private learning library.',
        microphonePermission: false,
      },
    ],
    ['expo-localization', { supportedLocales: { ios: ['en', 'ar'], android: ['en', 'ar'] } }],
    'expo-notifications',
    'expo-font',
    '@react-native-community/datetimepicker',
  ],
  experiments: {
    typedRoutes: false,
  },
  web: {
    favicon: './assets/brand/renlyst-favicon-v2.png',
  },
});
