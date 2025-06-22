import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import api from "../../../utils/api";

type Props = NativeStackScreenProps<any, "FeedbackScreen">;

const FeedbackScreen: React.FC<Props> = ({ navigation, route }) => {
  const { gameId, currentUserId } = route.params;
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRound = async () => {
      try {
        const res = await api.get(`/api/v1/users/wyr/poll/${gameId}`);
        const game = res.data;
        const round = game.rounds?.[game.currentRound - 1];

        if (!round?.prompt || !round?.answer) {
          Alert.alert("Error", "Prompt or answer missing.");
          navigation.goBack();
          return;
        }

        setPrompt(round.prompt);
        setAnswer(round.answer);
      } catch (err) {
        console.error("Failed to load round:", err);
        Alert.alert("Error", "Failed to load round.");
      } finally {
        setLoading(false);
      }
    };

    fetchRound();
  }, []);

  const submitFeedback = async (feedback: "like" | "dislike") => {
    try {
      await api.post(`/api/v1/users/wyr/submit-feedback/${gameId}`, {
        feedback,
      });
      navigation.replace("RoundReviewScreen", { gameId, currentUserId });
    } catch (err) {
      console.error("Failed to submit feedback:", err);
      Alert.alert("Error", "Could not submit feedback.");
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#de822c" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Your Question:</Text>
      <Text style={styles.content}>{prompt}</Text>

      <Text style={[styles.label, { marginTop: 30 }]}>Their Answer:</Text>
      <Text style={styles.content}>{answer}</Text>

      <Text style={styles.label}>Did you like the answer?</Text>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: "#42f56c" }]}
        onPress={() => submitFeedback("like")}
      >
        <Text style={styles.buttonText}>👍 Like</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: "#f55442" }]}
        onPress={() => submitFeedback("dislike")}
      >
        <Text style={styles.buttonText}>👎 Dislike</Text>
      </TouchableOpacity>
    </View>
  );
};

export default FeedbackScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  label: {
    fontSize: 18,
    color: "#de822c",
    fontWeight: "600",
    marginBottom: 10,
  },
  content: {
    fontSize: 20,
    color: "#fff",
    textAlign: "center",
    marginBottom: 20,
  },
  button: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  buttonText: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
});
