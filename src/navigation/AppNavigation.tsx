import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "./AuthContext"; 
import SplashScreenComponent from "../components/SplashScreen"; 

import OnboardingScreen from "../screens/OnboardingScreen";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";
import SettingsScreen from "../screens/SettingScreen";
import EditProfileScreen from "../screens/EditProfile";
import PremiumScreen from "../screens/Premium";
import NotificationsScreen from "../screens/NotificationScreen";
import BasicDetails from "../screens/UserInfo/BasicDetails";
import LocationPage from "../screens/UserInfo/Location";
import AddProfilePictures from "../screens/UserInfo/addProfilePictures";
import MakeBio from "../screens/UserInfo/MakeUserBio";
import HomeTabs from "../components/HomeTabs";

// Enable gesture handler
import "react-native-gesture-handler";

const Stack = createNativeStackNavigator(); // Standard Stack Navigator

export default function AppNavigation() {
  const { isSignedIn } = useAuth();
  const [isSplashFinished, setSplashFinished] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSplashFinished(true), 2000); // 2 seconds
    return () => clearTimeout(timer);
  }, []);

  if (!isSplashFinished) {
    return <SplashScreenComponent navigation={undefined} route={undefined} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          animation: "slide_from_right", // Smooth slide animation
          headerShown: false,
          gestureEnabled: true, // Enable swipe gestures
          gestureDirection: "horizontal", // Swipe left/right
        }}
      >
        {isSignedIn ? (
          <>
            <Stack.Screen name="HomeTabs" component={HomeTabs} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="Premium" component={PremiumScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="OnboardingScreen" component={OnboardingScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="BasicDetails" component={BasicDetails} />
            <Stack.Screen name="Location" component={LocationPage} />
            <Stack.Screen name="AddProfilePictures" component={AddProfilePictures} />
            <Stack.Screen name="MakeBio" component={MakeBio} />
            <Stack.Screen name="HomeTabs" component={HomeTabs} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
