// screens/TruthReviewScreen.tsx

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import api from "../../../utils/api";

type RootStackParamList = {
  TruthReviewScreen: { matchId: string; answer: string };
  MultiPlayerGame: { currentUserId: string };
};

type Props = NativeStackScreenProps<RootStackParamList, "TruthReviewScreen">;

const TruthReviewScreen: React.FC<Props> = ({ route, navigation }) => {
  const { matchId, answer } = route.params;
  const [submitting, setSubmitting] = useState(false);

  const rateAnswer = async (isThumbsUp: boolean) => {
    try {
      setSubmitting(true);

      await api.post("/api/v1/truth-dare/rate-answer", {
        matchId,
        isThumbsUp,
      });

      navigation.navigate("MultiPlayerGame", {
        currentUserId: "", // 👈 Replace with actual user ID if needed
      });
    } catch (err) {
      console.error("❌ Failed to rate answer:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your opponent's answer:</Text>
      <Text style={styles.answer}>{answer}</Text>

      {submitting ? (
        <ActivityIndicator size="large" color="#FF6F61" />
      ) : (
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.up]}
            onPress={() => rateAnswer(true)}
          >
            <Text style={styles.buttonText}>👍 Thumbs Up</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.down]}
            onPress={() => rateAnswer(false)}
          >
            <Text style={styles.buttonText}>👎 Thumbs Down</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default TruthReviewScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    color: "#fff",
    marginBottom: 12,
    textAlign: "center",
  },
  answer: {
    fontSize: 18,
    color: "#eee",
    marginBottom: 30,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#1e1e1e",
    borderColor: "#444",
    borderWidth: 1,
    textAlign: "center",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  up: {
    backgroundColor: "#28a745",
  },
  down: {
    backgroundColor: "#dc3545",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
});
