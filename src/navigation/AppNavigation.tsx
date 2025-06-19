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
import "react-native-gesture-handler";
import MatchScreen from "../screens/MatchScreen";
import ChatScreen from "../screens/ChatScreen";
import ChatsScreen from "../screens/AllChats";
import BoostsAndLikesScreen from "../screens/BoostsAndLikes";
import AdvancedFilteringScreen from "../screens/AdvancedFiltering"; // Import your Advanced Filtering screen
import OtherProfileScreen from "../screens/OtherProfileScreen";
import PhotoVerificationScreen from "../screens/PhotoVerification";
import ModeSelection from "../screens/games/TruthOrDare/ModeSelection";
import SinglePlayerGame from "../screens/games/TruthOrDare/SinglePlayerGame";
import MultiplayerGame from "../screens/games/TruthOrDare/MultiPlayerGame";
import TruthAnswerScreen from "../screens/games/TruthOrDare/TruthAnswerScreen";
import TruthSetScreen from "../screens/games/TruthOrDare/TruthSetScreen";
import TruthReviewScreen from "../screens/games/TruthOrDare/TruthReviewScreen";
import WaitingForAnswerScreen from "../screens/games/TruthOrDare/WaitingForAnswerScreen";
import GroupSizeSelectorScreen from "../screens/games/NeverHaveIEver/GroupSizeSelectorScreen";
import SubmitPromptScreen from "../screens/games/NeverHaveIEver/SubmitPromptScreen";
import WaitingForPromptScreen from "../screens/games/NeverHaveIEver/WaitingForPromptScreen";
import WaitingRoomScreen from "../screens/games/NeverHaveIEver/WaitingRoomScreen";
import AnswerPromptScreen from "../screens/games/NeverHaveIEver/AnswerPromptScreen";
import ReviewAnswersScreen from "../screens/games/NeverHaveIEver/ReviewAnswersScreen";
import NHIEWaitingForAnswersScreen from "../screens/games/NeverHaveIEver/NHIEWaitingForAnswersScreen";

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
            <Stack.Screen name="MatchScreen" component={MatchScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="AllChatScreen" component={ChatsScreen} />
            <Stack.Screen name="BoostsAndLikes" component={BoostsAndLikesScreen} />
            <Stack.Screen name="AdvancedFiltering" component={AdvancedFilteringScreen} />
            <Stack.Screen name="OtherProfile" component={OtherProfileScreen} />
            <Stack.Screen name="PhotoVerification" component={PhotoVerificationScreen} />
            <Stack.Screen name="SinglePlayerGame" component={SinglePlayerGame} />
            
            {/* truth and dare */}
            <Stack.Screen name="TruthOrDareModeSelection" component={ModeSelection} />
            <Stack.Screen name="MultiPlayerGame" component={MultiplayerGame} />
            <Stack.Screen name="TruthAnswerScreen" component={TruthAnswerScreen} />
            <Stack.Screen name="TruthSetScreen" component={TruthSetScreen} />
            <Stack.Screen name="TruthReviewScreen" component={TruthReviewScreen} />
            <Stack.Screen name="WaitingForAnswerScreen" component={WaitingForAnswerScreen} />

            {/* never have i ever */}
            <Stack.Screen name="GroupSizeSelectorScreen" component={GroupSizeSelectorScreen} />
            <Stack.Screen name="SubmitPromptScreen" component={SubmitPromptScreen} />
            <Stack.Screen name="WaitingForPromptScreen" component={WaitingForPromptScreen} />
            <Stack.Screen name="WaitingRoomScreen" component={WaitingRoomScreen} />
            <Stack.Screen name="AnswerPromptScreen" component={AnswerPromptScreen} />
            <Stack.Screen name="ReviewAnswersScreen" component={ReviewAnswersScreen} />
            <Stack.Screen name="NHIEWaitingForAnswersScreen" component={NHIEWaitingForAnswersScreen} />






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
