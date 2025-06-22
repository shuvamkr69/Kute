import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import api from "../../../utils/api";

type Props = NativeStackScreenProps<any, "RoundReviewScreen">;

const RoundReviewScreen: React.FC<Props> = ({ navigation, route }) => {
  const { gameId, currentUserId } = route.params;
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<"like" | "dislike" | null>(null);
  const [loading, setLoading] = useState(true);
  const [isYourTurn, setIsYourTurn] = useState(false);
  const [gameStatus, setGameStatus] = useState<"in_progress" | "finished">("in_progress");

  useEffect(() => {
    const loadRound = async () => {
      try {
        const res = await api.get(`/api/v1/users/wyr/poll/${gameId}`);
        const game = res.data;
        const round = game.rounds?.[game.currentRound - 1];

        if (!round) return;

        setPrompt(round.prompt);
        setAnswer(round.answer);
        setFeedback(round.feedback);
        setIsYourTurn(round.turnHolder === currentUserId);
        setGameStatus(game.status);

        // Navigate after short delay
        setTimeout(() => {
          if (game.status === "finished") {
            navigation.replace("GameOverScreen", {
              gameId,
              currentUserId,
            });
          } else if (round.turnHolder === currentUserId) {
            navigation.replace("PromptInputScreen", {
              gameId,
              currentUserId,
            });
          } else {
            navigation.replace("WaitingForPromptScreen", {
              gameId,
              currentUserId,
            });
          }
        }, 3000);
      } catch (err) {
        console.error("Error fetching round:", err);
      } finally {
        setLoading(false);
      }
    };

    loadRound();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#de822c" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Round Summary</Text>

      <Text style={styles.label}>Prompt:</Text>
      <Text style={styles.content}>{prompt}</Text>

      <Text style={styles.label}>Answer:</Text>
      <Text style={styles.content}>{answer}</Text>

      <Text style={styles.label}>Feedback:</Text>
      <Text style={styles.feedback}>
        {feedback === "like" ? "👍 Liked" : "👎 Disliked"}
      </Text>
    </View>
  );
};

export default RoundReviewScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    fontSize: 26,
    color: "#de822c",
    fontWeight: "bold",
    marginBottom: 24,
  },
  label: {
    fontSize: 18,
    color: "#888",
    fontWeight: "600",
    marginTop: 12,
  },
  content: {
    fontSize: 20,
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  feedback: {
    fontSize: 24,
    marginTop: 10,
    color: "#fff",
  },
});
