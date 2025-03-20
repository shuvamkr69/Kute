import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Button } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import CustomButton from '../components/Button';
import api from '../utils/api';
import { useAuth } from '../navigation/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerForPushNotifications } from '../utils/notifications';

type Props = NativeStackScreenProps<any, 'Login'>;

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn } = useAuth();

  const loginHandler = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
  
    try {
      const loginResponse = await api.post("/api/v1/users/login", {
        email,
        password,
      });
  
      console.log("Login Response:", loginResponse.data); // Debug log
  
      if (loginResponse.status === 200) {
        const { accessToken, refreshToken, user} = loginResponse.data.data;
  
        if (!accessToken || !refreshToken) {
          Alert.alert("Error", "Authentication failed: Missing tokens");
          return;
        }
        await AsyncStorage.setItem("user", JSON.stringify(user));
        await AsyncStorage.setItem("accessToken", accessToken);
        await AsyncStorage.setItem("refreshToken", refreshToken);
        await AsyncStorage.setItem("avatar", user.avatar1);

        const token = await registerForPushNotifications();
      if (token) {
        const storedToken = await AsyncStorage.getItem("pushToken");

        if (storedToken !== token) {
          try {
            await api.post(
              "/api/v1/users/updatePushToken",
              { pushToken: token }
            );
            await AsyncStorage.setItem("pushToken", token);
            console.log("Push token updated successfully.");
          } catch (error) {
            console.error("Error updating push token:", error.response?.data || error.message);
          }
        }
      }
        // NEW: Update auth state so that user remains logged in
        await signIn();
        
  
        // Navigate to HomeTabs
        navigation.reset({
          index: 0,
          routes: [{ name: "HomeTabs" }],
        });
      } else {
        Alert.alert("Error", "Unexpected response from server");
      }
    } catch (error: any) {
      if (error.response) {
        switch (error.response.status) {
          case 404:
            Alert.alert("Error", "User not found");
            break;
          case 401:
            Alert.alert("Error", "Invalid email or password");
            break;
          default:
            Alert.alert("Error", "Something went wrong");
        }
      } else if (error.request) {
        Alert.alert("Error", "No response from server. Check your connection.");
      } else {
        Alert.alert("Error", "An unexpected error occurred");
      }
      console.error("Login Error:", error);
    }
  };
  
  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Kute</Text>
      <Text style={styles.tagline}>Find Your University Date</Text>

      <View style={styles.inputContainer}>
        <Icon name="envelope" size={20} color="#FFA62B" style={styles.icon} />
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
        <Icon name="lock" size={20} color="#FFA62B" style={styles.icon} />
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
        <Text style={styles.forgotPassword} onPress={handleForgotPassword}>Forgot your Password?</Text>
      </TouchableOpacity>

      <CustomButton title="Login" onPress={loginHandler} style={styles.loginButton} />

      <Text style={styles.registerText}>
        Don't have an account?{' '}
        <Text style={styles.registerLink} onPress={() => navigation.navigate('Register')}>
          Register
        </Text>
      </Text>
      <Button title="PhotoScreen" onPress={() => navigation.navigate('AddProfilePictures')} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  logo: {
    fontSize: 40,
    color: '#FFA62B',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  tagline: {
    color: '#B0B0B0',
    marginBottom: 40,
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    marginBottom: 20,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#FFA62B',
    width: '100%',
  },
  input: {
    flex: 1,
    height: 50,
    color: 'white',
    paddingLeft: 10,
  },
  icon: {
    marginRight: 10,
  },
  forgotPassword: {
    color: '#FFA62B',
    marginBottom: 20,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: '#FFA62B',
    paddingVertical: 15,
    borderRadius: 10,
    width: '100%',
    textAlign: 'center',
    marginBottom: 20,
  },
  registerText: {
    color: '#B0B0B0',
    marginTop: 10,
  },
  registerLink: {
    color: '#FFA62B',
    fontWeight: 'bold',
  },
});

export default LoginScreen;
