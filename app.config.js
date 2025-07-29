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
          iosDisplayInForeground: true,
          androidMode: "default",
          androidCollapsedTitle: "#{unread_count} new notifications",
        }
      ],
      "react-native-video"
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
        projectId: "f594befe-5db9-4f21-8da2-62d2e3f41100"
      },
      FACE_API_KEY: process.env.FACE_API_KEY,
      FACE_API_SECRET: process.env.FACE_API_SECRET,
      googleAndroidClientId:process.env.GOOGLE_ANDROID_CLIENT_ID,
      googleExpoClientId:process.env.GOOGLE_EXPO_CLIENT_ID
    }
  }
};
