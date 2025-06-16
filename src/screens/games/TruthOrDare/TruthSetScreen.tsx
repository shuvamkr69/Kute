import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import api from "../../../utils/api";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../TruthOrDare/MultiPlayerGame"; // adjust path if needed

type Props = NativeStackScreenProps<RootStackParamList, "TruthSetScreen">;

const TruthSetScreen: React.FC<Props> = ({ navigation, route }) => {
  const { matchId, currentUserId } = route.params;
  const [question, setQuestion] = useState("");

  const handleSubmit = async () => {
    if (!question.trim()) return;

    try {
      await api.post("/api/v1/users/sendQuestion", {
        matchId,
        question,
      });

      // ✅ Navigate to WaitingForAnswerScreen
      navigation.navigate("WaitingForAnswerScreen", {
        matchId,
        currentUserId,
      });
    } catch (err) {
      console.error("Error sending truth question:", err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Opponent chose Truth</Text>
      <Text style={styles.subtext}>Type a question for them to answer:</Text>

      <TextInput
        style={styles.input}
        value={question}
        onChangeText={setQuestion}
        placeholder="Ask something juicy..."
        placeholderTextColor="#888"
        multiline
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Send Question</Text>
      </TouchableOpacity>
    </View>
  );
};

export default TruthSetScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    padding: 24,
    justifyContent: "center",
  },
  header: {
    fontSize: 24,
    color: "#fff",
    marginBottom: 16,
    textAlign: "center",
  },
  subtext: {
    fontSize: 16,
    color: "#bbb",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#1e1e1e",
    color: "#fff",
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#444",
    minHeight: 100,
    textAlignVertical: "top",
  },
  button: {
    marginTop: 24,
    backgroundColor: "#FF6F61",
    padding: 16,
    borderRadius: 12,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
    fontWeight: "bold",
  },
});
