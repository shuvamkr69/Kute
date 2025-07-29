import React, { useEffect } from "react";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { TouchableOpacity, View, Text, Image, StyleSheet, Alert } from "react-native";
import * as AuthSession from "expo-auth-session";
import Constants from "expo-constants";

// Complete pending auth sessions
WebBrowser.maybeCompleteAuthSession();

const googleLogo = require("../assets/icons/googleLogoIcon.png");

const GoogleLoginButton = ({ onLogin }: { onLogin: (token: string) => void }) => {
  // Always use the Expo proxy for redirect URI
  const redirectUri = AuthSession.makeRedirectUri({ 
    native: "com.dating.kute:/oauth2redirect/google",
    useProxy: true } as any);
  console.log('Expo Redirect URI:', redirectUri);
  // This ensures Expo uses its proxy (https://auth.expo.io/...) — required for Google OAuth
  // const redirectUri = AuthSession.makeRedirectUri({
  // native: "com.dating.kute:/oauthredirect",
  // });

  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: Constants.expoConfig.extra.googleExpoClientId,
    androidClientId: Constants.expoConfig.extra.googleAndroidClientId,
    redirectUri, // Correct usage here
  });

  useEffect(() => {
    if (response?.type === "success") {
      const { authentication } = response;
      if (authentication?.accessToken) {
        console.log("✅ Google OAuth success, calling onLogin");
        onLogin(authentication.accessToken);
      } else {
        console.log("❌ No access token received from Google");
        Alert.alert("Google Login Failed", "No access token received from Google.");
      }
    } else if (response?.type === "error") {
      console.error("❌ Google OAuth error:", response.error);
      Alert.alert("Google Login Failed", `OAuth error: ${response.error?.message || "Unknown error"}`);
    } else if (response?.type === "cancel") {
      console.log("ℹ️ Google OAuth cancelled by user");
    }
  }, [response]);

  return (
    <TouchableOpacity
      onPress={() => promptAsync()}
      disabled={!request}
      activeOpacity={0.7}
      style={[styles.iconButton, !request && styles.buttonDisabled]}
    >
      <Image source={googleLogo} style={styles.logoOnly} />
    </TouchableOpacity>
  );
};

export default GoogleLoginButton;

const styles = StyleSheet.create({
  iconButton: {
    backgroundColor: 'transparent',
    padding: 0,
    margin: 0,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'transparent',
    elevation: 0,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  logoOnly: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
});
