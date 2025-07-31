import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Pressable,
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import Icon from "react-native-vector-icons/FontAwesome";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import CustomButton from "../components/Button";
import api from "../utils/api";
import { useAuth } from "../navigation/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { registerForPushNotifications } from "../utils/notifications";
import GoogleLoginButton from "../components/GoogleLoginButton";
import CustomAlert from "../components/CustomAlert";
const googleLogo = require('../assets/icons/googleLogoIcon.png');

const logo = require("../assets/icons/logo.webp");

type Props = NativeStackScreenProps<any, "Login">;

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signIn } = useAuth();
  const [buttonPressed, setButtonPressed] = useState(false);
  const [customAlert, setCustomAlert] = useState({ visible: false, title: '', message: '' });

  const loginHandler = async () => {
    if (!email || !password) {
      setCustomAlert({ visible: true, title: "Error", message: "Please fill in all fields" });
      return;
    }
    try {
      // Get push token before login
      const pushToken = await registerForPushNotifications();
      console.log("🔄 Logging in with push token:", pushToken ? "✅ Present" : "❌ Missing");

      const loginResponse = await api.post("/api/v1/users/login", { 
        email, 
        password,
        pushToken // Include push token in login request
      });
      
      if (loginResponse.status === 200) {
        const { accessToken, refreshToken, user } = loginResponse.data.data;
        if (!accessToken || !refreshToken) {
          setCustomAlert({ visible: true, title: "Error", message: "Authentication failed: Missing tokens" });
          return;
        }
        
        await AsyncStorage.setItem("user", JSON.stringify(user));
        await AsyncStorage.setItem("accessToken", accessToken);
        await AsyncStorage.setItem("refreshToken", refreshToken);
        await AsyncStorage.setItem("avatar", user.avatar1);
        await AsyncStorage.setItem("location", JSON.stringify(user.location));
        
        // Store push token locally
        if (pushToken) {
          await AsyncStorage.setItem("pushToken", pushToken);
          console.log("✅ Push token stored locally during login");
        }
        
        await signIn();
        navigation.reset({ index: 0, routes: [{ name: "HomeTabs" }] });
      } else {
        setCustomAlert({ visible: true, title: "Error", message: "Unexpected response from server" });
      }
    } catch (error: any) {
      if (error.response) {
        switch (error.response.status) {
          case 404:
            setCustomAlert({ visible: true, title: "Error", message: "User not found" });
            break;
          case 401:
            setCustomAlert({ visible: true, title: "Error", message: "Invalid email or password" });
            break;
          case 500:
            setCustomAlert({ visible: true, title: "Error", message: "Invalid email or password" });
            break;
          default:
            setCustomAlert({ visible: true, title: "Error", message: "Something went wrong" });
        }
      } else if (error.request) {
        setCustomAlert({ visible: true, title: "Error", message: "No response from server. Check your connection." });
      } else {
        setCustomAlert({ visible: true, title: "Error", message: "An unexpected error occurred" });
      }
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate("ForgotPassword");
  };

  const handleGoogleLogin = async (accessToken: string) => {
    try {
      console.log("🚀 Starting Google login process");
      
      // Get push token before Google login
      const pushToken = await registerForPushNotifications();
      console.log("🔄 Google login with push token:", pushToken ? "✅ Present" : "❌ Missing");
      
      // Get user info from Google
      const userInfoRes = await fetch(
        "https://www.googleapis.com/userinfo/v2/me",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      
      if (!userInfoRes.ok) {
        throw new Error("Failed to fetch user info from Google");
      }
      
      const user = await userInfoRes.json();
      console.log("📧 Google user email:", user.email);
      
      if (!user.email) {
        throw new Error("No email received from Google account");
      }

      // Call backend to login or register
      console.log("🔗 Calling backend Google login endpoint");
      const response = await api.post("/api/v1/users/googleLogin", {
        email: user.email,
        name: user.name,
        avatar: user.picture,
        token: accessToken,
        pushToken // Include push token in Google login request
      });
      
      if (response.status === 200) {
        console.log("✅ Backend login successful");
        const { accessToken: jwt, refreshToken, user: backendUser } = response.data.data;
        
        if (!jwt || !refreshToken) {
          throw new Error("Authentication failed: Missing tokens from server");
        }
        
        // Store authentication data
        await AsyncStorage.setItem("user", JSON.stringify(backendUser));
        await AsyncStorage.setItem("accessToken", jwt);
        await AsyncStorage.setItem("refreshToken", refreshToken);
        await AsyncStorage.setItem("avatar", backendUser.avatar1 || "");
        await AsyncStorage.setItem("location", JSON.stringify(backendUser.location || [0, 0]));
        
        // Store push token locally
        if (pushToken) {
          await AsyncStorage.setItem("pushToken", pushToken);
          console.log("✅ Push token stored locally during Google login");
        }
        
        await signIn();
        
        // Check if profile needs completion
        if (backendUser.isProfileComplete === false) {
          console.log("📝 Profile incomplete, redirecting to BasicDetails");
          navigation.reset({ index: 0, routes: [{ name: "BasicDetails" }] });
        } else {
          console.log("🏠 Profile complete, redirecting to home");
          navigation.reset({ index: 0, routes: [{ name: "HomeTabs" }] });
        }
      } else {
        // setCustomAlert({visible: true, title: "Error", message: "No user found with this email. Please register."});
        navigation.navigate("Register", {
          email: user.email,
          name: user.name,
        });
      }
    } catch (error: any) {
      console.error("❌ Google login error:", error);
      
      // Enhanced error handling
      let errorMessage = "Could not complete Google login.";
      
      if (error.response) {
        // Server responded with error
        const serverMessage = error.response.data?.message;
        if (serverMessage) {
          errorMessage = serverMessage;
        } else {
          switch (error.response.status) {
            case 400:
              errorMessage = "Invalid login data provided";
              break;
            case 401:
              errorMessage = "Google authentication failed";
              break;
            case 500:
              errorMessage = "Server error during login";
              break;
          }
        }
      } else if (error.request) {
        errorMessage = "No response from server. Check your connection.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setCustomAlert({ 
        visible: true, 
        title: 'Google Login Failed', 
        message: errorMessage 
      });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#181A20' }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={{ alignItems: 'center', width: '100%' }}>
            <Image source={logo} style={styles.logoImgXLarge} resizeMode="contain" />
          </View>
          <View style={styles.card}>
            <Text style={styles.tagline}>Find Your <Text style={styles.taglineAccent}>Kutie</Text></Text>
            <View style={styles.inputContainer}>
              <Icon name="envelope" size={20} color="#FF7A3D" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#B0B0B0"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
              />
            </View>
            <View style={styles.inputContainer}>
              <Icon name="lock" size={20} color="#FF7A3D" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#B0B0B0"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
            <TouchableOpacity>
              <Text style={styles.forgotPassword} onPress={handleForgotPassword}>
                Forgot your Password?
              </Text>
            </TouchableOpacity>
            <Pressable
              style={({ pressed }) => [
                styles.loginButton,
                pressed || buttonPressed ? { transform: [{ scale: 0.97 }], opacity: 0.85 } : null
              ]}
              onPressIn={() => setButtonPressed(true)}
              onPressOut={() => setButtonPressed(false)}
              onPress={loginHandler}
            >
              <LinearGradient
                colors={["#FF8C42", "#FF6B3F"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.loginButtonGradient}
              >
                <Text style={styles.loginButtonText}>Login</Text>
              </LinearGradient>
            </Pressable>
            <View style={styles.divider} />
            <View style={styles.googleRow}>
              <Text style={styles.googleRowText}>Or continue with</Text>
              {/* Replace icon with working GoogleLoginButton */}
              <GoogleLoginButton onLogin={handleGoogleLogin} />
            </View>
            <Text style={styles.registerText}>
              Don't have an account?{" "}
              <Text
                style={styles.registerLink}
                onPress={() => navigation.navigate("Register")}
              >
                Register
              </Text>
            </Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <CustomAlert
        visible={customAlert.visible}
        title={customAlert.title}
        message={customAlert.message}
        onClose={() => setCustomAlert((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#16181C',
    borderRadius: 14,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
    marginTop: 24,
    marginBottom: 24,
    borderWidth: 0,
    alignItems: 'center',
  },
  logoImg: {
    width: 80,
    height: 80,
    marginBottom: 10,
    alignSelf: 'center',
  },
  logoImgLarge: {
    width: 120,
    height: 120,
    marginBottom: -60,
    zIndex: 2,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },
  logoImgXLarge: {
    width: 150,
    height: 150,
    marginBottom: 12,
    zIndex: 2,
    alignSelf: 'center',
  },
  tagline: {
    color: "#A1A7B3",
    marginBottom: 28,
    fontSize: 22,
    textAlign: "center",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  taglineAccent: {
    color: "#FF8C42",
    fontWeight: '900',
    fontSize: 24,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#181A20",
    borderRadius: 8,
    marginBottom: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#353945",
    width: "100%",
  },
  input: {
    flex: 1,
    height: 46,
    color: "#fff",
    paddingLeft: 8,
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: 0.2,
  },
  icon: {
    marginRight: 8,
  },
  forgotPassword: {
    color: "#FF7A3D",
    marginBottom: 12,
    textAlign: "center",
    fontWeight: "500",
    fontSize: 15,
    letterSpacing: 0.2,
  },
  loginButton: {
    borderRadius: 10,
    width: "100%",
    marginBottom: 16,
    marginTop: 2,
    elevation: 3,
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.13,
    shadowRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  loginButtonGradient: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 17,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  registerText: {
    color: "#A1A7B3",
    marginTop: 12,
    textAlign: "center",
    fontSize: 15,
    fontWeight: '400',
  },
  registerLink: {
    color: "#FF7A3D",
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 0.2,
  },
  divider: {
    height: 1,
    width: '80%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 14,
    alignSelf: 'center',
    borderRadius: 1,
  },
  googleButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    marginTop: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 2,
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  googleLogo: {
    width: 26,
    height: 26,
    marginRight: 10,
  },
  googleButtonText: {
    color: '#222',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.2,
  },
  googleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 18,
  },
  googleRowText: {
    color: '#fff',
    opacity: 0.7,
    fontSize: 13,
    marginRight: 10,
  },
  googleLogoOnly: {
    padding: 4,
    borderRadius: 100,
  },
  googleLogoOnlyImg: {
    width: 28,
    height: 28,
  },
});

export default LoginScreen;
