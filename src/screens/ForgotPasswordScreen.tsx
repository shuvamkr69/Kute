//this screen is only made for testing purposes for now, nodemailer is not working as intended rn


import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import api from "../utils/api";

type Props = NativeStackScreenProps<any, "ForgotPassword">;

const rawToken =
  "e967194322181eba115927992d2d2cac56cbe24bf2f7d55c5ff0ead84a2ef2e4";

const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
const [otpStage, setOtpStage] = useState(false); // false = send, true = verify


// ① send / resend
const handleSendOtp = async () => {
  if (!email) return Alert.alert("Error", "Please enter your email");
  try {
    await api.post("/api/v1/users/forgot-password-otp", { email });
    Alert.alert("Success", "OTP sent to your email");
    setOtpStage(true);                 // show OTP field
  } catch (err: any) {
    Alert.alert("Error", err?.response?.data?.message || "Server error");
  }
};

// ② verify
const handleVerifyOtp = async () => {
  if (otp.length !== 6) return Alert.alert("Error", "Enter 6‑digit OTP");
  try {
    // verify & change screen
    navigation.navigate("ResetPassword", { email, otp });
  } catch (err) {
    Alert.alert("Error", "Invalid OTP");
  }
};



  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email");
      return;
    }

    try {
      const response = await api.post("/api/v1/users/forgot-password", {
        email: email,
      });

      Alert.alert("Success", "Password reset link sent to your email");

      const devToken = response.data?.data?.token;
      if (devToken) {
        navigation.navigate("ResetPassword", { token: devToken });
      }
    } catch (error: any) {
      console.log(error);
      const message =
        error?.response?.data?.message || "There is a problem with the server";
      Alert.alert("Error", message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.logo}>Forgot Password</Text>
      <Text style={styles.tagline}>
        Enter your email to reset your password
      </Text>

      {/* Email Input */}
      <View style={styles.inputContainer}>
        <Icon name="envelope" size={20} color="#de822c" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#B0B0B0"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
      </View>

      {otpStage && (
  <View style={styles.inputContainer}>
    <Icon name="key" size={20} color="#de822c" style={styles.icon} />
    <TextInput
      style={styles.input}
      placeholder="6‑digit OTP"
      placeholderTextColor="#B0B0B0"
      keyboardType="number-pad"
      value={otp}
      onChangeText={setOtp}
      maxLength={6}
    />
  </View>
)}


      {/* Reset Password Button */}
      {!otpStage ? (
  <TouchableOpacity style={styles.button} onPress={handleSendOtp}>
    <Text style={styles.buttonText}>Send OTP</Text>
  </TouchableOpacity>
) : (
  <>
    <TouchableOpacity style={styles.button} onPress={handleVerifyOtp}>
      <Text style={styles.buttonText}>Verify OTP</Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={handleSendOtp} style={{ marginTop: 10 }}>
      <Text style={{ color: "#de822c", textAlign: "center" }}>Resend OTP</Text>
    </TouchableOpacity>
  </>
)}


      {/* Back to Login */}
      <Text style={styles.loginPrompt}>
        Remembered your password?{" "}
        <Text
          style={styles.loginLink}
          onPress={() => navigation.navigate("Login")}
        >
          Login
        </Text>
      </Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  logo: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#de822c",
    textAlign: "center",
    marginBottom: 10,
  },
  tagline: {
    color: "#B0B0B0",
    textAlign: "center",
    marginBottom: 40,
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E1E1E",
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#de822c",
  },
  input: {
    flex: 1,
    height: 50,
    paddingLeft: 10,
    color: "white",
  },
  icon: {
    marginRight: 10,
  },
  button: {
    backgroundColor: "#de822c",
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  loginPrompt: {
    marginTop: 20,
    color: "#B0B0B0",
    textAlign: "center",
  },
  loginLink: {
    color: "#de822c",
    fontWeight: "bold",
  },
});

export default ForgotPasswordScreen;
