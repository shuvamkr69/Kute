import * as Notifications from "expo-notifications";
import { triggerMatchVibration } from "./notifications";

/**
 * Test utility to verify notification functionality
 * Call this function to test if notifications work when app is in foreground
 */
export const testLocalNotification = async () => {
  try {
    // Schedule a test notification immediately
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🧪 Test Notification",
        body: "This is a test to verify notifications work in foreground!",
        data: { test: true },
      },
      trigger: null, // Show immediately
    });
    
    console.log("✅ Test notification scheduled");
  } catch (error) {
    console.error("❌ Error scheduling test notification:", error);
  }
};

/**
 * Test match notification with vibration
 */
export const testMatchNotification = async () => {
  try {
    // Schedule a test match notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🎉 Test Match!",
        body: "This is a test match notification with vibration!",
        data: { 
          type: "match",
          matchedUserId: "test123",
          matchedUserName: "Test User",
          matchedUserImage: "https://via.placeholder.com/150"
        },
        sound: "default",
      },
      trigger: null, // Show immediately
    });
    
    // Trigger vibration for testing
    triggerMatchVibration();
    console.log("✅ Test match notification sent with vibration!");
  } catch (error) {
    console.error("❌ Error sending test match notification:", error);
  }
};

/**
 * Test utility to check notification permissions and settings
 */
export const checkNotificationStatus = async () => {
  try {
    const permissions = await Notifications.getPermissionsAsync();
    console.log("📱 Notification Permissions:", permissions);
    
    return { permissions };
  } catch (error) {
    console.error("❌ Error checking notification status:", error);
    return null;
  }
};

/**
 * Test backend notification sending
 */
export const testBackendNotification = async (pushToken: string) => {
  try {
    // This would typically be done from your backend
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: pushToken,
        sound: "default",
        title: "🔔 Backend Test",
        body: "Test notification from backend (simulated)",
        data: { source: "backend-test" },
        priority: "high",
        channelId: "default",
      }),
    });

    const result = await response.json();
    console.log("🚀 Backend notification test result:", result);
    return result;
  } catch (error) {
    console.error("❌ Error testing backend notification:", error);
    return null;
  }
};
