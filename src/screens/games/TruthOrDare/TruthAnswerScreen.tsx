// screens/TruthAnswerScreen.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import api from "../../../utils/api";

type RootStackParamList = {
  TruthAnswerScreen: {
    matchId: string;
    currentUserId: string;
    question: string;
  };
  TruthReviewScreen: { matchId: string; answer: string };
};

type Props = NativeStackScreenProps<RootStackParamList, "TruthAnswerScreen">;

const TruthAnswerScreen: React.FC<Props> = ({ route, navigation }) => {
  const { matchId, currentUserId, question } = route.params;
  const [answer, setAnswer] = useState("");

  const handleSubmit = async () => {
    if (answer.trim() === "") return;

    try {
      await api.post("/api/v1/users/submitAnswer", {
        matchId,
        answer,
      });

      navigation.navigate("TruthReviewScreen", { matchId, answer });
    } catch (error) {
      console.error("❌ Failed to submit answer:", error);
      Alert.alert("Error", "Could not submit your answer. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.questionText}>{question}</Text>

      <TextInput
        style={styles.input}
        value={answer}
        onChangeText={setAnswer}
        placeholder="Your answer..."
        placeholderTextColor="#888"
        multiline
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Submit Answer</Text>
      </TouchableOpacity>
    </View>
  );
};

export default TruthAnswerScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    padding: 20,
    justifyContent: "center",
  },
  questionText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#1e1e1e",
    color: "#fff",
    borderColor: "#444",
    borderWidth: 1,
    padding: 14,
    borderRadius: 10,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#28a745",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
  },
});
