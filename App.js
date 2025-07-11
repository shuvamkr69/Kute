import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native"; // Import NavigationContainer
import AppNavigation from "./src/navigation/AppNavigation";
import { AuthProvider, useAuth } from "./src/navigation/AuthContext";
import { RegistrationProvider } from "./src/navigation/RegistrationContext";
import SplashScreenComponent from "./src/components/SplashScreen";
import { registerForPushNotifications } from "./src/utils/notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { decode as atob, encode as btoa } from 'base-64';
import { GestureHandlerRootView } from "react-native-gesture-handler";
// import { ClerkProvider } from '@clerk/clerk-react';
// import  * as SecureStore  from "expo-secure-store";

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

    const updatePushToken = async () => {
      const token = await registerForPushNotifications();

      if (token) {
        const storedToken = await AsyncStorage.getItem("pushToken");
        const userToken = await AsyncStorage.getItem("accessToken"); // Get JWT
        console.log("User JWT:", userToken);
        console.log("Push Token:", token);
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
