// screens/TruthSetScreen.tsx

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
  TruthSetScreen: { matchId: string; currentUserId: string };
  TruthAnswerScreen: { matchId: string; currentUserId: string };
};

type Props = NativeStackScreenProps<RootStackParamList, "TruthSetScreen">;

const TruthSetScreen: React.FC<Props> = ({ route, navigation }) => {
  const { matchId, currentUserId } = route.params;
  const socket = useSocket();
  const [question, setQuestion] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (socket) {
      socket.emit("join_match", { matchId, userId: currentUserId });
    }
  }, [socket]);

  const handleSubmit = () => {
    if (question.trim() === "") return;

    // Send question to P1
    socket?.emit("send_truth_question", {
      matchId,
      question,
      fromUserId: currentUserId,
    });

    // Optionally wait here, or navigate to TruthReviewScreen after answer is submitted
    navigation.goBack(); // return to waiting or main game screen
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Your opponent chose Truth</Text>
      <Text style={styles.subtext}>Type a truth question for them:</Text>

      <TextInput
        style={styles.input}
        value={question}
        onChangeText={setQuestion}
        placeholder="Ask something juicy..."
        placeholderTextColor="#999"
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
    padding: 20,
    justifyContent: "center",
  },
  header: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  subtext: {
    color: "#ccc",
    fontSize: 16,
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
    backgroundColor: "#FF6F61",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 18 },
});
