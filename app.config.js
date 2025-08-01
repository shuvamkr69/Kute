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
          icon: "./assets/icon.png",
          color: "#ffffff",
          defaultChannel: "default",
          sounds: ["./assets/notification-sound.wav"],
          mode: "production"
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
      },
      config: {
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY
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
      permissions: [
        "android.permission.INTERNET",
        "android.permission.VIBRATE",
        "android.permission.WAKE_LOCK",
        "android.permission.RECEIVE_BOOT_COMPLETED",
        "android.permission.POST_NOTIFICATIONS"
      ],
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY
        }
      }
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
      googleExpoClientId:process.env.GOOGLE_EXPO_CLIENT_ID,
      GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY
    }
  }
};
