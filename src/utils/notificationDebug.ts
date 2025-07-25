import * as Notifications from "expo-notifications";
import { triggerMatchVibration } from "./notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "./api";

/**
 * Test utility to verify if notifications and vibrations work
 * Add this to any screen for testing purposes
 */

// Test local notifications
export const testLocalNotification = async () => {
  try {
    console.log("🧪 Testing local notification...");
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🧪 Test Notification",
        body: "This is a test to verify notifications work!",
        data: { test: true },
      },
      trigger: null, // Show immediately
    });
    
    console.log("✅ Test notification scheduled");
  } catch (error) {
    console.error("❌ Error scheduling test notification:", error);
  }
};

// Test match notification with vibration
export const testMatchNotification = async () => {
  try {
    console.log("🧪 Testing match notification with vibration...");
    
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

// Test vibration only
export const testVibration = () => {
  console.log("🧪 Testing vibration...");
  triggerMatchVibration();
  console.log("✅ Vibration test completed");
};

// Check notification permissions and settings
export const checkNotificationStatus = async () => {
  try {
    const permissions = await Notifications.getPermissionsAsync();
    console.log("📱 Notification Permissions:", permissions);
    
    const pushToken = await AsyncStorage.getItem("pushToken");
    console.log("🔑 Stored Push Token:", pushToken ? `${pushToken.substring(0, 20)}...` : "NONE");
    
    return { permissions, pushToken };
  } catch (error) {
    console.error("❌ Error checking notification status:", error);
    return null;
  }
};

// Test backend notification endpoints
export const testBackendNotification = async () => {
  try {
    console.log("🧪 Testing backend notification...");
    
    const response = await api.post('/api/v1/test/test-notification');
    
    console.log("📤 Backend test result:", response.data);
    
    if (response.data.success) {
      console.log("✅ Backend notification test successful");
    } else {
      console.log("❌ Backend notification test failed:", response.data.error);
    }
    
  } catch (error) {
    console.error("❌ Error testing backend notification:", error);
  }
};

// Test backend match notification
export const testBackendMatchNotification = async () => {
  try {
    console.log("🧪 Testing backend match notification...");
    
    const response = await api.post('/api/v1/test/test-match-notification');
    
    console.log("📤 Backend match test result:", response.data);
    
    if (response.data.success) {
      console.log("✅ Backend match notification test successful");
    } else {
      console.log("❌ Backend match notification test failed:", response.data.error);
    }
    
  } catch (error) {
    console.error("❌ Error testing backend match notification:", error);
  }
};

// Test complete notification flow
export const testCompleteFlow = async () => {
  console.log("🎯 Starting complete notification test flow...");
  
  // 1. Check permissions
  await checkNotificationStatus();
  
  // 2. Test local notification
  await testLocalNotification();
  
  // 3. Test backend notification
  await testBackendNotification();
  
  // Wait 3 seconds
  setTimeout(async () => {
    // 4. Test match notification with vibration
    await testMatchNotification();
    
    // 5. Test backend match notification
    setTimeout(async () => {
      await testBackendMatchNotification();
    }, 2000);
  }, 3000);
  
  console.log("✅ Complete test flow initiated");
};

/**
 * Add these test buttons to any screen for debugging:
 * 
 * import { testLocalNotification, testMatchNotification, testVibration, checkNotificationStatus, testBackendNotification, testBackendMatchNotification, testCompleteFlow } from '../utils/notificationDebug';
 * 
 * <TouchableOpacity onPress={testLocalNotification} style={{padding: 10, backgroundColor: 'blue', margin: 5}}>
 *   <Text style={{color: 'white'}}>Test Local Notification</Text>
 * </TouchableOpacity>
 * 
 * <TouchableOpacity onPress={testMatchNotification} style={{padding: 10, backgroundColor: 'green', margin: 5}}>
 *   <Text style={{color: 'white'}}>Test Match Notification + Vibration</Text>
 * </TouchableOpacity>
 * 
 * <TouchableOpacity onPress={testBackendNotification} style={{padding: 10, backgroundColor: 'orange', margin: 5}}>
 *   <Text style={{color: 'white'}}>Test Backend Notification</Text>
 * </TouchableOpacity>
 * 
 * <TouchableOpacity onPress={testBackendMatchNotification} style={{padding: 10, backgroundColor: 'red', margin: 5}}>
 *   <Text style={{color: 'white'}}>Test Backend Match Notification</Text>
 * </TouchableOpacity>
 * 
 * <TouchableOpacity onPress={testVibration} style={{padding: 10, backgroundColor: 'purple', margin: 5}}>
 *   <Text style={{color: 'white'}}>Test Vibration Only</Text>
 * </TouchableOpacity>
 * 
 * <TouchableOpacity onPress={checkNotificationStatus} style={{padding: 10, backgroundColor: 'gray', margin: 5}}>
 *   <Text style={{color: 'white'}}>Check Notification Status</Text>
 * </TouchableOpacity>
 * 
 * <TouchableOpacity onPress={testCompleteFlow} style={{padding: 10, backgroundColor: 'black', margin: 5}}>
 *   <Text style={{color: 'white'}}>Test Complete Flow</Text>
 * </TouchableOpacity>
 */
