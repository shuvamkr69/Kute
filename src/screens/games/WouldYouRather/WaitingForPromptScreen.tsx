import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import api from "../../../utils/api";

type Props = NativeStackScreenProps<any, "WYRWaitingForPromptScreen">;

const POLL_INTERVAL = 3000;

const WaitingForPromptScreen = ({ navigation, route }: Props) => {
  const { gameId, currentUserId } = route.params;
  const [polling, setPolling] = useState(true);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/api/v1/users/wyr/poll/${gameId}`);
        const game = res.data;
        const round = game.rounds[game.currentRound - 1];

        if (round.prompt) {
          clearInterval(interval);
          setPolling(false);
          navigation.navigate("AnswerPromptScreen", {
            gameId,
            currentUserId,
            prompt: round.prompt,
          });
        }
      } catch (err) {
        console.log("Polling error:", err.message);
      }
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Waiting for opponent to write a prompt...</Text>
      <ActivityIndicator color="#de822c" size="large" style={{ marginTop: 20 }} />
    </View>
  );
};

export default WaitingForPromptScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  text: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
  },
});
