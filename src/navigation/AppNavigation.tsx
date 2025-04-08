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
import ProfileDetails from "../screens/profileDetails";
import "react-native-gesture-handler";
import MatchScreen from "../screens/MatchScreen";
import ChatScreen from "../screens/ChatScreen";
import ChatsScreen from "../screens/AllChats";
import TruthDareScreen from "../screens/games/TruthOrDare";
import BoostsAndLikesScreen from "../screens/BoostsAndLikes";
import AdvancedFilteringScreen from "../screens/AdvancedFiltering"; // Import your Advanced Filtering screen

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
            <Stack.Screen name="ProfileDetails" component={ProfileDetails} />
            <Stack.Screen name="MatchScreen" component={MatchScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="AllChatScreen" component={ChatsScreen} />
            <Stack.Screen name="TruthDare" component={TruthDareScreen} />
            <Stack.Screen name="BoostsAndLikes" component={BoostsAndLikesScreen} />
            <Stack.Screen name="AdvancedFiltering" component={AdvancedFilteringScreen} />

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
