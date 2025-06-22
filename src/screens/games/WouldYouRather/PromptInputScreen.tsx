import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import api from "../../../utils/api";

type Props = NativeStackScreenProps<any, "PromptInputScreen">;

const PromptInputScreen: React.FC<Props> = ({ navigation, route }) => {
  const { gameId, currentUserId } = route.params;
  const [prompt, setPrompt] = useState("");

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      Alert.alert("Prompt cannot be empty");
      return;
    }

    try {
      await api.post(`/api/v1/users/wyr/submit-prompt/${gameId}`, {
        prompt,
      });

      navigation.replace("WaitingForAnswerScreen", {
        gameId,
        currentUserId,
      });
    } catch (err) {
      console.error("Failed to submit prompt:", err);
      Alert.alert("Error", "Could not submit prompt");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: "padding", android: undefined })}
    >
      <Text style={styles.title}>Type your "Would You Rather" question</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Would you rather have super strength or super speed?"
        placeholderTextColor="#aaa"
        multiline
        numberOfLines={4}
        maxLength={150}
        value={prompt}
        onChangeText={setPrompt}
      />
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Submit Prompt</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
};

export default PromptInputScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#1a1a1a",
    color: "#fff",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderColor: "#de822c",
    borderWidth: 1,
    marginBottom: 30,
  },
  button: {
    backgroundColor: "#de822c",
    paddingVertical: 15,
    borderRadius: 10,
  },
  buttonText: {
    textAlign: "center",
    color: "#000",
    fontSize: 18,
    fontWeight: "bold",
  },
});
