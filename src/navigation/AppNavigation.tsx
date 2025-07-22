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
import GroupSizeSelectorScreen from "../screens/games/NeverHaveIEver/GroupSizeSelectorScreen";
import SubmitPromptScreen from "../screens/games/NeverHaveIEver/SubmitPromptScreen";
import WaitingForPromptScreen from "../screens/games/NeverHaveIEver/WaitingForPromptScreen";
import WaitingRoomScreen from "../screens/games/NeverHaveIEver/WaitingRoomScreen";
import AnswerPromptScreen from "../screens/games/NeverHaveIEver/AnswerPromptScreen";
import ReviewAnswersScreen from "../screens/games/NeverHaveIEver/ReviewAnswersScreen";
import NHIEWaitingForAnswersScreen from "../screens/games/NeverHaveIEver/NHIEWaitingForAnswersScreen";
import PromptInputScreen from "../screens/games/WouldYouRather/PromptInputScreen";
import AnswerScreen from "../screens/games/WouldYouRather/AnswerScreen";
import FeedbackScreen from "../screens/games/WouldYouRather/FeedbackScreen";
import GameOverScreen from "../screens/games/WouldYouRather/GameOverScreen";
import RoundReviewScreen from "../screens/games/WouldYouRather/RoundReviewScreen";
import WaitingForFeedbackScreen from "../screens/games/WouldYouRather/WaitForFeedbackScreen";
import WYRLobbyScreen from "../screens/games/WouldYouRather/WYRLobbyScreen";
import BlockedUsersScreen from "../screens/BlockedUsersScreen";
import ResetPasswordScreen from "../screens/ResetPasswordScreen";
import ChangePasswordScreen from "../screens/ChangePasswordScreen";
import HelpScreen from "../screens/HelpScreen";
// import CallScreen from "../screens/CallScreen";
import TruthOrDareGame from "../screens/games/TruthOrDare/TruthOrDareGame";
import LeaderboardScreen from '../screens/LeaderboardScreen';

import BuyFeaturesScreen from '../screens/BuyScreens/BuySuperLikes';
import Agreements from "../screens/Agreements";
import EventSelection from "../screens/games/Events/EventSelection";
import ChamberOfSecrets from "../screens/games/Events/ChamberOfSecrets";

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
            <Stack.Screen name="BlockedUsersScreen" component={BlockedUsersScreen} />
            <Stack.Screen name="MatchScreen" component={MatchScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="AllChatScreen" component={ChatsScreen} />
            {/* <Stack.Screen name="Call" component={CallScreen} /> */}
            <Stack.Screen name="BoostsAndLikes" component={BoostsAndLikesScreen} />
            <Stack.Screen name="AdvancedFiltering" component={AdvancedFilteringScreen} />
            <Stack.Screen name="OtherProfile" component={OtherProfileScreen} />
            <Stack.Screen name="PhotoVerification" component={PhotoVerificationScreen} />
            <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
            <Stack.Screen name="HelpScreen" component={HelpScreen} />
            <Stack.Screen name="BuyFeatures" component={BuyFeaturesScreen} />
            <Stack.Screen name="Agreements" component={Agreements} />
            {/* User Info Screens */}

            {/* never have i ever */}
            <Stack.Screen name="GroupSizeSelectorScreen" component={GroupSizeSelectorScreen} />
            <Stack.Screen name="SubmitPromptScreen" component={SubmitPromptScreen} />
            <Stack.Screen name="WaitingForPromptScreen" component={WaitingForPromptScreen} />
            <Stack.Screen name="WaitingRoomScreen" component={WaitingRoomScreen} />
            <Stack.Screen name="AnswerPromptScreen" component={AnswerPromptScreen} />
            <Stack.Screen name="ReviewAnswersScreen" component={ReviewAnswersScreen} />
            <Stack.Screen name="NHIEWaitingForAnswersScreen" component={NHIEWaitingForAnswersScreen} />

            {/* Would You Rather */}
            <Stack.Screen name="PromptInputScreen" component={PromptInputScreen} />
            <Stack.Screen name="AnswerScreen" component={AnswerScreen} />
            <Stack.Screen name="FeedbackScreen" component={FeedbackScreen} />
            <Stack.Screen name="GameOverScreen" component={GameOverScreen} />
            <Stack.Screen name="RoundReviewScreen" component={RoundReviewScreen} />
            <Stack.Screen name="WaitingForFeedbackScreen" component={WaitingForFeedbackScreen} />
            <Stack.Screen name="WYRLobbyScreen" component={WYRLobbyScreen} />

            {/*Truth or dare */}
            <Stack.Screen name = "TDWaitingScreen" component = {TruthOrDareGame}/>

            {/* Leaderboard */}
            <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />

          {/* Events screens */}
          <Stack.Screen name="EventSelectionScreen" component={EventSelection} />
          <Stack.Screen name="ChamberOfSecrets" component={ChamberOfSecrets} />



          </>
        ) : (
          <>
            <Stack.Screen name="OnboardingScreen" component={OnboardingScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
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
