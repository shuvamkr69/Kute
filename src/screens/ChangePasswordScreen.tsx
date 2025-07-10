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

type Props = NativeStackScreenProps<any, "ChangePassword">;

const ChangePasswordScreen: React.FC<Props> = ({ navigation }) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      return Alert.alert("Error", "All fields are required");
    }

    if (newPassword.length < 6) {
      return Alert.alert("Error", "Password must be at least 6 characters");
    }

    if (newPassword !== confirmPassword) {
      return Alert.alert("Error", "New passwords do not match");
    }

    try {
      await api.post("/api/v1/users/change-password", {
        currentPassword,
        newPassword,
      });

      Alert.alert("Success", "Password changed successfully");
      navigation.goBack();
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Something went wrong";
      Alert.alert("Error", message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.logo}>Change Password</Text>
      <Text style={styles.tagline}>Update your password securely</Text>

      {/* Current Password */}
      <View style={styles.inputContainer}>
        <Icon name="lock" size={20} color="#de822c" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Current Password"
          placeholderTextColor="#B0B0B0"
          secureTextEntry
          value={currentPassword}
          onChangeText={setCurrentPassword}
        />
      </View>

      {/* New Password */}
      <View style={styles.inputContainer}>
        <Icon name="key" size={20} color="#de822c" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="New Password"
          placeholderTextColor="#B0B0B0"
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
        />
      </View>

      {/* Confirm New Password */}
      <View style={styles.inputContainer}>
        <Icon name="key" size={20} color="#de822c" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Confirm New Password"
          placeholderTextColor="#B0B0B0"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
      </View>

      {/* Submit */}
      <TouchableOpacity style={styles.button} onPress={handleChangePassword}>
        <Text style={styles.buttonText}>Update Password</Text>
      </TouchableOpacity>
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
});


export default ChangePasswordScreen;
