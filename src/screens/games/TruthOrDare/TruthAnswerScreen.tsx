// screens/TruthAnswerScreen.tsx

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSocket } from "../../../hooks/useSocket";

type RootStackParamList = {
  TruthAnswerScreen: { matchId: string; currentUserId: string };
  TruthReviewScreen: { matchId: string; currentUserId: string; answer: string };
};

type Props = NativeStackScreenProps<RootStackParamList, "TruthAnswerScreen">;

const TruthAnswerScreen: React.FC<Props> = ({ route, navigation }) => {
  const { matchId, currentUserId } = route.params;
  const socket = useSocket();

  const [question, setQuestion] = useState<string | null>(null);
  const [typing, setTyping] = useState(false);
  const [answer, setAnswer] = useState("");

  useEffect(() => {
    if (!socket) return;

    socket.emit("join_match", { matchId, userId: currentUserId });

    socket.on("truth_typing", () => {
      setTyping(true);
      setTimeout(() => setTyping(false), 1500); // auto-hide after brief period
    });

    socket.on("receive_truth_question", ({ question }) => {
      setQuestion(question);
    });

    return () => {
      socket.off("truth_typing");
      socket.off("receive_truth_question");
    };
  }, [socket]);

  const handleSubmit = () => {
    if (!answer.trim()) return;

    socket?.emit("submit_truth_answer", {
      matchId,
      fromUserId: currentUserId,
      answer,
    });

    navigation.navigate("TruthReviewScreen", {
      matchId,
      currentUserId,
      answer,
    });
  };

  return (
    <View style={styles.container}>
      {!question ? (
        <>
          <Text style={styles.status}>Waiting for question...</Text>
          {typing && <Text style={styles.typing}>Opponent is typing...</Text>}
        </>
      ) : (
        <>
          <Text style={styles.questionLabel}>Question:</Text>
          <Text style={styles.questionText}>{question}</Text>

          <TextInput
            value={answer}
            onChangeText={setAnswer}
            placeholder="Type your answer..."
            placeholderTextColor="#777"
            style={styles.input}
            multiline
          />

          <TouchableOpacity onPress={handleSubmit} style={styles.button}>
            <Text style={styles.buttonText}>Submit Answer</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

export default TruthAnswerScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212", padding: 20, justifyContent: "center" },
  questionLabel: { color: "#aaa", fontSize: 16, marginBottom: 6 },
  questionText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  status: { color: "#aaa", fontSize: 18, textAlign: "center", marginBottom: 10 },
  typing: { color: "#FF6F61", fontSize: 16, textAlign: "center", marginBottom: 10 },
  input: {
    backgroundColor: "#1e1e1e",
    color: "#fff",
    padding: 16,
    borderRadius: 10,
    borderColor: "#333",
    borderWidth: 1,
    fontSize: 16,
    minHeight: 100,
    marginBottom: 20,
    textAlignVertical: "top",
  },
  button: {
    backgroundColor: "#FF6F61",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 18 },
});
