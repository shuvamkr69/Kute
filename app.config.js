import 'dotenv/config';

export default {
  expo: {
    scheme: "Kute",
    name: "Kute",
    slug: "Kute",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/appIcon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    plugins: [
      [
        "expo-notifications",
        {
          mode: "development",
          iosDisplayInForeground: true
        }
      ]
    ],
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.dating.kute",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        googleServicesFile: "./GoogleService-Info.plist"
      }
    },
    android: {
      jsEngine: "jsc",
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
        googleServicesFile: "./google-services.json"
      },
      package: "com.dating.kute",
      permissions: ["NOTIFICATIONS"]
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      eas: {
        projectId: "cdf1fe10-b5fb-47b9-9847-db1763012342"
      },
      FACE_API_KEY: process.env.FACE_API_KEY,
      FACE_API_SECRET: process.env.FACE_API_SECRET,
      googleAndroidClientId: process.env.GOOGLE_ANDROID_CLIENT_ID,
      googleExpoClientId: process.env.GOOGLE_EXPO_CLIENT_ID,
    }
  }
};
