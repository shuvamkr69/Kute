import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native"; // Import NavigationContainer
import AppNavigation from "./src/navigation/AppNavigation";
import { AuthProvider, useAuth } from "./src/navigation/AuthContext";
import { RegistrationProvider } from "./src/navigation/RegistrationContext";
import SplashScreenComponent from "./src/components/SplashScreen";

const MainApp = () => {
  const { user, loading } = useAuth(); // Fetch user authentication state
  const [isSplashVisible, setIsSplashVisible] = useState(true);

  useEffect(() => {
    console.log("Splash Screen Visible:", isSplashVisible);
    console.log("Auth Loading:", loading);
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
    <RegistrationProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </RegistrationProvider>
  );
};