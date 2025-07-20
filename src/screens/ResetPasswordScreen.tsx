//this screen is only made for testing purposes for now, nodemailer is not working as intended rn

import React, { useState } from "react";
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import CustomAlert from "../components/CustomAlert";
import api from "../utils/api";

export default function ResetPasswordScreen({ route, navigation }) {
  const { token } = route.params; // token passed from deep‑link or manual nav
  const [password, setPassword] = useState("");
  const [customAlert, setCustomAlert] = useState({ visible: false, title: '', message: '' });

  const submit = async () => {
    if (password.length < 6) {
      setCustomAlert({ visible: true, title: "Error", message: "Min 6 characters" });
      return;
    }
    const { email, otp } = route.params;

    try {
      await api.post("/api/v1/users/reset-password-otp", {
        email,
        otp,
        password,
      });
      setCustomAlert({ visible: true, title: "Success", message: "Password updated – log in." });
      navigation.navigate("Login");
    } catch (err) {
      console.log(err);
      setCustomAlert({ visible: true, title: "Error", message: "Token expired or server error" });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Enter new password</Text>
      <TextInput
        secureTextEntry
        placeholder="New password"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />
      <TouchableOpacity onPress={submit} style={styles.button}>
        <Text style={styles.buttonText}>Reset</Text>
      </TouchableOpacity>
      <CustomAlert
        visible={customAlert.visible}
        title={customAlert.title}
        message={customAlert.message}
        onClose={() => setCustomAlert((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "black",
  },
  header: {
    color: "#de822c",
    fontSize: 24,
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#1E1E1E",
    color: "white",
    borderRadius: 10,
    padding: 15,
  },
  button: {
    backgroundColor: "#de822c",
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  buttonText: { color: "white", textAlign: "center", fontWeight: "bold" },
});
