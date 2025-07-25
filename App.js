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
    // Check if it's a match notification for enhanced handling
    const isMatchNotification = notification.request.content.data?.type === "match";
    
    console.log("🔧 Notification handler called for:", notification.request.content.title);
    console.log("🔧 Is match notification:", isMatchNotification);
    
    return {
      shouldShowAlert: true, // Always show alert
      shouldPlaySound: true, // Always play sound
      shouldSetBadge: false,
      // Force priority for match notifications
      priority: isMatchNotification ? Notifications.AndroidImportance.MAX : Notifications.AndroidImportance.HIGH,
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
  const { user, loading } = useAuth(); // Fetch user authentication state
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
      }
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log("👆 User tapped notification:", response);
      
      // Handle match notification tap - could navigate to match screen
      if (response.notification.request.content.data?.type === "match") {
        // You can add navigation logic here if needed
        console.log("User tapped match notification!");
      }
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, []);

  useEffect(() => {

    const updatePushToken = async () => {
      const token = await registerForPushNotifications();

      if (token) {
        const storedToken = await AsyncStorage.getItem("pushToken");
        const userToken = await AsyncStorage.getItem("accessToken"); // Get JWT
        console.log("User JWT:", userToken);
        console.log("Push Token:", token);
        console.log("env:", process.env)
        if (storedToken !== token) {
          // Send to backend only if changed
          await api.patch("/api/v1/users/updatePushToken", { pushToken: token });
          await AsyncStorage.setItem("pushToken", token);
        }
      }
    };

    updatePushToken();
  }, []);

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
