import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert, KeyboardAvoidingView, Platform, Animated, Image, Pressable } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/api';
const googleLogo = require('../assets/icons/googleLogoIcon.png');

const logo = require('../assets/icons/logo.webp');

type Props = NativeStackScreenProps<any, 'Register'>;

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const logoAnim = React.useRef(new Animated.Value(0)).current;
  const [buttonPressed, setButtonPressed] = useState(false);
  React.useEffect(() => {
    Animated.timing(logoAnim, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    try {
      await AsyncStorage.setItem('tempUserData', JSON.stringify({ fullName: name, email, password }));
      navigation.navigate('BasicDetails');
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'Data not stored');
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
            <View style={styles.inputContainer}>
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
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={22} color="#FF7A3D" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#B0B0B0"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
              />
            </View>
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
            <View style={styles.divider} />
            <View style={styles.googleRow}>
              <Text style={styles.googleRowText}>Or continue with</Text>
              <Pressable
                style={({ pressed }) => [styles.googleLogoOnly, pressed ? { opacity: 0.7, transform: [{ scale: 0.95 }] } : null]}
                onPress={async () => {
                  // TODO: Implement Google login logic here
                  // try {
                  //   const token = ... // get Google token
                  //   const userInfoRes = await fetch(
                  //     "https://www.googleapis.com/userinfo/v2/me",
                  //     {
                  //       headers: { Authorization: `Bearer ${token}` },
                  //     }
                  //   );
                  //   const user = await userInfoRes.json();
                  //   const response = await api.post("/api/v1/users/googleLogin", {
                  //     email: user.email,
                  //     name: user.name,
                  //     avatar: user.picture,
                  //     token,
                  //   });
                  //   // ...rest of logic
                  // } catch (error: any) {
                  //   console.error("Google login error:", error);
                  //   Alert.alert("Login Failed", "Could not complete Google login.");
                  // }
                }}
              >
                <Image source={googleLogo} style={styles.googleLogoOnlyImg} />
              </Pressable>
            </View>
            <Text style={styles.loginPrompt}>
              Already have an account?{' '}
              <Text style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
                Login
              </Text>
            </Text>
          </View>
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
});

export default RegisterScreen;