import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform, Vibration } from "react-native";

// Function to trigger vibration for matches
export const triggerMatchVibration = () => {
  console.log("🎯 triggerMatchVibration called");
  try {
    if (Platform.OS === "ios") {
      // iOS pattern: [wait, vibrate, wait, vibrate, ...]
      console.log("📱 iOS: Triggering match vibration pattern");
      Vibration.vibrate([0, 500, 200, 500, 200, 300]);
    } else {
      // Android pattern
      console.log("🤖 Android: Triggering match vibration pattern");
      Vibration.vibrate([0, 500, 300, 500, 300, 700]);
    }
    console.log("✅ Match vibration triggered successfully");
  } catch (error) {
    console.error("❌ Error triggering match vibration:", error);
  }
};

export const registerForPushNotifications = async (): Promise<string | null> => {
  try {
    console.log("🚀 Starting push notification registration...");
    
    if (!Device.isDevice) {
      console.log("❌ Must use a physical device for push notifications");
      return null;
    }

    // Request permission
    console.log("📋 Checking notification permissions...");
    const { status } = await Notifications.getPermissionsAsync();
    console.log("📋 Current permission status:", status);
    
    if (status !== "granted") {
      console.log("🔔 Requesting notification permissions...");
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      console.log("🔔 New permission status:", newStatus);
      
      if (newStatus !== "granted") {
        console.log("❌ Push notification permission denied");
        return null;
      }
    }

    // Configure notification channels for Android
    if (Platform.OS === "android") {
      console.log("🤖 Setting up Android notification channels...");
      
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
        sound: "default",
        enableVibrate: true,
        showBadge: true,
      });

      // Create a special channel for match notifications
      await Notifications.setNotificationChannelAsync("match", {
        name: "Match Notifications",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 300, 500, 300, 700],
        lightColor: "#de822c",
        sound: "default",
        enableVibrate: true,
        showBadge: true,
        enableLights: true,
      });
      
      console.log("✅ Android notification channels configured");
    }

    // Get Expo push token
    console.log("🔑 Getting Expo push token...");
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log("✅ Expo Push Token obtained:", token ? `${token.substring(0, 20)}...` : "FAILED");
    
    if (token) {
      await AsyncStorage.setItem("pushToken", token); // Store token for later use
      console.log("💾 Push token stored in AsyncStorage");
    }
    
    return token;
  } catch (error) {
    console.error("❌ Error getting push token:", error);
    return null;
  }
};
