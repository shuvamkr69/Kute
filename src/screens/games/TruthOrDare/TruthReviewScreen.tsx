import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSocket } from "../../../hooks/useSocket";
import api from "../../../utils/api";

type RootStackParamList = {
  TruthReviewScreen: {
    matchId: string;
    currentUserId: string;
  };
};

type Props = NativeStackScreenProps<RootStackParamList, "TruthReviewScreen">;

const TruthReviewScreen: React.FC<Props> = ({ route, navigation }) => {
  const { matchId, currentUserId } = route.params;
  const socket = useSocket();

  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedbackGiven, setFeedbackGiven] = useState(false);

  useEffect(() => {
    if (!socket) return;

    socket.emit("join_match", { matchId, userId: currentUserId });

    socket.on("receive_truth_answer", ({ answer }) => {
      setAnswer(answer);
      setLoading(false);
    });

    return () => {
      socket.off("receive_truth_answer");
    };
  }, [socket]);

  const handleFeedback = async (liked: boolean) => {
    try {
      await api.post("/api/v1/truthDare/feedback", {
        matchId,
        fromUserId: currentUserId,
        liked,
      });
      setFeedbackGiven(true);
    } catch (error) {
      console.error("Feedback error:", error);
    }
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <>
          <Text style={styles.text}>Opponent is answering...</Text>
          <ActivityIndicator size="large" color="#FF6F61" />
        </>
      ) : (
        <>
          <Text style={styles.title}>Opponent's Answer:</Text>
          <Text style={styles.answer}>{answer}</Text>

          {!feedbackGiven ? (
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.feedbackButton, { backgroundColor: "#28a745" }]}
                onPress={() => handleFeedback(true)}
              >
                <Text style={styles.feedbackText}>👍 Thumbs Up</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.feedbackButton, { backgroundColor: "#dc3545" }]}
                onPress={() => handleFeedback(false)}
              >
                <Text style={styles.feedbackText}>👎 Thumbs Down</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.thanks}>Thanks for your feedback!</Text>
          )}
        </>
      )}
    </View>
  );
};

export default TruthReviewScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  text: {
    color: "#ccc",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 10,
  },
  answer: {
    fontSize: 18,
    color: "#f0f0f0",
    marginBottom: 30,
    textAlign: "center",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
  },
  feedbackButton: {
    padding: 14,
    borderRadius: 10,
    marginHorizontal: 10,
  },
  feedbackText: {
    color: "#fff",
    fontSize: 16,
  },
  thanks: {
    color: "#66ff99",
    fontSize: 16,
    marginTop: 20,
  },
});
