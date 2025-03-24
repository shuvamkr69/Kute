import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import api from '../utils/api';

type Props = NativeStackScreenProps<any, 'ForgotPassword'>;

const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');

  const handleRegister = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    try {
      const response = await api.post('/api/v1/users/forgot-password', {
        email: email,
      });

      if (response.status === 404) {
        Alert.alert('Error', 'Email not found');
      } else if (response.status === 500) {
        Alert.alert('Error', 'Server Error');
      } else {
        Alert.alert('Success', 'Password reset link sent to your email');
        navigation.navigate('Login');
      }
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'There is a problem with the server');
    }
  };

  const handleLogin = async () => {
    navigation.navigate('Login');
 }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.logo}>Forgot Password</Text>
      <Text style={styles.tagline}>Enter your email to reset your password</Text>

      {/* Email Input */}
      <View style={styles.inputContainer}>
        <Icon name="envelope" size={20} color="#5de383" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#B0B0B0"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
      </View>

      {/* Reset Password Button */}
      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Reset Password</Text>
      </TouchableOpacity>

      {/* Back to Login */}
      <Text style={styles.loginPrompt}>
        Remembered your password?{' '}
        <Text style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
          Login
        </Text>
      </Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#5de383',
    textAlign: 'center',
    marginBottom: 10,
  },
  tagline: {
    color: '#B0B0B0',
    textAlign: 'center',
    marginBottom: 40,
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#5de383',
  },
  input: {
    flex: 1,
    height: 50,
    paddingLeft: 10,
    color: 'white',
  },
  icon: {
    marginRight: 10,
  },
  button: {
    backgroundColor: '#5de383',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loginPrompt: {
    marginTop: 20,
    color: '#B0B0B0',
    textAlign: 'center',
  },
  loginLink: {
    color: '#5de383',
    fontWeight: 'bold',
  },
});

export default ForgotPasswordScreen;
