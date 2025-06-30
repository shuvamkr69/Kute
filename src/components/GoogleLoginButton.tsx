import React, { useEffect } from "react";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { Button, Alert } from "react-native";
import * as AuthSession from "expo-auth-session";
import Constants from "expo-constants";

// Complete pending auth sessions
WebBrowser.maybeCompleteAuthSession();

const GoogleLoginButton = ({ onLogin }: { onLogin: (token: string) => void }) => {
  // This ensures Expo uses its proxy (https://auth.expo.io/...) — required for Google OAuth
  const redirectUri = AuthSession.makeRedirectUri({
  native: "com.dating.kute:/oauthredirect",
});

  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: Constants.expoConfig.extra.googleExpoClientId,
    androidClientId: Constants.expoConfig.extra.googleAndroidClientId,
    redirectUri, // Correct usage here
  });

  useEffect(() => {
    if (response?.type === "success") {
      const { authentication } = response;
      if (authentication?.accessToken) {
        onLogin(authentication.accessToken);
      }
    } else if (response?.type === "error") {
      Alert.alert("Google Login Failed", "Something went wrong during login.");
    }
  }, [response]);

  return (
    <Button
      title="Login with Google"
      onPress={() => promptAsync()}
      disabled={!request}
      color="#de822c"
    />
  );
};

export default GoogleLoginButton;
