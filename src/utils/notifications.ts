import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const registerForPushNotifications = async (): Promise<string | null> => {
  try {
    if (!Device.isDevice) {
      console.log("❌ Must use a physical device for push notifications");
      return null;
    }

    // Request permission
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      if (newStatus !== "granted") {
        console.log("❌ Push notification permission denied");
        return null;
      }
    }

    // Get Expo push token
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log("✅ Expo Push Token:", token);
    await AsyncStorage.setItem("pushToken", token); // Store token for later use
    return token;
  } catch (error) {
    console.error("❌ Error getting push token:", error);
    return null;
  }
};
