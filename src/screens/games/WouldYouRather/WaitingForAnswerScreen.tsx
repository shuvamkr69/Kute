import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import api from "../../../utils/api";

type Props = NativeStackScreenProps<any, "WYRWaitingForAnswerScreen">;

const POLL_INTERVAL = 3000;

const WaitingForAnswerScreen: React.FC<Props> = ({ navigation, route }) => {
  const { gameId, currentUserId } = route.params;
  const [message, setMessage] = useState("Waiting for your opponent to answer...");

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/api/v1/users/wyr/poll/${gameId}`);
        const game = res.data;

        const currentRound = game.rounds?.[game.currentRound - 1];
        if (currentRound?.answer) {
          clearInterval(interval);
          navigation.replace("FeedbackScreen", {
            gameId,
            currentUserId,
          });
        }
      } catch (err) {
        console.error("Polling failed:", err);
      }
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      <ActivityIndicator size="large" color="#de822c" style={{ marginTop: 20 }} />
    </View>
  );
};

export default WaitingForAnswerScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  message: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
  },
});
