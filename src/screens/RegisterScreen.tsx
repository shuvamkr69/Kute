import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, Animated, Image, Pressable } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/api';
import GoogleLoginButton from '../components/GoogleLoginButton';
import Constants from 'expo-constants';
import CustomAlert from '../components/CustomAlert';
import { useAuth } from '../navigation/AuthContext';
import { useRoute } from '@react-navigation/native';

const googleLogo = require('../assets/icons/googleLogoIcon.png');

const logo = require('../assets/icons/logo.webp');

type Props = NativeStackScreenProps<any, 'Register'>;

const RegisterScreen: React.FC<Props> = ({ navigation }) => {

  const route = useRoute();

  const { signIn } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const logoAnim = React.useRef(new Animated.Value(0)).current;
  const [buttonPressed, setButtonPressed] = useState(false);

  const [customAlert, setCustomAlert] = useState({ visible: false, title: '', message: '' });

  // Get params from navigation (from LoginScreen Google login)
  const routeParams = route.params as { email?: string; name?: string } | undefined;
  const googleEmail = routeParams?.email;
  const googleName = routeParams?.name;

 

  React.useEffect(() => {
    Animated.timing(logoAnim, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    }).start();
    // Log Expo owner for debugging
    console.log('Expo Owner:', Constants.expoConfig?.owner);
    
    // Initialize form fields with Google login data if available
    if (googleEmail) {
      setEmail(googleEmail);
    }
    if (googleName) {
      setName(googleName);
    }
  }, [googleEmail, googleName]);

  React.useEffect(() => {
    (async () => {
      // Store Google login data for BasicDetails if available
      if (googleEmail) {
        await AsyncStorage.setItem('googleEmail', googleEmail);
      }
      if (googleName) {
        await AsyncStorage.setItem('googleName', googleName);
      }
    })();
  }, [googleEmail, googleName]);
  

  const handleRegister = async () => {
    // Check if this is from Google login (has Google data but no password requirement)
    const isFromGoogleLogin = googleEmail && googleName;
    
    if (!name || !email) {
      setCustomAlert({ visible: true, title: 'Error', message: 'Please fill in name and email' });
      return;
    }
    
    if (!isFromGoogleLogin && !password) {
      setCustomAlert({ visible: true, title: 'Error', message: 'Password is required' });
      return;
    }
    
    if (!isFromGoogleLogin && password.length < 6) {
      setCustomAlert({ visible: true, title: 'Error', message: 'Password must be at least 6 characters' });
      return;
    }
    
    try {
      const tempUserData = {
        fullName: name,
        email,
        password: isFromGoogleLogin ? '' : password, // No password for Google users
        loginMethod: isFromGoogleLogin ? 'google' : 'email',
        ...(isFromGoogleLogin && {
          avatar: '', // Will be set later if available
          googleToken: '' // Will be set by Google login flow
        })
      };
      
      await AsyncStorage.setItem('tempUserData', JSON.stringify(tempUserData));
      navigation.navigate('BasicDetails');
    } catch (error) {
      console.log(error);
      setCustomAlert({ visible: true, title: 'Error', message: 'Data not stored' });
    }
  };

  // Add Google login handler
  const handleGoogleLogin = async (token: string) => {
    let user: any = null; // Declare user variable in outer scope
    
    try {
      console.log("🚀 Starting Google login process");
      
      // Fetch user info from Google
      const userInfoRes = await fetch(
        'https://www.googleapis.com/userinfo/v2/me',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      if (!userInfoRes.ok) {
        throw new Error("Failed to fetch user info from Google");
      }
      
      user = await userInfoRes.json(); // Assign to outer scope variable
      console.log("📧 Google user info received:", {
        email: user.email,
        name: user.name,
        picture: user.picture ? "Picture available" : "No picture"
      });
      
      if (!user.email) {
        throw new Error("No email received from Google account");
      }
      
      // Call backend to check if user exists
      console.log("🔗 Calling backend Google login endpoint");
      const response = await api.post('/api/v1/users/googleLogin', {
        email: user.email,
        name: user.name,
        avatar: user.picture,
        token,
      });
      
      console.log("📊 Backend response status:", response.status);
      console.log("📊 Backend response data:", JSON.stringify(response.data, null, 2));
      
      // Check if response has expected structure
      if (!response.data) {
        throw new Error("Invalid response format from server");
      }
      
      if (response.status === 200) {
        // User exists and login successful
        console.log("✅ Existing user login successful");
        
        if (!response.data.data) {
          throw new Error("Invalid response: missing data field");
        }
        
        const { accessToken, refreshToken, user: backendUser } = response.data.data;
        
        if (!accessToken || !refreshToken) {
          throw new Error("Authentication failed: Missing tokens from server");
        }
        
        console.log(`📧 Logged in user: ${backendUser.email}`);
        console.log(`🔐 Login method: ${backendUser.loginMethod}`);
        console.log(`✅ Profile complete: ${backendUser.isProfileComplete}`);
        
        // Store authentication data
        await AsyncStorage.setItem('user', JSON.stringify(backendUser));
        await AsyncStorage.setItem('accessToken', accessToken);
        await AsyncStorage.setItem('refreshToken', refreshToken);
        await AsyncStorage.setItem('avatar', backendUser.avatar1 || user.picture || '');
        await AsyncStorage.setItem('location', JSON.stringify(backendUser.location || [0, 0]));
        
        // Clear any temp data since user is logging in
        await AsyncStorage.removeItem('tempUserData');
        
        // Update AuthContext state
        await signIn();
        
        // Check if profile needs completion (shouldn't happen for existing users, but just in case)
        if (backendUser.isProfileComplete === false || !backendUser.age || !backendUser.gender) {
          console.log("📝 Profile incomplete for existing user, redirecting to BasicDetails");
          navigation.navigate('BasicDetails');
        } else {
          console.log("🏠 Profile complete, redirecting to home");
          navigation.reset({ index: 0, routes: [{ name: 'HomeTabs' }] });
        }
      } else if (response.status === 202) {
        // User doesn't exist - start registration flow
        console.log("📝 New Google user, starting registration flow");
        
        if (!response.data.data || !response.data.data.googleUserInfo) {
          throw new Error("Invalid response: missing Google user info");
        }
        
        const { googleUserInfo } = response.data.data;
        
        // Store Google user data in AsyncStorage for registration flow
        const tempGoogleUserData = {
          fullName: googleUserInfo.name || user.name || 'Google User',
          email: googleUserInfo.email || user.email,
          password: '', // Google users don't have a password
          avatar: googleUserInfo.avatar || user.picture || '',
          loginMethod: 'google',
          googleToken: token
        };
        
        console.log("💾 Storing new Google user data in AsyncStorage:", {
          fullName: tempGoogleUserData.fullName,
          email: tempGoogleUserData.email,
          avatar: tempGoogleUserData.avatar ? "Avatar available" : "No avatar",
          loginMethod: tempGoogleUserData.loginMethod
        });
        
        await AsyncStorage.setItem('tempUserData', JSON.stringify(tempGoogleUserData));
        
        // Navigate to BasicDetails for registration
        console.log("🚀 Navigating to BasicDetails for registration");
        navigation.navigate('BasicDetails');
      } else {
        console.error("❌ Unexpected response status:", response.status);
        throw new Error(`Unexpected response status: ${response.status}`);
      }
    } catch (error: any) {
      console.error("❌ Google login error:", error);
      
      // Enhanced error handling
      let errorMessage = "Could not complete Google login.";
      let shouldNavigateToRegistration = false;
      
      if (error.response) {
        // Server responded with error
        console.error("❌ Server response error:", error.response.status, error.response.data);
        
        const responseData = error.response.data;
        const serverMessage = responseData?.message || responseData?.error;
        
        console.log("🔍 Debugging server response:", {
          status: error.response.status,
          data: responseData,
          message: serverMessage,
          fullResponse: JSON.stringify(responseData, null, 2)
        });
        
        // Check for specific error messages that indicate new user OR any 500 error (since backend returns 500 for new users)
        if (serverMessage && (
          serverMessage.includes("not found") || 
          serverMessage.includes("Invalid Google access token") ||
          error.response.status === 500
        )) {
          console.log("📝 Treating as new user registration scenario (status: " + error.response.status + ", message: " + serverMessage + ")");
          shouldNavigateToRegistration = true;
        }
        
        if (serverMessage) {
          errorMessage = serverMessage;
        } else {
          switch (error.response.status) {
            case 400:
              errorMessage = "Invalid Google login data provided";
              break;
            case 401:
              errorMessage = "Google authentication failed. Please try again.";
              break;
            case 500:
              errorMessage = serverMessage || "Server error during Google login";
              break;
            default:
              errorMessage = `Server error: ${error.response.status}`;
          }
        }
        
        // If this is actually a "user not found" case disguised as an error,
        // handle it as a registration flow
        if (shouldNavigateToRegistration && user && user.email) {
          console.log("🚀 Treating as new user registration flow");
          
          try {
            // Store Google user data in AsyncStorage for registration flow
            const tempGoogleUserData = {
              fullName: user.name || 'Google User',
              email: user.email,
              password: '', // Google users don't have a password
              avatar: user.picture || '',
              loginMethod: 'google',
              googleToken: token
            };
            
            console.log("💾 Storing new Google user data in AsyncStorage:", {
              fullName: tempGoogleUserData.fullName,
              email: tempGoogleUserData.email,
              avatar: tempGoogleUserData.avatar ? "Avatar available" : "No avatar",
              loginMethod: tempGoogleUserData.loginMethod
            });
            
            await AsyncStorage.setItem('tempUserData', JSON.stringify(tempGoogleUserData));
            
            // Navigate to BasicDetails for registration
            console.log("🚀 Navigating to BasicDetails for registration");
            navigation.navigate('BasicDetails');
            return; // Exit early to avoid showing error alert
          } catch (storageError) {
            console.error("❌ Failed to store temp user data:", storageError);
            errorMessage = "Failed to prepare user data for registration";
          }
        } else if (shouldNavigateToRegistration && (!user || !user.email)) {
          console.error("❌ Cannot proceed with registration - missing user data");
          errorMessage = "Missing user information from Google. Please try again.";
        }
        
      } else if (error.request) {
        console.error("❌ Network error:", error.request);
        errorMessage = "No response from server. Check your internet connection.";
      } else if (error.message) {
        console.error("❌ General error:", error.message);
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
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={{ alignItems: 'center', width: '100%' }}>
            <Image source={logo} style={styles.logoImgXLarge} resizeMode="contain" />
          </View>
          <View style={styles.card}>
            <Text style={styles.tagline}>Create your <Text style={styles.taglineAccent}>Account</Text></Text>
            {googleEmail && (
              <Text style={styles.googleInfoText}>
                Continuing with Google account
              </Text>
            )}
            <View style={[styles.inputContainer, googleName ? styles.prefilledContainer : null]}>
              <Ionicons name="person-outline" size={22} color="#FF7A3D" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor="#B0B0B0"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
            <View style={[styles.inputContainer, googleEmail ? styles.prefilledContainer : null]}>
              <Ionicons name="mail-outline" size={22} color="#FF7A3D" style={styles.icon} />
              <TextInput
                style={[styles.input, googleEmail ? styles.readOnlyInput : null]}
                placeholder="Email"
                placeholderTextColor="#B0B0B0"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                editable={!googleEmail}
              />
            </View>
            {/* Only show password field if not coming from Google login */}
            {!googleEmail && (
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={22} color="#FF7A3D" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#B0B0B0"
                  secureTextEntry={true}
                  value={password}
                  onChangeText={setPassword}
                  autoCapitalize="none"
                />
              </View>
            )}
            {/* Show info text if coming from Google login */}
            {googleEmail && (
              <Text style={styles.infoText}>
                Continuing with Google account - no password required
              </Text>
            )}
            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed || buttonPressed ? { transform: [{ scale: 0.97 }], opacity: 0.85 } : null
              ]}
              onPressIn={() => setButtonPressed(true)}
              onPressOut={() => setButtonPressed(false)}
              onPress={handleRegister}
            >
              <LinearGradient
                colors={["#FF8C42", "#FF6B3F"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>Register</Text>
              </LinearGradient>
            </Pressable>
            {/* Only show Google login option if not already coming from Google */}
            {!googleEmail && (
              <>
                <View style={styles.divider} />
                <View style={styles.googleRow}>
                  <Text style={styles.googleRowText}>Or continue with</Text>
                  <View style={{ alignItems: 'center', marginBottom: 18 }}>
                    <GoogleLoginButton onLogin={handleGoogleLogin} />
                  </View>
                </View>
              </>
            )}
            <Text style={styles.loginPrompt}>
              Already have an account?{' '}
              <Text style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
                Login
              </Text>
            </Text>
          </View>
          <CustomAlert
            visible={customAlert.visible}
            title={customAlert.title}
            message={customAlert.message}
            onClose={() => setCustomAlert((prev) => ({ ...prev, visible: false }))}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181A20',
    borderRadius: 8,
    marginBottom: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#353945',
    width: 320,
    maxWidth: '90%',
  },
  input: {
    flex: 1,
    height: 46,
    paddingLeft: 8,
    color: 'white',
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: 0.2,
  },
  icon: {
    marginRight: 8,
  },
  button: {
    borderRadius: 10,
    width: 320,
    maxWidth: '90%',
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
  buttonGradient: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 17,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  loginPrompt: {
    marginTop: 12,
    color: '#A1A7B3',
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '400',
  },
  loginLink: {
    color: '#FF7A3D',
    fontWeight: '700',
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
  infoText: {
    color: '#A1A7B3',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    marginTop: 8,
    fontStyle: 'italic',
  },
  readOnlyInput: {
    opacity: 0.7,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  googleInfoText: {
    color: '#4CAF50',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '500',
  },
  prefilledContainer: {
    borderColor: 'rgba(76, 175, 80, 0.3)',
    backgroundColor: 'rgba(76, 175, 80, 0.05)',
  },
});

export default RegisterScreen;