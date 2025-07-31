import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import AppNavigation from "./src/navigation/AppNavigation";
import { AuthProvider, useAuth } from "./src/navigation/AuthContext";
import { RegistrationProvider } from "./src/navigation/RegistrationContext";
import SplashScreenComponent from "./src/components/SplashScreen";
import { registerForPushNotifications, triggerMatchVibration } from "./src/utils/notifications";
import api from "./src/utils/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { decode as atob, encode as btoa } from 'base-64';
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as Notifications from "expo-notifications";

// Configure how notifications are handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    // Check notification type for enhanced handling
    const notificationType = notification.request.content.data?.type;
    const isMatchNotification = notificationType === "match";
    const isMessageNotification = notificationType === "message";
    
    console.log("🔧 Notification handler called for:", notification.request.content.title);
    console.log("🔧 Notification type:", notificationType);
    
    return {
      shouldShowAlert: true, // Always show alert
      shouldPlaySound: true, // Always play sound
      shouldSetBadge: false,
      // Set priority based on notification type
      priority: isMatchNotification 
        ? Notifications.AndroidImportance.MAX 
        : isMessageNotification 
          ? Notifications.AndroidImportance.HIGH 
          : Notifications.AndroidImportance.DEFAULT,
    };
  },
});

const tokenCache = {
  async getToken(key) {
    return SecureStore.getItemAsync(key);
  },
  async saveToken(key, value) {
    return SecureStore.setItemAsync(key, value);
  },
};

// Polyfill atob (needed for jwt-decode)
if (!global.atob) {
  global.atob = atob;
}

if (!global.btoa) {
  global.btoa = btoa;
}


const MainApp = () => {
  const { isSignedIn, loading } = useAuth(); // Fetch user authentication state
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  
  useEffect(() => {
    // Set up notification listeners
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log("🔔 Notification received while app is open:", notification);
      console.log("🔍 Notification data:", notification.request.content.data);
      
      // Check if it's a match notification and trigger vibration
      if (notification.request.content.data?.type === "match") {
        console.log("🎉 Match notification received - triggering vibration!");
        triggerMatchVibration();
        console.log("✅ Vibration triggered for match notification");
      } else if (notification.request.content.data?.type === "message") {
        console.log("💬 Message notification received:", {
          from: notification.request.content.data.senderName,
          message: notification.request.content.title
        });
      }
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log("👆 User tapped notification:", response);
      
      const data = response.notification.request.content.data;
      
      // Handle match notification tap
      if (data?.type === "match") {
        console.log("User tapped match notification!");
        // You can add navigation logic here if needed
      } else if (data?.type === "message") {
        console.log("User tapped message notification:", {
          conversationId: data.conversationId,
          senderId: data.senderId,
          senderName: data.senderName
        });
        // Note: Navigation logic can be added here if needed
        // Example: navigate to chat screen with conversationId
      }
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, []);

  useEffect(() => {
    const updatePushToken = async () => {
      // Only update push token if user is signed in
      if (!isSignedIn) {
        console.log("🚫 User not signed in, skipping push token update");
        return;
      }

      const token = await registerForPushNotifications();

      if (token) {
        const storedToken = await AsyncStorage.getItem("pushToken");
        const userToken = await AsyncStorage.getItem("accessToken"); // Get JWT
        console.log("User JWT:", userToken ? "✅ Present" : "❌ Missing");
        console.log("Current Push Token:", token);
        console.log("Stored Push Token:", storedToken);
        
        if (storedToken !== token && userToken) {
          // Send to backend only if token changed and user is authenticated
          try {
            console.log("🔄 Push token changed, updating backend...");
            await api.patch("/api/v1/users/updatePushToken", { pushToken: token });
            await AsyncStorage.setItem("pushToken", token);
            console.log("✅ Push token updated successfully");
          } catch (error) {
            console.error("❌ Error updating push token:", error);
          }
        } else if (!userToken) {
          console.log("🚫 No user token, cannot update push token");
        } else {
          console.log("ℹ️ Push token unchanged, no update needed");
        }
      } else {
        console.log("❌ Failed to get push token from device");
      }
    };

    // Update push token when user changes or every 30 seconds if user is signed in
    updatePushToken();
    
    let interval;
    if (isSignedIn) {
      interval = setInterval(updatePushToken, 30000); // Check every 30 seconds
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isSignedIn]); // Re-run when sign-in status changes

  useEffect(() => {
    
  }, [isSplashVisible, loading]);

  useEffect(() => {
    // Keep splash screen visible for at least 3 seconds
    const timer = setTimeout(() => {
      if (!loading) {
        setIsSplashVisible(false);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [loading]); // ⬅ Runs again if loading changes

  // Keep showing splash screen if:
  // - The splash duration isn't over OR
  // - Auth is still loading
  if (isSplashVisible || loading) {
    return (
      <NavigationContainer>
        <SplashScreenComponent />
      </NavigationContainer>
    );
  }

  return <AppNavigation />;
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* <ThemeProvider> */}
        <RegistrationProvider>
          <AuthProvider>
            <MainApp />
          </AuthProvider>
        </RegistrationProvider>
      {/* </ThemeProvider> */}
    </GestureHandlerRootView>
  );
}
