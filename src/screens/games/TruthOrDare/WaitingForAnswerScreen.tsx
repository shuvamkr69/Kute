import React, { useEffect } from "react";
import { View, Text, StyleSheet, Alert, BackHandler } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import api from "../../../utils/api";
import { useFocusEffect } from "@react-navigation/native";

type Props = NativeStackScreenProps<any, "WaitingForAnswerScreen">;

const WaitingForAnswerScreen: React.FC<Props> = ({ navigation, route }) => {
  const { currentUserId, matchId } = route?.params || {};

  // --- 2-PLAYER ONLY LOGIC ---
  // Only the opponent waits for the chooser's answer
  // Remove any code for >2 players
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/api/v1/users/status/${matchId}`);
        const players = res.data;

        const me = players.find((p: any) => p.userId === currentUserId);
        const other = players.find((p: any) => p.userId !== currentUserId);

        if (other?.receivedAnswer) {
          clearInterval(interval);

          navigation.navigate("TruthReviewScreen", {
            matchId,
            currentUserId,
            answer: other.receivedAnswer,
          });
        }
      } catch (err) {
        console.error("Polling in WaitingForAnswerScreen failed:", err.message);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);
  return (
    <LinearGradient colors={["#1a1a1a", "#121212"]} style={styles.container}>
      <View style={styles.centered}>
        <Text style={styles.text}>Opponent is answering...</Text>
      </View>
    </LinearGradient>
  );
};

export default WaitingForAnswerScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "500",
    textAlign: "center",
  },
}); 